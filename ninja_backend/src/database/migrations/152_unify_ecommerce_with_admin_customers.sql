-- IMPORTANT
-- Run this only AFTER deploying the synced EcommerceWorkspaceService and after
-- backing up the database. The new service no longer reads these ecommerce_* tables.
--
-- Canonical tables after this migration:
--   users, teams, team_members, subscriptions, payments, customer_notes

BEGIN;

-- Scope/link column on the canonical customer account row.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ecommerce_workspace_id UUID;

CREATE INDEX IF NOT EXISTS idx_users_ecommerce_workspace
  ON users(ecommerce_workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Old duplicated E-Commerce data model. Drop children first because of FKs.
DROP TABLE IF EXISTS ecommerce_customer_activity CASCADE;
DROP TABLE IF EXISTS ecommerce_customer_payments CASCADE;
DROP TABLE IF EXISTS ecommerce_customer_notes CASCADE;
DROP TABLE IF EXISTS ecommerce_customer_members CASCADE;
DROP TABLE IF EXISTS ecommerce_customers CASCADE;

COMMIT;
