-- P2-CRM-2: Структурированные тендерные документы
-- Заменяет JSONB-хранение документов внутри bid_packages / bid_comparisons
-- нормализованной таблицей с явной типизацией.

CREATE TABLE IF NOT EXISTS tender_documents (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id    UUID         NOT NULL,
    bid_package_id     UUID         REFERENCES bid_packages(id),
    document_type      VARCHAR(50)  NOT NULL,
    title              VARCHAR(500) NOT NULL,
    file_attachment_id UUID,
    is_required        BOOLEAN      NOT NULL DEFAULT FALSE,
    submitted_at       TIMESTAMPTZ,
    notes              TEXT,
    sort_order         INT          NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ,
    created_by         VARCHAR(255),
    updated_by         VARCHAR(255),
    version            BIGINT,
    deleted            BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tender_docs_bid_pkg ON tender_documents(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_tender_docs_org     ON tender_documents(organization_id);

COMMENT ON TABLE  tender_documents                    IS 'P2-CRM-2: Структурированные тендерные документы';
COMMENT ON COLUMN tender_documents.document_type      IS 'Тип документа: INVITATION, QUALIFICATION, TECHNICAL_SPEC, COMMERCIAL_PROPOSAL, CONTRACT_DRAFT, DRAWING, ADDENDUM, CLARIFICATION, AWARD_NOTICE';
COMMENT ON COLUMN tender_documents.is_required        IS 'Обязателен ли документ для подачи участником';
COMMENT ON COLUMN tender_documents.submitted_at       IS 'Дата и время фактической подачи документа';
COMMENT ON COLUMN tender_documents.file_attachment_id IS 'UUID вложения в таблице file_attachments / MinIO';
COMMENT ON COLUMN tender_documents.sort_order         IS 'Порядок отображения внутри тендерного пакета';
