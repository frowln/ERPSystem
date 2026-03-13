-- B2B bank details for invoice generation
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_account VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bik VARCHAR(9);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_name VARCHAR(500);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS corr_account VARCHAR(20);
