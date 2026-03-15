-- V1172: Expand coefficients column to TEXT for GRAND-Smeta coefficient strings
-- (can contain multiple condition strings exceeding 200 chars)
ALTER TABLE local_estimate_lines ALTER COLUMN coefficients TYPE TEXT;
ALTER TABLE local_estimate_lines ALTER COLUMN name TYPE TEXT;
ALTER TABLE local_estimate_lines ALTER COLUMN section_name TYPE TEXT;
