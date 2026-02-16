-- =============================================================================
-- V73: External Integrations — 1С, СБИС, ЭДО (enhanced), ЕНС (enhanced)
-- =============================================================================

-- =============================================================================
-- 1С INTEGRATION
-- =============================================================================

-- OneCConfig (Конфигурации подключения к 1С)
CREATE TABLE onec_configs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    base_url                VARCHAR(1000) NOT NULL,
    username                VARCHAR(255) NOT NULL,
    password                TEXT NOT NULL,
    database_name           VARCHAR(255) NOT NULL,
    sync_direction          VARCHAR(20) NOT NULL DEFAULT 'BIDIRECTIONAL',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at            TIMESTAMP WITH TIME ZONE,
    sync_interval_minutes   INTEGER NOT NULL DEFAULT 60,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_onec_cfg_direction CHECK (sync_direction IN ('IMPORT', 'EXPORT', 'BIDIRECTIONAL')),
    CONSTRAINT chk_onec_cfg_interval CHECK (sync_interval_minutes > 0)
);

CREATE INDEX IF NOT EXISTS idx_onec_cfg_name ON onec_configs(name);
CREATE INDEX IF NOT EXISTS idx_onec_cfg_active ON onec_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_onec_cfg_direction ON onec_configs(sync_direction);
CREATE INDEX IF NOT EXISTS idx_onec_cfg_not_deleted ON onec_configs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_onec_configs_updated_at
    BEFORE UPDATE ON onec_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- OneCExchangeLog (Логи обмена с 1С)
CREATE TABLE onec_exchange_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id               UUID NOT NULL REFERENCES onec_configs(id),
    exchange_type           VARCHAR(20) NOT NULL,
    direction               VARCHAR(20) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'STARTED',
    started_at              TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    records_processed       INTEGER NOT NULL DEFAULT 0,
    records_failed          INTEGER NOT NULL DEFAULT 0,
    error_message           TEXT,
    details                 JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_onec_el_type CHECK (exchange_type IN ('FULL', 'INCREMENTAL', 'MANUAL')),
    CONSTRAINT chk_onec_el_direction CHECK (direction IN ('IMPORT', 'EXPORT', 'BIDIRECTIONAL')),
    CONSTRAINT chk_onec_el_status CHECK (status IN ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_onec_el_processed CHECK (records_processed >= 0),
    CONSTRAINT chk_onec_el_failed CHECK (records_failed >= 0)
);

CREATE INDEX IF NOT EXISTS idx_onec_el_config ON onec_exchange_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_onec_el_status ON onec_exchange_logs(status);
CREATE INDEX IF NOT EXISTS idx_onec_el_type ON onec_exchange_logs(exchange_type);
CREATE INDEX IF NOT EXISTS idx_onec_el_direction ON onec_exchange_logs(direction);
CREATE INDEX IF NOT EXISTS idx_onec_el_started ON onec_exchange_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_onec_el_not_deleted ON onec_exchange_logs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_onec_exchange_logs_updated_at
    BEFORE UPDATE ON onec_exchange_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- OneCMapping (Маппинг сущностей Привод <-> 1С)
