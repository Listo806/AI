import { Controller, Get, Put, Param, Query, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminListingsService } from './admin-listings.service';
import { PropertyStatus } from '../properties/entities/property.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminListingsController {
  constructor(private readonly adminListings: AdminListingsService) {}

  @Get('listings')
  @ApiOperation({ summary: 'List all listings (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'origin', required: false })
  @ApiQuery({ name: 'createdBy', required: false })
  @ApiResponse({ status: 200, description: 'List of listings' })
  async list(
    @Query('status') status?: string,
    @Query('origin') origin?: string,
    @Query('createdBy') createdBy?: string,
  ) {
    const data = await this.adminListings.findAll({ status, origin, createdBy });
    return { data };
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing by ID (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async get(@Param('id') id: string) {
    const data = await this.adminListings.findById(id);
    if (!data) throw new NotFoundException('Listing not found');
    return { data };
  }

  @Put('listings/:id/status')
  @ApiOperation({ summary: 'Update listing status (approve, reject, publish)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['approved', 'rejected', 'published'] },
        rejectionReason: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; rejectionReason?: string },
    @CurrentUser() user: any,
  ) {
    const adminId = user.id;
    const status = body.status as PropertyStatus;
    if (!['approved', 'rejected', 'published'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    const data = await this.adminListings.updateStatus(
      id,
      status,
      adminId,
      body.rejectionReason,
    );
    return { data };
  }
}
