-- =========================================
-- UPDATE CONTACTS TABLE
-- Add CRM contact fields
-- =========================================

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS linked_lead_name TEXT,
ADD COLUMN IF NOT EXISTS interest TEXT,
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Cold',
ADD COLUMN IF NOT EXISTS source TEXT;

-- =========================================
-- OPTIONAL: DATA CLEANUP
-- Sync linked_lead_name from leads table
-- =========================================

UPDATE contacts c
SET linked_lead_name = l.name
FROM leads l
WHERE c.lead_id = l.id
  AND c.linked_lead_name IS NULL;

-- =========================================
-- CONSTRAINTS
-- =========================================

ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_type_check;

ALTER TABLE contacts
ADD CONSTRAINT contacts_type_check
CHECK (
  type IS NULL OR
  type IN ('Buyer', 'Seller', 'Investor', 'Renter')
);

ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE contacts
ADD CONSTRAINT contacts_status_check
CHECK (
  status IS NULL OR
  status IN ('Hot', 'Warm', 'Active', 'Cold')
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_contacts_type
ON contacts(type);

CREATE INDEX IF NOT EXISTS idx_contacts_status
ON contacts(status);

CREATE INDEX IF NOT EXISTS idx_contacts_score
ON contacts(score);

CREATE INDEX IF NOT EXISTS idx_contacts_last_contact_at
ON contacts(last_contact_at);

CREATE INDEX IF NOT EXISTS idx_contacts_source
ON contacts(source);

-- =========================================
-- CONTACT ACTIVITIES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL
    REFERENCES contacts(id)
    ON DELETE CASCADE,

  user_id UUID
    REFERENCES users(id)
    ON DELETE SET NULL,

  team_id UUID NOT NULL
    REFERENCES teams(id)
    ON DELETE CASCADE,

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  sub TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_id
ON contact_activities(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_activities_user_id
ON contact_activities(user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_activities_team_id
ON contact_activities(team_id);

CREATE INDEX IF NOT EXISTS idx_contact_activities_type
ON contact_activities(type);

CREATE INDEX IF NOT EXISTS idx_contact_activities_created_at
ON contact_activities(created_at DESC);

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON TABLE contacts IS
'CRM contacts with lead linkage, scoring, status, and engagement tracking.';

COMMENT ON TABLE contact_activities IS
'Timeline activities for CRM contacts.';