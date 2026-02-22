-- Approval workflow runtime: instances and decisions
-- Tracks actual approval processes flowing through workflow steps

CREATE TABLE approval_instances (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID            NOT NULL,
    workflow_definition_id UUID,
    entity_id       UUID            NOT NULL,
    entity_type     VARCHAR(100)    NOT NULL,
    entity_number   VARCHAR(200),
    current_step_id UUID,
    current_step_order INTEGER      DEFAULT 0,
    status          VARCHAR(30)     NOT NULL DEFAULT 'IN_PROGRESS',
    initiated_by_id UUID,
    completed_at    TIMESTAMPTZ,
    sla_deadline    TIMESTAMPTZ,
    escalated_to    UUID,
    delegated_to    UUID,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT          DEFAULT 0,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ai_org ON approval_instances (organization_id);
CREATE INDEX idx_ai_entity ON approval_instances (entity_id, entity_type);
CREATE INDEX idx_ai_wf_def ON approval_instances (workflow_definition_id);
CREATE INDEX idx_ai_status ON approval_instances (status);
CREATE INDEX idx_ai_sla_deadline ON approval_instances (sla_deadline);

-- Only one active (IN_PROGRESS) approval per entity at a time
CREATE UNIQUE INDEX uq_ai_entity_active
    ON approval_instances (entity_id, entity_type)
    WHERE deleted = FALSE AND status = 'IN_PROGRESS';


CREATE TABLE approval_decisions (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_instance_id  UUID          NOT NULL REFERENCES approval_instances(id),
    workflow_step_id      UUID          NOT NULL,
    step_order            INTEGER,
    approver_id           UUID          NOT NULL,
    decision              VARCHAR(30)   NOT NULL,
    comments              TEXT,
    decided_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    version               BIGINT        DEFAULT 0,
    deleted               BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ad_instance ON approval_decisions (approval_instance_id);
CREATE INDEX idx_ad_approver ON approval_decisions (approver_id);
CREATE INDEX idx_ad_step ON approval_decisions (workflow_step_id);
