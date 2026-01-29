import { Controller, Post, Body, Get, Req, Res, HttpCode, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Send Instagram DM to a lead' })
  @ApiBody({ type: SendInstagramDmDto })
  @ApiResponse({ status: 200, description: 'Message sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async send(@Body() dto: SendInstagramDmDto, @CurrentUser() user: any) {
    const result = await this.instagramDm.sendForLead(dto.leadId, dto.message, user.id, user.teamId);
    return { success: true, data: result };
  }

  @Get('callback')
  @ApiExcludeEndpoint()
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.instagramConnections.handleCallback(code || '', state || '');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const base = frontendUrl.split(',')[0].trim();
    return res.redirect(302, `${base.replace(/\/$/, '')}/settings?instagram=connected`);
  }

  @Get('webhook')
  @ApiExcludeEndpoint()
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
  @ApiExcludeEndpoint()
  async webhook(@Req() req: Request, @Res() res: Response) {
    const raw = req.body;
    await this.webhookService.handle(raw);
    return res.status(200).end();
  }
}
