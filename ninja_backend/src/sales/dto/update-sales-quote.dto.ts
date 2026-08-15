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

// Update DTO. A field left out is unchanged; a field sent as null is cleared. The
// ValidateIf(!null) lets null through the typed validators so blank optional
// fields can be cleared from the form.
export class UpdateSalesQuoteDto {
  @IsOptional()
  @IsString()
  quoteNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  contactId?: string | null;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactRole?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  dealId?: string | null;

  @IsOptional()
  @IsString()
  dealName?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  value?: number | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  validUntil?: string | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  ownerId?: string | null;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
