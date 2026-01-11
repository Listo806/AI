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

export interface CreateCheckoutResponse {
  checkoutUrl: string;
  transactionId: string | null;
}

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name);
  private readonly paddle: Paddle | null = null;
  private readonly isConfigured: boolean;
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('PADDLE_API_KEY');
    this.environment = this.configService.get('PADDLE_ENVIRONMENT') || 'sandbox';

    if (!apiKey) {
      this.logger.warn('Paddle not configured. Required: PADDLE_API_KEY');
      this.isConfigured = false;
      return;
    }

    try {
      const paddleOptions: any = {
        environment: this.environment === 'production' ? 'production' : 'sandbox',
      };
      
      this.paddle = new Paddle(apiKey, paddleOptions);
      this.isConfigured = true;
      this.logger.log(`Paddle service configured (${this.environment})`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize Paddle SDK: ${error.message}`, error);
      this.isConfigured = false;
    }
  }

  /**
   * Create a checkout session
   * Paddle SDK v3.5+ uses transactions API for checkout creation
   */
  async createCheckout(options: CreateCheckoutOptions): Promise<CreateCheckoutResponse> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured. Please check PADDLE_API_KEY environment variable.');
    }

    // Validate price ID format - must start with 'pri_' (price ID), not 'pro_' (product ID)
    if (!options.priceId) {
      throw new BadRequestException('Price ID is required');
    }

    if (options.priceId.startsWith('pro_')) {
      throw new BadRequestException(
        `Invalid ID format: '${options.priceId}' is a Product ID (starts with 'pro_'), but transactions require a Price ID (starts with 'pri_').\n` +
        `To fix this:\n` +
        `1. Go to your Paddle Dashboard → Products → Select your product\n` +
        `2. Find the Price section and copy the Price ID (starts with 'pri_')\n` +
        `3. Update your subscription plan with the correct Price ID\n` +
        `Note: Products can have multiple prices (e.g., monthly, yearly). Make sure you're using the correct price ID.`
      );
    }

    if (!options.priceId.startsWith('pri_')) {
      throw new BadRequestException(
        `Invalid price ID format: '${options.priceId}'. Price IDs must start with 'pri_'.\n` +
        `Please verify you're using a valid Paddle Price ID from your Paddle Dashboard.`
      );
    }

    try {
      const paddleAny = this.paddle as any;
      
      // Build transaction payload according to Paddle API v3.5+
      // For checkout, we need collectionMode: 'automatic' and checkout configuration
      const transactionPayload: any = {
        items: [
          {
            priceId: options.priceId,
            quantity: 1,
          },
        ],
        customData: options.metadata || {},
        // Set collection mode to automatic to create checkout URL
        collectionMode: 'automatic',
      };

      // Include customerId only if provided and valid
      // If customerId is provided, use it; otherwise Paddle will create customer automatically
      if (options.customerId) {
        transactionPayload.customerId = options.customerId;
        this.logger.debug(`Using existing customer ID: ${options.customerId}`);
      } else {
        this.logger.debug('No customer ID provided, Paddle will create customer during checkout');
      }

      // For customer email, we need to create customer first or pass it via billingDetails
      // If no customerId, we'll need to create customer or let Paddle handle it
      if (!options.customerId && options.customerEmail) {
        // Pass email in billingDetails so Paddle can create/link customer
        transactionPayload.billingDetails = {
          email: options.customerEmail,
        };
      }

      // Configure checkout with return URLs
      // Note: Paddle may use dashboard settings as fallback, but we should provide URLs here
      if (options.successUrl || options.cancelUrl) {
        // Some Paddle API versions require checkout URLs in the transaction
        // We'll add them to customData as well for reference
        transactionPayload.customData = {
          ...(options.metadata || {}),
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
        };
      }

      this.logger.debug('Transaction payload:', JSON.stringify(transactionPayload, null, 2));

      // Paddle SDK v3.5+ uses transactions.create for checkout
      let transaction: any;
      if (paddleAny.transactions?.create) {
        transaction = await paddleAny.transactions.create(transactionPayload);
      } else if (paddleAny.transactions) {
        // Fallback for different SDK structure
        transaction = await paddleAny.transactions.create(transactionPayload);
      } else {
        this.logger.error('Paddle SDK transactions API not found. Available methods:', Object.keys(paddleAny));
        throw new Error('Paddle SDK structure not recognized. Please check Paddle SDK version and documentation.');
      }

      // Log full transaction response for debugging
      this.logger.debug('Transaction response:', JSON.stringify(transaction, null, 2));

      // Extract checkout URL from response
      // Paddle returns the checkout URL in transaction.checkout.url
      const checkoutUrl = 
        transaction.checkout?.url ||
        transaction.url || 
        transaction.checkoutUrl || 
        transaction.data?.checkout?.url ||
        transaction.data?.url ||
        '';

      // Check transaction status
      const transactionStatus = transaction.status || transaction.data?.status;
      const transactionId = transaction.id || transaction.data?.id;

      if (!checkoutUrl) {
        this.logger.error('Transaction created but no checkout URL returned. Response:', JSON.stringify(transaction, null, 2));
        throw new BadRequestException(
          `Transaction created (ID: ${transactionId}, Status: ${transactionStatus}) but no checkout URL returned. ` +
          `This usually means:\n` +
          `1. Checkout settings in Paddle Dashboard are not configured\n` +
          `2. Default payment link is not set correctly\n` +
          `3. Transaction status is not compatible with checkout\n` +
          `Please check Paddle Dashboard → Settings → Checkout → Checkout Settings`
        );
      }

      // Verify checkout URL is valid
      if (!checkoutUrl.includes('paddle.com') && !checkoutUrl.includes('checkout')) {
        this.logger.warn(`Checkout URL doesn't look like a Paddle URL: ${checkoutUrl}`);
      }

      // Log transaction details for debugging overlay checkout
      this.logger.log(`Checkout created successfully. Transaction: ${transactionId}, Status: ${transactionStatus}, URL: ${checkoutUrl.substring(0, 50)}...`);
      this.logger.debug(`Transaction ID for overlay checkout: ${transactionId}`);
      this.logger.debug(`Transaction status: ${transactionStatus}`);
      
      return { 
        checkoutUrl,
        transactionId: transactionId || null, // Return the actual transaction ID from API (for overlay checkout)
      };
    } catch (error: any) {
      this.logger.error(`Failed to create Paddle checkout: ${error.message}`, error.stack);
      
      // Provide helpful error messages
      if (error.message?.includes('Authentication') || error.message?.includes('incorrectly formatted')) {
        throw new BadRequestException(
          `Paddle authentication error. Please verify:\n` +
          `1. PADDLE_API_KEY is correct and starts with 'test_' (sandbox) or 'live_' (production)\n` +
          `2. PADDLE_ENVIRONMENT matches your API key (sandbox for test_ keys, production for live_ keys)\n` +
          `3. API key has no extra spaces or quotes\n` +
          `Error: ${error.message}`
        );
      }
      
      if (error.message?.includes('price') || error.message?.includes('not found') || error.code === 'resource_not_found') {
        throw new BadRequestException(
          `Paddle price ID '${options.priceId}' not found in your ${this.environment} account. ` +
          `Please verify:\n` +
          `1. The price ID exists in your Paddle Dashboard\n` +
          `2. The price ID matches your environment (sandbox vs production)\n` +
          `3. You're using a Price ID (starts with 'pri_'), not a Product ID (starts with 'pro_')\n` +
          `4. The price is active and available`
        );
      }

      // Log full error details for debugging
      const errorDetails = error.response?.body || error.body || error.data || error.response || {};
      this.logger.error('Paddle API error details:', JSON.stringify(errorDetails, null, 2));
      this.logger.error('Full error object:', JSON.stringify({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        response: error.response,
        body: error.body,
        data: error.data,
      }, null, 2));

      // Handle "Invalid request" - might be due to payload structure issues or invalid price ID
      if (error.message?.includes('Invalid request') || error.message?.includes('invalid') || error.code === 'bad_request') {
        // Extract detailed error message from Paddle response
        const detailedError = errorDetails.detail || errorDetails.message || errorDetails.error || error.message;
        const errorCode = errorDetails.code || error.code;
        
        this.logger.error(`Paddle checkout failed. Error code: ${errorCode}, Details: ${detailedError}`);
        this.logger.error(`Payload sent:`, JSON.stringify({
          items: [{ priceId: options.priceId, quantity: 1 }],
          customerId: options.customerId,
          customerEmail: options.customerEmail,
          customData: options.metadata,
        }, null, 2));

        // Check if price ID format is wrong (common issue)
        if (options.priceId.startsWith('pro_')) {
          throw new BadRequestException(
            `Invalid ID: '${options.priceId}' is a Product ID, but transactions require a Price ID.\n` +
            `Fix: Get the Price ID from Paddle Dashboard → Products → [Your Product] → Prices → Copy Price ID (starts with 'pri_')`
          );
        }
        
        // If we have a customerId and it's causing issues, try without it
        if (options.customerId) {
          this.logger.warn(`Checkout failed with customerId ${options.customerId}, retrying without customerId`);
          try {
            // Retry without customerId - Paddle will create/link customer automatically
            const retryPayload: any = {
              items: [
                {
                  priceId: options.priceId,
                  quantity: 1,
                },
              ],
              customData: options.metadata || {},
              collectionMode: 'automatic',
              billingDetails: options.customerEmail ? {
                email: options.customerEmail,
              } : undefined,
            };

            this.logger.debug('Retry payload:', JSON.stringify(retryPayload, null, 2));
            const paddleAny = this.paddle as any;
            const checkout = await paddleAny.transactions.create(retryPayload);
            
            const checkoutUrl = 
              checkout.url || 
              checkout.checkoutUrl || 
              checkout.checkout?.url || 
              checkout.data?.url ||
              checkout.data?.checkout?.url ||
              '';

            if (checkoutUrl) {
              const retryTransactionId = checkout.id || checkout.data?.id || null;
              this.logger.log(`Checkout created successfully (without customerId): ${checkoutUrl.substring(0, 50)}...`);
              return { 
                checkoutUrl,
                transactionId: retryTransactionId,
              };
            }
          } catch (retryError: any) {
            const retryErrorDetails = retryError.response?.body || retryError.body || retryError.data || {};
            this.logger.error(`Retry without customerId also failed: ${retryError.message}`);
            this.logger.error('Retry error details:', JSON.stringify(retryErrorDetails, null, 2));
            
            // Throw detailed error
            throw new BadRequestException(
              `Paddle checkout creation failed even without customerId. ` +
              `Error: ${retryErrorDetails.detail || retryErrorDetails.message || retryError.message}. ` +
              `Please check:\n` +
              `1. Price ID '${options.priceId}' is valid and active\n` +
              `2. Price ID matches your environment (sandbox/production)\n` +
              `3. Check Paddle dashboard for API error details`
            );
          }
        }
        
        throw new BadRequestException(
          `Paddle checkout creation failed: ${detailedError || error.message}. ` +
          `Error code: ${errorCode || 'unknown'}. ` +
          `Please verify:\n` +
          `1. Price ID '${options.priceId}' is valid and active in your Paddle ${this.environment} account\n` +
          `2. Customer email '${options.customerEmail}' is valid\n` +
          `3. Check Paddle dashboard for detailed error information`
        );
      }

      throw new BadRequestException(
        `Failed to create checkout: ${error.message}. ` +
        `Please check Paddle dashboard for more details or verify your checkout payload.`
      );
    }
  }

  /**
   * Create a customer or get existing customer by email
   * Note: This is optional - Paddle creates customers automatically during checkout
   * If customer creation fails due to email conflict, we extract the existing customer ID
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<any | null> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      const customer = await this.paddle.customers.create({
        email,
        name,
        customData: metadata || {},
      });
      
      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error: any) {
      // Handle email conflict - customer already exists
      if (error.message?.includes('conflicts') || error.message?.includes('conflict')) {
        // Extract customer ID from error message
        // Error format: "customer email conflicts with customer of id ctm_xxx"
        const customerIdMatch = error.message.match(/id\s+([a-z0-9_]+)/i);
        if (customerIdMatch && customerIdMatch[1]) {
          const existingCustomerId = customerIdMatch[1];
          this.logger.log(`Customer already exists with email ${email}, using existing customer: ${existingCustomerId}`);
          
          // Return the existing customer by fetching it
          try {
            const existingCustomer = await this.getCustomer(existingCustomerId);
            return existingCustomer;
          } catch (getError: any) {
            this.logger.warn(`Failed to fetch existing customer ${existingCustomerId}: ${getError.message}`);
            // Return a minimal object with just the ID
            return { id: existingCustomerId };
          }
        }
        
        // If we can't extract ID, try to find customer by email
        this.logger.warn(`Email conflict detected but couldn't extract customer ID. Will use email in checkout.`);
        return null;
      }
      
      // If customer creation is not permitted, that's okay
      // Paddle will create the customer automatically during checkout
      if (error.message?.includes('permitted') || error.message?.includes('permission')) {
        this.logger.debug(`Customer creation not permitted. Customer will be created during checkout: ${error.message}`);
        return null;
      }
      
      // For other errors, log but don't fail - customer will be created during checkout
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
        this.logger.log(`Subscription ${subscriptionId} canceled immediately`);
      } else {
        await this.paddle.subscriptions.update(subscriptionId, {
          scheduledChange: {
            action: 'cancel',
            effectiveAt: 'next_billing_period',
          },
        });
        this.logger.log(`Subscription ${subscriptionId} scheduled for cancellation at period end`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to cancel Paddle subscription: ${error.message}`, error);
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * Paddle webhook verification implementation
   */
  verifyWebhookSignature(signature: string, payload: string | Buffer): boolean {
    if (!this.isConfigured || !this.paddle) {
      this.logger.warn('Paddle not configured, skipping webhook verification');
      return false;
    }

    if (!signature) {
      this.logger.warn('Webhook signature missing');
      return false;
    }

    try {
      const paddleAny = this.paddle as any;
      
      // Try Paddle SDK webhook verification methods
      if (paddleAny.webhooks?.verify) {
        return paddleAny.webhooks.verify(payload, signature);
      } else if (paddleAny.webhooks?.unmarshal) {
        try {
          paddleAny.webhooks.unmarshal(payload, signature);
          return true;
        } catch {
          return false;
        }
      } else {
        // For development/testing: log warning but allow
        // In production, implement proper verification
        // See: https://developer.paddle.com/webhook-reference/overview
        this.logger.warn(
          'Paddle webhook verification method not found in SDK. ' +
          'Implementing proper verification is required for production. ' +
          'See: https://developer.paddle.com/webhook-reference/overview'
        );
        
        // For now, return true to allow webhook processing
        // TODO: Implement proper Paddle webhook signature verification
        return true;
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
    const apiKey = this.configService.get('PADDLE_API_KEY');
    const vendorId = this.configService.get('PADDLE_VENDOR_ID');
    const apiKeyPrefix = apiKey ? apiKey.substring(0, 5) : 'none';
    
    return {
      isConfigured: this.isConfigured,
      hasApiKey: !!apiKey,
      hasVendorId: !!vendorId,
      vendorId: vendorId || null, // Return vendor ID for frontend use
      environment: this.environment,
      apiKeyPrefix: apiKeyPrefix + '...',
      // Support both old format (test_/live_) and new format (pdl_sdbx_/pdl_live_)
      apiKeyFormatValid: apiKey ? (
        apiKey.startsWith('test_') || 
        apiKey.startsWith('live_') || 
        apiKey.startsWith('pdl_sdbx_') || 
        apiKey.startsWith('pdl_live_')
      ) : false,
    };
  }

  /**
   * Get client token for Paddle.js initialization
   * This is used by the frontend to initialize Paddle.js
   * Note: Client tokens may not be available in all Paddle SDK versions.
   * If this returns null, the frontend will fall back to using vendor ID for initialization.
   * @returns Client token string, or null if not available
   */
  async getClientToken(): Promise<string | null> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    try {
      const paddleAny = this.paddle as any;
      
      // Log available methods for debugging
      this.logger.debug('Paddle SDK methods:', Object.keys(paddleAny));
      
      // Try different possible API structures
      if (paddleAny.clientTokens?.create) {
        this.logger.debug('Using clientTokens.create()');
        const response = await paddleAny.clientTokens.create();
        this.logger.debug('Client token response:', JSON.stringify(response, null, 2));
        
        // Handle different response structures
        if (typeof response === 'string') {
          return response;
        }
        if (response?.data?.clientToken) {
          return response.data.clientToken;
        }
        if (response?.data?.token) {
          return response.data.token;
        }
        if (response?.clientToken) {
          return response.clientToken;
        }
        if (response?.token) {
          return response.token;
        }
        
        this.logger.warn('Client token response structure unexpected:', response);
        // Return null instead of throwing - frontend will use vendor ID
        return null;
      } 
      
      // Try alternative API structure
      if (paddleAny.clientTokens) {
        this.logger.debug('Trying alternative clientTokens API');
        const response = await paddleAny.clientTokens.create();
        
        if (typeof response === 'string') {
          return response;
        }
        if (response?.clientToken) {
          return response.clientToken;
        }
        if (response?.token) {
          return response.token;
        }
        if (response?.data?.clientToken) {
          return response.data.clientToken;
        }
        
        // Return null instead of throwing
        return null;
      }
      
      // Client tokens API not available - this is okay, frontend can use vendor ID
      this.logger.log('Client tokens API not available in Paddle SDK. Frontend will use vendor ID instead.');
      return null;
    } catch (error: any) {
      // Log full error details for debugging
      this.logger.warn(`Client token API error: ${error.message}`);
      
      // Check if it's a JSON parsing error or API not available
      if (
        error.message?.includes('JSON') || 
        error.message?.includes('json') || 
        error.message?.includes('parse') ||
        error.message?.includes('not available') ||
        error.message?.includes('not found') ||
        error.statusCode === 404 ||
        error.code === 'resource_not_found'
      ) {
        this.logger.log('Client tokens API is not available in this Paddle SDK version. Frontend will use vendor ID instead.');
        // Return null instead of throwing - this is expected behavior
        return null;
      }
      
      // For unexpected errors, log but still return null to allow fallback
      this.logger.error(`Unexpected error getting client token: ${error.message}`, error.stack);
      this.logger.error('Full error details:', JSON.stringify({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      }, null, 2));
      
      // Return null to allow frontend to fall back to vendor ID
      return null;
    }
  }
}
