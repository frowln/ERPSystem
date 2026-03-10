-- Per-user notification preferences (opt-out model)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL,
    organization_id UUID            NOT NULL,
    channel         VARCHAR(20)     NOT NULL,
    category        VARCHAR(30)     NOT NULL,
    enabled         BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT          NOT NULL DEFAULT 0,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_notif_pref_user_org_channel_category
        UNIQUE (user_id, organization_id, channel, category)
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_user_org ON notification_preferences (user_id, organization_id);
