import { IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class UpdateMktContentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
}
