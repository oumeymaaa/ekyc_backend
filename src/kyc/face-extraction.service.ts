import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { basename } from 'path';

export type FaceExtractionResult = {
  success: boolean;
  face_base64: string;
  face_bbox: [number, number, number, number];
  quality_score: number;
  detection_method: string;
};

@Injectable()
export class FaceExtractionService {
  private readonly logger = new Logger(FaceExtractionService.name);
  private readonly pythonServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.pythonServiceUrl =
      this.configService.get<string>('PYTHON_SERVICE_URL') ||
      'http://localhost:8000';
  }

  async extractFace(filePath: string, mimeType: string): Promise<FaceExtractionResult> {
    const formData = new FormData();
    formData.append('file', createReadStream(filePath), {
      contentType: mimeType,
      filename: basename(filePath),
    });

    this.logger.log(
      `Sending file ${basename(filePath)} to face extraction service`,
    );

    try {
      const response = await axios.post<FaceExtractionResult>(
        `${this.pythonServiceUrl}/extract-face`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 60000,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Face extraction failed', error);
      throw error;
    }
  }
}
