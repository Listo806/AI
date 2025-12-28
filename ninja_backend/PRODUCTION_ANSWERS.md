# Production Readiness: Direct Answers

## 1. Seat Race Conditions

**Q: How do you prevent oversubscription at the DB level?**

**A: Database transactions with row-level locking (`SELECT FOR UPDATE`)**

**Implementation:**
- `addMember()` method in `teams.service.ts` now uses:
  1. **Transaction isolation**: Wraps entire operation in `BEGIN/COMMIT`
  2. **Row-level locking**: `SELECT ... FOR UPDATE` locks the team row during the operation
  3. **Atomic checks**: Seat count checked and user added within the same transaction
  4. **Constraint enforcement**: Database-level checks prevent exceeding seat limits

**Code Location**: `src/teams/teams.service.ts:155-198`

**Strategy**: PostgreSQL transactions + `SELECT FOR UPDATE` + atomic updates

---

## 2. Webhook Idempotency

**Q: How do you prevent duplicate Stripe webhook events from re-processing seat changes and flipping billing states?**

**A: Event ID tracking in `webhook_events` table with UNIQUE constraint**

**Implementation:**
- **Database table**: `webhook_events` stores:
  - `provider` (stripe/paypal)
  - `event_id` (unique per provider)
  - `event_type`
  - `subscription_id`
  - `payload` (JSONB for debugging)
  - `processed_at` timestamp

- **Idempotency check**: Before processing any webhook:
  1. Extract event ID from payload
  2. Check if `(provider, event_id)` already exists
  3. If exists → return success (idempotent response)
  4. If not → insert event record, then process
  5. UNIQUE constraint prevents race conditions

**Code Locations**:
- `src/subscriptions/webhooks/stripe-webhook.controller.ts:36-127`
- `src/payments/webhooks.controller.ts:15-95` (PayPal)

**Event ID Tracking**: 
- **Stripe**: Uses `event.id` from Stripe Event object
- **PayPal**: Uses `body.id` or `headers['paypal-transmission-id']`

**Database Schema**: See `src/database/migrations/004_production_readiness.sql`

---

## 3. Role / Plan Changes Mid-Session

**Q: How do you ensure permissions are enforced immediately when role/subscription changes while JWT is still valid?**

**A: Token versioning with re-validation on every request**

**Implementation:**

**Token Versioning**:
- `users.token_version` - Incremented when:
  - User role changes
  - User is activated/deactivated
  - User team changes
- `teams.token_version` - Incremented when:
  - Subscription status changes
  - Seat limits change
  - Team subscription changes

**JWT Payload Enhancement**:
```typescript
{
  id: user.id,
  email: user.email,
  role: user.role,
  tokenVersion: user.tokenVersion,      // NEW
  teamTokenVersion: team.tokenVersion    // NEW
}
```

**Validation Strategy**:
1. **On every request**: JWT strategy validates user
2. **Version check**: Compares JWT `tokenVersion` with database `users.token_version`
3. **Team version check**: Compares JWT `teamTokenVersion` with database `teams.token_version`
4. **If mismatch**: Reject token → forces re-login

**Code Locations**:
- Token generation: `src/auth/auth.service.ts:108-146`
- Token validation: `src/auth/strategies/jwt.strategy.ts:20-45`
- Version increments:
  - Role/status changes: `src/users/users.service.ts:42-81`
  - Subscription changes: `src/subscriptions/subscriptions.service.ts:201-209`
  - Seat changes: `src/teams/teams.service.ts:126-153`

**Fallback**: Guards already re-check subscription status on protected routes (defense-in-depth)

---

## 4. Provider Abstraction

**Q: Is billing logic abstracted to support multiple providers (Stripe/PayPal), or is it provider-specific?**

**A: Currently provider-specific, but structure supports abstraction**

**Current State**:
- Separate services: `StripeService` and `PayPalService`
- Provider-specific webhook handlers
- Direct provider calls in `SubscriptionsService`

**Abstraction Strategy** (Recommended):

**Interface-Based Design**:
```typescript
interface IBillingProvider {
  createCustomer(...): Promise<string>;
  createSubscription(...): Promise<SubscriptionResult>;
  cancelSubscription(...): Promise<void>;
  createCheckoutSession(...): Promise<CheckoutSession>;
  verifyWebhookSignature(...): Promise<boolean>;
  parseWebhookEvent(...): WebhookEvent;
}
```

**Implementation**:
- `StripeProvider` implements `IBillingProvider`
- `PayPalProvider` implements `IBillingProvider`
- `SubscriptionsService` uses interface (not concrete classes)

**Provider Selection**:
- Environment variable: `BILLING_PROVIDER=stripe|paypal`
- Dependency injection selects provider at runtime

**Database Support**:
- `subscriptions.provider` column stores provider name
- `webhook_events.provider` tracks event source

**Migration Path**:
1. Create `IBillingProvider` interface
2. Refactor existing services to implement interface
3. Update `SubscriptionsService` to use interface
4. Add provider selection logic

**Code Structure** (Recommended):
```
src/payments/
  ├── interfaces/
  │   └── billing-provider.interface.ts
  ├── providers/
  │   ├── stripe.provider.ts
  │   └── paypal.provider.ts
  └── payments.module.ts
```

**Note**: Full abstraction not yet implemented, but database schema and structure support it. See `PRODUCTION_READINESS.md` for detailed implementation plan.

---

## Summary

✅ **Seat Race Conditions**: Fixed with transactions + row-level locking  
✅ **Webhook Idempotency**: Implemented with event ID tracking  
✅ **Token Versioning**: Implemented for role/subscription invalidation  
⚠️ **Provider Abstraction**: Structure in place, full abstraction pending

All critical production concerns have been addressed with database-level protections and proper idempotency handling.

