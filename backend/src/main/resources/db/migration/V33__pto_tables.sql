-- =============================================================================
-- V33: PTO (Производственно-Технический Отдел) module tables
-- =============================================================================

-- ===================== PTO Documents =====================
CREATE TABLE pto_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID        NOT NULL,
    code            VARCHAR(50) NOT NULL,
    title           VARCHAR(500) NOT NULL,
    document_type   VARCHAR(30) NOT NULL,
    discipline      VARCHAR(30),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    current_version INT         NOT NULL DEFAULT 1,
    approved_by_id  UUID,
    approved_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT      NOT NULL DEFAULT 0,
    deleted         BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_pto_document_code UNIQUE (code)
);

CREATE INDEX idx_pto_doc_project ON pto_documents (project_id);
CREATE INDEX idx_pto_doc_status ON pto_documents (status);
CREATE INDEX idx_pto_doc_type ON pto_documents (document_type);
CREATE INDEX idx_pto_doc_discipline ON pto_documents (discipline);

-- ===================== PTO Document Versions =====================
CREATE TABLE pto_document_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID         NOT NULL REFERENCES pto_documents (id) ON DELETE CASCADE,
    version_number      INT          NOT NULL,
    file_url            VARCHAR(1000),
    change_description  TEXT,
    uploaded_by_id      UUID,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT       NOT NULL DEFAULT 0,
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_pto_doc_version UNIQUE (document_id, version_number)
);

CREATE INDEX idx_pto_doc_ver_document ON pto_document_versions (document_id);

-- ===================== Work Permits =====================
CREATE TABLE work_permits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID         NOT NULL,
    code            VARCHAR(50)  NOT NULL,
    work_type       VARCHAR(30)  NOT NULL,
    location        VARCHAR(500),
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    issued_by_id    UUID,
    approved_by_id  UUID,
    safety_measures JSONB,
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_work_permit_code UNIQUE (code),
    CONSTRAINT chk_work_permit_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_work_permit_project ON work_permits (project_id);
CREATE INDEX idx_work_permit_status ON work_permits (status);

-- ===================== Acts of Osvidetelstvovanie (Акты освидетельствования) =====================
CREATE TABLE acts_osvidetelstvovanie (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID         NOT NULL,
    code            VARCHAR(50)  NOT NULL,
    work_type       VARCHAR(30)  NOT NULL,
    volume          NUMERIC(16, 3),
    unit            VARCHAR(20),
    start_date      DATE,
    end_date        DATE,
    responsible_id  UUID,
    inspector_id    UUID,
    result          VARCHAR(20),
    comments        TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_act_osvid_code UNIQUE (code)
);

CREATE INDEX idx_act_osvid_project ON acts_osvidetelstvovanie (project_id);
CREATE INDEX idx_act_osvid_status ON acts_osvidetelstvovanie (status);

-- ===================== Executive Schemes (Исполнительные схемы) =====================
CREATE TABLE executive_schemes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL,
    code            VARCHAR(50)   NOT NULL,
    name            VARCHAR(500)  NOT NULL,
    work_type       VARCHAR(30)   NOT NULL,
    file_url        VARCHAR(1000),
    scale           VARCHAR(50),
    geodata_json    JSONB,
    created_by_id   UUID,
    verified_by_id  UUID,
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_exec_scheme_code UNIQUE (code)
);

CREATE INDEX idx_exec_scheme_project ON executive_schemes (project_id);
CREATE INDEX idx_exec_scheme_status ON executive_schemes (status);

-- ===================== Technical Solutions (Технические решения) =====================
CREATE TABLE technical_solutions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL,
    code            VARCHAR(50)   NOT NULL,
    problem         TEXT          NOT NULL,
    solution        TEXT          NOT NULL,
    justification   TEXT,
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    author_id       UUID,
    approved_by_id  UUID,
    cost            NUMERIC(18, 2),
    drawing_url     VARCHAR(1000),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_tech_solution_code UNIQUE (code)
);

CREATE INDEX idx_tech_solution_project ON technical_solutions (project_id);
CREATE INDEX idx_tech_solution_status ON technical_solutions (status);

