import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import axios, { AxiosInstance } from 'axios';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeName: string;
}

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
}

@Injectable()
export class MapboxService {
  private readonly logger = new Logger(MapboxService.name);
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mapbox.com';
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.accessToken = this.configService.get('MAPBOX_ACCESS_TOKEN') || '';
    
    if (!this.accessToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not configured. Mapbox features will be disabled.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    if (!this.accessToken) {
      this.logger.warn('Mapbox geocoding skipped - no access token configured');
      return null;
    }

    try {
      const response = await this.axiosInstance.get('/geocoding/v5/mapbox.places/' + encodeURIComponent(address) + '.json', {
        params: {
          access_token: this.accessToken,
          limit: 1,
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [longitude, latitude] = feature.center;

        return {
          latitude,
          longitude,
          formattedAddress: feature.place_name,
          placeName: feature.text,
        };
      }

      return null;
    } catch (error: any) {
      this.logger.error('Mapbox geocoding failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    if (!this.accessToken) {
      this.logger.warn('Mapbox reverse geocoding skipped - no access token configured');
      return null;
    }

    try {
      const response = await this.axiosInstance.get(`/geocoding/v5/mapbox.places/${longitude},${latitude}.json`, {
        params: {
          access_token: this.accessToken,
          limit: 1,
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const context = feature.context || [];
        
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        context.forEach((ctx: any) => {
          if (ctx.id.startsWith('place')) {
            city = ctx.text;
          } else if (ctx.id.startsWith('region')) {
            state = ctx.text;
          } else if (ctx.id.startsWith('postcode')) {
            zipCode = ctx.text;
          } else if (ctx.id.startsWith('country')) {
            country = ctx.text;
          }
        });

        return {
          address: feature.place_name,
          city,
          state,
          zipCode,
          country,
          formattedAddress: feature.place_name,
        };
      }

      return null;
    } catch (error: any) {
      this.logger.error('Mapbox reverse geocoding failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Search for locations
   */
  async searchLocation(query: string, proximity?: { latitude: number; longitude: number }): Promise<any[]> {
    if (!this.accessToken) {
      this.logger.warn('Mapbox search skipped - no access token configured');
      return [];
    }

    try {
      const params: any = {
        access_token: this.accessToken,
        limit: 5,
      };

      if (proximity) {
        params.proximity = `${proximity.longitude},${proximity.latitude}`;
      }

      const response = await this.axiosInstance.get('/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json', {
        params,
      });

      if (response.data.features) {
        return response.data.features.map((feature: any) => ({
          id: feature.id,
          placeName: feature.place_name,
          text: feature.text,
          center: feature.center,
          context: feature.context,
        }));
      }

      return [];
    } catch (error: any) {
      this.logger.error('Mapbox search failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to search locations');
    }
  }

  /**
   * Get distance between two points (in kilometers)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

