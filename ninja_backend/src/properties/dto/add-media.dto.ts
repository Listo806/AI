import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class AddMediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsEnum(['image', 'video', 'document'])
  type?: 'image' | 'video' | 'document';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;
}

