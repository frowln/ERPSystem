-- =============================================================================
-- Integration Endpoints (Точки интеграции: 1С, Банки, ЭДО, СБИС)
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS sync_job_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE integration_endpoints (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    provider            VARCHAR(30) NOT NULL,
    base_url            VARCHAR(1000) NOT NULL,
    auth_type           VARCHAR(20) NOT NULL,
    credentials         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_health_check   TIMESTAMP WITH TIME ZONE,
    health_status       VARCHAR(20) NOT NULL DEFAULT 'DOWN',
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    timeout_ms          INTEGER NOT NULL DEFAULT 30000,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ie_provider CHECK (provider IN (
        'ONE_C', 'SBERBANK', 'TINKOFF', 'VTB', 'ALFA_BANK',
        'RAIFFEISEN', 'SBIS', 'EDO_DIADOC', 'EDO_KONTUR', 'CUSTOM'
    )),
    CONSTRAINT chk_ie_auth_type CHECK (auth_type IN ('API_KEY', 'OAUTH2', 'CERTIFICATE', 'BASIC')),
    CONSTRAINT chk_ie_health_status CHECK (health_status IN ('HEALTHY', 'DEGRADED', 'DOWN')),
    CONSTRAINT chk_ie_rate_limit CHECK (rate_limit_per_minute > 0),
    CONSTRAINT chk_ie_timeout CHECK (timeout_ms > 0)
);

