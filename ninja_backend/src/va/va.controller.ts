import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { VaListingsService } from './va-listings.service';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';
import { UpdatePropertyDto } from '../properties/dto/update-property.dto';

@ApiTags('va')
@Controller('va')
export class VaController {
  constructor(private readonly vaListings: VaListingsService) {}

  @Get('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VA_UPLOADER, UserRole.VA)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my VA listings' })
  @ApiResponse({ status: 200, description: 'List of my listings' })
  async getMyListings(@CurrentUser() user: any) {
    const data = await this.vaListings.findMine(user.id);
    return { data };
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VA_UPLOADER, UserRole.VA)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create listing (VA uploader; always PENDING_REVIEW)' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  async createListing(@Body() dto: CreatePropertyDto, @CurrentUser() user: any) {
    const listing = await this.vaListings.create(
      dto,
      user.id,
      user.teamId,
    );
    return { data: listing };
  }

  @Put('listings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VA_UPLOADER, UserRole.VA)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update listing (only pending, own listings)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  async updateListing(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @CurrentUser() user: any) {
    const listing = await this.vaListings.update(id, dto, user.id);
    return { data: listing };
  }
}
