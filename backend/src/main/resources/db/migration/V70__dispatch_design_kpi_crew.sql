-- =============================================================================
-- V70: Dispatch, Design, KPI Bonuses, Crew Time tables
-- =============================================================================

-- =============================================================================
-- Dispatch Orders
-- =============================================================================
CREATE TABLE IF NOT EXISTS dispatch_orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number            VARCHAR(50) NOT NULL UNIQUE,
    project_id              UUID NOT NULL REFERENCES projects(id),
    vehicle_id              UUID REFERENCES vehicles(id),
    driver_id               UUID REFERENCES users(id),
    loading_point           VARCHAR(500),
    unloading_point         VARCHAR(500),
    material_name           VARCHAR(300),
    quantity                NUMERIC(12, 3),
    unit                    VARCHAR(30),
    scheduled_date          DATE,
    scheduled_time          VARCHAR(10),
    actual_departure_at     TIMESTAMP,
    actual_arrival_at       TIMESTAMP,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    distance                NUMERIC(10, 2),
    fuel_used               NUMERIC(10, 2),
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dispatch_status CHECK (status IN (
        'PLANNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    )),
    CONSTRAINT chk_dispatch_quantity CHECK (quantity IS NULL OR quantity >= 0),
    CONSTRAINT chk_dispatch_distance CHECK (distance IS NULL OR distance >= 0),
    CONSTRAINT chk_dispatch_fuel CHECK (fuel_used IS NULL OR fuel_used >= 0)
);

-- Compatibility with older schema from V38 (dispatch_orders had `code` but no `order_number`)
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES users(id);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS loading_point VARCHAR(500);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS unloading_point VARCHAR(500);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS material_name VARCHAR(300);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS quantity NUMERIC(12, 3);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS unit VARCHAR(30);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(10);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS actual_departure_at TIMESTAMP;
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS actual_arrival_at TIMESTAMP;
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS distance NUMERIC(10, 2);
ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS fuel_used NUMERIC(10, 2);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dispatch_orders'
          AND column_name = 'code'
    ) THEN
        EXECUTE 'UPDATE dispatch_orders
                 SET order_number = COALESCE(order_number, code)
                 WHERE order_number IS NULL';
    END IF;

    EXECUTE 'UPDATE dispatch_orders
             SET order_number = ''DO-'' || left(id::text, 8)
             WHERE order_number IS NULL';

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_dispatch_order_number'
    ) THEN
        ALTER TABLE dispatch_orders
            ADD CONSTRAINT uq_dispatch_order_number UNIQUE (order_number);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispatch_order_number ON dispatch_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_dispatch_project ON dispatch_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_vehicle ON dispatch_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_driver ON dispatch_orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_status ON dispatch_orders(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_scheduled_date ON dispatch_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_active ON dispatch_orders(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_dispatch_orders_updated_at ON dispatch_orders;
CREATE TRIGGER update_dispatch_orders_updated_at
    BEFORE UPDATE ON dispatch_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Dispatch Routes
-- =============================================================================
CREATE TABLE IF NOT EXISTS dispatch_routes (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(300) NOT NULL,
    from_location               VARCHAR(500) NOT NULL,
    to_location                 VARCHAR(500) NOT NULL,
    distance_km                 NUMERIC(10, 2),
    estimated_duration_minutes  INTEGER,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_route_distance CHECK (distance_km IS NULL OR distance_km >= 0),
    CONSTRAINT chk_route_duration CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_route_name ON dispatch_routes(name);
CREATE INDEX IF NOT EXISTS idx_dispatch_route_active ON dispatch_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_dispatch_route_not_deleted ON dispatch_routes(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_dispatch_routes_updated_at ON dispatch_routes;
CREATE TRIGGER update_dispatch_routes_updated_at
    BEFORE UPDATE ON dispatch_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Design Versions
-- =============================================================================
CREATE TABLE IF NOT EXISTS design_versions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    document_id         UUID,
    version_number      VARCHAR(50) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    discipline          VARCHAR(100),
    author              VARCHAR(255),
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    review_deadline     DATE,
    file_url            VARCHAR(1000),
    file_size           BIGINT,
    change_description  TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dv_status CHECK (status IN (
        'DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED', 'ARCHIVED'
    )),
    CONSTRAINT chk_dv_file_size CHECK (file_size IS NULL OR file_size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_dv_project ON design_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_dv_document ON design_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_dv_status ON design_versions(status);
CREATE INDEX IF NOT EXISTS idx_dv_discipline ON design_versions(discipline);
CREATE INDEX IF NOT EXISTS idx_dv_active ON design_versions(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_design_versions_updated_at ON design_versions;
CREATE TRIGGER update_design_versions_updated_at
    BEFORE UPDATE ON design_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Design Reviews
-- =============================================================================
CREATE TABLE IF NOT EXISTS design_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_version_id   UUID NOT NULL REFERENCES design_versions(id),
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewer_name       VARCHAR(255),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    comments            TEXT,
    reviewed_at         TIMESTAMP,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dr_status CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_dr_design_version ON design_reviews(design_version_id);
CREATE INDEX IF NOT EXISTS idx_dr_reviewer ON design_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_dr_status ON design_reviews(status);
CREATE INDEX IF NOT EXISTS idx_dr_active ON design_reviews(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_design_reviews_updated_at ON design_reviews;
CREATE TRIGGER update_design_reviews_updated_at
    BEFORE UPDATE ON design_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Design Sections
-- =============================================================================
CREATE TABLE IF NOT EXISTS design_sections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    name            VARCHAR(300) NOT NULL,
    code            VARCHAR(50) NOT NULL,
    discipline      VARCHAR(100),
    parent_id       UUID REFERENCES design_sections(id),
    sequence        INTEGER NOT NULL DEFAULT 0,
    description     TEXT,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ds_project ON design_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_ds_code ON design_sections(code);
CREATE INDEX IF NOT EXISTS idx_ds_parent ON design_sections(parent_id);
CREATE INDEX IF NOT EXISTS idx_ds_discipline ON design_sections(discipline);
CREATE INDEX IF NOT EXISTS idx_ds_active ON design_sections(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_design_sections_updated_at ON design_sections;
CREATE TRIGGER update_design_sections_updated_at
    BEFORE UPDATE ON design_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KPI Achievements
-- =============================================================================
CREATE TABLE IF NOT EXISTS kpi_achievements (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id             UUID NOT NULL REFERENCES users(id),
    kpi_id                  UUID NOT NULL REFERENCES kpi_definitions(id),
    period                  VARCHAR(20) NOT NULL,
    target_value            NUMERIC(18, 4),
    actual_value            NUMERIC(18, 4),
    achievement_percent     NUMERIC(8, 2),
    score                   NUMERIC(8, 2),
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_kpi_ach_percent CHECK (achievement_percent IS NULL OR achievement_percent >= 0)
);

CREATE INDEX IF NOT EXISTS idx_kpi_ach_employee ON kpi_achievements(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpi_ach_kpi ON kpi_achievements(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_ach_period ON kpi_achievements(period);
CREATE INDEX IF NOT EXISTS idx_kpi_ach_active ON kpi_achievements(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_kpi_achievements_updated_at ON kpi_achievements;
CREATE TRIGGER update_kpi_achievements_updated_at
    BEFORE UPDATE ON kpi_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Bonus Calculations
-- =============================================================================
CREATE TABLE IF NOT EXISTS bonus_calculations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES users(id),
    employee_name       VARCHAR(300),
    period              VARCHAR(20) NOT NULL,
    base_bonus          NUMERIC(18, 2),
    kpi_multiplier      NUMERIC(8, 4),
    final_bonus         NUMERIC(18, 2),
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by_id      UUID REFERENCES users(id),
    approved_at         TIMESTAMP,
    paid_at             TIMESTAMP,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_bonus_status CHECK (status IN (
        'DRAFT', 'CALCULATED', 'APPROVED', 'PAID'
    )),
    CONSTRAINT chk_bonus_base CHECK (base_bonus IS NULL OR base_bonus >= 0),
    CONSTRAINT chk_bonus_final CHECK (final_bonus IS NULL OR final_bonus >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bonus_employee ON bonus_calculations(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonus_period ON bonus_calculations(period);
CREATE INDEX IF NOT EXISTS idx_bonus_status ON bonus_calculations(status);
CREATE INDEX IF NOT EXISTS idx_bonus_active ON bonus_calculations(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_bonus_calculations_updated_at ON bonus_calculations;
CREATE TRIGGER update_bonus_calculations_updated_at
    BEFORE UPDATE ON bonus_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Crew Time Entries
-- =============================================================================
CREATE TABLE IF NOT EXISTS crew_time_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_id             UUID NOT NULL,
    employee_id         UUID NOT NULL REFERENCES users(id),
    project_id          UUID NOT NULL REFERENCES projects(id),
    work_date           DATE NOT NULL,
    hours_worked        NUMERIC(5, 2) NOT NULL,
    overtime_hours      NUMERIC(5, 2) DEFAULT 0,
    activity_type       VARCHAR(100),
    notes               VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cte_hours CHECK (hours_worked >= 0),
    CONSTRAINT chk_cte_overtime CHECK (overtime_hours IS NULL OR overtime_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_cte_crew ON crew_time_entries(crew_id);
CREATE INDEX IF NOT EXISTS idx_cte_employee ON crew_time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_cte_project ON crew_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_cte_work_date ON crew_time_entries(work_date);
CREATE INDEX IF NOT EXISTS idx_cte_active ON crew_time_entries(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_crew_time_entries_updated_at ON crew_time_entries;
CREATE TRIGGER update_crew_time_entries_updated_at
    BEFORE UPDATE ON crew_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Crew Time Sheets
-- =============================================================================
CREATE TABLE IF NOT EXISTS crew_time_sheets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_id             UUID NOT NULL,
    project_id          UUID NOT NULL REFERENCES projects(id),
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    total_hours         NUMERIC(10, 2) DEFAULT 0,
    total_overtime      NUMERIC(10, 2) DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by_id      UUID REFERENCES users(id),
    approved_at         TIMESTAMP,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cts_status CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
    )),
    CONSTRAINT chk_cts_period CHECK (period_end >= period_start),
    CONSTRAINT chk_cts_hours CHECK (total_hours IS NULL OR total_hours >= 0),
    CONSTRAINT chk_cts_overtime CHECK (total_overtime IS NULL OR total_overtime >= 0)
);

CREATE INDEX IF NOT EXISTS idx_cts_crew ON crew_time_sheets(crew_id);
CREATE INDEX IF NOT EXISTS idx_cts_project ON crew_time_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_cts_status ON crew_time_sheets(status);
CREATE INDEX IF NOT EXISTS idx_cts_period ON crew_time_sheets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cts_active ON crew_time_sheets(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_crew_time_sheets_updated_at ON crew_time_sheets;
CREATE TRIGGER update_crew_time_sheets_updated_at
    BEFORE UPDATE ON crew_time_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
