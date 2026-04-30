-- Migration: Add lead_metadata JSONB for property flow context (property_title, seller_type)
-- Used when lead is created via POST /leads/whatsapp with property_whatsapp_* source

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'lead_metadata'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_metadata JSONB;
  END IF;
END $$;
