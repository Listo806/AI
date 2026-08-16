-- Customer Service Workspace: ticket attachments.
-- Metadata for private S3 objects attached to a ticket. Bytes live in a private
-- bucket and are only ever served through short-lived signed URLs, so an attachment
-- is unreachable without a signature. Double scoped to team and ticket. Mirrors the
-- Financial/Insurance secure-document design and reuses the shared StorageService.
CREATE TABLE IF NOT EXISTS cs_ticket_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  created_by UUID,
  stored_file_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_ticket_documents_team ON cs_ticket_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_ticket_documents_ticket ON cs_ticket_documents(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_ticket_documents_file ON cs_ticket_documents(stored_file_id);
