import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateFinancialApplicationDto {
  @IsOptional() @IsString() applicationNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() clientId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() accountId?: string;

  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() applicationType?: string;
  @IsOptional() @IsString() advisorName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() submittedDate?: string;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
