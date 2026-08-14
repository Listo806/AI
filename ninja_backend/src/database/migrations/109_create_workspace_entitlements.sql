-- Workspace add-on entitlements. Each paid Workspace is its OWN separate Paddle
-- subscription ($97/month), fully independent of the base plan and of every other
-- Workspace, so it can be purchased, canceled, and revoked on its own. One row per
-- Paddle subscription (the revocation key). Team-scoped. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS workspace_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  workspace_id VARCHAR(64) NOT NULL,
  paddle_subscription_id VARCHAR(255) NOT NULL,
  paddle_price_id VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_by UUID,
  activated_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- One entitlement row per Paddle subscription: the idempotent grant key and the
  -- key a cancel/past-due/refund event revokes. A team buying the same workspace
  -- twice creates two rows (two subscriptions), each revocable on its own.
  CONSTRAINT uq_workspace_entitlements_sub UNIQUE (paddle_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_team
  ON workspace_entitlements(team_id);
CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_team_ws
  ON workspace_entitlements(team_id, workspace_id, status);
