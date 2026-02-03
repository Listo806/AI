import { Controller, Get, Post, Body, Param, Req, Res, HttpCode, HttpStatus, UseGuards, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { SendWhatsAppDto } from './dto/send-whatsapp.dto';
import { WhatsAppInboundService } from './whatsapp-inbound.service';
import { ConversationsService } from './conversations.service';
import { LeadMessagesService } from './lead-messages.service';
import { WhatsAppCardsService } from './whatsapp-cards.service';
import { WhatsAppActionsService } from './whatsapp-actions.service';
import { IntentEventsService } from './intent-events.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsapp: TwilioWhatsAppService,
    private readonly inboundHandler: WhatsAppInboundService,
    private readonly conversations: ConversationsService,
    private readonly leadMessages: LeadMessagesService,
    private readonly cards: WhatsAppCardsService,
    private readonly actions: WhatsAppActionsService,
    private readonly intents: IntentEventsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Req() req: Request, @Res() res: Response) {
    const payload = (req.body || {}) as Record<string, string>;
    const twiml = await this.inboundHandler.handleInbound(payload);
    res.set('Content-Type', 'text/xml');
    return res.send(twiml);
  }

  @Post('inbound')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async inbound(@Req() req: Request, @Res() res: Response) {
    const payload = (req.body || {}) as Record<string, string>;
    const twiml = await this.inboundHandler.handleInbound(payload);
    res.set('Content-Type', 'text/xml');
    return res.send(twiml);
  }

  @Post('status-callback')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async statusCallback(@Req() req: Request, @Res() res: Response) {
    const payload = (req.body || {}) as Record<string, string>;
    const messageSid = payload.MessageSid;
    const messageStatus = payload.MessageStatus;
    if (messageSid) await this.whatsapp.handleStatusCallback(messageSid, messageStatus || '');
    return res.status(200).end();
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send WhatsApp message to a lead' })
  @ApiBody({ type: SendWhatsAppDto })
  @ApiResponse({ status: 200, description: 'Message sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async send(@Body() dto: SendWhatsAppDto, @CurrentUser() user: any) {
    const result = await this.whatsapp.sendForLead(
      { leadId: dto.leadId, message: dto.message, senderType: dto.senderType },
      user.id,
      user.teamId,
    );
    return { success: true, data: result };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List WhatsApp conversations for team' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async listConversations(@Req() req: Request, @CurrentUser() user: any) {
    const status = (req.query.status as string) || undefined;
    const ownership = (req.query.ownership as string) || undefined;
    const list = await this.conversations.listForTeam(user.teamId, {
      status: status as any,
      ownership: ownership as any,
    });
    return { data: list };
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Messages' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationMessages(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      await this.conversations.assertTeamAccess(id, user.teamId);
    } catch {
      throw new NotFoundException('Conversation not found');
    }
    const messages = await this.leadMessages.findByConversation(id);
    return { data: messages };
  }

  @Post('conversations/:id/send')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent sends message; sets ownership to human' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiBody({ schema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } })
  @ApiResponse({ status: 200, description: 'Message sent' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendConversationMessage(@Param('id') id: string, @Body() body: { message: string }, @CurrentUser() user: any) {
    let conv;
    try {
      conv = await this.conversations.assertTeamAccess(id, user.teamId);
    } catch {
      throw new NotFoundException('Conversation not found');
    }
    await this.conversations.updateOwnership(id, 'human');
    await this.conversations.advanceStage(id, 'escalated');
    const result = await this.whatsapp.sendForLead(
      { leadId: conv.lead_id, message: body.message, senderType: 'agent', conversationId: id },
      user.id,
      user.teamId,
    );
    return { success: true, data: result };
  }

  @Post('conversations/:id/toggle-ai')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable AI for conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiBody({ schema: { type: 'object', properties: { aiEnabled: { type: 'boolean' } }, required: ['aiEnabled'] } })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async toggleAi(@Param('id') id: string, @Body() body: { aiEnabled: boolean }, @CurrentUser() user: any) {
    try {
      await this.conversations.assertTeamAccess(id, user.teamId);
    } catch {
      throw new NotFoundException('Conversation not found');
    }
    await this.conversations.setAiEnabled(id, body.aiEnabled);
    if (body.aiEnabled === false) {
      await this.conversations.advanceStage(id, 'escalated');
    }
    return { success: true, aiEnabled: body.aiEnabled };
  }

  @Post('send/property-card')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send structured property card to conversation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', format: 'uuid' },
        propertyId: { type: 'string', format: 'uuid' },
        senderType: { type: 'string', enum: ['platform', 'agent'] },
      },
      required: ['conversationId', 'propertyId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Card sent' })
  @ApiResponse({ status: 404, description: 'Conversation or property not found' })
  async sendPropertyCard(
    @Body() body: { conversationId: string; propertyId: string; senderType?: 'platform' | 'agent' },
    @CurrentUser() user: any,
  ) {
    const senderType = body.senderType ?? 'agent';
    const result = await this.cards.sendPropertyCard(
      body.conversationId,
      body.propertyId,
      senderType,
      user.id,
      user.teamId,
    );
    return { success: true, data: result };
  }

  @Post('action')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive button click payload; log and apply side effects' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', format: 'uuid' },
        leadId: { type: 'string', format: 'uuid' },
        actionType: { type: 'string' },
        payload: { type: 'object' },
      },
      required: ['actionType'],
    },
  })
  @ApiResponse({ status: 200, description: 'Action logged' })
  async handleAction(
    @Body() body: { conversationId?: string; leadId?: string; actionType: string; payload?: Record<string, unknown> },
    @CurrentUser() user: any,
  ) {
    if (body.conversationId) {
      await this.conversations.assertTeamAccess(body.conversationId, user.teamId);
    }
    await this.actions.handleAction({
      conversationId: body.conversationId,
      leadId: body.leadId,
      actionType: body.actionType,
      payload: body.payload,
    });
    return { success: true };
  }

  @Get('conversations/:id/intents')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List intent events for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async listIntents(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      await this.conversations.assertTeamAccess(id, user.teamId);
    } catch {
      throw new NotFoundException('Conversation not found');
    }
    const data = await this.intents.listForConversation(id);
    return { data };
  }
}
