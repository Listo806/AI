-- Milestone 4: Storage Integration
-- This migration adds the stored_files table for tracking files uploaded to S3

CREATE TABLE IF NOT EXISTS stored_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT NOT NULL,
  folder VARCHAR(255),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stored_files_user_id ON stored_files(user_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_team_id ON stored_files(team_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_folder ON stored_files(folder);
CREATE INDEX IF NOT EXISTS idx_stored_files_s3_key ON stored_files(s3_key);

