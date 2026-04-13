import { OcrResult, OcrStructuredData } from './interfaces/ocr-result.interface';

function cleanField(value?: string): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\s\u0600-\u06FF]/gu, '').trim();
}

function normalizeDate(value?: string): string {
  if (!value) return '';
  const numericMatch = value.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (numericMatch) {
    const [, d, m, y] = numericMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return cleanField(value);
}

export function normalizeOcrResult(data: OcrResult): OcrResult {
  const extracted = data?.extracted_data ?? {};
  const structured: OcrStructuredData = {
    ...data?.structured_data,
    confidence: data?.structured_data?.confidence ?? data?.structured_data?.confidence_score ?? 0,
    warnings: data?.structured_data?.warnings ?? [],
  };

  return {
    ...data,
    extracted_data: {
      id_number: cleanField(extracted.id_number),
      first_name: cleanField(extracted.first_name),
      last_name: cleanField(extracted.last_name),
      date_of_birth: normalizeDate(extracted.date_of_birth),
      place_of_birth: cleanField(extracted.place_of_birth),
    },
    structured_data: structured,
  };
}
 