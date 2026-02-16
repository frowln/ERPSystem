-- =============================================================================
-- V91: Purchase Orders, Limit Fence Sheets, Warehouse Orders, Reconciliation Acts
-- Completes the full supply chain: Request → Order → Delivery → Receipt → Issue
-- =============================================================================

-- Purchase Orders (Заказ поставщику)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    project_id UUID REFERENCES projects(id),
    purchase_request_id UUID REFERENCES purchase_requests(id),
    contract_id UUID REFERENCES contracts(id),
    supplier_id UUID NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal NUMERIC(18,2) DEFAULT 0,
    vat_amount NUMERIC(18,2) DEFAULT 0,
    total_amount NUMERIC(18,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'RUB',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    payment_terms VARCHAR(500),
    delivery_address VARCHAR(1000),
    notes TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_po_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_request ON purchase_orders(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_po_contract ON purchase_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(order_number);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
    material_id UUID NOT NULL,
    material_name VARCHAR(500),
    unit VARCHAR(20),
    quantity NUMERIC(18,4) NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 20.00,
    total_amount NUMERIC(18,2),
    delivered_quantity NUMERIC(18,4) DEFAULT 0,
    specification_item_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_poi_order ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_material ON purchase_order_items(material_id);

-- Limit Fence Sheets (ЛРВ - Лимитно-заборная ведомость, М-8)
CREATE TABLE IF NOT EXISTS limit_fence_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_number VARCHAR(50) NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id),
    material_id UUID NOT NULL,
    material_name VARCHAR(500),
    unit VARCHAR(20),
    limit_quantity NUMERIC(18,4) NOT NULL,
    issued_quantity NUMERIC(18,4) DEFAULT 0,
    returned_quantity NUMERIC(18,4) DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    warehouse_id UUID,
    responsible_id UUID,
    specification_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    organization_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_lfs_project ON limit_fence_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_lfs_material ON limit_fence_sheets(material_id);
CREATE INDEX IF NOT EXISTS idx_lfs_status ON limit_fence_sheets(status);
CREATE INDEX IF NOT EXISTS idx_lfs_period ON limit_fence_sheets(period_start, period_end);

-- Warehouse Orders (Приходный ордер М-4 / Расходный ордер М-11)
CREATE TABLE IF NOT EXISTS warehouse_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL,
    order_date DATE NOT NULL,
    warehouse_id UUID NOT NULL,
    stock_movement_id UUID,
    counterparty_id UUID,
    contract_id UUID,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    responsible_id UUID,
    receiver_id UUID,
    total_quantity NUMERIC(18,4) DEFAULT 0,
    total_amount NUMERIC(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_wo_type ON warehouse_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_wo_warehouse ON warehouse_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wo_stock_movement ON warehouse_orders(stock_movement_id);
CREATE INDEX IF NOT EXISTS idx_wo_number ON warehouse_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_wo_status ON warehouse_orders(status);

-- Warehouse Order Items
CREATE TABLE IF NOT EXISTS warehouse_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_order_id UUID NOT NULL REFERENCES warehouse_orders(id),
    material_id UUID NOT NULL,
    material_name VARCHAR(500),
    unit VARCHAR(20),
    quantity NUMERIC(18,4) NOT NULL,
    unit_price NUMERIC(18,2),
    total_amount NUMERIC(18,2),
    lot_number VARCHAR(100),
    certificate_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_woi_order ON warehouse_order_items(warehouse_order_id);
CREATE INDEX IF NOT EXISTS idx_woi_material ON warehouse_order_items(material_id);

-- Reconciliation Acts (Акт сверки взаиморасчётов)
CREATE TABLE IF NOT EXISTS reconciliation_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_number VARCHAR(50) NOT NULL UNIQUE,
    counterparty_id UUID NOT NULL,
    contract_id UUID,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    our_debit NUMERIC(18,2) DEFAULT 0,
    our_credit NUMERIC(18,2) DEFAULT 0,
    our_balance NUMERIC(18,2) DEFAULT 0,
    counterparty_debit NUMERIC(18,2) DEFAULT 0,
    counterparty_credit NUMERIC(18,2) DEFAULT 0,
    counterparty_balance NUMERIC(18,2) DEFAULT 0,
    discrepancy NUMERIC(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    signed_by_us BOOLEAN,
    signed_by_counterparty BOOLEAN,
    signed_date DATE,
    notes TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_rec_counterparty ON reconciliation_acts(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_rec_contract ON reconciliation_acts(contract_id);
CREATE INDEX IF NOT EXISTS idx_rec_period ON reconciliation_acts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_rec_status ON reconciliation_acts(status);
