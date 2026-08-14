import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class UpdateInsuranceQuoteDto {
  @IsOptional()
  @IsString()
  quoteNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  contactId?: string;

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
  @Type(() => Number)
  @IsNumber()
  quotedPremium?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  coverageStart?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  coverageEnd?: string;

  @IsOptional()
  @IsString()
  billingFrequency?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  validUntil?: string;

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
