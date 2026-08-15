-- Financial Services Workspace: documents.
-- A document is a stored_files S3 object plus financial context (title, type,
-- optional client/account link), team-scoped. The bytes stay in a private S3
-- bucket and are only ever served through short-lived signed URLs, so a document is
-- unreachable without a signature. Mirrors the Insurance documents design; reuses
-- the shared StorageService (no duplicate storage system).
CREATE TABLE IF NOT EXISTS financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  stored_file_id UUID NOT NULL,
  title TEXT,
  doc_type TEXT,
  client_id UUID,
  account_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_documents_team ON financial_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_client ON financial_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_account ON financial_documents(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_file ON financial_documents(stored_file_id);
