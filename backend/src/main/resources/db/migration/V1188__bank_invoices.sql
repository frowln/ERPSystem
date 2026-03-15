CREATE TABLE IF NOT EXISTS bank_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    plan_id UUID,
    invoice_number VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    buyer_name VARCHAR(255),
    buyer_inn VARCHAR(12),
    buyer_kpp VARCHAR(9),
    buyer_address TEXT,
    seller_name VARCHAR(255),
    seller_inn VARCHAR(12),
    seller_kpp VARCHAR(9),
    seller_bank_account VARCHAR(20),
    seller_bank_bik VARCHAR(9),
    seller_bank_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ
);

CREATE INDEX idx_bank_invoices_org ON bank_invoices(organization_id);
