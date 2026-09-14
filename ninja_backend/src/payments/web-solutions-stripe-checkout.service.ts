import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';

type ServiceId =
  | 'connection-setup'
  | 'website-optimization'
  | 'full-transformation';

const CATALOG: Record<
  ServiceId,
  {
    id: ServiceId;
    name: string;
    description: string;
    amountCents: number;
  }
> = {
  'connection-setup': {
    id: 'connection-setup',
    name: 'Connection Setup',
    description:
      'Cortexa Web Solutions one-time connection setup professional service',
    amountCents: 14700,
  },

  'website-optimization': {
    id: 'website-optimization',
    name: 'Website Optimization',
    description:
      'Cortexa Web Solutions one-time website optimization professional service',
    amountCents: 29700,
  },

  'full-transformation': {
    id: 'full-transformation',
    name: 'Full Transformation',
    description:
      'Cortexa Web Solutions one-time full transformation professional service',
    amountCents: 54700,
  },
};

@Injectable()
export class WebSolutionsStripeCheckoutService {
  private readonly logger = new Logger(
    WebSolutionsStripeCheckoutService.name,
  );

  private readonly stripe: Stripe;

  private schemaReady = false;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {
    const secret = this.config.getRequired(
      'STRIPE_SECRET_KEY',
    );

    this.stripe = new Stripe(secret, {
      apiVersion: '2026-02-25.clover',
    });
  }

  private getService(
    serviceId: string,
  ) {
    const key =
      String(serviceId || '').trim() as ServiceId;

    const service = CATALOG[key];

    if (!service) {
      throw new BadRequestException(
        'Invalid Web Solutions service.',
      );
    }

    return service;
  }

  private frontendBase(): string {
    const configured = String(
      this.config.get('FRONTEND_URL') ||
        this.config.get('APP_URL') ||
        'https://www.cortexaaicrm.com',
    ).trim();

    return configured.replace(/\/+$/, '');
  }

  private async ensureSchema() {
    if (this.schemaReady) return;

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS web_solution_stripe_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        stripe_checkout_session_id VARCHAR(255)
          NOT NULL
          UNIQUE,

        stripe_payment_intent_id VARCHAR(255),

        user_id UUID NULL,
        team_id UUID NULL,

        service_id VARCHAR(64) NOT NULL,
        service_name VARCHAR(160) NOT NULL,

        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',

        status VARCHAR(32) NOT NULL DEFAULT 'paid',

        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        business_name VARCHAR(255),
        phone VARCHAR(80),
        website TEXT,

        purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    this.schemaReady = true;
  }

