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
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  async create(@Body() createPropertyDto: CreatePropertyDto, @CurrentUser() user: any) {
    return this.propertiesService.create(createPropertyDto, user.id, user.teamId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
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
      return this.propertiesService.findByBbox(user.id, user.teamId, bbox, { type, status });
    }
    return this.propertiesService.findAll(user.id, user.teamId, { type, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user.id, user.teamId);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.propertiesService.publish(id, user.id, user.teamId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.propertiesService.delete(id, user.id, user.teamId);
    return { message: 'Property deleted successfully' };
  }

  @Post(':id/media')
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
  async getMedia(@Param('id') propertyId: string) {
    return this.propertiesService.getMedia(propertyId);
  }

  @Put(':id/media/:mediaId')
  async updateMedia(
    @Param('mediaId') mediaId: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.updateMedia(mediaId, updateMediaDto, user.id, user.teamId);
  }

  @Delete(':id/media/:mediaId')
  async deleteMedia(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: any,
  ) {
    await this.propertiesService.deleteMedia(mediaId, user.id, user.teamId);
    return { message: 'Media deleted successfully' };
  }
}

