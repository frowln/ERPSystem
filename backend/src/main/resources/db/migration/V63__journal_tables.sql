-- =============================================================================
-- V63: General Journal (Общий журнал работ) tables
-- =============================================================================

CREATE TABLE general_journals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    name                VARCHAR(255) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE,
    status              VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    responsible_id      UUID REFERENCES users(id),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_journal_status CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED')),
    CONSTRAINT chk_journal_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_journals_project ON general_journals(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journals_status ON general_journals(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journals_responsible ON general_journals(responsible_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journals_active ON general_journals(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_general_journals_updated_at
    BEFORE UPDATE ON general_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE general_journal_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id          UUID NOT NULL REFERENCES general_journals(id) ON DELETE CASCADE,
    entry_date          DATE NOT NULL,
    section             VARCHAR(255),
    work_description    TEXT NOT NULL,
    volume              NUMERIC(15,3),
    unit                VARCHAR(50),
    crew                VARCHAR(255),
    weather_conditions  VARCHAR(100),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_journal ON general_journal_entries(journal_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON general_journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_active ON general_journal_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_general_journal_entries_updated_at
    BEFORE UPDATE ON general_journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
