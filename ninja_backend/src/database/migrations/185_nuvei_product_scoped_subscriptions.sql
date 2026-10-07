BEGIN;

-- One customer may buy Agentic CRM and the standalone E-Commerce CRM without
-- the two products blocking each other. Existing Nuvei rows remain Agentic.
ALTER TABLE nuvei_subscriptions
  ADD COLUMN IF NOT EXISTS product_key VARCHAR(32) NOT NULL DEFAULT 'agentic';

UPDATE nuvei_subscriptions
SET product_key = 'agentic'
WHERE product_key IS NULL OR BTRIM(product_key) = '';

DROP INDEX IF EXISTS nuvei_one_open_subscription_per_user;

CREATE UNIQUE INDEX IF NOT EXISTS nuvei_one_open_subscription_per_user_product
ON nuvei_subscriptions (user_id, product_key)
WHERE status IN ('pending_activation', 'verification_pending', 'trialing', 'active');

COMMIT;
