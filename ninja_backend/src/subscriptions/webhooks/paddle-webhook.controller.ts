import { Controller, Post, Headers, Body, RawBodyRequest, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { PaddleService } from '../../payments/paddle.service';
import { SubscriptionsService } from '../subscriptions.service';
import { DatabaseService } from '../../database/database.service';

@Controller('webhooks/paddle')
export class PaddleWebhookController {
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
      console.error('Paddle webhook signature verification failed');
      return { received: false };
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventId = event.eventId || event.alert_name || `${Date.now()}-${Math.random()}`;
    const eventType = event.eventType || event.alert_name || 'unknown';

    // Idempotency check: prevent duplicate event processing
    const existingEvent = await this.db.query(
      `SELECT id FROM webhook_events 
       WHERE provider = 'paddle' AND event_id = $1`,
      [eventId],
    );

    if (existingEvent.rows.length > 0) {
      // Event already processed - return success (idempotent)
      console.log(`Paddle webhook event ${eventId} already processed, skipping`);
      return { received: true, idempotent: true };
    }

    // Extract subscription ID from event if available
    let subscriptionId: string | null = null;
    const paddleSubscriptionId = event.data?.subscriptionId || event.subscription_id;
    
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
        console.log(`Paddle webhook event ${eventId} processed by another process`);
        return { received: true, idempotent: true };
      }
      throw err;
    }

    // Handle the event
    console.log(`Processing Paddle webhook event: ${eventType} (${eventId})`);
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
          await this.handleSubscriptionCanceled(event);
          break;

        case 'transaction.completed':
        case 'payment_succeeded':
          await this.handleTransactionCompleted(event);
          break;

        case 'transaction.payment_failed':
        case 'payment_failed':
          await this.handlePaymentFailed(event);
          break;

        default:
          console.log(`Unhandled Paddle event type: ${eventType}`);
      }
      console.log(`Successfully processed Paddle webhook event: ${eventType} (${eventId})`);
    } catch (error) {
      console.error(`Error processing Paddle webhook event ${eventId}:`, error);
      // Don't remove event record - allows for retry/debugging
      throw error;
    }

    return { received: true };
  }

  private async handleSubscriptionCreated(event: any) {
    const subscriptionId = event.data?.subscriptionId || event.subscription_id;
    if (subscriptionId) {
      const paddleSubscription = await this.paddleService.getSubscription(subscriptionId);
      await this.subscriptionsService.updateFromPaddle(paddleSubscription);
    }
  }

  private async handleSubscriptionUpdated(event: any) {
    const subscriptionId = event.data?.subscriptionId || event.subscription_id;
    if (subscriptionId) {
      const paddleSubscription = await this.paddleService.getSubscription(subscriptionId);
      await this.subscriptionsService.updateFromPaddle(paddleSubscription);
    }
  }

  private async handleSubscriptionCanceled(event: any) {
    const subscriptionId = event.data?.subscriptionId || event.subscription_id;
    if (subscriptionId) {
      const subscription = await this.subscriptionsService.findByPaddleSubscriptionId(subscriptionId);
      if (subscription) {
        const paddleSubscription = await this.paddleService.getSubscription(subscriptionId);
        await this.subscriptionsService.updateFromPaddle(paddleSubscription);
      }
    }
  }

  private async handleTransactionCompleted(event: any) {
    const subscriptionId = event.data?.subscriptionId || event.subscription_id;
    if (subscriptionId) {
      const subscription = await this.subscriptionsService.findByPaddleSubscriptionId(subscriptionId);
      
      if (subscription) {
        const transactionId = event.data?.transactionId || event.transaction_id;
        const amount = event.data?.amount || event.amount;
        const currency = event.data?.currency || event.currency || 'USD';
        
        await this.recordPayment(
          subscription.id,
          transactionId,
          amount,
          currency,
          'succeeded',
        );
      }
    }
  }

  private async handlePaymentFailed(event: any) {
    const subscriptionId = event.data?.subscriptionId || event.subscription_id;
    if (subscriptionId) {
      const subscription = await this.subscriptionsService.findByPaddleSubscriptionId(subscriptionId);
      
      if (subscription) {
        const transactionId = event.data?.transactionId || event.transaction_id;
        const amount = event.data?.amount || event.amount;
        const currency = event.data?.currency || event.currency || 'USD';
        
        await this.recordPayment(
          subscription.id,
          transactionId,
          amount,
          currency,
          'failed',
        );
      }
    }
  }

  private async recordPayment(
    subscriptionId: string,
    transactionId: string | null,
    amount: number,
    currency: string,
    status: string,
  ) {
    if (!transactionId) return;

    // Convert amount from cents if needed (Paddle may use different format)
    const amountDecimal = typeof amount === 'number' ? amount / 100 : parseFloat(amount) / 100;

    await this.db.query(
      `INSERT INTO payments (subscription_id, paddle_transaction_id, amount, currency, status, payment_date, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (paddle_transaction_id) DO UPDATE SET
         status = EXCLUDED.status`,
      [subscriptionId, transactionId, amountDecimal, currency, status],
    );
  }
}

