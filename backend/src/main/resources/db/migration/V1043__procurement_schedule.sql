-- Auto-generated procurement schedule from specification items
CREATE TABLE IF NOT EXISTS procurement_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    spec_item_id UUID,
    budget_item_id UUID,
    item_name VARCHAR(500) NOT NULL,
    unit VARCHAR(50),
    quantity NUMERIC(18,4),
    required_by_date DATE,
    lead_time_days INTEGER DEFAULT 14,
    order_by_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    purchase_order_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proc_sched_project ON procurement_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_proc_sched_org ON procurement_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_sched_status ON procurement_schedules(status);
