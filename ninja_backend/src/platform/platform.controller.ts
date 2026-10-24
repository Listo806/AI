import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionRequiredGuard } from '../subscriptions/guards/subscription-required.guard';
import { ListingLimitGuard } from '../subscriptions/guards/listing-limit.guard';
import { UserRole } from '../users/entities/user.entity';
import { PlatformListingsService } from './platform-listings.service';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformListings: PlatformListingsService) {}

  @Post('public-listings/:id/activity')
  async recordActivity(@Param('id') id: string, @Body() body: {type: string; sessionKey?: string; channel?: string}) {
    return this.platformListings.recordPublicActivity(id,body?.type,body?.sessionKey,body?.channel);
  }

  @Get('public-portfolio/:ownerId')
  async publicPortfolio(@Param('ownerId') ownerId: string) {
    return this.platformListings.publicPortfolio(ownerId);
  }

  @Post('listings/bulk-drafts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  async bulkDrafts(@Body('items') items: CreatePropertyDto[], @CurrentUser() user: any) {
    return { data: await this.platformListings.bulkDrafts(items, user.id, user.teamId) };
  }

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

  @Get('listings/dashboard')
  @UseGuards(JwtAuthGuard)
  async listingDashboard(@CurrentUser() user:any) {
    return this.platformListings.dashboard(user.id);
  }

  @Patch('listings/:id/action')
  @UseGuards(JwtAuthGuard)
  async listingAction(@Param('id') id:string,@Body('action') action:string,@CurrentUser() user:any) {
    return {data:await this.platformListings.action(id,user.id,action)};
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

  @Patch('listings/:id')
  @UseGuards(JwtAuthGuard)
  async updateOwnedListing(@Param('id') id: string, @Body() dto: CreatePropertyDto, @CurrentUser() user: any) {
    return { data: await this.platformListings.updateOwnedListing(id, dto, user.id) };
  }

  @Post('listings/drafts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  async createDraft(@Body() dto: CreatePropertyDto, @CurrentUser() user: any) {
    return {data:await this.platformListings.createDraft(dto,user.id,user.teamId)};
  }

  @Patch('listings/drafts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  async updateDraft(@Param('id') id:string,@Body() dto:CreatePropertyDto,@CurrentUser() user:any) {
    return {data:await this.platformListings.updateDraft(id,dto,user.id)};
  }

  @Post('listings/drafts/:id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  async attachMedia(@Param('id') id:string,@Body('fileId') fileId:string,@CurrentUser() user:any) {
    return {data:await this.platformListings.addDraftMedia(id,user.id,fileId)};
  }

  @Post('listings/drafts/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionRequiredGuard, ListingLimitGuard)
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.USER)
  async submitDraft(@Param('id') id:string,@CurrentUser() user:any) {
    return {data:await this.platformListings.submitDraft(id,user.id)};
  }
}
