-- P3-11: Profitability Forecasting tables

CREATE TABLE IF NOT EXISTS profitability_forecasts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    project_id      UUID        NOT NULL,
    project_name    VARCHAR(500),

    contract_amount         NUMERIC(18,2) NOT NULL DEFAULT 0,
    original_budget         NUMERIC(18,2) NOT NULL DEFAULT 0,
    revised_budget          NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_cost_to_date     NUMERIC(18,2) NOT NULL DEFAULT 0,
    earned_value_to_date    NUMERIC(18,2) NOT NULL DEFAULT 0,
    estimate_at_completion  NUMERIC(18,2) NOT NULL DEFAULT 0,
    estimate_to_complete    NUMERIC(18,2) NOT NULL DEFAULT 0,

    forecast_margin         NUMERIC(18,2) NOT NULL DEFAULT 0,
    forecast_margin_percent NUMERIC(8,4)  NOT NULL DEFAULT 0,
    original_margin         NUMERIC(18,2) NOT NULL DEFAULT 0,
    profit_fade_amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
    profit_fade_percent     NUMERIC(8,4)  NOT NULL DEFAULT 0,

    wip_amount              NUMERIC(18,2) NOT NULL DEFAULT 0,
    over_billing_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    under_billing_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
    completion_percent      NUMERIC(8,4)  NOT NULL DEFAULT 0,

    risk_level              VARCHAR(20) DEFAULT 'LOW',
    last_calculated_at      TIMESTAMP,
    notes                   TEXT,

    -- BaseEntity fields
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT      NOT NULL DEFAULT 0,
    deleted     BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_profitability_forecast_org_project
    ON profitability_forecasts (organization_id, project_id);

CREATE INDEX IF NOT EXISTS idx_profitability_forecast_risk
    ON profitability_forecasts (organization_id, risk_level)
    WHERE deleted = FALSE;

-- Ensure one active forecast per project per org
CREATE UNIQUE INDEX IF NOT EXISTS uq_profitability_forecast_org_project_active
    ON profitability_forecasts (organization_id, project_id)
    WHERE deleted = FALSE;


CREATE TABLE IF NOT EXISTS profitability_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    project_id      UUID        NOT NULL,
    forecast_id     UUID,
    snapshot_date   DATE        NOT NULL,

    eac                     NUMERIC(18,2) NOT NULL DEFAULT 0,
    etc                     NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_cost             NUMERIC(18,2) NOT NULL DEFAULT 0,
    earned_value            NUMERIC(18,2) NOT NULL DEFAULT 0,
    forecast_margin         NUMERIC(18,2) NOT NULL DEFAULT 0,
    forecast_margin_percent NUMERIC(8,4)  NOT NULL DEFAULT 0,
    wip_amount              NUMERIC(18,2) NOT NULL DEFAULT 0,
    profit_fade_amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
    completion_percent      NUMERIC(8,4)  NOT NULL DEFAULT 0,

    -- BaseEntity fields
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT      NOT NULL DEFAULT 0,
    deleted     BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_profitability_snapshot_org_project
    ON profitability_snapshots (organization_id, project_id);

CREATE INDEX IF NOT EXISTS idx_profitability_snapshot_project_date
    ON profitability_snapshots (project_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_profitability_snapshot_forecast
    ON profitability_snapshots (forecast_id)
    WHERE deleted = FALSE;
