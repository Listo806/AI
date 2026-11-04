-- Persist pre-registration Ecuador property-listing interest.
CREATE TABLE IF NOT EXISTS ecuador_listing_interests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  role VARCHAR(12) NOT NULL CHECK (role IN ('owner','agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ec_listing_interest_email_role
  ON ecuador_listing_interests (email, role);
