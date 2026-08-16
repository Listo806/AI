import { IsOptional, IsString, IsUUID, IsArray, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateCsArticleDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() category?: string;

  @IsOptional() @IsIn(['Draft', 'Published', 'Archived']) status?: string;

  @IsOptional() @IsString() authorName?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
