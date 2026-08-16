import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, Header,
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
import { CreateMktAudienceDto } from './dto/create-mkt-audience.dto';
import { UpdateMktAudienceDto } from './dto/update-mkt-audience.dto';
import { AddMktAudienceMembersDto } from './dto/add-mkt-audience-members.dto';
import { CreateMktFormDto } from './dto/create-mkt-form.dto';
import { UpdateMktFormDto } from './dto/update-mkt-form.dto';
import { CreateMktAutomationDto } from './dto/create-mkt-automation.dto';
import { UpdateMktAutomationDto } from './dto/update-mkt-automation.dto';
import { RunMktAutomationDto } from './dto/run-mkt-automation.dto';
import { CreateMktContentDto } from './dto/create-mkt-content.dto';
import { UpdateMktContentDto } from './dto/update-mkt-content.dto';
import { ConnectMktIntegrationDto } from './dto/connect-mkt-integration.dto';
import { ImportMktLeadsDto } from './dto/import-mkt-leads.dto';
import { MktAiQueryDto } from './dto/mkt-ai-query.dto';

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

  // ─── Audiences ───────────────────────────────────────────────────────────────

  @Get('audiences')
  @ApiOperation({ summary: 'List audiences (team-scoped)' })
  async listAudiences(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.findAllAudiences(user.id, user.teamId ?? null, user.role ?? 'owner', { search, status, page, limit });
  }

  @Post('audiences')
  @ApiOperation({ summary: 'Create an audience (team-scoped)' })
  async createAudience(@Body() dto: CreateMktAudienceDto, @CurrentUser() user: any) {
    return this.marketing.createAudience(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('audiences/:id')
  @ApiOperation({ summary: 'Get one audience (team-scoped)' })
  async getAudience(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.findOneAudience(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('audiences/:id')
  @ApiOperation({ summary: 'Update an audience (team-scoped)' })
  async updateAudience(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMktAudienceDto, @CurrentUser() user: any) {
    return this.marketing.updateAudience(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('audiences/:id')
  @ApiOperation({ summary: 'Delete an audience and its members (team-scoped)' })
  async removeAudience(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeAudience(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('audiences/:id/members')
  @ApiOperation({ summary: 'List audience members (team-scoped)' })
  async listAudienceMembers(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.listAudienceMembers(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('audiences/:id/members')
  @ApiOperation({ summary: 'Add audience members (deduped, team-scoped)' })
  async addAudienceMembers(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMktAudienceMembersDto, @CurrentUser() user: any) {
    return this.marketing.addAudienceMembers(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('audiences/:id/members/:memberId')
  @ApiOperation({ summary: 'Remove an audience member (team-scoped)' })
  async removeAudienceMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.marketing.removeAudienceMember(id, memberId, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Forms & Landing Pages ───────────────────────────────────────────────────

  @Get('forms')
  @ApiOperation({ summary: 'List forms & landing pages (team-scoped)' })
  async listForms(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketing.findAllForms(user.id, user.teamId ?? null, user.role ?? 'owner', { search, status, type, page, limit });
  }

  @Post('forms')
  @ApiOperation({ summary: 'Create a form / landing page (team-scoped)' })
  async createForm(@Body() dto: CreateMktFormDto, @CurrentUser() user: any) {
    return this.marketing.createForm(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('forms/:id')
  @ApiOperation({ summary: 'Get one form (team-scoped)' })
  async getForm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.findOneForm(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('forms/:id')
  @ApiOperation({ summary: 'Update / publish a form (team-scoped)' })
  async updateForm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMktFormDto, @CurrentUser() user: any) {
    return this.marketing.updateForm(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('forms/:id')
  @ApiOperation({ summary: 'Delete a form and its submissions (team-scoped)' })
  async removeForm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeForm(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('forms/:id/submissions')
  @ApiOperation({ summary: 'List a form submissions (team-scoped)' })
  async listSubmissions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.listSubmissions(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Automations ─────────────────────────────────────────────────────────────

  @Get('automations')
  @ApiOperation({ summary: 'List automations (team-scoped)' })
  async listAutomations(@CurrentUser() user: any, @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketing.findAllAutomations(user.id, user.teamId ?? null, user.role ?? 'owner', { status, page, limit });
  }

  @Post('automations')
  @ApiOperation({ summary: 'Create an automation (team-scoped)' })
  async createAutomation(@Body() dto: CreateMktAutomationDto, @CurrentUser() user: any) {
    return this.marketing.createAutomation(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('automations/:id')
  @ApiOperation({ summary: 'Get one automation (team-scoped)' })
  async getAutomation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.findOneAutomation(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('automations/:id')
  @ApiOperation({ summary: 'Update / pause / activate an automation (team-scoped)' })
  async updateAutomation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMktAutomationDto, @CurrentUser() user: any) {
    return this.marketing.updateAutomation(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('automations/:id')
  @ApiOperation({ summary: 'Delete an automation and its runs (team-scoped)' })
  async removeAutomation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeAutomation(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('automations/:id/runs')
  @ApiOperation({ summary: 'List automation runs (team-scoped)' })
  async listAutomationRuns(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.listAutomationRuns(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('automations/:id/run')
  @ApiOperation({ summary: 'Apply an automation to an entity (idempotent, team-scoped)' })
  async runAutomation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RunMktAutomationDto, @CurrentUser() user: any) {
    return this.marketing.runAutomation(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Content ─────────────────────────────────────────────────────────────────

  @Get('content')
  @ApiOperation({ summary: 'List content library (team-scoped)' })
  async listContent(@CurrentUser() user: any, @Query('search') search?: string, @Query('type') type?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketing.findAllContent(user.id, user.teamId ?? null, user.role ?? 'owner', { search, type, status, page, limit });
  }

  @Post('content')
  @ApiOperation({ summary: 'Create content (team-scoped)' })
  async createContent(@Body() dto: CreateMktContentDto, @CurrentUser() user: any) {
    return this.marketing.createContent(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('content/:id')
  @ApiOperation({ summary: 'Update content (team-scoped)' })
  async updateContent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMktContentDto, @CurrentUser() user: any) {
    return this.marketing.updateContent(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('content/:id')
  @ApiOperation({ summary: 'Delete content (team-scoped)' })
  async removeContent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.marketing.removeContent(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Integrations ────────────────────────────────────────────────────────────

  @Get('integrations')
  @ApiOperation({ summary: 'List integrations with honest connection status (team-scoped)' })
  async listIntegrations(@CurrentUser() user: any) {
    return this.marketing.listIntegrations(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('integrations/connect')
  @ApiOperation({ summary: 'Connect an integration (records status only; no fabricated data)' })
  async connectIntegration(@Body() dto: ConnectMktIntegrationDto, @CurrentUser() user: any) {
    return this.marketing.connectIntegration(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('integrations/disconnect')
  @ApiOperation({ summary: 'Disconnect an integration (team-scoped)' })
  async disconnectIntegration(@Body() dto: ConnectMktIntegrationDto, @CurrentUser() user: any) {
    return this.marketing.disconnectIntegration(dto.provider, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Reports + export + import + AI ──────────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'Marketing reports over a window (real aggregates, team-scoped)' })
  async reports(@CurrentUser() user: any, @Query('range') range?: string) {
    return this.marketing.getReports(user.id, user.teamId ?? null, user.role ?? 'owner', range);
  }

  @Get('export/:type')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Export leads/campaigns/conversions as CSV (team-scoped)' })
  async exportCsv(@Param('type') type: string, @CurrentUser() user: any, @Query('range') range?: string) {
    return this.marketing.exportCsv(type, range, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('leads/import')
  @ApiOperation({ summary: 'Import leads in bulk (validated, team-scoped)' })
  async importLeads(@Body() dto: ImportMktLeadsDto, @CurrentUser() user: any) {
    return this.marketing.importLeads(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('ai/query')
  @ApiOperation({ summary: 'Ask about your marketing (answered only from your account data)' })
  async aiQuery(@Body() dto: MktAiQueryDto, @CurrentUser() user: any) {
    return this.marketing.aiQuery(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }
}
