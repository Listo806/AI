CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS product_billing_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  plan_key text NOT NULL,
  parent_id uuid REFERENCES product_billing_enrollments(id),
  interval text NOT NULL CHECK (interval IN ('monthly','yearly')),
  price_cents integer NOT NULL CHECK (price_cents > 0),
  status text NOT NULL CHECK (status IN ('pending_payment','active','failed','canceled')),
  payment_reference text UNIQUE,
  provider_transaction_id text UNIQUE,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS product_billing_enrollments_user_idx ON product_billing_enrollments(user_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS product_billing_active_parent_unique ON product_billing_enrollments(user_id,plan_key)
  WHERE status='active' AND parent_id IS NULL;
