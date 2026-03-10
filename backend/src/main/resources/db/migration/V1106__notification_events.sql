-- =============================================================================
-- Notification Events (События уведомлений — real-time WebSocket events)
-- =============================================================================
CREATE TABLE notification_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID,
    user_id             UUID NOT NULL,
    type                VARCHAR(50) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    message             TEXT,
    entity_type         VARCHAR(100),
    entity_id           UUID,
    project_id          UUID,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_ne_user_id ON notification_events(user_id);
CREATE INDEX idx_ne_is_read ON notification_events(is_read);
CREATE INDEX idx_ne_user_unread ON notification_events(user_id, is_read) WHERE is_read = FALSE AND deleted = FALSE;
CREATE INDEX idx_ne_project_id ON notification_events(project_id);
CREATE INDEX idx_ne_entity ON notification_events(entity_type, entity_id);
CREATE INDEX idx_ne_created_at ON notification_events(created_at);

CREATE TRIGGER update_notification_events_updated_at
    BEFORE UPDATE ON notification_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Extend the notification_type CHECK constraint on the notifications table
-- to accommodate new event types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notif_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notif_type CHECK (notification_type IN (
    'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK', 'APPROVAL', 'SYSTEM',
    'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'COMMENT_ADDED',
    'DOCUMENT_UPLOADED', 'APPROVAL_REQUIRED', 'BUDGET_THRESHOLD', 'SAFETY_ALERT'
));
