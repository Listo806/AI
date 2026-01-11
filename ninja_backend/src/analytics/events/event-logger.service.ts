import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export enum EventType {
  // Lead events
  LEAD_CREATED = 'lead.created',
  LEAD_UPDATED = 'lead.updated',
  LEAD_STATUS_CHANGED = 'lead.status_changed',
  LEAD_ASSIGNED = 'lead.assigned',
  LEAD_DELETED = 'lead.deleted',

  // Property events
  PROPERTY_CREATED = 'property.created',
  PROPERTY_UPDATED = 'property.updated',
  PROPERTY_PUBLISHED = 'property.published',
  PROPERTY_STATUS_CHANGED = 'property.status_changed',
  PROPERTY_DELETED = 'property.deleted',

  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  SUBSCRIPTION_ACTIVATED = 'subscription.activated',
  SUBSCRIPTION_DEACTIVATED = 'subscription.deactivated',

  // Team events
  TEAM_CREATED = 'team.created',
  TEAM_UPDATED = 'team.updated',
  TEAM_MEMBER_ADDED = 'team.member_added',
  TEAM_MEMBER_REMOVED = 'team.member_removed',

  // User events
  USER_SIGNED_UP = 'user.signed_up',
  USER_LOGGED_IN = 'user.logged_in',
  USER_UPDATED = 'user.updated',

  // Payment events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
}

export enum EntityType {
  LEAD = 'lead',
  PROPERTY = 'property',
  SUBSCRIPTION = 'subscription',
  TEAM = 'team',
  USER = 'user',
  PAYMENT = 'payment',
}

export interface EventMetadata {
  [key: string]: any;
}

export interface LogEventParams {
  eventType: EventType;
  entityType: EntityType;
  entityId?: string;
  userId?: string;
  teamId?: string | null;
  metadata?: EventMetadata;
}

