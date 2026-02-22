-- Machine-readable Power of Attorney (МЧД) per 63-FZ
CREATE TABLE IF NOT EXISTS mchd_documents (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID            NOT NULL,
    number                  VARCHAR(100)    NOT NULL,
    principal_inn           VARCHAR(20)     NOT NULL,
    principal_name          VARCHAR(500)    NOT NULL,
    representative_inn      VARCHAR(20)     NOT NULL,
    representative_name     VARCHAR(500)    NOT NULL,
    representative_user_id  UUID,
    scope                   TEXT,
    valid_from              TIMESTAMPTZ     NOT NULL,
    valid_to                TIMESTAMPTZ     NOT NULL,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    registry_id             VARCHAR(100),
    signature_data          TEXT,
    signing_certificate_id  UUID,
    notes                   TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT          NOT NULL DEFAULT 0,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_mchd_organization         ON mchd_documents (organization_id);
CREATE INDEX idx_mchd_representative_user  ON mchd_documents (representative_user_id);
CREATE INDEX idx_mchd_status               ON mchd_documents (status);
CREATE INDEX idx_mchd_number               ON mchd_documents (number);

-- Ensure unique MChD number per organization (among non-deleted records)
CREATE UNIQUE INDEX uq_mchd_org_number ON mchd_documents (organization_id, number) WHERE deleted = false;
