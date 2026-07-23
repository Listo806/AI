import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService) {}

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
}
