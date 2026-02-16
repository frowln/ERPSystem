-- =============================================================================
-- Accounting Module: Russian Accounting, ENS, Financial Journals
-- Plan of accounts, entries, periods, tax declarations, ENS, journals,
-- cost centers, fixed assets, depreciation, counterparties, reconciliation acts
-- =============================================================================

-- =============================================================================
-- Sequences
-- =============================================================================
CREATE SEQUENCE account_entry_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE journal_entry_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE ens_payment_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Account Plan (План счетов)
-- =============================================================================
CREATE TABLE account_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    account_type        VARCHAR(20) NOT NULL,
    parent_id           UUID REFERENCES account_plans(id),
    is_analytical       BOOLEAN NOT NULL DEFAULT FALSE,
    description         TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_account_plan_type CHECK (account_type IN ('ACTIVE', 'PASSIVE', 'ACTIVE_PASSIVE')),
    CONSTRAINT uq_account_plan_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_account_plan_code ON account_plans(code);
CREATE INDEX IF NOT EXISTS idx_account_plan_parent ON account_plans(parent_id);
CREATE INDEX IF NOT EXISTS idx_account_plan_type ON account_plans(account_type);
CREATE INDEX IF NOT EXISTS idx_account_plan_active ON account_plans(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_account_plans_updated_at
    BEFORE UPDATE ON account_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Account Periods (Учётные периоды)
-- =============================================================================
CREATE TABLE account_periods (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,
    status              VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    closed_by_id        UUID,
    closed_at           TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_account_period_status CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT chk_account_period_month CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT chk_account_period_year CHECK (year BETWEEN 2000 AND 2100),
    CONSTRAINT uq_account_period UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_account_period_status ON account_periods(status);
CREATE INDEX IF NOT EXISTS idx_account_period_year_month ON account_periods(year, month);
CREATE INDEX IF NOT EXISTS idx_account_period_active ON account_periods(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_account_periods_updated_at
    BEFORE UPDATE ON account_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Financial Journals (Журналы)
-- =============================================================================
CREATE TABLE financial_journals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    journal_type        VARCHAR(20) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_journal_type CHECK (journal_type IN ('BANK', 'CASH', 'SALES', 'PURCHASE', 'GENERAL')),
    CONSTRAINT uq_financial_journal_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_financial_journal_code ON financial_journals(code);
CREATE INDEX IF NOT EXISTS idx_financial_journal_type ON financial_journals(journal_type);
CREATE INDEX IF NOT EXISTS idx_financial_journal_active ON financial_journals(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_financial_journals_updated_at
    BEFORE UPDATE ON financial_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Account Entries (Проводки)
-- =============================================================================
CREATE TABLE account_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id          UUID NOT NULL REFERENCES financial_journals(id),
    debit_account_id    UUID NOT NULL REFERENCES account_plans(id),
    credit_account_id   UUID NOT NULL REFERENCES account_plans(id),
    amount              NUMERIC(18, 2) NOT NULL,
    entry_date          DATE NOT NULL,
    description         VARCHAR(1000),
    document_type       VARCHAR(50),
    document_id         UUID,
    period_id           UUID NOT NULL REFERENCES account_periods(id),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_account_entry_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_account_entry_journal ON account_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_debit ON account_entries(debit_account_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_credit ON account_entries(credit_account_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_date ON account_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_account_entry_period ON account_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_document ON account_entries(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_active ON account_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_account_entries_updated_at
    BEFORE UPDATE ON account_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tax Declarations (Налоговые декларации)
-- =============================================================================
CREATE TABLE tax_declarations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_type    VARCHAR(20) NOT NULL,
    period_id           UUID NOT NULL REFERENCES account_periods(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    amount              NUMERIC(18, 2) NOT NULL DEFAULT 0,
    submitted_at        TIMESTAMP WITH TIME ZONE,
    accepted_at         TIMESTAMP WITH TIME ZONE,
    file_url            VARCHAR(1000),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_tax_declaration_type CHECK (declaration_type IN ('VAT', 'PROFIT', 'PROPERTY', 'USN')),
    CONSTRAINT chk_tax_declaration_status CHECK (status IN ('DRAFT', 'CALCULATED', 'SUBMITTED', 'ACCEPTED')),
    CONSTRAINT chk_tax_declaration_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tax_declaration_type ON tax_declarations(declaration_type);
CREATE INDEX IF NOT EXISTS idx_tax_declaration_period ON tax_declarations(period_id);
CREATE INDEX IF NOT EXISTS idx_tax_declaration_status ON tax_declarations(status);
CREATE INDEX IF NOT EXISTS idx_tax_declaration_active ON tax_declarations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_tax_declarations_updated_at
    BEFORE UPDATE ON tax_declarations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ENS Account (Единый налоговый счёт)
-- =============================================================================
CREATE TABLE ens_accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inn                 VARCHAR(12) NOT NULL,
    balance             NUMERIC(18, 2) NOT NULL DEFAULT 0,
    last_sync_at        TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_ens_account_inn UNIQUE (inn)
);

CREATE INDEX IF NOT EXISTS idx_ens_account_inn ON ens_accounts(inn);
CREATE INDEX IF NOT EXISTS idx_ens_account_active ON ens_accounts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ens_accounts_updated_at
    BEFORE UPDATE ON ens_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ENS Payments (Платежи ЕНС)
-- =============================================================================
CREATE TABLE ens_payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ens_account_id      UUID NOT NULL REFERENCES ens_accounts(id),
    amount              NUMERIC(18, 2) NOT NULL,
    payment_date        DATE NOT NULL,
    tax_type            VARCHAR(30) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    receipt_url         VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ens_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_ens_payment_tax_type CHECK (tax_type IN ('VAT', 'PROFIT_TAX', 'PROPERTY_TAX', 'TRANSPORT_TAX', 'PERSONAL_INCOME', 'INSURANCE', 'OTHER')),
    CONSTRAINT chk_ens_payment_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'RECONCILED'))
);

CREATE INDEX IF NOT EXISTS idx_ens_payment_account ON ens_payments(ens_account_id);
CREATE INDEX IF NOT EXISTS idx_ens_payment_date ON ens_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_ens_payment_tax_type ON ens_payments(tax_type);
CREATE INDEX IF NOT EXISTS idx_ens_payment_status ON ens_payments(status);
CREATE INDEX IF NOT EXISTS idx_ens_payment_active ON ens_payments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ens_payments_updated_at
    BEFORE UPDATE ON ens_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ENS Reconciliations (Сверка ЕНС)
-- =============================================================================
CREATE TABLE ens_reconciliations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ens_account_id      UUID NOT NULL REFERENCES ens_accounts(id),
    period_id           UUID NOT NULL REFERENCES account_periods(id),
    expected_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    actual_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    difference          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ens_reconciliation_status CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'MATCHED', 'DISCREPANCY', 'RESOLVED'))
);

CREATE INDEX IF NOT EXISTS idx_ens_reconciliation_account ON ens_reconciliations(ens_account_id);
CREATE INDEX IF NOT EXISTS idx_ens_reconciliation_period ON ens_reconciliations(period_id);
CREATE INDEX IF NOT EXISTS idx_ens_reconciliation_status ON ens_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_ens_reconciliation_active ON ens_reconciliations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ens_reconciliations_updated_at
    BEFORE UPDATE ON ens_reconciliations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Journal Entries (Записи журнала)
-- =============================================================================
CREATE TABLE journal_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id          UUID NOT NULL REFERENCES financial_journals(id),
    entry_number        VARCHAR(50) NOT NULL,
    entry_date          DATE NOT NULL,
    total_debit         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_credit        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    posted_by_id        UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_journal_entry_status CHECK (status IN ('DRAFT', 'POSTED', 'CANCELLED')),
    CONSTRAINT chk_journal_entry_debit CHECK (total_debit >= 0),
    CONSTRAINT chk_journal_entry_credit CHECK (total_credit >= 0)
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_journal ON journal_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entry_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entry_number ON journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entry_active ON journal_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Journal Lines (Строки журнала)
-- =============================================================================
CREATE TABLE journal_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id            UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES account_plans(id),
    debit               NUMERIC(18, 2) NOT NULL DEFAULT 0,
    credit              NUMERIC(18, 2) NOT NULL DEFAULT 0,
    partner_id          UUID,
    description         VARCHAR(1000),
    analytic_tags       JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_journal_line_debit CHECK (debit >= 0),
    CONSTRAINT chk_journal_line_credit CHECK (credit >= 0),
    CONSTRAINT chk_journal_line_debit_or_credit CHECK (debit > 0 OR credit > 0)
);

