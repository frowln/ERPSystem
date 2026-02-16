-- =============================================================================
-- Search Index table (full-text search using PostgreSQL tsvector)
-- =============================================================================
CREATE TABLE search_index (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(30) NOT NULL,
    entity_id           UUID NOT NULL,
    title               VARCHAR(500) NOT NULL,
    content             TEXT,
    metadata            JSONB,
    project_id          UUID REFERENCES projects(id),
    organization_id     UUID,
    indexed_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ts_vector           TSVECTOR,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_search_index_entity UNIQUE (entity_type, entity_id),
    CONSTRAINT chk_search_entity_type CHECK (entity_type IN (
        'PROJECT', 'CONTRACT', 'TASK', 'DOCUMENT', 'EMPLOYEE', 'MATERIAL', 'INVOICE'
    ))
);

CREATE INDEX IF NOT EXISTS idx_search_entity_type ON search_index(entity_type);
CREATE INDEX IF NOT EXISTS idx_search_entity_id ON search_index(entity_id);
CREATE INDEX IF NOT EXISTS idx_search_project ON search_index(project_id);
CREATE INDEX IF NOT EXISTS idx_search_org ON search_index(organization_id);
CREATE INDEX IF NOT EXISTS idx_search_ts_vector ON search_index USING GIN(ts_vector);
CREATE INDEX IF NOT EXISTS idx_search_active ON search_index(deleted) WHERE deleted = FALSE;

-- Auto-update tsvector on insert/update
CREATE OR REPLACE FUNCTION search_index_tsvector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.ts_vector := setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
                     setweight(to_tsvector('russian', COALESCE(NEW.content, '')), 'B');
    NEW.indexed_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_search_index_tsvector
    BEFORE INSERT OR UPDATE OF title, content ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION search_index_tsvector_update();

CREATE TRIGGER update_search_index_updated_at
    BEFORE UPDATE ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Search History table
-- =============================================================================
CREATE TABLE search_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    query               VARCHAR(500) NOT NULL,
    result_count        INTEGER NOT NULL DEFAULT 0,
    clicked_entity_type VARCHAR(30),
    clicked_entity_id   UUID,
    searched_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_history_active ON search_history(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_search_history_updated_at
    BEFORE UPDATE ON search_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
