# Production Readiness: Critical Implementation Details

This document addresses four critical production-level concerns for the SaaS backend system.

## 1. Seat Race Conditions

### Problem
When two users attempt to join or activate seats simultaneously, there's a race condition that can lead to oversubscription. The current `addMember` method checks availability and then adds the member without atomic guarantees.

### Solution: Database Transactions with Row-Level Locking

**Strategy**: PostgreSQL transactions with `SELECT FOR UPDATE` row-level locking and atomic seat counting.

**Implementation**:
- Use database transactions to ensure atomicity
- Lock the team row during seat operations using `SELECT FOR UPDATE`
- Use atomic counter updates with `WHERE` clauses that enforce constraints
- Implement optimistic locking with version numbers (optional enhancement)

**Database Level Protection**:
```sql
-- Transaction ensures atomicity
BEGIN;
  -- Lock team row to prevent concurrent modifications
  SELECT * FROM teams WHERE id = $1 FOR UPDATE;
  
  -- Check and update atomically
  UPDATE users 
  SET team_id = $1, is_active = true 
  WHERE id = $2 
  AND (SELECT COUNT(*) FROM users WHERE team_id = $1 AND is_active = true) < 
      (SELECT seat_limit FROM teams WHERE id = $1);
COMMIT;
```

**Code Location**: `src/teams/teams.service.ts` - `addMember()` method

**Key Changes**:
1. Wrap seat operations in database transactions
2. Use `SELECT FOR UPDATE` to lock team row
3. Use atomic `UPDATE` with `WHERE` clause that enforces seat limit
4. Return clear error if seat limit would be exceeded

---

## 2. Webhook Idempotency

### Problem
Stripe (and PayPal) can send duplicate webhook events. Without idempotency tracking, the same event could:
- Process seat changes multiple times
- Flip billing states incorrectly (active → canceled → active)
- Create duplicate payment records

### Solution: Event ID Tracking with Deduplication

**Strategy**: Store processed webhook event IDs in a dedicated table and check before processing.

**Database Schema**:
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL, -- 'stripe' or 'paypal'
  event_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe event.id or PayPal event.id
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  subscription_id UUID REFERENCES subscriptions(id),
  payload JSONB, -- Store full event for debugging
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_provider_id ON webhook_events(provider, event_id);
CREATE INDEX idx_webhook_events_subscription ON webhook_events(subscription_id);
```

**Implementation Pattern**:
1. Extract event ID from webhook payload
2. Check if event already processed (SELECT with event_id)
3. If not processed: Insert event record, process webhook, commit
4. If already processed: Return success (idempotent response)
5. Use database UNIQUE constraint to prevent race conditions

**Code Location**: 
- `src/subscriptions/webhooks/stripe-webhook.controller.ts`
- `src/payments/webhooks.controller.ts` (PayPal)

**Key Changes**:
1. Create `webhook_events` table migration
2. Add idempotency check at start of webhook handler
3. Store event ID before processing
4. Return early if event already processed

---

## 3. Role / Plan Changes Mid-Session

### Problem
If a user's role or subscription changes while their JWT is still valid:
- Existing tokens remain valid until expiration
- User retains old permissions
- Subscription status changes aren't enforced immediately

### Solution: Hybrid Approach - Re-check State + Token Versioning

**Strategy**: 
1. **Re-check state on every request** (already partially implemented)
2. **Add token versioning** to force invalidation when critical changes occur
3. **Store token version in JWT payload** and compare with database

**Implementation**:

**Database Schema Addition**:
```sql
-- Add token_version to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;

