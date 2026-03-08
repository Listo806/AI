import { Controller, Post, Body, Get, Req, Res, HttpCode, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InstagramDmService } from './instagram-dm.service';
import { SendInstagramDmDto } from './dto/send-instagram-dm.dto';
import { InstagramWebhookService } from './instagram-webhook.service';
import { AgentInstagramConnectionService } from './agent-instagram-connection.service';

@ApiTags('instagram')
@Controller('instagram')
export class InstagramController {
  constructor(
    private readonly instagramDm: InstagramDmService,
    private readonly webhookService: InstagramWebhookService,
    private readonly instagramConnections: AgentInstagramConnectionService,
  ) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send Instagram DM to a lead', description: 'Requires agent Instagram connected and lead.instagram_id set. Per-lead, per-action.' })
  @ApiBody({ type: SendInstagramDmDto })
  @ApiResponse({ status: 200, description: 'Message sent', schema: { example: { success: true, data: { messageId: 'mid.xxx' } } } })
  @ApiResponse({ status: 400, description: 'Bad request (e.g. Instagram not connected, lead has no Instagram ID)' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async send(@Body() dto: SendInstagramDmDto, @CurrentUser() user: any) {
    const result = await this.instagramDm.sendForLead(dto.leadId, dto.message, user.id, user.teamId);
    return { success: true, data: result };
  }

  @Get('callback')
  @ApiOperation({
    summary: 'OAuth callback (Meta redirect)',
    description: 'Meta redirects here after user authorizes. Exchanges code for token, stores connection, redirects to FRONTEND_URL/dashboard/instagram?instagram=connected. No auth required.',
  })
  @ApiQuery({ name: 'code', required: true, description: 'OAuth authorization code from Meta' })
  @ApiQuery({ name: 'state', required: true, description: 'State (base64 agent id) from auth URL' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend' })
  @ApiResponse({ status: 400, description: 'Invalid code or state' })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.instagramConnections.handleCallback(code || '', state || '');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const base = frontendUrl.split(',')[0].trim();
    return res.redirect(302, `${base.replace(/\/$/, '')}/dashboard/instagram?instagram=connected`);
  }

  @Get('webhook')
  @ApiOperation({
    summary: 'Webhook verification (Meta)',
    description: 'Meta sends GET with hub.mode, hub.verify_token, hub.challenge. Return hub.challenge if token matches META_WEBHOOK_VERIFY_TOKEN. No auth.',
  })
  @ApiQuery({ name: 'hub.mode', description: 'subscribe' })
  @ApiQuery({ name: 'hub.verify_token', description: 'Must match META_WEBHOOK_VERIFY_TOKEN' })
  @ApiQuery({ name: 'hub.challenge', description: 'Echo back on success' })
  @ApiResponse({ status: 200, description: 'Challenge string' })
  @ApiResponse({ status: 403, description: 'Verify token mismatch' })
  async webhookVerify(@Req() req: Request, @Res() res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const result = this.webhookService.verify(mode as string, token as string, challenge as string);
    if (result !== null) return res.status(200).send(result);
    return res.status(403).end();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook events (Meta)',
    description: 'Meta sends POST with Instagram messaging events. Resolves agent/lead, stores inbound DMs in lead_messages. No auth.',
  })
  @ApiResponse({ status: 200, description: 'Accepted' })
  async webhook(@Req() req: Request, @Res() res: Response) {
    const raw = req.body;
    await this.webhookService.handle(raw);
    return res.status(200).end();
  }
}
