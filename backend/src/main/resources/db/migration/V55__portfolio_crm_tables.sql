-- =============================================================================
-- V55: Portfolio Management + CRM/Tenders tables
-- =============================================================================

-- =============================================================================
-- Opportunities — Возможности (воронка продаж)
-- =============================================================================
CREATE TABLE opportunities (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID,
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    client_name             VARCHAR(500),
    client_type             VARCHAR(30),
    stage                   VARCHAR(30) NOT NULL DEFAULT 'LEAD',
    estimated_value         NUMERIC(18, 2),
    probability             INTEGER,
    expected_close_date     DATE,
    actual_close_date       DATE,
    owner_id                UUID,
    source                  VARCHAR(255),
    region                  VARCHAR(255),
    project_type            VARCHAR(255),
    lost_reason             TEXT,
    won_project_id          UUID,
    tags                    JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_opportunity_stage CHECK (stage IN ('LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'WITHDRAWN')),
    CONSTRAINT chk_opportunity_client_type CHECK (client_type IN ('DEVELOPER', 'GOVERNMENT', 'INDUSTRIAL', 'COMMERCIAL', 'RESIDENTIAL', 'INFRASTRUCTURE')),
    CONSTRAINT chk_opportunity_probability CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100))
);

CREATE INDEX IF NOT EXISTS idx_opportunity_org ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunity_client_type ON opportunities(client_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_owner ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_expected_close ON opportunities(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_opportunity_active ON opportunities(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Bid Packages — Тендерные пакеты
-- =============================================================================
CREATE TABLE bid_packages (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id          UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    project_name            VARCHAR(500) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    bid_number              VARCHAR(100),
    client_organization     VARCHAR(500),
    submission_deadline     TIMESTAMP WITH TIME ZONE,
    submission_date         TIMESTAMP WITH TIME ZONE,
    bid_amount              NUMERIC(18, 2),
    estimated_cost          NUMERIC(18, 2),
    estimated_margin        NUMERIC(18, 2),
    bid_manager_id          UUID,
    technical_lead_id       UUID,
    bond_required           BOOLEAN NOT NULL DEFAULT FALSE,
    bond_amount             NUMERIC(18, 2),
    documents               JSONB,
    competitor_info         JSONB,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_bid_status CHECK (status IN ('DRAFT', 'IN_PREPARATION', 'SUBMITTED', 'UNDER_EVALUATION', 'WON', 'LOST', 'NO_BID'))
);

CREATE INDEX IF NOT EXISTS idx_bid_package_opportunity ON bid_packages(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_bid_package_status ON bid_packages(status);
CREATE INDEX IF NOT EXISTS idx_bid_package_manager ON bid_packages(bid_manager_id);
CREATE INDEX IF NOT EXISTS idx_bid_package_deadline ON bid_packages(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_bid_package_active ON bid_packages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_bid_packages_updated_at
    BEFORE UPDATE ON bid_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Prequalifications — Преквалификации
-- =============================================================================
CREATE TABLE prequalifications (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID,
    client_name             VARCHAR(500) NOT NULL,
    project_name            VARCHAR(500),
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    submission_date         DATE,
    expiry_date             DATE,
    categories              JSONB,
    max_contract_value      NUMERIC(18, 2),
    responsible_id          UUID,
    documents               JSONB,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_prequalification_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_prequalification_org ON prequalifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_prequalification_status ON prequalifications(status);
CREATE INDEX IF NOT EXISTS idx_prequalification_responsible ON prequalifications(responsible_id);
CREATE INDEX IF NOT EXISTS idx_prequalification_expiry ON prequalifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_prequalification_active ON prequalifications(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_prequalifications_updated_at
    BEFORE UPDATE ON prequalifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tender Submissions — Тендерные заявки
-- =============================================================================
CREATE TABLE tender_submissions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_package_id          UUID NOT NULL REFERENCES bid_packages(id) ON DELETE CASCADE,
    version                 INTEGER NOT NULL DEFAULT 1,
    technical_proposal      TEXT,
    commercial_summary      TEXT,
    total_price             NUMERIC(18, 2),
    discount_percent        NUMERIC(5, 2),
    final_price             NUMERIC(18, 2),
    submitted_by_id         UUID,
    submitted_at            TIMESTAMP WITH TIME ZONE,
    attachment_ids          JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    entity_version          BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tender_submission_bid ON tender_submissions(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_tender_submission_active ON tender_submissions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_tender_submissions_updated_at
    BEFORE UPDATE ON tender_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
