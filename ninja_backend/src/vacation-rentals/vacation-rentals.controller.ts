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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VacationRentalsService } from './vacation-rentals.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  @ApiResponse({ status: 200, description: 'Vacation listings retrieved successfully' })
  async search(
    @Query('city') city?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.vacationService.search({
      city,
      checkIn,
      checkOut,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
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
