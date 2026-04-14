import { IsString, IsOptional, IsEnum, IsNumber, Min, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, PropertyStatus, ListingCategory } from '../entities/property.entity';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(ListingCategory)
  listingType?: ListingCategory;

  @IsOptional()
  @IsString()
  @IsIn(['house', 'apartment', 'land', 'commercial', 'villa', 'office'])
  propertyType?: string | null;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxGuests?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  squareFeet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lotSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearBuilt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  teamId?: string | null;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;
}

