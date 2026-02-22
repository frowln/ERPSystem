-- ============================================================================
-- V209: OCR Estimate Recognition Results
-- ============================================================================

CREATE TABLE ocr_estimate_results (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocr_task_id       UUID NOT NULL REFERENCES ocr_task(id),
    line_number       INTEGER NOT NULL,
    rate_code         VARCHAR(100),
    name              VARCHAR(500),
    unit              VARCHAR(50),
    quantity          NUMERIC(15,4),
    unit_price        NUMERIC(15,2),
    total_price       NUMERIC(15,2),
    confidence        NUMERIC(5,2) DEFAULT 0,
    bounding_box_json TEXT,
    accepted          BOOLEAN DEFAULT false,
    matched_rate_id   UUID,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT DEFAULT 0,
    deleted           BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_oer_task ON ocr_estimate_results(ocr_task_id);
CREATE INDEX idx_oer_accepted ON ocr_estimate_results(accepted);

-- Add estimate-specific columns to ocr_task
ALTER TABLE ocr_task ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE ocr_task ADD COLUMN IF NOT EXISTS total_lines_detected INTEGER DEFAULT 0;
ALTER TABLE ocr_task ADD COLUMN IF NOT EXISTS average_confidence NUMERIC(5,2) DEFAULT 0;
ALTER TABLE ocr_task ADD COLUMN IF NOT EXISTS processing_time_ms BIGINT;
