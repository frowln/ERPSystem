CREATE TABLE bank_guarantees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    counterparty_id UUID REFERENCES counterparties(id),
    bank_name VARCHAR(500) NOT NULL,
    guarantee_number VARCHAR(100),
    guarantee_type VARCHAR(50) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    issue_date DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    document_url VARCHAR(1000),
    notes TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);
CREATE INDEX idx_bank_guarantees_contract ON bank_guarantees(contract_id);
CREATE INDEX idx_bank_guarantees_expiry ON bank_guarantees(expiry_date);
CREATE INDEX idx_bank_guarantees_org ON bank_guarantees(organization_id);
