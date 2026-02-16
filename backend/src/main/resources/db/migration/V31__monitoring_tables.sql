-- =============================================================================
-- System Health Checks table
-- =============================================================================
CREATE TABLE system_health_checks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component           VARCHAR(50) NOT NULL,
    status              VARCHAR(20) NOT NULL,
    response_time_ms    BIGINT,
    message             VARCHAR(1000),
    details             JSONB,
    checked_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_health_component CHECK (component IN (
        'DATABASE', 'REDIS', 'STORAGE', 'EMAIL',
        'INTEGRATION_1C', 'INTEGRATION_BANK', 'INTEGRATION_EDO'
    )),
    CONSTRAINT chk_health_status CHECK (status IN (
        'HEALTHY', 'DEGRADED', 'DOWN'
    ))
);

CREATE INDEX IF NOT EXISTS idx_health_component ON system_health_checks(component);
CREATE INDEX IF NOT EXISTS idx_health_status ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checked_at ON system_health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_health_active ON system_health_checks(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_system_health_checks_updated_at
    BEFORE UPDATE ON system_health_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- System Metrics table
-- =============================================================================
CREATE TABLE system_metrics (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name         VARCHAR(200) NOT NULL,
    metric_value        DOUBLE PRECISION NOT NULL,
    metric_unit         VARCHAR(50),
    tags                JSONB,
    recorded_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_metric_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metric_recorded_at ON system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_metric_name_time ON system_metrics(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_metric_active ON system_metrics(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_system_metrics_updated_at
    BEFORE UPDATE ON system_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- System Events table
-- =============================================================================
CREATE TABLE system_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type          VARCHAR(30) NOT NULL,
    severity            VARCHAR(20) NOT NULL,
    message             VARCHAR(2000) NOT NULL,
    details             JSONB,
    source              VARCHAR(200),
    user_id             UUID REFERENCES users(id),
    occurred_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_event_type CHECK (event_type IN (
        'STARTUP', 'SHUTDOWN', 'ERROR', 'WARNING',
        'DEPLOYMENT', 'MIGRATION', 'BACKUP_COMPLETED', 'BACKUP_FAILED'
    )),
    CONSTRAINT chk_event_severity CHECK (severity IN (
        'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_sys_event_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_event_severity ON system_events(severity);
CREATE INDEX IF NOT EXISTS idx_event_occurred_at ON system_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_source ON system_events(source);
CREATE INDEX IF NOT EXISTS idx_event_active ON system_events(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_system_events_updated_at
    BEFORE UPDATE ON system_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Backup Records table
-- =============================================================================
CREATE TABLE backup_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type         VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    size_bytes          BIGINT,
    storage_location    VARCHAR(1000),
    error_message       TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_backup_type CHECK (backup_type IN (
        'FULL', 'INCREMENTAL', 'DATABASE_ONLY'
    )),
    CONSTRAINT chk_backup_status CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_backup_type ON backup_records(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_started_at ON backup_records(started_at);
CREATE INDEX IF NOT EXISTS idx_backup_active ON backup_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_backup_records_updated_at
    BEFORE UPDATE ON backup_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
