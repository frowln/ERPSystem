-- V130: Fleet waybills (путевые листы) per Prikaz Mintransa 390/159
CREATE TABLE IF NOT EXISTS fleet_waybills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    project_id      UUID,
    number          VARCHAR(50) NOT NULL,
    waybill_date    DATE NOT NULL,

    -- Driver
    driver_id       UUID,
    driver_name     VARCHAR(255),

    -- Route
    route_description TEXT,
    departure_point   VARCHAR(500),
    destination_point VARCHAR(500),

    -- Time
    departure_time  TIMESTAMP WITH TIME ZONE,
    return_time     TIMESTAMP WITH TIME ZONE,

    -- Mileage
    mileage_start   NUMERIC(12,2),
    mileage_end     NUMERIC(12,2),

    -- Engine hours
    engine_hours_start NUMERIC(12,2),
    engine_hours_end   NUMERIC(12,2),

    -- Fuel
    fuel_dispensed     NUMERIC(10,2),
    fuel_consumed      NUMERIC(10,2),
    fuel_norm          NUMERIC(10,2),
    fuel_remaining     NUMERIC(10,2),

    -- Pre-trip checks (Prikaz Mintransa 390)
    medical_exam_passed BOOLEAN DEFAULT FALSE,
    medical_exam_time   TIMESTAMP WITH TIME ZONE,
    medical_examiner    VARCHAR(255),
    mechanic_approved   BOOLEAN DEFAULT FALSE,
    mechanic_name       VARCHAR(255),
    mechanic_check_time TIMESTAMP WITH TIME ZONE,

    -- Status
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    -- Notes
    notes           TEXT,

    -- Audit
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by      UUID,
    updated_by      UUID,
    deleted         BOOLEAN DEFAULT FALSE,
    version         BIGINT DEFAULT 0
);

CREATE SEQUENCE IF NOT EXISTS fleet_waybill_number_seq START 1;

CREATE INDEX idx_fleet_waybill_org ON fleet_waybills(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_fleet_waybill_vehicle ON fleet_waybills(vehicle_id) WHERE deleted = FALSE;
CREATE INDEX idx_fleet_waybill_date ON fleet_waybills(waybill_date) WHERE deleted = FALSE;
CREATE INDEX idx_fleet_waybill_status ON fleet_waybills(status) WHERE deleted = FALSE;
CREATE INDEX idx_fleet_waybill_driver ON fleet_waybills(driver_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_fleet_waybill_number_org ON fleet_waybills(organization_id, number) WHERE deleted = FALSE;
