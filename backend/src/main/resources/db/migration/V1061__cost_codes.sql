CREATE TABLE IF NOT EXISTS cost_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID,
    level INT NOT NULL DEFAULT 0,
    standard VARCHAR(20) NOT NULL DEFAULT 'CUSTOM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_cc_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_cc_parent FOREIGN KEY (parent_id) REFERENCES cost_codes(id)
);

CREATE INDEX IF NOT EXISTS idx_cost_codes_org ON cost_codes(organization_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cost_codes_parent ON cost_codes(parent_id) WHERE deleted = FALSE;
