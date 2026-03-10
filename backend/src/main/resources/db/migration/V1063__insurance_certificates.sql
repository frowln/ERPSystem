-- Insurance Certificate Tracking (COI)
CREATE TABLE IF NOT EXISTS insurance_certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL,
    vendor_id       UUID,
    vendor_name     VARCHAR(255) NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    policy_number   VARCHAR(100),
    insurer_name    VARCHAR(255),
    coverage_amount NUMERIC(18,2),
    deductible      NUMERIC(18,2),
    effective_date  DATE,
    expiry_date     DATE,
    certificate_holder VARCHAR(255),
    status          VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    storage_path    VARCHAR(500),
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_insurance_certificates_org ON insurance_certificates(organization_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_vendor ON insurance_certificates(vendor_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_expiry ON insurance_certificates(expiry_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_status ON insurance_certificates(status) WHERE deleted = FALSE;
