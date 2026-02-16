-- =============================================================================
-- Chatter / Activity System (Система комментариев и активностей)
-- Odoo-like mail.thread implementation for cross-entity discussions
-- =============================================================================

-- =============================================================================
-- Comments (Комментарии)
-- =============================================================================
CREATE TABLE chatter_comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID NOT NULL,
    author_id           UUID NOT NULL,
    content             TEXT NOT NULL,
    attachment_urls     JSONB DEFAULT '[]'::jsonb,
    parent_comment_id   UUID,
    mentioned_user_ids  JSONB DEFAULT '[]'::jsonb,
    is_internal         BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id)
        REFERENCES chatter_comments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_entity ON chatter_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comment_author ON chatter_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comment_parent ON chatter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_created_at ON chatter_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comment_active ON chatter_comments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_chatter_comments_updated_at
    BEFORE UPDATE ON chatter_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Activity Types (Типы активностей)
-- =============================================================================
CREATE TABLE chatter_activity_types (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    icon                VARCHAR(100),
    default_days        INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    category            VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_activity_type_category CHECK (category IN (
        'DEFAULT', 'UPLOAD_FILE', 'PHONECALL', 'MEETING', 'REQUEST_SIGN'
    ))
);

CREATE INDEX IF NOT EXISTS idx_activity_type_code ON chatter_activity_types(code);
CREATE INDEX IF NOT EXISTS idx_activity_type_active ON chatter_activity_types(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_chatter_activity_types_updated_at
    BEFORE UPDATE ON chatter_activity_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default activity types
INSERT INTO chatter_activity_types (id, code, name, icon, default_days, is_active, category) VALUES
    (uuid_generate_v4(), 'TASK',     'Задача',       'fa-tasks',      7,  TRUE, 'DEFAULT'),
    (uuid_generate_v4(), 'CALL',     'Звонок',       'fa-phone',      1,  TRUE, 'PHONECALL'),
    (uuid_generate_v4(), 'EMAIL',    'Email',         'fa-envelope',   1,  TRUE, 'DEFAULT'),
    (uuid_generate_v4(), 'MEETING',  'Встреча',       'fa-users',      3,  TRUE, 'MEETING'),
    (uuid_generate_v4(), 'NOTE',     'Заметка',       'fa-sticky-note',0,  TRUE, 'DEFAULT'),
    (uuid_generate_v4(), 'DEADLINE', 'Дедлайн',       'fa-clock-o',    14, TRUE, 'DEFAULT'),
    (uuid_generate_v4(), 'APPROVAL', 'Согласование',  'fa-check-circle',3, TRUE, 'REQUEST_SIGN');

-- =============================================================================
-- Activities (Активности)
-- =============================================================================
CREATE TABLE chatter_activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID NOT NULL,
    activity_type       VARCHAR(30) NOT NULL,
    summary             VARCHAR(500) NOT NULL,
    description         TEXT,
    assigned_to_id      UUID NOT NULL,
    due_date            DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    completed_at        TIMESTAMP WITH TIME ZONE,
    completed_by_id     UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_activity_type CHECK (activity_type IN (
        'TASK', 'CALL', 'EMAIL', 'MEETING', 'NOTE', 'DEADLINE', 'APPROVAL'
    )),
    CONSTRAINT chk_activity_status CHECK (status IN (
        'PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_activity_entity ON chatter_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_assigned ON chatter_activities(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_activity_status ON chatter_activities(status);
CREATE INDEX IF NOT EXISTS idx_activity_due_date ON chatter_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_type ON chatter_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_active ON chatter_activities(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_overdue ON chatter_activities(due_date, status)
    WHERE status IN ('PLANNED', 'IN_PROGRESS') AND deleted = FALSE;

CREATE TRIGGER update_chatter_activities_updated_at
    BEFORE UPDATE ON chatter_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Followers (Подписчики)
-- =============================================================================
CREATE TABLE chatter_followers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID NOT NULL,
    user_id             UUID NOT NULL,
    follow_reason       VARCHAR(255),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_follower_entity_user UNIQUE (entity_type, entity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_follower_entity ON chatter_followers(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_follower_user ON chatter_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_follower_active ON chatter_followers(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_chatter_followers_updated_at
    BEFORE UPDATE ON chatter_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Entity Change Log (Лог изменений полей)
-- =============================================================================
CREATE TABLE chatter_entity_change_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID NOT NULL,
    field_name          VARCHAR(255) NOT NULL,
    old_value           TEXT,
    new_value           TEXT,
    changed_by_id       UUID NOT NULL,
    changed_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_changelog_entity ON chatter_entity_change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_changelog_changed_by ON chatter_entity_change_logs(changed_by_id);
CREATE INDEX IF NOT EXISTS idx_changelog_changed_at ON chatter_entity_change_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_changelog_field ON chatter_entity_change_logs(entity_type, entity_id, field_name);

CREATE TRIGGER update_chatter_entity_change_logs_updated_at
    BEFORE UPDATE ON chatter_entity_change_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Attachments (Вложения)
-- =============================================================================
CREATE TABLE chatter_attachments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID NOT NULL,
    file_name           VARCHAR(500) NOT NULL,
    file_url            VARCHAR(1000) NOT NULL,
    file_size           BIGINT NOT NULL DEFAULT 0,
    mime_type           VARCHAR(255),
    uploaded_by_id      UUID NOT NULL,
    uploaded_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_attachment_file_size CHECK (file_size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_attachment_entity ON chatter_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachment_uploaded_by ON chatter_attachments(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_attachment_uploaded_at ON chatter_attachments(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_attachment_active ON chatter_attachments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_chatter_attachments_updated_at
    BEFORE UPDATE ON chatter_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
