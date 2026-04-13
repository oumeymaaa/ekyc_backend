import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DocumentOcrStatus } from '../../common/enums/document-ocr-status.enum';
import { DocumentProcessingStatus } from '../../common/enums/document-processing-status.enum';
import { DocumentVerificationStatus } from '../../common/enums/document-verification-status.enum';
import { KycSession } from './kyc-session.entity';

@Entity({ name: 'kyc_documents' })
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => KycSession, (session) => session.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: KycSession;

  @Column({
    name: 'document_side',
    type: 'varchar',
    length: 20,
    default: 'front',
  })
  documentSide!: string;

  @Column({ name: 'original_file_name', type: 'varchar', length: 255 })
  originalFileName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'storage_path', type: 'text' })
  storagePath!: string;

  @Column({ name: 'preview_url', type: 'text', nullable: true })
  previewUrl?: string | null;

  @Column({ name: 'processed_preview_url', type: 'text', nullable: true })
  processedPreviewUrl?: string | null;

  @Column({ name: 'processed_storage_path', type: 'text', nullable: true })
  processedStoragePath?: string | null;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize?: number | null;

  @Column({ name: 'image_width', type: 'integer', nullable: true })
  imageWidth?: number | null;

  @Column({ name: 'image_height', type: 'integer', nullable: true })
  imageHeight?: number | null;

  @Column({ name: 'frontend_quality_score', type: 'integer', nullable: true })
  frontendQualityScore?: number | null;

  @Column({ name: 'frontend_quality_valid', type: 'boolean', default: false })
  frontendQualityValid!: boolean;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: DocumentProcessingStatus,
    default: DocumentProcessingStatus.PENDING,
  })
  processingStatus!: DocumentProcessingStatus;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError?: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: DocumentVerificationStatus,
    default: DocumentVerificationStatus.PENDING,
  })
  verificationStatus!: DocumentVerificationStatus;

  @Column({
    name: 'ocr_status',
    type: 'enum',
    enum: DocumentOcrStatus,
    default: DocumentOcrStatus.PENDING,
  })
  ocrStatus!: DocumentOcrStatus;

  @Column({ name: 'ocr_text', type: 'text', nullable: true })
  ocrText?: string | null;

  @Column({ name: 'ocr_payload', type: 'jsonb', nullable: true })
  ocrPayload?: object | null;

  @Column({
    name: 'extracted_first_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  extractedFirstName?: string | null;

  @Column({
    name: 'extracted_last_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  extractedLastName?: string | null;

  @Column({
    name: 'extracted_date_of_birth',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  extractedDateOfBirth?: string | null;

  @Column({
    name: 'extracted_document_number',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  extractedDocumentNumber?: string | null;

  @Column({
    name: 'extracted_place_of_birth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  extractedPlaceOfBirth?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
