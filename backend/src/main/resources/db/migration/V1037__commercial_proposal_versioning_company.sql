-- Commercial Proposal versioning + company details for PDF export
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS doc_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS parent_version_id UUID;
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS company_name VARCHAR(500);
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS company_inn VARCHAR(20);
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS company_kpp VARCHAR(20);
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS company_address VARCHAR(1000);
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS signatory_name VARCHAR(300);
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS signatory_position VARCHAR(300);
