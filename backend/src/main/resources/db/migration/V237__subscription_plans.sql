-- =============================================================================
-- V237: Subscription Plans & Tenant Subscriptions
-- Freemium/subscription model for multi-tenant platform
-- =============================================================================

-- =============================================================================
-- Subscription Plans (Планы подписки)
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(30) NOT NULL UNIQUE,
    display_name            VARCHAR(100) NOT NULL,
    price                   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency                VARCHAR(3) NOT NULL DEFAULT 'RUB',
    billing_period          VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    max_users               INTEGER NOT NULL DEFAULT 3,
    max_projects            INTEGER NOT NULL DEFAULT 1,
    max_storage_gb          INTEGER NOT NULL DEFAULT 1,
    features                TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sp_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_sp_is_active ON subscription_plans(is_active);

-- =============================================================================
-- Tenant Subscriptions (Подписки арендаторов)
-- =============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL,
    plan_id                 UUID NOT NULL REFERENCES subscription_plans(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    start_date              TIMESTAMP WITH TIME ZONE,
    end_date                TIMESTAMP WITH TIME ZONE,
    trial_end_date          TIMESTAMP WITH TIME ZONE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ts_organization_id ON tenant_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ts_plan_id ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_ts_status ON tenant_subscriptions(status);

-- =============================================================================
-- Seed default plans: FREE, PRO, ENTERPRISE
-- =============================================================================
INSERT INTO subscription_plans (id, name, display_name, price, currency, billing_period,
                                 max_users, max_projects, max_storage_gb, features, is_active,
                                 deleted, created_at, updated_at, version)
VALUES
    (uuid_generate_v4(), 'FREE', 'Бесплатный', 0, 'RUB', 'MONTHLY',
     3, 1, 1,
     'projects,tasks,documents,basic_reports',
     TRUE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'PRO', 'Профессиональный', 9900, 'RUB', 'MONTHLY',
     25, 10, 50,
     'projects,tasks,documents,basic_reports,budgets,invoices,payments,cash_flow,procurement,quality,analytics,integrations,api_access',
     TRUE, FALSE, NOW(), NOW(), 0),
    (uuid_generate_v4(), 'ENTERPRISE', 'Корпоративный', 0, 'RUB', 'MONTHLY',
     2147483647, 2147483647, 2147483647,
     'projects,tasks,documents,basic_reports,budgets,invoices,payments,cash_flow,procurement,quality,analytics,integrations,api_access,bim,iot,ai_assistant,monte_carlo,custom_workflows,sla_support,dedicated_manager,sso,audit_log',
     TRUE, FALSE, NOW(), NOW(), 0)
ON CONFLICT (name) DO NOTHING;
