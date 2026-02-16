-- =============================================================================
-- V50: RFI, Submittal, Issue tables (PM Workflows)
-- =============================================================================

-- Sequences for auto-numbering
CREATE SEQUENCE rfi_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE submittal_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE submittal_package_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE issue_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- RFI — Запросы информации
-- =============================================================================
CREATE TABLE rfis (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    number                  VARCHAR(50) NOT NULL,
    subject                 VARCHAR(500) NOT NULL,
    question                TEXT NOT NULL,
    answer                  TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority                VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    assigned_to_id          UUID,
    responsible_id          UUID,
    due_date                DATE,
    answered_date           DATE,
    answered_by_id          UUID,
    cost_impact             BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_impact         BOOLEAN NOT NULL DEFAULT FALSE,
    related_drawing_id      UUID,
    related_spec_section    VARCHAR(255),
    distribution_list       JSONB,
    linked_document_ids     JSONB,
    tags                    JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_rfi_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_rfi_status CHECK (status IN ('DRAFT', 'OPEN', 'ASSIGNED', 'ANSWERED', 'CLOSED', 'VOID')),
    CONSTRAINT chk_rfi_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_rfi_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfi_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_rfi_priority ON rfis(priority);
CREATE INDEX IF NOT EXISTS idx_rfi_assigned ON rfis(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_rfi_responsible ON rfis(responsible_id);
CREATE INDEX IF NOT EXISTS idx_rfi_due_date ON rfis(due_date);
CREATE INDEX IF NOT EXISTS idx_rfi_active ON rfis(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_rfis_updated_at
    BEFORE UPDATE ON rfis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RFI Responses — Ответы на RFI
-- =============================================================================
CREATE TABLE rfi_responses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfi_id              UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    responder_id        UUID NOT NULL,
    response_text       TEXT NOT NULL,
    attachment_ids      JSONB,
    is_official         BOOLEAN NOT NULL DEFAULT FALSE,
    responded_at        TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rfi_response_rfi ON rfi_responses(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfi_response_responder ON rfi_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_rfi_response_active ON rfi_responses(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_rfi_responses_updated_at
    BEFORE UPDATE ON rfi_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Submittals — Сабмиталы (передача документов на рассмотрение)
-- =============================================================================
CREATE TABLE pm_submittals (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    number                  VARCHAR(50) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    submittal_type          VARCHAR(30),
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    spec_section            VARCHAR(255),
    due_date                DATE,
    submitted_date          DATE,
    submitted_by_id         UUID,
    ball_in_court           UUID,
    lead_time               INTEGER,
    required_date           DATE,
    linked_drawing_ids      JSONB,
    attachment_ids          JSONB,
    tags                    JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_submittal_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_pm_submittal_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'APPROVED_AS_NOTED', 'REJECTED', 'RESUBMITTED', 'CLOSED')),
    CONSTRAINT chk_pm_submittal_type CHECK (submittal_type IN ('SHOP_DRAWING', 'PRODUCT_DATA', 'SAMPLE', 'MOCK_UP', 'DESIGN_MIX', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_pm_submittal_project ON pm_submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_status ON pm_submittals(status);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_type ON pm_submittals(submittal_type);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_ball ON pm_submittals(ball_in_court);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_due ON pm_submittals(due_date);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_active ON pm_submittals(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_pm_submittals_updated_at
    BEFORE UPDATE ON pm_submittals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Submittal Packages — Пакеты сабмиталов
-- =============================================================================
CREATE TABLE pm_submittal_packages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    package_number      VARCHAR(50),
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    submittal_ids       JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pm_submittal_pkg_project ON pm_submittal_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_pkg_active ON pm_submittal_packages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_pm_submittal_packages_updated_at
    BEFORE UPDATE ON pm_submittal_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Submittal Reviews — Рецензии на сабмиталы
-- =============================================================================
CREATE TABLE pm_submittal_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submittal_id        UUID NOT NULL REFERENCES pm_submittals(id) ON DELETE CASCADE,
    reviewer_id         UUID NOT NULL,
    status              VARCHAR(30),
    comments            TEXT,
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    stamp_type          VARCHAR(30),
    attachment_ids      JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pm_submittal_review_submittal ON pm_submittal_reviews(submittal_id);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_review_reviewer ON pm_submittal_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_pm_submittal_review_active ON pm_submittal_reviews(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_pm_submittal_reviews_updated_at
    BEFORE UPDATE ON pm_submittal_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Issues — Проблемы/замечания проекта
-- =============================================================================
CREATE TABLE pm_issues (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    number                  VARCHAR(50) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    issue_type              VARCHAR(30),
    status                  VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    priority                VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    assigned_to_id          UUID,
    reported_by_id          UUID NOT NULL,
    due_date                DATE,
    resolved_date           DATE,
    resolved_by_id          UUID,
    location                VARCHAR(500),
    linked_rfi_id           UUID,
    linked_submittal_id     UUID,
    linked_document_ids     JSONB,
    root_cause              TEXT,
    resolution              TEXT,
    tags                    JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_issue_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_pm_issue_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED')),
    CONSTRAINT chk_pm_issue_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_pm_issue_type CHECK (issue_type IN ('DESIGN', 'CONSTRUCTION', 'COORDINATION', 'SAFETY', 'QUALITY', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_pm_issue_project ON pm_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_status ON pm_issues(status);
CREATE INDEX IF NOT EXISTS idx_pm_issue_priority ON pm_issues(priority);
CREATE INDEX IF NOT EXISTS idx_pm_issue_type ON pm_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_pm_issue_assigned ON pm_issues(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_reported ON pm_issues(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_due ON pm_issues(due_date);
CREATE INDEX IF NOT EXISTS idx_pm_issue_active ON pm_issues(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_pm_issues_updated_at
    BEFORE UPDATE ON pm_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Issue Comments — Комментарии к проблемам
-- =============================================================================
CREATE TABLE pm_issue_comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id            UUID NOT NULL REFERENCES pm_issues(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL,
    comment_text        TEXT NOT NULL,
    attachment_ids      JSONB,
    posted_at           TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pm_issue_comment_issue ON pm_issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_comment_author ON pm_issue_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_pm_issue_comment_active ON pm_issue_comments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_pm_issue_comments_updated_at
    BEFORE UPDATE ON pm_issue_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
