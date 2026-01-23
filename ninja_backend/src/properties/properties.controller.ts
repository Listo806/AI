import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ListingLimitGuard } from '../subscriptions/guards/listing-limit.guard';
import { SubscriptionRequiredGuard } from '../subscriptions/guards/subscription-required.guard';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get all published properties (public, no auth required)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by property type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Published properties retrieved successfully' })
  async findPublic(
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.propertiesService.findPublic({ type, search });
  }

  @Post()
  @UseGuards(JwtAuthGuard, ListingLimitGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new property' })
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Listing limit reached' })
  async create(@Body() createPropertyDto: CreatePropertyDto, @CurrentUser() user: any) {
    return this.propertiesService.create(createPropertyDto, user.id, user.teamId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all properties (with optional filters and bbox search)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by property type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by property status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiQuery({ name: 'west', required: false, description: 'Bounding box west longitude' })
  @ApiQuery({ name: 'south', required: false, description: 'Bounding box south latitude' })
  @ApiQuery({ name: 'east', required: false, description: 'Bounding box east longitude' })
  @ApiQuery({ name: 'north', required: false, description: 'Bounding box north latitude' })
  @ApiResponse({ status: 200, description: 'Properties retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('west') west?: string,
    @Query('south') south?: string,
    @Query('east') east?: string,
    @Query('north') north?: string,
  ) {
    // If bbox parameters are provided, use bbox query
    if (west && south && east && north) {
      const bbox = {
        west: parseFloat(west),
        south: parseFloat(south),
        east: parseFloat(east),
        north: parseFloat(north),
      };
      return this.propertiesService.findByBbox(user.id, user.teamId, bbox, { type, status, search });
    }
    return this.propertiesService.findAll(user.id, user.teamId, { type, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID (public, no auth required for published properties)' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user.id, user.teamId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property published successfully' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.propertiesService.publish(id, user.id, user.teamId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.propertiesService.delete(id, user.id, user.teamId);
    return { message: 'Property deleted successfully' };
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add media to a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({ type: AddMediaDto })
  @ApiResponse({ status: 201, description: 'Media added successfully' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  async addMedia(
    @Param('id') propertyId: string,
    @Body() addMediaDto: AddMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.addMedia(
      propertyId,
      addMediaDto.url,
      addMediaDto.type || 'image',
      addMediaDto.isPrimary || false,
      user.id,
      user.teamId,
    );
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Get all media for a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  async getMedia(@Param('id') propertyId: string) {
    return this.propertiesService.getMedia(propertyId);
  }

  @Put(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update property media' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiBody({ type: UpdateMediaDto })
  @ApiResponse({ status: 200, description: 'Media updated successfully' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  async updateMedia(
    @Param('mediaId') mediaId: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.updateMedia(mediaId, updateMediaDto, user.id, user.teamId);
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete property media' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  async deleteMedia(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: any,
  ) {
    await this.propertiesService.deleteMedia(mediaId, user.id, user.teamId);
    return { message: 'Media deleted successfully' };
  }
}

