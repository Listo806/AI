import { Body, Controller, HttpCode, HttpStatus, Post, Req, Headers } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SiteAssistService } from './site-assist.service';
import { SiteAssistTurnDto } from './dto/site-assist-turn.dto';
import { SiteAssistTurnResponse } from './site-assist.types';

@ApiTags('public-site-assist')
@Controller('public/site-assist')
export class SiteAssistController {
  constructor(private readonly siteAssist: SiteAssistService) {}

  @Post('turn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Site Assist turn (Webflow widget; anonymous session + message log)',
    description:
      'First call: omit sessionId — creates session (stores client IP + User-Agent for abuse control), returns welcome + buttons. Later: send sessionId with message and/or actionId. Optional header X-Site-Assist-Key if SITE_ASSIST_API_KEY is set.',
  })
  @ApiHeader({ name: 'X-Site-Assist-Key', required: false })
  @ApiResponse({ status: 200, description: 'Assistant turn' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 404, description: 'Unknown session' })
  async turn(
    @Body() dto: SiteAssistTurnDto,
    @Req() req: Request,
    @Headers('x-site-assist-key') apiKey?: string,
  ): Promise<SiteAssistTurnResponse> {
    const forwarded = req.headers['x-forwarded-for'];
    const fromForwarded =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : '';
    const clientIp = fromForwarded || req.ip || req.socket?.remoteAddress || '';
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';
    return this.siteAssist.handleTurn(dto, clientIp, userAgent, apiKey);
  }
}
