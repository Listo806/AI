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
  @ApiOperation({ summary: 'Get Instagram OAuth URL for connect' })
  @ApiResponse({ status: 200, description: 'URL to redirect user to' })
  @ApiResponse({ status: 400, description: 'Instagram not configured' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getAuthUrl(@CurrentUser() user: any) {
    const url = this.connections.getAuthUrl(user.id);
    return { url };
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect Instagram' })
  @ApiResponse({ status: 200, description: 'Disconnected' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async disconnect(@CurrentUser() user: any) {
    await this.connections.disconnect(user.id);
    return { success: true };
  }

  @Get()
  @ApiOperation({ summary: 'Get Instagram connection status' })
  @ApiResponse({ status: 200, description: 'Status' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getStatus(@CurrentUser() user: any) {
    const status = await this.connections.getStatus(user.id);
    return { data: status };
  }
}
