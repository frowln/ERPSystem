-- Add unread tracking to channel members
ALTER TABLE channel_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
ALTER TABLE channel_members ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
