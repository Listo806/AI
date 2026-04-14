import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, PropertyStatus, ListingCategory } from '../entities/property.entity';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

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

  /** Required for marketplace; omit for vacation (enforced in service + DB). */
  @ValidateIf((o) => (o.listingType ?? ListingCategory.MARKETPLACE) === ListingCategory.MARKETPLACE)
  @IsNotEmpty()
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
  @Min(0)
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
}
