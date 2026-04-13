import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
 
export class OcrExtractedDataDto {
  @IsOptional() @IsString() id_number?: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() date_of_birth?: string;
  @IsOptional() @IsString() place_of_birth?: string;   // ← nouveau
}
 
export class OcrStructuredDataDto extends OcrExtractedDataDto {
  @IsOptional() @IsArray()  all_lines?: string[];
  @IsOptional() @IsNumber() @Min(0) @Max(1) confidence?: number;  // ← nouveau
  @IsOptional() @IsArray()  warnings?: string[];                   // ← nouveau
}
 
export class OcrResultDto {
  @IsOptional() @IsString() raw_text?: string;
  @IsOptional() extracted_data?: OcrExtractedDataDto;
  @IsOptional() structured_data?: OcrStructuredDataDto;
  @IsOptional() @IsString() image?: string;
}