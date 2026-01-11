-- Milestone 5: Analytics & Reporting
-- This migration adds the events table for tracking core actions

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'lead', 'property', 'subscription', 'team', 'user', 'payment'
  entity_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  metadata JSONB, -- Additional event-specific data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_team_id ON events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_entity_type_created_at ON events(entity_type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_team_id_created_at ON events(team_id, created_at);

-- Common event types:
-- lead.created, lead.updated, lead.status_changed, lead.assigned, lead.deleted
-- property.created, property.updated, property.published, property.status_changed, property.deleted
-- subscription.created, subscription.updated, subscription.cancelled, subscription.renewed
-- team.member_added, team.member_removed, team.created, team.updated
-- user.signed_up, user.logged_in
-- payment.succeeded, payment.failed, payment.refunded

