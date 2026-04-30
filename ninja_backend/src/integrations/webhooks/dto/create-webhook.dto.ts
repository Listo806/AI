import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, ArrayMinSize, ArrayNotEmpty } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  secret_token?: string;
}
