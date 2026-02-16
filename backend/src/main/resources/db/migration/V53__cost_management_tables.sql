-- =============================================================================
-- Cost Management + Earned Value Management (EVM) Module
-- =============================================================================

-- =============================================================================
-- Sequences for auto-numbering
-- =============================================================================
CREATE SEQUENCE commitment_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Cost Codes (Коды затрат)
-- =============================================================================
CREATE TABLE cost_codes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    parent_id           UUID REFERENCES cost_codes(id),
    level               VARCHAR(20) NOT NULL DEFAULT 'LEVEL1',
    budget_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_cost_code_project UNIQUE (project_id, code),
    CONSTRAINT chk_cost_code_level CHECK (level IN ('LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4')),
    CONSTRAINT chk_cost_code_budget CHECK (budget_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_cost_code_project ON cost_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_code_parent ON cost_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_code_level ON cost_codes(level);
CREATE INDEX IF NOT EXISTS idx_cost_code_active ON cost_codes(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_cost_codes_updated_at
    BEFORE UPDATE ON cost_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Commitments (Обязательства)
-- =============================================================================
CREATE TABLE commitments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    number                  VARCHAR(50),
    title                   VARCHAR(500) NOT NULL,
    commitment_type         VARCHAR(30) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    vendor_id               UUID,
    contract_id             UUID,
    original_amount         NUMERIC(18, 2) NOT NULL,
    revised_amount          NUMERIC(18, 2),
    approved_change_orders  NUMERIC(18, 2) NOT NULL DEFAULT 0,
    invoiced_amount         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    paid_amount             NUMERIC(18, 2) NOT NULL DEFAULT 0,
    retention_percent       NUMERIC(5, 2) NOT NULL DEFAULT 0,
    start_date              DATE,
    end_date                DATE,
    cost_code_id            UUID REFERENCES cost_codes(id),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_commitment_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_commitment_type CHECK (commitment_type IN ('PURCHASE_ORDER', 'SUBCONTRACT', 'PROFESSIONAL_SERVICE')),
    CONSTRAINT chk_commitment_status CHECK (status IN ('DRAFT', 'ISSUED', 'APPROVED', 'CLOSED', 'VOID')),
    CONSTRAINT chk_commitment_original_amount CHECK (original_amount >= 0),
    CONSTRAINT chk_commitment_invoiced CHECK (invoiced_amount >= 0),
    CONSTRAINT chk_commitment_paid CHECK (paid_amount >= 0),
    CONSTRAINT chk_commitment_retention CHECK (retention_percent >= 0 AND retention_percent <= 100),
    CONSTRAINT chk_commitment_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_commitment_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_commitment_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitment_type ON commitments(commitment_type);
CREATE INDEX IF NOT EXISTS idx_commitment_vendor ON commitments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commitment_contract ON commitments(contract_id);
CREATE INDEX IF NOT EXISTS idx_commitment_cost_code ON commitments(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_commitment_number ON commitments(number);
CREATE INDEX IF NOT EXISTS idx_commitment_active ON commitments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_commitments_updated_at
    BEFORE UPDATE ON commitments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Commitment Items (Позиции обязательств)
-- =============================================================================
CREATE TABLE commitment_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_id       UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
    description         VARCHAR(500) NOT NULL,
    cost_code_id        UUID REFERENCES cost_codes(id),
    quantity            NUMERIC(16, 3),
    unit                VARCHAR(50),
    unit_price          NUMERIC(18, 2),
    total_price         NUMERIC(18, 2),
    invoiced_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    sort_order          INTEGER,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_commitment_item_invoiced CHECK (invoiced_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_commitment_item_commitment ON commitment_items(commitment_id);
CREATE INDEX IF NOT EXISTS idx_commitment_item_cost_code ON commitment_items(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_commitment_item_active ON commitment_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_commitment_items_updated_at
    BEFORE UPDATE ON commitment_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Cost Forecasts / EVM (Прогноз затрат / Управление освоенным объёмом)
-- =============================================================================
CREATE TABLE cost_forecasts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id                  UUID NOT NULL,
    forecast_date               DATE NOT NULL,
    forecast_method             VARCHAR(20),
    budget_at_completion        NUMERIC(18, 2),
    earned_value                NUMERIC(18, 2),
    planned_value               NUMERIC(18, 2),
    actual_cost                 NUMERIC(18, 2),
    estimate_at_completion      NUMERIC(18, 2),
    estimate_to_complete        NUMERIC(18, 2),
    variance_at_completion      NUMERIC(18, 2),
    cost_performance_index      NUMERIC(10, 4),
    schedule_performance_index  NUMERIC(10, 4),
    cost_variance               NUMERIC(18, 2),
    schedule_variance           NUMERIC(18, 2),
    percent_complete            NUMERIC(5, 2),
    notes                       TEXT,
    created_by_id               UUID,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_forecast_method CHECK (forecast_method IS NULL OR forecast_method IN ('MANUAL', 'EARNED_VALUE', 'TREND', 'REGRESSION')),
    CONSTRAINT chk_forecast_percent CHECK (percent_complete IS NULL OR (percent_complete >= 0 AND percent_complete <= 100))
);

CREATE INDEX IF NOT EXISTS idx_cost_forecast_project ON cost_forecasts(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_forecast_date ON cost_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_cost_forecast_method ON cost_forecasts(forecast_method);
CREATE INDEX IF NOT EXISTS idx_cost_forecast_active ON cost_forecasts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_cost_forecasts_updated_at
    BEFORE UPDATE ON cost_forecasts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Cash Flow Projections (Проекции денежных потоков)
-- =============================================================================
CREATE TABLE cash_flow_projections (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    period_start            DATE NOT NULL,
    period_end              DATE NOT NULL,
    planned_income          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    planned_expense         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_income           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_expense          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    forecast_income         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    forecast_expense        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    cumulative_planned_net  NUMERIC(18, 2),
    cumulative_actual_net   NUMERIC(18, 2),
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cfp_planned_income CHECK (planned_income >= 0),
    CONSTRAINT chk_cfp_planned_expense CHECK (planned_expense >= 0),
    CONSTRAINT chk_cfp_actual_income CHECK (actual_income >= 0),
    CONSTRAINT chk_cfp_actual_expense CHECK (actual_expense >= 0),
    CONSTRAINT chk_cfp_forecast_income CHECK (forecast_income >= 0),
    CONSTRAINT chk_cfp_forecast_expense CHECK (forecast_expense >= 0),
    CONSTRAINT chk_cfp_period CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_cfp_project ON cash_flow_projections(project_id);
CREATE INDEX IF NOT EXISTS idx_cfp_period_start ON cash_flow_projections(period_start);
CREATE INDEX IF NOT EXISTS idx_cfp_period_end ON cash_flow_projections(period_end);
CREATE INDEX IF NOT EXISTS idx_cfp_active ON cash_flow_projections(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_cash_flow_projections_updated_at
    BEFORE UPDATE ON cash_flow_projections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Budget Lines (Строки бюджета)
-- =============================================================================
CREATE TABLE budget_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    cost_code_id        UUID NOT NULL REFERENCES cost_codes(id),
    description         VARCHAR(500),
    original_budget     NUMERIC(18, 2) NOT NULL,
    approved_changes    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    revised_budget      NUMERIC(18, 2),
    committed_cost      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_cost         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    forecast_final_cost NUMERIC(18, 2),
    variance_amount     NUMERIC(18, 2),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_bl_original_budget CHECK (original_budget >= 0),
    CONSTRAINT chk_bl_committed CHECK (committed_cost >= 0),
    CONSTRAINT chk_bl_actual CHECK (actual_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_budget_line_project ON budget_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_cost_code ON budget_lines(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_active ON budget_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_budget_lines_updated_at
    BEFORE UPDATE ON budget_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
