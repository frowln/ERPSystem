-- Budget snapshots for versioned comparison
CREATE TABLE budget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id),
  organization_id UUID NOT NULL,
  snapshot_name VARCHAR(200) NOT NULL,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_id UUID,
  total_cost NUMERIC(18,2) DEFAULT 0,
  total_customer NUMERIC(18,2) DEFAULT 0,
  total_margin NUMERIC(18,2) DEFAULT 0,
  margin_percent NUMERIC(8,4) DEFAULT 0,
  items_json JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_bsnap_budget ON budget_snapshots(budget_id) WHERE NOT deleted;

-- Additional fields for BudgetItem
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS margin_amount NUMERIC(18,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(8,4);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS section_id UUID;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS customer_price NUMERIC(18,2);

-- Backfill customer_price from sale_price if not set
UPDATE budget_items SET customer_price = sale_price
WHERE customer_price IS NULL AND sale_price IS NOT NULL AND NOT deleted;

-- Recalculate margin_amount for non-section items
UPDATE budget_items SET margin_amount =
  COALESCE(customer_price * COALESCE(quantity, 1), 0) - COALESCE(cost_price * COALESCE(quantity, 1), 0)
WHERE NOT deleted AND NOT is_section;

-- Recalculate margin_percent
UPDATE budget_items SET margin_percent =
  CASE
    WHEN COALESCE(customer_price * COALESCE(quantity, 1), 0) != 0
    THEN (margin_amount * 100.0) / (customer_price * COALESCE(quantity, 1))
    ELSE 0
  END
WHERE NOT deleted AND NOT is_section AND margin_amount IS NOT NULL;
