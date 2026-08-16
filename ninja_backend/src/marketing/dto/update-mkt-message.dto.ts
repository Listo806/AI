import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class UpdateMktMessageDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() fromName?: string;
  @IsOptional() @IsString() fromAddress?: string;
  @IsOptional() @IsString() audienceName?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() scheduledAt?: string;
}
