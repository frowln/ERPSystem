-- V1027: Estimate normative enhanced fields + Minstroy price indices
-- Phase 5 of Financial Model plan

-- Add normative fields to local_estimate_lines
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS normative_code VARCHAR(50);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS norm_hours NUMERIC(12,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS base_price_2001 NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS price_index NUMERIC(10,4);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS current_price NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS direct_costs NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS overhead_costs NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS estimated_profit NUMERIC(18,2);
ALTER TABLE local_estimate_lines ADD COLUMN IF NOT EXISTS budget_item_id UUID;

-- Minstroy price indices table for regional cost adjustment
CREATE TABLE IF NOT EXISTS minstroy_price_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  region VARCHAR(200) NOT NULL,
  quarter VARCHAR(10) NOT NULL,
  section_code VARCHAR(50),
  section_name VARCHAR(500),
  index_value NUMERIC(10,4) NOT NULL,
  source VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_mpi_region_quarter ON minstroy_price_indices(region, quarter);
CREATE INDEX IF NOT EXISTS idx_mpi_org ON minstroy_price_indices(organization_id) WHERE NOT deleted;
