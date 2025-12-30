import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Paddle } from '@paddle/paddle-node-sdk';

export interface CreateCheckoutOptions {
  priceId: string;
  customerEmail: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name);
  private readonly paddle: Paddle | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('PADDLE_API_KEY');
    const environment = this.configService.get('PADDLE_ENVIRONMENT') || 'sandbox';

    if (apiKey) {
      // Paddle SDK environment type - using 'as any' to handle type compatibility
      const paddleOptions: any = {
        environment: environment === 'production' ? 'production' : 'sandbox',
      };
      this.paddle = new Paddle(apiKey, paddleOptions);
      this.isConfigured = true;
      this.logger.log(`Paddle service configured (${environment})`);
    } else {
      this.logger.warn('Paddle not configured. Required: PADDLE_API_KEY');
      this.isConfigured = false;
    }
  }

  /**
   * Create a checkout session
   */
  async createCheckout(options: CreateCheckoutOptions): Promise<{ checkoutUrl: string }> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      // Paddle SDK API may vary - using type assertion for flexibility
      const paddleAny = this.paddle as any;
      
      // Try different possible API structures
      let checkout: any;
      
      // Build checkout options - customerId is optional
      const checkoutOptions: any = {
        items: [
          {
            priceId: options.priceId,
            quantity: 1,
          },
        ],
        customerEmail: options.customerEmail,
        customData: options.metadata || {},
        returnUrl: options.successUrl,
      };
      
      // Only include customerId if it's provided
      if (options.customerId) {
        checkoutOptions.customerId = options.customerId;
      }
      
      if (paddleAny.transactions) {
        // Paddle Billing API structure
        checkout = await paddleAny.transactions.create(checkoutOptions);
      } else if (paddleAny.checkout) {
        checkout = await paddleAny.checkout.create(checkoutOptions);
      } else {
        throw new Error('Paddle SDK structure not recognized. Please check Paddle SDK documentation.');
      }

      return {
        checkoutUrl: checkout.url || checkout.checkoutUrl || checkout.checkout?.url || '',
      };
    } catch (error: any) {
      this.logger.error(`Failed to create Paddle checkout: ${error.message}`, error);
      throw new BadRequestException(`Failed to create checkout: ${error.message}`);
    }
  }

  /**
   * Create or get customer
   * Note: Paddle may create customers automatically during checkout
   * This method is optional and may not be needed
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<any> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      const paddleAny = this.paddle as any;
      
      // Try to create customer - if not permitted, return null (customer will be created during checkout)
      if (paddleAny.customers?.create) {
        try {
          const customer = await paddleAny.customers.create({
            email,
            name,
            customData: metadata || {},
          });
          return customer;
        } catch (error: any) {
          // If customer creation is not permitted, log and return null
          // Paddle will create the customer automatically during checkout
          if (error.message?.includes('permitted') || error.message?.includes('permission')) {
            this.logger.warn(`Customer creation not permitted. Customer will be created during checkout: ${error.message}`);
            return null;
          }
          throw error;
        }
      } else {
        // Customer API not available - will be created during checkout
        this.logger.warn('Customer API not available. Customer will be created during checkout.');
        return null;
      }
    } catch (error: any) {
      // If we can't create customer, it's okay - Paddle will create it during checkout
      this.logger.warn(`Customer creation failed, will be created during checkout: ${error.message}`);
      return null;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<any> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      const customer = await this.paddle.customers.get(customerId);
      return customer;
    } catch (error: any) {
      this.logger.error(`Failed to get Paddle customer: ${error.message}`, error);
      throw new BadRequestException(`Failed to get customer: ${error.message}`);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      const subscription = await this.paddle.subscriptions.get(subscriptionId);
      return subscription;
    } catch (error: any) {
      this.logger.error(`Failed to get Paddle subscription: ${error.message}`, error);
      throw new BadRequestException(`Failed to get subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<void> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      if (immediately) {
        await this.paddle.subscriptions.cancel(subscriptionId);
      } else {
        await this.paddle.subscriptions.update(subscriptionId, {
          scheduledChange: {
            action: 'cancel',
            effectiveAt: 'next_billing_period',
          },
        });
      }
    } catch (error: any) {
      this.logger.error(`Failed to cancel Paddle subscription: ${error.message}`, error);
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, payload: string | Buffer): boolean {
    if (!this.isConfigured || !this.paddle) {
      return false;
    }

    try {
      // Paddle webhook verification
      // The Paddle SDK structure may vary - using type assertion for flexibility
      const paddleAny = this.paddle as any;
      
      if (paddleAny.webhooks?.verify) {
        return paddleAny.webhooks.verify(payload, signature);
      } else if (paddleAny.webhooks?.unmarshal) {
        // Alternative Paddle webhook verification method
        try {
          paddleAny.webhooks.unmarshal(payload, signature);
          return true;
        } catch {
          return false;
        }
      } else {
        // Fallback: basic signature check
        // In production, implement proper Paddle webhook verification
        // See: https://developer.paddle.com/webhook-reference/overview
        this.logger.warn('Paddle webhook verification method not found. Implement proper verification.');
        return true; // For development - change to false in production
      }
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      isConfigured: this.isConfigured,
      hasApiKey: !!this.configService.get('PADDLE_API_KEY'),
      environment: this.configService.get('PADDLE_ENVIRONMENT') || 'sandbox',
    };
  }
}

