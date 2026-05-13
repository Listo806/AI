CREATE TABLE IF NOT EXISTS crm_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  import_id UUID NOT NULL,

  row_number INTEGER,

  status TEXT,

  message TEXT,

  raw_data JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);