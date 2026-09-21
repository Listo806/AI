-- The customer's state or region, alongside the country we already store.
--
-- The country column is untouched and keeps its meaning. These columns only add
-- detail, so the admin can report United States customers by state:
--   billing_state  a state from a payment billing address, when a provider gives
--                  us one; it takes priority over everything else
--   signup_region  the state or region resolved from the sign-up request, used
--                  when nothing better is known
-- The business profile state is read from ai_agent_business_profiles at query
-- time, so it is never copied and never goes stale.
--
-- Migrations are not auto-run in this environment, so the same columns are also
-- created on demand by the sign-up and admin read paths. Every statement here is
-- idempotent and safe to run more than once.

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_region VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_state VARCHAR(80);
