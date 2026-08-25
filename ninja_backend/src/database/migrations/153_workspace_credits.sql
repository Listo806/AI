-- Included-workspace credits + a source marker on entitlements.
--
-- A promotional base plan (e.g. the $257 Business promo) can include ONE Team
-- Workspace of the customer's choice. That is modelled as a credit the account
-- holds; when the customer chooses a workspace it is COMPED (granted with no
-- Paddle subscription and no $97 charge) and one credit is consumed. Any
-- additional workspace beyond the included one stays on the normal $97 path.
--
-- The code also self-heals this schema at runtime (WorkspaceEntitlementsService
-- .ensureCreditsSchema), so this migration is safe to run before or after deploy.

-- Distinguish comped/included rows from normal paid ($97) rows. Existing rows
-- default to 'paddle'.
ALTER TABLE workspace_entitlements
  ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'paddle';

CREATE TABLE IF NOT EXISTS workspace_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  source VARCHAR(48) NOT NULL DEFAULT 'promo',
  -- The granting (base) subscription id. Unique so a subscription's created +
  -- activated events and later renewals never stack more than one credit grant.
  paddle_subscription_id VARCHAR(255),
  total INT NOT NULL DEFAULT 1,
  used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_credits_sub
  ON workspace_credits(paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_credits_team
  ON workspace_credits(team_id);
