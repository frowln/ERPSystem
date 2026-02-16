-- =============================================================================
-- Self-Employed Module: Реестр выплат самозанятым
-- =============================================================================

-- =============================================================================
-- Self-Employed Contractors (Самозанятые исполнители)
-- =============================================================================
CREATE TABLE self_employed_contractors (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name               VARCHAR(500) NOT NULL,
    inn                     VARCHAR(12) NOT NULL UNIQUE,
    phone                   VARCHAR(20),
    email                   VARCHAR(255),
    bank_account            VARCHAR(20),
    bic                     VARCHAR(9),
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    registration_date       DATE NOT NULL,
    tax_status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    project_ids             TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_se_contractor_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED')),
    CONSTRAINT chk_se_contractor_tax_status CHECK (tax_status IN ('ACTIVE', 'REVOKED')),
    CONSTRAINT chk_se_contractor_inn CHECK (LENGTH(inn) = 12)
);

CREATE INDEX IF NOT EXISTS idx_se_contractor_inn ON self_employed_contractors(inn);
CREATE INDEX IF NOT EXISTS idx_se_contractor_status ON self_employed_contractors(status);
CREATE INDEX IF NOT EXISTS idx_se_contractor_tax_status ON self_employed_contractors(tax_status);
CREATE INDEX IF NOT EXISTS idx_se_contractor_name ON self_employed_contractors(full_name);
CREATE INDEX IF NOT EXISTS idx_se_contractor_not_deleted ON self_employed_contractors(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_self_employed_contractors_updated_at
    BEFORE UPDATE ON self_employed_contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Self-Employed Payments (Выплаты самозанятым)
-- =============================================================================
CREATE TABLE self_employed_payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id           UUID NOT NULL REFERENCES self_employed_contractors(id),
    project_id              UUID NOT NULL,
    contract_id             UUID,
    amount                  NUMERIC(18, 2) NOT NULL,
    description             VARCHAR(1000),
    service_date            DATE NOT NULL,
    payment_date            DATE,
    receipt_number          VARCHAR(100),
    receipt_url             VARCHAR(1000),
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    fiscal_receipt_checked  BOOLEAN NOT NULL DEFAULT FALSE,
    tax_period              VARCHAR(10),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_se_payment_status CHECK (status IN ('DRAFT', 'PENDING_RECEIPT', 'RECEIPT_RECEIVED', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_se_payment_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_se_payment_contractor ON self_employed_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_se_payment_project ON self_employed_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_se_payment_contract ON self_employed_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_se_payment_status ON self_employed_payments(status);
CREATE INDEX IF NOT EXISTS idx_se_payment_service_date ON self_employed_payments(service_date);
CREATE INDEX IF NOT EXISTS idx_se_payment_tax_period ON self_employed_payments(tax_period);
CREATE INDEX IF NOT EXISTS idx_se_payment_not_deleted ON self_employed_payments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_self_employed_payments_updated_at
    BEFORE UPDATE ON self_employed_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Self-Employed Registries (Реестры выплат самозанятым)
-- =============================================================================
CREATE TABLE self_employed_registries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    project_id              UUID NOT NULL,
    period_start            DATE NOT NULL,
    period_end              DATE NOT NULL,
    total_amount            NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_payments          INTEGER NOT NULL DEFAULT 0,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_se_registry_status CHECK (status IN ('DRAFT', 'GENERATED', 'SUBMITTED', 'APPROVED')),
    CONSTRAINT chk_se_registry_period CHECK (period_end >= period_start),
    CONSTRAINT chk_se_registry_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_se_registry_total_payments CHECK (total_payments >= 0)
);

CREATE INDEX IF NOT EXISTS idx_se_registry_project ON self_employed_registries(project_id);
CREATE INDEX IF NOT EXISTS idx_se_registry_status ON self_employed_registries(status);
CREATE INDEX IF NOT EXISTS idx_se_registry_period ON self_employed_registries(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_se_registry_not_deleted ON self_employed_registries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_self_employed_registries_updated_at
    BEFORE UPDATE ON self_employed_registries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
