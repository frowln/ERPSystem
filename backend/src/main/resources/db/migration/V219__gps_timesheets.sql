-- P5-06: GPS Timesheets with Geofencing
-- Site geofences, GPS check events, timesheet entries, and monthly summaries

CREATE TABLE site_geofences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL,
    project_id      UUID         NOT NULL,
    name            VARCHAR(255) NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    radius_meters   DOUBLE PRECISION NOT NULL DEFAULT 100,
    polygon_json    TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_site_geofences_org ON site_geofences (organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_site_geofences_project ON site_geofences (project_id) WHERE deleted = FALSE;
CREATE INDEX idx_site_geofences_active ON site_geofences (organization_id, is_active) WHERE deleted = FALSE;

CREATE TABLE gps_check_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID         NOT NULL,
    employee_id         UUID         NOT NULL,
    project_id          UUID,
    site_geofence_id    UUID,
    event_type          VARCHAR(20)  NOT NULL,
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,
    accuracy_meters     DOUBLE PRECISION,
    is_within_geofence  BOOLEAN      NOT NULL DEFAULT FALSE,
    device_id           VARCHAR(255),
    recorded_at         TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT       NOT NULL DEFAULT 0,
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_gps_check_geofence FOREIGN KEY (site_geofence_id) REFERENCES site_geofences (id)
);

CREATE INDEX idx_gps_check_events_org ON gps_check_events (organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_gps_check_events_employee ON gps_check_events (employee_id, recorded_at) WHERE deleted = FALSE;
CREATE INDEX idx_gps_check_events_project ON gps_check_events (project_id) WHERE deleted = FALSE;
CREATE INDEX idx_gps_check_events_type ON gps_check_events (employee_id, event_type) WHERE deleted = FALSE;

CREATE TABLE gps_timesheet_entries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID         NOT NULL,
    employee_id             UUID         NOT NULL,
    project_id              UUID,
    check_in_event_id       UUID,
    check_out_event_id      UUID,
    work_date               DATE         NOT NULL,
    check_in_time           TIMESTAMP WITH TIME ZONE,
    check_out_time          TIMESTAMP WITH TIME ZONE,
    total_hours             DECIMAL(6, 2),
    is_verified             BOOLEAN      NOT NULL DEFAULT FALSE,
    is_geofence_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    cost_code_id            UUID,
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT       NOT NULL DEFAULT 0,
    deleted                 BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_gps_ts_check_in FOREIGN KEY (check_in_event_id) REFERENCES gps_check_events (id),
    CONSTRAINT fk_gps_ts_check_out FOREIGN KEY (check_out_event_id) REFERENCES gps_check_events (id)
);

CREATE INDEX idx_gps_ts_entries_org ON gps_timesheet_entries (organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_gps_ts_entries_employee ON gps_timesheet_entries (employee_id, work_date) WHERE deleted = FALSE;
CREATE INDEX idx_gps_ts_entries_project ON gps_timesheet_entries (project_id) WHERE deleted = FALSE;
CREATE INDEX idx_gps_ts_entries_verified ON gps_timesheet_entries (organization_id, is_verified) WHERE deleted = FALSE;
CREATE INDEX idx_gps_ts_entries_date ON gps_timesheet_entries (work_date) WHERE deleted = FALSE;

CREATE TABLE gps_timesheet_summaries (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID    NOT NULL,
    employee_id           UUID    NOT NULL,
    period_year           INT     NOT NULL,
    period_month          INT     NOT NULL,
    total_days            INT     NOT NULL DEFAULT 0,
    total_hours           DECIMAL(8, 2) NOT NULL DEFAULT 0,
    verified_hours        DECIMAL(8, 2) NOT NULL DEFAULT 0,
    geofence_violations   INT     NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP WITH TIME ZONE,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    version               BIGINT  NOT NULL DEFAULT 0,
    deleted               BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_gps_ts_summary UNIQUE (organization_id, employee_id, period_year, period_month)
);

CREATE INDEX idx_gps_ts_summaries_org ON gps_timesheet_summaries (organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_gps_ts_summaries_employee ON gps_timesheet_summaries (employee_id, period_year, period_month) WHERE deleted = FALSE;
CREATE INDEX idx_gps_ts_summaries_period ON gps_timesheet_summaries (organization_id, period_year, period_month) WHERE deleted = FALSE;
