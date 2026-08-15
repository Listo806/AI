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

// A blank form field arrives as '' (present), which would fail @IsUUID/@IsDateString
// and, with the global forbidNonWhitelisted pipe, reject the whole request. Treat
// empty strings as absent so partial forms validate.
const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// Every field is optional so a quote can be created with partial data from the
// workspace form. team_id is resolved server-side from the caller; a client value
// is only honored if the caller actually has access to that team.
export class CreateSalesQuoteDto {
  @IsOptional()
  @IsString()
  quoteNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  contactId?: string;

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
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsString()
  dealName?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  value?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  teamId?: string;
}