@Injectable()
export class EventLoggerService {
  private readonly logger = new Logger(EventLoggerService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Log an event to the database
   */
  async logEvent(params: LogEventParams): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO events (event_type, entity_type, entity_id, user_id, team_id, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          params.eventType,
          params.entityType,
          params.entityId || null,
          params.userId || null,
          params.teamId || null,
          params.metadata ? JSON.stringify(params.metadata) : null,
        ],
      );
    } catch (error: any) {
      // Log error but don't throw - event logging should not break core flows
      this.logger.error(`Failed to log event: ${params.eventType}`, error);
    }
  }

  /**
   * Log lead created event
   */
  async logLeadCreated(leadId: string, userId: string, teamId: string | null, metadata?: EventMetadata): Promise<void> {
    await this.logEvent({
      eventType: EventType.LEAD_CREATED,
      entityType: EntityType.LEAD,
      entityId: leadId,
      userId,
      teamId,
      metadata,
    });
  }

  /**
   * Log lead updated event
   */
  async logLeadUpdated(leadId: string, userId: string, teamId: string | null, metadata?: EventMetadata): Promise<void> {
    await this.logEvent({
      eventType: EventType.LEAD_UPDATED,
      entityType: EntityType.LEAD,
      entityId: leadId,
      userId,
      teamId,
      metadata,
    });
  }

  /**
   * Log lead status changed event
   */
  async logLeadStatusChanged(
    leadId: string,
    userId: string,
    teamId: string | null,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.LEAD_STATUS_CHANGED,
      entityType: EntityType.LEAD,
      entityId: leadId,
      userId,
      teamId,
      metadata: { oldStatus, newStatus },
    });
  }

  /**
   * Log lead assigned event
   */
  async logLeadAssigned(
    leadId: string,
    userId: string,
    teamId: string | null,
    assignedTo: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.LEAD_ASSIGNED,
      entityType: EntityType.LEAD,
      entityId: leadId,
      userId,
      teamId,
      metadata: { assignedTo },
    });
  }

  /**
   * Log property created event
   */
  async logPropertyCreated(
    propertyId: string,
    userId: string,
    teamId: string | null,
    metadata?: EventMetadata,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.PROPERTY_CREATED,
      entityType: EntityType.PROPERTY,
      entityId: propertyId,
      userId,
      teamId,
      metadata,
    });
  }

  /**
   * Log property published event
   */
  async logPropertyPublished(
    propertyId: string,
    userId: string,
    teamId: string | null,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.PROPERTY_PUBLISHED,
      entityType: EntityType.PROPERTY,
      entityId: propertyId,
      userId,
      teamId,
    });
  }

  /**
   * Log property status changed event
   */
  async logPropertyStatusChanged(
    propertyId: string,
    userId: string,
    teamId: string | null,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.PROPERTY_STATUS_CHANGED,
      entityType: EntityType.PROPERTY,
      entityId: propertyId,
      userId,
      teamId,
      metadata: { oldStatus, newStatus },
    });
  }

  /**
   * Log subscription created event
   */
  async logSubscriptionCreated(
    subscriptionId: string,
    teamId: string,
    planId: string,
    metadata?: EventMetadata,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.SUBSCRIPTION_CREATED,
      entityType: EntityType.SUBSCRIPTION,
      entityId: subscriptionId,
      teamId,
      metadata: { planId, ...metadata },
    });
  }

  /**
   * Log subscription status changed event
   */
  async logSubscriptionStatusChanged(
    subscriptionId: string,
    teamId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.SUBSCRIPTION_UPDATED,
      entityType: EntityType.SUBSCRIPTION,
      entityId: subscriptionId,
      teamId,
      metadata: { oldStatus, newStatus },
    });
  }

  /**
   * Log subscription cancelled event
   */
  async logSubscriptionCancelled(
    subscriptionId: string,
    teamId: string,
    metadata?: EventMetadata,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.SUBSCRIPTION_CANCELLED,
      entityType: EntityType.SUBSCRIPTION,
      entityId: subscriptionId,
      teamId,
      metadata,
    });
  }

  /**
   * Log team member added event
   */
  async logTeamMemberAdded(
    teamId: string,
    userId: string,
    memberId: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.TEAM_MEMBER_ADDED,
      entityType: EntityType.TEAM,
      entityId: teamId,
      userId,
      teamId,
      metadata: { memberId },
    });
  }

  /**
   * Log team member removed event
   */
  async logTeamMemberRemoved(
    teamId: string,
    userId: string,
    memberId: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.TEAM_MEMBER_REMOVED,
      entityType: EntityType.TEAM,
      entityId: teamId,
      userId,
      teamId,
      metadata: { memberId },
    });
  }

  /**
   * Log user signed up event
   */
  async logUserSignedUp(userId: string, metadata?: EventMetadata): Promise<void> {
    await this.logEvent({
      eventType: EventType.USER_SIGNED_UP,
      entityType: EntityType.USER,
      entityId: userId,
      userId,
      metadata,
    });
  }

  /**
   * Log user logged in event
   */
  async logUserLoggedIn(userId: string, teamId: string | null): Promise<void> {
    await this.logEvent({
      eventType: EventType.USER_LOGGED_IN,
      entityType: EntityType.USER,
      entityId: userId,
      userId,
      teamId,
    });
  }

  /**
   * Log payment succeeded event
   */
  async logPaymentSucceeded(
    paymentId: string,
    userId: string,
    teamId: string | null,
    amount: number,
    currency: string,
    metadata?: EventMetadata,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.PAYMENT_SUCCEEDED,
      entityType: EntityType.PAYMENT,
      entityId: paymentId,
      userId,
      teamId,
      metadata: { amount, currency, ...metadata },
    });
  }

  /**
   * Log payment failed event
   */
  async logPaymentFailed(
    paymentId: string,
    userId: string,
    teamId: string | null,
    amount: number,
    currency: string,
    reason: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: EventType.PAYMENT_FAILED,
      entityType: EntityType.PAYMENT,
      entityId: paymentId,
      userId,
      teamId,
      metadata: { amount, currency, reason },
    });
  }
}

