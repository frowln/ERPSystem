-- =============================================================================
-- Sequence for daily log codes (KS6-00001, KS6-00002, etc.)
-- =============================================================================
CREATE SEQUENCE daily_log_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Daily Logs - Журнал КС-6а (Общий журнал работ)
-- =============================================================================
CREATE TABLE daily_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(20) UNIQUE,
    project_id              UUID NOT NULL,
    log_date                DATE NOT NULL,
    weather_conditions      VARCHAR(20) NOT NULL,
    temperature_min         NUMERIC(5, 1),
    temperature_max         NUMERIC(5, 1),
    wind_speed              NUMERIC(5, 1),
    shift_supervisor_id     UUID,
    shift_supervisor_name   VARCHAR(255),
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    general_notes           TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dl_weather CHECK (weather_conditions IN (
        'CLEAR', 'CLOUDY', 'RAIN', 'SNOW', 'FROST', 'WIND', 'STORM'
    )),
    CONSTRAINT chk_dl_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED')),
    CONSTRAINT uq_daily_log_project_date UNIQUE (project_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_dl_code ON daily_logs(code);
CREATE INDEX IF NOT EXISTS idx_dl_project ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_dl_log_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_dl_status ON daily_logs(status);
CREATE INDEX IF NOT EXISTS idx_dl_active ON daily_logs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_daily_logs_updated_at
    BEFORE UPDATE ON daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Daily Log Entries (Записи журнала)
-- =============================================================================
CREATE TABLE daily_log_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id        UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    entry_type          VARCHAR(30) NOT NULL,
    description         TEXT NOT NULL,
    quantity            NUMERIC(18, 4),
    unit                VARCHAR(50),
    start_time          TIME,
    end_time            TIME,
    responsible_name    VARCHAR(255),
    task_id             UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dle_entry_type CHECK (entry_type IN (
        'WORK_PERFORMED', 'MATERIAL_RECEIVED', 'EQUIPMENT_USED', 'PERSONNEL',
        'VISITOR', 'DELAY', 'INCIDENT_NOTE'
    ))
);

CREATE INDEX IF NOT EXISTS idx_dle_daily_log ON daily_log_entries(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_dle_entry_type ON daily_log_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_dle_task ON daily_log_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_dle_active ON daily_log_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_daily_log_entries_updated_at
    BEFORE UPDATE ON daily_log_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Daily Log Photos (Фотографии журнала)
-- =============================================================================
CREATE TABLE daily_log_photos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id        UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    photo_url           VARCHAR(1000) NOT NULL,
    thumbnail_url       VARCHAR(1000),
    caption             VARCHAR(500),
    taken_at            TIMESTAMP WITH TIME ZONE,
    taken_by_id         UUID,
    gps_latitude        NUMERIC(10, 7),
    gps_longitude       NUMERIC(10, 7),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dlp_daily_log ON daily_log_photos(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_dlp_taken_at ON daily_log_photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_dlp_active ON daily_log_photos(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_daily_log_photos_updated_at
    BEFORE UPDATE ON daily_log_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
