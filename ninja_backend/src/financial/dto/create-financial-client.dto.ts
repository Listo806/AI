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

export class CreateFinancialClientDto {
  @IsOptional() @IsString() clientNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;

  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() kind?: string;
  @IsOptional() @IsString() clientType?: string;
  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() accountType?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  aum?: number;

  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() lastActivityAt?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsDateString() nextReviewDate?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