-- ===================== Material Certificates (Сертификаты материалов) =====================
CREATE TABLE material_certificates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID,
    material_name       VARCHAR(500) NOT NULL,
    supplier            VARCHAR(500),
    certificate_number  VARCHAR(100) NOT NULL,
    certificate_type    VARCHAR(10)  NOT NULL,
    valid_from          DATE,
    valid_to            DATE,
    file_url            VARCHAR(1000),
    verified_by_id      UUID,
    is_valid            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT       NOT NULL DEFAULT 0,
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_mat_cert_project ON material_certificates (project_id);
CREATE INDEX idx_mat_cert_type ON material_certificates (certificate_type);
CREATE INDEX idx_mat_cert_valid ON material_certificates (is_valid);

-- ===================== Lab Tests (Лабораторные испытания) =====================
CREATE TABLE lab_tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL,
    code            VARCHAR(50)   NOT NULL,
    material_name   VARCHAR(500)  NOT NULL,
    test_type       VARCHAR(30)   NOT NULL,
    sample_number   VARCHAR(100),
    test_date       DATE          NOT NULL,
    result          VARCHAR(500),
    conclusion      VARCHAR(20)   NOT NULL,
    protocol_url    VARCHAR(1000),
    lab_name        VARCHAR(500),
    performed_by_id UUID,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_lab_test_code UNIQUE (code)
);

CREATE INDEX idx_lab_test_project ON lab_tests (project_id);
CREATE INDEX idx_lab_test_conclusion ON lab_tests (conclusion);

-- ===================== Submittals (Передача документации) =====================
CREATE TABLE submittals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL,
    code            VARCHAR(50)   NOT NULL,
    title           VARCHAR(500)  NOT NULL,
    submittal_type  VARCHAR(30)   NOT NULL,
    description     TEXT,
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    submitted_by_id UUID,
    reviewed_by_id  UUID,
    due_date        DATE,
    response_date   DATE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_submittal_code UNIQUE (code)
);

CREATE INDEX idx_submittal_project ON submittals (project_id);
CREATE INDEX idx_submittal_status ON submittals (status);
CREATE INDEX idx_submittal_type ON submittals (submittal_type);

-- ===================== Submittal Comments =====================
CREATE TABLE submittal_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id    UUID          NOT NULL REFERENCES submittals (id) ON DELETE CASCADE,
    author_id       UUID,
    content         TEXT          NOT NULL,
    attachment_url  VARCHAR(1000),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sub_comment_submittal ON submittal_comments (submittal_id);

-- ===================== As-Built Documents (Исполнительная документация) =====================
CREATE TABLE as_built_docs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID          NOT NULL,
    code                VARCHAR(50)   NOT NULL,
    title               VARCHAR(500)  NOT NULL,
    work_type           VARCHAR(30)   NOT NULL,
    original_drawing_id UUID,
    asbuilt_url         VARCHAR(1000),
    deviations          TEXT,
    accepted_by_id      UUID,
    status              VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT        NOT NULL DEFAULT 0,
    deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_asbuilt_code UNIQUE (code)
);

CREATE INDEX idx_asbuilt_project ON as_built_docs (project_id);
CREATE INDEX idx_asbuilt_status ON as_built_docs (status);

-- ===================== Quality Plans (Планы качества) =====================
CREATE TABLE quality_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL,
    code            VARCHAR(50)   NOT NULL,
    name            VARCHAR(500)  NOT NULL,
    plan_version    INT           NOT NULL DEFAULT 1,
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    sections        JSONB,
    approved_by_id  UUID,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_quality_plan_code UNIQUE (code)
);

CREATE INDEX idx_quality_plan_project ON quality_plans (project_id);
CREATE INDEX idx_quality_plan_status ON quality_plans (status);

-- ===================== Inspection Points (Точки контроля) =====================
CREATE TABLE inspection_points (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quality_plan_id   UUID          NOT NULL REFERENCES quality_plans (id) ON DELETE CASCADE,
    name              VARCHAR(500)  NOT NULL,
    work_stage        VARCHAR(100)  NOT NULL,
    inspection_type   VARCHAR(30)   NOT NULL,
    criteria          TEXT,
    responsible_role  VARCHAR(100),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT        NOT NULL DEFAULT 0,
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_insp_point_plan ON inspection_points (quality_plan_id);
CREATE INDEX idx_insp_point_type ON inspection_points (inspection_type);
