-- =============================================================================
-- Monte Carlo EAC Results: Enhanced simulation results with confidence bands
-- =============================================================================

CREATE TABLE monte_carlo_eac_results (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    simulation_id           UUID NOT NULL,
    project_id              UUID NOT NULL,
    iterations              INTEGER NOT NULL DEFAULT 10000,
    -- Cost forecasts
    cost_p10                NUMERIC(15,2),
    cost_p50                NUMERIC(15,2),
    cost_p90                NUMERIC(15,2),
    cost_mean               NUMERIC(15,2),
    cost_std_dev            NUMERIC(15,2),
    -- Schedule forecasts (days)
    schedule_p10            INTEGER,
    schedule_p50            INTEGER,
    schedule_p90            INTEGER,
    schedule_mean           NUMERIC(10,2),
    -- EAC trajectory
    eac_trajectory_json     TEXT,
    -- TCPI
    tcpi_bac                NUMERIC(10,4),
    tcpi_eac                NUMERIC(10,4),
    -- Confidence bands JSON
    confidence_bands_json   TEXT,
    -- Natural language insights
    insights_json           TEXT,
    -- Distribution data for charts
    cost_histogram_json     TEXT,
    schedule_histogram_json TEXT,
    calculated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_mcer_org ON monte_carlo_eac_results(organization_id);
CREATE INDEX idx_mcer_simulation ON monte_carlo_eac_results(simulation_id);
CREATE INDEX idx_mcer_project ON monte_carlo_eac_results(project_id);
CREATE INDEX idx_mcer_calculated_at ON monte_carlo_eac_results(calculated_at DESC);
CREATE INDEX idx_mcer_not_deleted ON monte_carlo_eac_results(deleted) WHERE deleted = FALSE;
