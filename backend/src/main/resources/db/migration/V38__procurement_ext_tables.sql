-- =============================================================================
-- V38: Extended Procurement module tables
-- =============================================================================

-- Sequences for auto-generated codes
CREATE SEQUENCE delivery_route_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE delivery_tracking_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE dispatch_order_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Material Analogs (Аналоги материалов)
-- =============================================================================
CREATE TABLE material_analogs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_material_id    UUID NOT NULL,
    analog_material_id      UUID NOT NULL,
    price_ratio             NUMERIC(8, 4) DEFAULT 1.0,
    quality_notes           TEXT,
    is_approved             BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_id          UUID,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ma_price_ratio CHECK (price_ratio IS NULL OR price_ratio > 0),
    CONSTRAINT chk_ma_different_materials CHECK (original_material_id <> analog_material_id)
);

CREATE UNIQUE INDEX uq_material_analog_pair ON material_analogs(original_material_id, analog_material_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ma_original ON material_analogs(original_material_id);
CREATE INDEX IF NOT EXISTS idx_ma_analog ON material_analogs(analog_material_id);
CREATE INDEX IF NOT EXISTS idx_ma_approved ON material_analogs(is_approved);
CREATE INDEX IF NOT EXISTS idx_ma_deleted ON material_analogs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_material_analogs_updated_at
    BEFORE UPDATE ON material_analogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Material Reservations (Резервирование материалов)
-- =============================================================================
CREATE TABLE material_reservations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id         UUID NOT NULL,
    project_id          UUID NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    reserved_by_id      UUID,
    reserved_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    work_order_id       UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mr_status CHECK (status IN ('ACTIVE', 'RELEASED', 'EXPIRED')),
    CONSTRAINT chk_mr_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_mr_material ON material_reservations(material_id);
CREATE INDEX IF NOT EXISTS idx_mr_project ON material_reservations(project_id);
CREATE INDEX IF NOT EXISTS idx_mr_status ON material_reservations(status);
CREATE INDEX IF NOT EXISTS idx_mr_work_order ON material_reservations(work_order_id);
CREATE INDEX IF NOT EXISTS idx_mr_expires_at ON material_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_mr_deleted ON material_reservations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_material_reservations_updated_at
    BEFORE UPDATE ON material_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Stock Limits (Лимиты запасов)
-- =============================================================================
CREATE TABLE stock_limits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id        UUID NOT NULL,
    material_id         UUID NOT NULL,
    min_quantity        NUMERIC(16, 3) NOT NULL DEFAULT 0,
    max_quantity        NUMERIC(16, 3) NOT NULL DEFAULT 0,
    reorder_point       NUMERIC(16, 3) NOT NULL DEFAULT 0,
    reorder_quantity    NUMERIC(16, 3) NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sl_min CHECK (min_quantity >= 0),
    CONSTRAINT chk_sl_max CHECK (max_quantity >= 0),
    CONSTRAINT chk_sl_reorder_point CHECK (reorder_point >= 0),
    CONSTRAINT chk_sl_reorder_qty CHECK (reorder_quantity >= 0)
);

