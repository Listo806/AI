import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;
const notNull = (_o: any, v: any) => v !== null;

export class UpdateFinancialApplicationDto {
  @IsOptional() @IsString() applicationNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() clientId?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() accountId?: string | null;

  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() applicationType?: string;
  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() submittedDate?: string | null;

  @IsOptional() @IsString() notes?: string;
}
