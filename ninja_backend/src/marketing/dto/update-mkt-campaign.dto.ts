import {
  IsOptional, IsString, IsUUID, IsNumber, IsDateString, IsArray, ValidateIf, Min, Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;
const notNull = (_o: any, v: any) => v !== null;

export class UpdateMktCampaignDto {
  @IsOptional() @IsString() campaignNumber?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() campaignType?: string;
  @IsOptional() @IsString() channel?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() audienceId?: string | null;
  @IsOptional() @IsString() audienceName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @Type(() => Number) @IsNumber() @Min(0) @Max(999999999999.99)
  budget?: number | null;

  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() goals?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() tracking?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() startDate?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() endDate?: string | null;
}
