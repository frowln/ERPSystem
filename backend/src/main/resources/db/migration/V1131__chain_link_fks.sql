-- Chain link fixes: add FK columns for cross-entity relationships

-- Task → WorkOrder link
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS work_order_id UUID;
CREATE INDEX IF NOT EXISTS idx_task_work_order ON project_tasks(work_order_id);

-- Contract ← CommercialProposal link
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS commercial_proposal_id UUID;
CREATE INDEX IF NOT EXISTS idx_contract_cp ON contracts(commercial_proposal_id);

-- Invoice ← Budget link
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS budget_id UUID;
CREATE INDEX IF NOT EXISTS idx_invoice_budget ON invoices(budget_id);
