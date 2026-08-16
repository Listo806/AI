-- Members of a static audience. Each row is a real person (optionally linked to a CRM
-- contact or a marketing lead). Unique per audience + address so the same person is
-- not double-counted, and scoped by team_id so membership never leaks across accounts.
CREATE TABLE IF NOT EXISTS mkt_audience_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  audience_id UUID NOT NULL,
  contact_id UUID,
  lead_id UUID,
  email TEXT,
  name TEXT,
  added_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_audience_member_addr
  ON mkt_audience_members(audience_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_audience_members_team ON mkt_audience_members(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_audience_members_aud ON mkt_audience_members(audience_id);
