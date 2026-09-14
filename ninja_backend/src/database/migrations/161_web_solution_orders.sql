CREATE TABLE IF NOT EXISTS web_solution_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paddle_transaction_id VARCHAR(255) NOT NULL UNIQUE,

  user_id UUID NULL,
  team_id UUID NULL,

  service_id VARCHAR(64) NOT NULL,
  service_name VARCHAR(160) NOT NULL,

  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  status VARCHAR(32) NOT NULL DEFAULT 'paid',

  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  business_name VARCHAR(255),
  phone VARCHAR(80),
  website TEXT,

  paddle_customer_id VARCHAR(255),

  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_solution_orders_user
ON web_solution_orders(user_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_web_solution_orders_team
ON web_solution_orders(team_id, purchased_at DESC);