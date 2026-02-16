-- =============================================================================
-- Scheduled Jobs / Cron (Планировщик задач)
-- =============================================================================

-- =============================================================================
-- Scheduled Jobs (Запланированные задания)
-- =============================================================================
CREATE TABLE scheduled_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    cron_expression     VARCHAR(100) NOT NULL,
    job_class           VARCHAR(500) NOT NULL,
    job_method          VARCHAR(255) NOT NULL,
    parameters          JSONB DEFAULT '{}'::jsonb,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at         TIMESTAMP WITH TIME ZONE,
    last_run_status     VARCHAR(20),
    next_run_at         TIMESTAMP WITH TIME ZONE,
    retry_count         INTEGER NOT NULL DEFAULT 0,
    max_retries         INTEGER NOT NULL DEFAULT 3,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_job_last_run_status CHECK (last_run_status IS NULL OR last_run_status IN (
        'SUCCESS', 'FAILED', 'TIMEOUT'
    )),
    CONSTRAINT chk_job_retry_count CHECK (retry_count >= 0),
    CONSTRAINT chk_job_max_retries CHECK (max_retries >= 0)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_job_code ON scheduled_jobs(code);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_active ON scheduled_jobs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_scheduled_job_next_run ON scheduled_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_last_status ON scheduled_jobs(last_run_status);

CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Job Executions (История выполнения заданий)
-- =============================================================================
CREATE TABLE job_executions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id              UUID NOT NULL,
    started_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    result              TEXT,
    error_message       TEXT,
    error_stack_trace   TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_job_execution_job FOREIGN KEY (job_id)
        REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    CONSTRAINT chk_execution_status CHECK (status IN (
        'RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT'
    ))
);

CREATE INDEX IF NOT EXISTS idx_job_execution_job ON job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_execution_status ON job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_execution_started ON job_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_job_execution_active ON job_executions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_job_executions_updated_at
    BEFORE UPDATE ON job_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
