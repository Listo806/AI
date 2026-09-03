-- Audit/event log for Admin Billing Calendar actions.
-- IMPORTANT: this is NOT a second billing source of truth.
-- Paddle remains authoritative for schedule/payment/refund state.
CREATE TABLE IF NOT EXISTS public.billing_calendar_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(40) NOT NULL,
  subscription_id UUID,
  paddle_subscription_id VARCHAR(255),
  customer_id UUID,
  transaction_id VARCHAR(255),
  from_billed_at TIMESTAMPTZ,
  to_billed_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_calendar_actions_created
  ON public.billing_calendar_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_calendar_actions_subscription
  ON public.billing_calendar_actions(subscription_id, created_at DESC);
