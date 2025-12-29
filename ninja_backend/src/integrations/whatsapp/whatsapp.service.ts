import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../../config/config.service';

export interface SendMessageDto {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  message: string;
}

export interface SendTemplateDto {
  to: string;
  templateName: string;
  languageCode?: string; // Default: 'en'
  parameters?: string[]; // Template parameters
}

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: Date;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly phoneId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly axiosInstance: AxiosInstance;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.phoneId = this.configService.get('WHATSAPP_PHONE_ID') || '';
    this.accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN') || '';
    this.apiVersion = this.configService.get('WHATSAPP_API_VERSION') || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    if (this.phoneId && this.accessToken) {
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      this.isConfigured = true;
      this.logger.log('WhatsApp Business API configured');
    } else {
      this.logger.warn(
        'WhatsApp Business API not configured. ' +
        'Required: WHATSAPP_PHONE_ID, WHATSAPP_ACCESS_TOKEN'
      );
      this.isConfigured = false;
    }
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendMessage(dto: SendMessageDto): Promise<{ messageId: string; status: string }> {
    if (!this.isConfigured) {
      throw new BadRequestException('WhatsApp service is not configured');
    }

    // Validate phone number format (E.164)
    if (!/^\+[1-9]\d{1,14}$/.test(dto.to)) {
      throw new BadRequestException(
        'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
      );
    }

    try {
      const response = await this.axiosInstance.post(
        `/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: dto.to,
          type: 'text',
          text: {
            preview_url: false,
            body: dto.message,
          },
        },
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`WhatsApp message sent: ${messageId} to ${dto.to}`);

      return {
        messageId,
        status: 'sent',
      };
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.response?.data);
      throw new BadRequestException(
        error.response?.data?.error?.message || 'Failed to send WhatsApp message'
      );
    }
  }

  /**
   * Send a template message via WhatsApp
   * Templates must be approved by Meta before use
   */
  async sendTemplate(dto: SendTemplateDto): Promise<{ messageId: string; status: string }> {
    if (!this.isConfigured) {
      throw new BadRequestException('WhatsApp service is not configured');
    }

    // Validate phone number format
    if (!/^\+[1-9]\d{1,14}$/.test(dto.to)) {
      throw new BadRequestException(
        'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
      );
    }

    const languageCode = dto.languageCode || 'en';
    const components: any[] = [];

    // Add parameters if provided
    if (dto.parameters && dto.parameters.length > 0) {
      components.push({
        type: 'body',
        parameters: dto.parameters.map((param) => ({
          type: 'text',
          text: param,
        })),
      });
    }

    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: dto.to,
        type: 'template',
        template: {
          name: dto.templateName,
          language: {
            code: languageCode,
          },
        },
      };

      if (components.length > 0) {
        payload.template.components = components;
      }

      const response = await this.axiosInstance.post(
        `/${this.phoneId}/messages`,
        payload,
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`WhatsApp template sent: ${messageId} to ${dto.to}`);

      return {
        messageId,
        status: 'sent',
      };
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp template: ${error.message}`, error.response?.data);
      throw new BadRequestException(
        error.response?.data?.error?.message || 'Failed to send WhatsApp template'
      );
    }
  }

  /**
   * Get message status (requires webhook setup for real-time status)
   * This is a placeholder - actual status comes from webhooks
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    if (!this.isConfigured) {
      throw new BadRequestException('WhatsApp service is not configured');
    }

    // Note: WhatsApp doesn't provide a direct API to check message status
    // Status updates come via webhooks. This endpoint is for future webhook integration.
    // For now, we return a placeholder response.
    
    this.logger.warn(
      'Message status check requested. ' +
      'Implement webhook handler to track real-time message status.'
    );

    return {
      messageId,
      status: 'sent', // Placeholder - implement webhook tracking for real status
    };
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement webhook signature verification
    // This is a placeholder - implement according to Meta's webhook verification docs
    this.logger.warn('Webhook signature verification not implemented');
    return true;
  }

  /**
   * Get configuration status (for debugging)
   */
  getConfigStatus() {
    return {
      isConfigured: this.isConfigured,
      hasPhoneId: !!this.phoneId,
      hasAccessToken: !!this.accessToken,
      apiVersion: this.apiVersion,
      phoneIdPrefix: this.phoneId ? `${this.phoneId.substring(0, 4)}...` : 'not set',
    };
  }
}

