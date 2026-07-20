import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PaymentsService {
  private stripeClient: Stripe | null = null;

  // Trusted server-side price catalog (USD). The client NEVER dictates the charge.
  private static readonly PLAN_PRICES: Record<string, number> = {
    solo: 197,
    team: 347,
    growth: 497,
  };
  private static readonly SETUP_FEE = 97;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  // Lazily create the Stripe client. Keeping this lazy means a missing
  // STRIPE_SECRET_KEY never crashes the app at boot — only the checkout
  // endpoint returns a clear error. Works with a Stripe TEST key now; swap to
  // a live key (same env var) once the merchant account is approved.
  private getStripe(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }
    const apiKey = this.config.get('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Payment is not configured. STRIPE_SECRET_KEY is missing on the server.',
      );
    }
    this.stripeClient = new Stripe(apiKey, {
      apiVersion: '2026-02-25.clover',
    });
    return this.stripeClient;
  }

  // Create a one-time card PaymentIntent for the checkout flow. The frontend
  // (CheckoutPage.jsx) confirms it with Stripe Elements using the clientSecret.
  //
  // Security: the charge amount is computed HERE from a trusted price table.
  // The client-supplied `amount` is ignored so it cannot be tampered.
  async createPaymentIntent(body: {
    plan?: string;
    planKey?: string;
    source?: string;
    userId?: string | null;
    email?: string;
    name?: string;
    phone?: string;
    currency?: string;
  }) {
    const planKey = String(body?.plan || body?.planKey || 'team').toLowerCase();
    const planPrice = PaymentsService.PLAN_PRICES[planKey];
    if (!planPrice) {
      throw new BadRequestException('Unknown plan.');
    }

    // Trial checkout charges only the one-time setup fee today (the monthly plan
    // price starts after the free trial). Pricing checkout charges plan + setup.
    const isTrial = body?.source === 'trial';
    const dueTodayDollars = isTrial
      ? PaymentsService.SETUP_FEE
      : planPrice + PaymentsService.SETUP_FEE;
    const amount = Math.round(dueTodayDollars * 100);

    const userId = body?.userId ? String(body.userId) : '';

    try {
      const paymentIntent = await this.getStripe().paymentIntents.create(
        {
          amount,
          currency: (body.currency || 'usd').toLowerCase(),
          payment_method_types: ['card'],
          description: `CORTEXA ${planKey} plan (${isTrial ? 'trial setup' : 'plan + setup'})`,
          receipt_email: body.email || undefined,
          metadata: {
            userId,
            plan: planKey,
            source: body.source || '',
            name: body.name || '',
            email: body.email || '',
            phone: body.phone || '',
          },
        },
        // Stable key so an accidental double-submit reuses the same PaymentIntent
        // instead of creating (and potentially charging) a second one.
        userId
          ? { idempotencyKey: `pi_${userId}_${planKey}_${amount}` }
          : undefined,
      );

      return {
        clientSecret: paymentIntent.client_secret,
        // Route through /payment-success so the payment is recorded
        // (payment_status='paid') and the user is auto-logged-in. Without a
        // userId (pricing path) there is no account yet, so fall back to sign-in.
        successUrl: userId
          ? `/payment-success?userId=${encodeURIComponent(userId)}`
          : '/sign-in',
      };
    } catch (err) {
      // Log full detail server-side; return a safe, generic message to the client.
      console.error('CREATE PAYMENT INTENT ERROR:', err);
      if (err instanceof HttpException) {
        throw err;
      }
      if ((err as { type?: string })?.type === 'StripeCardError') {
        throw new BadRequestException('Your card could not be processed.');
      }
      throw new InternalServerErrorException('Payment could not be initiated.');
    }
  }

  async createCheckout(userId: string) {
    const { rows } = await this.db.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId],
    );

    const user = rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `UPDATE users 
       SET payment_status = 'pending', updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );

    return {
      success: true,
      checkoutUrl: `/payment-success?userId=${userId}`,
    };
  }

  async paymentSuccess(userId: string) {
    const { rows } = await this.db.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId],
    );

    const user = rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `UPDATE users 
       SET payment_status = 'paid',
           is_active = true,
           plan = 'pro',
           updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );

    return { success: true };
  }
}