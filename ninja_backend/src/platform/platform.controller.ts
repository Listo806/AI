import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlatformListingsService } from './platform-listings.service';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformListings: PlatformListingsService) {}

  @Get('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my platform listings (Agent/Owner/User)' })
  @ApiResponse({ status: 200, description: 'List of my listings' })
  async getMyListings(@CurrentUser() user: any) {
    const data = await this.platformListings.findMine(
      user.id,
      user.teamId,
      user.role,
    );
    return { data };
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create listing (defaults to PENDING_REVIEW)' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  async createListing(@Body() dto: CreatePropertyDto, @CurrentUser() user: any) {
    const listing = await this.platformListings.create(
      dto,
      user.id,
      user.teamId,
    );
    return { data: listing };
  }
}
