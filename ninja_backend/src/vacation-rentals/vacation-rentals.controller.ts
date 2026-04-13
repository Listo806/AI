import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VacationRentalsService } from './vacation-rentals.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

function parseOptionalNonNegativeFloat(label: string, raw?: string): number | undefined {
  if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
  const n = parseFloat(String(raw));
  if (!Number.isFinite(n) || n < 0) throw new BadRequestException(`Invalid ${label}`);
  return n;
}

function parseOptionalMinBedrooms(raw?: string): number | undefined {
  if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw new BadRequestException('Invalid bedrooms (use a whole number ≥ 1)');
  }
  return n;
}

function parseOptionalMinBathrooms(raw?: string): number | undefined {
  if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
  const n = parseFloat(String(raw));
  if (!Number.isFinite(n) || n <= 0) {
    throw new BadRequestException('Invalid bathrooms');
  }
  return n;
}

function parseVacationSort(raw?: string): 'recommended' | 'price_asc' | 'price_desc' {
  const s = (raw || 'recommended').trim().toLowerCase();
  if (!s || s === 'recommended') return 'recommended';
  if (s === 'price_asc' || s === 'price-low' || s === 'pricelow') return 'price_asc';
  if (s === 'price_desc' || s === 'price-high' || s === 'pricehigh') return 'price_desc';
  throw new BadRequestException('Invalid sort (use recommended, price-low, or price-high)');
}

@ApiTags('vacation-rentals')
@Controller('vacation-rentals')
export class VacationRentalsController {
  constructor(private readonly vacationService: VacationRentalsService) {}

  /**
   * Public search endpoint.
   * HARD ENFORCEMENT: Always returns listing_type = 'vacation' only.
   * Even if client sends listing_type=rent, it is ignored.
   */
  @Get('search')
  @ApiOperation({ summary: 'Search vacation rentals (public, no auth). Always returns only vacation listings.' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'checkIn', required: false, description: 'Check-in date (ISO format: 2026-05-01)' })
  @ApiQuery({ name: 'checkOut', required: false, description: 'Check-out date (ISO format: 2026-05-10)' })
  @ApiQuery({ name: 'search', required: false, description: 'Text search on title, address, city, description' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size (default 20, max 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum nightly price (inclusive)' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum nightly price (inclusive)' })
  @ApiQuery({ name: 'bedrooms', required: false, description: 'Minimum bedrooms (integer ≥ 1)' })
  @ApiQuery({ name: 'bathrooms', required: false, description: 'Minimum bathrooms (e.g. 1, 1.5, 2)' })
  @ApiQuery({ name: 'propertyType', required: false, description: 'house | apartment | land | commercial | villa | office' })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'recommended | price-low | price-high (also accepts price_asc / price_desc)',
  })
  @ApiQuery({
    name: 'listing_type',
    required: false,
    description: 'Ignored. Results are always listing_type=vacation (enforced in SQL).',
  })
  @ApiResponse({ status: 200, description: 'Vacation listings retrieved successfully' })
  async search(
    @Query('city') city?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('bathrooms') bathrooms?: string,
    @Query('propertyType') propertyType?: string,
    @Query('sort') sort?: string,
    @Query('listing_type') _ignoredListingType?: string,
  ) {
    void _ignoredListingType;
    const minP = parseOptionalNonNegativeFloat('minPrice', minPrice);
    const maxP = parseOptionalNonNegativeFloat('maxPrice', maxPrice);
    if (minP != null && maxP != null && minP > maxP) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }
    return this.vacationService.search({
      city,
      checkIn,
      checkOut,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      minPrice: minP,
      maxPrice: maxP,
      bedroomsMin: parseOptionalMinBedrooms(bedrooms),
      bathroomsMin: parseOptionalMinBathrooms(bathrooms),
      propertyType: propertyType?.trim() || undefined,
      sort: parseVacationSort(sort),
    });
  }

  /** Create a booking for a vacation property (authenticated) */
  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a booking for a vacation property' })
  async createBooking(@Body() dto: CreateBookingDto) {
    return this.vacationService.createBooking(dto);
  }

  /** Get bookings for a vacation property (authenticated) */
  @Get('bookings/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all bookings for a vacation property' })
  async getBookings(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.vacationService.getBookings(propertyId);
  }

  /** Delete a booking (authenticated) */
  @Delete('bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a booking' })
  async deleteBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.vacationService.deleteBooking(id);
  }
}
