-- PD section field on documents for categorization by project documentation discipline
ALTER TABLE documents ADD COLUMN IF NOT EXISTS pd_section VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_document_pd_section ON documents(pd_section) WHERE pd_section IS NOT NULL;
