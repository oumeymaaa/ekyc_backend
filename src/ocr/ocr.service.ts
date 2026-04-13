import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { basename } from 'path';

import { OcrResult } from './interfaces/ocr-result.interface';
import { normalizeOcrResult } from './ocr.mapper';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private readonly configService: ConfigService) {}

  async scanDocument(filePath: string, mimeType: string): Promise<OcrResult> {
    const ocrServiceUrl = this.configService.get<string>('OCR_SERVICE_URL');

    if (!ocrServiceUrl) {
      throw new Error('OCR_SERVICE_URL is not configured');
    }

    const formData = new FormData();
    formData.append('file', createReadStream(filePath), {
      contentType: mimeType,
      filename: basename(filePath),
    });

    this.logger.log(`Sending file ${basename(filePath)} to OCR service`);

    try {
      const response = await axios.post<OcrResult>(
        `${ocrServiceUrl}/ocr/cin`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 300000,
        },
      );

      const normalized = normalizeOcrResult(response.data);

      return normalized;
    } catch (error) {
      this.logger.error('OCR scan failed', error);
      throw error;
    }
  }
}
