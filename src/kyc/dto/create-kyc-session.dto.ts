import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateKycSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  userReference?: string;
}
