-- Plan names are globally unique in this database (subscription_plans_name_key).
-- Prefixing each catalog name with its product prevents Growth/Starter etc. collisions.
-- Existing rows are not renamed or modified. Rerunnable by product_key.
BEGIN;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS product_key TEXT,
  ADD COLUMN IF NOT EXISTS plan_kind TEXT NOT NULL DEFAULT 'base';

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_plans_product_key
  ON subscription_plans (product_key) WHERE product_key IS NOT NULL;

-- Existing plans remain untouched. New plans are draft/inactive until billing and entitlement validation.

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Agentic CRM — Additional Team Member', 'Pending checkout and entitlement verification', 97, 1, NULL,
       TRUE, TRUE,
       'none', FALSE, FALSE, 'agentic_crm', FALSE, 'agentic_crm.additional_team_member', 'addon', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'agentic_crm.additional_team_member');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Marketplace — Standard Exposure', 'Pending checkout and entitlement verification', 67, 1, 2,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'marketplace', FALSE, 'marketplace.standard_exposure', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'marketplace.standard_exposure');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Marketplace — Enhanced Exposure', 'Pending checkout and entitlement verification', 97, 1, 3,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'marketplace', FALSE, 'marketplace.enhanced_exposure', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'marketplace.enhanced_exposure');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Marketplace — Maximum Exposure', 'Pending checkout and entitlement verification', 147, 1, 4,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'marketplace', FALSE, 'marketplace.maximum_exposure', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'marketplace.maximum_exposure');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Vacation Rentals — Starter', 'Pending checkout and entitlement verification', 77, 1, 3,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'vacation_rentals', FALSE, 'vacation_rentals.starter', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'vacation_rentals.starter');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Vacation Rentals — Growth', 'Pending checkout and entitlement verification', 107, 1, 6,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'vacation_rentals', FALSE, 'vacation_rentals.growth', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'vacation_rentals.growth');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Vacation Rentals — Premium', 'Pending checkout and entitlement verification', 177, 1, NULL,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'vacation_rentals', FALSE, 'vacation_rentals.premium', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'vacation_rentals.premium');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Marketplace Agents — Essential', 'Pending checkout and entitlement verification', 97, 1, 20,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'marketplace_agents', FALSE, 'marketplace_agents.essential', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'marketplace_agents.essential');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Marketplace Agents — Growth', 'Pending checkout and entitlement verification', 147, 1, NULL,
       FALSE, FALSE,
       'none', FALSE, FALSE, 'marketplace_agents', FALSE, 'marketplace_agents.growth', 'base', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'marketplace_agents.growth');

INSERT INTO subscription_plans
  (name, description, price, seat_limit, listing_limit, crm_access, ai_features,
   analytics_level, priority_exposure, ai_automation, plan_category, is_active,
   product_key, plan_kind, created_at, updated_at)
SELECT 'Marketplace Agents — AI Agent CRM Add-on', 'Pending checkout and entitlement verification', 127, 1, NULL,
       FALSE, TRUE,
       'none', FALSE, FALSE, 'marketplace_agents', FALSE, 'marketplace_agents.ai_agent_crm_addon', 'addon', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE product_key = 'marketplace_agents.ai_agent_crm_addon');

COMMIT;
