import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { MapboxService } from './mapbox.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export class GeocodeDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class ReverseGeocodeDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
}

export class SearchLocationDto {
  query: string;
  latitude?: number;
  longitude?: number;
}

@Controller('integrations/mapbox')
@UseGuards(JwtAuthGuard)
export class MapboxController {
  constructor(private readonly mapboxService: MapboxService) {}

  @Post('geocode')
  async geocode(@Body() geocodeDto: GeocodeDto) {
    const result = await this.mapboxService.geocode(geocodeDto.address);
    if (!result) {
      return { success: false, message: 'Address not found' };
    }
    return { success: true, data: result };
  }

  @Post('reverse-geocode')
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

