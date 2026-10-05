-- 182_nuvei_workspace_addons.sql
-- Paid Workspace add-ons ($97/month per additional Workspace) billed through
-- Nuvei / Datafast.
--
-- One row per purchased add-on. It is deliberately SEPARATE from
-- nuvei_subscriptions, which holds exactly one base CRM plan per customer
-- (nuvei_sub_one_live_uidx): an account can hold its plan AND several add-ons.
-- Access itself is still granted by a workspace_entitlements row
-- (source 'nuvei_addon', paddle_subscription_id = 'nuvei:<add-on id>'), so
-- WorkspaceLockGuard / GET /workspaces/access need no change.
--
-- Every charge (first payment + monthly renewals) is a nuvei_transactions row
-- with subscription_id = the add-on id and kind 'addon' / 'addon_renewal'.
--
-- Also self-healed at runtime by NuveiService.ensureAddonSchema(), so this
-- migration is safe to run before or after the deploy. Idempotent.

CREATE TABLE IF NOT EXISTS nuvei_workspace_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,            -- the paying user (owner of the saved card)
  team_id UUID NOT NULL,            -- the account the Workspace unlocks for
  workspace_id VARCHAR(64) NOT NULL,
  email TEXT,
  card_id UUID,
  amount NUMERIC(12,2) NOT NULL,    -- monthly price the customer agreed to
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  -- pending | active | past_due | suspended | canceled | refunded | payment_failed
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  dev_reference TEXT UNIQUE,
  return_url TEXT,                  -- where the browser lands after 3DS
  next_billing_date TIMESTAMPTZ,
  last_charge_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  consent_at TIMESTAMPTZ,
  consent_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One open (payable) add-on per account and Workspace: two tabs / rapid
-- retries can never create two $97 subscriptions for the same Workspace.
-- Terminal attempts (payment_failed / canceled / refunded / suspended) are kept
-- as history and do not block a new purchase.
CREATE UNIQUE INDEX IF NOT EXISTS nuvei_ws_addon_one_open_uidx
  ON nuvei_workspace_addons (team_id, workspace_id)
  WHERE status IN ('pending', 'active', 'past_due');

CREATE INDEX IF NOT EXISTS nuvei_ws_addon_team_idx
  ON nuvei_workspace_addons (team_id);

CREATE INDEX IF NOT EXISTS nuvei_ws_addon_due_idx
  ON nuvei_workspace_addons (next_billing_date)
  WHERE status IN ('active', 'past_due');
