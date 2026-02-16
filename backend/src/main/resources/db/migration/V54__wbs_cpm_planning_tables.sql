-- =============================================================================
-- V54: WBS / CPM / Resource Leveling / EVM Planning tables
-- =============================================================================

-- =============================================================================
-- WBS Nodes — Узлы иерархической структуры работ
-- =============================================================================
CREATE TABLE wbs_nodes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    parent_id               UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
    code                    VARCHAR(100),
    name                    VARCHAR(500) NOT NULL,
    node_type               VARCHAR(30) NOT NULL DEFAULT 'ACTIVITY',
    level                   INTEGER,
    sort_order              INTEGER,
    planned_start_date      DATE,
    planned_end_date        DATE,
    actual_start_date       DATE,
    actual_end_date         DATE,
    duration                INTEGER,
    percent_complete        NUMERIC(5, 2) DEFAULT 0,
    cost_code_id            UUID,
    responsible_id          UUID,
    is_critical             BOOLEAN NOT NULL DEFAULT FALSE,
    total_float             INTEGER,
    free_float              INTEGER,
    early_start             DATE,
    early_finish            DATE,
    late_start              DATE,
    late_finish             DATE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wbs_node_type CHECK (node_type IN ('PHASE', 'MILESTONE', 'WORK_PACKAGE', 'ACTIVITY', 'SUMMARY'))
);

CREATE INDEX IF NOT EXISTS idx_wbs_node_project ON wbs_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_wbs_node_parent ON wbs_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_wbs_node_type ON wbs_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_wbs_node_responsible ON wbs_nodes(responsible_id);
CREATE INDEX IF NOT EXISTS idx_wbs_node_critical ON wbs_nodes(is_critical) WHERE is_critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_wbs_node_dates ON wbs_nodes(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_wbs_node_active ON wbs_nodes(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_wbs_nodes_updated_at
    BEFORE UPDATE ON wbs_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- WBS Dependencies — Зависимости между узлами WBS (сетевой график)
-- =============================================================================
CREATE TABLE wbs_dependencies (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    predecessor_id          UUID NOT NULL REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    successor_id            UUID NOT NULL REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    dependency_type         VARCHAR(30) NOT NULL DEFAULT 'FINISH_TO_START',
    lag_days                INTEGER NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wbs_dep_type CHECK (dependency_type IN ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH')),
    CONSTRAINT chk_wbs_dep_no_self_ref CHECK (predecessor_id <> successor_id)
);

CREATE INDEX IF NOT EXISTS idx_wbs_dep_predecessor ON wbs_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_wbs_dep_successor ON wbs_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_wbs_dep_active ON wbs_dependencies(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_wbs_dependencies_updated_at
    BEFORE UPDATE ON wbs_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Schedule Baselines — Базовые планы расписания
-- =============================================================================
CREATE TABLE schedule_baselines (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    name                    VARCHAR(500) NOT NULL,
    baseline_type           VARCHAR(30) NOT NULL DEFAULT 'ORIGINAL',
    baseline_date           DATE NOT NULL,
    snapshot_data           JSONB,
    created_by_id           UUID,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_baseline_type CHECK (baseline_type IN ('ORIGINAL', 'CURRENT', 'REVISED'))
);

CREATE INDEX IF NOT EXISTS idx_baseline_project ON schedule_baselines(project_id);
CREATE INDEX IF NOT EXISTS idx_baseline_type ON schedule_baselines(baseline_type);
CREATE INDEX IF NOT EXISTS idx_baseline_date ON schedule_baselines(baseline_date);
CREATE INDEX IF NOT EXISTS idx_baseline_active ON schedule_baselines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_schedule_baselines_updated_at
    BEFORE UPDATE ON schedule_baselines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Resource Allocations — Распределение ресурсов по работам
-- =============================================================================
CREATE TABLE resource_allocations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wbs_node_id             UUID NOT NULL REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    resource_type           VARCHAR(30),
    resource_id             UUID,
    resource_name           VARCHAR(500),
    planned_units           NUMERIC(12, 2),
    actual_units            NUMERIC(12, 2) DEFAULT 0,
    unit_rate               NUMERIC(12, 2),
    planned_cost            NUMERIC(18, 2),
    actual_cost             NUMERIC(18, 2) DEFAULT 0,
    start_date              DATE,
    end_date                DATE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_resource_type CHECK (resource_type IN ('LABOR', 'EQUIPMENT', 'MATERIAL'))
);

CREATE INDEX IF NOT EXISTS idx_res_alloc_wbs_node ON resource_allocations(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_res_alloc_resource ON resource_allocations(resource_id);
CREATE INDEX IF NOT EXISTS idx_res_alloc_type ON resource_allocations(resource_type);
CREATE INDEX IF NOT EXISTS idx_res_alloc_dates ON resource_allocations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_res_alloc_active ON resource_allocations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_resource_allocations_updated_at
    BEFORE UPDATE ON resource_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- EVM Snapshots — Снимки освоенного объёма
-- =============================================================================
CREATE TABLE evm_snapshots (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    snapshot_date           DATE NOT NULL,
    data_date               DATE,
    budget_at_completion    NUMERIC(18, 2),
    planned_value           NUMERIC(18, 2),
    earned_value            NUMERIC(18, 2),
    actual_cost             NUMERIC(18, 2),
    cpi                     NUMERIC(8, 4),
    spi                     NUMERIC(8, 4),
    eac                     NUMERIC(18, 2),
    etc_value               NUMERIC(18, 2),
    tcpi                    NUMERIC(8, 4),
    percent_complete        NUMERIC(5, 2),
    critical_path_length    INTEGER,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_evm_project ON evm_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_evm_snapshot_date ON evm_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_evm_project_date ON evm_snapshots(project_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_evm_active ON evm_snapshots(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_evm_snapshots_updated_at
    BEFORE UPDATE ON evm_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
