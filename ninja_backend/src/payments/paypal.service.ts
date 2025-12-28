import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private accessTokenExpiry: Date | null = null;
  private axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const mode = this.configService.get('PAYPAL_MODE') || 'sandbox';
    this.baseUrl = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    
    this.clientId = this.configService.getRequired('PAYPAL_CLIENT_ID');
    this.clientSecret = this.configService.getRequired('PAYPAL_CLIENT_SECRET');

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.accessTokenExpiry && new Date() < this.accessTokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      const expiresIn = response.data.expires_in || 32400; // Default 9 hours
      this.accessTokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);

      return this.accessToken;
    } catch (error: any) {
      this.logger.error('Failed to get PayPal access token', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await this.axiosInstance.get(
        `/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get subscription ${subscriptionId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await this.axiosInstance.post(
        `/v1/billing/subscriptions/${subscriptionId}/cancel`,
        reason ? { reason } : {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription ${subscriptionId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await this.axiosInstance.post(
        `/v1/billing/subscriptions/${subscriptionId}/suspend`,
        reason ? { reason } : {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      this.logger.error(`Failed to suspend subscription ${subscriptionId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async reactivateSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await this.axiosInstance.post(
        `/v1/billing/subscriptions/${subscriptionId}/activate`,
        reason ? { reason } : {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      this.logger.error(`Failed to reactivate subscription ${subscriptionId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async verifyWebhook(headers: any, body: any): Promise<boolean> {
    // PayPal webhook verification
    // In production, you should verify the webhook signature
    // For now, we'll return true (implement proper verification in production)
    try {
      const token = await this.getAccessToken();
      const webhookId = this.configService.get('PAYPAL_WEBHOOK_ID');
      
      if (!webhookId) {
        this.logger.warn('PAYPAL_WEBHOOK_ID not set, skipping webhook verification');
        return true; // Allow in development
      }

      // Verify webhook signature
      const response = await this.axiosInstance.post(
        '/v1/notifications/verify-webhook-signature',
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: body,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      return response.data.verification_status === 'SUCCESS';
    } catch (error: any) {
      this.logger.error('Webhook verification failed', error.response?.data || error.message);
      // In development, allow webhooks even if verification fails
      return process.env.NODE_ENV !== 'production';
    }
  }
}

