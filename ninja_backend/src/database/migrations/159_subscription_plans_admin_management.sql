BEGIN;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS activation_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS ai_conversation_limit INTEGER,
  ADD COLUMN IF NOT EXISTS whatsapp_connections INTEGER,
  ADD COLUMN IF NOT EXISTS leads_contacts_limit INTEGER,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Normalize the two labels that were previously decorated in the frontend.
UPDATE subscription_plans
SET name = 'Business', updated_at = NOW()
WHERE LOWER(name) IN ('business (3 users)', 'business plan');

UPDATE subscription_plans
SET name = 'Scale', updated_at = NOW()
WHERE LOWER(name) IN ('scale (5 users)', 'scale plan');

-- Keep the DB aligned with the latest approved Cortexa pricing.
-- Free remains an internal/product plan even though the public pricing page may hide it.
UPDATE subscription_plans
SET activation_fee = 0,
    price = 0,
    seat_limit = 1,
    ai_conversation_limit = 50,
    whatsapp_connections = 1,
    crm_access = TRUE,
    ai_features = TRUE,
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE LOWER(name) = 'free';

UPDATE subscription_plans
SET name = 'Solo',
    activation_fee = 11,
    price = 127,
    seat_limit = 1,
    crm_access = TRUE,
    ai_features = TRUE,
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE LOWER(name) IN ('solo', 'solo plan');

UPDATE subscription_plans
SET name = 'Business',
    activation_fee = 22,
    price = 297,
    seat_limit = 3,
    crm_access = TRUE,
    ai_features = TRUE,
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE LOWER(name) IN ('business', 'business plan', 'business (3 users)');

UPDATE subscription_plans
SET name = 'Scale',
    activation_fee = 33,
    price = 397,
    seat_limit = 5,
    crm_access = TRUE,
    ai_features = TRUE,
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE LOWER(name) IN ('scale', 'scale plan', 'scale (5 users)');

-- Re-create a missing plan without duplicating an existing one.
INSERT INTO subscription_plans
  (name, description, activation_fee, price, seat_limit,
   ai_conversation_limit, whatsapp_connections,
   crm_access, ai_features, analytics_level,
   priority_exposure, ai_automation, plan_category, is_active,
   created_at, updated_at)
SELECT
  'Free', 'Subscription plan', 0, 0, 1,
  50, 1,
  TRUE, TRUE, 'none',
  FALSE, FALSE, 'core', TRUE,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'free' AND deleted_at IS NULL
);

INSERT INTO subscription_plans
  (name, description, activation_fee, price, seat_limit,
   crm_access, ai_features, analytics_level,
   priority_exposure, ai_automation, plan_category, is_active,
   created_at, updated_at)
SELECT
  'Solo', 'Subscription plan', 11, 127, 1,
  TRUE, TRUE, 'none',
  FALSE, FALSE, 'core', TRUE,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE LOWER(name) IN ('solo', 'solo plan') AND deleted_at IS NULL
);

INSERT INTO subscription_plans
  (name, description, activation_fee, price, seat_limit,
   crm_access, ai_features, analytics_level,
   priority_exposure, ai_automation, plan_category, is_active,
   created_at, updated_at)
SELECT
  'Business', 'Subscription plan', 22, 297, 3,
  TRUE, TRUE, 'none',
  FALSE, FALSE, 'core', TRUE,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'business' AND deleted_at IS NULL
);

INSERT INTO subscription_plans
  (name, description, activation_fee, price, seat_limit,
   crm_access, ai_features, analytics_level,
   priority_exposure, ai_automation, plan_category, is_active,
   created_at, updated_at)
SELECT
  'Scale', 'Subscription plan', 33, 397, 5,
  TRUE, TRUE, 'none',
  FALSE, FALSE, 'core', TRUE,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'scale' AND deleted_at IS NULL
);

COMMIT;
