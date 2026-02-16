-- =============================================================================
-- V66: Task templates, checklists, recurrences, approvals, stages, tags,
--      activities, project collaborators, project updates
-- =============================================================================

-- -------------------------------------------------------
-- Task templates (Шаблоны задач)
-- -------------------------------------------------------
CREATE TABLE task_templates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    default_priority        VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    estimated_hours         NUMERIC(8,2),
    category                VARCHAR(100),
    checklist_template      TEXT,
    tags                    VARCHAR(500),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_task_template_priority CHECK (default_priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL')),
    CONSTRAINT chk_task_template_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_task_template_category ON task_templates(category) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_template_active ON task_templates(is_active) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_template_deleted ON task_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Task checklists (Чеклисты задач)
-- -------------------------------------------------------
CREATE TABLE task_checklists (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id                 UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    title                   VARCHAR(500) NOT NULL,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    is_completed            BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at            TIMESTAMP WITHOUT TIME ZONE,
    completed_by_id         UUID,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_task ON task_checklists(task_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_checklist_sort ON task_checklists(task_id, sort_order) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_checklist_deleted ON task_checklists(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_task_checklists_updated_at
    BEFORE UPDATE ON task_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Task recurrences (Повторяющиеся задачи)
-- -------------------------------------------------------
CREATE TABLE task_recurrences (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id                 UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    recurrence_type         VARCHAR(20) NOT NULL,
    interval_days           INTEGER NOT NULL DEFAULT 1,
    next_occurrence         DATE,
    end_date                DATE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_count           INTEGER NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_recurrence_type CHECK (recurrence_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    CONSTRAINT chk_recurrence_interval CHECK (interval_days > 0),
    CONSTRAINT chk_recurrence_dates CHECK (end_date IS NULL OR next_occurrence IS NULL OR end_date >= next_occurrence),
    CONSTRAINT chk_recurrence_count CHECK (created_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_task_recurrence_task ON task_recurrences(task_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_recurrence_next ON task_recurrences(next_occurrence) WHERE deleted = FALSE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_task_recurrence_active ON task_recurrences(is_active) WHERE deleted = FALSE;

CREATE TRIGGER update_task_recurrences_updated_at
    BEFORE UPDATE ON task_recurrences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Task approvals (Утверждения задач)
-- -------------------------------------------------------
CREATE TABLE task_approvals (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id                 UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    approver_id             UUID NOT NULL,
    approver_name           VARCHAR(255),
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    comment                 TEXT,
    approved_at             TIMESTAMP WITHOUT TIME ZONE,
    sequence                INTEGER NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_approval_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DELEGATED'))
);

CREATE INDEX IF NOT EXISTS idx_task_approval_task ON task_approvals(task_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_approval_approver ON task_approvals(approver_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_approval_status ON task_approvals(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_approval_deleted ON task_approvals(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_task_approvals_updated_at
    BEFORE UPDATE ON task_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Task stages (Стадии задач по проекту)
-- -------------------------------------------------------
CREATE TABLE task_stages (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    sequence                INTEGER NOT NULL DEFAULT 0,
    fold_state              VARCHAR(50),
    description             TEXT,
    is_default              BOOLEAN NOT NULL DEFAULT FALSE,
    is_closed               BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_task_stage_project ON task_stages(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_stage_sequence ON task_stages(project_id, sequence) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_stage_deleted ON task_stages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_task_stages_updated_at
    BEFORE UPDATE ON task_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Task tags (Теги задач)
-- -------------------------------------------------------
CREATE TABLE task_tags (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(100) NOT NULL,
    color                   VARCHAR(20),
    project_id              UUID REFERENCES projects(id) ON DELETE SET NULL,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_task_tag_project ON task_tags(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_tag_name ON task_tags(name) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_tag_deleted ON task_tags(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_task_tags_updated_at
    BEFORE UPDATE ON task_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Task activities (Журнал активности задач)
-- -------------------------------------------------------
CREATE TABLE task_activities (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id                 UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    activity_type_id        UUID,
    user_id                 UUID,
    summary                 VARCHAR(500) NOT NULL,
    note                    TEXT,
    due_date                DATE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_activity_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activities(task_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_activity_user ON task_activities(user_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_activity_status ON task_activities(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_activity_due ON task_activities(due_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_activity_deleted ON task_activities(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_task_activities_updated_at
    BEFORE UPDATE ON task_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Project collaborators (Партнёры проекта)
-- -------------------------------------------------------
CREATE TABLE project_collaborators (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    partner_id              UUID NOT NULL,
    role                    VARCHAR(100),
    invited_at              TIMESTAMP WITHOUT TIME ZONE,
    accepted_at             TIMESTAMP WITHOUT TIME ZONE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_project_collab_project ON project_collaborators(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_project_collab_partner ON project_collaborators(partner_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_project_collab_deleted ON project_collaborators(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_project_collaborators_updated_at
    BEFORE UPDATE ON project_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Project updates (Обновления/статусы проекта)
-- -------------------------------------------------------
CREATE TABLE project_updates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id               UUID,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK',
    progress_percentage     INTEGER DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_project_update_status CHECK (status IN ('ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'ON_HOLD')),
    CONSTRAINT chk_project_update_progress CHECK (progress_percentage IS NULL OR (progress_percentage >= 0 AND progress_percentage <= 100))
);

CREATE INDEX IF NOT EXISTS idx_project_update_project ON project_updates(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_project_update_author ON project_updates(author_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_project_update_status ON project_updates(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_project_update_deleted ON project_updates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_project_updates_updated_at
    BEFORE UPDATE ON project_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
