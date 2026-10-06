BEGIN;

-- Agentic CRM pricing source of truth (approved 2026-10):
-- Solo $11 activation + $127/mo, Business $22 + $297/mo, Scale $33 + $497/mo.
-- One workspace is included in every paid plan. Additional workspaces and seats
-- are $97/mo and are handled by Nuvei add-on logic, not public pricing cards.
UPDATE subscription_plans
SET activation_fee = 11, price = 127, seat_limit = 1, is_active = TRUE, deleted_at = NULL, updated_at = NOW()
WHERE LOWER(name) IN ('solo', 'solo plan');

UPDATE subscription_plans
SET activation_fee = 22, price = 297, seat_limit = 3, is_active = TRUE, deleted_at = NULL, updated_at = NOW()
WHERE LOWER(name) IN ('business', 'business plan', 'business (3 users)');

UPDATE subscription_plans
SET activation_fee = 33, price = 497, seat_limit = 5, is_active = TRUE, deleted_at = NULL, updated_at = NOW()
WHERE LOWER(name) IN ('scale', 'scale plan', 'scale (5 users)');

COMMIT;
