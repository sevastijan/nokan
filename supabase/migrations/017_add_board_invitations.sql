-- Board invitations table for email-based board onboarding
CREATE TABLE IF NOT EXISTS board_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  role TEXT DEFAULT 'MEMBER',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

-- Prevent duplicate pending invitations for same board+email
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_invitations_pending
  ON board_invitations (board_id, lower(email))
  WHERE status = 'pending';

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_board_invitations_token
  ON board_invitations (token);

ALTER TABLE board_invitations ENABLE ROW LEVEL SECURITY;
