import { Controller, Post, Delete, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentWhatsAppConnectionService } from './agent-whatsapp-connection.service';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';

@ApiTags('agent-whatsapp')
@Controller('agent/whatsapp')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class AgentWhatsAppController {
  constructor(private readonly connections: AgentWhatsAppConnectionService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect agent WhatsApp (Twilio sub-account)' })
  @ApiBody({ type: ConnectWhatsAppDto })
  @ApiResponse({ status: 200, description: 'Connected' })
  @ApiResponse({ status: 400, description: 'Invalid credentials or E.164' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async connect(@Body() dto: ConnectWhatsAppDto, @CurrentUser() user: any) {
    const status = await this.connections.connect(user.id, {
      twilioSubAccountSid: dto.twilioSubAccountSid,
      twilioAuthToken: dto.twilioAuthToken,
      whatsappNumber: dto.whatsappNumber,
    });
    return { success: true, data: status };
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect agent WhatsApp' })
  @ApiResponse({ status: 200, description: 'Disconnected' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async disconnect(@CurrentUser() user: any) {
    await this.connections.disconnect(user.id);
    return { success: true };
  }

  @Get()
  @ApiOperation({ summary: 'Get agent WhatsApp connection status' })
  @ApiResponse({ status: 200, description: 'Status' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getStatus(@CurrentUser() user: any) {
    const status = await this.connections.getStatus(user.id);
    return { data: status };
  }
}
