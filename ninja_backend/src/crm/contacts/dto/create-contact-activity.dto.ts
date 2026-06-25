import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateContactActivityDto {
  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}