-- V224: AI document classification and processing tables

-- 1. Document classifications — classification results
CREATE TABLE document_classifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    document_id     UUID        NOT NULL REFERENCES documents(id),
    detected_type   VARCHAR(30) NOT NULL,
    confidence_percent INTEGER  NOT NULL CHECK (confidence_percent BETWEEN 0 AND 100),
    is_confirmed    BOOLEAN     NOT NULL DEFAULT FALSE,
    confirmed_by_user_id UUID,
    confirmed_at    TIMESTAMP WITH TIME ZONE,
    raw_ocr_text    JSONB,
    extracted_metadata_json JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT      NOT NULL DEFAULT 0,
    deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_doc_class_org ON document_classifications(organization_id);
CREATE INDEX idx_doc_class_org_doc ON document_classifications(organization_id, document_id);
CREATE INDEX idx_doc_class_detected_type ON document_classifications(detected_type);
CREATE INDEX idx_doc_class_confirmed ON document_classifications(is_confirmed);

-- 2. Document cross-checks — verification results
CREATE TABLE document_cross_checks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID        NOT NULL,
    source_document_id      UUID        NOT NULL REFERENCES documents(id),
    target_document_id      UUID        NOT NULL REFERENCES documents(id),
    check_type              VARCHAR(30) NOT NULL,
    status                  VARCHAR(30) NOT NULL,
    discrepancy_details_json JSONB,
    checked_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT      NOT NULL DEFAULT 0,
    deleted                 BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_doc_cross_org ON document_cross_checks(organization_id);
CREATE INDEX idx_doc_cross_source ON document_cross_checks(organization_id, source_document_id);
CREATE INDEX idx_doc_cross_target ON document_cross_checks(organization_id, target_document_id);
CREATE INDEX idx_doc_cross_status ON document_cross_checks(status);

-- 3. OCR processing queue — async OCR jobs
CREATE TABLE ocr_processing_queue (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID        NOT NULL,
    document_id         UUID        NOT NULL REFERENCES documents(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    error_message       TEXT,
    page_count          INTEGER,
    processing_time_ms  BIGINT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT      NOT NULL DEFAULT 0,
    deleted             BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ocr_queue_org ON ocr_processing_queue(organization_id);
CREATE INDEX idx_ocr_queue_status ON ocr_processing_queue(status);
CREATE INDEX idx_ocr_queue_org_doc ON ocr_processing_queue(organization_id, document_id);
