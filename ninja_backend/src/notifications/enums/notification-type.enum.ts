export enum NotificationType {
  // TEAM
  TEAM_CREATED = "team.created",
  TEAM_UPDATED = "team.updated",
  TEAM_MEMBER_ADDED = "team.member_added",
  TEAM_MEMBER_REMOVED = "team.member_removed",
  TEAM_MEMBER_DEACTIVATED = "team.member_deactivated",

  // LEADS
  LEAD_CREATED = "lead.created",
  LEAD_UPDATED = "lead.updated",
  LEAD_ASSIGNED = "lead.assigned",
  LEAD_STATUS_CHANGED = "lead.status_changed",

  // DEALS
  DEAL_CREATED = "deal.created",
  DEAL_UPDATED = "deal.updated",
  DEAL_WON = "deal.won",

  // PROPERTY
  PROPERTY_CREATED = "property.created",
  PROPERTY_PUBLISHED = "property.published",

  // SUBSCRIPTION
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_CANCELLED = "subscription.cancelled",

  // PAYMENT
  PAYMENT_SUCCEEDED = "payment.succeeded",
  PAYMENT_FAILED = "payment.failed",
}

export enum NotificationCategory {
  TEAM = "team",
  LEAD = "lead",
  DEAL = "deal",
  PAYMENT = "payment",
  SUBSCRIPTION = "subscription",
  AI = "ai",
  SYSTEM = "system",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum NotificationEntityType {
  TEAM = "team",
  USER = "user",
  LEAD = "lead",
  DEAL = "deal",
  PAYMENT = "payment",
  SUBSCRIPTION = "subscription",
}
