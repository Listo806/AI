import { Controller, Post, Headers, Body, RawBodyRequest, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../../payments/stripe.service';
import { SubscriptionsService } from '../subscriptions.service';
import { DatabaseService } from '../../database/database.service';
import Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly db: DatabaseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody || req.body;
    
    let event: Stripe.Event;

    try {
      event = await this.stripeService.constructWebhookEvent(
        payload,
        signature,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return { received: false };
    }

    // Idempotency check: prevent duplicate event processing
    const eventId = event.id;
    const existingEvent = await this.db.query(
      `SELECT id FROM webhook_events 
       WHERE provider = 'stripe' AND event_id = $1`,
      [eventId],
    );

    if (existingEvent.rows.length > 0) {
      // Event already processed - return success (idempotent)
      console.log(`Webhook event ${eventId} already processed, skipping`);
      return { received: true, idempotent: true };
    }

    // Store event before processing (prevents race conditions)
    let subscriptionId: string | null = null;
    
    // Extract subscription ID from event if available
    if (event.type.includes('subscription') && event.data.object) {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await this.subscriptionsService.findByStripeSubscriptionId(subscription.id);
      subscriptionId = sub?.id || null;
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await this.subscriptionsService.findByStripeSubscriptionId(
          session.subscription as string,
        );
        subscriptionId = sub?.id || null;
      }
    } else if (event.type.includes('invoice')) {
      const invoice = event.data.object as Stripe.Invoice;
      // Access subscription property (may be string ID or expanded object)
      const invoiceSubscription = (invoice as any).subscription;
      const subscriptionIdFromInvoice = typeof invoiceSubscription === 'string' 
        ? invoiceSubscription 
        : invoiceSubscription?.id;
      if (subscriptionIdFromInvoice) {
        const sub = await this.subscriptionsService.findByStripeSubscriptionId(
          subscriptionIdFromInvoice,
        );
        subscriptionId = sub?.id || null;
      }
    }

    // Insert event record (UNIQUE constraint prevents duplicates)
    try {
      await this.db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, subscription_id, payload, processed_at)
         VALUES ('stripe', $1, $2, $3, $4, NOW())
         ON CONFLICT (provider, event_id) DO NOTHING`,
        [eventId, event.type, subscriptionId, JSON.stringify(event)],
      );
    } catch (err: any) {
      // If insert fails due to race condition, another process already handled it
      if (err.code === '23505') { // Unique violation
        console.log(`Webhook event ${eventId} processed by another process`);
        return { received: true, idempotent: true };
      }
      throw err;
    }

    // Handle the event
    console.log(`Processing webhook event: ${event.type} (${eventId})`);
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log(`Handling checkout.session.completed for session: ${(event.data.object as Stripe.Checkout.Session).id}`);
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          console.log(`Handling subscription ${event.type} for subscription: ${(event.data.object as Stripe.Subscription).id}`);
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          console.log(`Handling subscription deleted for subscription: ${(event.data.object as Stripe.Subscription).id}`);
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          console.log(`Handling invoice.payment_succeeded for invoice: ${(event.data.object as Stripe.Invoice).id}`);
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          console.log(`Handling invoice.payment_failed for invoice: ${(event.data.object as Stripe.Invoice).id}`);
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      console.log(`Successfully processed webhook event: ${event.type} (${eventId})`);
    } catch (error) {
      console.error(`Error processing webhook event ${eventId}:`, error);
      // Don't remove event record - allows for retry/debugging
      throw error;
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await this.stripeService.getSubscription(
        session.subscription as string,
      );
      await this.subscriptionsService.updateFromStripe(subscription);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    await this.subscriptionsService.updateFromStripe(stripeSubscription);
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.subscriptionsService.findByStripeSubscriptionId(
      stripeSubscription.id,
    );

    if (subscription) {
      await this.subscriptionsService.updateFromStripe(stripeSubscription);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Access subscription property (may be string ID or expanded object)
    const invoiceSubscription = (invoice as any).subscription;
    const subscriptionIdFromInvoice = typeof invoiceSubscription === 'string' 
      ? invoiceSubscription 
      : invoiceSubscription?.id;
    
    if (subscriptionIdFromInvoice) {
      const subscription = await this.subscriptionsService.findByStripeSubscriptionId(
        subscriptionIdFromInvoice,
      );

      if (subscription) {
        // Record payment - access payment_intent property
        const invoicePaymentIntent = (invoice as any).payment_intent;
        const paymentIntentId = typeof invoicePaymentIntent === 'string'
          ? invoicePaymentIntent
          : invoicePaymentIntent?.id || null;
        
        await this.recordPayment(
          subscription.id,
          paymentIntentId,
          invoice.id,
          (invoice.amount_paid || 0) / 100, // Convert from cents
          invoice.currency || 'usd',
          'succeeded',
        );
      }
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Access subscription property (may be string ID or expanded object)
    const invoiceSubscription = (invoice as any).subscription;
    const subscriptionIdFromInvoice = typeof invoiceSubscription === 'string' 
      ? invoiceSubscription 
      : invoiceSubscription?.id;
    
    if (subscriptionIdFromInvoice) {
      const subscription = await this.subscriptionsService.findByStripeSubscriptionId(
        subscriptionIdFromInvoice,
      );

      if (subscription) {
        // Record failed payment - access payment_intent property
        const invoicePaymentIntent = (invoice as any).payment_intent;
        const paymentIntentId = typeof invoicePaymentIntent === 'string'
          ? invoicePaymentIntent
          : invoicePaymentIntent?.id || null;
        
        await this.recordPayment(
          subscription.id,
          paymentIntentId,
          invoice.id,
          (invoice.amount_due || 0) / 100, // Convert from cents
          invoice.currency || 'usd',
          'failed',
        );
      }
    }
  }

  private async recordPayment(
    subscriptionId: string,
    paymentIntentId: string | null,
    invoiceId: string | null,
    amount: number,
    currency: string,
    status: string,
  ) {
    if (!paymentIntentId) return;

    await this.db.query(
      `INSERT INTO payments (subscription_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status, payment_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
         status = EXCLUDED.status,
         stripe_invoice_id = EXCLUDED.stripe_invoice_id`,
      [subscriptionId, paymentIntentId, invoiceId, amount, currency, status],
    );
  }
}

