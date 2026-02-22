-- V108: Добавить составные индексы с organization_id для tenant scoping и производительности.
-- Миграция должна быть безопасной для инсталляций, где часть таблиц/колонок появилась позже.

DO $$
BEGIN
    -- invoices
    IF to_regclass('public.invoices') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_invoice_org_status ON invoices (organization_id, status, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_invoice_org_type_status ON invoices (organization_id, invoice_type, status, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_invoice_org_date ON invoices (organization_id, invoice_date DESC, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_invoice_org_project_status ON invoices (organization_id, project_id, status, deleted) WHERE deleted = false';
        EXECUTE 'DROP INDEX IF EXISTS idx_invoice_number';
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_org ON invoices (organization_id, number) WHERE deleted = false';
    END IF;

    -- payments
    IF to_regclass('public.payments') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE payments ADD COLUMN IF NOT EXISTS organization_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_org_status ON payments (organization_id, status, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_org_date ON payments (organization_id, payment_date DESC, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_org_project ON payments (organization_id, project_id, deleted) WHERE deleted = false';
    END IF;

    -- budgets
    IF to_regclass('public.budgets') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE budgets ADD COLUMN IF NOT EXISTS organization_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_budget_org_project ON budgets (organization_id, project_id, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_budget_org_status ON budgets (organization_id, status, deleted) WHERE deleted = false';
    END IF;

    -- contracts
    IF to_regclass('public.contracts') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contract_org_status ON contracts (organization_id, status, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contract_org_project_status ON contracts (organization_id, project_id, status, deleted) WHERE deleted = false';
    END IF;

    -- purchase_requests
    IF to_regclass('public.purchase_requests') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS organization_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pr_org_status ON purchase_requests (organization_id, status, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pr_org_project_status ON purchase_requests (organization_id, project_id, status, deleted) WHERE deleted = false';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pr_org_priority ON purchase_requests (organization_id, priority, status, deleted) WHERE deleted = false';
    END IF;

    -- stock_entries
    IF to_regclass('public.stock_entries') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE stock_entries ADD COLUMN IF NOT EXISTS organization_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stock_org_material_location ON stock_entries (organization_id, material_id, location_id, deleted) WHERE deleted = false';
    END IF;
END $$;
