-- Add 1C posting tracking columns to KS-2 and KS-3 documents
ALTER TABLE ks2_documents
    ADD COLUMN onec_posting_status VARCHAR(30) DEFAULT 'NOT_SENT',
    ADD COLUMN onec_posted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN onec_document_id VARCHAR(255);

ALTER TABLE ks3_documents
    ADD COLUMN onec_posting_status VARCHAR(30) DEFAULT 'NOT_SENT',
    ADD COLUMN onec_posted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN onec_document_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_ks2_onec_status ON ks2_documents(onec_posting_status) WHERE onec_posting_status != 'NOT_SENT';
CREATE INDEX IF NOT EXISTS idx_ks3_onec_status ON ks3_documents(onec_posting_status) WHERE onec_posting_status != 'NOT_SENT';
