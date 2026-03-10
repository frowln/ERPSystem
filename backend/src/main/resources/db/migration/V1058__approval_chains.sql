CREATE TABLE IF NOT EXISTS approval_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    name VARCHAR(255),
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES approval_chains(id),
    step_order INTEGER NOT NULL,
    approver_name VARCHAR(255) NOT NULL,
    approver_role VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING',
    comment TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_approval_chain_entity ON approval_chains (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_step_chain ON approval_steps (chain_id);
