-- Milestone 6: AI Copilot + Visibility + Zapier
-- This migration creates tables for AI analysis, tasks, and Zapier integrations

-- ============================================================================
-- LEAD AI ANALYSIS TABLE
-- ============================================================================
-- Store AI-generated analysis for leads (cached, not generated every request)
CREATE TABLE IF NOT EXISTS lead_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  intent_label VARCHAR(50) NOT NULL CHECK (intent_label IN ('browsing', 'low_intent', 'medium_intent', 'high_intent', 'ready_to_buy')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ai_adjustment INTEGER DEFAULT 0, -- AI adjustment to base score (±10 max)
  summary_json JSONB NOT NULL, -- Structured summary: {background, property_interest, engagement, key_insights[]}
  next_action_json JSONB NOT NULL, -- Next action: {action, reason, timing}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_lead_id ON lead_ai_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_score ON lead_ai_analysis(score);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_intent ON lead_ai_analysis(intent_label);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_priority ON lead_ai_analysis(priority);

-- ============================================================================
-- LEAD TASKS TABLE
-- ============================================================================
-- Store tasks/followups for leads (used by Zapier and CRM)
CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON lead_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_status ON lead_tasks(status);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_tasks_team_id ON lead_tasks(team_id);

-- ============================================================================
-- ZAPIER INTEGRATIONS TABLE
-- ============================================================================
-- Store Zapier API keys per team
CREATE TABLE IF NOT EXISTS zapier_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  api_key VARCHAR(255) NOT NULL UNIQUE, -- Zapier API key (hashed or plain, depending on security requirements)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  UNIQUE(team_id) -- One integration per team
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_zapier_integrations_team_id ON zapier_integrations(team_id);
CREATE INDEX IF NOT EXISTS idx_zapier_integrations_api_key ON zapier_integrations(api_key);
CREATE INDEX IF NOT EXISTS idx_zapier_integrations_active ON zapier_integrations(is_active) WHERE is_active = true;

-- ============================================================================
-- AI RATE LIMITING TABLE (Optional - for tracking)
-- ============================================================================
-- Track AI requests per team for rate limiting
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, window_start)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_team_window ON ai_rate_limits(team_id, window_start DESC);
