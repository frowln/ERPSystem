-- =============================================================================
-- Tax Risk Assessment Module: Оценка риска налоговой проверки
-- =============================================================================

-- =============================================================================
-- Tax Risk Assessments (Оценки налогового риска)
-- =============================================================================
CREATE TABLE tax_risk_assessments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    code                    VARCHAR(50) UNIQUE,
    project_id              UUID,
    organization_id         UUID,
    assessment_date         DATE,
    assessor                VARCHAR(255),
    risk_level              VARCHAR(20),
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    overall_score           NUMERIC(5, 2) NOT NULL DEFAULT 0,
    description             TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_tax_risk_assess_status CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    CONSTRAINT chk_tax_risk_assess_risk_level CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_tax_risk_assess_score CHECK (overall_score >= 0 AND overall_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_project ON tax_risk_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_org ON tax_risk_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_code ON tax_risk_assessments(code);
CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_status ON tax_risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_risk_level ON tax_risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_date ON tax_risk_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_tax_risk_assess_not_deleted ON tax_risk_assessments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_tax_risk_assessments_updated_at
    BEFORE UPDATE ON tax_risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tax Risk Factors (Факторы налогового риска)
-- =============================================================================
CREATE TABLE tax_risk_factors (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id           UUID NOT NULL REFERENCES tax_risk_assessments(id),
    factor_name             VARCHAR(500) NOT NULL,
    factor_category         VARCHAR(20) NOT NULL,
    weight                  NUMERIC(5, 2) NOT NULL DEFAULT 1,
    score                   NUMERIC(5, 2) NOT NULL DEFAULT 0,
    weighted_score          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description             TEXT,
    recommendation          TEXT,
    evidence                TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_tax_risk_factor_category CHECK (factor_category IN ('COUNTERPARTY', 'TRANSACTION', 'DOCUMENT', 'PRICING', 'STRUCTURE')),
    CONSTRAINT chk_tax_risk_factor_weight CHECK (weight >= 0),
    CONSTRAINT chk_tax_risk_factor_score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT chk_tax_risk_factor_weighted CHECK (weighted_score >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tax_risk_factor_assessment ON tax_risk_factors(assessment_id);
CREATE INDEX IF NOT EXISTS idx_tax_risk_factor_category ON tax_risk_factors(factor_category);
CREATE INDEX IF NOT EXISTS idx_tax_risk_factor_not_deleted ON tax_risk_factors(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_tax_risk_factors_updated_at
    BEFORE UPDATE ON tax_risk_factors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tax Risk Mitigations (Меры по снижению налогового риска)
-- =============================================================================
CREATE TABLE tax_risk_mitigations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id           UUID NOT NULL REFERENCES tax_risk_assessments(id),
    factor_id               UUID REFERENCES tax_risk_factors(id),
    action                  VARCHAR(1000) NOT NULL,
    responsible             VARCHAR(255),
    deadline                DATE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    result                  TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_tax_risk_mitig_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_tax_risk_mitig_assessment ON tax_risk_mitigations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_tax_risk_mitig_factor ON tax_risk_mitigations(factor_id);
CREATE INDEX IF NOT EXISTS idx_tax_risk_mitig_status ON tax_risk_mitigations(status);
CREATE INDEX IF NOT EXISTS idx_tax_risk_mitig_deadline ON tax_risk_mitigations(deadline);
CREATE INDEX IF NOT EXISTS idx_tax_risk_mitig_not_deleted ON tax_risk_mitigations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_tax_risk_mitigations_updated_at
    BEFORE UPDATE ON tax_risk_mitigations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
