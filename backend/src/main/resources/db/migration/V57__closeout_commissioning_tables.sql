-- =============================================================================
-- V57: Closeout / Commissioning / Warranty tables
-- =============================================================================

-- =============================================================================
-- Commissioning Checklists (Пусконаладочные чек-листы)
-- =============================================================================
CREATE TABLE commissioning_checklists (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    name                VARCHAR(500) NOT NULL,
    system              VARCHAR(100),
    status              VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    check_items         JSONB,
    inspector_id        UUID,
    inspection_date     DATE,
    signed_off_by_id    UUID,
    signed_off_at       TIMESTAMP WITH TIME ZONE,
    notes               TEXT,
    attachment_ids      JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_commissioning_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NA'))
);

CREATE INDEX IF NOT EXISTS idx_commissioning_project ON commissioning_checklists(project_id);
CREATE INDEX IF NOT EXISTS idx_commissioning_status ON commissioning_checklists(status);
CREATE INDEX IF NOT EXISTS idx_commissioning_system ON commissioning_checklists(system);
CREATE INDEX IF NOT EXISTS idx_commissioning_inspector ON commissioning_checklists(inspector_id);
CREATE INDEX IF NOT EXISTS idx_commissioning_active ON commissioning_checklists(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_commissioning_checklists_updated_at
    BEFORE UPDATE ON commissioning_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Handover Packages (Пакеты передачи объекта)
-- =============================================================================
CREATE TABLE handover_packages (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    package_number          VARCHAR(50),
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    recipient_organization  VARCHAR(500),
    recipient_contact_id    UUID,
    prepared_by_id          UUID,
    prepared_date           DATE,
    handover_date           DATE,
    accepted_date           DATE,
    accepted_by_id          UUID,
    document_ids            JSONB,
    drawing_ids             JSONB,
    certificate_ids         JSONB,
    manual_ids              JSONB,
    rejection_reason        TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_handover_status CHECK (status IN ('DRAFT', 'IN_PREPARATION', 'SUBMITTED', 'ACCEPTED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_handover_project ON handover_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_handover_status ON handover_packages(status);
CREATE INDEX IF NOT EXISTS idx_handover_prepared_by ON handover_packages(prepared_by_id);
CREATE INDEX IF NOT EXISTS idx_handover_accepted_by ON handover_packages(accepted_by_id);
CREATE INDEX IF NOT EXISTS idx_handover_active ON handover_packages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_handover_packages_updated_at
    BEFORE UPDATE ON handover_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Warranty Claims (Гарантийные рекламации)
-- =============================================================================
CREATE TABLE warranty_claims (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID,
    handover_package_id     UUID REFERENCES handover_packages(id),
    claim_number            VARCHAR(50),
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    defect_type             VARCHAR(100),
    location                VARCHAR(500),
    reported_by_id          UUID,
    reported_date           DATE,
    warranty_expiry_date    DATE,
    assigned_to_id          UUID,
    resolved_date           DATE,
    resolution_description  TEXT,
    cost_of_repair          NUMERIC(18, 2),
    attachment_ids          JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_warranty_status CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'IN_REPAIR', 'RESOLVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_warranty_project ON warranty_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_warranty_handover ON warranty_claims(handover_package_id);
CREATE INDEX IF NOT EXISTS idx_warranty_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_assigned ON warranty_claims(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reported_by ON warranty_claims(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_warranty_expiry ON warranty_claims(warranty_expiry_date);
CREATE INDEX IF NOT EXISTS idx_warranty_active ON warranty_claims(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_warranty_claims_updated_at
    BEFORE UPDATE ON warranty_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
