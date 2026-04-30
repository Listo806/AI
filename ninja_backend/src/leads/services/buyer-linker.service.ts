import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PhoneNormalizer } from '../utils/phone-normalizer';

@Injectable()
export class BuyerLinkerService {
  private readonly logger = new Logger(BuyerLinkerService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Find or create buyer by phone/email
   * Match priority: phone > email
   *
   * @param phone - Phone number (E.164 format)
   * @param email - Email address (optional)
   * @returns Buyer ID or null
   */
  async findOrCreateBuyer(
    phone: string | null,
    email: string | null,
  ): Promise<string | null> {
    if (!phone && !email) {
      return null;
    }

    // Normalize phone if provided
    const normalizedPhone = phone ? PhoneNormalizer.normalize(phone) : null;

    // Try to find existing buyer by phone (priority 1)
    if (normalizedPhone) {
      const buyerByPhone = await this.findBuyerByPhone(normalizedPhone);
      if (buyerByPhone) {
        this.logger.debug(`Found buyer by phone: ${buyerByPhone}`);
        return buyerByPhone;
      }
    }

    // Try to find existing buyer by email (priority 2)
    if (email) {
      const buyerByEmail = await this.findBuyerByEmail(email);
      if (buyerByEmail) {
        this.logger.debug(`Found buyer by email: ${buyerByEmail}`);
        return buyerByEmail;
      }
    }

    // Create new buyer if not found
    if (normalizedPhone || email) {
      const newBuyerId = await this.createBuyer(normalizedPhone, email);
      this.logger.debug(`Created new buyer: ${newBuyerId}`);
      return newBuyerId;
    }

    return null;
  }

  /**
   * Find buyer by phone number
   */
  private async findBuyerByPhone(phone: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT id FROM buyers 
       WHERE phone = $1 
       LIMIT 1`,
      [phone],
    );

    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Find buyer by email
   */
  private async findBuyerByEmail(email: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT id FROM buyers 
       WHERE email = $1 
       LIMIT 1`,
      [email],
    );

    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Create new buyer record
   */
  private async createBuyer(
    phone: string | null,
    email: string | null,
  ): Promise<string | null> {
    // Generate a session_id for anonymous buyer
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { rows } = await this.db.query(
      `INSERT INTO buyers (session_id, phone, email, last_activity_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW(), NOW())
       RETURNING id`,
      [sessionId, phone, email],
    );

    return rows.length > 0 ? rows[0].id : null;
  }
}
