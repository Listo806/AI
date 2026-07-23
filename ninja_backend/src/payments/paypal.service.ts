import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../config/config.service';

// Subscription pricing (USD): a one-time setup fee charged at signup, then a
// 14-day free trial, then the selected plan every month.
export const PAYPAL_SETUP_FEE = '97';
export const PAYPAL_TRIAL_DAYS = 14;
export const PAYPAL_PLAN_PRICES: Record<string, string> = {
  solo: '197',
  team: '347',
  growth: '497',
};

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private accessToken: string | null = null;
  private accessTokenExpiry: Date | null = null;
  private axiosInstance: AxiosInstance | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    const mode = this.configService.get('PAYPAL_MODE') || 'sandbox';
    return mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  isConfigured(): boolean {
    return Boolean(
      this.configService.get('PAYPAL_CLIENT_ID') &&
        this.configService.get('PAYPAL_CLIENT_SECRET'),
    );
  }

  // Read credentials lazily so a missing key never crashes app boot.
  private getCredentials(): { clientId: string; clientSecret: string } {
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new Error(
        'PayPal is not configured (missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET)',
      );
    }
    return { clientId, clientSecret };
  }

  private api(): AxiosInstance {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return this.axiosInstance;
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.accessTokenExpiry &&
      new Date() < this.accessTokenExpiry
    ) {
      return this.accessToken;
    }

    const { clientId, clientSecret } = this.getCredentials();
    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 32400; // ~9 hours
      this.accessTokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
      return this.accessToken;
    } catch (error: any) {
      this.logger.error(
        'Failed to get PayPal access token',
        error.response?.data || error.message,
      );
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  private async authHeader() {
    const token = await this.getAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  // --- One-time plan setup (creates the product + one plan per tier) ---

  async createProduct(): Promise<string> {
    const res = await this.api().post(
      '/v1/catalogs/products',
      {
        name: 'CORTEXA AI Revenue OS',
        description: 'CORTEXA AI Revenue OS subscription',
        type: 'SERVICE',
        category: 'SOFTWARE',
      },
      { headers: await this.authHeader() },
    );
    return res.data.id;
  }

  async createPlan(
    productId: string,
    tierName: string,
    monthlyPrice: string,
  ): Promise<string> {
    const res = await this.api().post(
      '/v1/billing/plans',
      {
        product_id: productId,
        name: `CORTEXA ${tierName} Plan`,
        description: `CORTEXA ${tierName}: $${PAYPAL_SETUP_FEE} setup fee at signup, ${PAYPAL_TRIAL_DAYS}-day free trial, then $${monthlyPrice}/month.`,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'DAY',
              interval_count: PAYPAL_TRIAL_DAYS,
            },
            tenure_type: 'TRIAL',
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: { value: '0', currency_code: 'USD' },
            },
          },
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 2,
            total_cycles: 0, // 0 = until cancelled
            pricing_scheme: {
              fixed_price: { value: monthlyPrice, currency_code: 'USD' },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: { value: PAYPAL_SETUP_FEE, currency_code: 'USD' },
          setup_fee_failure_action: 'CANCEL',
          payment_failure_threshold: 3,
        },
      },
      { headers: await this.authHeader() },
    );
    return res.data.id;
  }

  // Creates the product + a plan per tier. Returns the ids to store as env
  // vars (PAYPAL_PLAN_SOLO / PAYPAL_PLAN_TEAM / PAYPAL_PLAN_GROWTH).
  async setupPlans(): Promise<Record<string, string>> {
    const productId = await this.createProduct();
    const result: Record<string, string> = { productId };
    for (const [tier, price] of Object.entries(PAYPAL_PLAN_PRICES)) {
      const label = tier.charAt(0).toUpperCase() + tier.slice(1);
      result[tier] = await this.createPlan(productId, label, price);
    }
    return result;
  }

  // --- Subscription management ---

  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await this.api().get(
        `/v1/billing/subscriptions/${subscriptionId}`,
        { headers: await this.authHeader() },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get subscription ${subscriptionId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    reason?: string,
  ): Promise<void> {
    try {
      await this.api().post(
        `/v1/billing/subscriptions/${subscriptionId}/cancel`,
        reason ? { reason } : {},
        { headers: await this.authHeader() },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to cancel subscription ${subscriptionId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async suspendSubscription(
    subscriptionId: string,
    reason?: string,
  ): Promise<void> {
    try {
      await this.api().post(
        `/v1/billing/subscriptions/${subscriptionId}/suspend`,
        reason ? { reason } : {},
        { headers: await this.authHeader() },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to suspend subscription ${subscriptionId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async reactivateSubscription(
    subscriptionId: string,
    reason?: string,
  ): Promise<void> {
    try {
      await this.api().post(
        `/v1/billing/subscriptions/${subscriptionId}/activate`,
        reason ? { reason } : {},
        { headers: await this.authHeader() },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to reactivate subscription ${subscriptionId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async verifyWebhook(headers: any, body: any): Promise<boolean> {
    try {
      const webhookId = this.configService.get('PAYPAL_WEBHOOK_ID');
      if (!webhookId) {
        this.logger.warn(
          'PAYPAL_WEBHOOK_ID not set, skipping webhook verification',
        );
        return true;
      }
      const response = await this.api().post(
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
        { headers: await this.authHeader() },
      );
      return response.data.verification_status === 'SUCCESS';
    } catch (error: any) {
      this.logger.error(
        'Webhook verification failed',
        error.response?.data || error.message,
      );
      return process.env.NODE_ENV !== 'production';
    }
  }
}
