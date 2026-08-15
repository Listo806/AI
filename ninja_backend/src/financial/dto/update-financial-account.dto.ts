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

export class UpdateFinancialAccountDto {
  @IsOptional() @IsString() accountNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() clientId?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() applicationId?: string | null;

  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() accountType?: string;
  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf(notNull)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  balance?: number | null;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() openedDate?: string | null;

  @IsOptional() @IsString() notes?: string;
}
