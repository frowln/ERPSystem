-- =============================================================================
-- Sequence for report codes (RPT-00001, RPT-00002, etc.)
-- =============================================================================
CREATE SEQUENCE report_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Dashboards (Информационные панели)
-- =============================================================================
CREATE TABLE dashboards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    owner_id            UUID,
    dashboard_type      VARCHAR(20) NOT NULL DEFAULT 'PERSONAL',
    layout_config       JSONB DEFAULT '{}'::jsonb,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dashboard_type CHECK (dashboard_type IN ('PERSONAL', 'SHARED', 'SYSTEM'))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_code ON dashboards(code);
CREATE INDEX IF NOT EXISTS idx_dashboard_owner ON dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_type ON dashboards(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_active ON dashboards(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Dashboard Widgets (Виджеты информационных панелей)
-- =============================================================================
CREATE TABLE dashboard_widgets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id            UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    widget_type             VARCHAR(30) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    data_source             VARCHAR(255) NOT NULL,
    config_json             JSONB DEFAULT '{}'::jsonb,
    position_x              INTEGER NOT NULL DEFAULT 0,
    position_y              INTEGER NOT NULL DEFAULT 0,
    width                   INTEGER NOT NULL DEFAULT 4,
    height                  INTEGER NOT NULL DEFAULT 3,
    refresh_interval_seconds INTEGER DEFAULT 300,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_widget_type CHECK (widget_type IN (
        'KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART', 'TABLE',
        'GANTT', 'KANBAN', 'MAP', 'COUNTER', 'PROGRESS'
    )),
    CONSTRAINT chk_widget_position_x CHECK (position_x >= 0),
    CONSTRAINT chk_widget_position_y CHECK (position_y >= 0),
    CONSTRAINT chk_widget_width CHECK (width >= 1 AND width <= 12),
    CONSTRAINT chk_widget_height CHECK (height >= 1 AND height <= 12)
);

CREATE INDEX IF NOT EXISTS idx_widget_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widget_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_widget_active ON dashboard_widgets(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_dashboard_widgets_updated_at
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Saved Reports (Сохранённые отчёты)
-- =============================================================================
CREATE TABLE saved_reports (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(20) UNIQUE,
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    report_type             VARCHAR(30) NOT NULL,
    query_config            JSONB DEFAULT '{}'::jsonb,
    output_format           VARCHAR(10) NOT NULL DEFAULT 'PDF',
    schedule_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_cron           VARCHAR(100),
    schedule_recipients     JSONB DEFAULT '[]'::jsonb,
    last_run_at             TIMESTAMP WITH TIME ZONE,
    last_run_status         VARCHAR(20),
    created_by_id           UUID,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_report_type CHECK (report_type IN (
        'PROJECT_STATUS', 'FINANCIAL_SUMMARY', 'SAFETY_METRICS',
        'PROCUREMENT_ANALYSIS', 'HR_SUMMARY', 'CUSTOM'
    )),
    CONSTRAINT chk_report_output_format CHECK (output_format IN ('PDF', 'EXCEL', 'CSV')),
    CONSTRAINT chk_report_last_run_status CHECK (last_run_status IS NULL OR last_run_status IN ('SUCCESS', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_report_code ON saved_reports(code);
CREATE INDEX IF NOT EXISTS idx_report_type ON saved_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_created_by ON saved_reports(created_by_id);
CREATE INDEX IF NOT EXISTS idx_report_schedule ON saved_reports(schedule_enabled) WHERE schedule_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_active ON saved_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_saved_reports_updated_at
    BEFORE UPDATE ON saved_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Report Executions (Запуски отчётов)
-- =============================================================================
CREATE TABLE report_executions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id           UUID NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,
    executed_by_id      UUID,
    started_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    output_url          VARCHAR(1000),
    output_size         BIGINT,
    error_message       TEXT,
    parameters_json     JSONB DEFAULT '{}'::jsonb,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_execution_status CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_execution_output_size CHECK (output_size IS NULL OR output_size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_execution_report ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_execution_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_execution_started ON report_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_execution_executed_by ON report_executions(executed_by_id);
CREATE INDEX IF NOT EXISTS idx_execution_active ON report_executions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_report_executions_updated_at
    BEFORE UPDATE ON report_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KPI Definitions (Определения KPI)
-- =============================================================================
CREATE TABLE kpi_definitions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(100) NOT NULL UNIQUE,
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    category                VARCHAR(30) NOT NULL,
    data_source             VARCHAR(255),
    aggregation_type        VARCHAR(20) NOT NULL DEFAULT 'COUNT',
    formula                 TEXT,
    unit                    VARCHAR(20) NOT NULL DEFAULT 'COUNT',
    target_value            NUMERIC(18, 4),
    warning_threshold       NUMERIC(18, 4),
    critical_threshold      NUMERIC(18, 4),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_kpi_category CHECK (category IN (
        'PROJECT', 'FINANCIAL', 'SAFETY', 'HR', 'WAREHOUSE', 'QUALITY'
    )),
    CONSTRAINT chk_kpi_aggregation CHECK (aggregation_type IN (
        'SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'FORMULA'
    )),
    CONSTRAINT chk_kpi_unit CHECK (unit IN ('PERCENT', 'CURRENCY', 'COUNT', 'DAYS', 'HOURS'))
);

CREATE INDEX IF NOT EXISTS idx_kpi_code ON kpi_definitions(code);
CREATE INDEX IF NOT EXISTS idx_kpi_category ON kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_kpi_active_flag ON kpi_definitions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_kpi_def_active ON kpi_definitions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_kpi_definitions_updated_at
    BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KPI Snapshots (Снимки KPI)
-- =============================================================================
CREATE TABLE kpi_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id              UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    project_id          UUID,
    snapshot_date       DATE NOT NULL,
    value               NUMERIC(18, 4) NOT NULL,
    target_value        NUMERIC(18, 4),
    trend               VARCHAR(10) NOT NULL DEFAULT 'STABLE',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_snapshot_trend CHECK (trend IN ('UP', 'DOWN', 'STABLE'))
);

CREATE INDEX IF NOT EXISTS idx_snapshot_kpi ON kpi_snapshots(kpi_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_project ON kpi_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_date ON kpi_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshot_kpi_date ON kpi_snapshots(kpi_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshot_active ON kpi_snapshots(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_kpi_snapshots_updated_at
    BEFORE UPDATE ON kpi_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Seed Data: System Dashboards
-- =============================================================================
INSERT INTO dashboards (id, code, name, description, dashboard_type, is_default, is_public, layout_config)
VALUES
    (uuid_generate_v4(), 'executive_dashboard', 'Панель руководителя',
     'Общая информационная панель для руководства компании',
     'SYSTEM', TRUE, TRUE,
     '{"columns": 12, "rowHeight": 80, "widgets": []}'::jsonb),

    (uuid_generate_v4(), 'project_manager_dashboard', 'Панель руководителя проекта',
     'Информационная панель для управления проектами',
     'SYSTEM', FALSE, TRUE,
     '{"columns": 12, "rowHeight": 80, "widgets": []}'::jsonb),

    (uuid_generate_v4(), 'safety_dashboard', 'Панель безопасности',
     'Мониторинг показателей безопасности на объектах',
     'SYSTEM', FALSE, TRUE,
     '{"columns": 12, "rowHeight": 80, "widgets": []}'::jsonb),

    (uuid_generate_v4(), 'finance_dashboard', 'Финансовая панель',
     'Финансовые показатели и аналитика',
     'SYSTEM', FALSE, TRUE,
     '{"columns": 12, "rowHeight": 80, "widgets": []}'::jsonb),

    (uuid_generate_v4(), 'warehouse_dashboard', 'Панель склада',
     'Мониторинг складских запасов и движений',
     'SYSTEM', FALSE, TRUE,
     '{"columns": 12, "rowHeight": 80, "widgets": []}'::jsonb);

-- =============================================================================
-- Seed Data: KPI Definitions
-- =============================================================================
INSERT INTO kpi_definitions (id, code, name, description, category, data_source, aggregation_type, unit, target_value, warning_threshold, critical_threshold, is_active)
VALUES
    (uuid_generate_v4(), 'project_completion_rate', 'Процент завершения проектов',
     'Доля завершённых проектов от общего числа активных',
     'PROJECT', 'projects.completionRate', 'FORMULA', 'PERCENT', 95.0, 80.0, 60.0, TRUE),

    (uuid_generate_v4(), 'safety_incident_rate', 'Частота инцидентов безопасности',
     'Количество инцидентов на 1000 рабочих часов',
     'SAFETY', 'safety.incidentRate', 'FORMULA', 'COUNT', 0.0, 2.0, 5.0, TRUE),

    (uuid_generate_v4(), 'budget_variance', 'Отклонение от бюджета',
     'Процент отклонения фактических расходов от плановых',
     'FINANCIAL', 'finance.budgetVariance', 'FORMULA', 'PERCENT', 0.0, 10.0, 20.0, TRUE),

    (uuid_generate_v4(), 'crew_utilization', 'Загрузка бригад',
     'Процент использования рабочих бригад',
     'HR', 'hr.crewUtilization', 'AVG', 'PERCENT', 90.0, 70.0, 50.0, TRUE),

    (uuid_generate_v4(), 'warehouse_stock_turnover', 'Оборачиваемость складских запасов',
     'Скорость оборачиваемости материалов на складе',
     'WAREHOUSE', 'warehouse.stockTurnover', 'AVG', 'DAYS', 30.0, 45.0, 60.0, TRUE);
