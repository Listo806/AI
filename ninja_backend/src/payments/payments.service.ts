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
}