-- Nuvei: statuses such as 'partially_refunded' / 'refund_pending' exceed the
-- original VARCHAR(16). Also self-healed at runtime by NuveiService.ensureSchema.
ALTER TABLE nuvei_transactions ALTER COLUMN status TYPE VARCHAR(32);
ALTER TABLE nuvei_webhook_events ALTER COLUMN status TYPE VARCHAR(32);
ALTER TABLE nuvei_transactions ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS return_url TEXT;
