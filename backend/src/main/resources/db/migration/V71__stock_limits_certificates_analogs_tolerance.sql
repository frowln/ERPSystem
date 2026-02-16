-- =============================================================================
-- V71: Stock Limits, Material Certificates, Material Analogs, Tolerance Rules
-- =============================================================================

-- =============================================================================
-- Stock Limits (Лимиты запасов)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stock_limits (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id             UUID NOT NULL REFERENCES materials(id),
    warehouse_location_id   UUID NOT NULL REFERENCES warehouse_locations(id),
    min_quantity            NUMERIC(16, 3),
    max_quantity            NUMERIC(16, 3),
    reorder_point           NUMERIC(16, 3),
    reorder_quantity        NUMERIC(16, 3),
    unit                    VARCHAR(50),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    last_alert_at           TIMESTAMP,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sl_min_qty CHECK (min_quantity IS NULL OR min_quantity >= 0),
    CONSTRAINT chk_sl_max_qty CHECK (max_quantity IS NULL OR max_quantity >= 0),
    CONSTRAINT chk_sl_reorder_point CHECK (reorder_point IS NULL OR reorder_point >= 0),
    CONSTRAINT chk_sl_reorder_qty CHECK (reorder_quantity IS NULL OR reorder_quantity >= 0)
);