CREATE UNIQUE INDEX uq_stock_limit_wh_mat ON stock_limits(warehouse_id, material_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sl_warehouse ON stock_limits(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sl_material ON stock_limits(material_id);
CREATE INDEX IF NOT EXISTS idx_sl_active ON stock_limits(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sl_deleted ON stock_limits(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_stock_limits_updated_at
    BEFORE UPDATE ON stock_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Delivery Routes (Маршруты доставки)
-- =============================================================================
CREATE TABLE delivery_routes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    from_address        VARCHAR(1000),
    to_address          VARCHAR(1000),
    distance_km         NUMERIC(10, 2),
    estimated_hours     NUMERIC(6, 2),
    vehicle_type        VARCHAR(30),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_drt_vehicle_type CHECK (vehicle_type IS NULL OR vehicle_type IN (
        'TRUCK', 'VAN', 'TRAILER', 'FLATBED', 'TANKER', 'CRANE', 'OTHER'
    )),
    CONSTRAINT chk_drt_distance CHECK (distance_km IS NULL OR distance_km >= 0),
    CONSTRAINT chk_drt_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_drt_code ON delivery_routes(code);
CREATE INDEX IF NOT EXISTS idx_drt_active ON delivery_routes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_drt_deleted ON delivery_routes(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_delivery_routes_updated_at
    BEFORE UPDATE ON delivery_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Deliveries (Доставки)
-- =============================================================================
CREATE TABLE deliveries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id                UUID REFERENCES delivery_routes(id),
    purchase_order_id       UUID,
    vehicle_id              UUID,
    driver_id               UUID,
    planned_departure_at    TIMESTAMP WITH TIME ZONE,
    planned_arrival_at      TIMESTAMP WITH TIME ZONE,
    actual_departure_at     TIMESTAMP WITH TIME ZONE,
    actual_arrival_at       TIMESTAMP WITH TIME ZONE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    tracking_number         VARCHAR(100),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_del_status CHECK (status IN (
        'PLANNED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_del_route ON deliveries(route_id);
CREATE INDEX IF NOT EXISTS idx_del_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_del_purchase_order ON deliveries(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_del_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_del_tracking ON deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_del_planned_arrival ON deliveries(planned_arrival_at);
CREATE INDEX IF NOT EXISTS idx_del_deleted ON deliveries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Delivery Items (Позиции доставки)
-- =============================================================================
CREATE TABLE delivery_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id         UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    unit                VARCHAR(50),
    weight              NUMERIC(12, 3),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_di_quantity CHECK (quantity > 0),
    CONSTRAINT chk_di_weight CHECK (weight IS NULL OR weight >= 0)
);

CREATE INDEX IF NOT EXISTS idx_di_delivery ON delivery_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_di_material ON delivery_items(material_id);

CREATE TRIGGER update_delivery_items_updated_at
    BEFORE UPDATE ON delivery_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Dispatch Orders (Заявки на диспетчеризацию)
-- =============================================================================
CREATE TABLE dispatch_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    requested_by_id     UUID,
    requested_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    dispatched_at       TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(30) NOT NULL DEFAULT 'NEW',
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_do_priority CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    CONSTRAINT chk_do_status CHECK (status IN (
        'NEW', 'CONFIRMED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_do_project ON dispatch_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_do_status ON dispatch_orders(status);
CREATE INDEX IF NOT EXISTS idx_do_priority ON dispatch_orders(priority);
CREATE INDEX IF NOT EXISTS idx_do_code ON dispatch_orders(code);
CREATE INDEX IF NOT EXISTS idx_do_requested_by ON dispatch_orders(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_do_deleted ON dispatch_orders(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_dispatch_orders_updated_at
    BEFORE UPDATE ON dispatch_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Dispatch Items (Позиции заявки на диспетчеризацию)
-- =============================================================================
CREATE TABLE dispatch_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    from_warehouse_id   UUID,
    to_warehouse_id     UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dsi_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_dsi_order ON dispatch_items(order_id);
CREATE INDEX IF NOT EXISTS idx_dsi_material ON dispatch_items(material_id);
CREATE INDEX IF NOT EXISTS idx_dsi_from_wh ON dispatch_items(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_dsi_to_wh ON dispatch_items(to_warehouse_id);

CREATE TRIGGER update_dispatch_items_updated_at
    BEFORE UPDATE ON dispatch_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Supplier Ratings (Оценки поставщиков)
-- =============================================================================
CREATE TABLE supplier_ratings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id         UUID NOT NULL,
    period_id           VARCHAR(20) NOT NULL,
    quality_score       NUMERIC(4, 2) NOT NULL DEFAULT 0,
    delivery_score      NUMERIC(4, 2) NOT NULL DEFAULT 0,
    price_score         NUMERIC(4, 2) NOT NULL DEFAULT 0,
    overall_score       NUMERIC(4, 2) NOT NULL DEFAULT 0,
    evaluated_by_id     UUID,
    comments            TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sr_quality CHECK (quality_score >= 0 AND quality_score <= 10),
    CONSTRAINT chk_sr_delivery CHECK (delivery_score >= 0 AND delivery_score <= 10),
    CONSTRAINT chk_sr_price CHECK (price_score >= 0 AND price_score <= 10),
    CONSTRAINT chk_sr_overall CHECK (overall_score >= 0 AND overall_score <= 10)
);

CREATE UNIQUE INDEX uq_supplier_period ON supplier_ratings(supplier_id, period_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sr_supplier ON supplier_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sr_period ON supplier_ratings(period_id);
CREATE INDEX IF NOT EXISTS idx_sr_overall ON supplier_ratings(overall_score);
CREATE INDEX IF NOT EXISTS idx_sr_deleted ON supplier_ratings(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_supplier_ratings_updated_at
    BEFORE UPDATE ON supplier_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
