-- Insurance documents. Team-scoped index of files (policy PDFs, claim evidence,
-- client paperwork) that links a stored_files S3 object to insurance context. The
-- actual bytes live in S3 via stored_files; this row carries the insurance
-- metadata + optional links to a policy/claim/contact. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS insurance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  stored_file_id UUID NOT NULL,
  title TEXT,
  doc_type TEXT,
  policy_id UUID,
  claim_id UUID,
  contact_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_documents_team ON insurance_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_insurance_documents_policy ON insurance_documents(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_documents_claim ON insurance_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_insurance_documents_file ON insurance_documents(stored_file_id);
