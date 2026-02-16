-- =============================================================================
-- MFA & SSO (Многофакторная аутентификация и единый вход)
-- =============================================================================

-- =============================================================================
-- MFA Config (Конфигурация MFA)
-- =============================================================================
CREATE TABLE mfa_configs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    method              VARCHAR(20) NOT NULL,
    secret              VARCHAR(500),
    is_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
    enabled_at          TIMESTAMP WITH TIME ZONE,
    backup_codes        JSONB DEFAULT '[]'::jsonb,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mfa_method CHECK (method IN ('TOTP', 'SMS', 'EMAIL')),
    CONSTRAINT uq_mfa_config_user_method UNIQUE (user_id, method)
);

CREATE INDEX IF NOT EXISTS idx_mfa_config_user ON mfa_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_config_method ON mfa_configs(method);
CREATE INDEX IF NOT EXISTS idx_mfa_config_enabled ON mfa_configs(is_enabled) WHERE is_enabled = TRUE;

CREATE TRIGGER update_mfa_configs_updated_at
    BEFORE UPDATE ON mfa_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MFA Attempts (Попытки MFA верификации)
-- =============================================================================
CREATE TABLE mfa_attempts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    method              VARCHAR(20) NOT NULL,
    code                VARCHAR(20) NOT NULL,
    is_successful       BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(1000),
    attempted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mfa_attempt_method CHECK (method IN ('TOTP', 'SMS', 'EMAIL'))
);

CREATE INDEX IF NOT EXISTS idx_mfa_attempt_user ON mfa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempt_at ON mfa_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_mfa_attempt_success ON mfa_attempts(user_id, is_successful);

CREATE TRIGGER update_mfa_attempts_updated_at
    BEFORE UPDATE ON mfa_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- OIDC Providers (OIDC провайдеры)
-- =============================================================================
CREATE TABLE oidc_providers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    client_id           VARCHAR(500) NOT NULL,
    client_secret       VARCHAR(500) NOT NULL,
    authorization_url   VARCHAR(1000) NOT NULL,
    token_url           VARCHAR(1000) NOT NULL,
    user_info_url       VARCHAR(1000),
    scope               VARCHAR(500) NOT NULL DEFAULT 'openid email profile',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    icon_url            VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_oidc_provider_code ON oidc_providers(code);
CREATE INDEX IF NOT EXISTS idx_oidc_provider_active ON oidc_providers(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_oidc_providers_updated_at
    BEFORE UPDATE ON oidc_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- OIDC User Mappings (Привязка OIDC пользователей)
-- =============================================================================
CREATE TABLE oidc_user_mappings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oidc_provider_id    UUID NOT NULL,
    external_user_id    VARCHAR(500) NOT NULL,
    internal_user_id    UUID NOT NULL,
    email               VARCHAR(255),
    linked_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_oidc_mapping_provider FOREIGN KEY (oidc_provider_id)
        REFERENCES oidc_providers(id) ON DELETE CASCADE,
    CONSTRAINT uq_oidc_mapping UNIQUE (oidc_provider_id, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oidc_mapping_provider ON oidc_user_mappings(oidc_provider_id);
CREATE INDEX IF NOT EXISTS idx_oidc_mapping_internal ON oidc_user_mappings(internal_user_id);
CREATE INDEX IF NOT EXISTS idx_oidc_mapping_external ON oidc_user_mappings(oidc_provider_id, external_user_id);

CREATE TRIGGER update_oidc_user_mappings_updated_at
    BEFORE UPDATE ON oidc_user_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Security Policies (Политики безопасности)
-- =============================================================================
CREATE TABLE security_policies (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(255) NOT NULL,
    password_min_length         INTEGER NOT NULL DEFAULT 8,
    password_requires_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
    password_requires_number    BOOLEAN NOT NULL DEFAULT TRUE,
    password_requires_special   BOOLEAN NOT NULL DEFAULT FALSE,
    password_expiry_days        INTEGER NOT NULL DEFAULT 0,
    max_login_attempts          INTEGER NOT NULL DEFAULT 5,
    lockout_duration_minutes    INTEGER NOT NULL DEFAULT 30,
    session_timeout_minutes     INTEGER NOT NULL DEFAULT 480,
    require_mfa                 BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_ip_ranges           JSONB DEFAULT '[]'::jsonb,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_password_min_length CHECK (password_min_length >= 4),
    CONSTRAINT chk_max_login_attempts CHECK (max_login_attempts >= 1),
    CONSTRAINT chk_lockout_duration CHECK (lockout_duration_minutes >= 1),
    CONSTRAINT chk_session_timeout CHECK (session_timeout_minutes >= 1)
);

CREATE INDEX IF NOT EXISTS idx_security_policy_active ON security_policies(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_security_policies_updated_at
    BEFORE UPDATE ON security_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default security policy
INSERT INTO security_policies (id, name, password_min_length, password_requires_uppercase,
    password_requires_number, password_requires_special, password_expiry_days,
    max_login_attempts, lockout_duration_minutes, session_timeout_minutes,
    require_mfa, is_active)
VALUES (
    uuid_generate_v4(), 'Политика по умолчанию', 8, TRUE, TRUE, FALSE, 0,
    5, 30, 480, FALSE, TRUE
);

-- =============================================================================
-- User Sessions (Сессии пользователей)
-- =============================================================================
CREATE TABLE user_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    session_token       VARCHAR(500) NOT NULL UNIQUE,
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(1000),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_session_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_session_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_session_expires ON user_sessions(expires_at);

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Login Attempts (Попытки входа)
-- =============================================================================
CREATE TABLE login_attempts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID,
    email               VARCHAR(255) NOT NULL,
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(1000),
    is_successful       BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason      VARCHAR(255),
    attempted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_login_attempt_user ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempt_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempt_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempt_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempt_failed ON login_attempts(email, is_successful, attempted_at)
    WHERE is_successful = FALSE;

CREATE TRIGGER update_login_attempts_updated_at
    BEFORE UPDATE ON login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
