CREATE TABLE IF NOT EXISTS crm_imports_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL,

  source_type TEXT NOT NULL,

  file_name TEXT,

  status TEXT DEFAULT 'pending',

  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,

  mapping JSONB,

  duplicate_strategy TEXT DEFAULT 'skip',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);