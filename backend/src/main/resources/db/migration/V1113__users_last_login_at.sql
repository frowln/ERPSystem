-- V1113: Add last_login_at column to users table for admin dashboard
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';

CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users (last_login_at)
    WHERE last_login_at IS NOT NULL;