CREATE INDEX IF NOT EXISTS idx_journal_line_entry ON journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_line_account ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_line_partner ON journal_lines(partner_id);
CREATE INDEX IF NOT EXISTS idx_journal_line_active ON journal_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_journal_lines_updated_at
    BEFORE UPDATE ON journal_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Cost Centers (Центры затрат)
-- =============================================================================
CREATE TABLE cost_centers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    project_id          UUID,
    parent_id           UUID REFERENCES cost_centers(id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_cost_center_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_cost_center_code ON cost_centers(code);
CREATE INDEX IF NOT EXISTS idx_cost_center_project ON cost_centers(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_parent ON cost_centers(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_active ON cost_centers(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_cost_centers_updated_at
    BEFORE UPDATE ON cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Cost Allocations (Распределение затрат)
-- =============================================================================
CREATE TABLE cost_allocations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cost_center_id      UUID NOT NULL REFERENCES cost_centers(id),
    period_id           UUID NOT NULL REFERENCES account_periods(id),
    account_id          UUID NOT NULL REFERENCES account_plans(id),
    amount              NUMERIC(18, 2) NOT NULL,
    allocation_type     VARCHAR(30) NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cost_allocation_amount CHECK (amount >= 0),
    CONSTRAINT chk_cost_allocation_type CHECK (allocation_type IN ('DIRECT', 'PROPORTIONAL', 'FIXED'))
);

CREATE INDEX IF NOT EXISTS idx_cost_allocation_center ON cost_allocations(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocation_period ON cost_allocations(period_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocation_account ON cost_allocations(account_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocation_active ON cost_allocations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_cost_allocations_updated_at
    BEFORE UPDATE ON cost_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Fixed Assets (Основные средства)
-- =============================================================================
CREATE TABLE fixed_assets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    inventory_number    VARCHAR(50) NOT NULL,
    account_id          UUID REFERENCES account_plans(id),
    purchase_date       DATE NOT NULL,
    purchase_amount     NUMERIC(18, 2) NOT NULL,
    useful_life_months  INTEGER NOT NULL,
    depreciation_method VARCHAR(20) NOT NULL DEFAULT 'LINEAR',
    current_value       NUMERIC(18, 2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_fixed_asset_purchase_amount CHECK (purchase_amount > 0),
    CONSTRAINT chk_fixed_asset_useful_life CHECK (useful_life_months > 0),
    CONSTRAINT chk_fixed_asset_current_value CHECK (current_value >= 0),
    CONSTRAINT chk_fixed_asset_method CHECK (depreciation_method IN ('LINEAR', 'REDUCING_BALANCE', 'SUM_OF_YEARS')),
    CONSTRAINT chk_fixed_asset_status CHECK (status IN ('DRAFT', 'ACTIVE', 'DISPOSED')),
    CONSTRAINT uq_fixed_asset_inventory UNIQUE (inventory_number)
);

CREATE INDEX IF NOT EXISTS idx_fixed_asset_code ON fixed_assets(code);
CREATE INDEX IF NOT EXISTS idx_fixed_asset_inventory ON fixed_assets(inventory_number);
CREATE INDEX IF NOT EXISTS idx_fixed_asset_account ON fixed_assets(account_id);
CREATE INDEX IF NOT EXISTS idx_fixed_asset_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_asset_active ON fixed_assets(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_fixed_assets_updated_at
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Depreciation Schedules (Амортизация)
-- =============================================================================
CREATE TABLE depreciation_schedules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id            UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    period_id           UUID NOT NULL REFERENCES account_periods(id),
    amount              NUMERIC(18, 2) NOT NULL,
    accumulated_amount  NUMERIC(18, 2) NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_depreciation_amount CHECK (amount >= 0),
    CONSTRAINT chk_depreciation_accumulated CHECK (accumulated_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON depreciation_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_period ON depreciation_schedules(period_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_active ON depreciation_schedules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_depreciation_schedules_updated_at
    BEFORE UPDATE ON depreciation_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Counterparties (Контрагенты)
-- =============================================================================
CREATE TABLE counterparties (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    inn                 VARCHAR(12) NOT NULL,
    kpp                 VARCHAR(9),
    ogrn                VARCHAR(15),
    legal_address       VARCHAR(1000),
    actual_address      VARCHAR(1000),
    bank_account        VARCHAR(20),
    bik                 VARCHAR(9),
    correspondent_account VARCHAR(20),
    is_supplier         BOOLEAN NOT NULL DEFAULT FALSE,
    is_customer         BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_counterparty_inn UNIQUE (inn)
);

CREATE INDEX IF NOT EXISTS idx_counterparty_inn ON counterparties(inn);
CREATE INDEX IF NOT EXISTS idx_counterparty_name ON counterparties(name);
CREATE INDEX IF NOT EXISTS idx_counterparty_supplier ON counterparties(is_supplier) WHERE is_supplier = TRUE;
CREATE INDEX IF NOT EXISTS idx_counterparty_customer ON counterparties(is_customer) WHERE is_customer = TRUE;
CREATE INDEX IF NOT EXISTS idx_counterparty_active ON counterparties(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_counterparties_updated_at
    BEFORE UPDATE ON counterparties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Reconciliation Acts (Акты сверки)
-- =============================================================================
CREATE TABLE reconciliation_acts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counterparty_id     UUID NOT NULL REFERENCES counterparties(id),
    period_id           UUID NOT NULL REFERENCES account_periods(id),
    our_debit           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    our_credit          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    their_debit         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    their_credit        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    difference          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    signed_at           TIMESTAMP WITH TIME ZONE,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_reconciliation_act_status CHECK (status IN ('DRAFT', 'SENT', 'CONFIRMED', 'DISPUTED')),
    CONSTRAINT chk_reconciliation_act_our_debit CHECK (our_debit >= 0),
    CONSTRAINT chk_reconciliation_act_our_credit CHECK (our_credit >= 0),
    CONSTRAINT chk_reconciliation_act_their_debit CHECK (their_debit >= 0),
    CONSTRAINT chk_reconciliation_act_their_credit CHECK (their_credit >= 0)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_act_counterparty ON reconciliation_acts(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_act_period ON reconciliation_acts(period_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_act_status ON reconciliation_acts(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_act_active ON reconciliation_acts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_reconciliation_acts_updated_at
    BEFORE UPDATE ON reconciliation_acts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Seed data: Standard Russian Chart of Accounts
-- =============================================================================
INSERT INTO account_plans (code, name, account_type, is_analytical, description) VALUES
    ('01', 'Основные средства', 'ACTIVE', false, 'Счёт 01 — Основные средства'),
    ('02', 'Амортизация основных средств', 'PASSIVE', false, 'Счёт 02 — Амортизация ОС'),
    ('04', 'Нематериальные активы', 'ACTIVE', false, 'Счёт 04 — НМА'),
    ('05', 'Амортизация НМА', 'PASSIVE', false, 'Счёт 05 — Амортизация НМА'),
    ('08', 'Вложения во внеоборотные активы', 'ACTIVE', true, 'Счёт 08 — Капитальные вложения'),
    ('10', 'Материалы', 'ACTIVE', true, 'Счёт 10 — Материалы'),
    ('19', 'НДС по приобретённым ценностям', 'ACTIVE', false, 'Счёт 19 — НДС входящий'),
    ('20', 'Основное производство', 'ACTIVE', true, 'Счёт 20 — Основное производство'),
    ('25', 'Общепроизводственные расходы', 'ACTIVE', true, 'Счёт 25 — ОПР'),
    ('26', 'Общехозяйственные расходы', 'ACTIVE', true, 'Счёт 26 — ОХР'),
    ('41', 'Товары', 'ACTIVE', true, 'Счёт 41 — Товары'),
    ('43', 'Готовая продукция', 'ACTIVE', true, 'Счёт 43 — Готовая продукция'),
    ('50', 'Касса', 'ACTIVE', false, 'Счёт 50 — Касса'),
    ('51', 'Расчётные счета', 'ACTIVE', false, 'Счёт 51 — Расчётный счёт'),
    ('52', 'Валютные счета', 'ACTIVE', false, 'Счёт 52 — Валютный счёт'),
    ('60', 'Расчёты с поставщиками и подрядчиками', 'ACTIVE_PASSIVE', true, 'Счёт 60 — Поставщики'),
    ('62', 'Расчёты с покупателями и заказчиками', 'ACTIVE_PASSIVE', true, 'Счёт 62 — Покупатели'),
    ('66', 'Расчёты по краткосрочным кредитам', 'PASSIVE', false, 'Счёт 66 — Краткосрочные кредиты'),
    ('67', 'Расчёты по долгосрочным кредитам', 'PASSIVE', false, 'Счёт 67 — Долгосрочные кредиты'),
    ('68', 'Расчёты по налогам и сборам', 'ACTIVE_PASSIVE', true, 'Счёт 68 — Налоги и сборы'),
    ('69', 'Расчёты по социальному страхованию', 'ACTIVE_PASSIVE', true, 'Счёт 69 — Страховые взносы'),
    ('70', 'Расчёты с персоналом по оплате труда', 'PASSIVE', false, 'Счёт 70 — Зарплата'),
    ('71', 'Расчёты с подотчётными лицами', 'ACTIVE_PASSIVE', false, 'Счёт 71 — Подотчётные лица'),
    ('76', 'Расчёты с разными дебиторами и кредиторами', 'ACTIVE_PASSIVE', true, 'Счёт 76 — Разные дебиторы и кредиторы'),
    ('80', 'Уставный капитал', 'PASSIVE', false, 'Счёт 80 — Уставный капитал'),
    ('82', 'Резервный капитал', 'PASSIVE', false, 'Счёт 82 — Резервный капитал'),
    ('83', 'Добавочный капитал', 'PASSIVE', false, 'Счёт 83 — Добавочный капитал'),
    ('84', 'Нераспределённая прибыль', 'ACTIVE_PASSIVE', false, 'Счёт 84 — Нераспределённая прибыль'),
    ('90', 'Продажи', 'ACTIVE_PASSIVE', true, 'Счёт 90 — Продажи'),
    ('91', 'Прочие доходы и расходы', 'ACTIVE_PASSIVE', true, 'Счёт 91 — Прочие доходы/расходы'),
    ('99', 'Прибыли и убытки', 'ACTIVE_PASSIVE', false, 'Счёт 99 — Прибыли и убытки');
