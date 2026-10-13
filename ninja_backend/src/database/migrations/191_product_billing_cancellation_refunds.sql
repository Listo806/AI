ALTER TABLE product_billing_enrollments ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT FALSE;
ALTER TABLE product_billing_enrollments ADD COLUMN IF NOT EXISTS refund_status text CHECK (refund_status IN ('pending','confirmed','rejected'));
CREATE INDEX IF NOT EXISTS product_billing_renewal_idx ON product_billing_enrollments(period_end) WHERE status='active' AND cancel_at_period_end=FALSE;
