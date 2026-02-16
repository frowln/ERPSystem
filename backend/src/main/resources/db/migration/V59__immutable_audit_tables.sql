-- =============================================================================
-- V59: Immutable Audit Trail tables (Aconex-grade)
-- =============================================================================

-- =============================================================================
-- Immutable Records (Неизменяемые записи аудита)
-- =============================================================================
CREATE TABLE immutable_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID NOT NULL,
    record_hash         VARCHAR(64) NOT NULL,
    content_snapshot    JSONB,
    previous_record_id  UUID REFERENCES immutable_records(id),
    recorded_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    recorded_by_id      UUID,
    action              VARCHAR(30),
    version             INTEGER,
    is_superseded       BOOLEAN NOT NULL DEFAULT FALSE,
    superseded_by_id    UUID,
    superseded_at       TIMESTAMP WITH TIME ZONE,
    chain_valid         BOOLEAN,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),

    CONSTRAINT chk_immutable_action CHECK (action IN ('CREATE', 'UPDATE', 'SUPERSEDE'))
);

CREATE INDEX IF NOT EXISTS idx_immutable_entity ON immutable_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_immutable_hash ON immutable_records(record_hash);
CREATE INDEX IF NOT EXISTS idx_immutable_prev ON immutable_records(previous_record_id);
CREATE INDEX IF NOT EXISTS idx_immutable_recorded_at ON immutable_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_immutable_recorded_by ON immutable_records(recorded_by_id);
CREATE INDEX IF NOT EXISTS idx_immutable_superseded ON immutable_records(is_superseded);
CREATE INDEX IF NOT EXISTS idx_immutable_active ON immutable_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_immutable_records_updated_at
    BEFORE UPDATE ON immutable_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Record Supersessions (Замещение записей)
-- =============================================================================
CREATE TABLE record_supersessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_record_id      UUID NOT NULL REFERENCES immutable_records(id),
    superseding_record_id   UUID NOT NULL REFERENCES immutable_records(id),
    reason                  TEXT NOT NULL,
    superseded_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    superseded_by_id        UUID NOT NULL,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_supersession_original ON record_supersessions(original_record_id);
CREATE INDEX IF NOT EXISTS idx_supersession_superseding ON record_supersessions(superseding_record_id);
CREATE INDEX IF NOT EXISTS idx_supersession_by ON record_supersessions(superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_supersession_active ON record_supersessions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_record_supersessions_updated_at
    BEFORE UPDATE ON record_supersessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
