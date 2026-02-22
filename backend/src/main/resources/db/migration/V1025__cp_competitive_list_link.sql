-- ============================================================================
-- V1025: Link commercial proposals to competitive lists + margin tracking
-- ============================================================================

-- Commercial Proposal Item → CL entry link
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS competitive_list_entry_id UUID;
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS competitive_list_id UUID;
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS spec_item_id UUID;
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(18,2);
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(500);

-- Commercial Proposal → specification + margin
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS specification_id UUID;
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS total_customer_price NUMERIC(18,2) DEFAULT 0;
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS total_margin NUMERIC(18,2) DEFAULT 0;
ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(8,4) DEFAULT 0;
