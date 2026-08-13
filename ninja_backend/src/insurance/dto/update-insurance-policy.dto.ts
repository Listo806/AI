import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// See create DTO: blank form fields arrive as '' and must be treated as absent.
const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// Partial update: only the fields present are changed. Same whitelist as create
// so forbidNonWhitelisted does not reject a legitimate edit.
export class UpdateInsurancePolicyDto {
  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsString()
  holderName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsString()
  policyType?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  coverageStart?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  coverageEnd?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  premium?: number;

  @IsOptional()
  @IsString()
  billingFrequency?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  nextBilling?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
