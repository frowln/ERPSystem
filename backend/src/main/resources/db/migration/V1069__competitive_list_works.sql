-- Extend competitive lists to support works from estimates (contractor tenders)

ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'SPECIFICATION';
ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS estimate_line_id UUID;
ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS work_type VARCHAR(100);

-- Make specification_id nullable for works competitive lists
ALTER TABLE competitive_lists ALTER COLUMN specification_id DROP NOT NULL;

-- Extend entries for contractor bids
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS estimate_line_id UUID;
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(500);

-- Make spec_item_id nullable for works CLs
ALTER TABLE competitive_list_entries ALTER COLUMN spec_item_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cl_source_type ON competitive_lists(source_type);
CREATE INDEX IF NOT EXISTS idx_cl_estimate_line ON competitive_lists(estimate_line_id);
