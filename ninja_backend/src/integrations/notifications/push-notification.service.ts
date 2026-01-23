import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as webpush from 'web-push';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';

export interface PushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SendNotificationDto {
  userId?: string;
  teamId?: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private readonly vapidSubject: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.vapidPublicKey = this.configService.get('VAPID_PUBLIC_KEY') || '';
    this.vapidPrivateKey = this.configService.get('VAPID_PRIVATE_KEY') || '';
    this.vapidSubject = this.configService.get('VAPID_SUBJECT') || 'mailto:admin@example.com';

    if (this.vapidPublicKey && this.vapidPrivateKey) {
      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );
      this.isConfigured = true;
      this.logger.log('Push notification service configured');
    } else {
      this.logger.warn(
        'Push notification service not configured. ' +
        'Required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY'
      );
      this.isConfigured = false;
    }
  }

  /**
   * Get VAPID public key (needed for frontend subscription)
   */
  getVapidPublicKey(): string {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }
    return this.vapidPublicKey;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: string, subscription: PushSubscriptionDto): Promise<{ id: string }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }

    // Validate subscription
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      throw new BadRequestException('Invalid push subscription data');
    }

    try {
      // Check if subscription already exists
      const { rows: existing } = await this.db.query(
        `SELECT id FROM push_subscriptions 
         WHERE user_id = $1 AND endpoint = $2`,
        [userId, subscription.endpoint],
      );

      if (existing.length > 0) {
        // Update existing subscription
        await this.db.query(
          `UPDATE push_subscriptions 
           SET p256dh = $1, auth = $2, updated_at = NOW()
           WHERE id = $3`,
          [subscription.keys.p256dh, subscription.keys.auth, existing[0].id],
        );
        this.logger.log(`Updated push subscription for user ${userId}`);
        return { id: existing[0].id };
      }

      // Create new subscription
      const { rows } = await this.db.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
      );

      this.logger.log(`New push subscription created for user ${userId}`);
      return { id: rows[0].id };
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation - subscription already exists
        const { rows } = await this.db.query(
          `SELECT id FROM push_subscriptions 
           WHERE user_id = $1 AND endpoint = $2`,
          [userId, subscription.endpoint],
        );
        return { id: rows[0].id };
      }
      this.logger.error(`Failed to subscribe user: ${error.message}`, error);
      throw new BadRequestException('Failed to create push subscription');
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }

    const { rows } = await this.db.query(
      `DELETE FROM push_subscriptions 
       WHERE user_id = $1 AND endpoint = $2
       RETURNING id`,
      [userId, endpoint],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Push subscription not found');
    }

    this.logger.log(`Unsubscribed user ${userId} from push notifications`);
  }

  /**
   * Unsubscribe user from all push notifications
   */
  async unsubscribeAll(userId: string): Promise<{ count: number }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }

    const { rows } = await this.db.query(
      `DELETE FROM push_subscriptions 
       WHERE user_id = $1
       RETURNING id`,
      [userId],
    );

    this.logger.log(`Unsubscribed user ${userId} from all push notifications`);
    return { count: rows.length };
  }

  /**
   * Send a notification to a specific user
   */
  async sendToUser(userId: string, notification: SendNotificationDto): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }

    // Get all subscriptions for the user
    const { rows } = await this.db.query(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
      [userId],
    );

    if (rows.length === 0) {
      this.logger.warn(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    return this.sendToSubscriptions(rows, notification);
  }

  /**
   * Send a notification to all users in a team
   */
  async sendToTeam(teamId: string, notification: SendNotificationDto): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }

    // Get all subscriptions for team members
    const { rows } = await this.db.query(
      `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
       FROM push_subscriptions ps
       INNER JOIN users u ON u.id = ps.user_id
       WHERE u.team_id = $1`,
      [teamId],
    );

    if (rows.length === 0) {
      this.logger.warn(`No push subscriptions found for team ${teamId}`);
      return { sent: 0, failed: 0 };
    }

    return this.sendToSubscriptions(rows, notification);
  }

  /**
   * Send a notification to all subscribed users
   */
  async sendToAll(notification: SendNotificationDto): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Push notification service is not configured');
    }

    const { rows } = await this.db.query(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions`,
    );

    if (rows.length === 0) {
      this.logger.warn('No push subscriptions found');
      return { sent: 0, failed: 0 };
    }

    return this.sendToSubscriptions(rows, notification);
  }

  /**
   * Internal method to send notifications to subscriptions
   */
  private async sendToSubscriptions(
    subscriptions: any[],
    notification: SendNotificationDto,
  ): Promise<{ sent: number; failed: number }> {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      image: notification.image,
      data: notification.data || {},
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
    });

    let sent = 0;
    let failed = 0;
    const invalidSubscriptions: string[] = [];

    // Send to all subscriptions
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        this.logger.debug(`Notification sent to subscription ${sub.id}`);
      } catch (error: any) {
        failed++;
        
        // If subscription is invalid (410 Gone), mark for deletion
        if (error.statusCode === 410 || error.statusCode === 404) {
          invalidSubscriptions.push(sub.id);
          this.logger.warn(`Invalid subscription ${sub.id}, will be removed`);
        } else {
          this.logger.error(`Failed to send notification to ${sub.id}: ${error.message}`);
        }
      }
    });

    await Promise.all(promises);

    // Remove invalid subscriptions
    if (invalidSubscriptions.length > 0) {
      await this.db.query(
        `DELETE FROM push_subscriptions WHERE id = ANY($1::uuid[])`,
        [invalidSubscriptions],
      );
      this.logger.log(`Removed ${invalidSubscriptions.length} invalid subscriptions`);
    }

    return { sent, failed };
  }

  /**
   * Get user's push subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT id, endpoint, created_at, updated_at 
       FROM push_subscriptions 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return rows;
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      isConfigured: this.isConfigured,
      hasPublicKey: !!this.vapidPublicKey,
      hasPrivateKey: !!this.vapidPrivateKey,
      vapidSubject: this.vapidSubject,
      publicKeyPrefix: this.vapidPublicKey ? `${this.vapidPublicKey.substring(0, 10)}...` : 'not set',
    };
  }
}

