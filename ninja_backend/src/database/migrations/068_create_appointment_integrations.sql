CREATE TABLE IF NOT EXISTS appointment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID UNIQUE NOT NULL,

  provider TEXT,

  booking_enabled BOOLEAN DEFAULT true,

  property_tours_enabled BOOLEAN DEFAULT true,

  auto_assign_agent BOOLEAN DEFAULT true,

  meeting_duration_minutes INTEGER DEFAULT 30,

  buffer_minutes INTEGER DEFAULT 15,

  timezone TEXT DEFAULT 'UTC',

  notification_email TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);