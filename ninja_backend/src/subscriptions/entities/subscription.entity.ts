export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  SUSPENDED = 'suspended',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
  INACTIVE = 'inactive',
}

export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  seatLimit: number;
  paddlePriceId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  teamId: string;
  planId: string | null;
  paddleSubscriptionId: string | null;
  paddleCustomerId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  seatLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  paddleTransactionId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentDate: Date;
  createdAt: Date;
}

export interface CreateSubscriptionDto {
  planId: string;
  teamId: string;
}

export interface UpdateSubscriptionDto {
  planId?: string;
  status?: SubscriptionStatus;
  seatLimit?: number;
}

