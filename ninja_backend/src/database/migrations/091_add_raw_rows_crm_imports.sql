-- CRM Migration Tool parses the uploaded CSV at upload time but never stored the
-- rows, and startImport only received the importId, so a real import was
-- impossible. Persist the parsed rows on the job so startImport can process them.
ALTER TABLE crm_imports_integrations ADD COLUMN IF NOT EXISTS raw_rows JSONB DEFAULT '[]'::jsonb;
