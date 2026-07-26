-- Reconcile make_integrations with how the app actually saves config.
-- MakeService.saveConfig writes only (team_id, webhook_url, triggers), but the
-- original table (062) had no `triggers` column and required name / trigger_event
-- / webhook_secret NOT NULL, so every save threw and no config could ever persist.
-- Add the missing column and relax the unused NOT NULL constraints.
ALTER TABLE make_integrations ADD COLUMN IF NOT EXISTS triggers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE make_integrations ALTER COLUMN name DROP NOT NULL;
ALTER TABLE make_integrations ALTER COLUMN trigger_event DROP NOT NULL;
ALTER TABLE make_integrations ALTER COLUMN webhook_secret DROP NOT NULL;
