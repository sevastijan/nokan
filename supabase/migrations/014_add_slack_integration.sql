-- Global app settings (key-value)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Per-board Slack integration
CREATE TABLE IF NOT EXISTS slack_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL UNIQUE REFERENCES boards(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  channel_name text,
  workspace_name text,
  team_id text,
  access_token text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slack_integrations_board ON slack_integrations(board_id);
