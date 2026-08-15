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

export class UpdateFinancialClientDto {
  @IsOptional() @IsString() clientNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() contactId?: string | null;

  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() kind?: string;
  @IsOptional() @IsString() clientType?: string;
  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() accountType?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf(notNull)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  aum?: number | null;

  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() lastActivityAt?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() nextReviewDate?: string | null;

  @IsOptional() @IsString() notes?: string;
}
