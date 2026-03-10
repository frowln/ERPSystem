-- Mobile Foreman: field_reports table and sequence
-- Used by the MobileForemanController for mobile field-report workflows

CREATE SEQUENCE IF NOT EXISTS field_report_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS field_reports (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    number          VARCHAR(50)     NOT NULL UNIQUE,
    title           VARCHAR(500)    NOT NULL,
    description     TEXT,
    status          VARCHAR(30)     NOT NULL DEFAULT 'DRAFT',
    project_id      UUID            NOT NULL,
    author_id       UUID            NOT NULL,
    author_name     VARCHAR(255),
    location        VARCHAR(500),
    weather_condition VARCHAR(50),
    temperature     DOUBLE PRECISION,
    workers_on_site INTEGER,
    report_date     DATE            NOT NULL,

    -- BaseEntity audit columns
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT          DEFAULT 0,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE
);

-- Indexes matching the JPA @Index annotations
CREATE INDEX IF NOT EXISTS idx_fr_project     ON field_reports (project_id);
CREATE INDEX IF NOT EXISTS idx_fr_author      ON field_reports (author_id);
CREATE INDEX IF NOT EXISTS idx_fr_status      ON field_reports (status);
CREATE INDEX IF NOT EXISTS idx_fr_report_date ON field_reports (report_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fr_number ON field_reports (number);

COMMENT ON TABLE field_reports IS 'Mobile foreman field reports (полевые отчёты прораба)';
