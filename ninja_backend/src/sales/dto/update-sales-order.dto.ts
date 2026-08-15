import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class UpdateSalesOrderDto {
  @IsOptional() @IsString() orderNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  quoteId?: string | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  proposalId?: string | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  contactId?: string | null;

  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactRole?: string;
  @IsOptional() @IsString() dealName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  value?: number | null;

  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() notes?: string;
}
