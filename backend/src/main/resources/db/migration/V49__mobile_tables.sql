-- =============================================================================
-- Mobile / PWA tables
-- =============================================================================

-- Mobile Devices
CREATE TABLE mobile_devices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    device_token        VARCHAR(500) NOT NULL,
    platform            VARCHAR(20) NOT NULL,
    device_model        VARCHAR(200),
    os_version          VARCHAR(100),
    app_version         VARCHAR(100),
    last_active_at      TIMESTAMP WITH TIME ZONE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mobile_device_platform CHECK (platform IN ('IOS', 'ANDROID', 'WEB'))
);

CREATE INDEX IF NOT EXISTS idx_mobile_device_user ON mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_device_token ON mobile_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_mobile_device_platform ON mobile_devices(platform);
CREATE INDEX IF NOT EXISTS idx_mobile_device_active ON mobile_devices(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mobile_devices_updated_at
    BEFORE UPDATE ON mobile_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Push Notifications
CREATE TABLE push_notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id           UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    body                TEXT NOT NULL,
    data                JSONB,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at             TIMESTAMP WITH TIME ZONE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    error_message       TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_push_notification_status CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_push_notification_device ON push_notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_status ON push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notification_active ON push_notifications(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_push_notifications_updated_at
    BEFORE UPDATE ON push_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Offline Actions
CREATE TABLE offline_actions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    device_id           UUID REFERENCES mobile_devices(id),
    action_type         VARCHAR(20) NOT NULL,
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID,
    payload             JSONB NOT NULL,
    synced_at           TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    conflict_resolution VARCHAR(100),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_offline_action_type CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    CONSTRAINT chk_offline_action_status CHECK (status IN ('PENDING', 'SYNCED', 'CONFLICT'))
);

CREATE INDEX IF NOT EXISTS idx_offline_action_user ON offline_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_action_device ON offline_actions(device_id);
CREATE INDEX IF NOT EXISTS idx_offline_action_status ON offline_actions(status);
CREATE INDEX IF NOT EXISTS idx_offline_action_entity ON offline_actions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_offline_action_active ON offline_actions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_offline_actions_updated_at
    BEFORE UPDATE ON offline_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Mobile Form Configs
CREATE TABLE mobile_form_configs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    form_layout         JSONB NOT NULL,
    required_fields     JSONB,
    offline_capable     BOOLEAN NOT NULL DEFAULT FALSE,
    form_version        INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mobile_form_entity ON mobile_form_configs(entity_type);
CREATE INDEX IF NOT EXISTS idx_mobile_form_active_flag ON mobile_form_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_mobile_form_active ON mobile_form_configs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_mobile_form_configs_updated_at
    BEFORE UPDATE ON mobile_form_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Geo Locations
CREATE TABLE geo_locations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,
    accuracy            DOUBLE PRECISION,
    altitude            DOUBLE PRECISION,
    recorded_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    project_id          UUID REFERENCES projects(id),
    entity_type         VARCHAR(100),
    entity_id           UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_geo_location_user ON geo_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_geo_location_project ON geo_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_geo_location_recorded ON geo_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_geo_location_entity ON geo_locations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_geo_location_active ON geo_locations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_geo_locations_updated_at
    BEFORE UPDATE ON geo_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Photo Captures
CREATE TABLE photo_captures (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    project_id          UUID REFERENCES projects(id),
    photo_url           VARCHAR(1000) NOT NULL,
    thumbnail_url       VARCHAR(1000),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    taken_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    entity_type         VARCHAR(100),
    entity_id           UUID,
    description         TEXT,
    tags                JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photo_capture_user ON photo_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_capture_project ON photo_captures(project_id);
CREATE INDEX IF NOT EXISTS idx_photo_capture_taken ON photo_captures(taken_at);
CREATE INDEX IF NOT EXISTS idx_photo_capture_entity ON photo_captures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_photo_capture_active ON photo_captures(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_photo_captures_updated_at
    BEFORE UPDATE ON photo_captures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