  async createSession(input: {
    serviceId: string;
    fullName?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    website?: string;
    userId?: string | null;
  }) {
    const service = this.getService(
      input?.serviceId,
    );

    const email = String(
      input?.email || '',
    ).trim();

    const fullName = String(
      input?.fullName || '',
    ).trim();

    if (!fullName) {
      throw new BadRequestException(
        'Full name is required.',
      );
    }

    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email)
    ) {
      throw new BadRequestException(
        'A valid email is required.',
      );
    }

    const metadata: Record<string, string> = {
      purchaseType: 'web_solution',
      serviceId: service.id,
      serviceName: service.name,
      expectedAmountCents: String(
        service.amountCents,
      ),
      fullName,
      businessName: String(
        input?.businessName || '',
      ).trim(),
      email,
      phone: String(
        input?.phone || '',
      ).trim(),
      website: String(
        input?.website || '',
      ).trim(),
      userId: String(
        input?.userId || '',
      ).trim(),
    };

    const base = this.frontendBase();

    const session =
      await this.stripe.checkout.sessions.create({
        mode: 'payment',

        payment_method_types: ['card'],

        customer_email: email,

        line_items: [
          {
            quantity: 1,

            price_data: {
              currency: 'usd',

              unit_amount:
                service.amountCents,

              product_data: {
                name:
                  `CORTEXA Web Solutions — ${service.name}`,

                description:
                  service.description,

                metadata: {
                  serviceId: service.id,
                },
              },
            },
          },
        ],

        metadata,

        payment_intent_data: {
          metadata,
        },

        success_url:
          `${base}/web-solutions/checkout` +
          `?plan=${encodeURIComponent(service.id)}` +
          `&stripe=success` +
          `&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${base}/web-solutions/checkout` +
          `?plan=${encodeURIComponent(service.id)}` +
          `&stripe=cancelled`,
      });

    if (!session.url) {
      throw new BadRequestException(
        'Stripe did not return a checkout URL.',
      );
    }

    this.logger.log(
      `Web Solutions Stripe Checkout created: ${session.id} / ${service.id}`,
    );

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async confirmSession(
    sessionId: string,
  ) {
    const cleanId =
      String(sessionId || '').trim();

    if (!cleanId.startsWith('cs_')) {
      throw new BadRequestException(
        'Invalid Stripe Checkout session.',
      );
    }

    const session =
      await this.stripe.checkout.sessions.retrieve(
        cleanId,
        {
          expand: [
            'payment_intent',
            'customer',
          ],
        },
      );

    if (
      session.mode !== 'payment' ||
      session.payment_status !== 'paid'
    ) {
      throw new BadRequestException(
        'Stripe payment is not complete.',
      );
    }

    const metadata =
      session.metadata || {};

    if (
      metadata.purchaseType !==
      'web_solution'
    ) {
      throw new BadRequestException(
        'This is not a Web Solutions payment.',
      );
    }

    const service =
      this.getService(
        metadata.serviceId,
      );

    if (
      Number(session.amount_total || 0) !==
      service.amountCents
    ) {
      throw new BadRequestException(
        'Paid amount does not match the selected service.',
      );
    }

    await this.ensureSchema();

    const userId =
      metadata.userId || null;

    let teamId: string | null = null;

    if (userId) {
      try {
        const { rows } =
          await this.db.query(
            `
            SELECT
              COALESCE(
                u.team_id,
                (
                  SELECT t.id
                  FROM teams t
                  WHERE t.owner_id = u.id
                  LIMIT 1
                )
              ) AS team_id
            FROM users u
            WHERE u.id = $1
            LIMIT 1
            `,
            [userId],
          );

        teamId =
          rows[0]?.team_id || null;
      } catch (_e) {}
    }

    const paymentIntentId =
      typeof session.payment_intent ===
      'string'
        ? session.payment_intent
        : session.payment_intent?.id ||
          null;

    await this.db.query(
      `
      INSERT INTO web_solution_stripe_orders (
        stripe_checkout_session_id,
        stripe_payment_intent_id,

        user_id,
        team_id,

        service_id,
        service_name,

        amount,
        currency,
        status,

        customer_email,
        customer_name,
        business_name,
        phone,
        website,

        purchased_at,
        updated_at
      )
      VALUES (
        $1,
        $2,

        $3,
        $4,

        $5,
        $6,

        $7,
        $8,
        'paid',

        $9,
        $10,
        $11,
        $12,
        $13,

        NOW(),
        NOW()
      )

      ON CONFLICT (
        stripe_checkout_session_id
      )
      DO UPDATE SET
        status = 'paid',
        updated_at = NOW()

      RETURNING id
      `,
      [
        session.id,
        paymentIntentId,

        userId,
        teamId,

        service.id,
        service.name,

        service.amountCents / 100,
        String(
          session.currency || 'usd',
        ).toUpperCase(),

        session.customer_details?.email ||
          metadata.email ||
          null,

        metadata.fullName || null,
        metadata.businessName || null,
        metadata.phone || null,
        metadata.website || null,
      ],
    );

    return {
      success: true,
      serviceId: service.id,
      serviceName: service.name,
      amount:
        service.amountCents / 100,
      currency: 'USD',
    };
  }
}
