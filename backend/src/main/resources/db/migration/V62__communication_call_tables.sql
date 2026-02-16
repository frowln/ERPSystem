-- =============================================================================
-- V62: Communication / Video-Audio call sessions
-- =============================================================================

CREATE TABLE call_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(500),
    project_id          UUID REFERENCES projects(id),
    channel_id          UUID REFERENCES channels(id),
    initiator_id        UUID NOT NULL REFERENCES users(id),
    initiator_name      VARCHAR(255),
    call_type           VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'RINGING',
    signaling_key       VARCHAR(128) NOT NULL UNIQUE,
    started_at          TIMESTAMP WITH TIME ZONE,
    ended_at            TIMESTAMP WITH TIME ZONE,
    duration_seconds    INTEGER NOT NULL DEFAULT 0,
    metadata_json       TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_call_type CHECK (call_type IN ('AUDIO', 'VIDEO')),
    CONSTRAINT chk_call_status CHECK (status IN ('RINGING', 'ACTIVE', 'ENDED', 'CANCELLED', 'MISSED')),
    CONSTRAINT chk_call_duration CHECK (duration_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_call_project ON call_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_call_channel ON call_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_call_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_started_at ON call_sessions(started_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_call_active ON call_sessions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_call_sessions_updated_at
    BEFORE UPDATE ON call_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE call_participants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id     UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    user_name           VARCHAR(255),
    participant_status  VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    joined_at           TIMESTAMP WITH TIME ZONE,
    left_at             TIMESTAMP WITH TIME ZONE,
    is_muted            BOOLEAN NOT NULL DEFAULT FALSE,
    is_video_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_call_participant UNIQUE (call_session_id, user_id),
    CONSTRAINT chk_call_participant_status CHECK (participant_status IN ('INVITED', 'JOINED', 'LEFT', 'DECLINED'))
);

CREATE INDEX IF NOT EXISTS idx_call_participant_call ON call_participants(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_participant_user ON call_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_call_participant_status ON call_participants(participant_status);
CREATE INDEX IF NOT EXISTS idx_call_participant_active ON call_participants(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_call_participants_updated_at
    BEFORE UPDATE ON call_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
