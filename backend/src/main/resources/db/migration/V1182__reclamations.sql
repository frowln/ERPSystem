CREATE TABLE reclamations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    counterparty_id UUID REFERENCES counterparties(id),
    project_id UUID REFERENCES projects(id),
    claim_number VARCHAR(50),
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    amount NUMERIC(18,2),
    status VARCHAR(30) DEFAULT 'DRAFT',
    resolution TEXT,
    resolved_at TIMESTAMP,
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_reclamation_org ON reclamations(organization_id);
CREATE INDEX idx_reclamation_project ON reclamations(project_id);
CREATE INDEX idx_reclamation_status ON reclamations(status);
CREATE INDEX idx_reclamation_contract ON reclamations(contract_id);
CREATE INDEX idx_reclamation_counterparty ON reclamations(counterparty_id);
