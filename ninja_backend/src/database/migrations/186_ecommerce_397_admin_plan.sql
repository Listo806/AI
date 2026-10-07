BEGIN;

-- Canonical Admin Plans row for the standalone E-Commerce / Payments &
-- Subscriptions CRM product.  Production data predating the Nuvei connection
-- can have the $397 price only in the E-Commerce UI/config and no persisted
-- subscription_plans row.  Reuse an existing E-Commerce row when present and
-- create exactly one only when it is genuinely absent.

UPDATE subscription_plans
SET name = 'Payments & Subscriptions CRM',
    description = COALESCE(NULLIF(description, ''), 'E-Commerce CRM subscription'),
    price = 397.00,
    activation_fee = 0.00,
    annual_price = NULL,
    seat_limit = GREATEST(COALESCE(seat_limit, 1), 1),
    crm_access = FALSE,
    ai_features = FALSE,
    analytics_level = COALESCE(analytics_level, 'none'),
    priority_exposure = FALSE,
    ai_automation = FALSE,
    plan_category = 'ecommerce',
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE id = (
  SELECT id
  FROM subscription_plans
  WHERE LOWER(TRIM(name)) IN (
          'payments & subscriptions crm',
          'payment & subscription crm',
          'e-commerce crm',
          'ecommerce crm'
        )
     OR LOWER(COALESCE(plan_category, '')) IN ('ecommerce', 'e-commerce')
  ORDER BY created_at ASC
  LIMIT 1
);

INSERT INTO subscription_plans
  (name, description, price, activation_fee, annual_price, seat_limit,
   crm_access, ai_features, analytics_level, priority_exposure, ai_automation,
   plan_category, is_active, created_at, updated_at)
SELECT
  'Payments & Subscriptions CRM',
  'E-Commerce CRM subscription',
  397.00,
  0.00,
  NULL,
  1,
  FALSE,
  FALSE,
  'none',
  FALSE,
  FALSE,
  'ecommerce',
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM subscription_plans
  WHERE deleted_at IS NULL
    AND (
      LOWER(TRIM(name)) IN (
        'payments & subscriptions crm',
        'payment & subscription crm',
        'e-commerce crm',
        'ecommerce crm'
      )
      OR LOWER(COALESCE(plan_category, '')) IN ('ecommerce', 'e-commerce')
    )
);

COMMIT;
