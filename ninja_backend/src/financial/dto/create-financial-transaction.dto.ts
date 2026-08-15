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

export class CreateFinancialTransactionDto {
  @IsOptional() @IsString() transactionNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() accountId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() clientId?: string;

  @IsOptional() @IsString() transactionType?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  amount?: number;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() transactionDate?: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
