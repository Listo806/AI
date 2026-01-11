-- Paddle Integration Migration
-- Adds Paddle-specific fields to support Paddle payment provider

-- Add Paddle fields to subscription_plans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'paddle_price_id'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN paddle_price_id VARCHAR(255) UNIQUE;
  END IF;
END $$;

-- Add Paddle fields to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN paddle_subscription_id VARCHAR(255) UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN paddle_customer_id VARCHAR(255);
  END IF;
END $$;

-- Update provider check constraint to include 'paddle'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_provider_check'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_provider_check;
  END IF;
  
  -- Add new constraint with paddle
  ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_provider_check
  CHECK (provider IN ('stripe', 'paypal', 'paddle'));
END $$;

-- Update webhook_events provider check to include 'paddle'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'webhook_events_provider_check'
  ) THEN
    ALTER TABLE webhook_events DROP CONSTRAINT webhook_events_provider_check;
  END IF;
  
  ALTER TABLE webhook_events
  ADD CONSTRAINT webhook_events_provider_check
  CHECK (provider IN ('stripe', 'paypal', 'paddle'));
END $$;

-- Add Paddle fields to payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'paddle_transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN paddle_transaction_id VARCHAR(255) UNIQUE;
  END IF;
END $$;

-- Create indexes for Paddle fields
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_subscription_id ON subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_id ON subscriptions(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_paddle_transaction_id ON payments(paddle_transaction_id);

