-- Bank-paid CRM subscriptions are manually verified and never create Nuvei mandates.
CREATE TABLE IF NOT EXISTS cortexa_ec_bank_transfers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id), plan_key text NOT NULL,
 amount_cents integer NOT NULL, currency text NOT NULL DEFAULT 'USD',
 reference text NOT NULL UNIQUE, bank_transaction_reference text,
 status text NOT NULL DEFAULT 'awaiting_transfer'
 CHECK(status IN ('awaiting_transfer','pending_review','verified','rejected')),
 reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 review_note text, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cortexa_ec_bank_pending_unique
 ON cortexa_ec_bank_transfers(user_id,plan_key)
 WHERE status IN ('awaiting_transfer','pending_review');
