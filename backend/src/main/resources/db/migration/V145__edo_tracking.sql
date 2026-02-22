-- V145: Add EDO tracking columns to KS-2 and KS-3 documents

ALTER TABLE ks2_documents
    ADD COLUMN IF NOT EXISTS edo_document_id UUID,
    ADD COLUMN IF NOT EXISTS edo_status VARCHAR(30) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS edo_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS edo_delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS edo_signed_at TIMESTAMPTZ;

ALTER TABLE ks3_documents
    ADD COLUMN IF NOT EXISTS edo_document_id UUID,
    ADD COLUMN IF NOT EXISTS edo_status VARCHAR(30) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS edo_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS edo_delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS edo_signed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ks2_edo_document_id ON ks2_documents (edo_document_id);
CREATE INDEX IF NOT EXISTS idx_ks2_edo_status ON ks2_documents (edo_status);
CREATE INDEX IF NOT EXISTS idx_ks3_edo_document_id ON ks3_documents (edo_document_id);
CREATE INDEX IF NOT EXISTS idx_ks3_edo_status ON ks3_documents (edo_status);
