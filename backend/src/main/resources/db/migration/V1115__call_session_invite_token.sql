-- =============================================================================
-- V1115: Add invite_token to call_sessions for guest join links
--        Drop FK on call_participants.user_id to allow guest participants
--        Drop unique constraint to allow re-joining
-- =============================================================================

ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS invite_token VARCHAR(128) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_call_invite_token ON call_sessions(invite_token) WHERE invite_token IS NOT NULL;

-- Drop the FK constraint on call_participants.user_id to allow guest UUIDs
-- that don't correspond to real users
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'call_participants'::regclass
      AND confrelid = 'users'::regclass
      AND contype = 'f';
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE call_participants DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Drop unique constraint on (call_session_id, user_id) to allow guest re-joins
ALTER TABLE call_participants DROP CONSTRAINT IF EXISTS uq_call_participant;
