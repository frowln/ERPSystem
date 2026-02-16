-- =============================================================================
-- V67: Extended Messaging module (Odoo mail system compatibility)
-- Mail followers, subtypes, activities, templates, blacklist, tracking, notifications
-- =============================================================================

-- =============================================================================
-- Mail Subtypes (Подтипы сообщений)
-- =============================================================================
CREATE TABLE mail_subtypes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    model_name          VARCHAR(100),
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    is_internal         BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id           UUID REFERENCES mail_subtypes(id) ON DELETE SET NULL,
    sequence            INTEGER NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mail_subtype_model ON mail_subtypes(model_name);
CREATE INDEX IF NOT EXISTS idx_mail_subtype_parent ON mail_subtypes(parent_id);
CREATE INDEX IF NOT EXISTS idx_mail_subtype_sequence ON mail_subtypes(sequence);
CREATE INDEX IF NOT EXISTS idx_mail_subtype_active ON mail_subtypes(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_subtypes_updated_at
    BEFORE UPDATE ON mail_subtypes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default subtypes
INSERT INTO mail_subtypes (id, name, description, is_default, is_internal, sequence) VALUES
    (uuid_generate_v4(), 'Обсуждения',    'Общие обсуждения',                 TRUE,  FALSE, 1),
    (uuid_generate_v4(), 'Заметка',       'Внутренняя заметка',               FALSE, TRUE,  2),
    (uuid_generate_v4(), 'Активности',    'Уведомления об активностях',       TRUE,  FALSE, 3),
    (uuid_generate_v4(), 'Изменения',     'Отслеживание изменений полей',     TRUE,  FALSE, 4),
    (uuid_generate_v4(), 'Согласование',  'Запросы на согласование',          FALSE, FALSE, 5);

-- =============================================================================
-- Mail Followers (Подписчики на записи)
-- =============================================================================
CREATE TABLE mail_followers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name          VARCHAR(100) NOT NULL,
    record_id           UUID NOT NULL,
    user_id             UUID NOT NULL REFERENCES users(id),
    channel_id          UUID REFERENCES channels(id) ON DELETE SET NULL,
    subtype_ids         TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_mail_follower_record_user UNIQUE (model_name, record_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mail_follower_record ON mail_followers(model_name, record_id);
CREATE INDEX IF NOT EXISTS idx_mail_follower_user ON mail_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_follower_channel ON mail_followers(channel_id);
CREATE INDEX IF NOT EXISTS idx_mail_follower_active ON mail_followers(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_followers_updated_at
    BEFORE UPDATE ON mail_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Mail Activity Types (Типы активностей)
-- =============================================================================
CREATE TABLE mail_activity_types (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(30) NOT NULL DEFAULT 'DEFAULT',
    delay_count         INTEGER NOT NULL DEFAULT 0,
    delay_unit          VARCHAR(10) NOT NULL DEFAULT 'DAYS',
    icon                VARCHAR(100),
    decoration_type     VARCHAR(20),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mail_activity_type_category CHECK (category IN (
        'DEFAULT', 'UPLOAD_FILE', 'PHONECALL', 'MEETING', 'APPROVAL', 'SIGN'
    )),
    CONSTRAINT chk_mail_activity_type_delay_unit CHECK (delay_unit IN (
        'DAYS', 'WEEKS', 'MONTHS'
    )),
    CONSTRAINT chk_mail_activity_type_decoration CHECK (decoration_type IS NULL OR decoration_type IN (
        'WARNING', 'DANGER', 'SUCCESS'
    ))
);

CREATE INDEX IF NOT EXISTS idx_mail_activity_type_name ON mail_activity_types(name);
CREATE INDEX IF NOT EXISTS idx_mail_activity_type_category ON mail_activity_types(category);
CREATE INDEX IF NOT EXISTS idx_mail_activity_type_active ON mail_activity_types(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_activity_types_updated_at
    BEFORE UPDATE ON mail_activity_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default activity types
INSERT INTO mail_activity_types (id, name, category, delay_count, delay_unit, icon, decoration_type) VALUES
    (uuid_generate_v4(), 'Электронная почта',  'DEFAULT',     1, 'DAYS',   'fa-envelope',      NULL),
    (uuid_generate_v4(), 'Звонок',             'PHONECALL',   1, 'DAYS',   'fa-phone',          NULL),
    (uuid_generate_v4(), 'Встреча',            'MEETING',     3, 'DAYS',   'fa-users',          NULL),
    (uuid_generate_v4(), 'Задача',             'DEFAULT',     7, 'DAYS',   'fa-tasks',          NULL),
    (uuid_generate_v4(), 'Загрузка документа', 'UPLOAD_FILE', 3, 'DAYS',   'fa-upload',         'WARNING'),
    (uuid_generate_v4(), 'Согласование',       'APPROVAL',    5, 'DAYS',   'fa-check-circle',   'DANGER'),
    (uuid_generate_v4(), 'Подпись',            'SIGN',        7, 'DAYS',   'fa-pencil-square',  'SUCCESS');

-- =============================================================================
-- Mail Activities (Запланированные активности)
-- =============================================================================
CREATE TABLE mail_activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name          VARCHAR(100) NOT NULL,
    record_id           UUID NOT NULL,
    activity_type_id    UUID NOT NULL REFERENCES mail_activity_types(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    assigned_user_id    UUID NOT NULL REFERENCES users(id),
    summary             VARCHAR(500),
    note                TEXT,
    due_date            DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    completed_at        TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mail_activity_status CHECK (status IN (
        'PLANNED', 'DONE', 'CANCELLED', 'OVERDUE'
    ))
);

CREATE INDEX IF NOT EXISTS idx_mail_activity_record ON mail_activities(model_name, record_id);
CREATE INDEX IF NOT EXISTS idx_mail_activity_type ON mail_activities(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_mail_activity_user ON mail_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_activity_assigned ON mail_activities(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_mail_activity_status ON mail_activities(status);
CREATE INDEX IF NOT EXISTS idx_mail_activity_due_date ON mail_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_mail_activity_active ON mail_activities(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mail_activity_overdue ON mail_activities(due_date, status)
    WHERE status = 'PLANNED' AND deleted = FALSE;

CREATE TRIGGER update_mail_activities_updated_at
    BEFORE UPDATE ON mail_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Mail Templates (Шаблоны электронной почты)
-- =============================================================================
CREATE TABLE mail_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    model_name          VARCHAR(100),
    subject             VARCHAR(1000),
    body_html           TEXT,
    email_from          VARCHAR(500),
    email_to            VARCHAR(500),
    email_cc            VARCHAR(500),
    reply_to            VARCHAR(500),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    lang                VARCHAR(10),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mail_template_model ON mail_templates(model_name);
CREATE INDEX IF NOT EXISTS idx_mail_template_active ON mail_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_mail_template_deleted ON mail_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_templates_updated_at
    BEFORE UPDATE ON mail_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Mail Blacklist (Черный список email)
-- =============================================================================
CREATE TABLE mail_blacklist (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(500) NOT NULL UNIQUE,
    reason              VARCHAR(1000),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mail_blacklist_email ON mail_blacklist(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_mail_blacklist_active ON mail_blacklist(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_mail_blacklist_deleted ON mail_blacklist(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_blacklist_updated_at
    BEFORE UPDATE ON mail_blacklist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Mail Tracking (Отслеживание доставки email)
-- =============================================================================
CREATE TABLE mail_tracking (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id          UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    recipient_email     VARCHAR(500) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at             TIMESTAMP WITH TIME ZONE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    opened_at           TIMESTAMP WITH TIME ZONE,
    error_message       VARCHAR(2000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mail_tracking_status CHECK (status IN (
        'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'ERROR'
    ))
);

CREATE INDEX IF NOT EXISTS idx_mail_tracking_message ON mail_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_mail_tracking_recipient ON mail_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_mail_tracking_status ON mail_tracking(status);
CREATE INDEX IF NOT EXISTS idx_mail_tracking_sent_at ON mail_tracking(sent_at);
CREATE INDEX IF NOT EXISTS idx_mail_tracking_active ON mail_tracking(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_tracking_updated_at
    BEFORE UPDATE ON mail_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Mail Notifications (Уведомления о сообщениях)
-- =============================================================================
CREATE TABLE mail_notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id          UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    notification_type   VARCHAR(20) NOT NULL DEFAULT 'INBOX',
    status              VARCHAR(20) NOT NULL DEFAULT 'READY',
    failure_type        VARCHAR(255),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mail_notification_type CHECK (notification_type IN (
        'INBOX', 'EMAIL', 'PUSH'
    )),
    CONSTRAINT chk_mail_notification_status CHECK (status IN (
        'READY', 'SENT', 'BOUNCE', 'EXCEPTION', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_mail_notification_message ON mail_notifications(message_id);
CREATE INDEX IF NOT EXISTS idx_mail_notification_user ON mail_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_notification_is_read ON mail_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_mail_notification_type ON mail_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_mail_notification_status ON mail_notifications(status);
CREATE INDEX IF NOT EXISTS idx_mail_notification_unread ON mail_notifications(user_id, is_read)
    WHERE is_read = FALSE AND deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mail_notification_active ON mail_notifications(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mail_notifications_updated_at
    BEFORE UPDATE ON mail_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
