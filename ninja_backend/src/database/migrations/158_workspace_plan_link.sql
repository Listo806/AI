BEGIN;

CREATE TABLE IF NOT EXISTS workspace_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  workspace_id VARCHAR(64) NOT NULL,
  paddle_subscription_id VARCHAR(255),
  paddle_price_id VARCHAR(255),
  plan_subscription_id UUID,
  plan_id UUID,
  user_id UUID,
  source VARCHAR(32) NOT NULL DEFAULT 'paddle',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_by UUID,
  activated_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_workspace_entitlements_sub UNIQUE (paddle_subscription_id)
);

ALTER TABLE workspace_entitlements
  ALTER COLUMN paddle_subscription_id DROP NOT NULL;

ALTER TABLE workspace_entitlements
  ADD COLUMN IF NOT EXISTS plan_subscription_id UUID;

ALTER TABLE workspace_entitlements
  ADD COLUMN IF NOT EXISTS plan_id UUID;

ALTER TABLE workspace_entitlements
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE workspace_entitlements
  ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'paddle';

CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_team
  ON workspace_entitlements(team_id);

CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_team_ws
  ON workspace_entitlements(team_id, workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_plan_subscription
  ON workspace_entitlements(plan_subscription_id);

-- Current Cortexa plans include one selected Workspace.
-- This prevents two active plan-linked Workspace instances from being attached
-- to the same CRM subscription while leaving legacy Paddle rows untouched.
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_entitlements_plan_active
  ON workspace_entitlements(plan_subscription_id)
  WHERE plan_subscription_id IS NOT NULL
    AND source = 'plan_included'
    AND status = 'active';

COMMIT;
