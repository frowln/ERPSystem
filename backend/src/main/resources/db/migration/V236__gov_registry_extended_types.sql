-- =============================================================================
-- V236: Government Registry — tables + seed configs for extended registry types
-- =============================================================================

-- =============================================================================
-- Registry Configs (Конфигурации государственных реестров)
-- =============================================================================
CREATE TABLE IF NOT EXISTS registry_configs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_type           VARCHAR(20) NOT NULL UNIQUE,
    api_url                 VARCHAR(1000),
    api_key                 TEXT,
    enabled                 BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_at            TIMESTAMP,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rc_registry_type ON registry_configs(registry_type);
CREATE INDEX IF NOT EXISTS idx_rc_enabled ON registry_configs(enabled);

-- =============================================================================
-- Registry Check Results (Результаты проверок по реестрам)
-- =============================================================================
CREATE TABLE IF NOT EXISTS registry_check_results (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counterparty_id         UUID,
    inn                     VARCHAR(12) NOT NULL,
    ogrn                    VARCHAR(15),
    registry_type           VARCHAR(20) NOT NULL,
    check_date              TIMESTAMP NOT NULL,
    status                  VARCHAR(20) NOT NULL,
    company_name            VARCHAR(500),
    registration_date       DATE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    chief_name              VARCHAR(255),
    authorized_capital      NUMERIC(15, 2),
    risk_level              VARCHAR(10),
    raw_response            TEXT,
    warnings                TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rcr_counterparty_id ON registry_check_results(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_rcr_inn ON registry_check_results(inn);
CREATE INDEX IF NOT EXISTS idx_rcr_ogrn ON registry_check_results(ogrn);
CREATE INDEX IF NOT EXISTS idx_rcr_registry_type ON registry_check_results(registry_type);
CREATE INDEX IF NOT EXISTS idx_rcr_check_date ON registry_check_results(check_date);
CREATE INDEX IF NOT EXISTS idx_rcr_status ON registry_check_results(status);
CREATE INDEX IF NOT EXISTS idx_rcr_risk_level ON registry_check_results(risk_level);

-- =============================================================================
-- Seed default RegistryConfig rows for the 6 new registry types
-- =============================================================================
INSERT INTO registry_configs (id, registry_type, enabled, deleted, created_at, updated_at, version)
VALUES
    (uuid_generate_v4(), 'ROSREESTR',   FALSE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'FGIS_ESN',    FALSE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'GIS_GMP',     FALSE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'FGIS_CS',     FALSE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'EIS_ZAKUPKI', FALSE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'GISOGD',      FALSE, FALSE, NOW(), NOW(), 0)
ON CONFLICT (registry_type) DO NOTHING;
