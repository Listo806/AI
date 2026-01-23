-- Milestone 5: Subscription Enforcement & Feature Limits
-- Adds feature limit columns to subscription_plans table

-- Add feature limit columns to subscription_plans
DO $$
BEGIN
  -- Listing limit (NULL = unlimited, 0 = no listings allowed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'listing_limit'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN listing_limit INTEGER;
  END IF;

  -- CRM access flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'crm_access'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN crm_access BOOLEAN DEFAULT false;
  END IF;

  -- AI features access flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'ai_features'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN ai_features BOOLEAN DEFAULT false;
  END IF;

  -- Analytics level (basic, advanced, ai_insights)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'analytics_level'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN analytics_level VARCHAR(50) DEFAULT 'none';
  END IF;

  -- Priority exposure flag (for PRO MAX)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'priority_exposure'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN priority_exposure BOOLEAN DEFAULT false;
  END IF;

  -- AI automation flag (for advanced CRM features)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'ai_automation'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN ai_automation BOOLEAN DEFAULT false;
  END IF;

  -- Plan category (marketplace, ai_crm)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'plan_category'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN plan_category VARCHAR(50) DEFAULT 'marketplace';
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_category ON subscription_plans(plan_category);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
