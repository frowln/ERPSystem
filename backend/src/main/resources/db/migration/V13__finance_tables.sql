-- =============================================================================
-- Finance Module: Budgets, Payments, Invoices, Cash Flow
-- =============================================================================

-- =============================================================================
-- Sequences for auto-numbering
-- =============================================================================
CREATE SEQUENCE payment_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE invoice_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Budgets (Бюджеты)
-- =============================================================================
CREATE TABLE budgets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    project_id          UUID,
    contract_id         UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    planned_revenue     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    planned_cost        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    planned_margin      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_revenue      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_cost         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_margin       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    doc_version         INTEGER NOT NULL DEFAULT 1,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_budget_status CHECK (status IN ('DRAFT', 'APPROVED', 'ACTIVE', 'FROZEN', 'CLOSED')),
    CONSTRAINT chk_budget_planned_revenue CHECK (planned_revenue >= 0),
    CONSTRAINT chk_budget_planned_cost CHECK (planned_cost >= 0),
    CONSTRAINT chk_budget_actual_revenue CHECK (actual_revenue >= 0),
    CONSTRAINT chk_budget_actual_cost CHECK (actual_cost >= 0),
    CONSTRAINT chk_budget_doc_version CHECK (doc_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_budget_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_contract ON budgets(contract_id);
CREATE INDEX IF NOT EXISTS idx_budget_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_active ON budgets(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Budget Items (Статьи бюджета)
-- =============================================================================
CREATE TABLE budget_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id           UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    sequence            INTEGER DEFAULT 0,
    category            VARCHAR(20) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    planned_amount      NUMERIC(18, 2) NOT NULL,
    actual_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    committed_amount    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    remaining_amount    NUMERIC(18, 2),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_budget_item_category CHECK (category IN ('MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER')),
    CONSTRAINT chk_budget_item_planned CHECK (planned_amount >= 0),
    CONSTRAINT chk_budget_item_actual CHECK (actual_amount >= 0),
    CONSTRAINT chk_budget_item_committed CHECK (committed_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_budget_item_budget ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_category ON budget_items(category);
CREATE INDEX IF NOT EXISTS idx_budget_item_active ON budget_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_budget_items_updated_at
    BEFORE UPDATE ON budget_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Payments (Платежи)
-- =============================================================================
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number              VARCHAR(50) UNIQUE,
    payment_date        DATE NOT NULL,
    project_id          UUID,
    contract_id         UUID,
    partner_id          UUID,
    partner_name        VARCHAR(500),
    payment_type        VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    amount              NUMERIC(18, 2) NOT NULL,
    vat_amount          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(18, 2),
    purpose             VARCHAR(1000),
    bank_account        VARCHAR(100),
    invoice_id          UUID,
    approved_by_id      UUID,
    approved_at         TIMESTAMP WITH TIME ZONE,
    paid_at             TIMESTAMP WITH TIME ZONE,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_payment_type CHECK (payment_type IN ('INCOMING', 'OUTGOING')),
    CONSTRAINT chk_payment_status CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_vat CHECK (vat_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_number ON payments(number);
CREATE INDEX IF NOT EXISTS idx_payment_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_active ON payments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Invoices (Счета)
-- =============================================================================
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number              VARCHAR(50) UNIQUE,
    invoice_date        DATE NOT NULL,
    due_date            DATE,
    project_id          UUID,
    contract_id         UUID,
    partner_id          UUID,
    partner_name        VARCHAR(500),
    invoice_type        VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    subtotal            NUMERIC(18, 2),
    vat_rate            NUMERIC(5, 2) DEFAULT 20.00,
    vat_amount          NUMERIC(18, 2),
    total_amount        NUMERIC(18, 2) NOT NULL,
    paid_amount         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    remaining_amount    NUMERIC(18, 2),
    ks2_id              UUID,
    ks3_id              UUID,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_invoice_type CHECK (invoice_type IN ('ISSUED', 'RECEIVED')),
    CONSTRAINT chk_invoice_status CHECK (status IN ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_invoice_total CHECK (total_amount > 0),
    CONSTRAINT chk_invoice_paid CHECK (paid_amount >= 0),
    CONSTRAINT chk_invoice_vat_rate CHECK (vat_rate IS NULL OR (vat_rate >= 0 AND vat_rate <= 100)),
    CONSTRAINT chk_invoice_due_date CHECK (due_date IS NULL OR due_date >= invoice_date)
);

CREATE INDEX IF NOT EXISTS idx_invoice_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_active ON invoices(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Invoice Lines (Строки счёта)
-- =============================================================================
CREATE TABLE invoice_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sequence            INTEGER DEFAULT 0,
    name                VARCHAR(500) NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    unit_price          NUMERIC(18, 2) NOT NULL,
    amount              NUMERIC(18, 2),
    unit_of_measure     VARCHAR(50),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_invoice_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_invoice_line_unit_price CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_active ON invoice_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_invoice_lines_updated_at
    BEFORE UPDATE ON invoice_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Cash Flow Entries (Движение денежных средств)
-- =============================================================================
CREATE TABLE cash_flow_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    entry_date          DATE NOT NULL,
    direction           VARCHAR(10) NOT NULL,
    category            VARCHAR(30) NOT NULL,
    amount              NUMERIC(18, 2) NOT NULL,
    description         VARCHAR(500),
    payment_id          UUID REFERENCES payments(id),
    invoice_id          UUID REFERENCES invoices(id),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cashflow_direction CHECK (direction IN ('in', 'out')),
    CONSTRAINT chk_cashflow_category CHECK (category IN ('CONTRACT_PAYMENT', 'MATERIAL_PURCHASE', 'SALARY', 'SUBCONTRACT', 'TAX', 'EQUIPMENT', 'OTHER')),
    CONSTRAINT chk_cashflow_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_cashflow_project ON cash_flow_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_date ON cash_flow_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cashflow_direction ON cash_flow_entries(direction);
CREATE INDEX IF NOT EXISTS idx_cashflow_category ON cash_flow_entries(category);
CREATE INDEX IF NOT EXISTS idx_cashflow_payment ON cash_flow_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_invoice ON cash_flow_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_active ON cash_flow_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_cash_flow_entries_updated_at
    BEFORE UPDATE ON cash_flow_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
