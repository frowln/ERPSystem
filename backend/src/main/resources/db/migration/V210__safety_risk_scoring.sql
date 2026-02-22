-- Safety Risk Scoring Engine tables

CREATE TABLE safety_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    factors_json TEXT,
    recommendations_json TEXT,
    incident_count_30d INTEGER DEFAULT 0,
    violation_count_30d INTEGER DEFAULT 0,
    training_compliance_pct NUMERIC(5,2) DEFAULT 100,
    cert_expiry_ratio NUMERIC(5,2) DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_srs_org ON safety_risk_scores(organization_id);
CREATE INDEX idx_srs_project ON safety_risk_scores(project_id);
CREATE INDEX idx_srs_level ON safety_risk_scores(risk_level);
CREATE INDEX idx_srs_calculated ON safety_risk_scores(calculated_at);
CREATE UNIQUE INDEX idx_srs_org_project_active ON safety_risk_scores(organization_id, project_id) WHERE deleted = false AND valid_until IS NULL;

CREATE TABLE safety_risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    factor_type VARCHAR(50) NOT NULL,
    weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    raw_value NUMERIC(15,4),
    normalized_value NUMERIC(5,2),
    description TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_srf_org_project ON safety_risk_factors(organization_id, project_id);
CREATE INDEX idx_srf_type ON safety_risk_factors(factor_type);

CREATE TABLE safety_risk_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    report_week VARCHAR(20) NOT NULL,
    project_count INTEGER NOT NULL DEFAULT 0,
    avg_risk_score NUMERIC(5,2),
    critical_projects INTEGER DEFAULT 0,
    high_risk_projects INTEGER DEFAULT 0,
    top_recommendations_json TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_srr_org ON safety_risk_reports(organization_id);
CREATE INDEX idx_srr_week ON safety_risk_reports(report_week);
