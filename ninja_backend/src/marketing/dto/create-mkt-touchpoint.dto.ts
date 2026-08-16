import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateMktTouchpointDto {
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
  @IsOptional() @IsString() campaignName?: string;
  @IsOptional() @IsString() channel?: string;
  @IsOptional() @IsString() touchType?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() occurredAt?: string;
}
