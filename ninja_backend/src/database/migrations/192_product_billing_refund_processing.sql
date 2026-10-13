ALTER TABLE product_billing_enrollments DROP CONSTRAINT IF EXISTS product_billing_enrollments_refund_status_check;
ALTER TABLE product_billing_enrollments ADD CONSTRAINT product_billing_enrollments_refund_status_check
CHECK (refund_status IN ('pending','processing','confirmed','rejected'));
