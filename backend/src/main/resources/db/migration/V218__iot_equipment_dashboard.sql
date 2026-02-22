-- IoT Equipment Dashboard tables (GPS tracking, telemetry, geofencing)

CREATE TABLE iot_equipment_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    device_serial VARCHAR(100) NOT NULL,
    device_type VARCHAR(30) NOT NULL,
    equipment_id UUID,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    firmware_version VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_iot_eq_dev_org ON iot_equipment_devices(organization_id);
CREATE INDEX idx_iot_eq_dev_serial ON iot_equipment_devices(device_serial);
CREATE INDEX idx_iot_eq_dev_type ON iot_equipment_devices(device_type);
CREATE INDEX idx_iot_eq_dev_equipment ON iot_equipment_devices(equipment_id);
CREATE INDEX idx_iot_eq_dev_active ON iot_equipment_devices(organization_id, is_active) WHERE deleted = false;
CREATE UNIQUE INDEX idx_iot_eq_dev_org_serial ON iot_equipment_devices(organization_id, device_serial) WHERE deleted = false;

CREATE TABLE iot_telemetry_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES iot_equipment_devices(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    engine_hours DOUBLE PRECISION,
    fuel_level_percent DOUBLE PRECISION,
    fuel_consumed_liters DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    battery_level DOUBLE PRECISION,
    raw_payload_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_iot_telemetry_org ON iot_telemetry_points(organization_id);
CREATE INDEX idx_iot_telemetry_device ON iot_telemetry_points(device_id);
CREATE INDEX idx_iot_telemetry_device_time ON iot_telemetry_points(device_id, recorded_at DESC);
CREATE INDEX idx_iot_telemetry_org_time ON iot_telemetry_points(organization_id, recorded_at DESC);

CREATE TABLE geofence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(30) NOT NULL,
    polygon_json TEXT,
    radius_meters DOUBLE PRECISION,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_geofence_org ON geofence_zones(organization_id);
CREATE INDEX idx_geofence_project ON geofence_zones(project_id);
CREATE INDEX idx_geofence_type ON geofence_zones(zone_type);
CREATE INDEX idx_geofence_active ON geofence_zones(organization_id, is_active) WHERE deleted = false;

CREATE TABLE geofence_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES iot_equipment_devices(id),
    zone_id UUID NOT NULL REFERENCES geofence_zones(id),
    alert_type VARCHAR(30) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_geofence_alert_org ON geofence_alerts(organization_id);
CREATE INDEX idx_geofence_alert_device ON geofence_alerts(device_id);
CREATE INDEX idx_geofence_alert_zone ON geofence_alerts(zone_id);
CREATE INDEX idx_geofence_alert_type ON geofence_alerts(alert_type);
CREATE INDEX idx_geofence_alert_unack ON geofence_alerts(organization_id, acknowledged) WHERE deleted = false AND acknowledged = false;
CREATE INDEX idx_geofence_alert_triggered ON geofence_alerts(organization_id, triggered_at DESC);
