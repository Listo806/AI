import { IsOptional, IsString, IsArray, IsObject } from 'class-validator';

export class UpdateMktAudienceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsObject() filter?: Record<string, any>;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}
