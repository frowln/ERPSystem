-- =============================================================================
-- Sequence for task codes (TASK-00001, TASK-00002, etc.)
-- =============================================================================
CREATE SEQUENCE task_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Project tasks table
-- =============================================================================
CREATE TABLE project_tasks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) NOT NULL UNIQUE,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    project_id          UUID REFERENCES projects(id),
    parent_task_id      UUID REFERENCES project_tasks(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'BACKLOG',
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    assignee_id         UUID REFERENCES users(id),
    assignee_name       VARCHAR(255),
    reporter_id         UUID REFERENCES users(id),
    reporter_name       VARCHAR(255),
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,
    estimated_hours     NUMERIC(8, 2),
    actual_hours        NUMERIC(8, 2) NOT NULL DEFAULT 0,
    progress            INTEGER NOT NULL DEFAULT 0,
    wbs_code            VARCHAR(100),
    sort_order          INTEGER NOT NULL DEFAULT 0,
    spec_item_id        UUID,
    tags                VARCHAR(500),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_task_status CHECK (status IN (
        'BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'
    )),
    CONSTRAINT chk_task_priority CHECK (priority IN (
        'LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'
    )),
    CONSTRAINT chk_task_progress CHECK (progress BETWEEN 0 AND 100),
    CONSTRAINT chk_task_estimated_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
    CONSTRAINT chk_task_actual_hours CHECK (actual_hours >= 0),
    CONSTRAINT chk_task_planned_dates CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date),
    CONSTRAINT chk_task_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

CREATE INDEX IF NOT EXISTS idx_task_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_parent ON project_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_priority ON project_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_assignee ON project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_code ON project_tasks(code);
CREATE INDEX IF NOT EXISTS idx_task_wbs ON project_tasks(wbs_code);
CREATE INDEX IF NOT EXISTS idx_task_active ON project_tasks(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Task comments table
-- =============================================================================
CREATE TABLE task_comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id             UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    author_id           UUID REFERENCES users(id),
    author_name         VARCHAR(255),
    content             TEXT NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_task_comment_task ON task_comments(task_id);

CREATE TRIGGER update_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Task dependencies table
-- =============================================================================
CREATE TABLE task_dependencies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id             UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    depends_on_task_id  UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    dependency_type     VARCHAR(30) NOT NULL DEFAULT 'FINISH_TO_START',

    CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_task_id),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id),
    CONSTRAINT chk_dependency_type CHECK (dependency_type IN (
        'FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH'
    ))
);

CREATE INDEX IF NOT EXISTS idx_task_dep_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dep_depends_on ON task_dependencies(depends_on_task_id);

-- =============================================================================
-- Milestones table
-- =============================================================================
CREATE TABLE milestones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    project_id          UUID REFERENCES projects(id),
    due_date            DATE NOT NULL,
    completed_date      DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description         TEXT,
    progress            INTEGER NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_milestone_status CHECK (status IN (
        'PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED'
    )),
    CONSTRAINT chk_milestone_progress CHECK (progress BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_milestone_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestone_due_date ON milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_milestone_active ON milestones(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