CREATE UNIQUE INDEX uq_stock_limit_material_location ON stock_limits(material_id, warehouse_location_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sl_material ON stock_limits(material_id);
CREATE INDEX IF NOT EXISTS idx_sl_warehouse_location ON stock_limits(warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_sl_active ON stock_limits(is_active);
CREATE INDEX IF NOT EXISTS idx_sl_deleted ON stock_limits(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_stock_limits_updated_at ON stock_limits;
CREATE TRIGGER update_stock_limits_updated_at
    BEFORE UPDATE ON stock_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Stock Limit Alerts (Оповещения о лимитах запасов)
-- =============================================================================
CREATE TABLE stock_limit_alerts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_limit_id          UUID NOT NULL REFERENCES stock_limits(id) ON DELETE CASCADE,
    material_id             UUID NOT NULL REFERENCES materials(id),
    material_name           VARCHAR(500),
    current_quantity        NUMERIC(16, 3),
    limit_type              VARCHAR(30) NOT NULL,
    severity                VARCHAR(30) NOT NULL,
    acknowledged_by_id      UUID REFERENCES users(id),
    acknowledged_at         TIMESTAMP,
    is_resolved             BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sla_limit_type CHECK (limit_type IN ('BELOW_MIN', 'ABOVE_MAX', 'REORDER_POINT')),
    CONSTRAINT chk_sla_severity CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_sla_stock_limit ON stock_limit_alerts(stock_limit_id);
CREATE INDEX IF NOT EXISTS idx_sla_material ON stock_limit_alerts(material_id);
CREATE INDEX IF NOT EXISTS idx_sla_limit_type ON stock_limit_alerts(limit_type);
CREATE INDEX IF NOT EXISTS idx_sla_severity ON stock_limit_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_sla_resolved ON stock_limit_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_sla_deleted ON stock_limit_alerts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_stock_limit_alerts_updated_at
    BEFORE UPDATE ON stock_limit_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Material Certificates (Сертификаты материалов)
-- =============================================================================
CREATE TABLE IF NOT EXISTS material_certificates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id             UUID NOT NULL,
    material_name           VARCHAR(500),
    certificate_number      VARCHAR(100) NOT NULL,
    certificate_type        VARCHAR(30) NOT NULL,
    issued_by               VARCHAR(500),
    issued_date             DATE NOT NULL,
    expiry_date             DATE,
    file_url                VARCHAR(1000),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    verified_by_id          UUID REFERENCES users(id),
    verified_at             TIMESTAMP,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mc_certificate_type CHECK (certificate_type IN (
        'QUALITY', 'CONFORMITY', 'ORIGIN', 'TEST', 'SAFETY', 'GOST', 'ISO'
    )),
    CONSTRAINT chk_mc_status CHECK (status IN (
        'VALID', 'EXPIRED', 'REVOKED', 'PENDING_VERIFICATION'
    ))
);

CREATE INDEX IF NOT EXISTS idx_mc_material ON material_certificates(material_id);
CREATE INDEX IF NOT EXISTS idx_mc_certificate_number ON material_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_mc_certificate_type ON material_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_mc_status ON material_certificates(status);
CREATE INDEX IF NOT EXISTS idx_mc_expiry_date ON material_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_mc_issued_date ON material_certificates(issued_date);
CREATE INDEX IF NOT EXISTS idx_mc_deleted ON material_certificates(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_material_certificates_updated_at ON material_certificates;
CREATE TRIGGER update_material_certificates_updated_at
    BEFORE UPDATE ON material_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Certificate Lines (Строки сертификата)
-- =============================================================================
CREATE TABLE certificate_lines (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id          UUID NOT NULL REFERENCES material_certificates(id) ON DELETE CASCADE,
    parameter_name          VARCHAR(500) NOT NULL,
    standard_value          VARCHAR(255),
    actual_value            VARCHAR(255),
    unit                    VARCHAR(50),
    is_compliant            BOOLEAN NOT NULL DEFAULT TRUE,
    test_method             VARCHAR(500),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cl_certificate ON certificate_lines(certificate_id);
CREATE INDEX IF NOT EXISTS idx_cl_deleted ON certificate_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_certificate_lines_updated_at
    BEFORE UPDATE ON certificate_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Material Analogs (Аналоги материалов)
-- =============================================================================
CREATE TABLE IF NOT EXISTS material_analogs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_material_id    UUID NOT NULL,
    original_material_name  VARCHAR(500),
    analog_material_id      UUID NOT NULL,
    analog_material_name    VARCHAR(500),
    substitution_type       VARCHAR(30) NOT NULL,
    price_ratio             NUMERIC(10, 4),
    quality_rating          VARCHAR(30) NOT NULL,
    approved_by_id          UUID REFERENCES users(id),
    approved_at             TIMESTAMP,
    conditions              TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ma_substitution_type CHECK (substitution_type IN ('FULL', 'PARTIAL', 'CONDITIONAL')),
    CONSTRAINT chk_ma_quality_rating CHECK (quality_rating IN ('BETTER', 'EQUAL', 'LOWER')),
    CONSTRAINT chk_ma_price_ratio CHECK (price_ratio IS NULL OR price_ratio >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ma_original_material ON material_analogs(original_material_id);
CREATE INDEX IF NOT EXISTS idx_ma_analog_material ON material_analogs(analog_material_id);
CREATE INDEX IF NOT EXISTS idx_ma_substitution_type ON material_analogs(substitution_type);
CREATE INDEX IF NOT EXISTS idx_ma_quality_rating ON material_analogs(quality_rating);
CREATE INDEX IF NOT EXISTS idx_ma_active ON material_analogs(is_active);
CREATE INDEX IF NOT EXISTS idx_ma_deleted ON material_analogs(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_material_analogs_updated_at ON material_analogs;
CREATE TRIGGER update_material_analogs_updated_at
    BEFORE UPDATE ON material_analogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Analog Requests (Заявки на аналоги)
-- =============================================================================
CREATE TABLE analog_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    original_material_id    UUID NOT NULL,
    requested_by_id         UUID NOT NULL REFERENCES users(id),
    reason                  TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_analog_id      UUID REFERENCES material_analogs(id),
    approved_by_id          UUID REFERENCES users(id),
    review_comment          TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ar_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_ar_project ON analog_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_ar_original_material ON analog_requests(original_material_id);
CREATE INDEX IF NOT EXISTS idx_ar_status ON analog_requests(status);
CREATE INDEX IF NOT EXISTS idx_ar_requested_by ON analog_requests(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_ar_approved_analog ON analog_requests(approved_analog_id);
CREATE INDEX IF NOT EXISTS idx_ar_deleted ON analog_requests(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_analog_requests_updated_at
    BEFORE UPDATE ON analog_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tolerance Rules (Правила допусков)
-- =============================================================================
CREATE TABLE tolerance_rules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    code                    VARCHAR(50) UNIQUE,
    category                VARCHAR(30) NOT NULL,
    parameter_name          VARCHAR(500) NOT NULL,
    nominal_value           NUMERIC(16, 4),
    min_value               NUMERIC(16, 4),
    max_value               NUMERIC(16, 4),
    unit                    VARCHAR(50),
    standard_reference      VARCHAR(255),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_tr_category CHECK (category IN (
        'DIMENSIONAL', 'STRUCTURAL', 'FINISHING', 'INSTALLATION', 'ELECTRICAL', 'PLUMBING'
    ))
);

CREATE INDEX IF NOT EXISTS idx_tr_code ON tolerance_rules(code);
CREATE INDEX IF NOT EXISTS idx_tr_category ON tolerance_rules(category);
CREATE INDEX IF NOT EXISTS idx_tr_active ON tolerance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_tr_deleted ON tolerance_rules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_tolerance_rules_updated_at
    BEFORE UPDATE ON tolerance_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Tolerance Checks (Проверки допусков)
-- =============================================================================
CREATE TABLE IF NOT EXISTS tolerance_checks (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tolerance_rule_id       UUID NOT NULL REFERENCES tolerance_rules(id),
    project_id              UUID NOT NULL,
    location                VARCHAR(500),
    measured_value          NUMERIC(16, 4),
    is_within_tolerance     BOOLEAN NOT NULL DEFAULT FALSE,
    deviation               NUMERIC(16, 4),
    checked_by_id           UUID REFERENCES users(id),
    checked_at              TIMESTAMP,
    notes                   TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PASS',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_tc_status CHECK (status IN ('PASS', 'FAIL', 'NEEDS_RECHECK'))
);

CREATE INDEX IF NOT EXISTS idx_tc_rule ON tolerance_checks(tolerance_rule_id);
CREATE INDEX IF NOT EXISTS idx_tc_project ON tolerance_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_tc_status ON tolerance_checks(status);
CREATE INDEX IF NOT EXISTS idx_tc_within_tolerance ON tolerance_checks(is_within_tolerance);
CREATE INDEX IF NOT EXISTS idx_tc_checked_at ON tolerance_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_tc_deleted ON tolerance_checks(deleted) WHERE deleted = FALSE;

DROP TRIGGER IF EXISTS update_tolerance_checks_updated_at ON tolerance_checks;
CREATE TRIGGER update_tolerance_checks_updated_at
    BEFORE UPDATE ON tolerance_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
