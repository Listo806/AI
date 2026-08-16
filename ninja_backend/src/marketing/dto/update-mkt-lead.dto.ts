import {
  IsOptional, IsString, IsUUID, IsNumber, IsEmail, Min, Max, ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class UpdateMktLeadDto {
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;
  @IsOptional() @IsString() name?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsEmail() email?: string;

  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() source?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
  @IsOptional() @IsString() campaignName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsNumber() @Min(0) @Max(999999999999.99)
  value?: number;

  @IsOptional() @IsString() externalId?: string;
  @IsOptional() @IsString() notes?: string;
}
