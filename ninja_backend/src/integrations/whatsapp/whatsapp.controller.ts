import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WhatsAppService, SendMessageDto, SendTemplateDto } from './whatsapp.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('integrations/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send')
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    try {
      const result = await this.whatsappService.sendMessage(sendMessageDto);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Post('send-template')
  async sendTemplate(@Body() sendTemplateDto: SendTemplateDto) {
    try {
      const result = await this.whatsappService.sendTemplate(sendTemplateDto);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Get('status/:messageId')
  async getMessageStatus(@Param('messageId') messageId: string) {
    try {
      const status = await this.whatsappService.getMessageStatus(messageId);
      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Get('config/status')
  async getConfigStatus() {
    return this.whatsappService.getConfigStatus();
  }
}