-- Add token_version to teams table (for subscription changes)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
```

**JWT Payload Enhancement**:
```typescript
// Include token_version in JWT payload
const payload = { 
  id: user.id, 
  email: user.email, 
  role: user.role,
  tokenVersion: user.tokenVersion, // NEW
  teamTokenVersion: team?.tokenVersion || 0 // NEW
};
```

**Validation Strategy**:
1. **On every request**: JWT strategy validates user and checks `is_active`
2. **Token version check**: Compare JWT `tokenVersion` with database `user.token_version`
3. **Team token version check**: Compare JWT `teamTokenVersion` with database `team.token_version`
4. **If mismatch**: Reject token (forces re-login)

**When to Increment Token Versions**:
- User role changes → increment `users.token_version`
- User is deactivated → increment `users.token_version`
- Subscription status changes → increment `teams.token_version`
- Seat limit changes → increment `teams.token_version`

**Code Locations**:
- `src/auth/strategies/jwt.strategy.ts` - Add version checks
- `src/users/users.service.ts` - Increment version on role changes
- `src/subscriptions/subscriptions.service.ts` - Increment team version on subscription changes
- `src/teams/teams.service.ts` - Increment team version on seat limit changes

**Fallback**: Guards already re-check subscription status on protected routes (good defense-in-depth)

---

## 4. Provider Abstraction

### Problem
Current implementation has provider-specific code scattered throughout. Adding a new provider (e.g., Paddle, Chargebee) would require changes in multiple places.

### Solution: Provider Abstraction Layer with Strategy Pattern

**Architecture**:
```
SubscriptionsService (Business Logic)
    ↓
BillingProviderInterface (Abstract Interface)
    ↓
├── StripeProvider (Stripe Implementation)
├── PayPalProvider (PayPal Implementation)
└── [Future: PaddleProvider, ChargebeeProvider]
```

**Interface Definition**:
```typescript
interface IBillingProvider {
  // Customer management
  createCustomer(email: string, metadata?: Record<string, string>): Promise<string>;
  
  // Subscription management
  createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string, immediately: boolean): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionData>;
  
  // Checkout
  createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string, metadata?: Record<string, string>): Promise<CheckoutSession>;
  
  // Webhooks
  verifyWebhookSignature(payload: any, signature: string): Promise<boolean>;
  parseWebhookEvent(payload: any): WebhookEvent;
  
  // Billing portal
  createBillingPortalSession(customerId: string, returnUrl: string): Promise<string>;
}
```

**Provider Registration**:
```typescript
// In subscriptions.module.ts
{
  provide: 'BILLING_PROVIDER',
  useClass: process.env.BILLING_PROVIDER === 'paypal' 
    ? PayPalProvider 
    : StripeProvider, // Default
}
```

**Database Schema**:
```sql
-- Add provider field to subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'stripe' 
CHECK (provider IN ('stripe', 'paypal'));

-- Add provider to webhook_events (already covered above)
```

**Code Structure**:
```
src/payments/
  ├── interfaces/
  │   └── billing-provider.interface.ts
  ├── providers/
  │   ├── stripe.provider.ts (implements IBillingProvider)
  │   ├── paypal.provider.ts (implements IBillingProvider)
  │   └── base.provider.ts (common utilities)
  └── payments.module.ts (provider registration)
```

**Key Benefits**:
1. Single point of change for provider logic
2. Easy to add new providers
3. Consistent interface across providers
4. Testable with mock providers

**Migration Path**:
1. Create interface and provider classes
2. Refactor existing StripeService → StripeProvider
3. Refactor existing PayPalService → PayPalProvider
4. Update SubscriptionsService to use interface
5. Add provider selection logic

---

## Implementation Priority

1. **High Priority**: Seat Race Conditions (data integrity risk)
2. **High Priority**: Webhook Idempotency (billing accuracy risk)
3. **Medium Priority**: Token Versioning (security/permissions)
4. **Medium Priority**: Provider Abstraction (maintainability)

---

## Testing Considerations

### Seat Race Conditions
- Test concurrent seat additions with multiple threads/requests
- Verify seat limit is never exceeded
- Test rollback scenarios

### Webhook Idempotency
- Send duplicate webhook events
- Verify idempotent processing
- Test event replay scenarios

### Token Versioning
- Test token rejection after role change
- Test token rejection after subscription cancellation
- Verify new tokens work after version increment

### Provider Abstraction
- Test provider switching
- Test provider-specific webhook handling
- Verify consistent behavior across providers

