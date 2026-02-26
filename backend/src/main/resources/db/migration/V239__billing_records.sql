-- =============================================================================
-- V239: Billing Records (История платежей)
-- Tracks billing history per tenant for subscription charges
-- =============================================================================
CREATE TABLE IF NOT EXISTS billing_records (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL,
    subscription_id         UUID NOT NULL REFERENCES tenant_subscriptions(id),
    plan_name               VARCHAR(30) NOT NULL,
    plan_display_name       VARCHAR(100) NOT NULL,
    amount                  NUMERIC(12, 2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'RUB',
    billing_type            VARCHAR(20) NOT NULL DEFAULT 'SUBSCRIPTION',
    payment_status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invoice_date            TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date               TIMESTAMP WITH TIME ZONE,
    period_start            TIMESTAMP WITH TIME ZONE,
    period_end              TIMESTAMP WITH TIME ZONE,
    invoice_number          VARCHAR(50),
    description             TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_br_organization_id ON billing_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_br_subscription_id ON billing_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_br_invoice_date ON billing_records(invoice_date);
CREATE INDEX IF NOT EXISTS idx_br_payment_status ON billing_records(payment_status);
