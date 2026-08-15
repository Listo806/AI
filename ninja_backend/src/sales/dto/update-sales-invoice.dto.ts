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

export class UpdateSalesInvoiceDto {
  @IsOptional() @IsString() invoiceNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() orderId?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() contactId?: string | null;

  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactRole?: string;
  @IsOptional() @IsString() dealName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf(notNull)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  amount?: number | null;

  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() dueDate?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() paidDate?: string | null;

  @IsOptional() @IsString() paymentReference?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() notes?: string;
}
