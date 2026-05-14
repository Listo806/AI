CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  api_key_id UUID,

  endpoint TEXT,

  method TEXT,

  ip_address TEXT,

  response_status INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);