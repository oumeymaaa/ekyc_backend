export interface OcrExtractedData {
  id_number?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  place_of_birth?: string;
}

export interface OcrStructuredData extends OcrExtractedData {
  all_lines?: string[];
  confidence?: number;
  confidence_score?: number;
  warnings?: string[];
}

export interface OcrResult {
  raw_text?: string;
  text?: string;
  extracted_data?: OcrExtractedData;
  structured_data?: OcrStructuredData;
  image?: string;
  processed_image_base64?: string;
  processed_image_format?: string;
}
 