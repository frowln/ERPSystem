-- Add source field to counterparties to track import origin (e.g. '1C', 'manual', 'import')
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS source VARCHAR(50);
