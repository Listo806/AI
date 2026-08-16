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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

import { CustomerServiceService } from './customer-service.service';
import { CreateCsTicketDto } from './dto/create-cs-ticket.dto';
import { UpdateCsTicketDto } from './dto/update-cs-ticket.dto';
import { CreateCsMessageDto } from './dto/create-cs-message.dto';
import { CreateCsArticleDto } from './dto/create-cs-article.dto';
import { UpdateCsArticleDto } from './dto/update-cs-article.dto';
import { CreateCsSlaPolicyDto, UpdateCsSlaPolicyDto } from './dto/cs-sla-policy.dto';
import { CreateCsEscalationDto, UpdateCsEscalationDto } from './dto/cs-escalation.dto';
import { CreateCsAutomationDto, UpdateCsAutomationDto } from './dto/cs-automation.dto';
import { CreateCsSurveyDto, UpdateCsSurveyDto } from './dto/cs-survey.dto';
import { ImportCsTicketsDto } from './dto/import-cs-tickets.dto';

// Customer Service Workspace API. JwtAuthGuard authenticates, PaymentGuard gates
// unpaid accounts, and WorkspaceLockGuard enforces the $97 add-on ONLY when the
// 'customer-service' lock is on (no-op by default). All data access is team-scoped
// inside the service; every :id route is UUID-validated (malformed -> 400).
@ApiTags('customer-service')
@ApiBearerAuth('JWT-auth')
@Controller('customer-service')
@RequiresWorkspace('customer-service')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class CustomerServiceController {
  constructor(private readonly cs: CustomerServiceService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Customer Service Overview KPIs + charts (real data)' })
  async stats(@CurrentUser() user: any) {
    return this.cs.getStats(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('contacts')
  @ApiOperation({ summary: "Search the account's CRM contacts (customer picker)" })
  async searchContacts(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.cs.searchContacts(user.id, user.teamId ?? null, user.role ?? 'owner', search);
  }

  @Get('agents')
  @ApiOperation({ summary: "Search the account's team users (agent picker)" })
  async searchAgents(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.cs.searchAgents(user.id, user.teamId ?? null, user.role ?? 'owner', search);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List tickets (paginated, filterable, team-scoped)' })
  async listTickets(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('channel') channel?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('slaStatus') slaStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cs.findAllTickets(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search,
      status,
      priority,
      channel,
      category,
      assignedTo,
      slaStatus,
      page,
      limit,
    });
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a ticket' })
  async createTicket(@Body() dto: CreateCsTicketDto, @CurrentUser() user: any) {
    return this.cs.createTicket(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('tickets/import')
  @ApiOperation({ summary: 'Bulk-import tickets into this account (validated, deduped, account-scoped)' })
  async importTickets(@Body() dto: ImportCsTicketsDto, @CurrentUser() user: any) {
    return this.cs.importTickets(dto.tickets, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get one ticket (team-scoped)' })
  async getTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.findOneTicket(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Update a ticket (assign, change status/priority, resolve, close)' })
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateTicket(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('tickets/:id')
  @ApiOperation({ summary: 'Delete a ticket (team-scoped)' })
  async removeTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeTicket(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Conversation (messages + internal notes) ────────────────────────────────

  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'List a ticket conversation (messages + internal notes)' })
  async listMessages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.listMessages(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message / agent reply / internal note to a ticket' })
  async createMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCsMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.createMessage(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('tickets/:id/messages/:messageId')
  @ApiOperation({ summary: 'Delete a ticket message (team-scoped)' })
  async removeMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.cs.removeMessage(id, messageId, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('tickets/:id/activity')
  @ApiOperation({ summary: 'Ticket activity / audit trail (team-scoped)' })
  async listActivity(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.listActivity(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Attachments (private S3) ─────────────────────────────────────────────────

  @Get('tickets/:id/attachments')
  @ApiOperation({ summary: 'List a ticket private attachments (team-scoped)' })
  async listAttachments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.listAttachments(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('tickets/:id/attachments')
  @ApiOperation({ summary: 'Upload a private attachment to a ticket (multipart)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body('title') title?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.cs.createAttachment(id, file, title, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('tickets/:id/attachments/:attachmentId/link')
  @ApiOperation({ summary: 'Short-lived signed download URL for a ticket attachment' })
  async getAttachmentLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.cs.getAttachmentDownloadUrl(id, attachmentId, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('tickets/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'Delete a ticket attachment (team-scoped; removes the stored file)' })
  async removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.cs.removeAttachment(id, attachmentId, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Customers (CRM contacts + service rollups) ───────────────────────────────

  @Get('customers')
  @ApiOperation({ summary: 'List customers (CRM contacts + ticket rollups, team-scoped)' })
  async listCustomers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cs.findAllCustomers(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search,
      page,
      limit,
    });
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Customer profile + ticket history (team-scoped)' })
  async getCustomer(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.findOneCustomer(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Knowledge Base ───────────────────────────────────────────────────────────

  @Get('kb/articles')
  @ApiOperation({ summary: 'List Knowledge Base articles (paginated, filterable, team-scoped)' })
  async listArticles(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cs.findAllArticles(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search,
      status,
      category,
      page,
      limit,
    });
  }

  @Post('kb/articles')
  @ApiOperation({ summary: 'Create a Knowledge Base article' })
  async createArticle(@Body() dto: CreateCsArticleDto, @CurrentUser() user: any) {
    return this.cs.createArticle(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('kb/articles/:id')
  @ApiOperation({ summary: 'Get one Knowledge Base article (team-scoped)' })
  async getArticle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.findOneArticle(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('kb/articles/:id')
  @ApiOperation({ summary: 'Update a Knowledge Base article (publish/unpublish/archive)' })
  async updateArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateArticle(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('kb/articles/:id')
  @ApiOperation({ summary: 'Delete a Knowledge Base article (team-scoped)' })
  async removeArticle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeArticle(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── SLA policies + recompute ─────────────────────────────────────────────────

  @Get('sla/policies')
  @ApiOperation({ summary: 'List SLA policies (team-scoped)' })
  async listSlaPolicies(@CurrentUser() user: any) {
    return this.cs.findAllSlaPolicies(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('sla/policies')
  @ApiOperation({ summary: 'Create an SLA policy' })
  async createSlaPolicy(@Body() dto: CreateCsSlaPolicyDto, @CurrentUser() user: any) {
    return this.cs.createSlaPolicy(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('sla/policies/:id')
  @ApiOperation({ summary: 'Update an SLA policy (team-scoped)' })
  async updateSlaPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsSlaPolicyDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateSlaPolicy(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('sla/policies/:id')
  @ApiOperation({ summary: 'Delete an SLA policy (team-scoped)' })
  async removeSlaPolicy(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeSlaPolicy(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('sla/recompute')
  @ApiOperation({ summary: 'Re-derive SLA state for open tickets from policies + timestamps (idempotent)' })
  async recomputeSla(@CurrentUser() user: any) {
    return this.cs.recomputeSla(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Escalation rules ─────────────────────────────────────────────────────────

  @Get('escalations')
  @ApiOperation({ summary: 'List escalation rules (team-scoped)' })
  async listEscalations(@CurrentUser() user: any) {
    return this.cs.findAllEscalations(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('escalations')
  @ApiOperation({ summary: 'Create an escalation rule' })
  async createEscalation(@Body() dto: CreateCsEscalationDto, @CurrentUser() user: any) {
    return this.cs.createEscalation(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('escalations/:id')
  @ApiOperation({ summary: 'Update an escalation rule (team-scoped)' })
  async updateEscalation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsEscalationDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateEscalation(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('escalations/:id')
  @ApiOperation({ summary: 'Delete an escalation rule (team-scoped)' })
  async removeEscalation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeEscalation(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Automation rules ─────────────────────────────────────────────────────────

  @Get('automations')
  @ApiOperation({ summary: 'List automation rules (team-scoped)' })
  async listAutomations(@CurrentUser() user: any) {
    return this.cs.findAllAutomations(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Post('automations')
  @ApiOperation({ summary: 'Create an automation rule' })
  async createAutomation(@Body() dto: CreateCsAutomationDto, @CurrentUser() user: any) {
    return this.cs.createAutomation(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('automations/:id')
  @ApiOperation({ summary: 'Update an automation rule (team-scoped)' })
  async updateAutomation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsAutomationDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateAutomation(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('automations/:id')
  @ApiOperation({ summary: 'Delete an automation rule (team-scoped)' })
  async removeAutomation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeAutomation(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Surveys + Customer Satisfaction ──────────────────────────────────────────

  @Get('surveys')
  @ApiOperation({ summary: 'List satisfaction surveys (paginated, filterable, team-scoped)' })
  async listSurveys(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cs.findAllSurveys(user.id, user.teamId ?? null, user.role ?? 'owner', { status, page, limit });
  }

  @Post('surveys')
  @ApiOperation({ summary: 'Send / record a satisfaction survey (ticket + customer scoped)' })
  async createSurvey(@Body() dto: CreateCsSurveyDto, @CurrentUser() user: any) {
    return this.cs.createSurvey(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('surveys/:id')
  @ApiOperation({ summary: 'Get one survey (team-scoped)' })
  async getSurvey(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.findOneSurvey(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('surveys/:id')
  @ApiOperation({ summary: 'Record a survey response (rating + comment) or update (team-scoped)' })
  async updateSurvey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsSurveyDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateSurvey(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('surveys/:id')
  @ApiOperation({ summary: 'Delete a survey (team-scoped)' })
  async removeSurvey(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeSurvey(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  // ─── Reports ──────────────────────────────────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'Customer Service analytics (real data, optional date range, team-scoped)' })
  async reports(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.cs.getReports(user.id, user.teamId ?? null, user.role ?? 'owner', { from, to });
  }

  // ─── AI assist (tenant-isolated retrieval) ────────────────────────────────────

  @Get('ai/knowledge-search')
  @ApiOperation({ summary: "Tenant-isolated KB retrieval for AI answering (this account's published articles only)" })
  async aiKnowledgeSearch(
    @CurrentUser() user: any,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cs.aiSearchKnowledge(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      query,
      limit ? Number(limit) : 5,
    );
  }
}
