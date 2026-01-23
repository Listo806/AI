import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DatabaseService } from '../database/database.service';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly paypalService: PayPalService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly db: DatabaseService,
  ) {}

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async handlePayPalWebhook(@Headers() headers: any, @Body() body: any) {
    // Verify webhook signature
    const isValid = await this.paypalService.verifyWebhook(headers, body);
    if (!isValid) {
      return { status: 'error', message: 'Invalid webhook signature' };
    }

    // Idempotency check: prevent duplicate event processing
    // PayPal uses event.id or transmission_id as unique identifier
    const eventId = body.id || headers['paypal-transmission-id'] || `paypal-${Date.now()}`;
    const eventType = body.event_type;
    const resource = body.resource;

    // Check if event already processed
    const existingEvent = await this.db.query(
      `SELECT id FROM webhook_events 
       WHERE provider = 'paypal' AND event_id = $1`,
      [eventId],
    );

    if (existingEvent.rows.length > 0) {
      // Event already processed - return success (idempotent)
      console.log(`PayPal webhook event ${eventId} already processed, skipping`);
      return { status: 'success', idempotent: true };
    }

    // Extract subscription ID if available
    let subscriptionId: string | null = null;
    if (resource?.id) {
      // Try to find subscription by PayPal subscription ID
      // Note: This assumes subscriptions table has paypal_subscription_id field
      // If not, you'll need to add it or use a different lookup method
      const { rows } = await this.db.query(
        `SELECT id FROM subscriptions 
         WHERE paypal_subscription_id = $1 OR stripe_subscription_id = $1`,
        [resource.id],
      );
      subscriptionId = rows[0]?.id || null;
    }

    // Store event before processing (prevents race conditions)
    try {
      await this.db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, subscription_id, payload, processed_at)
         VALUES ('paypal', $1, $2, $3, $4, NOW())
         ON CONFLICT (provider, event_id) DO NOTHING`,
        [eventId, eventType, subscriptionId, JSON.stringify(body)],
      );
    } catch (err: any) {
      // If insert fails due to race condition, another process already handled it
      if (err.code === '23505') { // Unique violation
        console.log(`PayPal webhook event ${eventId} processed by another process`);
        return { status: 'success', idempotent: true };
      }
      throw err;
    }

    try {
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          await this.handleSubscriptionCreated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.UPDATED':
          await this.handleSubscriptionUpdated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(resource);
          break;

        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await this.handleSubscriptionSuspended(resource);
          break;

        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          await this.handlePaymentFailed(resource);
          break;

        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentCompleted(resource);
          break;

        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }

      return { status: 'success' };
    } catch (error: any) {
      console.error(`Error processing PayPal webhook event ${eventId}:`, error);
      // Don't remove event record - allows for retry/debugging
      throw error;
    }
  }

  private async handleSubscriptionCreated(resource: any) {
    // Subscription created - usually handled by frontend redirect
    // But we can log it or update status if needed
    console.log('Subscription created:', resource.id);
  }

  private async handleSubscriptionActivated(resource: any) {
    const subscriptionId = resource.id;
    const subscription = await this.subscriptionsService.getSubscriptionByPaypalId(subscriptionId);

    if (subscription) {
      await this.subscriptionsService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : undefined,
        currentPeriodEnd: resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : undefined,
      });
    }
  }

  private async handleSubscriptionUpdated(resource: any) {
    const subscriptionId = resource.id;
    const subscription = await this.subscriptionsService.getSubscriptionByPaypalId(subscriptionId);

    if (subscription) {
      await this.subscriptionsService.updateSubscriptionFromWebhook(subscriptionId, {
        status: resource.status === 'ACTIVE' ? SubscriptionStatus.ACTIVE : undefined,
        currentPeriodStart: resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : undefined,
        currentPeriodEnd: resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : undefined,
      });
    }
  }

  private async handleSubscriptionCancelled(resource: any) {
    const subscriptionId = resource.id;
    const subscription = await this.subscriptionsService.getSubscriptionByPaypalId(subscriptionId);

    if (subscription) {
      await this.subscriptionsService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
      });
    }
  }

  private async handleSubscriptionSuspended(resource: any) {
    const subscriptionId = resource.id;
    const subscription = await this.subscriptionsService.getSubscriptionByPaypalId(subscriptionId);

    if (subscription) {
      await this.subscriptionsService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.SUSPENDED,
      });
    }
  }

  private async handlePaymentFailed(resource: any) {
    const subscriptionId = resource.id;
    const subscription = await this.subscriptionsService.getSubscriptionByPaypalId(subscriptionId);

    if (subscription) {
      await this.subscriptionsService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.PAST_DUE,
      });
    }
  }

  private async handlePaymentCompleted(resource: any) {
    // Find subscription by transaction details
    const subscriptionId = resource.billing_agreement_id;
    if (!subscriptionId) return;

    const subscription = await this.subscriptionsService.getSubscriptionByPaypalId(subscriptionId);
    if (!subscription) return;

    // Record payment
    await this.subscriptionsService.createPayment({
      subscriptionId: subscription.id,
      paypalTransactionId: resource.id,
      amount: parseFloat(resource.amount?.total || '0'),
      currency: resource.amount?.currency || 'USD',
      status: 'completed',
    });

    // Update subscription status to active if it was past_due
    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      await this.subscriptionsService.updateSubscriptionFromWebhook(subscriptionId, {
        status: SubscriptionStatus.ACTIVE,
      });
    }
  }
}

