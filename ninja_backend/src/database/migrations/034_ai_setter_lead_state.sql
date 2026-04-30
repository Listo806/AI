-- Migration: AI Setter - Lead State Machine, Parsed Entities, Property Visibility
-- Required for AI Setter completion milestone

-- ============================================================================
-- 1) LEAD AI STATE (separate from CRM status)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'lead_ai_state'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_ai_state VARCHAR(30) DEFAULT 'new'
      CHECK (lead_ai_state IN ('new', 'collecting_info', 'qualified', 'booking_blocked', 'escalated_to_human'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_lead_ai_state ON leads(lead_ai_state) WHERE lead_ai_state IS NOT NULL;

-- ============================================================================
-- 2) PARSED ENTITIES (city, country, budget_min, budget_max, intent)
-- Stored in lead_metadata under key "parsed_entities"
-- Or add dedicated columns for easier querying
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'parsed_city'
  ) THEN
    ALTER TABLE leads ADD COLUMN parsed_city VARCHAR(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'parsed_country'
  ) THEN
    ALTER TABLE leads ADD COLUMN parsed_country VARCHAR(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'parsed_budget_min'
  ) THEN
    ALTER TABLE leads ADD COLUMN parsed_budget_min DECIMAL(14, 2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'parsed_budget_max'
  ) THEN
    ALTER TABLE leads ADD COLUMN parsed_budget_max DECIMAL(14, 2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'parsed_intent'
  ) THEN
    ALTER TABLE leads ADD COLUMN parsed_intent VARCHAR(30);
  END IF;
END $$;

-- ============================================================================
-- 3) LEAD STATE TRANSITIONS (audit log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_state VARCHAR(30),
  to_state VARCHAR(30) NOT NULL,
  reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_state_transitions_lead_id ON lead_state_transitions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_state_transitions_created_at ON lead_state_transitions(created_at DESC);

-- ============================================================================
-- 4) AI ↔ PROPERTY VISIBILITY (matched, sent, rejected)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_property_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL CHECK (action IN ('matched_by_ai', 'sent_to_lead', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_property_visibility_lead_id ON ai_property_visibility(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_property_visibility_property_id ON ai_property_visibility(property_id);
