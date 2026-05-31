import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateKycRecordDto {
  @IsInt()
  @Min(1)
  clientId: number;

  @IsObject()
  cinData: {
    cin: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    lieu: string;
    address?: string;
  };

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  facialMatchingScore?: number;

  @IsOptional()
  livenessScore?: number;

  @IsOptional()
  @IsString()
  selfieImageUrl?: string;

  @IsOptional()
  @IsString()
  cinImageUrl?: string;
}
