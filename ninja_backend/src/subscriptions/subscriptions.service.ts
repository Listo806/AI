import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StripeService } from '../payments/stripe.service';
import { TeamsService } from '../teams/teams.service';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionPlansService } from './subscription-plans.service';
import { EventLoggerService } from '../analytics/events/event-logger.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly stripeService: StripeService,
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

    if (!plan.stripePriceId) {
      throw new BadRequestException('Plan does not have a Stripe price ID configured');
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const existingSubscriptionRecord = await this.findByTeamId(teamId);
    
    if (existingSubscriptionRecord?.stripeCustomerId) {
      stripeCustomerId = existingSubscriptionRecord.stripeCustomerId;
    } else {
      // Get user email for customer creation
      const { rows: userRows } = await this.db.query(
        `SELECT email FROM users WHERE id = $1`,
        [userId],
      );
      const userEmail = userRows[0]?.email;

      const customer = await this.stripeService.createCustomer(userEmail, undefined, {
        teamId,
        userId,
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/cancel`;
    
    let checkoutSession;
    try {
      checkoutSession = await this.stripeService.createCheckoutSession(
        stripeCustomerId,
        plan.stripePriceId,
        successUrl,
        cancelUrl,
        {
          teamId,
          planId,
        },
      );
    } catch (error: any) {
      // Handle Stripe API errors
      if (error.type === 'StripeInvalidRequestError') {
        if (error.code === 'resource_missing' || error.message?.includes('No such price')) {
          throw new BadRequestException(
            `Stripe price ID '${plan.stripePriceId}' does not exist in your Stripe account. ` +
            `Please create the price in Stripe Dashboard first, or use a valid price ID.`
          );
        }
        throw new BadRequestException(`Stripe error: ${error.message || error.code}`);
      }
      throw error;
    }

    // Create subscription record (inactive until payment succeeds)
    const { rows } = await this.db.query(
      `INSERT INTO subscriptions (
        team_id, plan_id, stripe_customer_id, status, seat_limit, provider, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
                stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
                current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [teamId, planId, stripeCustomerId, SubscriptionStatus.INACTIVE, plan.seatLimit, 'stripe'],
    );

    const subscription = rows[0];

    // Link subscription to team
    await this.db.query(
      `UPDATE teams SET subscription_id = $1 WHERE id = $2`,
      [subscription.id, teamId],
    );

    // Log subscription created event
    await this.eventLogger.logSubscriptionCreated(subscription.id, teamId, planId, {
      provider: 'stripe',
      status: SubscriptionStatus.INACTIVE,
    });

    return {
      subscription,
      checkoutUrl: checkoutSession.url || '',
    };
  }

  async findByTeamId(teamId: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
              stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE team_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [teamId],
    );
    return rows[0] || null;
  }

  async findActiveByTeamId(teamId: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
              stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
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
      `SELECT id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
              stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
              stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
              current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
              canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId],
    );
    return rows[0] || null;
  }

  async updateFromStripe(stripeSubscription: Stripe.Subscription): Promise<Subscription> {
    // Try to find by stripe_subscription_id first
    let subscription = await this.findByStripeSubscriptionId(stripeSubscription.id);
    
    // If not found, try to find by customer_id (subscription might not have stripe_subscription_id set yet)
    if (!subscription && stripeSubscription.customer) {
      const customerId = typeof stripeSubscription.customer === 'string' 
        ? stripeSubscription.customer 
        : stripeSubscription.customer.id;
      
      const { rows } = await this.db.query(
        `SELECT id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
                stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
                current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
         FROM subscriptions 
         WHERE stripe_customer_id = $1 AND stripe_subscription_id IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [customerId],
      );
      
      if (rows.length > 0) {
        subscription = rows[0];
        // Update the subscription record with the stripe_subscription_id
        await this.db.query(
          `UPDATE subscriptions SET stripe_subscription_id = $1 WHERE id = $2`,
          [stripeSubscription.id, subscription.id],
        );
      }
    }
    
    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for Stripe subscription ${stripeSubscription.id}. ` +
        `This may happen if the subscription was created outside of this system.`
      );
    }

    // Map Stripe status to our status
    const status = this.mapStripeStatusToSubscriptionStatus(stripeSubscription.status);

    // Get plan from Stripe price
    const priceId = stripeSubscription.items.data[0]?.price.id;
    const plan = priceId ? await this.plansService.findByStripePriceId(priceId) : null;

    const { rows } = await this.db.query(
      `UPDATE subscriptions SET
        plan_id = $1,
        status = $2,
        current_period_start = $3,
        current_period_end = $4,
        cancel_at_period_end = $5,
        canceled_at = $6,
        seat_limit = $7,
        stripe_subscription_id = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING id, team_id as "teamId", plan_id as "planId", stripe_subscription_id as "stripeSubscriptionId",
                 stripe_customer_id as "stripeCustomerId", status, current_period_start as "currentPeriodStart",
                 current_period_end as "currentPeriodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
                 canceled_at as "canceledAt", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        plan?.id || subscription.planId,
        status,
        (stripeSubscription as any).current_period_start ? new Date((stripeSubscription as any).current_period_start * 1000) : null,
        (stripeSubscription as any).current_period_end ? new Date((stripeSubscription as any).current_period_end * 1000) : null,
        (stripeSubscription as any).cancel_at_period_end || false,
        (stripeSubscription as any).canceled_at ? new Date((stripeSubscription as any).canceled_at * 1000) : null,
        plan?.seatLimit || subscription.seatLimit,
        stripeSubscription.id, // Set stripe_subscription_id
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

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Subscription does not have a Stripe subscription ID');
    }

    // Cancel in Stripe
    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);

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
    if (!subscription || !subscription.stripeCustomerId) {
      throw new NotFoundException('Subscription or customer not found');
    }

    // Verify user is team owner
    const team = await this.teamsService.findById(teamId);
    if (!team || team.ownerId !== userId) {
      throw new ForbiddenException('Only team owner can access billing portal');
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription`;
    const session = await this.stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
      returnUrl,
    );

    return session.url;
  }

  private mapStripeStatusToSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      trialing: SubscriptionStatus.TRIALING,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.INACTIVE;
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
