import {
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsString()
  linkedLeadName?: string;

  @IsOptional()
  @IsString()
  interest?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastContactAt?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;
}