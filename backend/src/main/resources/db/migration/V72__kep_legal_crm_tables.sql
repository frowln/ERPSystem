-- =============================================================================
-- V72: KEP (Qualified Electronic Signature), Legal, and CRM tables
-- =============================================================================

-- =============================================================================
-- KEP MODULE: kep_certificates
-- =============================================================================
CREATE TABLE IF NOT EXISTS kep_certificates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES users(id),
    owner_name          VARCHAR(500) NOT NULL,
    serial_number       VARCHAR(100) NOT NULL,
    issuer              VARCHAR(500) NOT NULL,
    valid_from          TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to            TIMESTAMP WITH TIME ZONE NOT NULL,
    thumbprint          VARCHAR(100) NOT NULL,
    subject_cn          VARCHAR(500),
    subject_org         VARCHAR(500),
    subject_inn         VARCHAR(20),
    subject_ogrn        VARCHAR(20),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    certificate_data    TEXT,
    is_qualified        BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_kep_cert_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED')),
    CONSTRAINT chk_kep_cert_valid_dates CHECK (valid_to >= valid_from)
);

CREATE INDEX IF NOT EXISTS idx_kep_cert_owner ON kep_certificates(owner_id);
CREATE INDEX IF NOT EXISTS idx_kep_cert_status ON kep_certificates(status);
CREATE INDEX IF NOT EXISTS idx_kep_cert_serial ON kep_certificates(serial_number);
CREATE INDEX IF NOT EXISTS idx_kep_cert_thumbprint ON kep_certificates(thumbprint);
CREATE INDEX IF NOT EXISTS idx_kep_cert_valid_to ON kep_certificates(valid_to);
CREATE INDEX IF NOT EXISTS idx_kep_cert_inn ON kep_certificates(subject_inn);
CREATE INDEX IF NOT EXISTS idx_kep_cert_active ON kep_certificates(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_kep_certificates_updated_at ON kep_certificates;
CREATE TRIGGER update_kep_certificates_updated_at
    BEFORE UPDATE ON kep_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KEP MODULE: kep_signatures
-- =============================================================================
CREATE TABLE IF NOT EXISTS kep_signatures (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id      UUID NOT NULL REFERENCES kep_certificates(id),
    document_model      VARCHAR(100) NOT NULL,
    document_id         UUID NOT NULL,
    signed_at           TIMESTAMP WITH TIME ZONE NOT NULL,
    signature_data      TEXT NOT NULL,
    signature_hash      VARCHAR(255),
    is_valid            BOOLEAN NOT NULL DEFAULT TRUE,
    validation_message  TEXT,
    signer_name         VARCHAR(500),
    signer_position     VARCHAR(300),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kep_sig_certificate ON kep_signatures(certificate_id);
CREATE INDEX IF NOT EXISTS idx_kep_sig_document ON kep_signatures(document_model, document_id);
CREATE INDEX IF NOT EXISTS idx_kep_sig_signed_at ON kep_signatures(signed_at);
CREATE INDEX IF NOT EXISTS idx_kep_sig_hash ON kep_signatures(signature_hash);
CREATE INDEX IF NOT EXISTS idx_kep_sig_active ON kep_signatures(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_kep_signatures_updated_at ON kep_signatures;
CREATE TRIGGER update_kep_signatures_updated_at
    BEFORE UPDATE ON kep_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KEP MODULE: kep_signing_requests
-- =============================================================================
CREATE TABLE kep_signing_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_model      VARCHAR(100) NOT NULL,
    document_id         UUID NOT NULL,
    document_title      VARCHAR(500),
    requester_id        UUID NOT NULL REFERENCES users(id),
    signer_id           UUID NOT NULL REFERENCES users(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date            DATE,
    signed_at           TIMESTAMP WITH TIME ZONE,
    rejection_reason    TEXT,
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_kep_req_status CHECK (status IN ('PENDING', 'SIGNED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT chk_kep_req_priority CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT'))
);

CREATE INDEX IF NOT EXISTS idx_kep_req_document ON kep_signing_requests(document_model, document_id);
CREATE INDEX IF NOT EXISTS idx_kep_req_requester ON kep_signing_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_kep_req_signer ON kep_signing_requests(signer_id);
CREATE INDEX IF NOT EXISTS idx_kep_req_status ON kep_signing_requests(status);
CREATE INDEX IF NOT EXISTS idx_kep_req_due_date ON kep_signing_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_kep_req_priority ON kep_signing_requests(priority);
CREATE INDEX IF NOT EXISTS idx_kep_req_active ON kep_signing_requests(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_kep_signing_requests_updated_at
    BEFORE UPDATE ON kep_signing_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KEP MODULE: kep_configs
-- =============================================================================
CREATE TABLE kep_configs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_type       VARCHAR(30) NOT NULL,
    api_endpoint        VARCHAR(500),
    api_key             VARCHAR(500),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    settings            TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_kep_config_provider CHECK (provider_type IN ('CRYPTO_PRO', 'VIPNET', 'RUTOKEN', 'JACARTA'))
);

CREATE INDEX IF NOT EXISTS idx_kep_config_provider ON kep_configs(provider_type);
CREATE INDEX IF NOT EXISTS idx_kep_config_active ON kep_configs(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_kep_configs_updated_at
    BEFORE UPDATE ON kep_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- LEGAL MODULE: legal_cases
-- =============================================================================
CREATE TABLE IF NOT EXISTS legal_cases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number         VARCHAR(100),
    project_id          UUID REFERENCES projects(id),
    contract_id         UUID REFERENCES contracts(id),
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    case_type           VARCHAR(30) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    amount              NUMERIC(18, 2),
    currency            VARCHAR(10) DEFAULT 'RUB',
    responsible_id      UUID REFERENCES users(id),
    lawyer_id           UUID REFERENCES users(id),
    court_name          VARCHAR(500),
    filing_date         DATE,
    hearing_date        DATE,
    resolution_date     DATE,
    outcome             TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_legal_case_type CHECK (case_type IN ('CLAIM', 'DISPUTE', 'ARBITRATION', 'LAWSUIT', 'PRETRIAL')),
    CONSTRAINT chk_legal_case_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'HEARING', 'SETTLEMENT', 'CLOSED', 'WON', 'LOST')),
    CONSTRAINT chk_legal_case_amount CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_legal_case_number ON legal_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_legal_case_project ON legal_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_contract ON legal_cases(contract_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_status ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_case_type ON legal_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_legal_case_responsible ON legal_cases(responsible_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_lawyer ON legal_cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_hearing ON legal_cases(hearing_date);
CREATE INDEX IF NOT EXISTS idx_legal_case_filing ON legal_cases(filing_date);
CREATE INDEX IF NOT EXISTS idx_legal_case_active ON legal_cases(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_legal_cases_updated_at ON legal_cases;
CREATE TRIGGER update_legal_cases_updated_at
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- LEGAL MODULE: legal_decisions
-- =============================================================================
CREATE TABLE legal_decisions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id                 UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    decision_date           DATE NOT NULL,
    decision_type           VARCHAR(30) NOT NULL,
    summary                 TEXT,
    amount                  NUMERIC(18, 2),
    is_enforceable          BOOLEAN NOT NULL DEFAULT FALSE,
    enforcement_deadline    DATE,
    file_url                VARCHAR(1000),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_legal_decision_type CHECK (decision_type IN ('COURT_ORDER', 'SETTLEMENT', 'MEDIATION', 'RULING')),
    CONSTRAINT chk_legal_decision_amount CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_legal_decision_case ON legal_decisions(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_decision_date ON legal_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_legal_decision_type ON legal_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_legal_decision_enforceable ON legal_decisions(is_enforceable);
CREATE INDEX IF NOT EXISTS idx_legal_decision_active ON legal_decisions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_legal_decisions_updated_at
    BEFORE UPDATE ON legal_decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- LEGAL MODULE: legal_remarks
-- =============================================================================
CREATE TABLE legal_remarks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL REFERENCES users(id),
    remark_date         DATE NOT NULL,
    content             TEXT NOT NULL,
    remark_type         VARCHAR(30) NOT NULL,
    is_confidential     BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_legal_remark_type CHECK (remark_type IN ('INTERNAL_NOTE', 'LAWYER_OPINION', 'EXPERT_CONCLUSION', 'CLIENT_INSTRUCTION'))
);

CREATE INDEX IF NOT EXISTS idx_legal_remark_case ON legal_remarks(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_remark_author ON legal_remarks(author_id);
CREATE INDEX IF NOT EXISTS idx_legal_remark_type ON legal_remarks(remark_type);
CREATE INDEX IF NOT EXISTS idx_legal_remark_date ON legal_remarks(remark_date);
CREATE INDEX IF NOT EXISTS idx_legal_remark_active ON legal_remarks(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_legal_remarks_updated_at
    BEFORE UPDATE ON legal_remarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- LEGAL MODULE: contract_legal_templates
-- =============================================================================
CREATE TABLE contract_legal_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(300) NOT NULL,
    template_type       VARCHAR(30) NOT NULL,
    category            VARCHAR(100),
    content             TEXT NOT NULL,
    variables           TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    template_version    INTEGER NOT NULL DEFAULT 1,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_legal_template_type CHECK (template_type IN ('CONTRACT', 'SUPPLEMENT', 'CLAIM', 'PRETRIAL_LETTER', 'POWER_OF_ATTORNEY')),
    CONSTRAINT chk_legal_template_version CHECK (template_version > 0)
);

CREATE INDEX IF NOT EXISTS idx_legal_template_type ON contract_legal_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_legal_template_category ON contract_legal_templates(category);
CREATE INDEX IF NOT EXISTS idx_legal_template_active ON contract_legal_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_legal_template_name ON contract_legal_templates(name);

CREATE TRIGGER update_contract_legal_templates_updated_at
    BEFORE UPDATE ON contract_legal_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CRM MODULE: crm_stages
-- =============================================================================
CREATE TABLE crm_stages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    sequence            INTEGER NOT NULL DEFAULT 0,
    probability         INTEGER NOT NULL DEFAULT 0,
    is_closed           BOOLEAN NOT NULL DEFAULT FALSE,
    is_won              BOOLEAN NOT NULL DEFAULT FALSE,
    requirements        TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_crm_stage_probability CHECK (probability >= 0 AND probability <= 100)
);

CREATE INDEX IF NOT EXISTS idx_crm_stage_sequence ON crm_stages(sequence);
CREATE INDEX IF NOT EXISTS idx_crm_stage_closed ON crm_stages(is_closed);
CREATE INDEX IF NOT EXISTS idx_crm_stage_won ON crm_stages(is_won);

CREATE TRIGGER update_crm_stages_updated_at
    BEFORE UPDATE ON crm_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default CRM stages
INSERT INTO crm_stages (id, name, sequence, probability, is_closed, is_won) VALUES
    (uuid_generate_v4(), 'Новый', 1, 10, FALSE, FALSE),
    (uuid_generate_v4(), 'Квалификация', 2, 25, FALSE, FALSE),
    (uuid_generate_v4(), 'Предложение', 3, 50, FALSE, FALSE),
    (uuid_generate_v4(), 'Переговоры', 4, 75, FALSE, FALSE),
    (uuid_generate_v4(), 'Выигран', 5, 100, TRUE, TRUE),
    (uuid_generate_v4(), 'Проигран', 6, 0, TRUE, FALSE);

-- =============================================================================
-- CRM MODULE: crm_leads
-- =============================================================================
CREATE TABLE crm_leads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(300) NOT NULL,
    partner_name        VARCHAR(300),
    email               VARCHAR(255),
    phone               VARCHAR(50),
    company_name        VARCHAR(500),
    source              VARCHAR(100),
    medium              VARCHAR(100),
    stage_id            UUID REFERENCES crm_stages(id),
    assigned_to_id      UUID REFERENCES users(id),
    expected_revenue    NUMERIC(18, 2),
    probability         INTEGER NOT NULL DEFAULT 0,
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'NEW',
    lost_reason         TEXT,
    won_date            DATE,
    project_id          UUID REFERENCES projects(id),
    next_activity_date  DATE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_crm_lead_status CHECK (status IN ('NEW', 'QUALIFIED', 'PROPOSITION', 'WON', 'LOST')),
    CONSTRAINT chk_crm_lead_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH')),
    CONSTRAINT chk_crm_lead_probability CHECK (probability >= 0 AND probability <= 100),
    CONSTRAINT chk_crm_lead_revenue CHECK (expected_revenue IS NULL OR expected_revenue >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_lead_stage ON crm_leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_assigned ON crm_leads(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_priority ON crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_lead_project ON crm_leads(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_company ON crm_leads(company_name);
CREATE INDEX IF NOT EXISTS idx_crm_lead_won_date ON crm_leads(won_date);
CREATE INDEX IF NOT EXISTS idx_crm_lead_next_activity ON crm_leads(next_activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_lead_active ON crm_leads(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_crm_leads_updated_at
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CRM MODULE: crm_teams
-- =============================================================================
CREATE TABLE crm_teams (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    leader_id           UUID REFERENCES users(id),
    member_ids          TEXT,
    target_revenue      NUMERIC(18, 2),
    color               VARCHAR(20),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_crm_team_revenue CHECK (target_revenue IS NULL OR target_revenue >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crm_team_leader ON crm_teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_crm_team_active ON crm_teams(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_crm_teams_updated_at
    BEFORE UPDATE ON crm_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CRM MODULE: crm_activities
-- =============================================================================
CREATE TABLE crm_activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    activity_type       VARCHAR(20) NOT NULL,
    user_id             UUID NOT NULL REFERENCES users(id),
    summary             VARCHAR(500),
    notes               TEXT,
    scheduled_at        TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    result              VARCHAR(500),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_crm_activity_type CHECK (activity_type IN ('CALL', 'MEETING', 'EMAIL', 'PROPOSAL', 'SITE_VISIT'))
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_lead ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_user ON crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_type ON crm_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activity_scheduled ON crm_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_activity_completed ON crm_activities(completed_at);
CREATE INDEX IF NOT EXISTS idx_crm_activity_active ON crm_activities(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_crm_activities_updated_at
    BEFORE UPDATE ON crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
