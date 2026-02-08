-- Enable Realtime on chat_channel_members so users see new
-- conversations immediately when someone creates a DM with them.
ALTER PUBLICATION supabase_realtime ADD TABLE chat_channel_members;
