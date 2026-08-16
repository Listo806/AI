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
import { CreateMktLeadDto } from './dto/create-mkt-lead.dto';
import { UpdateMktLeadDto } from './dto/update-mkt-lead.dto';
import { CreateMktTouchpointDto } from './dto/create-mkt-touchpoint.dto';
import { CreateMktConversionDto } from './dto/create-mkt-conversion.dto';
import { CreateMktMessageDto } from './dto/create-mkt-message.dto';
import { UpdateMktMessageDto } from './dto/update-mkt-message.dto';
import { AddMktRecipientsDto } from './dto/add-mkt-recipients.dto';
import { RecordMktEventDto } from './dto/record-mkt-event.dto';
import { CreateMktSuppressionDto } from './dto/create-mkt-suppression.dto';

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

  // ─── Leads ───────────────────────────────────────────────────────────────────

  @Get('leads')
  @ApiOperation({ summary: 'List leads (paginated, filterable, team-scoped)' })
  async listLeads(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('campaignId') campaignId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.findAllLeads(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search, status, source, campaignId, page, limit,
    });
  }

  @Post('leads')
  @ApiOperation({ summary: 'Capture a lead (team-scoped, seeds a first-touch touchpoint)' })
  async createLead(@Body() dto: CreateMktLeadDto, @CurrentUser() user: any) {
    return this.marketing.createLead(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get one lead (team-scoped)' })
  async getLead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.findOneLead(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('leads/:id')
  @ApiOperation({ summary: 'Update a lead (team-scoped)' })
  async updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMktLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.marketing.updateLead(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Delete a lead and its touchpoints (team-scoped)' })
  async removeLead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeLead(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('leads/:id/touchpoints')
  @ApiOperation({ summary: 'List a lead touchpoints (attribution history, team-scoped)' })
  async listTouchpoints(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.listTouchpoints(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('leads/:id/touchpoints')
  @ApiOperation({ summary: 'Record a real touchpoint for a lead (team-scoped)' })
  async createTouchpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMktTouchpointDto,
    @CurrentUser() user: any,
  ) {
    return this.marketing.createTouchpoint(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Conversions (idempotent, last-touch attribution) ────────────────────────

  @Get('conversions')
  @ApiOperation({ summary: 'List conversions (paginated, filterable, team-scoped)' })
  async listConversions(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('conversionType') conversionType?: string,
    @Query('campaignId') campaignId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.findAllConversions(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search, conversionType, campaignId, page, limit,
    });
  }

  @Post('conversions')
  @ApiOperation({ summary: 'Record a conversion (idempotent; last-touch attribution)' })
  async createConversion(@Body() dto: CreateMktConversionDto, @CurrentUser() user: any) {
    return this.marketing.createConversion(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('conversions/:id')
  @ApiOperation({ summary: 'Delete a conversion (team-scoped)' })
  async removeConversion(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeConversion(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Attribution (last-touch report) ─────────────────────────────────────────

  @Get('attribution')
  @ApiOperation({ summary: 'Last-touch attribution report (by campaign + channel, team-scoped)' })
  async attribution(@CurrentUser() user: any, @Query('range') range?: string) {
    return this.marketing.getAttribution(user.id, user.teamId ?? null, user.role ?? 'owner', range);
  }

  // ─── Email / SMS messaging ───────────────────────────────────────────────────

  @Get('messages')
  @ApiOperation({ summary: 'List email/SMS messages (paginated, filterable, team-scoped)' })
  async listMessages(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.findAllMessages(user.id, user.teamId ?? null, user.role ?? 'owner', { search, channel, status, page, limit });
  }

  @Post('messages')
  @ApiOperation({ summary: 'Create an email/SMS message (draft or scheduled)' })
  async createMessage(@Body() dto: CreateMktMessageDto, @CurrentUser() user: any) {
    return this.marketing.createMessage(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Get one message (team-scoped)' })
  async getMessage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.findOneMessage(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Update a draft/scheduled message (team-scoped)' })
  async updateMessage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMktMessageDto, @CurrentUser() user: any) {
    return this.marketing.updateMessage(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message and its recipients/events (team-scoped)' })
  async removeMessage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeMessage(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('messages/:id/recipients')
  @ApiOperation({ summary: 'List a message recipients (team-scoped)' })
  async listRecipients(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.listRecipients(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('messages/:id/recipients')
  @ApiOperation({ summary: 'Add recipients (suppressed addresses are skipped)' })
  async addRecipients(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMktRecipientsDto, @CurrentUser() user: any) {
    return this.marketing.addRecipients(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('messages/:id/send')
  @ApiOperation({ summary: 'Send a message (marks recipients attempted; never fabricates delivery)' })
  async sendMessage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.sendMessage(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('messages/:id/events')
  @ApiOperation({ summary: 'Record a real message event (idempotent; enforces suppression)' })
  async recordEvent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecordMktEventDto, @CurrentUser() user: any) {
    return this.marketing.recordMessageEvent(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Suppression (compliance) ────────────────────────────────────────────────

  @Get('suppression')
  @ApiOperation({ summary: 'List suppressed addresses (team-scoped)' })
  async listSuppression(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('channel') channel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.listSuppression(user.id, user.teamId ?? null, user.role ?? 'owner', { search, channel, page, limit });
  }

  @Post('suppression')
  @ApiOperation({ summary: 'Manually suppress an address (team-scoped)' })
  async addSuppression(@Body() dto: CreateMktSuppressionDto, @CurrentUser() user: any) {
    return this.marketing.addSuppression(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('suppression/:id')
  @ApiOperation({ summary: 'Remove a suppressed address (team-scoped)' })
  async removeSuppression(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeSuppression(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }
}
