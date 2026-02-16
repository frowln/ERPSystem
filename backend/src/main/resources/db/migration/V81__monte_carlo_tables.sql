-- =============================================================================
-- Monte Carlo Module: Вероятностный анализ сроков
-- =============================================================================

-- =============================================================================
-- Monte Carlo Simulations (Симуляции Монте-Карло)
-- =============================================================================
CREATE TABLE monte_carlo_simulations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    project_id              UUID,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    iterations              INTEGER NOT NULL DEFAULT 10000,
    confidence_level        NUMERIC(5, 2) NOT NULL DEFAULT 0.85,
    started_at              TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    result_p50_duration     INTEGER,
    result_p85_duration     INTEGER,
    result_p95_duration     INTEGER,
    result_p50_date         DATE,
    result_p85_date         DATE,
    result_p95_date         DATE,
    baseline_start_date     DATE,
    baseline_duration       INTEGER,
    description             TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mc_sim_status CHECK (status IN ('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_mc_sim_iterations CHECK (iterations >= 100),
    CONSTRAINT chk_mc_sim_confidence CHECK (confidence_level > 0 AND confidence_level < 1),
    CONSTRAINT chk_mc_sim_baseline_dur CHECK (baseline_duration IS NULL OR baseline_duration >= 1)
);

CREATE INDEX IF NOT EXISTS idx_mc_sim_project ON monte_carlo_simulations(project_id);
CREATE INDEX IF NOT EXISTS idx_mc_sim_status ON monte_carlo_simulations(status);
CREATE INDEX IF NOT EXISTS idx_mc_sim_not_deleted ON monte_carlo_simulations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_monte_carlo_simulations_updated_at
    BEFORE UPDATE ON monte_carlo_simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Monte Carlo Tasks (Задачи симуляции Монте-Карло)
-- =============================================================================
CREATE TABLE monte_carlo_tasks (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id           UUID NOT NULL REFERENCES monte_carlo_simulations(id),
    task_name               VARCHAR(500) NOT NULL,
    wbs_node_id             UUID,
    optimistic_duration     INTEGER NOT NULL,
    most_likely_duration    INTEGER NOT NULL,
    pessimistic_duration    INTEGER NOT NULL,
    distribution            VARCHAR(20) NOT NULL DEFAULT 'PERT',
    dependencies            TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mc_task_distribution CHECK (distribution IN ('PERT', 'TRIANGULAR', 'NORMAL', 'UNIFORM')),
    CONSTRAINT chk_mc_task_opt_dur CHECK (optimistic_duration >= 1),
    CONSTRAINT chk_mc_task_ml_dur CHECK (most_likely_duration >= 1),
    CONSTRAINT chk_mc_task_pess_dur CHECK (pessimistic_duration >= 1),
    CONSTRAINT chk_mc_task_dur_order CHECK (optimistic_duration <= most_likely_duration AND most_likely_duration <= pessimistic_duration)
);

CREATE INDEX IF NOT EXISTS idx_mc_task_simulation ON monte_carlo_tasks(simulation_id);
CREATE INDEX IF NOT EXISTS idx_mc_task_wbs_node ON monte_carlo_tasks(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_mc_task_not_deleted ON monte_carlo_tasks(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_monte_carlo_tasks_updated_at
    BEFORE UPDATE ON monte_carlo_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Monte Carlo Results (Результаты симуляции Монте-Карло)
-- =============================================================================
CREATE TABLE monte_carlo_results (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id           UUID NOT NULL REFERENCES monte_carlo_simulations(id),
    percentile              INTEGER NOT NULL,
    duration_days           INTEGER NOT NULL,
    completion_date         DATE,
    probability             NUMERIC(5, 4),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mc_result_percentile CHECK (percentile >= 0 AND percentile <= 100),
    CONSTRAINT chk_mc_result_duration CHECK (duration_days >= 1),
    CONSTRAINT chk_mc_result_probability CHECK (probability IS NULL OR (probability >= 0 AND probability <= 1))
);

CREATE INDEX IF NOT EXISTS idx_mc_result_simulation ON monte_carlo_results(simulation_id);
CREATE INDEX IF NOT EXISTS idx_mc_result_percentile ON monte_carlo_results(percentile);
CREATE INDEX IF NOT EXISTS idx_mc_result_not_deleted ON monte_carlo_results(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_monte_carlo_results_updated_at
    BEFORE UPDATE ON monte_carlo_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
