-- Link daily reports to KS-2 documents (КС-6а → КС-2 chain)
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS daily_report_id UUID;
ALTER TABLE ks2_documents DROP CONSTRAINT IF EXISTS fk_ks2_daily_report;
ALTER TABLE ks2_documents ADD CONSTRAINT fk_ks2_daily_report
    FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id);
CREATE INDEX IF NOT EXISTS idx_ks2_daily_report_id ON ks2_documents(daily_report_id);

-- Track whether a daily report has been used to generate a KС-2
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS ks2_generated BOOLEAN NOT NULL DEFAULT FALSE;
