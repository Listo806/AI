import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PayPalService } from './paypal.service';

@Injectable()
export class PaymentsService {
  private webhookTableReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly paypalService: PayPalService,
  ) {}

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

  // Activate the account after a PayPal subscription is approved. Stores the
  // PayPal subscription id and the selected plan.
  async activateSubscription(
    userId: string,
    subscriptionId: string,
    plan: string,
  ) {
    // Make sure the column exists (safe no-op after the first time).
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT`,
    );

    const { rows } = await this.db.query(`SELECT id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!rows[0]) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `UPDATE users
       SET payment_status = 'active',
           is_active = true,
           plan = $2,
           paypal_subscription_id = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, plan, subscriptionId],
    );

    return { success: true };
  }

  // --- Paddle activation + webhook processing ---

  private paddleColumnReady = false;
  private async ensurePaddleColumn(): Promise<void> {
    if (this.paddleColumnReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT`,
    );
    this.paddleColumnReady = true;
  }

  // Activate the account after a Paddle subscription is confirmed. Stores the
  // Paddle subscription id and the selected plan.
  async activatePaddleSubscription(
    userId: string,
    subscriptionId: string,
    plan: string,
  ) {
    await this.ensurePaddleColumn();
    const { rows } = await this.db.query(`SELECT id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!rows[0]) {
      throw new NotFoundException('User not found');
    }
    await this.db.query(
      `UPDATE users
       SET payment_status = 'active',
           is_active = true,
           plan = $2,
           paddle_subscription_id = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, plan || 'pro', subscriptionId],
    );
    return { success: true };
  }

  private async setUserStatusByPaddleSub(
    subscriptionId: string | null,
    fields: { payment_status?: string; is_active?: boolean },
  ): Promise<boolean> {
    if (!subscriptionId) return false;
    await this.ensurePaddleColumn();
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (fields.payment_status !== undefined) {
      sets.push(`payment_status = $${i++}`);
      vals.push(fields.payment_status);
    }
    if (fields.is_active !== undefined) {
      sets.push(`is_active = $${i++}`);
      vals.push(fields.is_active);
    }
    if (!sets.length) return false;
    sets.push(`updated_at = NOW()`);
    vals.push(subscriptionId);
    const res = await this.db.query(
      `UPDATE users SET ${sets.join(', ')} WHERE paddle_subscription_id = $${i}`,
      vals,
    );
    return (res.rowCount || 0) > 0;
  }

  // Idempotently process a signature-verified Paddle webhook. Activation happens
  // here: the checkout passes custom_data.userId, so subscription.activated/
  // created links the Paddle subscription to our user; later events map by the
  // stored paddle_subscription_id. Duplicate deliveries are ignored via
  // webhook_events. A status event that matches no user yet throws, so the caller
  // returns 5xx and Paddle retries until checkout has linked the subscription.
  async processPaddleWebhook(body: any): Promise<{
    status: string;
    idempotent?: boolean;
    matched?: boolean;
    eventType?: string;
  }> {
    const eventId = body?.event_id || body?.notification_id;
    const eventType = body?.event_type;
    const data = body?.data;
    if (!eventId || !eventType) return { status: 'ignored' };

    await this.ensureWebhookTable();

    const existing = await this.db.query(
      `SELECT id FROM webhook_events WHERE provider = 'paddle' AND event_id = $1`,
      [eventId],
    );
    if (existing.rows.length > 0) {
      return { status: 'success', idempotent: true, eventType };
    }

    // subscription.* events carry the subscription id in data.id; transaction.*
    // and adjustment.* carry it in data.subscription_id.
    const subId: string | null = eventType.startsWith('subscription.')
      ? data?.id || null
      : data?.subscription_id || null;
    const customUserId: string | null =
      data?.custom_data?.userId || data?.custom_data?.user_id || null;
    const customPlan: string | null = data?.custom_data?.plan || null;

    let handled = false;
    let matched = false;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.created':
        handled = true;
        if (customUserId && subId) {
          await this.activatePaddleSubscription(
            customUserId,
            subId,
            customPlan || 'pro',
          );
          matched = true;
        } else {
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'active',
            is_active: true,
          });
        }
        break;
      case 'transaction.completed':
      case 'transaction.paid':
        handled = true;
        matched = await this.setUserStatusByPaddleSub(subId, {
          payment_status: 'active',
          is_active: true,
        });
        break;
      case 'subscription.updated': {
        const status = data?.status;
        if (status === 'active') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'active',
            is_active: true,
          });
        } else if (status === 'past_due') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'past_due',
          });
        } else if (status === 'paused') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'suspended',
            is_active: false,
          });
        } else if (status === 'canceled') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'canceled',
            is_active: false,
          });
        }
        break;
      }
      case 'subscription.past_due':
        handled = true;
        matched = await this.setUserStatusByPaddleSub(subId, {
          payment_status: 'past_due',
        });
        break;
      case 'subscription.canceled':
        handled = true;
        matched = await this.setUserStatusByPaddleSub(subId, {
          payment_status: 'canceled',
          is_active: false,
        });
        break;
      case 'adjustment.created':
      case 'adjustment.updated':
        // Treat a full/partial refund adjustment as loss of access.
        if (data?.action === 'refund' && subId) {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'refunded',
            is_active: false,
          });
        }
        break;
      default:
        break;
    }

    if (handled && !matched) {
      throw new Error(
        `Paddle ${eventType} for ${subId || 'unknown'} matched no user yet; will retry`,
      );
    }

    await this.db.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, payload)
       VALUES ('paddle', $1, $2, $3::jsonb)
       ON CONFLICT (provider, event_id) DO NOTHING`,
      [eventId, eventType, JSON.stringify(body)],
    );

    return { status: 'success', matched, eventType };
  }

  // --- PayPal webhook processing (keeps the users table in sync with PayPal) ---

  // Update a user's payment status by their PayPal subscription id.
  private async setUserStatusBySubscription(
    subscriptionId: string | null,
    fields: { payment_status?: string; is_active?: boolean },
  ): Promise<boolean> {
    if (!subscriptionId) return false;
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (fields.payment_status !== undefined) {
      sets.push(`payment_status = $${i++}`);
      vals.push(fields.payment_status);
    }
    if (fields.is_active !== undefined) {
      sets.push(`is_active = $${i++}`);
      vals.push(fields.is_active);
    }
    if (!sets.length) return false;
    sets.push(`updated_at = NOW()`);
    vals.push(subscriptionId);
    const res = await this.db.query(
      `UPDATE users SET ${sets.join(', ')} WHERE paypal_subscription_id = $${i}`,
      vals,
    );
    return (res.rowCount || 0) > 0;
  }

  // The subscription id lives in resource.id for subscription events and in
  // resource.billing_agreement_id for the payment/refund/reversal events.
  private extractSubscriptionId(eventType: string, resource: any): string | null {
    if (!resource) return null;
    if (eventType.startsWith('BILLING.SUBSCRIPTION.')) return resource.id || null;
    return resource.billing_agreement_id || null;
  }

  // Idempotently process a verified PayPal webhook event and update the user's
  // subscription status. Duplicate deliveries are ignored via webhook_events.
  async processPayPalWebhook(body: any): Promise<{
    status: string;
    idempotent?: boolean;
    matched?: boolean;
    eventType?: string;
  }> {
    const eventId = body?.id;
    const eventType = body?.event_type;
    const resource = body?.resource;
    if (!eventId || !eventType) return { status: 'ignored' };

    await this.ensureWebhookTable();

    // Skip if we have already processed this event (idempotency).
    const existing = await this.db.query(
      `SELECT id FROM webhook_events WHERE provider = 'paypal' AND event_id = $1`,
      [eventId],
    );
    if (existing.rows.length > 0) {
      return { status: 'success', idempotent: true, eventType };
    }

    const subId = this.extractSubscriptionId(eventType, resource);
    let matched = false;
    let handled = false; // true when this event type should change a user's status

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'PAYMENT.SALE.COMPLETED':
      case 'PAYMENT.CAPTURE.COMPLETED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'active',
          is_active: true,
        });
        break;
      case 'BILLING.SUBSCRIPTION.UPDATED':
        if (resource?.status === 'ACTIVE') {
          handled = true;
          matched = await this.setUserStatusBySubscription(subId, {
            payment_status: 'active',
            is_active: true,
          });
        }
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      case 'PAYMENT.SALE.DENIED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'past_due',
        });
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'canceled',
          is_active: false,
        });
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'suspended',
          is_active: false,
        });
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'expired',
          is_active: false,
        });
        break;
      case 'PAYMENT.SALE.REFUNDED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        handled = true;
        matched = await this.setUserStatusBySubscription(
          await this.resolveRefundSubscriptionId(resource),
          { payment_status: 'refunded', is_active: false },
        );
        break;
      case 'PAYMENT.SALE.REVERSED':
      case 'PAYMENT.CAPTURE.REVERSED':
        handled = true;
        matched = await this.setUserStatusBySubscription(
          await this.resolveRefundSubscriptionId(resource),
          { payment_status: 'reversed', is_active: false },
        );
        break;
      default:
        // No status change for other event types.
        break;
    }

    // A status-changing event that matched no user is most likely arriving
    // before checkout finished linking the subscription. Do NOT record it; throw
    // so PayPal retries and it self-heals once the link exists.
    if (handled && !matched) {
      throw new Error(
        `PayPal ${eventType} for ${subId || 'unknown'} matched no user yet; will retry`,
      );
    }

    // Record only after successful processing so a mid-way failure can retry.
    await this.db.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, payload)
       VALUES ('paypal', $1, $2, $3::jsonb)
       ON CONFLICT (provider, event_id) DO NOTHING`,
      [eventId, eventType, JSON.stringify(body)],
    );

    return { status: 'success', matched, eventType };
  }

  // Ensure the idempotency table exists (once per process). It is also created
  // by migration 004; this guards environments where migrations have not run.
  private async ensureWebhookTable(): Promise<void> {
    if (this.webhookTableReady) return;
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS webhook_events (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         provider VARCHAR(50) NOT NULL,
         event_id VARCHAR(255) NOT NULL,
         event_type VARCHAR(100),
         processed_at TIMESTAMP DEFAULT NOW(),
         subscription_id UUID,
         payload JSONB,
         created_at TIMESTAMP DEFAULT NOW(),
         UNIQUE(provider, event_id)
       )`,
    );
    this.webhookTableReady = true;
  }

  // Refund/reversal resources do not carry the subscription id. Resolve it from
  // billing_agreement_id if present, otherwise look up the referenced sale.
  private async resolveRefundSubscriptionId(
    resource: any,
  ): Promise<string | null> {
    if (!resource) return null;
    if (resource.billing_agreement_id) return resource.billing_agreement_id;
    if (resource.sale_id) {
      return this.paypalService.getSaleBillingAgreementId(resource.sale_id);
    }
    return null;
  }
}
