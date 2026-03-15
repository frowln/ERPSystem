-- =============================================================================
-- V1173: Range-partition high-growth tables by date for query performance
--
-- PostgreSQL does not support ALTER TABLE ... PARTITION BY on existing tables,
-- so the procedure for each table is:
--   1. Rename the existing table to <name>_old
--   2. Create a new partitioned table with the identical schema
--   3. Create yearly partitions (2024-2027) + a DEFAULT partition
--   4. Copy all rows from _old into the new partitioned table
--   5. Drop the _old table
--
-- Tables partitioned:
--   - audit_logs        (partition key: timestamp)
--   - notifications     (partition key: created_at)
--   - notification_events (partition key: created_at)
-- =============================================================================

BEGIN;

-- =========================================================================
-- 1. audit_logs — RANGE partition by "timestamp"
-- =========================================================================

-- 1a. Rename existing table (carries all data + indexes with it)
ALTER TABLE IF EXISTS audit_logs RENAME TO audit_logs_old;

-- Drop old indexes so names are free for the new table
DROP INDEX IF EXISTS idx_audit_entity;
DROP INDEX IF EXISTS idx_audit_user;
DROP INDEX IF EXISTS idx_audit_timestamp;
DROP INDEX IF EXISTS idx_audit_action;

-- 1b. Create partitioned table with identical schema
--     NOTE: PRIMARY KEY must include the partition key for partitioned tables.
CREATE TABLE audit_logs (
    id          UUID        NOT NULL DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID        NOT NULL,
    action      VARCHAR(50) NOT NULL,
    field       VARCHAR(100),
    old_value   TEXT,
    new_value   TEXT,
    user_id     UUID,
    user_name   VARCHAR(255),
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address  VARCHAR(45),

    CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- 1c. Yearly partitions + default
CREATE TABLE audit_logs_y2024 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE audit_logs_y2025 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE audit_logs_y2026 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE audit_logs_y2027 PARTITION OF audit_logs
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- 1d. Recreate indexes (they propagate to all partitions automatically)
CREATE INDEX idx_audit_entity    ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user      ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action    ON audit_logs(action);

-- 1e. Migrate data
INSERT INTO audit_logs (id, entity_type, entity_id, action, field, old_value, new_value, user_id, user_name, timestamp, ip_address)
SELECT id, entity_type, entity_id, action, field, old_value, new_value, user_id, user_name, timestamp, ip_address
FROM audit_logs_old;

-- 1f. Drop old table
DROP TABLE audit_logs_old;


-- =========================================================================
-- 2. notifications — RANGE partition by "created_at"
-- =========================================================================

-- 2a. Drop trigger first (cannot rename table that has triggers referencing it by old name)
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- 2b. Rename existing table
ALTER TABLE IF EXISTS notifications RENAME TO notifications_old;

-- Drop old indexes so names are free
DROP INDEX IF EXISTS idx_notif_user;
DROP INDEX IF EXISTS idx_notif_type;
DROP INDEX IF EXISTS idx_notif_is_read;
DROP INDEX IF EXISTS idx_notif_priority;
DROP INDEX IF EXISTS idx_notif_created_at;
DROP INDEX IF EXISTS idx_notif_expires_at;
DROP INDEX IF EXISTS idx_notif_source;
DROP INDEX IF EXISTS idx_notif_user_unread;
DROP INDEX IF EXISTS idx_notif_active;

-- 2c. Create partitioned table with identical schema
--     notification_type expanded to VARCHAR(30) per V1117
CREATE TABLE notifications (
    id                  UUID        NOT NULL DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL,
    title               VARCHAR(500) NOT NULL,
    message             TEXT        NOT NULL,
    notification_type   VARCHAR(30) NOT NULL,
    source_model        VARCHAR(100),
    source_id           UUID,
    is_read             BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    action_url          VARCHAR(1000),
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    expires_at          TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT      NOT NULL DEFAULT 0,

    CONSTRAINT chk_notif_type CHECK (notification_type IN (
        'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK', 'APPROVAL', 'SYSTEM',
        'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'COMMENT_ADDED',
        'DOCUMENT_UPLOADED', 'APPROVAL_REQUIRED', 'BUDGET_THRESHOLD',
        'SAFETY_ALERT', 'MESSAGE', 'CALL'
    )),
    CONSTRAINT chk_notif_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2d. Yearly partitions + default
CREATE TABLE notifications_y2024 PARTITION OF notifications
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE notifications_y2025 PARTITION OF notifications
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE notifications_y2026 PARTITION OF notifications
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE notifications_y2027 PARTITION OF notifications
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE notifications_default PARTITION OF notifications DEFAULT;

-- 2e. Recreate indexes
CREATE INDEX idx_notif_user       ON notifications(user_id);
CREATE INDEX idx_notif_type       ON notifications(notification_type);
CREATE INDEX idx_notif_is_read    ON notifications(is_read);
CREATE INDEX idx_notif_priority   ON notifications(priority);
CREATE INDEX idx_notif_created_at ON notifications(created_at);
CREATE INDEX idx_notif_expires_at ON notifications(expires_at);
CREATE INDEX idx_notif_source     ON notifications(source_model, source_id);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE AND deleted = FALSE;
CREATE INDEX idx_notif_active     ON notifications(deleted) WHERE deleted = FALSE;

-- 2f. Recreate trigger
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2g. Migrate data
INSERT INTO notifications (id, user_id, title, message, notification_type, source_model, source_id,
    is_read, read_at, action_url, priority, expires_at, deleted, created_at, updated_at,
    created_by, updated_by, version)
SELECT id, user_id, title, message, notification_type, source_model, source_id,
    is_read, read_at, action_url, priority, expires_at, deleted, created_at, updated_at,
    created_by, updated_by, version
FROM notifications_old;

-- 2h. Drop old table
DROP TABLE notifications_old;


-- =========================================================================
-- 3. notification_events — RANGE partition by "created_at"
-- =========================================================================

-- 3a. Drop trigger first
DROP TRIGGER IF EXISTS update_notification_events_updated_at ON notification_events;

-- 3b. Rename existing table
ALTER TABLE IF EXISTS notification_events RENAME TO notification_events_old;

-- Drop old indexes so names are free
DROP INDEX IF EXISTS idx_ne_user_id;
DROP INDEX IF EXISTS idx_ne_is_read;
DROP INDEX IF EXISTS idx_ne_user_unread;
DROP INDEX IF EXISTS idx_ne_project_id;
DROP INDEX IF EXISTS idx_ne_entity;
DROP INDEX IF EXISTS idx_ne_created_at;

-- 3c. Create partitioned table with identical schema
CREATE TABLE notification_events (
    id                  UUID        NOT NULL DEFAULT uuid_generate_v4(),
    organization_id     UUID,
    user_id             UUID        NOT NULL,
    type                VARCHAR(50) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    message             TEXT,
    entity_type         VARCHAR(100),
    entity_id           UUID,
    project_id          UUID,
    is_read             BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT      NOT NULL DEFAULT 0,

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 3d. Yearly partitions + default
CREATE TABLE notification_events_y2024 PARTITION OF notification_events
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE notification_events_y2025 PARTITION OF notification_events
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE notification_events_y2026 PARTITION OF notification_events
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE notification_events_y2027 PARTITION OF notification_events
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE notification_events_default PARTITION OF notification_events DEFAULT;

-- 3e. Recreate indexes
CREATE INDEX idx_ne_user_id    ON notification_events(user_id);
CREATE INDEX idx_ne_is_read    ON notification_events(is_read);
CREATE INDEX idx_ne_user_unread ON notification_events(user_id, is_read) WHERE is_read = FALSE AND deleted = FALSE;
CREATE INDEX idx_ne_project_id ON notification_events(project_id);
CREATE INDEX idx_ne_entity     ON notification_events(entity_type, entity_id);
CREATE INDEX idx_ne_created_at ON notification_events(created_at);

-- 3f. Recreate trigger
CREATE TRIGGER update_notification_events_updated_at
    BEFORE UPDATE ON notification_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3g. Migrate data
INSERT INTO notification_events (id, organization_id, user_id, type, title, message, entity_type,
    entity_id, project_id, is_read, deleted, created_at, updated_at, created_by, updated_by, version)
SELECT id, organization_id, user_id, type, title, message, entity_type,
    entity_id, project_id, is_read, deleted, created_at, updated_at, created_by, updated_by, version
FROM notification_events_old;

-- 3h. Drop old table
DROP TABLE notification_events_old;

COMMIT;
