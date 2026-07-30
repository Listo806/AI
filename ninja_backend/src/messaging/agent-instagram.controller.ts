import { Controller, Get, Delete, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentInstagramConnectionService } from './agent-instagram-connection.service';
import { LeadMessagesService } from './lead-messages.service';
import { DatabaseService } from '../database/database.service';

@ApiTags('agent-instagram')
@Controller('agent/instagram')
@UseGuards(JwtAuthGuard, CrmAccessGuard, PaymentGuard)
@ApiBearerAuth('JWT-auth')
export class AgentInstagramController {
  constructor(
    private readonly connections: AgentInstagramConnectionService,
    private readonly leadMessages: LeadMessagesService,
    private readonly db: DatabaseService,
  ) {}

  @Get('callback-url')
  @ApiOperation({ summary: 'Get OAuth callback URL to add in Meta app' })
  @ApiResponse({ status: 200, schema: { example: { callbackUrl: 'https://api.example.com/api/instagram/callback' } } })
  async getCallbackUrl() {
    const baseUrl = process.env.API_PUBLIC_URL || '';
    const callbackUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/instagram/callback` : '';
    return { callbackUrl };
  }

  @Get('app-settings')
  @ApiOperation({ summary: 'Check if agent has Meta app credentials' })
  @ApiResponse({ status: 200, schema: { example: { hasCredentials: true } } })
  async getAppSettings(@CurrentUser() user: any) {
    const hasCredentials = await this.connections.hasAppSettings(user.id);
    return { hasCredentials };
  }

  @Post('app-settings')
  @ApiOperation({ summary: 'Save Meta app credentials (App ID and App Secret)' })
  @ApiBody({ schema: { type: 'object', properties: { appId: { type: 'string' }, appSecret: { type: 'string' } }, required: ['appId', 'appSecret'] } })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  @ApiResponse({ status: 400, description: 'App ID and App Secret required' })
  async saveAppSettings(@CurrentUser() user: any, @Body() body: { appId?: string; appSecret?: string }) {
    await this.connections.saveAppSettings(user.id, body.appId ?? '', body.appSecret ?? '');
    return { success: true };
  }

  @Get('auth-url')
  @ApiOperation({
    summary: 'Get Instagram OAuth URL',
    description: 'Returns Meta OAuth URL using agent\'s saved Meta app credentials. Redirect user to this URL to connect Instagram.',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth URL',
    schema: { example: { url: 'https://www.facebook.com/v18.0/dialog/oauth?client_id=...' } },
  })
  @ApiResponse({ status: 400, description: 'Add Meta app credentials first or API_PUBLIC_URL not set' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getAuthUrl(@CurrentUser() user: any) {
    const url = await this.connections.getAuthUrl(user.id);
    return { url };
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect Instagram', description: 'Sets agent Instagram connection to disconnected.' })
  @ApiResponse({ status: 200, description: 'Disconnected', schema: { example: { success: true } } })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async disconnect(@CurrentUser() user: any) {
    await this.connections.disconnect(user.id);
    return { success: true };
  }

  @Get()
  @ApiOperation({
    summary: 'Get Instagram connection status',
    description: 'Returns whether the current agent has Instagram connected and optional username.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status',
    schema: {
      example: {
        data: {
          connected: true,
          instagramUsername: 'my_business_ig',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getStatus(@CurrentUser() user: any) {
    const status = await this.connections.getStatus(user.id);
    return { data: status };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List Instagram DM conversations (leads with instagram_id)' })
  @ApiResponse({ status: 200, description: 'List of conversations with last message' })
  async listConversations(@CurrentUser() user: any) {
    const { rows } = await this.db.query(
      `SELECT l.id AS lead_id, l.name, l.instagram_id, l.last_activity_at,
              (SELECT m.body FROM lead_messages m WHERE m.lead_id = l.id AND m.channel = 'instagram_dm' ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT m.created_at FROM lead_messages m WHERE m.lead_id = l.id AND m.channel = 'instagram_dm' ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
       FROM leads l
       WHERE l.instagram_id IS NOT NULL AND l.instagram_id != ''
         AND (l.team_id = $1 OR l.created_by = $2)
       ORDER BY COALESCE(
         (SELECT m.created_at FROM lead_messages m WHERE m.lead_id = l.id AND m.channel = 'instagram_dm' ORDER BY m.created_at DESC LIMIT 1),
         l.last_activity_at,
         l.updated_at,
         l.created_at
       ) DESC NULLS LAST`,
      [user.teamId, user.id],
    );
    const data = rows.map((r: any) => ({
      leadId: r.lead_id,
      name: r.name || 'Unknown',
      instagramId: r.instagram_id,
      lastMessage: r.last_message ?? null,
      lastMessageAt: r.last_message_at ?? r.last_activity_at ?? null,
    }));
    return { data };
  }

  @Get('leads/:leadId/messages')
  @ApiOperation({ summary: 'Get Instagram DM messages for a lead' })
  @ApiResponse({ status: 200, description: 'Messages in chronological order' })
  @ApiResponse({ status: 403, description: 'No access to lead' })
  async getLeadMessages(@CurrentUser() user: any, @Param('leadId') leadId: string) {
    const { rows: leadRows } = await this.db.query(
      `SELECT id FROM leads WHERE id = $1 AND instagram_id IS NOT NULL AND instagram_id != '' AND (team_id = $2 OR created_by = $3)`,
      [leadId, user.teamId, user.id],
    );
    if (!leadRows.length) {
      return { data: [] };
    }
    const messages = await this.leadMessages.findByLead(leadId, 'instagram_dm');
    const data = messages.map((m) => ({
      id: m.id,
      leadId: m.lead_id,
      channel: m.channel,
      direction: m.direction,
      body: m.body,
      senderType: m.sender_type,
      createdAt: m.created_at,
    }));
    return { data };
  }
}
