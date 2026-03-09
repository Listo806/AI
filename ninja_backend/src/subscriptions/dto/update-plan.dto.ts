import { IsString, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  seatLimit?: number;

  @IsOptional()
  @IsString()
  paddlePriceId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  listingLimit?: number | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  crmAccess?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  aiFeatures?: boolean;

  @IsOptional()
  @IsString()
  analyticsLevel?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  priorityExposure?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  aiAutomation?: boolean;

  @IsOptional()
  @IsString()
  planCategory?: string;
}

