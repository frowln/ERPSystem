-- =====================================================
-- P2-06: Extend incidents — Form Н-1, auto-notifications
-- Adds Form Н-1 fields, injured persons, corrective actions (CAPA)
-- =====================================================

-- Extend safety_incidents with Form Н-1 fields
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS time_of_incident TIME;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(200);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS equipment_involved VARCHAR(500);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS work_being_performed TEXT;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS immediate_actions TEXT;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_method VARCHAR(30);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_started_at TIMESTAMPTZ;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_completed_at TIMESTAMPTZ;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_report TEXT;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS regulatory_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS regulatory_notification_date TIMESTAMPTZ;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS regulatory_case_number VARCHAR(50);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS direct_cost NUMERIC(18,2) DEFAULT 0;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS indirect_cost NUMERIC(18,2) DEFAULT 0;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS is_reportable BOOLEAN DEFAULT FALSE;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;

-- Auto-set is_reportable for CRITICAL/FATAL injuries
UPDATE safety_incidents
SET is_reportable = TRUE
WHERE severity IN ('CRITICAL', 'FATAL')
  AND incident_type = 'INJURY'
  AND is_reportable = FALSE;

CREATE INDEX IF NOT EXISTS idx_incident_org_date ON safety_incidents(organization_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incident_org_type ON safety_incidents(organization_id, incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_is_reportable ON safety_incidents(organization_id, is_reportable);

-- =====================================================
-- Injured persons (multiple per incident, Form Н-1)
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_injured_persons (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE,
    incident_id         UUID         NOT NULL REFERENCES safety_incidents(id),
    employee_id         UUID,
    full_name           VARCHAR(255) NOT NULL,
    position            VARCHAR(200),
    department          VARCHAR(200),
    date_of_birth       DATE,
    years_of_experience NUMERIC(4,1),
    injury_type         VARCHAR(30)  NOT NULL,
    body_part           VARCHAR(30)  NOT NULL,
    injury_description  TEXT,
    medical_treatment   BOOLEAN      NOT NULL DEFAULT FALSE,
    hospitalized        BOOLEAN      NOT NULL DEFAULT FALSE,
    hospital_name       VARCHAR(300),
    work_days_lost      INTEGER      DEFAULT 0,
    returned_to_work    BOOLEAN      DEFAULT FALSE,
    return_date         DATE,
    disability_type     VARCHAR(50),
    outcome             VARCHAR(30)
);

CREATE INDEX IF NOT EXISTS idx_iip_incident ON incident_injured_persons(incident_id);
CREATE INDEX IF NOT EXISTS idx_iip_employee ON incident_injured_persons(employee_id);

-- =====================================================
-- Corrective and preventive actions (CAPA)
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_corrective_actions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE,
    incident_id         UUID         NOT NULL REFERENCES safety_incidents(id),
    organization_id     UUID         NOT NULL,
    action_type         VARCHAR(20)  NOT NULL,
    description         TEXT         NOT NULL,
    responsible_id      UUID,
    responsible_name    VARCHAR(255),
    due_date            DATE         NOT NULL,
    completed_date      DATE,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PLANNED',
    verification_date   DATE,
    verified_by_id      UUID,
    is_effective        BOOLEAN,
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_ica_incident ON incident_corrective_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_ica_org ON incident_corrective_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ica_status ON incident_corrective_actions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ica_due_date ON incident_corrective_actions(due_date);
