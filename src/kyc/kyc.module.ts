import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KycDocument } from '../database/entities/kyc-document.entity';
import { KycSession } from '../database/entities/kyc-session.entity';
import { OcrModule } from '../ocr/ocr.module';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([KycSession, KycDocument]), OcrModule],
  controllers: [KycController],
  providers: [KycService],
})
export class KycModule {}
