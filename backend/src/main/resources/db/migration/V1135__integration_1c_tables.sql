-- 1C integration configuration and sync log tables

CREATE TABLE integration_1c_configs (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID        NOT NULL,
    base_url              VARCHAR(500),
    username              VARCHAR(255),
    encrypted_password    VARCHAR(500),
    database_name         VARCHAR(255),
    sync_enabled          BOOLEAN     DEFAULT false,
    last_sync_at          TIMESTAMP,
    sync_interval_minutes INTEGER     DEFAULT 60,
    created_at            TIMESTAMP   DEFAULT now(),
    updated_at            TIMESTAMP   DEFAULT now(),
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    version               BIGINT      DEFAULT 0,
    deleted               BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_i1c_config_org ON integration_1c_configs (organization_id);

CREATE TABLE integration_1c_sync_logs (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id         UUID        REFERENCES integration_1c_configs(id),
    direction         VARCHAR(20) NOT NULL,
    entity_type       VARCHAR(50) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    records_processed INTEGER     DEFAULT 0,
    records_errored   INTEGER     DEFAULT 0,
    error_message     TEXT,
    started_at        TIMESTAMP,
    completed_at      TIMESTAMP,
    created_at        TIMESTAMP   DEFAULT now()
);

CREATE INDEX idx_i1c_sync_config ON integration_1c_sync_logs (config_id);
CREATE INDEX idx_i1c_sync_status ON integration_1c_sync_logs (status);
