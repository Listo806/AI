import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
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
   * SAFE production helper: create ONLY the three one-time starting prices
   * for the NEW pricing model.
   *
   * No PADDLE_PRODUCT_ID env is required.
   *
   * We derive the existing Paddle Product ID from one of the existing recurring
   * Price IDs (prefer TEAM, then SOLO, then GROWTH). Paddle Price entities already
   * contain their related productId, so this avoids manually copying a pro_... ID.
   *
   * Existing recurring prices remain untouched:
   *   solo   -> $197/month
   *   team   -> $347/month
   *   growth -> $497/month
   *
   * Creates only:
   *   solo   -> $7 one-time
   *   team   -> $14 one-time
   *   growth -> $21 one-time
   */
  async setupStartingPrices(): Promise<any> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    const recurringPriceId =
      this.configService.get('PADDLE_PRICE_TEAM') ||
      this.configService.get('PADDLE_PRICE_SOLO') ||
      this.configService.get('PADDLE_PRICE_GROWTH');

    if (!recurringPriceId) {
      throw new BadRequestException(
        'At least one existing recurring Paddle Price ID is required: PADDLE_PRICE_TEAM, PADDLE_PRICE_SOLO, or PADDLE_PRICE_GROWTH.',
      );
    }

    if (!String(recurringPriceId).startsWith('pri_')) {
      throw new BadRequestException(
        `Invalid recurring Paddle Price ID: '${recurringPriceId}'. Expected a pri_... Price ID.`,
      );
    }

    // Resolve the existing Product automatically from the recurring Price.
    const existingPrice: any = await (this.paddle as any).prices.get(
      recurringPriceId,
    );

    const productId =
      existingPrice?.productId ||
      existingPrice?.product_id ||
      existingPrice?.data?.productId ||
      existingPrice?.data?.product_id;

    if (!productId || !String(productId).startsWith('pro_')) {
      this.logger.error(
        `Could not derive Paddle product from recurring price ${recurringPriceId}: ${JSON.stringify(existingPrice)}`,
      );

      throw new BadRequestException(
        `Could not resolve the Paddle Product ID from recurring price '${recurringPriceId}'.`,
      );
    }

    this.logger.log(
      `Resolved existing Paddle product ${productId} from recurring price ${recurringPriceId}`,
    );

    const makeStartingPrice = (label: string, amount: string) =>
      (this.paddle as any).prices.create({
        productId,
        description: `CORTEXA ${label} one-time starting charge`,
        unitPrice: {
          amount,
          currencyCode: 'USD',
        },
      });

    const startSolo: any = await makeStartingPrice('Solo', '700');
    const startTeam: any = await makeStartingPrice('Business', '1400');
    const startGrowth: any = await makeStartingPrice('Scale', '2100');

    return {
      success: true,
      environment: this.environment,

      derivedFromRecurringPrice: recurringPriceId,
      productId,

      startPrices: {
        solo: startSolo.id,
        team: startTeam.id,
        growth: startGrowth.id,
      },

      env: {
        PADDLE_START_PRICE_SOLO: startSolo.id,
        PADDLE_START_PRICE_TEAM: startTeam.id,
        PADDLE_START_PRICE_GROWTH: startGrowth.id,
      },

      mapping: {
        solo: '$7 one-time -> existing $197/month',
        team: '$14 one-time -> existing $347/month',
        growth: '$21 one-time -> existing $497/month',
      },

      note:
        'Add the three returned PADDLE_START_PRICE_* values to Render and redeploy. Existing recurring PADDLE_PRICE_* values are unchanged.',
    };
  }

  /**
   * One-time admin setup for the NEW pricing model.
   *
   * Recurring prices stay exactly on the existing plans:
   *   solo   -> $197/month
   *   team   -> $347/month (displayed as Business)
   *   growth -> $497/month (displayed as Scale)
   *
   * Starting prices are separate ONE-TIME prices:
   *   solo   -> $7
   *   team   -> $14
   *   growth -> $21
   *
   * Never use a starting-price ID as a recurring subscription price.
   * Run once per Paddle environment and store the returned env values.
   */
  async setupPlans(): Promise<any> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }

    const product: any = await (this.paddle as any).products.create({
      name: 'CORTEXA AI Revenue OS',
      taxCategory: 'standard',
      description: 'CORTEXA AI Revenue OS subscription',
    });
    const productId = product.id;

    const makeMonthly = (label: string, amount: string) =>
      (this.paddle as any).prices.create({
        productId,
        description: `CORTEXA ${label} plan (monthly, 14-day free trial)`,
        unitPrice: { amount, currencyCode: 'USD' },
        billingCycle: { interval: 'month', frequency: 1 },
        trialPeriod: { interval: 'day', frequency: 14 },
      });

    const makeStartingPrice = (label: string, amount: string) =>
      (this.paddle as any).prices.create({
        productId,
        description: `CORTEXA ${label} one-time starting charge`,
        unitPrice: { amount, currencyCode: 'USD' },
      });

    const makeAnnual = (label: string, amount: string) =>
      (this.paddle as any).prices.create({
        productId,
        description: `CORTEXA ${label} plan (annual, 14-day free trial)`,
        unitPrice: { amount, currencyCode: 'USD' },
        billingCycle: { interval: 'year', frequency: 1 },
        trialPeriod: { interval: 'day', frequency: 14 },
      });

    // Existing recurring subscriptions (monthly).
    const solo: any = await makeMonthly('Solo', '19700');
    const team: any = await makeMonthly('Business', '34700');
    const growth: any = await makeMonthly('Scale', '49700');

    // New one-time starting charges.
    const startSolo: any = await makeStartingPrice('Solo', '700');
    const startTeam: any = await makeStartingPrice('Business', '1400');
    const startGrowth: any = await makeStartingPrice('Scale', '2100');

    // Annual recurring subscriptions (20% off x12): 1891.20 / 3331.20 / 4771.20.
    const soloYr: any = await makeAnnual('Solo', '189120');
    const teamYr: any = await makeAnnual('Business', '333120');
    const growthYr: any = await makeAnnual('Scale', '477120');

    return {
      productId,
      recurringPrices: {
        solo: solo.id,
        team: team.id,
        growth: growth.id,
      },
      annualPrices: {
        solo: soloYr.id,
        team: teamYr.id,
        growth: growthYr.id,
      },
      startPrices: {
        solo: startSolo.id,
        team: startTeam.id,
        growth: startGrowth.id,
      },
      env: {
        PADDLE_PRICE_SOLO: solo.id,
        PADDLE_PRICE_TEAM: team.id,
        PADDLE_PRICE_GROWTH: growth.id,

        PADDLE_START_PRICE_SOLO: startSolo.id,
        PADDLE_START_PRICE_TEAM: startTeam.id,
        PADDLE_START_PRICE_GROWTH: startGrowth.id,

        PADDLE_PRICE_SOLO_ANNUAL: soloYr.id,
        PADDLE_PRICE_TEAM_ANNUAL: teamYr.id,
        PADDLE_PRICE_GROWTH_ANNUAL: growthYr.id,
      },
      mapping: {
        solo: '$7 now -> $197/month or $1,891.20/year',
        team: '$14 now -> $347/month or $3,331.20/year',
        growth: '$21 now -> $497/month or $4,771.20/year',
      },
      note:
        'Store all nine price IDs as env vars. Start prices are one-time; monthly/annual prices are recurring subscriptions.',
    };
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
   * Add, remove, or change the quantity of a recurring add-on price on an
   * existing subscription (e.g. the $97 seat add-on or the $147 Lead Generator
   * add-on), billing any proration immediately.
   *
   * Paddle's subscription update REPLACES the full item set, so we read the
   * current items and send them all back with the target price adjusted.
   * `quantity` is the ABSOLUTE new quantity for that price; 0 removes it.
   *
   * NOTE: this must be verified against Paddle sandbox before go-live — it is
   * written to Paddle's documented API but cannot be run without live keys.
   */
  async setSubscriptionAddonQuantity(
    subscriptionId: string,
    priceId: string,
    quantity: number,
  ): Promise<any> {
    if (!this.isConfigured || !this.paddle) {
      throw new BadRequestException('Paddle service is not configured');
    }
    if (!subscriptionId) {
      throw new BadRequestException('A subscription is required');
    }
    if (!priceId || priceId.startsWith('pro_')) {
      throw new BadRequestException(
        `A valid add-on Price ID (pri_...) is required, got: ${priceId || 'none'}`,
      );
    }

    const sub: any = await this.paddle.subscriptions.get(subscriptionId);
    const currentItems: any[] = Array.isArray(sub?.items) ? sub.items : [];

    const items: Array<{ priceId: string; quantity: number }> = [];
    let matched = false;
    for (const it of currentItems) {
      const pid = it?.price?.id || it?.priceId;
      if (!pid) continue;
      if (pid === priceId) {
        matched = true;
        if (quantity > 0) items.push({ priceId: pid, quantity });
        // quantity <= 0 -> omit this price to remove the add-on
      } else {
        items.push({ priceId: pid, quantity: Number(it?.quantity) || 1 });
      }
    }
    if (!matched && quantity > 0) {
      items.push({ priceId, quantity });
    }

    const updated = await this.paddle.subscriptions.update(subscriptionId, {
      items,
      prorationBillingMode: 'prorated_immediately',
    } as any);

    this.logger.log(
      `Set add-on ${priceId} to qty ${quantity} on subscription ${subscriptionId}`,
    );
    return updated;
  }

  /**
   * Verify a Paddle Billing webhook signature.
   * The Paddle-Signature header is "ts=<unix>;h1=<hex>". The signed payload is
   * "<ts>:<raw request body>" hashed with HMAC-SHA256 using the endpoint secret
   * (PADDLE_WEBHOOK_SECRET). Comparison is timing-safe. The RAW body must be
   * passed unmodified (main.ts enables rawBody so req.rawBody is the Buffer).
   * Returns false (never true) whenever it cannot be positively verified.
   */
  verifyWebhookSignature(signature: string, payload: string | Buffer): boolean {
    const secret = this.configService.get('PADDLE_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error(
        'PADDLE_WEBHOOK_SECRET is not set; cannot verify Paddle webhook',
      );
      return false;
    }
    if (!signature) {
      this.logger.warn('Paddle webhook signature header missing');
      return false;
    }

    try {
      const parts: Record<string, string> = {};
      for (const kv of signature.split(';')) {
        const idx = kv.indexOf('=');
        if (idx > 0) {
          parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
        }
      }
      const ts = parts['ts'];
      const h1 = parts['h1'];
      if (!ts || !h1) {
        this.logger.warn('Paddle signature header malformed');
        return false;
      }

      const body = Buffer.isBuffer(payload)
        ? payload.toString('utf8')
        : payload;
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${ts}:${body}`, 'utf8')
        .digest('hex');

      const a = Buffer.from(h1, 'utf8');
      const b = Buffer.from(expected, 'utf8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (error) {
      this.logger.error('Paddle webhook signature verification failed', error);
      return false;
    }
  }

  /**
   * Public config for Paddle.js.
   *
   * `prices` are the EXISTING recurring subscriptions.
   * `startPrices` are the NEW one-time starting charges.
   * The frontend requires both IDs for the selected plan before opening checkout.
   */
  getPublicConfig() {
    return {
      clientToken: this.configService.get('PADDLE_CLIENT_TOKEN') || null,
      environment: this.environment === 'production' ? 'production' : 'sandbox',

      prices: {
        solo: this.configService.get('PADDLE_PRICE_SOLO') || null,
        team: this.configService.get('PADDLE_PRICE_TEAM') || null,
        growth: this.configService.get('PADDLE_PRICE_GROWTH') || null,
      },

      startPrices: {
        solo: this.configService.get('PADDLE_START_PRICE_SOLO') || null,
        team: this.configService.get('PADDLE_START_PRICE_TEAM') || null,
        growth: this.configService.get('PADDLE_START_PRICE_GROWTH') || null,
      },

      // Annual recurring prices. Present only once the *_ANNUAL env vars are set;
      // until then these are null and the frontend keeps using monthly, so annual
      // is inert until the client provisions the yearly Paddle prices.
      annualPrices: {
        solo: this.configService.get('PADDLE_PRICE_SOLO_ANNUAL') || null,
        team: this.configService.get('PADDLE_PRICE_TEAM_ANNUAL') || null,
        growth: this.configService.get('PADDLE_PRICE_GROWTH_ANNUAL') || null,
      },

      mapping: {
        solo: { startingCharge: 7, recurringMonthly: 197, recurringAnnual: 1891.2 },
        team: { startingCharge: 14, recurringMonthly: 347, recurringAnnual: 3331.2 },
        growth: { startingCharge: 21, recurringMonthly: 497, recurringAnnual: 4771.2 },
      },

      // Paid Workspace add-on: its OWN $97/month recurring Paddle subscription,
      // separate from the base plan. `priceId` is null until PADDLE_PRICE_WORKSPACE
      // is set, which keeps the Workspace purchase inert until the client provisions
      // the price. `monthly` is the display amount only.
      workspaceAddon: {
        priceId: this.configService.get('PADDLE_PRICE_WORKSPACE') || null,
        monthly: 97,
      },
    };
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

  // ---- AI-credit purchase options (amount-verified, never guessed) ----
  private priceAmountCache = new Map<string, { v: number | null; at: number }>();

  // Fetch a Paddle price's real unit amount in DOLLARS. Cached 10 min. Returns
  // null if Paddle is unconfigured or the price can't be read.
  async getPriceAmount(priceId: string): Promise<number | null> {
    const id = String(priceId || '').trim();
    if (!id || !this.paddle) return null;
    const hit = this.priceAmountCache.get(id);
    if (hit && Date.now() - hit.at < 600000) return hit.v;
    let v: number | null = null;
    try {
      const p: any = await (this.paddle as any).prices.get(id);
      const raw =
        p?.unitPrice?.amount ??
        p?.unit_price?.amount ??
        p?.data?.unitPrice?.amount ??
        p?.data?.unit_price?.amount;
      if (raw != null && !Number.isNaN(Number(raw))) v = Number(raw) / 100;
    } catch (e: any) {
      this.logger.warn(`getPriceAmount(${id}) failed: ${e?.message}`);
      v = null;
    }
    this.priceAmountCache.set(id, { v, at: Date.now() });
    return v;
  }

  // AI purchase options for the popup, mapped by each price's REAL Paddle amount
  // (so the $47/$67/$97 mapping is VERIFIED against Paddle, never guessed from
  // env order) plus the recurring Unlimited AI subscription. Falls back to the
  // env-slot values only if Paddle can't confirm the amount.
  async getAiPurchaseOptions(user: any): Promise<any> {
    const AMOUNT_UNITS: Array<[number, number]> = [
      [47, 100],
      [67, 200],
      [97, 400],
    ];
    const slots = [
      { env: 'PADDLE_PRICE_AI_UNITS_100', price: 47, units: 100 },
      { env: 'PADDLE_PRICE_AI_UNITS_200', price: 67, units: 200 },
      { env: 'PADDLE_PRICE_AI_UNITS_400', price: 97, units: 400 },
    ];
    const packs: any[] = [];
    const seen = new Set<string>();
    for (const s of slots) {
      const id = String(process.env[s.env] || '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const amt = await this.getPriceAmount(id);
      const m = amt != null ? AMOUNT_UNITS.find(([p]) => Math.abs(p - amt) < 0.5) : null;
      const price = m ? m[0] : s.price;
      const units = m ? m[1] : s.units;
      packs.push({
        id: `p${units}`,
        priceId: id,
        units,
        price,
        recurring: false,
        verified: !!m,
        customData: { userId: user?.id, product: 'ai_units', packageId: `p${units}` },
      });
    }
    packs.sort((a, b) => a.price - b.price);

    const unlimitedId = String(process.env.PADDLE_PRICE_AI_UNLIMITED || '').trim();
    let unlimited: any = null;
    if (unlimitedId) {
      const amt = await this.getPriceAmount(unlimitedId);
      unlimited = {
        id: 'unlimited',
        priceId: unlimitedId,
        price: amt ?? 147,
        recurring: true,
        verified: amt != null,
        customData: { userId: user?.id, product: 'unlimited_ai' },
      };
    }

    return {
      configured: packs.length > 0 || !!unlimited,
      packs,
      unlimited,
      email: user?.email || null,
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