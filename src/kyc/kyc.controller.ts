import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreateKycSessionDto } from './dto/create-kyc-session.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FaceExtractionService } from './face-extraction.service';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly faceExtractionService: FaceExtractionService,
  ) {}

  @Post('sessions')
  createSession(@Body() dto: CreateKycSessionDto) {
    return this.kycService.createSession(dto);
  }

  @Get('sessions/:sessionId')
  getSession(@Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.kycService.getSession(sessionId);
  }

  @Post('sessions/:sessionId/document')
  @UseInterceptors(FileInterceptor('document'))
  uploadDocument(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.kycService.uploadDocument(sessionId, file, dto);
  }

  @Post('sessions/:sessionId/document/:documentId/extract-face')
  @UseInterceptors(FileInterceptor('document'))
  async extractFace(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      return this.kycService.extractFaceFromStoredDocument(documentId);
    }
    return this.kycService.extractFaceFromDocument(sessionId, file);
  }
}
