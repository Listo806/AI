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
}
