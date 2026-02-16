-- =============================================================================
-- V56: Configurable Workflow Engine tables
-- =============================================================================

-- =============================================================================
-- Workflow Definitions — Определения рабочих процессов
-- =============================================================================
CREATE TABLE workflow_definitions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    entity_type             VARCHAR(100),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    version                 BIGINT NOT NULL DEFAULT 0,
    organization_id         UUID,
    created_by_id           UUID,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_wf_def_entity_type ON workflow_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_wf_def_org ON workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_wf_def_active ON workflow_definitions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_wf_def_not_deleted ON workflow_definitions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_workflow_definitions_updated_at
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Workflow Steps — Шаги рабочего процесса
-- =============================================================================
CREATE TABLE workflow_steps (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_definition_id      UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    name                        VARCHAR(500) NOT NULL,
    from_status                 VARCHAR(50),
    to_status                   VARCHAR(50),
    required_role               VARCHAR(100),
    approver_ids                JSONB,
    sla_hours                   INTEGER,
    sort_order                  INTEGER,
    conditions                  JSONB,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wf_step_definition ON workflow_steps(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_wf_step_from_status ON workflow_steps(from_status);
CREATE INDEX IF NOT EXISTS idx_wf_step_to_status ON workflow_steps(to_status);
CREATE INDEX IF NOT EXISTS idx_wf_step_active ON workflow_steps(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Workflow Transitions — Переходы по рабочему процессу (лог)
-- =============================================================================
CREATE TABLE workflow_transitions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_step_id        UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    entity_id               UUID NOT NULL,
    entity_type             VARCHAR(100) NOT NULL,
    transitioned_by_id      UUID,
    transitioned_at         TIMESTAMP WITH TIME ZONE,
    from_status             VARCHAR(50),
    to_status               VARCHAR(50),
    comments                TEXT,
    duration                BIGINT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wf_trans_step ON workflow_transitions(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_wf_trans_entity ON workflow_transitions(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_wf_trans_at ON workflow_transitions(transitioned_at);
CREATE INDEX IF NOT EXISTS idx_wf_trans_active ON workflow_transitions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_workflow_transitions_updated_at
    BEFORE UPDATE ON workflow_transitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Automation Rules — Правила автоматизации
-- =============================================================================
CREATE TABLE automation_rules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    entity_type             VARCHAR(100),
    trigger_type            VARCHAR(30) NOT NULL,
    trigger_condition       JSONB,
    action_type             VARCHAR(30) NOT NULL,
    action_config           JSONB,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    organization_id         UUID,
    priority                INTEGER NOT NULL DEFAULT 0,
    last_executed_at        TIMESTAMP WITH TIME ZONE,
    execution_count         INTEGER NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_auto_trigger_type CHECK (trigger_type IN ('MANUAL', 'ON_CREATE', 'ON_STATUS_CHANGE', 'ON_FIELD_CHANGE', 'SCHEDULED')),
    CONSTRAINT chk_auto_action_type CHECK (action_type IN ('CHANGE_STATUS', 'SEND_NOTIFICATION', 'ASSIGN_USER', 'CREATE_TASK', 'SEND_EMAIL', 'WEBHOOK'))
);

CREATE INDEX IF NOT EXISTS idx_auto_rule_entity ON automation_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_auto_rule_trigger ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_auto_rule_action ON automation_rules(action_type);
CREATE INDEX IF NOT EXISTS idx_auto_rule_org ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_auto_rule_active ON automation_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_auto_rule_not_deleted ON automation_rules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Automation Executions — Журнал выполнения автоматизации
-- =============================================================================
CREATE TABLE automation_executions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_rule_id      UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    entity_id               UUID,
    entity_type             VARCHAR(100),
    execution_status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at              TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    trigger_data            JSONB,
    result_data             JSONB,
    error_message           TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_auto_exec_status CHECK (execution_status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'))
);

CREATE INDEX IF NOT EXISTS idx_auto_exec_rule ON automation_executions(automation_rule_id);
CREATE INDEX IF NOT EXISTS idx_auto_exec_entity ON automation_executions(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_auto_exec_status ON automation_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_auto_exec_started ON automation_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_auto_exec_active ON automation_executions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_automation_executions_updated_at
    BEFORE UPDATE ON automation_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
