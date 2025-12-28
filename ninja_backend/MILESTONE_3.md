# Milestone 3 - Payments & Subscriptions (Stripe)

## ✅ Completed Features

### Stripe Integration
- **Stripe Service**: Complete Stripe SDK integration
  - Customer management
  - Subscription creation and management
  - Checkout session creation
  - Billing portal integration
  - Webhook signature verification

### Subscription Plans
- **Plan Management**: Create, read, update, delete subscription plans
- **Stripe Integration**: Link plans to Stripe prices and products
- **Seat-based Pricing**: Each plan has a seat limit
- **Plan Activation**: Enable/disable plans

### Subscriptions
- **Subscription Creation**: Create subscriptions via Stripe Checkout
- **Subscription Management**: 
  - View team subscriptions
  - Cancel subscriptions (immediate or end of period)
  - Access Stripe billing portal
- **Status Tracking**: Track subscription status (active, past_due, canceled, etc.)
- **Automatic Seat Enforcement**: Seat limits enforced when subscription becomes active

### Webhook Handling
- **Stripe Webhooks**: Handle subscription events
  - `checkout.session.completed` - Activate subscription after payment
  - `customer.subscription.created` - New subscription created
  - `customer.subscription.updated` - Subscription updated
  - `customer.subscription.deleted` - Subscription canceled
  - `invoice.payment_succeeded` - Record successful payment
  - `invoice.payment_failed` - Record failed payment
- **Automatic Updates**: Subscription status and seat limits updated automatically via webhooks
- **Payment History**: All payments recorded in database

### Seat Enforcement
- **Automatic Enforcement**: Seat limits enforced immediately when:
  - Subscription becomes active
  - Subscription is updated via webhook
  - Seat limit changes
- **Team Integration**: Seat limits synced with team seat limits

### Access Control
- **Subscription Guard**: `SubscriptionActiveGuard` to protect routes requiring active subscription
- **Payment State Enforcement**: Server-side validation of subscription status
- **Team Owner Only**: Only team owners can manage subscriptions

## API Endpoints

### Subscription Plans
- `GET /api/subscriptions/plans` - Get all plans (optionally filter active only)
- `GET /api/subscriptions/plans/:id` - Get plan by ID
- `POST /api/subscriptions/plans` - Create new plan (admin)
- `PUT /api/subscriptions/plans/:id` - Update plan (admin)
- `DELETE /api/subscriptions/plans/:id` - Delete plan (admin)

### Subscriptions
- `POST /api/subscriptions` - Create subscription (returns checkout URL)
- `GET /api/subscriptions/team/:teamId` - Get team's subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/team/:teamId/billing-portal` - Get billing portal URL

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint (no auth required)

## Database Schema

### New Tables
- `subscription_plans` - Available subscription plans
- `subscriptions` - Team subscriptions
- `payments` - Payment history

### Updated Tables
- `teams` - Added `subscription_id` column

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Setup Instructions

1. **Install Dependencies** (already done)
   ```bash
   npm install stripe
   ```

2. **Set Up Stripe Account**
   - Create account at https://stripe.com
   - Get API keys from dashboard
   - Create products and prices in Stripe dashboard
   - Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

3. **Run Database Migration**
   ```bash
   npm run setup:db
   ```

4. **Create Subscription Plans**
   - Use the API or directly in database
   - Link Stripe price IDs to plans

## Example Usage

### Create a Subscription Plan
```bash
POST /api/subscriptions/plans
{
  "name": "Professional",
  "description": "Professional plan with 10 seats",
  "price": 99.00,
  "seatLimit": 10,
  "stripePriceId": "price_xxxxx"
}
```

### Create a Subscription
```bash
POST /api/subscriptions
{
  "planId": "plan-uuid",
  "teamId": "team-uuid"
}

# Response:
{
  "subscription": { ... },
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

### Get Team Subscription
```bash
GET /api/subscriptions/team/{teamId}
```

### Cancel Subscription
```bash
POST /api/subscriptions/{subscriptionId}/cancel
{
  "immediately": false  // or true for immediate cancellation
}
```

### Access Billing Portal
```bash
POST /api/subscriptions/team/{teamId}/billing-portal

# Response:
{
  "url": "https://billing.stripe.com/..."
}
```

## Webhook Configuration

### Stripe Dashboard Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Local Testing
Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Subscription Status Flow

1. **Inactive** - Subscription created, payment pending
2. **Active** - Payment succeeded, subscription active
3. **Past Due** - Payment failed, retrying
4. **Canceled** - Subscription canceled (immediate or end of period)
5. **Unpaid** - Payment failed multiple times

## Seat Enforcement

- When subscription becomes **active**: Seat limits enforced automatically
- When subscription is **updated**: Seat limits synced with plan
- When subscription is **canceled**: Seat limits remain until period ends (if `cancel_at_period_end`)

## Exit Criteria Status

✅ **Billing fully automated**
- Stripe integration complete
- Webhook handling working
- Payment recording functional
- Subscription lifecycle managed

✅ **Seats enforced immediately via webhooks**
- Automatic seat enforcement on subscription activation
- Real-time updates via webhooks
- Team seat limits synced with subscription

## Next Steps (Milestone 4)

- Mapbox integration
- WhatsApp API integration
- AI assistant backend
- Push notifications
- Cloud storage for uploads