CREATE INDEX IF NOT EXISTS idx_ie_code ON integration_endpoints(code);
CREATE INDEX IF NOT EXISTS idx_ie_provider ON integration_endpoints(provider);
CREATE INDEX IF NOT EXISTS idx_ie_active ON integration_endpoints(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ie_health ON integration_endpoints(health_status);
CREATE INDEX IF NOT EXISTS idx_ie_not_deleted ON integration_endpoints(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_integration_endpoints_updated_at
    BEFORE UPDATE ON integration_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Sync Jobs (Задания синхронизации)
-- =============================================================================
CREATE TABLE sync_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) NOT NULL UNIQUE,
    endpoint_id         UUID NOT NULL REFERENCES integration_endpoints(id),
    sync_type           VARCHAR(20) NOT NULL,
    direction           VARCHAR(20) NOT NULL,
    entity_type         VARCHAR(100) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    processed_count     INTEGER NOT NULL DEFAULT 0,
    error_count         INTEGER NOT NULL DEFAULT 0,
    error_log           JSONB,
    last_sync_cursor    VARCHAR(500),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sj_sync_type CHECK (sync_type IN ('FULL', 'INCREMENTAL', 'MANUAL')),
    CONSTRAINT chk_sj_direction CHECK (direction IN ('IMPORT', 'EXPORT', 'BIDIRECTIONAL')),
    CONSTRAINT chk_sj_status CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    CONSTRAINT chk_sj_processed CHECK (processed_count >= 0),
    CONSTRAINT chk_sj_errors CHECK (error_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sj_code ON sync_jobs(code);
CREATE INDEX IF NOT EXISTS idx_sj_endpoint ON sync_jobs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_sj_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sj_entity_type ON sync_jobs(entity_type);
CREATE INDEX IF NOT EXISTS idx_sj_started ON sync_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sj_not_deleted ON sync_jobs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_sync_jobs_updated_at
    BEFORE UPDATE ON sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Sync Mappings (Маппинг полей синхронизации)
-- =============================================================================
CREATE TABLE sync_mappings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id             UUID NOT NULL REFERENCES integration_endpoints(id),
    local_entity_type       VARCHAR(100) NOT NULL,
    local_field_name        VARCHAR(100) NOT NULL,
    remote_entity_type      VARCHAR(100) NOT NULL,
    remote_field_name       VARCHAR(100) NOT NULL,
    transform_expression    VARCHAR(500),
    direction               VARCHAR(10) NOT NULL DEFAULT 'BOTH',
    is_required             BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sm_direction CHECK (direction IN ('IMPORT', 'EXPORT', 'BOTH'))
);

CREATE INDEX IF NOT EXISTS idx_sm_endpoint ON sync_mappings(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_sm_local_entity ON sync_mappings(local_entity_type);
CREATE INDEX IF NOT EXISTS idx_sm_remote_entity ON sync_mappings(remote_entity_type);
CREATE INDEX IF NOT EXISTS idx_sm_not_deleted ON sync_mappings(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_sync_mappings_updated_at
    BEFORE UPDATE ON sync_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Webhook Endpoints (Точки вебхуков)
-- =============================================================================
CREATE TABLE webhook_endpoints (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    url                 VARCHAR(1000) NOT NULL,
    secret              TEXT,
    events              JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at   TIMESTAMP WITH TIME ZONE,
    failure_count       INTEGER NOT NULL DEFAULT 0,
    last_failure_reason TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_we_failure_count CHECK (failure_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_we_code ON webhook_endpoints(code);
CREATE INDEX IF NOT EXISTS idx_we_active ON webhook_endpoints(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_we_not_deleted ON webhook_endpoints(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_webhook_endpoints_updated_at
    BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Webhook Deliveries (Доставки вебхуков)
-- =============================================================================
CREATE TABLE webhook_deliveries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id          UUID NOT NULL REFERENCES webhook_endpoints(id),
    event_type          VARCHAR(100) NOT NULL,
    payload             JSONB NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    response_code       INTEGER,
    response_body       TEXT,
    attempt             INTEGER NOT NULL DEFAULT 1,
    next_retry_at       TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wd_status CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING')),
    CONSTRAINT chk_wd_attempt CHECK (attempt >= 1)
);

CREATE INDEX IF NOT EXISTS idx_wd_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_wd_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_wd_event_type ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_wd_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'RETRYING';
CREATE INDEX IF NOT EXISTS idx_wd_not_deleted ON webhook_deliveries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_webhook_deliveries_updated_at
    BEFORE UPDATE ON webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- External Documents (Внешние документы ЭДО)
-- =============================================================================
CREATE TABLE external_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id         VARCHAR(255) NOT NULL,
    provider            VARCHAR(20) NOT NULL,
    document_type       VARCHAR(20) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    sender_inn          VARCHAR(12),
    sender_name         VARCHAR(500),
    recipient_inn       VARCHAR(12),
    recipient_name      VARCHAR(500),
    status              VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    signature_status    VARCHAR(20) NOT NULL DEFAULT 'UNSIGNED',
    file_url            VARCHAR(1000),
    signed_file_url     VARCHAR(1000),
    linked_entity_type  VARCHAR(100),
    linked_entity_id    UUID,
    received_at         TIMESTAMP WITH TIME ZONE,
    signed_at           TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ed_provider CHECK (provider IN ('DIADOC', 'KONTUR', 'SBIS')),
    CONSTRAINT chk_ed_document_type CHECK (document_type IN ('UPD', 'ACT', 'INVOICE', 'TORG12', 'SF', 'LETTER')),
    CONSTRAINT chk_ed_status CHECK (status IN ('RECEIVED', 'VIEWED', 'SIGNED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_ed_signature CHECK (signature_status IN ('UNSIGNED', 'PARTIALLY_SIGNED', 'FULLY_SIGNED'))
);

CREATE INDEX IF NOT EXISTS idx_ed_external_id ON external_documents(external_id);
CREATE INDEX IF NOT EXISTS idx_ed_provider ON external_documents(provider);
CREATE INDEX IF NOT EXISTS idx_ed_document_type ON external_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_ed_status ON external_documents(status);
CREATE INDEX IF NOT EXISTS idx_ed_sender_inn ON external_documents(sender_inn);
CREATE INDEX IF NOT EXISTS idx_ed_recipient_inn ON external_documents(recipient_inn);
CREATE INDEX IF NOT EXISTS idx_ed_linked ON external_documents(linked_entity_type, linked_entity_id);
CREATE INDEX IF NOT EXISTS idx_ed_received ON external_documents(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_ed_not_deleted ON external_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_external_documents_updated_at
    BEFORE UPDATE ON external_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
