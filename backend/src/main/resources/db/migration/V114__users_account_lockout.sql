-- V114: Add brute-force protection fields to users table
-- failed_login_attempts: consecutive failed login counter (reset on success)
-- locked_until: null = not locked; timestamp = locked until that time

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until          TIMESTAMPTZ;

COMMENT ON COLUMN users.failed_login_attempts IS 'Consecutive failed login attempts since last success. Reset to 0 on successful login.';
COMMENT ON COLUMN users.locked_until           IS 'Account is locked until this timestamp. NULL means not locked.';

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users (locked_until)
    WHERE locked_until IS NOT NULL;
