-- =============================================================================
-- V39: Extended Contract Management tables
-- Supplements, Claims, SLA, Legal, Tolerances, Guarantees, Milestones, Insurance
-- =============================================================================

-- Sequence for claim codes (CLM-00001, CLM-00002, etc.)
CREATE SEQUENCE IF NOT EXISTS contract_claim_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Contract Supplements (Дополнительные соглашения)
-- =============================================================================
CREATE TABLE contract_supplements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    number              VARCHAR(100) NOT NULL,
    supplement_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    reason              VARCHAR(500),
    description         TEXT,
    amount_change       NUMERIC(18, 2) DEFAULT 0,
    new_total_amount    NUMERIC(18, 2),
    deadline_change     INTEGER,
    new_deadline        DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    signed_at           TIMESTAMP WITH TIME ZONE,
    signatories         JSONB DEFAULT '[]'::jsonb,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_supplement_status CHECK (status IN ('DRAFT', 'APPROVED', 'SIGNED'))
);

CREATE INDEX IF NOT EXISTS idx_supplement_contract ON contract_supplements(contract_id);
CREATE INDEX IF NOT EXISTS idx_supplement_status ON contract_supplements(status);
CREATE INDEX IF NOT EXISTS idx_supplement_active ON contract_supplements(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_contract_supplements_updated_at
    BEFORE UPDATE ON contract_supplements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Contract Claims (Претензии)
-- =============================================================================
CREATE TABLE contract_claims (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    code                VARCHAR(20) NOT NULL UNIQUE,
    claim_type          VARCHAR(30) NOT NULL,
    subject             VARCHAR(500) NOT NULL,
    description         TEXT,
    amount              NUMERIC(18, 2),
    evidence_urls       JSONB DEFAULT '[]'::jsonb,
    filed_by_id         UUID REFERENCES users(id),
    filed_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at        TIMESTAMP WITH TIME ZONE,
    response_text       TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'FILED',
    resolved_at         TIMESTAMP WITH TIME ZONE,
    resolution_notes    TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_claim_type CHECK (claim_type IN ('DELAY', 'DEFECT', 'OVERPAYMENT', 'WARRANTY', 'PENALTY')),
    CONSTRAINT chk_claim_status CHECK (status IN ('FILED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'RESOLVED')),
    CONSTRAINT chk_claim_amount_positive CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_claim_contract ON contract_claims(contract_id);
CREATE INDEX IF NOT EXISTS idx_claim_status ON contract_claims(status);
CREATE INDEX IF NOT EXISTS idx_claim_code ON contract_claims(code);
CREATE INDEX IF NOT EXISTS idx_claim_type ON contract_claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claim_active ON contract_claims(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_contract_claims_updated_at
    BEFORE UPDATE ON contract_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Contract SLA (Соглашения об уровне обслуживания)
-- =============================================================================
CREATE TABLE contract_slas (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    metric              VARCHAR(200) NOT NULL,
    target_value        NUMERIC(18, 4) NOT NULL,
    unit                VARCHAR(50) NOT NULL,
    measurement_period  VARCHAR(50),
    penalty_amount      NUMERIC(18, 2),
    penalty_type        VARCHAR(20),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sla_penalty_type CHECK (penalty_type IS NULL OR penalty_type IN ('FIXED', 'PERCENTAGE', 'DAILY'))
);

CREATE INDEX IF NOT EXISTS idx_sla_contract ON contract_slas(contract_id);
CREATE INDEX IF NOT EXISTS idx_sla_active ON contract_slas(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_contract_slas_updated_at
    BEFORE UPDATE ON contract_slas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SLA Violations (Нарушения SLA)
-- =============================================================================
CREATE TABLE sla_violations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sla_id              UUID NOT NULL REFERENCES contract_slas(id) ON DELETE CASCADE,
    violation_date      DATE NOT NULL,
    actual_value        NUMERIC(18, 4) NOT NULL,
    penalty_amount      NUMERIC(18, 2),
    status              VARCHAR(20) NOT NULL DEFAULT 'DETECTED',
    notified_at         TIMESTAMP WITH TIME ZONE,
    resolved_at         TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_violation_status CHECK (status IN ('DETECTED', 'NOTIFIED', 'ACKNOWLEDGED', 'RESOLVED'))
);

CREATE INDEX IF NOT EXISTS idx_violation_sla ON sla_violations(sla_id);
CREATE INDEX IF NOT EXISTS idx_violation_status ON sla_violations(status);
CREATE INDEX IF NOT EXISTS idx_violation_date ON sla_violations(violation_date);

CREATE TRIGGER update_sla_violations_updated_at
    BEFORE UPDATE ON sla_violations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Contract Guarantees (Гарантии)
-- =============================================================================
CREATE TABLE contract_guarantees (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    guarantee_type      VARCHAR(30) NOT NULL,
    amount              NUMERIC(18, 2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'RUB',
    issued_by           VARCHAR(500),
    issued_at           DATE,
    expires_at          DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    document_url        VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_guarantee_type CHECK (guarantee_type IN ('BANK', 'INSURANCE', 'DEPOSIT', 'WARRANTY')),
    CONSTRAINT chk_guarantee_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CLAIMED', 'RETURNED')),
    CONSTRAINT chk_guarantee_amount_positive CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_guarantee_contract ON contract_guarantees(contract_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_status ON contract_guarantees(status);
CREATE INDEX IF NOT EXISTS idx_guarantee_expires ON contract_guarantees(expires_at);

CREATE TRIGGER update_contract_guarantees_updated_at
    BEFORE UPDATE ON contract_guarantees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Contract Milestones (Вехи контракта)
-- =============================================================================
CREATE TABLE contract_milestones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    due_date            DATE NOT NULL,
    completion_criteria TEXT,
    amount              NUMERIC(18, 2),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    completed_at        TIMESTAMP WITH TIME ZONE,
    evidence_url        VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_milestone_status CHECK (status IN ('PENDING', 'COMPLETED', 'OVERDUE')),
    CONSTRAINT chk_milestone_amount_positive CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_milestone_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON contract_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestone_due_date ON contract_milestones(due_date);

CREATE TRIGGER update_contract_milestones_updated_at
    BEFORE UPDATE ON contract_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Legal Cases (Судебные дела)
-- =============================================================================
CREATE TABLE legal_cases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID REFERENCES projects(id),
    contract_id         UUID REFERENCES contracts(id),
    case_number         VARCHAR(100) NOT NULL,
    court               VARCHAR(500) NOT NULL,
    subject             TEXT NOT NULL,
    claim_amount        NUMERIC(18, 2),
    status              VARCHAR(20) NOT NULL DEFAULT 'PREPARATION',
    filed_at            DATE,
    next_hearing_date   DATE,
    lawyer_id           UUID REFERENCES users(id),
    result              TEXT,
    awarded_amount      NUMERIC(18, 2),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_legal_case_status CHECK (status IN ('PREPARATION', 'FILED', 'HEARING', 'DECIDED', 'APPEAL', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_legal_case_project ON legal_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_contract ON legal_cases(contract_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_status ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_case_number ON legal_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_legal_case_hearing ON legal_cases(next_hearing_date);

CREATE TRIGGER update_legal_cases_updated_at
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Legal Documents (Документы судебных дел)
-- =============================================================================
CREATE TABLE legal_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    document_type       VARCHAR(100) NOT NULL,
    file_url            VARCHAR(1000) NOT NULL,
    uploaded_by_id      UUID REFERENCES users(id),
    uploaded_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_legal_doc_case ON legal_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_doc_type ON legal_documents(document_type);

CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tolerances (Допуски)
-- =============================================================================
CREATE TABLE tolerances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID REFERENCES projects(id),
    work_type           VARCHAR(200) NOT NULL,
    parameter           VARCHAR(200) NOT NULL,
    nominal_value       NUMERIC(18, 4) NOT NULL,
    unit                VARCHAR(50) NOT NULL,
    min_deviation       NUMERIC(18, 4) NOT NULL,
    max_deviation       NUMERIC(18, 4) NOT NULL,
    measurement_method  VARCHAR(200),
    reference_standard  VARCHAR(200),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tolerance_project ON tolerances(project_id);
CREATE INDEX IF NOT EXISTS idx_tolerance_work_type ON tolerances(work_type);

CREATE TRIGGER update_tolerances_updated_at
    BEFORE UPDATE ON tolerances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tolerance Checks (Проверки допусков)
-- =============================================================================
CREATE TABLE tolerance_checks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tolerance_id        UUID NOT NULL REFERENCES tolerances(id) ON DELETE CASCADE,
    measured_value      NUMERIC(18, 4) NOT NULL,
    is_within_tolerance BOOLEAN NOT NULL DEFAULT TRUE,
    measured_by_id      UUID REFERENCES users(id),
    measured_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location            VARCHAR(500),
    notes               TEXT,
    evidence_url        VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tol_check_tolerance ON tolerance_checks(tolerance_id);
CREATE INDEX IF NOT EXISTS idx_tol_check_within ON tolerance_checks(is_within_tolerance);
CREATE INDEX IF NOT EXISTS idx_tol_check_measured_at ON tolerance_checks(measured_at);

CREATE TRIGGER update_tolerance_checks_updated_at
    BEFORE UPDATE ON tolerance_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Contract Insurance (Страхование контрактов)
-- =============================================================================
CREATE TABLE contract_insurances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    policy_number       VARCHAR(100) NOT NULL,
    insurance_type      VARCHAR(100) NOT NULL,
    insurer             VARCHAR(500) NOT NULL,
    covered_amount      NUMERIC(18, 2) NOT NULL,
    premium_amount      NUMERIC(18, 2),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    policy_url          VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_insurance_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CLAIMED', 'CANCELLED')),
    CONSTRAINT chk_insurance_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_insurance_covered_positive CHECK (covered_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_insurance_contract ON contract_insurances(contract_id);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON contract_insurances(status);
CREATE INDEX IF NOT EXISTS idx_insurance_end_date ON contract_insurances(end_date);

CREATE TRIGGER update_contract_insurances_updated_at
    BEFORE UPDATE ON contract_insurances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
