import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WhatsAppLeadSource {
  LISTING_WHATSAPP = 'listing_whatsapp',
  INSTAGRAM_WHATSAPP = 'instagram_whatsapp',
  WEBSITE_WHATSAPP = 'website_whatsapp',
  FACEBOOK_WHATSAPP = 'facebook_whatsapp',
  OTHER_WHATSAPP = 'other_whatsapp',
}

export class CreateWhatsAppLeadDto {
  @ApiProperty({
    example: '+593987654321',
    description: 'Lead phone number (E.164 format required)',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'd9f2fab6-64ff-4695-8761-1a93b949b926',
    description: 'Property ID (required)',
  })
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Lead name (optional)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Lead email address (optional)',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    enum: WhatsAppLeadSource,
    example: WhatsAppLeadSource.LISTING_WHATSAPP,
    description: 'Lead source channel (required)',
  })
  @IsEnum(WhatsAppLeadSource)
  @IsNotEmpty()
  source: WhatsAppLeadSource;

  @ApiPropertyOptional({
    example: 'instagram',
    description: 'Additional channel context (optional)',
  })
  @IsOptional()
  @IsString()
  channel?: string;
}
