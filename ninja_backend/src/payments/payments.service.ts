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
  async createPaymentIntent(body: {
    amount?: number;
    currency?: string;
    email?: string;
    name?: string;
    phone?: string;
    plan?: string;
  }) {
    const amount = Math.round(Number(body?.amount));
    // Stripe rejects charges under 50 cents; guard empty/invalid amounts.
    if (!Number.isFinite(amount) || amount < 50) {
      throw new BadRequestException('Invalid payment amount.');
    }

    try {
      const paymentIntent = await this.getStripe().paymentIntents.create({
        amount,
        currency: (body.currency || 'usd').toLowerCase(),
        payment_method_types: ['card'],
        description: body.plan
          ? `CORTEXA ${body.plan} plan`
          : 'CORTEXA checkout',
        receipt_email: body.email || undefined,
        metadata: {
          name: body.name || '',
          email: body.email || '',
          phone: body.phone || '',
          plan: body.plan || '',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        successUrl: '/sign-in',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : 'Payment could not be initiated.';
      throw new InternalServerErrorException(message);
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