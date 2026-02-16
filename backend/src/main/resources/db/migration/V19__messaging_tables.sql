-- =============================================================================
-- V19: Messaging / Communication module tables
-- =============================================================================

-- Sequence for channel codes (CH-00001, CH-00002, etc.)
CREATE SEQUENCE channel_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Channels table
-- =============================================================================
CREATE TABLE channels (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    channel_type        VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    avatar_url          VARCHAR(1000),
    creator_id          UUID NOT NULL REFERENCES users(id),
    project_id          UUID REFERENCES projects(id),
    member_count        INTEGER NOT NULL DEFAULT 0,
    last_message_at     TIMESTAMP WITH TIME ZONE,
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_channel_type CHECK (channel_type IN ('PUBLIC', 'PRIVATE', 'DIRECT'))
);

CREATE INDEX IF NOT EXISTS idx_channel_code ON channels(code);
CREATE INDEX IF NOT EXISTS idx_channel_type ON channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channel_creator ON channels(creator_id);
CREATE INDEX IF NOT EXISTS idx_channel_project ON channels(project_id);
CREATE INDEX IF NOT EXISTS idx_channel_archived ON channels(is_archived);
CREATE INDEX IF NOT EXISTS idx_channel_active ON channels(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_channel_last_message ON channels(last_message_at DESC NULLS LAST);

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Channel members table
-- =============================================================================
CREATE TABLE channel_members (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    user_name           VARCHAR(255),
    role                VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    is_muted            BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_at        TIMESTAMP WITH TIME ZONE,
    unread_count        INTEGER NOT NULL DEFAULT 0,
    joined_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_channel_member UNIQUE (channel_id, user_id),
    CONSTRAINT chk_member_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

CREATE INDEX IF NOT EXISTS idx_channel_member_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_member_user ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_member_role ON channel_members(channel_id, role);

CREATE TRIGGER update_channel_members_updated_at
    BEFORE UPDATE ON channel_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Messages table
-- =============================================================================
CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL REFERENCES users(id),
    author_name         VARCHAR(255),
    author_avatar_url   VARCHAR(1000),
    content             TEXT,
    message_type        VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    parent_message_id   UUID REFERENCES messages(id),
    is_edited           BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at           TIMESTAMP WITH TIME ZONE,
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_by           UUID REFERENCES users(id),
    pinned_at           TIMESTAMP WITH TIME ZONE,
    reply_count         INTEGER NOT NULL DEFAULT 0,
    reaction_count      INTEGER NOT NULL DEFAULT 0,
    attachment_url      VARCHAR(1000),
    attachment_name     VARCHAR(500),
    attachment_size     BIGINT,
    attachment_type     VARCHAR(100),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_message_type CHECK (message_type IN ('TEXT', 'SYSTEM', 'FILE', 'IMAGE', 'VOICE'))
);

CREATE INDEX IF NOT EXISTS idx_message_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_message_author ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_message_parent ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_pinned ON messages(channel_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_message_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_active ON messages(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_message_content_search ON messages USING gin(to_tsvector('russian', coalesce(content, '')));

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Message reactions table
-- =============================================================================
CREATE TABLE message_reactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id          UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    user_name           VARCHAR(255),
    emoji               VARCHAR(50) NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_message_reaction UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reaction_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reaction_user ON message_reactions(user_id);

CREATE TRIGGER update_message_reactions_updated_at
    BEFORE UPDATE ON message_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Message favorites table
-- =============================================================================
CREATE TABLE message_favorites (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id          UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    note                TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_message_favorite UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_message ON message_favorites(message_id);
CREATE INDEX IF NOT EXISTS idx_favorite_user ON message_favorites(user_id);

CREATE TRIGGER update_message_favorites_updated_at
    BEFORE UPDATE ON message_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- User statuses table
-- =============================================================================
CREATE TABLE user_statuses (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id),
    status_text             VARCHAR(500),
    status_emoji            VARCHAR(50),
    is_online               BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at            TIMESTAMP WITH TIME ZONE,
    availability_status     VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_availability_status CHECK (availability_status IN (
        'ONLINE', 'AWAY', 'BUSY', 'DO_NOT_DISTURB', 'OFFLINE'
    ))
);

CREATE INDEX IF NOT EXISTS idx_user_status_user ON user_statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_statuses(is_online) WHERE is_online = TRUE;

CREATE TRIGGER update_user_statuses_updated_at
    BEFORE UPDATE ON user_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
