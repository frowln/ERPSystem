-- =============================================================================
-- V58: RFQ Comparison + Bid Scoring tables
-- =============================================================================

-- =============================================================================
-- Bid Comparisons — Сравнение предложений
-- =============================================================================
CREATE TABLE bid_comparisons (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    rfq_number              VARCHAR(100),
    category                VARCHAR(255),
    created_by_id           UUID,
    approved_by_id          UUID,
    approved_at             TIMESTAMP WITH TIME ZONE,
    winner_vendor_id        UUID,
    winner_justification    TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_bid_comparison_status CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED'))
);

CREATE INDEX IF NOT EXISTS idx_bid_comparison_project ON bid_comparisons(project_id);
CREATE INDEX IF NOT EXISTS idx_bid_comparison_status ON bid_comparisons(status);
CREATE INDEX IF NOT EXISTS idx_bid_comparison_created_by ON bid_comparisons(created_by_id);
CREATE INDEX IF NOT EXISTS idx_bid_comparison_active ON bid_comparisons(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_bid_comparisons_updated_at
    BEFORE UPDATE ON bid_comparisons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Bid Criteria — Критерии оценки
-- =============================================================================
CREATE TABLE bid_criteria (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_comparison_id       UUID NOT NULL REFERENCES bid_comparisons(id) ON DELETE CASCADE,
    criteria_type           VARCHAR(30),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    weight                  NUMERIC(5, 2) NOT NULL,
    max_score               INTEGER NOT NULL DEFAULT 10,
    sort_order              INTEGER,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_bid_criteria_type CHECK (criteria_type IN ('PRICE', 'QUALITY', 'DELIVERY', 'EXPERIENCE', 'FINANCIAL', 'TECHNICAL', 'CUSTOM')),
    CONSTRAINT chk_bid_criteria_weight CHECK (weight >= 0 AND weight <= 100),
    CONSTRAINT chk_bid_criteria_max_score CHECK (max_score > 0)
);

CREATE INDEX IF NOT EXISTS idx_bid_criteria_comparison ON bid_criteria(bid_comparison_id);
CREATE INDEX IF NOT EXISTS idx_bid_criteria_type ON bid_criteria(criteria_type);
CREATE INDEX IF NOT EXISTS idx_bid_criteria_active ON bid_criteria(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_bid_criteria_updated_at
    BEFORE UPDATE ON bid_criteria
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Bid Scores — Оценки поставщиков
-- =============================================================================
CREATE TABLE bid_scores (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_comparison_id       UUID NOT NULL REFERENCES bid_comparisons(id) ON DELETE CASCADE,
    criteria_id             UUID NOT NULL REFERENCES bid_criteria(id) ON DELETE CASCADE,
    vendor_id               UUID NOT NULL,
    vendor_name             VARCHAR(500),
    score                   NUMERIC(5, 2) NOT NULL,
    weighted_score          NUMERIC(10, 4),
    comments                TEXT,
    scored_by_id            UUID,
    scored_at               TIMESTAMP WITH TIME ZONE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bid_score_comparison ON bid_scores(bid_comparison_id);
CREATE INDEX IF NOT EXISTS idx_bid_score_criteria ON bid_scores(criteria_id);
CREATE INDEX IF NOT EXISTS idx_bid_score_vendor ON bid_scores(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bid_score_active ON bid_scores(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_bid_scores_updated_at
    BEFORE UPDATE ON bid_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
