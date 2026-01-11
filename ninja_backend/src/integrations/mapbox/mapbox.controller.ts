import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MapboxService } from './mapbox.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export class GeocodeDto {
  @ApiProperty({ example: '123 Main St, New York, NY', description: 'Address to geocode' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class ReverseGeocodeDto {
  @ApiProperty({ example: 40.7128, description: 'Latitude' })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -74.0060, description: 'Longitude' })
  @Type(() => Number)
  @IsNumber()
  longitude: number;
}

export class SearchLocationDto {
  @ApiProperty({ example: 'coffee shop', description: 'Search query' })
  query: string;
  
  @ApiPropertyOptional({ example: 40.7128, description: 'Latitude for proximity search' })
  latitude?: number;
  
  @ApiPropertyOptional({ example: -74.0060, description: 'Longitude for proximity search' })
  longitude?: number;
}

@ApiTags('integrations')
@ApiBearerAuth('JWT-auth')
@Controller('integrations/mapbox')
@UseGuards(JwtAuthGuard)
export class MapboxController {
  constructor(private readonly mapboxService: MapboxService) {}

  @Post('geocode')
  @ApiOperation({ summary: 'Geocode an address to coordinates' })
  @ApiBody({ type: GeocodeDto })
  @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async geocode(@Body() geocodeDto: GeocodeDto) {
    const result = await this.mapboxService.geocode(geocodeDto.address);
    if (!result) {
      return { success: false, message: 'Address not found' };
    }
    return { success: true, data: result };
  }

  @Post('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates to address' })
  @ApiBody({ type: ReverseGeocodeDto })
  @ApiResponse({ status: 200, description: 'Coordinates reverse geocoded successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async reverseGeocode(@Body() reverseGeocodeDto: ReverseGeocodeDto) {
    const result = await this.mapboxService.reverseGeocode(
      reverseGeocodeDto.latitude,
      reverseGeocodeDto.longitude,
    );
    if (!result) {
      return { success: false, message: 'Location not found' };
    }
    return { success: true, data: result };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for locations' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'lat', required: false, description: 'Latitude for proximity search' })
  @ApiQuery({ name: 'lng', required: false, description: 'Longitude for proximity search' })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  async searchLocation(
    @Query('q') query: string,
    @Query('lat') latitude?: string,
    @Query('lng') longitude?: string,
  ) {
    const proximity = latitude && longitude
      ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
      : undefined;

    const results = await this.mapboxService.searchLocation(query, proximity);
    return { success: true, data: results };
  }
}

