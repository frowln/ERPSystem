-- P1-SAF-2: PPE norms table (Приказ Минтруда №766н от 29.10.2021)
CREATE TABLE IF NOT EXISTS ppe_norms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    job_title VARCHAR(300) NOT NULL,
    ppe_name VARCHAR(500) NOT NULL,
    annual_qty INTEGER,
    wear_months INTEGER,
    norm_document VARCHAR(200),
    gost_standard VARCHAR(200),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ppe_norms_org ON ppe_norms(organization_id);
