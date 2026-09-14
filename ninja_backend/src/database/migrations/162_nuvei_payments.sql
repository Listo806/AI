-- 162_nuvei_payments.sql
-- Nuvei / Datafast (Paymentez) payment engine.
--
-- These tables are ALSO self-healed at runtime by NuveiService.ensureSchema(),
-- so this migration exists for a clean, documented first deploy and to widen the
-- shared provider constraints. Everything here is idempotent.

-- 1) Allow provider='nuvei' on the shared billing + webhook tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_provider_check;
    -- Only re-add the constraint when the provider column actually exists.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'provider'
    ) THEN
      ALTER TABLE subscriptions
        ADD CONSTRAINT subscriptions_provider_check
        CHECK (provider IN ('stripe','paypal','paddle','manual','nuvei'));
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_events') THEN
    ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_provider_check;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'webhook_events' AND column_name = 'provider'
    ) THEN
      ALTER TABLE webhook_events
        ADD CONSTRAINT webhook_events_provider_check
        CHECK (provider IN ('stripe','paypal','paddle','manual','nuvei'));
    END IF;
  END IF;
END $$;

-- 2) Nuvei mirror columns on the shared billing tables (admin Next-Billing/LTV).
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS nuvei_subscription_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_nuvei_sub_uidx
  ON subscriptions (nuvei_subscription_id) WHERE nuvei_subscription_id IS NOT NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS nuvei_transaction_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS payments_nuvei_txn_uidx
  ON payments (nuvei_transaction_id) WHERE nuvei_transaction_id IS NOT NULL;

-- 3) Account-level activation pointer (mirrors users.paddle_subscription_id).
ALTER TABLE users ADD COLUMN IF NOT EXISTS nuvei_subscription_id UUID;

-- 4) Encrypted card tokens (never the PAN/CVV — those are never received).
CREATE TABLE IF NOT EXISTS nuvei_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  token_enc TEXT NOT NULL,
  token_fp VARCHAR(64) NOT NULL,
  bin VARCHAR(6),
  last4 VARCHAR(4),
  brand VARCHAR(12),
  holder_name TEXT,
  expiry_month VARCHAR(2),
  expiry_year VARCHAR(4),
  status VARCHAR(16) NOT NULL DEFAULT 'valid',
  transaction_reference TEXT,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS nuvei_cards_user_fp_uidx ON nuvei_cards (user_id, token_fp);

-- 5) Subscription state machine.
CREATE TABLE IF NOT EXISTS nuvei_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  team_id UUID,
  email TEXT,
  plan_key VARCHAR(32) NOT NULL,
  provision_plan VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending_activation',
  activation_amount NUMERIC(12,2) NOT NULL,
  monthly_amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  card_id UUID,
  dev_reference TEXT UNIQUE,
  trial_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  last_charge_at TIMESTAMPTZ,
  consent_at TIMESTAMPTZ,
  consent_ip TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) Every charge/refund attempt, with transaction_ID + authorization_code.
CREATE TABLE IF NOT EXISTS nuvei_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID,
  user_id UUID,
  kind VARCHAR(16) NOT NULL,
  period_key VARCHAR(32),
  provider_transaction_id TEXT,
  authorization_code TEXT,
  dev_reference TEXT,
  amount NUMERIC(12,2),
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  status VARCHAR(16),
  status_detail INTEGER,
  current_status TEXT,
  message TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS nuvei_tx_recurring_period_uidx
  ON nuvei_transactions (subscription_id, kind, period_key) WHERE period_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS nuvei_tx_provider_id_uidx
  ON nuvei_transactions (provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;

-- 7) Idempotent verified-callback log.
CREATE TABLE IF NOT EXISTS nuvei_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_transaction_id TEXT,
  dev_reference TEXT,
  status VARCHAR(16),
  status_detail INTEGER,
  dedupe_key TEXT UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8) Link-to-Pay orders for custom Web Solutions quotations (no fixed prices).
CREATE TABLE IF NOT EXISTS nuvei_link_to_pay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  provider_transaction_id TEXT,
  authorization_code TEXT,
  pay_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
