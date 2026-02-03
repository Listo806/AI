-- CORTEXA WhatsApp Core (Add-ons): stage + intent_events
-- Adds conversation.stage and intent_events for minimal intent detection and routing escalation.

-- ============================================================================
-- CONVERSATIONS: add stage
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'stage'
  ) THEN
    ALTER TABLE conversations
      ADD COLUMN stage VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (stage IN ('new','qualified','presented','escalated','converted','closed'));
  END IF;
END $$;

-- Backfill stage if any nulls (safety)
UPDATE conversations SET stage = 'new' WHERE stage IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_stage ON conversations(stage);

-- ============================================================================
-- INTENT EVENTS (lightweight)
-- ============================================================================
CREATE TABLE IF NOT EXISTS intent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  intent_type VARCHAR(30) NOT NULL CHECK (intent_type IN ('buy','rent','sell','agent_request','general')),
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  detected_from VARCHAR(20) NOT NULL CHECK (detected_from IN ('text','audio','button')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('organic','ad')),
  source_meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_events_conversation_id ON intent_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_intent_events_lead_id ON intent_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_intent_events_created_at ON intent_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_events_conv_created ON intent_events(conversation_id, created_at DESC);

