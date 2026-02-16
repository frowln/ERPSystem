-- =============================================================================
-- Revenue Recognition Module (ПБУ 2/2008 -> ФСБУ 9/2025)
-- Revenue contracts, recognition periods, completion percentages, adjustments
-- Multi-company enforcement via organization_id
-- =============================================================================

-- =============================================================================
-- Revenue Contracts (Договоры для признания выручки)
-- =============================================================================
CREATE TABLE revenue_contracts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    contract_id             UUID REFERENCES contracts(id),
    contract_name           VARCHAR(500),
    recognition_method      VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE_OF_COMPLETION',
    recognition_standard    VARCHAR(20) NOT NULL DEFAULT 'PBU_2_2008',
    total_contract_revenue  NUMERIC(18,2) NOT NULL,
    total_estimated_cost    NUMERIC(18,2) NOT NULL,
    organization_id         UUID NOT NULL,
    start_date              DATE,
    end_date                DATE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_rev_contract_method CHECK (recognition_method IN (
        'PERCENTAGE_OF_COMPLETION', 'INPUT_METHOD', 'OUTPUT_METHOD', 'MILESTONE'
    )),
    CONSTRAINT chk_rev_contract_standard CHECK (recognition_standard IN (
        'PBU_2_2008', 'FSBU_9_2025'
    )),
    CONSTRAINT chk_rev_contract_revenue_positive CHECK (total_contract_revenue >= 0),
    CONSTRAINT chk_rev_contract_cost_positive CHECK (total_estimated_cost > 0)
);

CREATE INDEX IF NOT EXISTS idx_rev_contract_project ON revenue_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_rev_contract_contract ON revenue_contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_rev_contract_org ON revenue_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_rev_contract_active ON revenue_contracts(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_rev_contract_method ON revenue_contracts(recognition_method);
CREATE INDEX IF NOT EXISTS idx_rev_contract_standard ON revenue_contracts(recognition_standard);

CREATE TRIGGER update_revenue_contracts_updated_at
    BEFORE UPDATE ON revenue_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Revenue Recognition Periods (Периоды признания выручки)
-- =============================================================================
CREATE TABLE revenue_recognition_periods (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revenue_contract_id             UUID NOT NULL REFERENCES revenue_contracts(id),
    period_start                    DATE NOT NULL,
    period_end                      DATE NOT NULL,
    status                          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    cumulative_cost_incurred        NUMERIC(18,2),
    cumulative_revenue_recognized   NUMERIC(18,2),
    period_cost_incurred            NUMERIC(18,2),
    period_revenue_recognized       NUMERIC(18,2),
    percent_complete                NUMERIC(7,4),
    estimate_cost_to_complete       NUMERIC(18,2),
    expected_profit                 NUMERIC(18,2),
    expected_loss                   NUMERIC(18,2),
    adjustment_amount               NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes                           TEXT,
    calculated_by_id                UUID,
    reviewed_by_id                  UUID,
    posted_by_id                    UUID,
    posted_at                       TIMESTAMP WITH TIME ZONE,
    deleted                         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                      VARCHAR(255),
    updated_by                      VARCHAR(255),
    version                         BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_rev_period_status CHECK (status IN (
        'OPEN', 'CALCULATED', 'REVIEWED', 'POSTED', 'CLOSED'
    )),
    CONSTRAINT chk_rev_period_dates CHECK (period_end >= period_start),
    CONSTRAINT chk_rev_period_percent CHECK (percent_complete IS NULL OR (percent_complete >= 0 AND percent_complete <= 100))
);

CREATE INDEX IF NOT EXISTS idx_rev_period_contract ON revenue_recognition_periods(revenue_contract_id);
CREATE INDEX IF NOT EXISTS idx_rev_period_status ON revenue_recognition_periods(status);
CREATE INDEX IF NOT EXISTS idx_rev_period_dates ON revenue_recognition_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_rev_period_active ON revenue_recognition_periods(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_revenue_recognition_periods_updated_at
    BEFORE UPDATE ON revenue_recognition_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Completion Percentages (Проценты завершения)
-- =============================================================================
CREATE TABLE completion_percentages (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revenue_contract_id     UUID NOT NULL REFERENCES revenue_contracts(id),
    calculation_date        DATE NOT NULL,
    method                  VARCHAR(30),
    cumulative_cost_incurred NUMERIC(18,2),
    total_estimated_cost    NUMERIC(18,2),
    percent_complete        NUMERIC(7,4),
    physical_percent_complete NUMERIC(7,4),
    notes                   TEXT,
    calculated_by_id        UUID,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_compl_pct_method CHECK (method IS NULL OR method IN (
        'PERCENTAGE_OF_COMPLETION', 'INPUT_METHOD', 'OUTPUT_METHOD', 'MILESTONE'
    )),
    CONSTRAINT chk_compl_pct_percent CHECK (percent_complete IS NULL OR (percent_complete >= 0 AND percent_complete <= 100)),
    CONSTRAINT chk_compl_pct_physical CHECK (physical_percent_complete IS NULL OR (physical_percent_complete >= 0 AND physical_percent_complete <= 100))
);

CREATE INDEX IF NOT EXISTS idx_compl_pct_contract ON completion_percentages(revenue_contract_id);
CREATE INDEX IF NOT EXISTS idx_compl_pct_date ON completion_percentages(calculation_date);
CREATE INDEX IF NOT EXISTS idx_compl_pct_active ON completion_percentages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_completion_percentages_updated_at
    BEFORE UPDATE ON completion_percentages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Revenue Adjustments (Корректировки выручки)
-- =============================================================================
CREATE TABLE revenue_adjustments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recognition_period_id   UUID NOT NULL REFERENCES revenue_recognition_periods(id),
    adjustment_type         VARCHAR(30) NOT NULL,
    amount                  NUMERIC(18,2) NOT NULL,
    reason                  TEXT NOT NULL,
    previous_value          NUMERIC(18,2),
    new_value               NUMERIC(18,2),
    approved_by_id          UUID,
    approved_at             TIMESTAMP WITH TIME ZONE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_rev_adj_type CHECK (adjustment_type IN (
        'COST_REVISION', 'REVENUE_REVISION', 'LOSS_PROVISION'
    ))
);

CREATE INDEX IF NOT EXISTS idx_rev_adj_period ON revenue_adjustments(recognition_period_id);
CREATE INDEX IF NOT EXISTS idx_rev_adj_type ON revenue_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_rev_adj_active ON revenue_adjustments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_revenue_adjustments_updated_at
    BEFORE UPDATE ON revenue_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
