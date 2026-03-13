-- V1124: Add hierarchy columns to local_estimate_lines for ГРАНД-Смета tree structure
-- (Section → Position → Resource hierarchy, plus additional normative fields)

ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS line_type VARCHAR(20);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS position_type VARCHAR(20);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS resource_type VARCHAR(10);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS parent_line_id UUID;
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS section_name VARCHAR(500);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS quantity_per_unit NUMERIC(15,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS quantity_coeff NUMERIC(10,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS coefficients VARCHAR(200);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS normative_source VARCHAR(20);

-- Index for parent lookup (tree traversal)
CREATE INDEX IF NOT EXISTS idx_lel_parent ON local_estimate_lines(parent_line_id);
-- Index for line type filtering
CREATE INDEX IF NOT EXISTS idx_lel_line_type ON local_estimate_lines(line_type);
