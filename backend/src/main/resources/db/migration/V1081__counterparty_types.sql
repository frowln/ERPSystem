-- Add contractor/subcontractor/designer type flags to counterparties
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS is_contractor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS is_subcontractor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS is_designer BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS short_name VARCHAR(200);
