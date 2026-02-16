-- V35: Russian Primary Documents, KEP, EDO Generator, OCR
-- Comprehensive tables for Russian construction document management

-- =====================================================
-- RUSSIAN PRIMARY DOCUMENTS
-- =====================================================

-- УПД (Универсальный передаточный документ)
CREATE TABLE upd (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          VARCHAR(100)  NOT NULL,
    date            DATE          NOT NULL,
    seller_id       UUID          NOT NULL,
    buyer_id        UUID          NOT NULL,
    items           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    total_amount    NUMERIC(19,2) NOT NULL DEFAULT 0,
    vat_amount      NUMERIC(19,2) NOT NULL DEFAULT 0,
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    signed_at       TIMESTAMP WITH TIME ZONE,
    signed_by_id    UUID,
    organization_id UUID,
    project_id      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_upd_number ON upd(number);
CREATE INDEX idx_upd_date ON upd(date);
CREATE INDEX idx_upd_status ON upd(status);
CREATE INDEX idx_upd_seller ON upd(seller_id);
CREATE INDEX idx_upd_buyer ON upd(buyer_id);
CREATE INDEX idx_upd_project ON upd(project_id);

-- ТОРГ-12 (Товарная накладная)
CREATE TABLE torg12 (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          VARCHAR(100)  NOT NULL,
    date            DATE          NOT NULL,
    supplier_id     UUID          NOT NULL,
    receiver_id     UUID          NOT NULL,
    items           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    total_amount    NUMERIC(19,2) NOT NULL DEFAULT 0,
    vat_amount      NUMERIC(19,2) NOT NULL DEFAULT 0,
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    organization_id UUID,
    project_id      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_torg12_number ON torg12(number);
CREATE INDEX idx_torg12_date ON torg12(date);
CREATE INDEX idx_torg12_status ON torg12(status);
CREATE INDEX idx_torg12_supplier ON torg12(supplier_id);
CREATE INDEX idx_torg12_project ON torg12(project_id);

-- Счёт-фактура
CREATE TABLE schet_faktura (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number            VARCHAR(100)  NOT NULL,
    date              DATE          NOT NULL,
    correction_number VARCHAR(100),
    seller_id         UUID          NOT NULL,
    buyer_id          UUID          NOT NULL,
    items             JSONB         NOT NULL DEFAULT '[]'::jsonb,
    total_amount      NUMERIC(19,2) NOT NULL DEFAULT 0,
    vat_amount        NUMERIC(19,2) NOT NULL DEFAULT 0,
    status            VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    organization_id   UUID,
    project_id        UUID,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT        NOT NULL DEFAULT 0,
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_schet_faktura_number ON schet_faktura(number);
CREATE INDEX idx_schet_faktura_date ON schet_faktura(date);
CREATE INDEX idx_schet_faktura_status ON schet_faktura(status);
CREATE INDEX idx_schet_faktura_seller ON schet_faktura(seller_id);
CREATE INDEX idx_schet_faktura_project ON schet_faktura(project_id);

-- Акт выполненных работ
CREATE TABLE act (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          VARCHAR(100)  NOT NULL,
    date            DATE          NOT NULL,
    contract_id     UUID,
    executor_id     UUID          NOT NULL,
    customer_id     UUID          NOT NULL,
    items           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    total_amount    NUMERIC(19,2) NOT NULL DEFAULT 0,
    period          VARCHAR(100),
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    organization_id UUID,
    project_id      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_act_number ON act(number);
CREATE INDEX idx_act_date ON act(date);
CREATE INDEX idx_act_status ON act(status);
CREATE INDEX idx_act_executor ON act(executor_id);
CREATE INDEX idx_act_contract ON act(contract_id);
CREATE INDEX idx_act_project ON act(project_id);

-- Доверенность М-2
CREATE TABLE power_of_attorney (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          VARCHAR(100)  NOT NULL,
    date            DATE          NOT NULL,
    issued_to_id    UUID          NOT NULL,
    purpose         VARCHAR(1000),
    valid_until     DATE          NOT NULL,
    material_list   JSONB         NOT NULL DEFAULT '[]'::jsonb,
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    organization_id UUID,
    project_id      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_poa_number ON power_of_attorney(number);
CREATE INDEX idx_poa_date ON power_of_attorney(date);
CREATE INDEX idx_poa_status ON power_of_attorney(status);
CREATE INDEX idx_poa_issued_to ON power_of_attorney(issued_to_id);
CREATE INDEX idx_poa_valid_until ON power_of_attorney(valid_until);
CREATE INDEX idx_poa_project ON power_of_attorney(project_id);

-- Товарно-транспортная накладная (ТТН)
CREATE TABLE waybill (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          VARCHAR(100)  NOT NULL,
    date            DATE          NOT NULL,
    sender_id       UUID          NOT NULL,
    receiver_id     UUID          NOT NULL,
    carrier_id      UUID,
    items           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    vehicle_number  VARCHAR(50),
    driver_name     VARCHAR(255),
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    organization_id UUID,
    project_id      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT        NOT NULL DEFAULT 0,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_waybill_number ON waybill(number);
CREATE INDEX idx_waybill_date ON waybill(date);
CREATE INDEX idx_waybill_status ON waybill(status);
CREATE INDEX idx_waybill_sender ON waybill(sender_id);
CREATE INDEX idx_waybill_project ON waybill(project_id);

-- Инвентаризационная ведомость
CREATE TABLE inventory_act (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number              VARCHAR(100) NOT NULL,
    date                DATE         NOT NULL,
    warehouse_id        UUID         NOT NULL,
    commission_members  JSONB        NOT NULL DEFAULT '[]'::jsonb,
    items               JSONB        NOT NULL DEFAULT '[]'::jsonb,
    status              VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    organization_id     UUID,
    project_id          UUID,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT       NOT NULL DEFAULT 0,
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_inventory_act_number ON inventory_act(number);
CREATE INDEX idx_inventory_act_date ON inventory_act(date);
CREATE INDEX idx_inventory_act_status ON inventory_act(status);
CREATE INDEX idx_inventory_act_warehouse ON inventory_act(warehouse_id);
CREATE INDEX idx_inventory_act_project ON inventory_act(project_id);

-- Акт списания
CREATE TABLE write_off_act (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number              VARCHAR(100)  NOT NULL,
    date                DATE          NOT NULL,
    reason              VARCHAR(1000),
    items               JSONB         NOT NULL DEFAULT '[]'::jsonb,
    total_amount        NUMERIC(19,2) NOT NULL DEFAULT 0,
    approved_by_id      UUID,
    commission_members  JSONB         NOT NULL DEFAULT '[]'::jsonb,
    status              VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    organization_id     UUID,
    project_id          UUID,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT        NOT NULL DEFAULT 0,
    deleted             BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_write_off_act_number ON write_off_act(number);
CREATE INDEX idx_write_off_act_date ON write_off_act(date);
CREATE INDEX idx_write_off_act_status ON write_off_act(status);
CREATE INDEX idx_write_off_act_project ON write_off_act(project_id);

-- =====================================================
-- KEP (Квалифицированная электронная подпись)
-- =====================================================

-- Сертификат КЭП
CREATE TABLE kep_certificate (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner             VARCHAR(500)  NOT NULL,
    serial_number     VARCHAR(200)  NOT NULL UNIQUE,
    issuer            VARCHAR(500)  NOT NULL,
    valid_from        DATE          NOT NULL,
    valid_to          DATE          NOT NULL,
    thumbprint        VARCHAR(200)  NOT NULL UNIQUE,
    status            VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE',
    certificate_data  TEXT,
    organization_id   UUID,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT        NOT NULL DEFAULT 0,
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kep_cert_serial ON kep_certificate(serial_number);
CREATE INDEX idx_kep_cert_thumbprint ON kep_certificate(thumbprint);
CREATE INDEX idx_kep_cert_status ON kep_certificate(status);
CREATE INDEX idx_kep_cert_valid_to ON kep_certificate(valid_to);

-- Подпись КЭП
CREATE TABLE kep_signature (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type       VARCHAR(100) NOT NULL,
    document_id         UUID         NOT NULL,
    certificate_id      UUID         NOT NULL REFERENCES kep_certificate(id),
    signed_by_id        UUID         NOT NULL,
    signed_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    signature_data      TEXT,
    is_valid            BOOLEAN      NOT NULL DEFAULT TRUE,
    validation_message  VARCHAR(2000),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT       NOT NULL DEFAULT 0,
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kep_sig_doc ON kep_signature(document_type, document_id);
CREATE INDEX idx_kep_sig_cert ON kep_signature(certificate_id);
CREATE INDEX idx_kep_sig_signed_by ON kep_signature(signed_by_id);
CREATE INDEX idx_kep_sig_signed_at ON kep_signature(signed_at);

-- Запрос на подпись КЭП
CREATE TABLE kep_signature_request (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type     VARCHAR(100) NOT NULL,
    document_id       UUID         NOT NULL,
    requested_by_id   UUID         NOT NULL,
    requested_to_id   UUID         NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    due_date          DATE,
    comment           VARCHAR(2000),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT       NOT NULL DEFAULT 0,
    deleted           BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kep_req_doc ON kep_signature_request(document_type, document_id);
CREATE INDEX idx_kep_req_status ON kep_signature_request(status);
CREATE INDEX idx_kep_req_to ON kep_signature_request(requested_to_id);
CREATE INDEX idx_kep_req_due ON kep_signature_request(due_date);

-- =====================================================
-- EDO (Электронный документооборот)
-- =====================================================

-- Шаблон ЭДО
CREATE TABLE edo_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(500) NOT NULL,
    document_type   VARCHAR(100) NOT NULL,
    template_xml    TEXT         NOT NULL,
    version         BIGINT       NOT NULL DEFAULT 1,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_edo_tpl_code ON edo_template(code);
CREATE INDEX idx_edo_tpl_type ON edo_template(document_type);
CREATE INDEX idx_edo_tpl_active ON edo_template(is_active);

-- Сгенерированный ЭДО-документ
CREATE TABLE edo_generated_document (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id             UUID         NOT NULL REFERENCES edo_template(id),
    source_document_type    VARCHAR(100) NOT NULL,
    source_document_id      UUID         NOT NULL,
    generated_xml           TEXT,
    generated_pdf_url       VARCHAR(2000),
    status                  VARCHAR(30)  NOT NULL DEFAULT 'GENERATED',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT       NOT NULL DEFAULT 0,
    deleted                 BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_edo_gen_template ON edo_generated_document(template_id);
CREATE INDEX idx_edo_gen_source ON edo_generated_document(source_document_type, source_document_id);
CREATE INDEX idx_edo_gen_status ON edo_generated_document(status);

-- =====================================================
-- OCR (Распознавание документов)
-- =====================================================

-- Задача OCR
CREATE TABLE ocr_task (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url          VARCHAR(2000) NOT NULL,
    file_name         VARCHAR(500)  NOT NULL,
    status            VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    recognized_text   TEXT,
    recognized_fields JSONB,
    confidence        DOUBLE PRECISION,
    processed_at      TIMESTAMP WITH TIME ZONE,
    organization_id   UUID,
    project_id        UUID,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT        NOT NULL DEFAULT 0,
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ocr_task_status ON ocr_task(status);
CREATE INDEX idx_ocr_task_project ON ocr_task(project_id);

-- Шаблон OCR
CREATE TABLE ocr_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type   VARCHAR(100) NOT NULL,
    field_mappings  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ocr_tpl_type ON ocr_template(document_type);
CREATE INDEX idx_ocr_tpl_active ON ocr_template(is_active);
