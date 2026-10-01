-- Prevent two browser tabs / rapid retries from creating two payable Nuvei
-- subscriptions for the same customer. This is the database-level guard that
-- closes the race between the application's "existing subscription" check and
-- INSERT. Historical terminal attempts are intentionally not restricted.
--
-- IMPORTANT: if this migration fails, inspect existing non-terminal duplicates
-- instead of deleting/merging payment records automatically.
CREATE UNIQUE INDEX IF NOT EXISTS nuvei_one_open_subscription_per_user
ON nuvei_subscriptions (user_id)
WHERE status IN ('pending_activation', 'verification_pending', 'trialing', 'active');
