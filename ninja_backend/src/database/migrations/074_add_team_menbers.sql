CREATE TABLE team_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role varchar(30) NOT NULL DEFAULT 'agent',

    status varchar(30) NOT NULL DEFAULT 'active',

    invited_by uuid REFERENCES users(id),

    joined_at timestamp DEFAULT now(),

    created_at timestamp DEFAULT now(),

    updated_at timestamp DEFAULT now(),

    UNIQUE(team_id, user_id),

    CONSTRAINT team_members_role_check
    CHECK (
      role IN (
        'admin',
        'manager',
        'agent',
        'viewer'
      )
    )
);

CREATE INDEX idx_team_members_team_id
ON public.team_members(team_id);

CREATE INDEX idx_team_members_user_id
ON public.team_members(user_id);

CREATE INDEX idx_team_members_role
ON public.team_members(role);


CREATE INDEX idx_team_invitations_team_id
ON public.team_invitations(team_id);

CREATE INDEX idx_team_invitations_email
ON public.team_invitations(email);

CREATE INDEX idx_team_invitations_token
ON public.team_invitations(token);

CREATE INDEX idx_team_invitations_status
ON public.team_invitations(status);