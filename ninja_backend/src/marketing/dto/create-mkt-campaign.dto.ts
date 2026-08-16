import {
  IsOptional, IsString, IsUUID, IsNumber, IsDateString, IsArray, Min, Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateMktCampaignDto {
  @IsOptional() @IsString() campaignNumber?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() campaignType?: string;
  @IsOptional() @IsString() channel?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() audienceId?: string;
  @IsOptional() @IsString() audienceName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsNumber() @Min(0) @Max(999999999999.99)
  budget?: number;

  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() goals?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() tracking?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() startDate?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsDateString() endDate?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
