import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, ArrayNotEmpty } from 'class-validator';

export class UpdateWebhookDto {
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  secret_token?: string;
}
