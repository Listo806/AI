BEGIN;

-- A customer may hold one live Agentic CRM subscription and one live
-- E-Commerce CRM subscription at the same time. The old runtime-created index
-- was scoped only by user_id and incorrectly treated the second product as a
-- duplicate after Nuvei had already approved the payment.
DROP INDEX IF EXISTS nuvei_sub_one_live_uidx;
DROP INDEX IF EXISTS nuvei_one_open_subscription_per_user;

CREATE UNIQUE INDEX IF NOT EXISTS nuvei_sub_one_live_uidx
ON nuvei_subscriptions (user_id, product_key)
WHERE status IN ('verification_pending', 'trialing', 'active');

CREATE UNIQUE INDEX IF NOT EXISTS nuvei_one_open_subscription_per_user_product
ON nuvei_subscriptions (user_id, product_key)
WHERE status IN ('pending_activation', 'verification_pending', 'trialing', 'active');

COMMIT;
