# Webhook Verification Guide

## How to Verify Webhooks Are Working

The browser redirect to the success URL **only confirms checkout completed** - it does NOT confirm webhooks were received. You need to verify webhooks separately.

## Verification Steps

### 1. Check Application Logs

Look for webhook processing logs in your console:

```
Processing webhook event: checkout.session.completed (evt_xxx)
Handling checkout.session.completed for session: cs_test_xxx
Successfully processed webhook event: checkout.session.completed (evt_xxx)
```

**If you see these logs** → Webhooks are being received and processed ✅

**If you DON'T see these logs** → Webhooks are not reaching your server ❌

### 2. Check Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click on your webhook endpoint
3. Check the "Events" tab
4. Look for recent events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`

**Status indicators:**
- ✅ Green checkmark = Successfully delivered
- ❌ Red X = Failed delivery
- ⏳ Pending = Still retrying

### 3. Check Database - Webhook Events Table

Query the `webhook_events` table to see if events were received:

```sql
SELECT 
  event_id, 
  event_type, 
  processed_at, 
  subscription_id
FROM webhook_events 
WHERE provider = 'stripe' 
ORDER BY processed_at DESC 
LIMIT 10;
```

**If you see rows** → Webhooks were received and stored ✅

**If table is empty** → Webhooks were not received ❌

### 4. Check Database - Subscription Status

Verify the subscription status was updated:

```sql
SELECT 
  id,
  status,
  stripe_subscription_id,
  current_period_start,
  current_period_end
FROM subscriptions 
WHERE stripe_customer_id = 'cus_xxx'  -- Replace with your customer ID
ORDER BY created_at DESC;
```

**Expected flow:**
1. Initially: `status = 'inactive'`, `stripe_subscription_id = NULL`
2. After webhook: `status = 'active'`, `stripe_subscription_id = 'sub_xxx'`

**If status is still 'inactive'** → Webhook didn't process or failed ❌

### 5. Check ngrok Status

If using ngrok, verify it's forwarding correctly:

```bash
# Check ngrok dashboard
# Or check ngrok logs for incoming requests
```

Make sure:
- ngrok URL matches the webhook endpoint in Stripe Dashboard
- ngrok is forwarding to `localhost:3000` (or your port)
- No connection errors in ngrok logs

## Common Issues

### Issue 1: Webhooks Not Reaching Server

**Symptoms:**
- No logs in application
- No entries in `webhook_events` table
- Stripe Dashboard shows failed deliveries

**Solutions:**
1. **Verify ngrok URL** matches Stripe webhook endpoint
2. **Check ngrok is running** and forwarding correctly
3. **Verify webhook secret** (`STRIPE_WEBHOOK_SECRET`) matches Stripe
4. **Check firewall/network** blocking requests

### Issue 2: Webhooks Received But Not Processed

**Symptoms:**
- Logs show "Processing webhook event" but then errors
- Entries in `webhook_events` table but subscription not updated
- Error logs in console

**Solutions:**
1. **Check error logs** for specific error messages
2. **Verify database connection** is working
3. **Check subscription exists** in database before webhook arrives
4. **Verify migration 004** was run (for `webhook_events` table)

### Issue 3: Webhooks Processed But Subscription Not Updated

**Symptoms:**
- Logs show successful processing
- Entries in `webhook_events` table
- But subscription status still 'inactive'

**Solutions:**
1. **Check subscription lookup** - verify `stripe_customer_id` matches
2. **Check for errors** in `updateFromStripe` method
3. **Verify subscription record** exists in database

## Testing with Stripe CLI (Alternative to ngrok)

You can also use Stripe CLI for local testing:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

## Expected Webhook Flow

1. **User completes checkout** → Browser redirects to success URL
2. **Stripe sends webhook** → `checkout.session.completed`
3. **Your server receives webhook** → Logs "Processing webhook event"
4. **Webhook handler processes** → Updates subscription status
5. **Database updated** → `status = 'active'`, `stripe_subscription_id` set
6. **Seat limits enforced** → If subscription becomes active

## Quick Verification Query

Run this query to see the full picture:

```sql
SELECT 
  s.id,
  s.status,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.created_at as subscription_created,
  COUNT(we.id) as webhook_count,
  MAX(we.processed_at) as last_webhook
FROM subscriptions s
LEFT JOIN webhook_events we ON we.subscription_id = s.id
GROUP BY s.id
ORDER BY s.created_at DESC;
```

This shows:
- Subscription status
- Whether webhooks were received (webhook_count > 0)
- When last webhook was processed
- If subscription has Stripe subscription ID set

