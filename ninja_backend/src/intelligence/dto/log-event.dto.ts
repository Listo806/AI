import { IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BuyerEventType {
  PROPERTY_SEARCH = 'property_search',
  FILTERS_APPLIED = 'filters_applied',
  LISTING_VIEW = 'listing_view',
  REVISIT = 'revisit',
  CONTACTED = 'contacted',
}

export class LogEventDto {
  @ApiProperty({
    description: 'Buyer ID (UUID from cookie)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  buyerId: string;

  @ApiProperty({
    description: 'Event type',
    enum: BuyerEventType,
    example: BuyerEventType.LISTING_VIEW,
  })
  @IsEnum(BuyerEventType)
  eventType: BuyerEventType;

  @ApiPropertyOptional({
    description: 'Property ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'Zone ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Additional event metadata (filters, search terms, etc.)',
    example: { filters: { price_min: 100000, bedrooms: 3 }, search_term: 'Quito' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
