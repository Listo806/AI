-- Production Readiness: Critical Fixes
-- This migration adds:
-- 1. Webhook event idempotency tracking
-- 2. Token versioning for role/subscription changes
-- 3. Provider field for billing abstraction

-- Webhook events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_subscription ON webhook_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);

-- Token versioning for users (invalidate tokens on role/status changes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'token_version'
  ) THEN
    ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Token versioning for teams (invalidate tokens on subscription/seat changes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'token_version'
  ) THEN
    ALTER TABLE teams ADD COLUMN token_version INTEGER DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Provider field for subscriptions (billing abstraction)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'provider'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN provider VARCHAR(50) DEFAULT 'stripe' NOT NULL 
    CHECK (provider IN ('stripe', 'paypal'));
    
    CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider);
  END IF;
END $$;

