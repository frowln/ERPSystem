-- P3-10: Cash flow forecasting
CREATE TABLE IF NOT EXISTS cash_flow_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    baseline_date DATE,
    horizon_months INT NOT NULL DEFAULT 12,
    growth_rate_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
    payment_delay_days INT NOT NULL DEFAULT 30,
    retention_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
    include_vat BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cf_scenario_org_project ON cash_flow_scenarios(organization_id, project_id);

CREATE TABLE IF NOT EXISTS cash_flow_forecast_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    scenario_id UUID NOT NULL,
    project_id UUID,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    forecast_income NUMERIC(18,2) NOT NULL DEFAULT 0,
    forecast_expense NUMERIC(18,2) NOT NULL DEFAULT 0,
    forecast_net NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_income NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_expense NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_net NUMERIC(18,2) NOT NULL DEFAULT 0,
    variance NUMERIC(18,2) NOT NULL DEFAULT 0,
    cumulative_forecast_net NUMERIC(18,2) NOT NULL DEFAULT 0,
    cumulative_actual_net NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cf_bucket_scenario ON cash_flow_forecast_buckets(scenario_id);
CREATE INDEX IF NOT EXISTS idx_cf_bucket_org_period ON cash_flow_forecast_buckets(organization_id, period_start);
