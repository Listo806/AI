import { IsOptional, IsString, IsUUID, IsIn, IsArray, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateMktAudienceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['static', 'dynamic']) type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsObject() filter?: Record<string, any>;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
