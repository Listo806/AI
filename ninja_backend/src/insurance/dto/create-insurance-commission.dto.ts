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

// policyId optional so the service returns a friendly "must link to a policy".
// amount is derived server-side from premium x rate when a rate is given, and
// otherwise validated; never trusted blindly.
export class CreateInsuranceCommissionDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  rate?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  earnedDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  teamId?: string;
}
