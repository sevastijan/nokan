-- Push subscription storage (per user per device)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Add push preference columns to existing notification_preferences
ALTER TABLE notification_preferences
  ADD COLUMN push_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN push_chat_enabled BOOLEAN NOT NULL DEFAULT true;
