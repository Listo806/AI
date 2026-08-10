import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { UsageService } from '../../plans/usage.service';

export interface SubscriptionFeatures {
  hasActiveSubscription: boolean;
  listingLimit: number | null; // NULL = unlimited
  currentListingCount: number;
  canCreateListing: boolean;
  crmAccess: boolean;
  aiFeatures: boolean;
  analyticsLevel: string;
  priorityExposure: boolean;
  aiAutomation: boolean;
  planName: string | null;
  planCategory: string | null;
}

@Injectable()
export class SubscriptionEnforcementService {
  constructor(
    private readonly db: DatabaseService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usage: UsageService,
  ) {}

  /**
   * Get subscription features for a team
   */
  async getTeamFeatures(teamId: string): Promise<SubscriptionFeatures> {
    const subscription = await this.subscriptionsService.findActiveByTeamId(teamId);

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      // No active LEGACY subscription row. Instead of locking the account out,
      // fall back to the canonical plan system (the `users` table) so that:
      //   - a genuine Free account gets Free-tier access (full basic CRM + basic
      //     AI on WhatsApp), which is what lets a new sign-up actually experience
      //     the product; and
      //   - a customer who paid through the new Paddle checkout (which records the
      //     payment on the users row, not this legacy table) keeps FULL access.
      // Premium AI capabilities (booking, appointment setter, advanced agent,
      // etc.) stay gated by the plan feature flags at their own call sites, so
      // "Free gets CRM + limited AI, premium stays locked" holds. featureAllowed
      // fails open, so a metering error can never wrongly lock a real user out.
      const listingCount = await this.getCurrentListingCount(teamId);
      const { paid } = await this.usage.resolveTeamPlan(teamId);
      const [crmAccess, aiFeatures, aiAutomation, advAnalytics] = await Promise.all([
        this.usage.featureAllowed(teamId, 'crm'),
        this.usage.featureAllowed(teamId, 'aiAgent'),
        this.usage.featureAllowed(teamId, 'advancedAutomations'),
        this.usage.featureAllowed(teamId, 'advancedAnalytics'),
      ]);
      return {
        hasActiveSubscription: paid,
        listingLimit: paid ? null : 0,
        currentListingCount: listingCount,
        canCreateListing: paid,
        crmAccess,
        aiFeatures,
        analyticsLevel: advAnalytics ? 'advanced' : crmAccess ? 'basic' : 'none',
        priorityExposure: paid,
        aiAutomation,
        planName: paid ? 'Paid' : crmAccess ? 'Free' : null,
        planCategory: paid ? 'paid' : crmAccess ? 'free' : null,
      };
    }

    // Get plan details with features
    const plan = await this.getPlanWithFeatures(subscription.planId);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const listingCount = await this.getCurrentListingCount(teamId);
    const listingLimit = plan.listingLimit;
    const canCreateListing = listingLimit === null || listingCount < listingLimit;

    return {
      hasActiveSubscription: true,
      listingLimit: plan.listingLimit,
      currentListingCount: listingCount,
      canCreateListing,
      crmAccess: plan.crmAccess,
      aiFeatures: plan.aiFeatures,
      analyticsLevel: plan.analyticsLevel,
      priorityExposure: plan.priorityExposure,
      aiAutomation: plan.aiAutomation,
      planName: plan.name,
      planCategory: plan.planCategory,
    };
  }

  /**
   * Check if team can create a listing (HARD BLOCK if limit reached)
   */
  async checkListingCreation(teamId: string): Promise<void> {
    const features = await this.getTeamFeatures(teamId);

    if (!features.canCreateListing) {
      throw new ForbiddenException(
        "You've reached your plan's listing limit. Please upgrade to continue.",
      );
    }
  }

  /**
   * Check if team has CRM access
   */
  async checkCrmAccess(teamId: string): Promise<void> {
    const features = await this.getTeamFeatures(teamId);

    if (!features.crmAccess) {
      throw new ForbiddenException(
        '🔒 This feature requires an active subscription with CRM access. Please upgrade to continue.',
      );
    }
  }

  /**
   * Check if team has AI features access
   */
  async checkAiFeatures(teamId: string): Promise<void> {
    const features = await this.getTeamFeatures(teamId);

    if (!features.aiFeatures) {
      throw new ForbiddenException(
        '🔒 This feature requires an active subscription with AI features. Please upgrade to continue.',
      );
    }
  }

  /**
   * Check if team has active subscription (for any feature that requires subscription)
   */
  async checkActiveSubscription(teamId: string): Promise<void> {
    const features = await this.getTeamFeatures(teamId);

    if (!features.hasActiveSubscription) {
      throw new ForbiddenException(
        '🔒 This feature requires an active subscription. Please upgrade to continue.',
      );
    }
  }

  /**
   * Get current listing count for a team
   */
  private async getCurrentListingCount(teamId: string): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*) as count
       FROM properties
       WHERE team_id = $1 AND status != 'archived'`,
      [teamId],
    );

    return parseInt(rows[0]?.count || '0', 10);
  }

  /**
   * Get plan with all feature details
   */
  private async getPlanWithFeatures(planId: string | null): Promise<any | null> {
    if (!planId) {
      return null;
    }

    const { rows } = await this.db.query(
      `SELECT id, name, description, price, seat_limit as "seatLimit", 
              paddle_price_id as "paddlePriceId", is_active as "isActive",
              listing_limit as "listingLimit", crm_access as "crmAccess",
              ai_features as "aiFeatures", analytics_level as "analyticsLevel",
              priority_exposure as "priorityExposure", ai_automation as "aiAutomation",
              plan_category as "planCategory",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM subscription_plans
       WHERE id = $1`,
      [planId],
    );

    return rows[0] || null;
  }
}
