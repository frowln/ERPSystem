-- Broadcast notifications: admin announcements to all users in an organization
CREATE TABLE IF NOT EXISTS broadcast_notifications (
    id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID            NOT NULL,
    title                 VARCHAR(500)    NOT NULL,
    message               TEXT            NOT NULL,
    type                  VARCHAR(20)     NOT NULL,
    priority              VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',
    broadcast_created_by  UUID            NOT NULL,
    expires_at            TIMESTAMPTZ,
    active                BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    version               BIGINT          NOT NULL DEFAULT 0,
    deleted               BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_broadcast_org_active ON broadcast_notifications (organization_id, active);
CREATE INDEX IF NOT EXISTS idx_broadcast_created_at ON broadcast_notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_expires_at ON broadcast_notifications (expires_at);
