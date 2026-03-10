-- Add refresh token rotation columns to user_sessions
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(500);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;

-- Create unique index on refresh_token for fast lookup during rotation
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_session_refresh ON user_sessions (refresh_token)
    WHERE refresh_token IS NOT NULL;
