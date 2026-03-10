-- LSR Hierarchy fields for local_estimate_lines
-- Adds support for 4-level hierarchy: Section > Position > Resource > Summary

ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS line_type VARCHAR(20) DEFAULT 'POSITION';
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS parent_line_id UUID;
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS position_type VARCHAR(20);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS resource_type VARCHAR(10);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS spec_item_id UUID;
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS machinery_hours NUMERIC(12,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS overhead_rate NUMERIC(8,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS overhead_base VARCHAR(20);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(8,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS profit_base VARCHAR(20);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS coefficients TEXT;
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS section_name VARCHAR(500);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;

-- Self-referencing FK for parent-child hierarchy
ALTER TABLE local_estimate_lines DROP CONSTRAINT IF EXISTS fk_lel_parent;
ALTER TABLE local_estimate_lines
    ADD CONSTRAINT fk_lel_parent FOREIGN KEY (parent_line_id) REFERENCES local_estimate_lines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lel_parent ON local_estimate_lines(parent_line_id);
CREATE INDEX IF NOT EXISTS idx_lel_line_type ON local_estimate_lines(line_type);
CREATE INDEX IF NOT EXISTS idx_lel_position_type ON local_estimate_lines(position_type);
