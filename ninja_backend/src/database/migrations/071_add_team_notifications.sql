CREATE TABLE public.team_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    team_id uuid NOT NULL REFERENCES teams(id),

    user_id uuid REFERENCES users(id),

    type varchar(50) NOT NULL,

    title text NOT NULL,
    message text,

    is_read boolean DEFAULT false,

    metadata jsonb,

    created_at timestamp DEFAULT now()
);