CREATE TABLE financing_schedule_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    period_date DATE NOT NULL,
    planned_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_amount NUMERIC(18,2) DEFAULT 0,
    description VARCHAR(500),
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);
CREATE INDEX idx_financing_schedule_contract ON financing_schedule_entries(contract_id);
CREATE INDEX idx_financing_schedule_org ON financing_schedule_entries(organization_id);
