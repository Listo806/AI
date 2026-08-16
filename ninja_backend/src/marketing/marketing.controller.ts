import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

import { MarketingService } from './marketing.service';
import { CreateMktCampaignDto } from './dto/create-mkt-campaign.dto';
import { UpdateMktCampaignDto } from './dto/update-mkt-campaign.dto';
import { CreateMktCostDto } from './dto/create-mkt-cost.dto';

// Marketing Workspace API. JwtAuthGuard authenticates, PaymentGuard gates unpaid
// accounts, and WorkspaceLockGuard enforces the $97 add-on ONLY when the 'marketing'
// lock is on (no-op by default). All data access is team-scoped in the service;
// every :id route is UUID-validated (malformed -> 400).
@ApiTags('marketing')
@ApiBearerAuth('JWT-auth')
@Controller('marketing')
@RequiresWorkspace('marketing')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Marketing Overview KPIs + dashboard (real data)' })
  async stats(@CurrentUser() user: any) {
    return this.marketing.getStats(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns (paginated, filterable, team-scoped)' })
  async listCampaigns(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('campaignType') campaignType?: string,
    @Query('channel') channel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.findAllCampaigns(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search, status, campaignType, channel, page, limit,
    });
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a campaign' })
  async createCampaign(@Body() dto: CreateMktCampaignDto, @CurrentUser() user: any) {
    return this.marketing.createCampaign(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get one campaign (team-scoped)' })
  async getCampaign(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.findOneCampaign(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Update a campaign (activate/pause/complete/archive/schedule)' })
  async updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMktCampaignDto,
    @CurrentUser() user: any,
  ) {
    return this.marketing.updateCampaign(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('campaigns/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a campaign as a new Draft (team-scoped)' })
  async duplicateCampaign(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.duplicateCampaign(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a campaign (team-scoped)' })
  async removeCampaign(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeCampaign(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Campaign costs (recorded spend, separate from budget) ───────────────────

  @Get('campaigns/:id/costs')
  @ApiOperation({ summary: 'List recorded costs for a campaign (team-scoped)' })
  async listCosts(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.listCosts(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('campaigns/:id/costs')
  @ApiOperation({ summary: 'Record a campaign cost (actual spend, not budget)' })
  async createCost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMktCostDto,
    @CurrentUser() user: any,
  ) {
    return this.marketing.createCost(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('campaigns/:id/costs/:costId')
  @ApiOperation({ summary: 'Delete a recorded campaign cost (team-scoped)' })
  async removeCost(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('costId', ParseUUIDPipe) costId: string,
    @CurrentUser() user: any,
  ) {
    return this.marketing.removeCost(id, costId, user.id, user.teamId ?? null, user.role ?? 'owner');
  }
}
