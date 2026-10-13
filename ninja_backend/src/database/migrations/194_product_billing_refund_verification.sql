ALTER TABLE product_billing_enrollments ADD COLUMN IF NOT EXISTS refund_transaction_id text;
CREATE UNIQUE INDEX IF NOT EXISTS product_billing_refund_tx_unique ON product_billing_enrollments(refund_transaction_id) WHERE refund_transaction_id IS NOT NULL;
