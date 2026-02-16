-- =============================================================================
-- Sequence for vehicle codes (VEH-00001, VEH-00002, etc.)
-- =============================================================================
CREATE SEQUENCE vehicle_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Vehicles table
-- =============================================================================
CREATE TABLE vehicles (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                        VARCHAR(20) NOT NULL UNIQUE,
    license_plate               VARCHAR(20),
    make                        VARCHAR(100),
    model                       VARCHAR(100),
    year                        INTEGER,
    vin                         VARCHAR(50),
    vehicle_type                VARCHAR(30) NOT NULL,
    status                      VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    current_project_id          UUID REFERENCES projects(id),
    current_location_id         UUID,
    responsible_id              UUID REFERENCES users(id),
    purchase_date               DATE,
    purchase_price              NUMERIC(18, 2),
    current_value               NUMERIC(18, 2),
    depreciation_rate           NUMERIC(5, 2),
    fuel_type                   VARCHAR(20),
    fuel_consumption_rate       NUMERIC(8, 2),
    current_mileage             NUMERIC(12, 2),
    current_hours               NUMERIC(12, 2),
    insurance_expiry_date       DATE,
    tech_inspection_expiry_date DATE,
    notes                       TEXT,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_vehicle_type CHECK (vehicle_type IN (
        'EXCAVATOR', 'BULLDOZER', 'CRANE', 'TRUCK', 'CONCRETE_MIXER',
        'LOADER', 'ROLLER', 'GENERATOR', 'COMPRESSOR', 'WELDING',
        'CAR', 'BUS', 'OTHER'
    )),
    CONSTRAINT chk_vehicle_status CHECK (status IN (
        'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'DECOMMISSIONED'
    )),
    CONSTRAINT chk_vehicle_fuel_type CHECK (fuel_type IS NULL OR fuel_type IN (
        'DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID', 'GAS'
    )),
    CONSTRAINT chk_vehicle_year CHECK (year IS NULL OR (year >= 1900 AND year <= 2100)),
    CONSTRAINT chk_vehicle_purchase_price CHECK (purchase_price IS NULL OR purchase_price >= 0),
    CONSTRAINT chk_vehicle_current_value CHECK (current_value IS NULL OR current_value >= 0),
    CONSTRAINT chk_vehicle_mileage CHECK (current_mileage IS NULL OR current_mileage >= 0),
    CONSTRAINT chk_vehicle_hours CHECK (current_hours IS NULL OR current_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_code ON vehicles(code);
CREATE INDEX IF NOT EXISTS idx_vehicle_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_project ON vehicles(current_project_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_responsible ON vehicles(responsible_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_expiry ON vehicles(insurance_expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_tech_inspection_expiry ON vehicles(tech_inspection_expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_active ON vehicles(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Vehicle assignments table
-- =============================================================================
CREATE TABLE vehicle_assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id),
    project_id          UUID NOT NULL REFERENCES projects(id),
    assigned_by_id      UUID REFERENCES users(id),
    operator_id         UUID REFERENCES users(id),
    start_date          DATE NOT NULL,
    end_date            DATE,
    actual_return_date  DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    daily_rate          NUMERIC(12, 2),
    total_cost          NUMERIC(18, 2),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_assignment_status CHECK (status IN (
        'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    )),
    CONSTRAINT chk_assignment_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_assignment_daily_rate CHECK (daily_rate IS NULL OR daily_rate >= 0),
    CONSTRAINT chk_assignment_total_cost CHECK (total_cost IS NULL OR total_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_assignment_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assignment_project ON vehicle_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignment_operator ON vehicle_assignments(operator_id);
CREATE INDEX IF NOT EXISTS idx_assignment_status ON vehicle_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignment_dates ON vehicle_assignments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_assignment_active ON vehicle_assignments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_vehicle_assignments_updated_at
    BEFORE UPDATE ON vehicle_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Maintenance records table
-- =============================================================================
CREATE TABLE maintenance_records (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id              UUID NOT NULL REFERENCES vehicles(id),
    maintenance_type        VARCHAR(30) NOT NULL,
    description             TEXT,
    start_date              DATE NOT NULL,
    end_date                DATE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    cost                    NUMERIC(18, 2),
    performed_by_id         UUID REFERENCES users(id),
    vendor                  VARCHAR(300),
    mileage_at_service      NUMERIC(12, 2),
    hours_at_service        NUMERIC(12, 2),
    next_service_mileage    NUMERIC(12, 2),
    next_service_hours      NUMERIC(12, 2),
    next_service_date       DATE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_maintenance_type CHECK (maintenance_type IN (
        'SCHEDULED', 'UNSCHEDULED', 'REPAIR', 'INSPECTION'
    )),
    CONSTRAINT chk_maintenance_status CHECK (status IN (
        'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    CONSTRAINT chk_maintenance_cost CHECK (cost IS NULL OR cost >= 0),
    CONSTRAINT chk_maintenance_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_records(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_dates ON maintenance_records(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_date ON maintenance_records(next_service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_active ON maintenance_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_maintenance_records_updated_at
    BEFORE UPDATE ON maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Fuel records table
-- =============================================================================
CREATE TABLE fuel_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id),
    operator_id         UUID REFERENCES users(id),
    project_id          UUID REFERENCES projects(id),
    fuel_date           DATE NOT NULL,
    quantity            NUMERIC(10, 2) NOT NULL,
    price_per_unit      NUMERIC(10, 2) NOT NULL,
    total_cost          NUMERIC(18, 2) NOT NULL,
    mileage_at_fuel     NUMERIC(12, 2),
    hours_at_fuel       NUMERIC(12, 2),
    fuel_station        VARCHAR(300),
    receipt_number      VARCHAR(100),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_fuel_quantity CHECK (quantity > 0),
    CONSTRAINT chk_fuel_price CHECK (price_per_unit >= 0),
    CONSTRAINT chk_fuel_total_cost CHECK (total_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_operator ON fuel_records(operator_id);
CREATE INDEX IF NOT EXISTS idx_fuel_project ON fuel_records(project_id);
CREATE INDEX IF NOT EXISTS idx_fuel_date ON fuel_records(fuel_date);
CREATE INDEX IF NOT EXISTS idx_fuel_active ON fuel_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_fuel_records_updated_at
    BEFORE UPDATE ON fuel_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Equipment inspections table
-- =============================================================================
CREATE TABLE equipment_inspections (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id              UUID NOT NULL REFERENCES vehicles(id),
    inspector_id            UUID REFERENCES users(id),
    inspection_date         DATE NOT NULL,
    inspection_type         VARCHAR(20) NOT NULL,
    overall_rating          VARCHAR(20) NOT NULL,
    findings                TEXT,
    recommendations         TEXT,
    next_inspection_date    DATE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_inspection_type CHECK (inspection_type IN (
        'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'
    )),
    CONSTRAINT chk_inspection_rating CHECK (overall_rating IN (
        'PASS', 'CONDITIONAL', 'FAIL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_inspection_vehicle ON equipment_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspection_inspector ON equipment_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspection_date ON equipment_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspection_type ON equipment_inspections(inspection_type);
CREATE INDEX IF NOT EXISTS idx_inspection_next_date ON equipment_inspections(next_inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspection_active ON equipment_inspections(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_equipment_inspections_updated_at
    BEFORE UPDATE ON equipment_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
