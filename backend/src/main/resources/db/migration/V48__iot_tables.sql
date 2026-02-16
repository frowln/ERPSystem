-- =============================================================================
-- IoT Sensors tables
-- =============================================================================

-- IoT Devices
CREATE TABLE iot_devices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    device_type         VARCHAR(30) NOT NULL,
    serial_number       VARCHAR(200) NOT NULL,
    project_id          UUID REFERENCES projects(id),
    location            VARCHAR(500),
    installation_date   DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
    last_data_at        TIMESTAMP WITH TIME ZONE,
    battery_level       INTEGER,
    firmware_version    VARCHAR(100),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_iot_device_type CHECK (device_type IN (
        'TEMPERATURE', 'HUMIDITY', 'VIBRATION', 'NOISE', 'DUST',
        'CAMERA', 'GPS_TRACKER', 'CONCRETE_SENSOR'
    )),
    CONSTRAINT chk_iot_device_status CHECK (status IN (
        'ONLINE', 'OFFLINE', 'MAINTENANCE', 'DECOMMISSIONED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_iot_device_code ON iot_devices(code);
CREATE INDEX IF NOT EXISTS idx_iot_device_project ON iot_devices(project_id);
CREATE INDEX IF NOT EXISTS idx_iot_device_type ON iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_device_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_device_active ON iot_devices(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_iot_devices_updated_at
    BEFORE UPDATE ON iot_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- IoT Sensor Data
CREATE TABLE iot_sensor_data (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id           UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    timestamp           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metric_name         VARCHAR(100) NOT NULL,
    metric_value        DOUBLE PRECISION NOT NULL,
    unit                VARCHAR(50),
    is_anomaly          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iot_sensor_device ON iot_sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_timestamp ON iot_sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_metric ON iot_sensor_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_anomaly ON iot_sensor_data(is_anomaly) WHERE is_anomaly = TRUE;
CREATE INDEX IF NOT EXISTS idx_iot_sensor_active ON iot_sensor_data(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_iot_sensor_data_updated_at
    BEFORE UPDATE ON iot_sensor_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- IoT Alerts
CREATE TABLE iot_alerts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id           UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    alert_type          VARCHAR(30) NOT NULL,
    severity            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    message             TEXT NOT NULL,
    threshold_value     DOUBLE PRECISION,
    actual_value        DOUBLE PRECISION,
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    acknowledged_by_id  UUID REFERENCES users(id),
    resolved_at         TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_iot_alert_type CHECK (alert_type IN (
        'THRESHOLD_EXCEEDED', 'DEVICE_OFFLINE', 'LOW_BATTERY', 'ANOMALY'
    )),
    CONSTRAINT chk_iot_alert_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_iot_alert_status CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'))
);

CREATE INDEX IF NOT EXISTS idx_iot_alert_device ON iot_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_alert_type ON iot_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_iot_alert_severity ON iot_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_iot_alert_status ON iot_alerts(status);
CREATE INDEX IF NOT EXISTS idx_iot_alert_active ON iot_alerts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_iot_alerts_updated_at
    BEFORE UPDATE ON iot_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- IoT Alert Rules
CREATE TABLE iot_alert_rules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_type         VARCHAR(30) NOT NULL,
    metric_name         VARCHAR(100) NOT NULL,
    condition           VARCHAR(10) NOT NULL,
    threshold_value     DOUBLE PRECISION NOT NULL,
    threshold_value2    DOUBLE PRECISION,
    severity            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    notify_user_ids     JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_iot_rule_condition CHECK (condition IN ('GT', 'LT', 'EQ', 'BETWEEN')),
    CONSTRAINT chk_iot_rule_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_iot_rule_device_type ON iot_alert_rules(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_rule_metric ON iot_alert_rules(metric_name);
CREATE INDEX IF NOT EXISTS idx_iot_rule_active_flag ON iot_alert_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_iot_rule_active ON iot_alert_rules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_iot_alert_rules_updated_at
    BEFORE UPDATE ON iot_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- IoT Dashboards
CREATE TABLE iot_dashboards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID REFERENCES projects(id),
    name                VARCHAR(500) NOT NULL,
    widgets             JSONB,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_id       UUID REFERENCES users(id),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iot_dashboard_project ON iot_dashboards(project_id);
CREATE INDEX IF NOT EXISTS idx_iot_dashboard_creator ON iot_dashboards(created_by_id);
CREATE INDEX IF NOT EXISTS idx_iot_dashboard_active ON iot_dashboards(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_iot_dashboards_updated_at
    BEFORE UPDATE ON iot_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
