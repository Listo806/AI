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

export class UpdateInsuranceCommissionDto {
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
}
