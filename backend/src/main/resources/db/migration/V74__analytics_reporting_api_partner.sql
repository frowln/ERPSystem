-- =============================================================================
-- V74: Analytics BI, Reporting Calendar, API Management, Partner Enrichment
-- =============================================================================

-- =============================================================================
-- 1. ANALYTICS BI
-- =============================================================================

-- Analytics Reports table
CREATE TABLE analytics_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    report_type         VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    category            VARCHAR(100),
    query               TEXT,
    parameters          JSONB DEFAULT '{}',
    output_format       VARCHAR(10) NOT NULL DEFAULT 'PDF',
    last_run_at         TIMESTAMP WITH TIME ZONE,
    run_count           INTEGER NOT NULL DEFAULT 0,
    created_by_id       UUID REFERENCES users(id),
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,
    description         TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_analytics_report_type CHECK (report_type IN (
        'STANDARD', 'CUSTOM', 'SCHEDULED', 'AD_HOC'
    )),
    CONSTRAINT chk_analytics_output_format CHECK (output_format IN (
        'PDF', 'EXCEL', 'CSV', 'HTML'
    ))
);

CREATE INDEX IF NOT EXISTS idx_analytics_report_type ON analytics_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_analytics_report_category ON analytics_reports(category);
CREATE INDEX IF NOT EXISTS idx_analytics_report_created_by ON analytics_reports(created_by_id);
CREATE INDEX IF NOT EXISTS idx_analytics_report_public ON analytics_reports(is_public);
CREATE INDEX IF NOT EXISTS idx_analytics_report_active ON analytics_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_analytics_reports_updated_at
    BEFORE UPDATE ON analytics_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ABC/XYZ Analysis table
CREATE TABLE abc_xyz_analyses (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    analysis_date           DATE NOT NULL,
    entity_type             VARCHAR(50) NOT NULL,
    entity_id               UUID NOT NULL,
    entity_name             VARCHAR(500) NOT NULL,
    abc_category            VARCHAR(5) NOT NULL,
    xyz_category            VARCHAR(5) NOT NULL,
    total_value             NUMERIC(18,2),
    percent_of_total        NUMERIC(8,4),
    variation_coefficient   NUMERIC(8,4),
    frequency               INTEGER NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_abc_category CHECK (abc_category IN ('A', 'B', 'C')),
    CONSTRAINT chk_xyz_category CHECK (xyz_category IN ('X', 'Y', 'Z'))
);

