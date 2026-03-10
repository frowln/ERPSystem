-- LSR Summary (konzovka) — stores totals, surcharges, VAT for each local estimate

CREATE TABLE IF NOT EXISTS local_estimate_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES local_estimates(id) ON DELETE CASCADE,
    direct_costs_total NUMERIC(18,2) DEFAULT 0,
    overhead_total NUMERIC(18,2) DEFAULT 0,
    profit_total NUMERIC(18,2) DEFAULT 0,
    subtotal NUMERIC(18,2) DEFAULT 0,
    winter_surcharge NUMERIC(18,2) DEFAULT 0,
    winter_surcharge_rate NUMERIC(8,4) DEFAULT 0,
    temp_structures NUMERIC(18,2) DEFAULT 0,
    temp_structures_rate NUMERIC(8,4) DEFAULT 0,
    contingency NUMERIC(18,2) DEFAULT 0,
    contingency_rate NUMERIC(8,4) DEFAULT 0,
    vat_rate NUMERIC(5,2) DEFAULT 20.00,
    vat_amount NUMERIC(18,2) DEFAULT 0,
    grand_total NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_les_estimate ON local_estimate_summaries(estimate_id);
