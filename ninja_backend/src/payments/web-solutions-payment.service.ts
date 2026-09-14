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
    amountCents: number;
  }
> = {
  'connection-setup': {
    id: 'connection-setup',
    name: 'Connection Setup',
    amountCents: 14700,
  },

  'website-optimization': {
    id: 'website-optimization',
    name: 'Website Optimization',
    amountCents: 29700,
  },

  'full-transformation': {
    id: 'full-transformation',
    name: 'Full Transformation',
    amountCents: 54700,
  },
};

@Injectable()
export class WebSolutionsPaymentService {
  private readonly logger =
    new Logger(
      WebSolutionsPaymentService.name,
    );

  private readonly stripe: Stripe;
  private schemaReady = false;

  constructor(
    private readonly config:
      ConfigService,

    private readonly db:
      DatabaseService,
  ) {
    this.stripe =
      new Stripe(
        this.config.getRequired(
          'STRIPE_SECRET_KEY',
        ),
        {
          apiVersion:
            '2026-02-25.clover',
        },
      );
  }

  private getService(
    id: string,
  ) {
    const service =
      CATALOG[
        String(id || '').trim()
          as ServiceId
      ];

    if (!service) {
      throw new BadRequestException(
        'Invalid Web Solutions service.',
      );
    }

    return service;
  }

  getPublicConfig() {
    const publishableKey =
      this.config.get(
        'STRIPE_PUBLISHABLE_KEY',
      ) ||
      this.config.get(
        'VITE_STRIPE_PUBLISHABLE_KEY',
      ) ||
      null;

    return {
      publishableKey,
    };
  }

  private async ensureSchema() {
    if (this.schemaReady) return;

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS
      web_solution_stripe_orders (
        id UUID PRIMARY KEY
          DEFAULT gen_random_uuid(),

        stripe_payment_intent_id
          VARCHAR(255)
          NOT NULL
          UNIQUE,

        user_id UUID NULL,
        team_id UUID NULL,

        service_id VARCHAR(64)
          NOT NULL,

        service_name VARCHAR(160)
          NOT NULL,

        amount NUMERIC(12,2)
          NOT NULL,

        currency VARCHAR(8)
          NOT NULL
          DEFAULT 'USD',

        status VARCHAR(32)
          NOT NULL
          DEFAULT 'paid',

        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        business_name VARCHAR(255),
        phone VARCHAR(80),
        website TEXT,

        purchased_at TIMESTAMPTZ
          NOT NULL
          DEFAULT NOW(),

        created_at TIMESTAMPTZ
          NOT NULL
          DEFAULT NOW(),

        updated_at TIMESTAMPTZ
          NOT NULL
          DEFAULT NOW()
      )
    `);

    this.schemaReady = true;
  }

  async createPaymentIntent(
    input: {
      serviceId: string;
      fullName?: string;
      businessName?: string;
      email?: string;
      phone?: string;
      website?: string;
      userId?: string | null;
    },
  ) {
    const service =
      this.getService(
        input.serviceId,
      );

    const fullName =
      String(
        input.fullName || '',
      ).trim();

    const email =
      String(
        input.email || '',
      ).trim();

    if (!fullName) {
      throw new BadRequestException(
        'Full name is required.',
      );
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        email,
      )
    ) {
      throw new BadRequestException(
        'A valid email is required.',
      );
    }

    const metadata = {
      purchaseType:
        'web_solution',

      serviceId:
        service.id,

      serviceName:
        service.name,

      expectedAmountCents:
        String(
          service.amountCents,
        ),

      fullName,

      businessName:
        String(
          input.businessName || '',
        ).trim(),

      email,

      phone:
        String(
          input.phone || '',
        ).trim(),

      website:
        String(
          input.website || '',
        ).trim(),

      userId:
        String(
          input.userId || '',
        ).trim(),
    };

    const intent =
      await this.stripe
        .paymentIntents
        .create({
          amount:
            service.amountCents,

          currency: 'usd',

          payment_method_types: [
            'card',
          ],

          receipt_email: email,

          description:
            `CORTEXA Web Solutions - ${service.name}`,

          metadata,
        });

    if (
      !intent.client_secret
    ) {
      throw new BadRequestException(
        'Stripe did not return a client secret.',
      );
    }

    return {
      success: true,

      clientSecret:
        intent.client_secret,

      paymentIntentId:
        intent.id,

      serviceId:
        service.id,

      amount:
        service.amountCents / 100,

      currency: 'USD',
    };
  }

  async confirmPayment(
    input: {
      paymentIntentId: string;
      serviceId: string;
      userId?: string | null;
    },
  ) {
    const service =
      this.getService(
        input.serviceId,
      );

    const paymentIntentId =
      String(
        input.paymentIntentId ||
          '',
      ).trim();

    const intent =
      await this.stripe
        .paymentIntents
        .retrieve(
          paymentIntentId,
        );

    if (
      intent.status !==
      'succeeded'
    ) {
      throw new BadRequestException(
        `Payment is not complete. Stripe status: ${intent.status}`,
      );
    }

    if (
      intent.metadata
        ?.purchaseType !==
      'web_solution'
    ) {
      throw new BadRequestException(
        'Invalid payment type.',
      );
    }

    if (
      intent.metadata
        ?.serviceId !==
      service.id
    ) {
      throw new BadRequestException(
        'Selected service does not match the payment.',
      );
    }

    if (
      Number(
        intent.amount_received ||
          intent.amount ||
          0,
      ) !==
      service.amountCents
    ) {
      throw new BadRequestException(
        'Paid amount does not match the selected service.',
      );
    }

    await this.ensureSchema();

    const metadata =
      intent.metadata || {};

    const userId =
      String(
        input.userId ||
          metadata.userId ||
          '',
      ).trim() || null;

    let teamId:
      | string
      | null = null;

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
                  WHERE
                    t.owner_id = u.id
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
          rows[0]?.team_id ||
          null;
      } catch (_e) {}
    }

    await this.db.query(
      `
      INSERT INTO
      web_solution_stripe_orders (
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
        $1,$2,$3,$4,$5,$6,$7,
        'paid',
        $8,$9,$10,$11,$12,
        NOW(),NOW()
      )

      ON CONFLICT (
        stripe_payment_intent_id
      )
      DO UPDATE SET
        status = 'paid',
        updated_at = NOW()
      `,
      [
        intent.id,
        userId,
        teamId,
        service.id,
        service.name,
        service.amountCents / 100,
        String(
          intent.currency ||
            'usd',
        ).toUpperCase(),
        metadata.email ||
          null,
        metadata.fullName ||
          null,
        metadata.businessName ||
          null,
        metadata.phone ||
          null,
        metadata.website ||
          null,
      ],
    );

    this.logger.log(
      `Web Solutions Stripe payment recorded: ${intent.id}`,
    );

    return {
      success: true,
      paymentIntentId:
        intent.id,
      serviceId:
        service.id,
      amount:
        service.amountCents / 100,
      currency: 'USD',
    };
  }
}
