import { IsOptional, IsString, IsUUID, IsIn, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateMktMessageDto {
  @IsOptional() @IsIn(['Email', 'SMS']) channel?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() fromName?: string;
  @IsOptional() @IsString() fromAddress?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() audienceId?: string;
  @IsOptional() @IsString() audienceName?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() scheduledAt?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
