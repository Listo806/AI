import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentInstagramConnectionService } from './agent-instagram-connection.service';

@ApiTags('agent-instagram')
@Controller('agent/instagram')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class AgentInstagramController {
  constructor(private readonly connections: AgentInstagramConnectionService) {}

  @Get('auth-url')
  @ApiOperation({
    summary: 'Get Instagram OAuth URL',
    description: 'Returns Meta OAuth URL. Redirect user to this URL to connect Instagram (Business/Creator linked to a Facebook Page). After auth, Meta redirects to GET /api/instagram/callback.',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth URL',
    schema: { example: { url: 'https://www.facebook.com/v18.0/dialog/oauth?client_id=...' } },
  })
  @ApiResponse({ status: 400, description: 'Instagram (Meta) not configured' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getAuthUrl(@CurrentUser() user: any) {
    const url = this.connections.getAuthUrl(user.id);
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
}
