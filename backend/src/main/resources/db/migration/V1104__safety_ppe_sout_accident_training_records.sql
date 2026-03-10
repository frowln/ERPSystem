-- Safety PPE Items (inventory)
CREATE TABLE IF NOT EXISTS safety_ppe_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    name                    VARCHAR(500) NOT NULL,
    sku                     VARCHAR(100),
    category                VARCHAR(30) NOT NULL,
    size                    VARCHAR(50),
    certification_standard  VARCHAR(200),
    total_quantity          INTEGER NOT NULL DEFAULT 0,
    available_quantity      INTEGER NOT NULL DEFAULT 0,
    min_stock_level         INTEGER DEFAULT 0,
    expiry_date             DATE,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ppe_item_org ON safety_ppe_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_ppe_item_category ON safety_ppe_items(category);
CREATE INDEX IF NOT EXISTS idx_ppe_item_sku ON safety_ppe_items(sku);

-- Safety PPE Issues (issuance/return records)
CREATE TABLE IF NOT EXISTS safety_ppe_issues (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    item_id             UUID NOT NULL REFERENCES safety_ppe_items(id),
    item_name           VARCHAR(500),
    employee_id         UUID NOT NULL,
    employee_name       VARCHAR(300),
    quantity            INTEGER NOT NULL DEFAULT 1,
    issued_date         DATE NOT NULL,
    return_date         DATE,
    return_condition    VARCHAR(30),
    returned            BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ppe_issue_org ON safety_ppe_issues(organization_id);
CREATE INDEX IF NOT EXISTS idx_ppe_issue_employee ON safety_ppe_issues(employee_id);
CREATE INDEX IF NOT EXISTS idx_ppe_issue_item ON safety_ppe_issues(item_id);
CREATE INDEX IF NOT EXISTS idx_ppe_issue_date ON safety_ppe_issues(issued_date);

-- Safety SOUT Cards (workplace assessment)
CREATE TABLE IF NOT EXISTS safety_sout_cards (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    project_id              UUID,
    card_number             VARCHAR(50),
    workplace_name          VARCHAR(500) NOT NULL,
    workplace_number        VARCHAR(50),
    department              VARCHAR(300),
    position_name           VARCHAR(300),
    employee_count          INTEGER DEFAULT 1,
    hazard_class            VARCHAR(10),
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    assessment_date         DATE,
    next_assessment_date    DATE,
    assessor_organization   VARCHAR(500),
    harmful_factors         TEXT,
    compensations           TEXT,
    ppe_recommendations     TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sout_org ON safety_sout_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_sout_project ON safety_sout_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_sout_status ON safety_sout_cards(status);
CREATE INDEX IF NOT EXISTS idx_sout_card_number ON safety_sout_cards(card_number);

CREATE SEQUENCE IF NOT EXISTS sout_card_number_seq START WITH 1 INCREMENT BY 1;

-- Safety Accident Acts (Form N-1)
CREATE TABLE IF NOT EXISTS safety_accident_acts (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL,
    act_number                  VARCHAR(50) UNIQUE,
    project_id                  UUID,
    incident_id                 UUID,
    accident_date               TIMESTAMP NOT NULL,
    accident_location           VARCHAR(500),
    victim_full_name            VARCHAR(300) NOT NULL,
    victim_position             VARCHAR(300),
    victim_birth_date           DATE,
    victim_gender               VARCHAR(10),
    victim_work_experience      VARCHAR(100),
    victim_briefing_date        DATE,
    victim_briefing_type        VARCHAR(50),
    investigation_start_date    DATE,
    investigation_end_date      DATE,
    commission_chairman         VARCHAR(300),
    commission_members          TEXT,
    circumstances               TEXT,
    root_causes                 TEXT,
    corrective_measures         TEXT,
    responsible_persons         TEXT,
    injury_description          TEXT,
    injury_severity             VARCHAR(30),
    work_days_lost              INTEGER DEFAULT 0,
    hospitalization             BOOLEAN NOT NULL DEFAULT FALSE,
    fatal                       BOOLEAN NOT NULL DEFAULT FALSE,
    status                      VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    approved_by_name            VARCHAR(300),
    approved_date               DATE,
    sent_to_authorities_date    DATE,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ,
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT DEFAULT 0,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_accident_act_org ON safety_accident_acts(organization_id);
CREATE INDEX IF NOT EXISTS idx_accident_act_project ON safety_accident_acts(project_id);
CREATE INDEX IF NOT EXISTS idx_accident_act_status ON safety_accident_acts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accident_act_number ON safety_accident_acts(act_number);
CREATE INDEX IF NOT EXISTS idx_accident_act_incident ON safety_accident_acts(incident_id);

CREATE SEQUENCE IF NOT EXISTS accident_act_number_seq START WITH 1 INCREMENT BY 1;

-- Safety Training Records (per-employee training journal)
CREATE TABLE IF NOT EXISTS safety_training_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    employee_id         UUID NOT NULL,
    employee_name       VARCHAR(300),
    training_type       VARCHAR(100) NOT NULL,
    completed_date      DATE NOT NULL,
    expiry_date         DATE,
    certificate_number  VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_training_record_org ON safety_training_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_record_employee ON safety_training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_record_type ON safety_training_records(training_type);
CREATE INDEX IF NOT EXISTS idx_training_record_expiry ON safety_training_records(expiry_date);
