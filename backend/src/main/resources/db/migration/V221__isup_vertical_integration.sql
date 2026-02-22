-- ISUP "Вертикаль" integration tables
-- Government construction information system used in 87 regions

CREATE TABLE isup_configurations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    api_url         VARCHAR(1000) NOT NULL,
    api_key_encrypted TEXT,
    certificate_path VARCHAR(1000),
    organization_inn VARCHAR(12) NOT NULL,
    organization_kpp VARCHAR(9),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_isup_cfg_org ON isup_configurations(organization_id);
CREATE INDEX idx_isup_cfg_active ON isup_configurations(is_active);
CREATE INDEX idx_isup_cfg_inn ON isup_configurations(organization_inn);

CREATE TABLE isup_project_mappings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL,
    privod_project_id           UUID NOT NULL,
    isup_project_id             VARCHAR(255),
    isup_object_id              VARCHAR(255),
    government_contract_number  VARCHAR(255),
    registration_number         VARCHAR(255),
    sync_enabled                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE,
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_isup_map_org ON isup_project_mappings(organization_id);
CREATE INDEX idx_isup_map_project ON isup_project_mappings(privod_project_id);
CREATE INDEX idx_isup_map_isup_project ON isup_project_mappings(isup_project_id);
CREATE INDEX idx_isup_map_gov_contract ON isup_project_mappings(government_contract_number);
CREATE INDEX idx_isup_map_sync ON isup_project_mappings(sync_enabled);

CREATE TABLE isup_transmissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    project_mapping_id  UUID NOT NULL REFERENCES isup_project_mappings(id),
    transmission_type   VARCHAR(30) NOT NULL,
    payload_json        TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    sent_at             TIMESTAMP WITH TIME ZONE,
    confirmed_at        TIMESTAMP WITH TIME ZONE,
    error_message       TEXT,
    retry_count         INT NOT NULL DEFAULT 0,
    external_id         VARCHAR(255),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_isup_tx_org ON isup_transmissions(organization_id);
CREATE INDEX idx_isup_tx_mapping ON isup_transmissions(project_mapping_id);
CREATE INDEX idx_isup_tx_type ON isup_transmissions(transmission_type);
CREATE INDEX idx_isup_tx_status ON isup_transmissions(status);
CREATE INDEX idx_isup_tx_sent ON isup_transmissions(sent_at);
CREATE INDEX idx_isup_tx_external ON isup_transmissions(external_id);

CREATE TABLE isup_verification_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    transmission_id     UUID NOT NULL REFERENCES isup_transmissions(id),
    verification_type   VARCHAR(30) NOT NULL,
    verified_by_name    VARCHAR(255),
    verified_at         TIMESTAMP WITH TIME ZONE,
    comments            TEXT,
    external_reference  VARCHAR(255),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_isup_vr_org ON isup_verification_records(organization_id);
CREATE INDEX idx_isup_vr_tx ON isup_verification_records(transmission_id);
CREATE INDEX idx_isup_vr_type ON isup_verification_records(verification_type);
CREATE INDEX idx_isup_vr_verified_at ON isup_verification_records(verified_at);
