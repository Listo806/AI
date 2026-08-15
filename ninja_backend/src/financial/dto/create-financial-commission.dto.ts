import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateFinancialCommissionDto {
  @IsOptional() @IsString() commissionNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() clientId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() accountId?: string;

  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  amount?: number;

  // Optional percent (fits NUMERIC(6,3)).
  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.999)
  rate?: number;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() commissionDate?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
