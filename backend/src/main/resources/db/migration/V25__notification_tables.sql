-- =============================================================================
-- Notifications (Уведомления)
-- =============================================================================
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    title               VARCHAR(500) NOT NULL,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(20) NOT NULL,
    source_model        VARCHAR(100),
    source_id           UUID,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    action_url          VARCHAR(1000),
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    expires_at          TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_notif_type CHECK (notification_type IN (
        'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK', 'APPROVAL', 'SYSTEM'
    )),
    CONSTRAINT chk_notif_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notif_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notif_source ON notifications(source_model, source_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE AND deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_active ON notifications(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Notification Batches (Массовые уведомления)
-- =============================================================================
CREATE TABLE notification_batches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(500) NOT NULL,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(20) NOT NULL,
    target_type         VARCHAR(30) NOT NULL,
    target_filter       JSONB DEFAULT '{}'::jsonb,
    sent_count          INTEGER NOT NULL DEFAULT 0,
    created_by_id       UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_batch_notif_type CHECK (notification_type IN (
        'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK', 'APPROVAL', 'SYSTEM'
    )),
    CONSTRAINT chk_batch_target_type CHECK (target_type IN (
        'ALL_USERS', 'ROLE', 'PROJECT_TEAM', 'SPECIFIC_USERS'
    )),
    CONSTRAINT chk_batch_status CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),
    CONSTRAINT chk_batch_sent_count CHECK (sent_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_batch_status ON notification_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_created_by ON notification_batches(created_by_id);
CREATE INDEX IF NOT EXISTS idx_batch_created_at ON notification_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_active ON notification_batches(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_notification_batches_updated_at
    BEFORE UPDATE ON notification_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
