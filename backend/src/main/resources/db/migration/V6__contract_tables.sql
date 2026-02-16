-- =============================================================================
-- Sequence for contract numbers (CTR-00001, CTR-00002, etc.)
-- =============================================================================
CREATE SEQUENCE contract_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Contract types reference table
-- =============================================================================
CREATE TABLE contract_types (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                        VARCHAR(50) NOT NULL UNIQUE,
    name                        VARCHAR(200) NOT NULL,
    description                 TEXT,
    sequence                    INTEGER NOT NULL DEFAULT 0,
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    requires_lawyer_approval    BOOLEAN NOT NULL DEFAULT TRUE,
    requires_management_approval BOOLEAN NOT NULL DEFAULT TRUE,
    requires_finance_approval   BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_contract_type_code ON contract_types(code);
CREATE INDEX IF NOT EXISTS idx_contract_type_active ON contract_types(active) WHERE active = TRUE;

CREATE TRIGGER update_contract_types_updated_at
    BEFORE UPDATE ON contract_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Seed contract types
-- =============================================================================
INSERT INTO contract_types (id, code, name, description, sequence, active, requires_lawyer_approval, requires_management_approval, requires_finance_approval)
VALUES
    (uuid_generate_v4(), 'GENERAL', 'Генеральный подряд', 'Договор генерального подряда на выполнение строительных работ', 1, TRUE, TRUE, TRUE, TRUE),
    (uuid_generate_v4(), 'SUBCONTRACT', 'Субподряд', 'Договор субподряда на выполнение отдельных видов работ', 2, TRUE, TRUE, TRUE, TRUE),
    (uuid_generate_v4(), 'SUPPLY', 'Поставка материалов', 'Договор поставки строительных материалов и оборудования', 3, TRUE, TRUE, FALSE, TRUE),
    (uuid_generate_v4(), 'SERVICE', 'Оказание услуг', 'Договор возмездного оказания услуг', 4, TRUE, TRUE, TRUE, FALSE),
    (uuid_generate_v4(), 'LEASE', 'Аренда техники', 'Договор аренды строительной техники и оборудования', 5, TRUE, FALSE, TRUE, TRUE);

-- =============================================================================
-- Contracts table
-- =============================================================================
CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    number              VARCHAR(50) UNIQUE,
    contract_date       DATE,
    partner_id          UUID,
    partner_name        VARCHAR(500),
    project_id          UUID REFERENCES projects(id),
    type_id             UUID REFERENCES contract_types(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    amount              NUMERIC(18, 2),
    vat_rate            NUMERIC(5, 2) DEFAULT 20.00,
    vat_amount          NUMERIC(18, 2),
    total_with_vat      NUMERIC(18, 2),
    payment_terms       TEXT,
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,
    responsible_id      UUID REFERENCES users(id),
    retention_percent   NUMERIC(5, 2) DEFAULT 0,
    doc_version         INTEGER NOT NULL DEFAULT 1,
    version_comment     TEXT,
    parent_version_id   UUID REFERENCES contracts(id),
    rejection_reason    TEXT,
    total_invoiced      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_paid          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_contract_status CHECK (status IN (
        'DRAFT', 'ON_APPROVAL', 'LAWYER_APPROVED', 'MANAGEMENT_APPROVED',
        'FINANCE_APPROVED', 'APPROVED', 'SIGNED', 'ACTIVE', 'CLOSED', 'REJECTED', 'CANCELLED'
    )),
    CONSTRAINT chk_contract_amount_positive CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT chk_contract_vat_rate CHECK (vat_rate IS NULL OR (vat_rate >= 0 AND vat_rate <= 100)),
    CONSTRAINT chk_contract_retention CHECK (retention_percent IS NULL OR (retention_percent >= 0 AND retention_percent <= 100)),
    CONSTRAINT chk_contract_planned_dates CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date),
    CONSTRAINT chk_contract_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

CREATE INDEX IF NOT EXISTS idx_contract_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_partner ON contracts(partner_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_type ON contracts(type_id);
CREATE INDEX IF NOT EXISTS idx_contract_responsible ON contracts(responsible_id);
CREATE INDEX IF NOT EXISTS idx_contract_number ON contracts(number);
CREATE INDEX IF NOT EXISTS idx_contract_planned_end ON contracts(planned_end_date);
CREATE INDEX IF NOT EXISTS idx_contract_active ON contracts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Contract approvals table
-- =============================================================================
CREATE TABLE contract_approvals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    stage               VARCHAR(50) NOT NULL,
    approver_id         UUID REFERENCES users(id),
    approver_name       VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_at         TIMESTAMP WITH TIME ZONE,
    rejected_at         TIMESTAMP WITH TIME ZONE,
    rejection_reason    TEXT,
    comment             TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_approval_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_approval_stage CHECK (stage IN ('lawyer', 'management', 'finance'))
);

CREATE INDEX IF NOT EXISTS idx_contract_approval_contract ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approval_stage ON contract_approvals(contract_id, stage);
CREATE INDEX IF NOT EXISTS idx_contract_approval_approver ON contract_approvals(approver_id);

CREATE TRIGGER update_contract_approvals_updated_at
    BEFORE UPDATE ON contract_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
