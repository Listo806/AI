import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;
const notNull = (_o: any, v: any) => v !== null;

export class UpdateSalesCommissionDto {
  @IsOptional() @IsString() commissionNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() orderId?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() invoiceId?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() contactId?: string | null;

  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() dealName?: string;
  @IsOptional() @IsString() repName?: string;
  @IsOptional() @IsString() source?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf(notNull)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.999)
  rate?: number | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf(notNull)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  amount?: number | null;

  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() earnedDate?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() paidDate?: string | null;

  @IsOptional() @IsString() notes?: string;
}
