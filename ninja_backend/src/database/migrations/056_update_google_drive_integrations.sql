ALTER TABLE google_drive_integrations
ADD COLUMN IF NOT EXISTS root_folder_name TEXT;

ALTER TABLE google_drive_integrations
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;