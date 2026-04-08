import { IsOptional, IsString, IsDateString } from 'class-validator';

export class SearchVacationDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  offset?: string;
}
