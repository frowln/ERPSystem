-- =============================================================================
-- V1133: ЭДО Integration — Config + Send Document Tracking
-- Supports Diadok / SBIS / Kontur providers for sending KS-2/KS-3/invoices
-- =============================================================================

-- EdoConfig: per-organization ЭДО provider configuration
CREATE TABLE IF NOT EXISTS edo_configs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL,
    provider          VARCHAR(20) NOT NULL DEFAULT 'DIADOK',
    api_key           VARCHAR(500),
    box_id            VARCHAR(100),
    inn               VARCHAR(12),
    kpp               VARCHAR(9),
    enabled           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_edo_cfg_org ON edo_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_edo_cfg_provider ON edo_configs(provider);
CREATE INDEX IF NOT EXISTS idx_edo_cfg_enabled ON edo_configs(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_edo_cfg_not_deleted ON edo_configs(deleted) WHERE deleted = FALSE;

-- EdoSendDocument: tracks each document sent through ЭДО
-- Separate from edo_documents (V73) which tracks received/general ЭДО documents
CREATE TABLE IF NOT EXISTS edo_send_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    config_id           UUID REFERENCES edo_configs(id),
    source_type         VARCHAR(20) NOT NULL,
    source_id           UUID NOT NULL,
    external_id         VARCHAR(255),
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    counterparty_inn    VARCHAR(12),
    counterparty_name   VARCHAR(500),
    sent_at             TIMESTAMP WITH TIME ZONE,
    signed_at           TIMESTAMP WITH TIME ZONE,
    error_message       TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_edo_send_doc_source ON edo_send_documents(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_edo_send_doc_config ON edo_send_documents(config_id);
CREATE INDEX IF NOT EXISTS idx_edo_send_doc_status ON edo_send_documents(status);
CREATE INDEX IF NOT EXISTS idx_edo_send_doc_org ON edo_send_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_edo_send_doc_not_deleted ON edo_send_documents(deleted) WHERE deleted = FALSE;
