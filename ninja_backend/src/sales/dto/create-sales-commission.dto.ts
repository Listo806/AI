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

export class CreateSalesCommissionDto {
  @IsOptional() @IsString() commissionNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() orderId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() invoiceId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;

  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() dealName?: string;
  @IsOptional() @IsString() repName?: string;
  @IsOptional() @IsString() source?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.999)
  rate?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  amount?: number;

  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() earnedDate?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsDateString() paidDate?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
