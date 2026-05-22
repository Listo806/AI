CREATE TABLE public.team_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    team_id uuid NOT NULL REFERENCES teams(id),
    invited_by uuid REFERENCES users(id),

    email varchar(255) NOT NULL,
    role varchar(50) NOT NULL DEFAULT 'agent',

    token varchar(255) NOT NULL,

    status varchar(30) NOT NULL DEFAULT 'pending',

    expires_at timestamp,
    accepted_at timestamp,

    created_at timestamp DEFAULT now()
);