CREATE TABLE onec_mappings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type             VARCHAR(100) NOT NULL,
    privod_id               UUID NOT NULL,
    onec_id                 VARCHAR(255) NOT NULL,
    onec_code               VARCHAR(100),
    last_sync_at            TIMESTAMP WITH TIME ZONE,
    sync_status             VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    conflict_data           JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_onec_map_status CHECK (sync_status IN ('SYNCED', 'PENDING', 'CONFLICT', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_onec_map_entity_type ON onec_mappings(entity_type);
CREATE INDEX IF NOT EXISTS idx_onec_map_privod_id ON onec_mappings(privod_id);
CREATE INDEX IF NOT EXISTS idx_onec_map_onec_id ON onec_mappings(onec_id);
CREATE INDEX IF NOT EXISTS idx_onec_map_sync_status ON onec_mappings(sync_status);
CREATE INDEX IF NOT EXISTS idx_onec_map_not_deleted ON onec_mappings(deleted) WHERE deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_onec_map_privod_entity ON onec_mappings(privod_id, entity_type) WHERE deleted = FALSE;

CREATE TRIGGER update_onec_mappings_updated_at
    BEFORE UPDATE ON onec_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- СБИС (SBIS EDI)
-- =============================================================================

-- SbisConfig (Конфигурации подключения к СБИС)
CREATE TABLE sbis_configs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    api_url                 VARCHAR(1000) NOT NULL,
    login                   VARCHAR(255) NOT NULL,
    password                TEXT NOT NULL,
    certificate_thumbprint  VARCHAR(255),
    organization_inn        VARCHAR(12) NOT NULL,
    organization_kpp        VARCHAR(9),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    auto_send               BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sbis_cfg_name ON sbis_configs(name);
CREATE INDEX IF NOT EXISTS idx_sbis_cfg_active ON sbis_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sbis_cfg_inn ON sbis_configs(organization_inn);
CREATE INDEX IF NOT EXISTS idx_sbis_cfg_not_deleted ON sbis_configs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_sbis_configs_updated_at
    BEFORE UPDATE ON sbis_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SbisDocument (Документы СБИС)
CREATE TABLE sbis_documents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sbis_id                 VARCHAR(255),
    document_type           VARCHAR(30) NOT NULL,
    internal_document_id    UUID,
    internal_document_model VARCHAR(100),
    partner_inn             VARCHAR(12),
    partner_kpp             VARCHAR(9),
    partner_name            VARCHAR(500),
    direction               VARCHAR(10) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    sent_at                 TIMESTAMP WITH TIME ZONE,
    received_at             TIMESTAMP WITH TIME ZONE,
    signed_at               TIMESTAMP WITH TIME ZONE,
    error_message           VARCHAR(2000),
    document_data           JSONB,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sbis_doc_type CHECK (document_type IN (
        'UPD', 'TORG12', 'ACT', 'INVOICE', 'POWER_OF_ATTORNEY', 'RECONCILIATION'
    )),
    CONSTRAINT chk_sbis_doc_direction CHECK (direction IN ('INCOMING', 'OUTGOING')),
    CONSTRAINT chk_sbis_doc_status CHECK (status IN ('DRAFT', 'SENT', 'DELIVERED', 'ACCEPTED', 'REJECTED', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_sbis_doc_sbis_id ON sbis_documents(sbis_id);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_type ON sbis_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_internal ON sbis_documents(internal_document_id);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_partner_inn ON sbis_documents(partner_inn);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_direction ON sbis_documents(direction);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_status ON sbis_documents(status);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_sent ON sbis_documents(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sbis_doc_not_deleted ON sbis_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_sbis_documents_updated_at
    BEFORE UPDATE ON sbis_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SbisPartnerMapping (Маппинг контрагентов Привод <-> СБИС)
CREATE TABLE sbis_partner_mappings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id              UUID NOT NULL,
    partner_name            VARCHAR(500) NOT NULL,
    sbis_contractor_id      VARCHAR(255),
    sbis_contractor_inn     VARCHAR(12),
    sbis_contractor_kpp     VARCHAR(9),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at            TIMESTAMP WITH TIME ZONE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sbis_pm_partner ON sbis_partner_mappings(partner_id);
CREATE INDEX IF NOT EXISTS idx_sbis_pm_contractor_id ON sbis_partner_mappings(sbis_contractor_id);
CREATE INDEX IF NOT EXISTS idx_sbis_pm_contractor_inn ON sbis_partner_mappings(sbis_contractor_inn);
CREATE INDEX IF NOT EXISTS idx_sbis_pm_active ON sbis_partner_mappings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sbis_pm_not_deleted ON sbis_partner_mappings(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_sbis_partner_mappings_updated_at
    BEFORE UPDATE ON sbis_partner_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ЭДО (EDO Enhanced — Электронный документооборот)
-- =============================================================================

-- EdoDocument (Документы ЭДО расширенные)
CREATE TABLE edo_documents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number         VARCHAR(100) NOT NULL,
    document_date           DATE NOT NULL,
    document_type           VARCHAR(30) NOT NULL,
    sender_id               UUID,
    sender_inn              VARCHAR(12),
    receiver_id             UUID,
    receiver_inn            VARCHAR(12),
    status                  VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    amount                  NUMERIC(18,2),
    vat_amount              NUMERIC(18,2),
    total_amount            NUMERIC(18,2),
    linked_document_id      UUID,
    linked_document_model   VARCHAR(100),
    file_url                VARCHAR(2000),
    xml_data                TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_edo_doc_type CHECK (document_type IN (
        'UPD', 'UTD', 'ACT_SVERKI', 'TORG12', 'SCHF', 'CORRECTIVE_SCHF', 'KS2', 'KS3'
    )),
    CONSTRAINT chk_edo_doc_status CHECK (status IN (
        'CREATED', 'SIGNED_BY_SENDER', 'SENT', 'DELIVERED', 'SIGNED_BY_RECEIVER', 'REJECTED', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_edo_doc_number ON edo_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_edo_doc_date ON edo_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_edo_doc_type ON edo_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_edo_doc_sender ON edo_documents(sender_id);
CREATE INDEX IF NOT EXISTS idx_edo_doc_sender_inn ON edo_documents(sender_inn);
CREATE INDEX IF NOT EXISTS idx_edo_doc_receiver ON edo_documents(receiver_id);
CREATE INDEX IF NOT EXISTS idx_edo_doc_receiver_inn ON edo_documents(receiver_inn);
CREATE INDEX IF NOT EXISTS idx_edo_doc_status ON edo_documents(status);
CREATE INDEX IF NOT EXISTS idx_edo_doc_linked ON edo_documents(linked_document_id);
CREATE INDEX IF NOT EXISTS idx_edo_doc_not_deleted ON edo_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_edo_documents_updated_at
    BEFORE UPDATE ON edo_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- EdoSignature (Подписи ЭДО)
CREATE TABLE edo_signatures (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    edo_document_id             UUID NOT NULL REFERENCES edo_documents(id),
    signer_id                   UUID,
    signer_name                 VARCHAR(500) NOT NULL,
    signer_position             VARCHAR(500),
    certificate_serial_number   VARCHAR(255),
    signed_at                   TIMESTAMP WITH TIME ZONE NOT NULL,
    signature_data              TEXT,
    is_valid                    BOOLEAN NOT NULL DEFAULT TRUE,
    validation_result           VARCHAR(2000),
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_edo_sig_document ON edo_signatures(edo_document_id);
CREATE INDEX IF NOT EXISTS idx_edo_sig_signer ON edo_signatures(signer_id);
CREATE INDEX IF NOT EXISTS idx_edo_sig_cert ON edo_signatures(certificate_serial_number);
CREATE INDEX IF NOT EXISTS idx_edo_sig_signed_at ON edo_signatures(signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_edo_sig_not_deleted ON edo_signatures(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_edo_signatures_updated_at
    BEFORE UPDATE ON edo_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- EdoExchangeLog (Лог обмена ЭДО)
CREATE TABLE edo_exchange_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    edo_document_id         UUID NOT NULL REFERENCES edo_documents(id),
    action                  VARCHAR(20) NOT NULL,
    performed_by_id         UUID,
    performed_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    details                 TEXT,
    external_id             VARCHAR(255),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_edo_exl_action CHECK (action IN (
        'CREATED', 'SIGNED', 'SENT', 'RECEIVED', 'ACCEPTED', 'REJECTED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_edo_exl_document ON edo_exchange_logs(edo_document_id);
CREATE INDEX IF NOT EXISTS idx_edo_exl_action ON edo_exchange_logs(action);
CREATE INDEX IF NOT EXISTS idx_edo_exl_performed_by ON edo_exchange_logs(performed_by_id);
CREATE INDEX IF NOT EXISTS idx_edo_exl_performed_at ON edo_exchange_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_edo_exl_not_deleted ON edo_exchange_logs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_edo_exchange_logs_updated_at
    BEFORE UPDATE ON edo_exchange_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ЕНС (ENS Enhanced — Единый налоговый счёт)
-- =============================================================================

-- Extend ens_accounts with new columns
ALTER TABLE ens_accounts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ens_accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE ens_accounts ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE;
ALTER TABLE ens_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_ens_account_org ON ens_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_ens_account_active ON ens_accounts(is_active) WHERE is_active = TRUE;

-- EnsOperation (Операции ЕНС)
CREATE TABLE ens_operations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ens_account_id          UUID NOT NULL REFERENCES ens_accounts(id),
    operation_date          DATE NOT NULL,
    operation_type          VARCHAR(20) NOT NULL,
    tax_type                VARCHAR(100),
    amount                  NUMERIC(18,2) NOT NULL,
    description             VARCHAR(2000),
    document_number         VARCHAR(100),
    document_date           DATE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ens_op_type CHECK (operation_type IN (
        'TAX_PAYMENT', 'PENALTY', 'FINE', 'REFUND', 'OFFSET', 'ADJUSTMENT'
    )),
    CONSTRAINT chk_ens_op_status CHECK (status IN ('PENDING', 'PROCESSED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_ens_op_account ON ens_operations(ens_account_id);
CREATE INDEX IF NOT EXISTS idx_ens_op_date ON ens_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_ens_op_type ON ens_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_ens_op_tax_type ON ens_operations(tax_type);
CREATE INDEX IF NOT EXISTS idx_ens_op_status ON ens_operations(status);
CREATE INDEX IF NOT EXISTS idx_ens_op_not_deleted ON ens_operations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ens_operations_updated_at
    BEFORE UPDATE ON ens_operations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Extend ens_reconciliations with new columns
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS total_debits NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS total_credits NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS closing_balance NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS discrepancy_amount NUMERIC(18,2);
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS reconciled_by_id UUID;
ALTER TABLE ens_reconciliations ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_ens_reconciliation_period_range ON ens_reconciliations(period_start, period_end);
