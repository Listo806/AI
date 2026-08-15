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

export class CreateFinancialAccountDto {
  @IsOptional() @IsString() accountNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() clientId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() applicationId?: string;

  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() accountType?: string;
  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  balance?: number;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() openedDate?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
