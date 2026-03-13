-- Add customerPrice/customerTotal to commercial_proposal_items for КП → ФМ customer pricing flow
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS customer_price NUMERIC(18,2) DEFAULT 0;
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS customer_total NUMERIC(18,2) DEFAULT 0;
