import { Controller, Post, Headers, RawBodyRequest, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PaddleService } from '../../payments/paddle.service';
import { SubscriptionsService } from '../subscriptions.service';
import { DatabaseService } from '../../database/database.service';

@Controller('webhooks/paddle')
export class PaddleWebhookController {
  private readonly logger = new Logger(PaddleWebhookController.name);

  constructor(
    private readonly paddleService: PaddleService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly db: DatabaseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('paddle-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody || req.body;
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Verify webhook signature
    if (!this.paddleService.verifyWebhookSignature(signature, payloadString)) {
      this.logger.error('Paddle webhook signature verification failed');
      return { received: false, error: 'Invalid signature' };
    }

    // Parse event
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Extract event ID and type (Paddle may use different field names)
    const eventId = event.eventId || event.alert_name || event.id || `${Date.now()}-${Math.random()}`;
    const eventType = event.eventType || event.alert_name || event.type || 'unknown';

    this.logger.log(`Received Paddle webhook: ${eventType} (${eventId})`);

    // Idempotency check: prevent duplicate event processing
    const existingEvent = await this.db.query(
      `SELECT id FROM webhook_events 
       WHERE provider = 'paddle' AND event_id = $1`,
      [eventId],
    );

    if (existingEvent.rows.length > 0) {
      this.logger.log(`Paddle webhook event ${eventId} already processed, skipping (idempotent)`);
      return { received: true, idempotent: true };
    }

    // Extract subscription ID from event if available
    let subscriptionId: string | null = null;
    const paddleSubscriptionId = 
      event.data?.subscriptionId || 
      event.data?.subscription?.id ||
      event.subscription_id || 
      event.subscriptionId;
    
    if (paddleSubscriptionId) {
      const sub = await this.subscriptionsService.findByPaddleSubscriptionId(paddleSubscriptionId);
      subscriptionId = sub?.id || null;
    }

    // Store event before processing (prevents race conditions)
    try {
      await this.db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, subscription_id, payload, processed_at)
         VALUES ('paddle', $1, $2, $3, $4, NOW())
         ON CONFLICT (provider, event_id) DO NOTHING`,
        [eventId, eventType, subscriptionId, JSON.stringify(event)],
      );
    } catch (err: any) {
      // If insert fails due to race condition, another process already handled it
      if (err.code === '23505') { // Unique violation
        this.logger.log(`Paddle webhook event ${eventId} processed by another process`);
        return { received: true, idempotent: true };
      }
      throw err;
    }

    // Handle the event
    try {
      switch (eventType) {
        case 'subscription.created':
        case 'subscription_created':
          await this.handleSubscriptionCreated(event);
          break;

        case 'subscription.updated':
        case 'subscription_updated':
          await this.handleSubscriptionUpdated(event);
          break;

        case 'subscription.canceled':
        case 'subscription_cancelled':
        case 'subscription.cancelled':
          await this.handleSubscriptionCanceled(event);
          break;

        case 'transaction.completed':
        case 'payment_succeeded':
        case 'transaction.completed':
          await this.handleTransactionCompleted(event);
          break;

        case 'transaction.payment_failed':
        case 'payment_failed':
          await this.handlePaymentFailed(event);
          break;

        default:
          this.logger.debug(`Unhandled Paddle event type: ${eventType}`);
      }
      
      this.logger.log(`Successfully processed Paddle webhook event: ${eventType} (${eventId})`);
    } catch (error) {
      this.logger.error(`Error processing Paddle webhook event ${eventId}:`, error);
      // Don't remove event record - allows for retry/debugging
      throw error;
    }

    return { received: true };
  }

  private async handleSubscriptionCreated(event: any) {
    const subscriptionId = 
      event.data?.subscriptionId || 
      event.data?.subscription?.id ||
      event.subscription_id || 
      event.subscriptionId;
      
    if (subscriptionId) {
      this.logger.log(`Handling subscription.created for: ${subscriptionId}`);
      try {
        const paddleSubscription = await this.paddleService.getSubscription(subscriptionId);
        await this.subscriptionsService.updateFromPaddle(paddleSubscription);
      } catch (error: any) {
        this.logger.error(`Failed to process subscription.created: ${error.message}`, error);
        throw error;
      }
    }
  }

  private async handleSubscriptionUpdated(event: any) {
    const subscriptionId = 
      event.data?.subscriptionId || 
      event.data?.subscription?.id ||
      event.subscription_id || 
      event.subscriptionId;
      
    if (subscriptionId) {
      this.logger.log(`Handling subscription.updated for: ${subscriptionId}`);
      try {
        const paddleSubscription = await this.paddleService.getSubscription(subscriptionId);
        await this.subscriptionsService.updateFromPaddle(paddleSubscription);
      } catch (error: any) {
        this.logger.error(`Failed to process subscription.updated: ${error.message}`, error);
        throw error;
      }
    }
  }

  private async handleSubscriptionCanceled(event: any) {
    const subscriptionId = 
      event.data?.subscriptionId || 
      event.data?.subscription?.id ||
      event.subscription_id || 
      event.subscriptionId;
      
    if (subscriptionId) {
      this.logger.log(`Handling subscription.canceled for: ${subscriptionId}`);
      try {
        const subscription = await this.subscriptionsService.findByPaddleSubscriptionId(subscriptionId);
        if (subscription) {
          const paddleSubscription = await this.paddleService.getSubscription(subscriptionId);
          await this.subscriptionsService.updateFromPaddle(paddleSubscription);
        }
      } catch (error: any) {
        this.logger.error(`Failed to process subscription.canceled: ${error.message}`, error);
        throw error;
      }
    }
  }

  private async handleTransactionCompleted(event: any) {
    const subscriptionId = 
      event.data?.subscriptionId || 
      event.data?.subscription?.id ||
      event.data?.transaction?.subscriptionId ||
      event.subscription_id || 
      event.subscriptionId;
      
    if (subscriptionId) {
      this.logger.log(`Handling transaction.completed for subscription: ${subscriptionId}`);
      try {
        const subscription = await this.subscriptionsService.findByPaddleSubscriptionId(subscriptionId);
        
        if (subscription) {
          const transactionId = 
            event.data?.transactionId || 
            event.data?.transaction?.id ||
            event.transaction_id || 
            event.transactionId;
          const amount = 
            event.data?.amount || 
            event.data?.transaction?.totals?.total ||
            event.amount;
          const currency = 
            event.data?.currency || 
            event.data?.transaction?.currencyCode ||
            event.currency || 
            'USD';
          
          if (transactionId) {
            await this.recordPayment(
              subscription.id,
              transactionId,
              amount,
              currency,
              'succeeded',
            );
          }
        }
      } catch (error: any) {
        this.logger.error(`Failed to process transaction.completed: ${error.message}`, error);
        throw error;
      }
    }
  }

  private async handlePaymentFailed(event: any) {
    const subscriptionId = 
      event.data?.subscriptionId || 
      event.data?.subscription?.id ||
      event.data?.transaction?.subscriptionId ||
      event.subscription_id || 
      event.subscriptionId;
      
    if (subscriptionId) {
      this.logger.log(`Handling payment.failed for subscription: ${subscriptionId}`);
      try {
        const subscription = await this.subscriptionsService.findByPaddleSubscriptionId(subscriptionId);
        
        if (subscription) {
          const transactionId = 
            event.data?.transactionId || 
            event.data?.transaction?.id ||
            event.transaction_id || 
            event.transactionId;
          const amount = 
            event.data?.amount || 
            event.data?.transaction?.totals?.total ||
            event.amount;
          const currency = 
            event.data?.currency || 
            event.data?.transaction?.currencyCode ||
            event.currency || 
            'USD';
          
          if (transactionId) {
            await this.recordPayment(
              subscription.id,
              transactionId,
              amount,
              currency,
              'failed',
            );
          }
        }
      } catch (error: any) {
        this.logger.error(`Failed to process payment.failed: ${error.message}`, error);
        throw error;
      }
    }
  }

  private async recordPayment(
    subscriptionId: string,
    transactionId: string | null,
    amount: number | string,
    currency: string,
    status: string,
  ) {
    if (!transactionId) {
      this.logger.warn('Cannot record payment: transaction ID is missing');
      return;
    }

    // Convert amount to decimal (Paddle may return in cents or as decimal)
    let amountDecimal: number;
    if (typeof amount === 'string') {
      amountDecimal = parseFloat(amount);
    } else {
      amountDecimal = amount;
    }
    
    // If amount seems to be in cents (very large number), convert to dollars
    if (amountDecimal > 1000) {
      amountDecimal = amountDecimal / 100;
    }

    try {
      await this.db.query(
        `INSERT INTO payments (subscription_id, paddle_transaction_id, amount, currency, status, payment_date, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (paddle_transaction_id) DO UPDATE SET
           status = EXCLUDED.status,
           amount = EXCLUDED.amount`,
        [subscriptionId, transactionId, amountDecimal, currency, status],
      );
      
      this.logger.log(`Payment recorded: ${transactionId} - ${status} - ${amountDecimal} ${currency}`);
    } catch (error: any) {
      this.logger.error(`Failed to record payment: ${error.message}`, error);
      throw error;
    }
  }
}
