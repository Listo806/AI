import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaddleService } from '../payments/paddle.service';
import { TeamsService } from '../teams/teams.service';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionPlansService } from './subscription-plans.service';
import { EventLoggerService } from '../analytics/events/event-logger.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paddleService: PaddleService,
    private readonly teamsService: TeamsService,
    private readonly plansService: SubscriptionPlansService,
    private readonly eventLogger: EventLoggerService,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto, userId: string): Promise<{ subscription: Subscription; checkoutUrl: string }> {
    const { planId, teamId } = createSubscriptionDto;

    // Verify team exists and user is owner
    const team = await this.teamsService.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only team owner can create subscriptions');
    }

    // Check if team already has an active subscription
    const existingSubscription = await this.findActiveByTeamId(teamId);
    if (existingSubscription) {
      throw new BadRequestException('Team already has an active subscription');
    }

    // Get plan details
    const plan = await this.plansService.findById(planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Subscription plan not found or inactive');
    }

    if (!plan.paddlePriceId) {
      throw new BadRequestException('Plan does not have a Paddle price ID configured');
    }

    // Get user email for checkout
    const { rows: userRows } = await this.db.query(
      `SELECT email FROM users WHERE id = $1`,
      [userId],
    );
    const userEmail = userRows[0]?.email;

    // Get existing Paddle customer ID if available (optional - Paddle creates customers automatically)
    let paddleCustomerId: string | undefined;
    const existingSubscriptionRecord = await this.findByTeamId(teamId);
    
    if (existingSubscriptionRecord?.paddleCustomerId) {
      paddleCustomerId = existingSubscriptionRecord.paddleCustomerId;
    } else {
      // Try to create customer, but don't fail if it's not permitted
      // Paddle will create the customer automatically during checkout
      try {
        const customer = await this.paddleService.createCustomer(userEmail, undefined, {
          teamId,
          userId,
        });
        paddleCustomerId = customer.id;
      } catch (error: any) {
        // If customer creation fails due to permissions, continue without customerId
        // Paddle will create the customer automatically during checkout
        console.log('Customer creation skipped (will be created during checkout):', error.message);
        paddleCustomerId = undefined;
      }
    }

    // Create checkout session
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/cancel`;
    
    let checkoutSession;
    try {
      checkoutSession = await this.paddleService.createCheckout({
        priceId: plan.paddlePriceId,
        customerEmail: userEmail,
        customerId: paddleCustomerId, // Optional - Paddle creates customer if not provided
        successUrl,
        cancelUrl,
        metadata: {
          teamId,
          planId,
        },
      });
    } catch (error: any) {
      // Handle Paddle API errors
      if (error.message?.includes('price') || error.message?.includes('not found')) {
        throw new BadRequestException(
          `Paddle price ID '${plan.paddlePriceId}' does not exist in your Paddle account. ` +
          `Please create the price in Paddle Dashboard first, or use a valid price ID.`
        );
      }
      throw new BadRequestException(`Paddle error: ${error.message || 'Unknown error'}`);
    }

    // Create subscription record (inactive until payment succeeds)
    // Note: paddle_customer_id may be null if customer creation was skipped
    // It will be set when the webhook processes the checkout completion
    const { rows } = await this.db.query(
      `INSERT INTO subscriptions (
        team_id, plan_id, paddle_customer_id, status, seat_limit, provider, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
                paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
                current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [teamId, planId, paddleCustomerId || null, SubscriptionStatus.INACTIVE, plan.seatLimit, 'paddle'],
    );

    const subscription = rows[0];

    // Link subscription to team
    await this.db.query(
      `UPDATE teams SET subscription_id = $1 WHERE id = $2`,
      [subscription.id, teamId],
    );

    // Log subscription created event
    await this.eventLogger.logSubscriptionCreated(subscription.id, teamId, planId, {
      provider: 'paddle',
      status: SubscriptionStatus.INACTIVE,
    });

    return {
      subscription,
      checkoutUrl: checkoutSession.checkoutUrl || '',
    };
  }

  async findByTeamId(teamId: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
              paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE team_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [teamId],
    );
    return rows[0] || null;
  }

  async findActiveByTeamId(teamId: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
              paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions 
       WHERE team_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [teamId],
    );
    return rows[0] || null;
  }

  async findById(id: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
              paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async findByPaddleSubscriptionId(paddleSubscriptionId: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
              paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE paddle_subscription_id = $1`,
      [paddleSubscriptionId],
    );
    return rows[0] || null;
  }

  async updateFromPaddle(paddleSubscription: any): Promise<Subscription> {
    // Try to find by paddle_subscription_id first
    let subscription = await this.findByPaddleSubscriptionId(paddleSubscription.id);
    
    // If not found, try to find by customer_id (subscription might not have paddle_subscription_id set yet)
    if (!subscription && paddleSubscription.customerId) {
      const customerId = paddleSubscription.customerId;
      
      const { rows } = await this.db.query(
        `SELECT id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
                paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
                current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
         FROM subscriptions 
         WHERE paddle_customer_id = $1 AND paddle_subscription_id IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [customerId],
      );
      
      if (rows.length > 0) {
        subscription = rows[0];
        // Update the subscription record with the paddle_subscription_id
        await this.db.query(
          `UPDATE subscriptions SET paddle_subscription_id = $1 WHERE id = $2`,
          [paddleSubscription.id, subscription.id],
        );
      }
    }
    
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for Paddle subscription ${paddleSubscription.id}. ` +
        `This may happen if the subscription was created outside of this system.`
      );
    }

    // Map Paddle status to our status
    const status = this.mapPaddleStatusToSubscriptionStatus(paddleSubscription.status);

    // Get plan from Paddle price
    const priceId = paddleSubscription.items?.[0]?.priceId || paddleSubscription.priceId;
    const plan = priceId ? await this.plansService.findByPaddlePriceId(priceId) : null;

    // Parse Paddle dates (Paddle uses ISO strings)
    const currentPeriodStart = paddleSubscription.currentBillingPeriod?.startsAt 
      ? new Date(paddleSubscription.currentBillingPeriod.startsAt) 
      : null;
    const currentPeriodEnd = paddleSubscription.currentBillingPeriod?.endsAt 
      ? new Date(paddleSubscription.currentBillingPeriod.endsAt) 
      : null;
    const canceledAt = paddleSubscription.canceledAt ? new Date(paddleSubscription.canceledAt) : null;

    const { rows } = await this.db.query(
      `UPDATE subscriptions SET
        plan_id = $1,
        status = $2,
        current_period_start = $3,
        current_period_end = $4,
        cancel_at_period_end = $5,
        canceled_at = $6,
        seat_limit = $7,
        paddle_subscription_id = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING id, team_id as "teamId", plan_id as "planId", paddle_subscription_id as "paddleSubscriptionId",
                 paddle_customer_id as "paddleCustomerId", status, current_period_start as "currentPeriodStart",
                 current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                 canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        plan?.id || subscription.planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        paddleSubscription.scheduledChange?.action === 'cancel' || false,
        canceledAt,
        plan?.seatLimit || subscription.seatLimit,
        paddleSubscription.id, // Set paddle_subscription_id
        subscription.id,
      ],
    );

    const updatedSubscription = rows[0];

    // Log subscription status change
    if (subscription.status !== status) {
      await this.eventLogger.logSubscriptionStatusChanged(
        updatedSubscription.id,
        updatedSubscription.teamId,
        subscription.status,
        status,
      );

      // Log activation if status changed to active
      if (status === SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.ACTIVE) {
        await this.eventLogger.logEvent({
          eventType: 'subscription.activated' as any,
          entityType: 'subscription' as any,
          entityId: updatedSubscription.id,
          teamId: updatedSubscription.teamId,
        });
      }
    }

    // Increment team token_version to invalidate tokens when subscription changes
    // This ensures users with canceled subscriptions can't continue using the system
    await this.db.query(
      `UPDATE teams 
       SET token_version = token_version + 1, updated_at = NOW()
       WHERE id = $1`,
      [updatedSubscription.teamId],
    );

    // Enforce seat limits when subscription becomes active
    if (status === SubscriptionStatus.ACTIVE && updatedSubscription.teamId) {
      await this.enforceSeatLimits(updatedSubscription.teamId, updatedSubscription.seatLimit);
    }

    return updatedSubscription;
  }

  async cancel(subscriptionId: string, userId: string, immediately: boolean = false): Promise<Subscription> {
    const subscription = await this.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify user is team owner
    const team = await this.teamsService.findById(subscription.teamId);
    if (!team || team.ownerId !== userId) {
      throw new ForbiddenException('Only team owner can cancel subscription');
    }

    if (!subscription.paddleSubscriptionId) {
      throw new BadRequestException('Subscription does not have a Paddle subscription ID');
    }

    // Cancel in Paddle
    await this.paddleService.cancelSubscription(subscription.paddleSubscriptionId, immediately);

    // Update local record
    const status = immediately ? SubscriptionStatus.CANCELED : subscription.status;
    const canceledAt = immediately ? new Date() : subscription.canceledAt;

    const oldStatus = subscription.status;

    const { rows } = await this.db.query(
      `UPDATE subscriptions SET
        status = $1,
        cancel_at_period_end = $2,
        canceled_at = $3,
        updated_at = NOW()
       WHERE id = $4
       RETURNING id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
                 stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
                 current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                 canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [status, !immediately, canceledAt, subscriptionId],
    );

    const cancelledSubscription = rows[0];

    // Log cancellation event
    await this.eventLogger.logSubscriptionCancelled(cancelledSubscription.id, cancelledSubscription.teamId, {
      immediately,
      oldStatus,
      newStatus: status,
    });

    return cancelledSubscription;
  }

  async createBillingPortalSession(teamId: string, userId: string): Promise<string> {
    const subscription = await this.findByTeamId(teamId);
    if (!subscription || !subscription.paddleCustomerId) {
      throw new NotFoundException('Subscription or customer not found');
    }

    // Verify user is team owner
    const team = await this.teamsService.findById(teamId);
    if (!team || team.ownerId !== userId) {
      throw new ForbiddenException('Only team owner can access billing portal');
    }

    // Paddle doesn't have a billing portal like Stripe
    // Return the Paddle customer portal URL or subscription management URL
    // This would need to be implemented based on Paddle's customer portal API
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription`;
    
    // For now, return a placeholder - Paddle customer portal URL would need to be generated
    // Check Paddle documentation for customer portal implementation
    throw new BadRequestException('Billing portal not yet implemented for Paddle. Please manage your subscription through Paddle directly.');
  }

  private mapPaddleStatusToSubscriptionStatus(paddleStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      paused: SubscriptionStatus.SUSPENDED,
      trialing: SubscriptionStatus.TRIALING,
    };

    return statusMap[paddleStatus?.toLowerCase()] || SubscriptionStatus.INACTIVE;
  }

  private async enforceSeatLimits(teamId: string, seatLimit: number): Promise<void> {
    await this.teamsService.enforceSeatLimits(teamId);
    
    // Update team seat limit
    await this.db.query(
      `UPDATE teams SET seat_limit = $1 WHERE id = $2`,
      [seatLimit, teamId],
    );
  }

  // PayPal-specific methods (stubs for now - implement when PayPal integration is needed)
  async getSubscriptionByPaypalId(paypalSubscriptionId: string): Promise<Subscription | null> {
    // TODO: Add paypal_subscription_id column to subscriptions table if needed
    // For now, this is a placeholder
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
              stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE stripe_subscription_id = $1`,
      [paypalSubscriptionId],
    );
    return rows[0] || null;
  }

  async updateSubscriptionFromWebhook(
    paypalSubscriptionId: string,
    updates: {
      status?: SubscriptionStatus;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      canceledAt?: Date;
      cancelAtPeriodEnd?: boolean;
    },
  ): Promise<Subscription> {
    const subscription = await this.getSubscriptionByPaypalId(paypalSubscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.currentPeriodStart !== undefined) {
      updateFields.push(`current_period_start = $${paramCount++}`);
      values.push(updates.currentPeriodStart);
    }
    if (updates.currentPeriodEnd !== undefined) {
      updateFields.push(`current_period_end = $${paramCount++}`);
      values.push(updates.currentPeriodEnd);
    }
    if (updates.canceledAt !== undefined) {
      updateFields.push(`canceled_at = $${paramCount++}`);
      values.push(updates.canceledAt);
    }
    if (updates.cancelAtPeriodEnd !== undefined) {
      updateFields.push(`cancel_at_period_end = $${paramCount++}`);
      values.push(updates.cancelAtPeriodEnd);
    }

    if (updateFields.length === 0) {
      return subscription;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(subscription.id);

    const { rows } = await this.db.query(
      `UPDATE subscriptions SET ${updateFields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
                 stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
                 current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                 canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    return rows[0];
  }

  async createPayment(data: {
    subscriptionId: string;
    paypalTransactionId?: string;
    stripePaymentIntentId?: string;
    amount: number;
    currency: string;
    status: string;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO payments (subscription_id, stripe_payment_intent_id, amount, currency, status, payment_date, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
         status = EXCLUDED.status`,
      [
        data.subscriptionId,
        data.stripePaymentIntentId || data.paypalTransactionId || null,
        data.amount,
        data.currency,
        data.status,
      ],
    );
  }
}
