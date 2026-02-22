-- =============================================================================
-- V206: Quality Gates at WBS Level
-- =============================================================================

-- =============================================================================
-- Quality Gates (Ворота качества на уровне WBS)
-- =============================================================================
CREATE TABLE quality_gates (
    id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id               UUID NOT NULL,
    project_id                    UUID NOT NULL,
    wbs_node_id                   UUID NOT NULL,
    name                          VARCHAR(500) NOT NULL,
    description                   TEXT,
    required_documents_json       TEXT,
    required_quality_checks_json  TEXT,
    volume_threshold_percent      INTEGER,
    status                        VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    doc_completion_percent        INTEGER DEFAULT 0,
    quality_completion_percent    INTEGER DEFAULT 0,
    volume_completion_percent     INTEGER DEFAULT 0,
    blocked_reason                TEXT,
    passed_at                     TIMESTAMP WITH TIME ZONE,
    passed_by                     UUID,
    deleted                       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                    VARCHAR(255),
    updated_by                    VARCHAR(255),
    version                       BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_qg_status CHECK (status IN (
        'NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'PASSED', 'FAILED'
    )),
    CONSTRAINT chk_qg_volume_threshold CHECK (
        volume_threshold_percent IS NULL OR (volume_threshold_percent >= 0 AND volume_threshold_percent <= 100)
    )
);

CREATE INDEX idx_qg_project ON quality_gates(project_id);
CREATE INDEX idx_qg_wbs_node ON quality_gates(wbs_node_id);
CREATE INDEX idx_qg_status ON quality_gates(status);
CREATE INDEX idx_qg_org ON quality_gates(organization_id);
CREATE INDEX idx_qg_active ON quality_gates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_quality_gates_updated_at
    BEFORE UPDATE ON quality_gates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Quality Gate Templates (Шаблоны ворот качества)
-- =============================================================================
CREATE TABLE quality_gate_templates (
    id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id               UUID NOT NULL,
    project_template_id           UUID,
    name                          VARCHAR(500) NOT NULL,
    description                   TEXT,
    wbs_level_pattern             VARCHAR(50),
    required_documents_json       TEXT,
    required_quality_checks_json  TEXT,
    volume_threshold_percent      INTEGER,
    deleted                       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                    VARCHAR(255),
    updated_by                    VARCHAR(255),
    version                       BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_qgt_volume_threshold CHECK (
        volume_threshold_percent IS NULL OR (volume_threshold_percent >= 0 AND volume_threshold_percent <= 100)
    )
);

CREATE INDEX idx_qgt_org ON quality_gate_templates(organization_id);
CREATE INDEX idx_qgt_project_template ON quality_gate_templates(project_template_id);
CREATE INDEX idx_qgt_active ON quality_gate_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_quality_gate_templates_updated_at
    BEFORE UPDATE ON quality_gate_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
