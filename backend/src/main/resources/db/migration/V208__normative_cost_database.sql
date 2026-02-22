-- Prerequisites for normative DB module (may be absent in legacy installs)
CREATE TABLE IF NOT EXISTS pricing_databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    name VARCHAR(500) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS price_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    database_id UUID REFERENCES pricing_databases(id),
    section_id UUID,
    code VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    unit VARCHAR(50),
    base_price NUMERIC(15,2),
    labor_cost NUMERIC(15,2),
    material_cost NUMERIC(15,2),
    machine_cost NUMERIC(15,2),
    overhead_cost NUMERIC(15,2),
    profit_cost NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_pr_db ON price_rates(database_id);
CREATE INDEX IF NOT EXISTS idx_pr_code ON price_rates(code);

-- Normative sections (hierarchical tree)
CREATE TABLE IF NOT EXISTS normative_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    database_id UUID NOT NULL REFERENCES pricing_databases(id),
    parent_id UUID REFERENCES normative_sections(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(500) NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ns_database ON normative_sections(database_id);
CREATE INDEX IF NOT EXISTS idx_ns_parent ON normative_sections(parent_id);
CREATE INDEX IF NOT EXISTS idx_ns_code ON normative_sections(code);

-- Rate resource decomposition (material/labor/machine requirements per rate)
CREATE TABLE IF NOT EXISTS rate_resource_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_id UUID NOT NULL REFERENCES price_rates(id),
    resource_type VARCHAR(20) NOT NULL,
    resource_code VARCHAR(100),
    resource_name VARCHAR(500) NOT NULL,
    unit VARCHAR(50),
    quantity_per_unit NUMERIC(15,6) NOT NULL DEFAULT 0,
    base_price NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_rri_rate ON rate_resource_items(rate_id);
CREATE INDEX IF NOT EXISTS idx_rri_type ON rate_resource_items(resource_type);

-- Local estimates
CREATE TABLE IF NOT EXISTS local_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    contract_id UUID,
    name VARCHAR(500) NOT NULL,
    number VARCHAR(100),
    object_name VARCHAR(500),
    calculation_method VARCHAR(20) NOT NULL DEFAULT 'RIM',
    region VARCHAR(255),
    base_year INTEGER,
    price_level_quarter VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_direct_cost NUMERIC(15,2),
    total_overhead NUMERIC(15,2),
    total_estimated_profit NUMERIC(15,2),
    total_with_vat NUMERIC(15,2),
    vat_rate NUMERIC(5,2) DEFAULT 20.00,
    notes TEXT,
    calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_le_org ON local_estimates(organization_id);
CREATE INDEX IF NOT EXISTS idx_le_project ON local_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_le_status ON local_estimates(status);

-- Local estimate lines
CREATE TABLE IF NOT EXISTS local_estimate_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES local_estimates(id),
    line_number INTEGER NOT NULL,
    rate_id UUID REFERENCES price_rates(id),
    justification VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    unit VARCHAR(50),
    quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
    base_labor_cost NUMERIC(15,2) DEFAULT 0,
    base_material_cost NUMERIC(15,2) DEFAULT 0,
    base_equipment_cost NUMERIC(15,2) DEFAULT 0,
    base_overhead_cost NUMERIC(15,2) DEFAULT 0,
    base_total NUMERIC(15,2) DEFAULT 0,
    current_labor_cost NUMERIC(15,2) DEFAULT 0,
    current_material_cost NUMERIC(15,2) DEFAULT 0,
    current_equipment_cost NUMERIC(15,2) DEFAULT 0,
    current_overhead_cost NUMERIC(15,2) DEFAULT 0,
    current_total NUMERIC(15,2) DEFAULT 0,
    labor_index NUMERIC(10,4) DEFAULT 1,
    material_index NUMERIC(10,4) DEFAULT 1,
    equipment_index NUMERIC(10,4) DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_lel_estimate ON local_estimate_lines(estimate_id);
CREATE INDEX IF NOT EXISTS idx_lel_rate ON local_estimate_lines(rate_id);

-- Minstroy quarterly index imports
CREATE TABLE IF NOT EXISTS minstroy_index_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quarter VARCHAR(20) NOT NULL,
    import_source VARCHAR(255),
    import_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    indices_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);
