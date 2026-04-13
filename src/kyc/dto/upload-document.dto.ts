import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentSide?: string;

  @IsOptional()
  @IsString()
  qualityScore?: string;

  @IsOptional()
  @IsString()
  qualityValid?: string;

  @IsOptional()
  @IsString()
  width?: string;

  @IsOptional()
  @IsString()
  height?: string;
}
