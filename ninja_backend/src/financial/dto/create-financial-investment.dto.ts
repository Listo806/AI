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

export class CreateFinancialInvestmentDto {
  @IsOptional() @IsString() investmentNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() accountId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() clientId?: string;

  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() status?: string;

  // Recorded value; never a live market price.
  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  amount?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.9999)
  units?: number;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() asOfDate?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
