-- =============================================================================
-- Sequences for auto-generated numbers
-- =============================================================================
CREATE SEQUENCE stock_movement_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE inventory_check_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Warehouse locations table
-- =============================================================================
CREATE TABLE warehouse_locations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    code                VARCHAR(50) UNIQUE,
    location_type       VARCHAR(30),
    project_id          UUID REFERENCES projects(id),
    address             VARCHAR(1000),
    responsible_id      UUID REFERENCES users(id),
    responsible_name    VARCHAR(500),
    parent_id           UUID REFERENCES warehouse_locations(id),
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wh_location_type CHECK (location_type IS NULL OR location_type IN (
        'CENTRAL', 'PROJECT_SITE', 'TRANSIT', 'PARTNER'
    ))
);

CREATE INDEX IF NOT EXISTS idx_wh_location_type ON warehouse_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_wh_location_project ON warehouse_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_wh_location_code ON warehouse_locations(code);
CREATE INDEX IF NOT EXISTS idx_wh_location_parent ON warehouse_locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_wh_location_responsible ON warehouse_locations(responsible_id);
CREATE INDEX IF NOT EXISTS idx_wh_location_active ON warehouse_locations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_warehouse_locations_updated_at
    BEFORE UPDATE ON warehouse_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Materials table
-- =============================================================================
CREATE TABLE materials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    code                VARCHAR(100) UNIQUE,
    category            VARCHAR(30),
    unit_of_measure     VARCHAR(50) NOT NULL,
    description         TEXT,
    min_stock_level     NUMERIC(16, 3) DEFAULT 0,
    current_price       NUMERIC(18, 2) DEFAULT 0,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_material_category CHECK (category IS NULL OR category IN (
        'CONCRETE', 'METAL', 'WOOD', 'INSULATION', 'PIPES',
        'ELECTRICAL', 'FINISHING', 'FASTENERS', 'TOOLS', 'OTHER'
    )),
    CONSTRAINT chk_material_min_stock CHECK (min_stock_level IS NULL OR min_stock_level >= 0),
    CONSTRAINT chk_material_price CHECK (current_price IS NULL OR current_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_material_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_material_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_material_active ON materials(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_material_deleted ON materials(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Stock entries table (current inventory)
-- =============================================================================
CREATE TABLE stock_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id         UUID NOT NULL REFERENCES materials(id),
    material_name       VARCHAR(500),
    location_id         UUID NOT NULL REFERENCES warehouse_locations(id),
    quantity            NUMERIC(16, 3) NOT NULL DEFAULT 0,
    reserved_quantity   NUMERIC(16, 3) DEFAULT 0,
    available_quantity  NUMERIC(16, 3) DEFAULT 0,
    last_price_per_unit NUMERIC(18, 2),
    total_value         NUMERIC(18, 2) DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_stock_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_stock_reserved CHECK (reserved_quantity IS NULL OR reserved_quantity >= 0),
    CONSTRAINT chk_stock_price CHECK (last_price_per_unit IS NULL OR last_price_per_unit >= 0)
);

CREATE UNIQUE INDEX uq_stock_material_location ON stock_entries(material_id, location_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_stock_material ON stock_entries(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock_entries(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_deleted ON stock_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_stock_entries_updated_at
    BEFORE UPDATE ON stock_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Stock movements table
-- =============================================================================
CREATE TABLE stock_movements (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number                  VARCHAR(50) UNIQUE,
    movement_date           DATE NOT NULL,
    movement_type           VARCHAR(30) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    project_id              UUID REFERENCES projects(id),
    source_location_id      UUID REFERENCES warehouse_locations(id),
    destination_location_id UUID REFERENCES warehouse_locations(id),
    purchase_request_id     UUID,
    m29_id                  UUID,
    responsible_id          UUID REFERENCES users(id),
    responsible_name        VARCHAR(500),
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sm_type CHECK (movement_type IN (
        'RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'WRITE_OFF'
    )),
    CONSTRAINT chk_sm_status CHECK (status IN (
        'DRAFT', 'CONFIRMED', 'DONE', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_sm_number ON stock_movements(number);
CREATE INDEX IF NOT EXISTS idx_sm_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_sm_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_sm_status ON stock_movements(status);
CREATE INDEX IF NOT EXISTS idx_sm_project ON stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_sm_source_location ON stock_movements(source_location_id);
CREATE INDEX IF NOT EXISTS idx_sm_dest_location ON stock_movements(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_sm_purchase_request ON stock_movements(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_sm_m29 ON stock_movements(m29_id);
CREATE INDEX IF NOT EXISTS idx_sm_deleted ON stock_movements(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_stock_movements_updated_at
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Stock movement lines table
-- =============================================================================
CREATE TABLE stock_movement_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id         UUID NOT NULL REFERENCES stock_movements(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL REFERENCES materials(id),
    material_name       VARCHAR(500),
    sequence            INTEGER DEFAULT 0,
    quantity            NUMERIC(16, 3) NOT NULL,
    unit_price          NUMERIC(18, 2),
    total_price         NUMERIC(18, 2),
    unit_of_measure     VARCHAR(50),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sml_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sml_price CHECK (unit_price IS NULL OR unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sml_movement ON stock_movement_lines(movement_id);
CREATE INDEX IF NOT EXISTS idx_sml_material ON stock_movement_lines(material_id);

CREATE TRIGGER update_stock_movement_lines_updated_at
    BEFORE UPDATE ON stock_movement_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Inventory checks table
-- =============================================================================
CREATE TABLE inventory_checks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(50) UNIQUE,
    check_date          DATE NOT NULL,
    location_id         UUID NOT NULL REFERENCES warehouse_locations(id),
    project_id          UUID REFERENCES projects(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    responsible_id      UUID REFERENCES users(id),
    responsible_name    VARCHAR(500),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ic_status CHECK (status IN (
        'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_ic_date ON inventory_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_ic_location ON inventory_checks(location_id);
CREATE INDEX IF NOT EXISTS idx_ic_project ON inventory_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_ic_status ON inventory_checks(status);
CREATE INDEX IF NOT EXISTS idx_ic_name ON inventory_checks(name);
CREATE INDEX IF NOT EXISTS idx_ic_deleted ON inventory_checks(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_inventory_checks_updated_at
    BEFORE UPDATE ON inventory_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Inventory check lines table
-- =============================================================================
CREATE TABLE inventory_check_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id            UUID NOT NULL REFERENCES inventory_checks(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL REFERENCES materials(id),
    material_name       VARCHAR(500),
    expected_quantity   NUMERIC(16, 3),
    actual_quantity     NUMERIC(16, 3),
    variance            NUMERIC(16, 3),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_icl_check ON inventory_check_lines(check_id);
CREATE INDEX IF NOT EXISTS idx_icl_material ON inventory_check_lines(material_id);

CREATE TRIGGER update_inventory_check_lines_updated_at
    BEFORE UPDATE ON inventory_check_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
