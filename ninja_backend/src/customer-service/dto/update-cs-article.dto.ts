import { IsOptional, IsString, IsArray, IsIn } from 'class-validator';

export class UpdateCsArticleDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() category?: string;

  @IsOptional() @IsIn(['Draft', 'Published', 'Archived']) status?: string;

  @IsOptional() @IsString() authorName?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}
