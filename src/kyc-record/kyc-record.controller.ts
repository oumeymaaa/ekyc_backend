// src/kyc-record/kyc-record.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { KycRecordService } from './kyc-record.service';
import { CreateKycRecordDto } from './dto/create-kyc-record.dto';
import { KycFilterDto } from './dto/kyc-filter.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('kyc-records')
export class KycRecordController {
  constructor(private readonly kycRecordService: KycRecordService) {}

  // POST /kyc-records/finalize — mobile app finalizes dossier (public)
  @Post('finalize')
  async finalizeKyc(@Body() dto: CreateKycRecordDto) {
    return this.kycRecordService.createKycRecord(dto);
  }

  // GET /kyc-records?status=en_attente&page=1&limit=10
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllKyc(@Query() filters: KycFilterDto, @Req() req: any) {
    return this.kycRecordService.findAllByAdmin(req.user.userId, filters);
  }

  // GET /kyc-records/client/:clientId
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get('client/:clientId')
  findByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.kycRecordService.findOneByClientId(clientId);
  }

  // US8.3 — PATCH /kyc-records/:id/status
  // Body: { "status": "valide" } or { "status": "non_valide" }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKycStatusDto,
    @Req() req: any,
  ) {
    return this.kycRecordService.updateStatus(id, dto, req.user.userId);
  }
}