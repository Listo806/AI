ALTER TABLE product_billing_enrollments ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS product_billing_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES product_billing_enrollments(id),
  reference text NOT NULL UNIQUE,
  period_end timestamptz NOT NULL,
  transaction_id text UNIQUE,
  status text NOT NULL CHECK(status IN ('pending','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);
