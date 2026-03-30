-- Per-user board ordering on dashboard
CREATE TABLE IF NOT EXISTS board_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