CREATE INDEX IF NOT EXISTS idx_abcxyz_project ON abc_xyz_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_abcxyz_date ON abc_xyz_analyses(analysis_date);
CREATE INDEX IF NOT EXISTS idx_abcxyz_entity_type ON abc_xyz_analyses(entity_type);
CREATE INDEX IF NOT EXISTS idx_abcxyz_abc_category ON abc_xyz_analyses(abc_category);
CREATE INDEX IF NOT EXISTS idx_abcxyz_xyz_category ON abc_xyz_analyses(xyz_category);
CREATE INDEX IF NOT EXISTS idx_abcxyz_active ON abc_xyz_analyses(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_abc_xyz_analyses_updated_at
    BEFORE UPDATE ON abc_xyz_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- BI Dashboards table
CREATE TABLE bi_dashboards (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(500) NOT NULL,
    description                 TEXT,
    layout                      JSONB DEFAULT '{}',
    is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id                    UUID REFERENCES users(id),
    is_shared                   BOOLEAN NOT NULL DEFAULT FALSE,
    refresh_interval_seconds    INTEGER DEFAULT 300,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bi_dashboard_owner ON bi_dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_bi_dashboard_shared ON bi_dashboards(is_shared);
CREATE INDEX IF NOT EXISTS idx_bi_dashboard_default ON bi_dashboards(is_default);
CREATE INDEX IF NOT EXISTS idx_bi_dashboard_active ON bi_dashboards(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_bi_dashboards_updated_at
    BEFORE UPDATE ON bi_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- BI Widgets table
CREATE TABLE bi_widgets (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id                UUID NOT NULL REFERENCES bi_dashboards(id),
    widget_type                 VARCHAR(20) NOT NULL,
    title                       VARCHAR(500) NOT NULL,
    data_source                 VARCHAR(255) NOT NULL,
    query                       TEXT,
    config                      JSONB DEFAULT '{}',
    position                    JSONB DEFAULT '{}',
    size                        JSONB DEFAULT '{}',
    refresh_interval_seconds    INTEGER DEFAULT 300,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_bi_widget_type CHECK (widget_type IN (
        'CHART_BAR', 'CHART_LINE', 'CHART_PIE', 'CHART_DONUT',
        'TABLE', 'KPI_CARD', 'MAP', 'GANTT', 'HEATMAP'
    ))
);

CREATE INDEX IF NOT EXISTS idx_bi_widget_dashboard ON bi_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_bi_widget_type ON bi_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_bi_widget_active ON bi_widgets(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_bi_widgets_updated_at
    BEFORE UPDATE ON bi_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. REPORTING CALENDAR
-- =============================================================================

-- Reporting Deadlines table
CREATE TABLE reporting_deadlines (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    report_type             VARCHAR(50) NOT NULL,
    frequency               VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    due_date                DATE NOT NULL,
    reminder_days_before    INTEGER NOT NULL DEFAULT 5,
    responsible_id          UUID REFERENCES users(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    submitted_at            TIMESTAMP WITH TIME ZONE,
    submitted_by_id         UUID REFERENCES users(id),
    notes                   TEXT,
    regulatory_body         VARCHAR(100),
    penalty_amount          NUMERIC(18,2),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_rpt_deadline_frequency CHECK (frequency IN (
        'MONTHLY', 'QUARTERLY', 'ANNUAL', 'AD_HOC'
    )),
    CONSTRAINT chk_rpt_deadline_status CHECK (status IN (
        'UPCOMING', 'DUE', 'SUBMITTED', 'OVERDUE', 'SKIPPED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_rpt_deadline_due_date ON reporting_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_rpt_deadline_status ON reporting_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_rpt_deadline_report_type ON reporting_deadlines(report_type);
CREATE INDEX IF NOT EXISTS idx_rpt_deadline_responsible ON reporting_deadlines(responsible_id);
CREATE INDEX IF NOT EXISTS idx_rpt_deadline_regulatory_body ON reporting_deadlines(regulatory_body);
CREATE INDEX IF NOT EXISTS idx_rpt_deadline_active ON reporting_deadlines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_reporting_deadlines_updated_at
    BEFORE UPDATE ON reporting_deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Reporting Submissions table
CREATE TABLE reporting_submissions (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deadline_id                 UUID NOT NULL REFERENCES reporting_deadlines(id),
    submission_date             DATE NOT NULL,
    submitted_by_id             UUID REFERENCES users(id),
    confirmation_number         VARCHAR(100),
    channel                     VARCHAR(20) NOT NULL DEFAULT 'ELECTRONIC',
    file_url                    VARCHAR(1000),
    status                      VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    rejection_reason            TEXT,
    corrected_submission_id     UUID REFERENCES reporting_submissions(id),
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_rpt_submission_channel CHECK (channel IN (
        'ELECTRONIC', 'PAPER', 'EDO'
    )),
    CONSTRAINT chk_rpt_submission_status CHECK (status IN (
        'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CORRECTION_NEEDED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_rpt_submission_deadline ON reporting_submissions(deadline_id);
CREATE INDEX IF NOT EXISTS idx_rpt_submission_status ON reporting_submissions(status);
CREATE INDEX IF NOT EXISTS idx_rpt_submission_date ON reporting_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_rpt_submission_submitted_by ON reporting_submissions(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_rpt_submission_active ON reporting_submissions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_reporting_submissions_updated_at
    BEFORE UPDATE ON reporting_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. API MANAGEMENT
-- =============================================================================

-- API Keys table
CREATE TABLE api_keys (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    key_hash            VARCHAR(255) NOT NULL UNIQUE,
    prefix              VARCHAR(8) NOT NULL,
    user_id             UUID NOT NULL REFERENCES users(id),
    scopes              JSONB DEFAULT '[]',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at          TIMESTAMP WITH TIME ZONE,
    last_used_at        TIMESTAMP WITH TIME ZONE,
    request_count       BIGINT NOT NULL DEFAULT 0,
    rate_limit          INTEGER NOT NULL DEFAULT 60,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_key_prefix ON api_keys(prefix);
CREATE INDEX IF NOT EXISTS idx_api_key_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_active ON api_keys(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_key_not_deleted ON api_keys(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Webhook Configs table
CREATE TABLE webhook_configs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    url                     VARCHAR(1000) NOT NULL,
    secret                  VARCHAR(255),
    events                  JSONB DEFAULT '[]',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at       TIMESTAMP WITH TIME ZONE,
    failure_count           INTEGER NOT NULL DEFAULT 0,
    last_failure_at         TIMESTAMP WITH TIME ZONE,
    last_failure_message    VARCHAR(2000),
    retry_policy            VARCHAR(20) NOT NULL DEFAULT 'EXPONENTIAL',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_webhook_retry_policy CHECK (retry_policy IN (
        'NONE', 'LINEAR', 'EXPONENTIAL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_webhook_config_active ON webhook_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_config_url ON webhook_configs(url);
CREATE INDEX IF NOT EXISTS idx_webhook_config_not_deleted ON webhook_configs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_webhook_configs_updated_at
    BEFORE UPDATE ON webhook_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Webhook Deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_config_id   UUID NOT NULL REFERENCES webhook_configs(id),
    event               VARCHAR(100) NOT NULL,
    payload             JSONB DEFAULT '{}',
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    response_code       INTEGER,
    response_body       TEXT,
    sent_at             TIMESTAMP WITH TIME ZONE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    attempt_count       INTEGER NOT NULL DEFAULT 0,
    next_retry_at       TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_webhook_delivery_status CHECK (status IN (
        'PENDING', 'SENT', 'FAILED', 'RETRYING'
    ))
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_config ON webhook_deliveries(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_event ON webhook_deliveries(event);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_sent_at ON webhook_deliveries(sent_at);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_retry ON webhook_deliveries(next_retry_at) WHERE status = 'RETRYING';
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_not_deleted ON webhook_deliveries(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_webhook_deliveries_updated_at ON webhook_deliveries;
CREATE TRIGGER update_webhook_deliveries_updated_at
    BEFORE UPDATE ON webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Idempotency Records table
CREATE TABLE idempotency_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key     VARCHAR(255) NOT NULL UNIQUE,
    request_hash        VARCHAR(255),
    response_data       TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    record_created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_idempotency_status CHECK (status IN (
        'PROCESSING', 'COMPLETED', 'FAILED'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_records(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_status ON idempotency_records(status);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_records(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_not_deleted ON idempotency_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_idempotency_records_updated_at
    BEFORE UPDATE ON idempotency_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. PARTNER ENRICHMENT
-- =============================================================================

-- Partner Enrichments table
CREATE TABLE partner_enrichments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id              UUID NOT NULL,
    inn                     VARCHAR(12),
    ogrn                    VARCHAR(15),
    kpp                     VARCHAR(9),
    legal_name              VARCHAR(500),
    trade_name              VARCHAR(500),
    legal_address           VARCHAR(1000),
    actual_address          VARCHAR(1000),
    registration_date       DATE,
    status                  VARCHAR(20) DEFAULT 'ACTIVE',
    authorized_capital      NUMERIC(18,2),
    ceo_name                VARCHAR(500),
    ceo_inn                 VARCHAR(12),
    employee_count          INTEGER,
    main_activity           VARCHAR(500),
    okved_code              VARCHAR(20),
    enriched_at             TIMESTAMP WITH TIME ZONE,
    source                  VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    reliability_score       INTEGER DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_partner_legal_status CHECK (status IN (
        'ACTIVE', 'LIQUIDATING', 'LIQUIDATED', 'BANKRUPT'
    )),
    CONSTRAINT chk_enrichment_source CHECK (source IN (
        'EGRUL', 'FNS', 'SPARK', 'MANUAL'
    )),
    CONSTRAINT chk_reliability_score CHECK (reliability_score >= 0 AND reliability_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_partner_enrichment_partner ON partner_enrichments(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrichment_inn ON partner_enrichments(inn);
CREATE INDEX IF NOT EXISTS idx_partner_enrichment_ogrn ON partner_enrichments(ogrn);
CREATE INDEX IF NOT EXISTS idx_partner_enrichment_status ON partner_enrichments(status);
CREATE INDEX IF NOT EXISTS idx_partner_enrichment_source ON partner_enrichments(source);
CREATE INDEX IF NOT EXISTS idx_partner_enrichment_not_deleted ON partner_enrichments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_partner_enrichments_updated_at
    BEFORE UPDATE ON partner_enrichments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Partner Enrichment Logs table
CREATE TABLE partner_enrichment_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id          UUID NOT NULL,
    source              VARCHAR(50) NOT NULL,
    requested_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status              VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    response_data       JSONB,
    error_message       TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_enrichment_log_status CHECK (status IN (
        'SUCCESS', 'FAILED', 'PARTIAL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_enrichment_log_partner ON partner_enrichment_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_log_status ON partner_enrichment_logs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_log_requested_at ON partner_enrichment_logs(requested_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_log_not_deleted ON partner_enrichment_logs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_partner_enrichment_logs_updated_at
    BEFORE UPDATE ON partner_enrichment_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
