-- V121: Link contracts to budget items; add tender_type to purchase_requests

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES budget_items(id);

ALTER TABLE purchase_requests
    ADD COLUMN IF NOT EXISTS tender_type VARCHAR(20) DEFAULT 'MATERIALS';

CREATE INDEX IF NOT EXISTS idx_contract_budget_item ON contracts(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_pr_tender_type ON purchase_requests(tender_type);
