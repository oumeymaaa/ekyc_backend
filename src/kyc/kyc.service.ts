import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { DocumentOcrStatus } from '../common/enums/document-ocr-status.enum';
import { DocumentProcessingStatus } from '../common/enums/document-processing-status.enum';
import { DocumentVerificationStatus } from '../common/enums/document-verification-status.enum';
import { KycSessionStatus } from '../common/enums/kyc-session-status.enum';
import { KycDocument } from '../database/entities/kyc-document.entity';
import { KycSession } from '../database/entities/kyc-session.entity';
import { OcrService } from '../ocr/ocr.service';
import { CreateKycSessionDto } from './dto/create-kyc-session.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FaceExtractionService } from './face-extraction.service';

type UploadDocumentResult = {
  document: KycDocument;
  message: string;
  session: KycSession;
};

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycSession)
    private readonly sessionRepository: Repository<KycSession>,
    @InjectRepository(KycDocument)
    private readonly documentRepository: Repository<KycDocument>,
    private readonly ocrService: OcrService,
    private readonly faceExtractionService: FaceExtractionService,
  ) {}

  createSession(dto: CreateKycSessionDto) {
    const session = this.sessionRepository.create({
      userReference: dto.userReference ?? null,
      status: KycSessionStatus.AWAITING_DOCUMENT,
    });

    this.logger.log(`Creating KYC session for ${dto.userReference ?? 'anonymous'}`);
    return this.sessionRepository.save(session);
  }

  async getSession(sessionId: string) {
    this.logger.log(`Fetching session ${sessionId}`);
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: {
        documents: true,
      },
      order: {
        documents: {
          createdAt: 'DESC',
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`KYC session ${sessionId} not found`);
    }

    return session;
  }

  async uploadDocument(
    sessionId: string,
    file: Express.Multer.File | undefined,
    dto: UploadDocumentDto,
  ): Promise<UploadDocumentResult> {
    if (!file) {
      throw new BadRequestException('document file is required');
    }

    this.logger.log(
      `Received document upload for session ${sessionId}: ${file.originalname} (${file.size} bytes)`,
    );

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`KYC session ${sessionId} not found`);
    }

    const storagePath = await this.persistDocumentFile(session.id, file);
    const previewUrl = this.toPreviewUrl(storagePath);
    const document = this.documentRepository.create({
      documentSide: dto.documentSide ?? 'front',
      fileSize: file.size,
      frontendQualityScore: this.parseNumber(dto.qualityScore) ?? 100,
      frontendQualityValid: this.parseBoolean(dto.qualityValid) ?? true,
      imageHeight: this.parseNumber(dto.height),
      imageWidth: this.parseNumber(dto.width),
      mimeType: file.mimetype,
      originalFileName: file.originalname,
      ocrStatus: DocumentOcrStatus.PENDING,
      processingStatus: DocumentProcessingStatus.PENDING,
      previewUrl,
      session,
      storagePath,
      verificationStatus: DocumentVerificationStatus.PENDING,
    });

    if (document.frontendQualityValid === false) {
      this.logger.warn(`Document rejected by frontend quality rules for session ${sessionId}`);
      document.processingStatus = DocumentProcessingStatus.SKIPPED;
      document.verificationStatus = DocumentVerificationStatus.REQUIRES_RETAKE;
      document.ocrStatus = DocumentOcrStatus.SKIPPED;
      session.status = KycSessionStatus.DOCUMENT_REQUIRES_RETAKE;

      await this.documentRepository.save(document);
      await this.sessionRepository.save(session);

      return {
        document,
        message:
          'Document enregistre mais qualite insuffisante. Une nouvelle capture est requise.',
        session,
      };
    }

    document.verificationStatus = DocumentVerificationStatus.VALID;
    document.processingStatus = DocumentProcessingStatus.PROCESSING;
    session.status = KycSessionStatus.DOCUMENT_PROCESSING;

    await this.documentRepository.save(document);
    await this.sessionRepository.save(session);

    this.logger.log(
      `Document ${document.id} saved for session ${sessionId}. Starting background processing.`,
    );

    this.processOcrInBackground(
      document.id,
      session.id,
      storagePath,
      file.mimetype,
    ).catch((error) => {
      this.logger.error(
        `Background OCR failed for document ${document.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return {
      document,
      message:
        'Document enregistre et marque valide. Traitement et OCR en cours en arriere-plan.',
      session,
    };
  }

  private async persistDocumentFile(
    sessionId: string,
    file: Express.Multer.File,
  ) {
    const uploadDirectory = join(process.cwd(), 'uploads', 'kyc', sessionId);
    const extension = extname(file.originalname || '') || '.jpg';
    const fileName = `${randomUUID()}${extension}`;
    const targetPath = join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(targetPath, file.buffer);

    return targetPath;
  }

  private parseBoolean(value?: string) {
    if (value === undefined || value === null) return null;
    return value === 'true' || value === '1';
  }

  private parseNumber(value?: string) {
    if (value === undefined || value === null) return null;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toPreviewUrl(storagePath: string) {
    const uploadsRoot = join(process.cwd(), 'uploads');
    const relativePath = storagePath
      .replace(`${uploadsRoot}\\`, '')
      .replace(/\\/g, '/');
    return `/uploads/${relativePath}`;
  }

  private async processOcrInBackground(
    documentId: string,
    sessionId: string,
    storagePath: string,
    mimeType: string,
  ) {
    try {
      this.logger.log(`Starting OCR pipeline for document ${documentId}`);
      const ocrResult = await this.ocrService.scanDocument(
        storagePath,
        mimeType,
      );
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
        relations: { session: true },
      });

      if (!document) {
        this.logger.warn(
          `Document ${documentId} not found after OCR completion`,
        );
        return;
      }

      const processedImageStorage = await this.persistProcessedImage(
        sessionId,
        ocrResult.processed_image_base64,
        ocrResult.processed_image_format,
      );

      document.ocrStatus = DocumentOcrStatus.COMPLETED;
      document.processingStatus = DocumentProcessingStatus.COMPLETED;
      document.processingError = null;
      document.ocrPayload = ocrResult as object;
      document.ocrText = ocrResult.text ?? null;
      document.processedStoragePath = processedImageStorage;
      document.processedPreviewUrl = processedImageStorage
        ? this.toPreviewUrl(processedImageStorage)
        : null;
      document.extractedFirstName =
        ocrResult.extracted_data?.first_name ?? null;
      document.extractedLastName = ocrResult.extracted_data?.last_name ?? null;
      document.extractedDateOfBirth =
        ocrResult.extracted_data?.date_of_birth ?? null;
      document.extractedDocumentNumber =
        ocrResult.extracted_data?.id_number ?? null;
      document.extractedPlaceOfBirth =
        ocrResult.extracted_data?.place_of_birth ?? null;

      await this.documentRepository.save(document);

      await this.sessionRepository.update(sessionId, {
        status: KycSessionStatus.DOCUMENT_OCR_COMPLETED,
      });

      this.logger.log(`OCR pipeline completed for document ${documentId}`);
    } catch (error) {
      this.logger.error(
        `OCR pipeline failed for document ${documentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.documentRepository.update(documentId, {
        processingError:
          error instanceof Error
            ? error.message
            : 'Unexpected OCR service error',
        processingStatus: DocumentProcessingStatus.FAILED,
        ocrPayload: {
          error:
            error instanceof Error
              ? error.message
              : 'Unexpected OCR service error',
        },
        ocrStatus: DocumentOcrStatus.FAILED,
      });

      await this.sessionRepository.update(sessionId, {
        status: KycSessionStatus.DOCUMENT_PROCESSING_FAILED,
      });
    }
  }

  private async persistProcessedImage(
    sessionId: string,
    processedImageBase64?: string,
    processedImageFormat?: string,
  ) {
    if (!processedImageBase64) {
      return null;
    }

    const uploadDirectory = join(
      process.cwd(),
      'uploads',
      'kyc',
      sessionId,
      'processed',
    );
    const extension =
      processedImageFormat?.toLowerCase() === 'png' ? '.png' : '.jpg';
    const fileName = `${randomUUID()}${extension}`;
    const targetPath = join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(targetPath, Buffer.from(processedImageBase64, 'base64'));

    return targetPath;
  }

  async extractFaceFromDocument(
    sessionId: string,
    file: Express.Multer.File,
  ) {
    this.logger.log(
      `Extracting face from document upload for session ${sessionId}`,
    );

    const storagePath = await this.persistDocumentFile(sessionId, file);

    return this.performFaceExtraction(storagePath, file.mimetype);
  }

  async extractFaceFromStoredDocument(documentId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    this.logger.log(`Extracting face from stored document ${documentId}`);

    return this.performFaceExtraction(document.storagePath, document.mimeType);
  }

  private async performFaceExtraction(storagePath: string, mimeType: string) {
    try {
      const result = await this.faceExtractionService.extractFace(
        storagePath,
        mimeType,
      );

      if (result.success && result.face_base64) {
        const faceImagePath = await this.persistFaceImage(
          result.face_base64,
        );

        return {
          success: true,
          face_image_url: faceImagePath ? this.toPreviewUrl(faceImagePath) : null,
          face_bbox: result.face_bbox,
          quality_score: result.quality_score,
          detection_method: result.detection_method,
        };
      }

      return {
        success: false,
        error: 'Face extraction returned no result',
      };
    } catch (error) {
      this.logger.error('Face extraction failed', error);
      throw new BadRequestException('Face extraction failed');
    }
  }

  private async persistFaceImage(faceBase64: string) {
    if (!faceBase64) {
      return null;
    }

    const uploadDirectory = join(process.cwd(), 'uploads', 'faces');
    const fileName = `${randomUUID()}.jpg`;
    const targetPath = join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(targetPath, Buffer.from(faceBase64, 'base64'));

    return targetPath;
  }
}
