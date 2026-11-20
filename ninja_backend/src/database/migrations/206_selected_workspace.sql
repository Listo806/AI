-- Apply once before deploying the updated backend.
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_workspace_id VARCHAR(64);
