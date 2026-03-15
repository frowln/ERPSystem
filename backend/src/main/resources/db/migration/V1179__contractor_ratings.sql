CREATE TABLE contractor_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty_id UUID NOT NULL REFERENCES counterparties(id),
    project_id UUID REFERENCES projects(id),
    rated_by UUID REFERENCES users(id),
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
    timeliness_score INTEGER CHECK (timeliness_score BETWEEN 1 AND 5),
    safety_score INTEGER CHECK (safety_score BETWEEN 1 AND 5),
    communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
    price_score INTEGER CHECK (price_score BETWEEN 1 AND 5),
    overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
        (COALESCE(quality_score,0) + COALESCE(timeliness_score,0) + COALESCE(safety_score,0) + COALESCE(communication_score,0) + COALESCE(price_score,0))::NUMERIC /
        NULLIF((CASE WHEN quality_score IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN timeliness_score IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN safety_score IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN communication_score IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN price_score IS NOT NULL THEN 1 ELSE 0 END), 0)
    ) STORED,
    comment TEXT,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);
CREATE INDEX idx_contractor_ratings_cp ON contractor_ratings(counterparty_id);
CREATE INDEX idx_contractor_ratings_org ON contractor_ratings(organization_id);
