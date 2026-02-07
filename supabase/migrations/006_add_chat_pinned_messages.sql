-- Add pinned message support to chat_messages
ALTER TABLE chat_messages ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN pinned_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE chat_messages ADD COLUMN pinned_at TIMESTAMPTZ;

-- Partial index for efficient pinned message lookups per channel
CREATE INDEX idx_chat_messages_pinned ON chat_messages(channel_id) WHERE is_pinned = true;
