-- API rate limit configuration per key
CREATE TABLE api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL,
    requests_per_minute INTEGER NOT NULL DEFAULT 60,
    requests_per_hour INTEGER NOT NULL DEFAULT 1000,
    requests_per_day INTEGER NOT NULL DEFAULT 10000,
    burst_limit INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_arl_key ON api_rate_limits(api_key_id);

-- API usage logs for analytics
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    api_key_id UUID NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes BIGINT,
    response_size_bytes BIGINT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    error_message TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_aul_org ON api_usage_logs(organization_id);
CREATE INDEX idx_aul_key ON api_usage_logs(api_key_id);
CREATE INDEX idx_aul_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_aul_requested ON api_usage_logs(requested_at);

-- Integration connectors (marketplace catalog)
CREATE TABLE integration_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon_url VARCHAR(500),
    documentation_url VARCHAR(500),
    api_base_url VARCHAR(500),
    auth_type VARCHAR(30) NOT NULL DEFAULT 'API_KEY',
    is_first_party BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    config_schema_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_ic_category ON integration_connectors(category);
CREATE INDEX idx_ic_slug ON integration_connectors(slug);
CREATE INDEX idx_ic_active ON integration_connectors(is_active);

-- Organization-specific connector installations
CREATE TABLE connector_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    connector_id UUID NOT NULL REFERENCES integration_connectors(id),
    config_json TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'INSTALLED',
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_ci_org ON connector_installations(organization_id);
CREATE INDEX idx_ci_connector ON connector_installations(connector_id);
CREATE UNIQUE INDEX idx_ci_org_connector ON connector_installations(organization_id, connector_id) WHERE deleted = false;

-- Seed first-party connectors
INSERT INTO integration_connectors (id, name, slug, description, category, auth_type, is_first_party, is_active) VALUES
(gen_random_uuid(), 'ГРАНД-Смета', 'grand-smeta', 'Интеграция с ГРАНД-Сметой для импорта/экспорта сметных данных', 'COST_ESTIMATION', 'API_KEY', true, true),
(gen_random_uuid(), '1С:Бухгалтерия', '1c-accounting', 'Двусторонний обмен документами с 1С:Бухгалтерия', 'ACCOUNTING', 'BASIC', true, true),
(gen_random_uuid(), 'СБИС (Тензор)', 'sbis', 'Электронный документооборот через СБИС', 'ACCOUNTING', 'API_KEY', true, true),
(gen_random_uuid(), 'Telegram Bot', 'telegram', 'Уведомления и команды через Telegram', 'MESSAGING', 'API_KEY', true, true),
(gen_random_uuid(), 'Renga', 'renga', 'Импорт BIM-моделей из Renga', 'BIM', 'API_KEY', true, true),
(gen_random_uuid(), 'nanoCAD', 'nanocad', 'Импорт чертежей из nanoCAD', 'BIM', 'API_KEY', true, true),
(gen_random_uuid(), 'Сбербанк API', 'sberbank', 'Автоматическая выгрузка банковских выписок', 'BANKING', 'OAUTH2', true, true);
