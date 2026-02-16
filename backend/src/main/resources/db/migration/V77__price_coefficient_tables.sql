-- =============================================================================
-- Price Coefficients Module: Ценовые коэффициенты
-- =============================================================================

CREATE TABLE price_coefficients (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    code                    VARCHAR(50) UNIQUE,
    value                   NUMERIC(12, 6) NOT NULL,
    effective_from          DATE NOT NULL,
    effective_to            DATE,
    contract_id             UUID,
    project_id              UUID,
    type                    VARCHAR(20) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    description             TEXT,
    applied_to_estimate_items BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_price_coeff_type CHECK (type IN ('REGIONAL', 'SEASONAL', 'INFLATION', 'MATERIAL', 'CUSTOM')),
    CONSTRAINT chk_price_coeff_status CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED')),
    CONSTRAINT chk_price_coeff_value CHECK (value > 0),
    CONSTRAINT chk_price_coeff_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_price_coeff_contract ON price_coefficients(contract_id);
CREATE INDEX IF NOT EXISTS idx_price_coeff_project ON price_coefficients(project_id);
CREATE INDEX IF NOT EXISTS idx_price_coeff_type ON price_coefficients(type);
CREATE INDEX IF NOT EXISTS idx_price_coeff_status ON price_coefficients(status);
CREATE INDEX IF NOT EXISTS idx_price_coeff_code ON price_coefficients(code);
CREATE INDEX IF NOT EXISTS idx_price_coeff_effective ON price_coefficients(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_price_coeff_active ON price_coefficients(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_price_coefficients_updated_at
    BEFORE UPDATE ON price_coefficients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
