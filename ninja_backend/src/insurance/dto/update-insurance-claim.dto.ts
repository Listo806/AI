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

export class UpdateInsuranceClaimDto {
  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsString()
  claimType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  filedDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  amountClaimed?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  amountApproved?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  resolvedDate?: string;
}
