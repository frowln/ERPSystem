-- Link commercial proposal items to bid comparisons for audit trail
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS bid_comparison_id UUID;
ALTER TABLE commercial_proposal_items ADD COLUMN IF NOT EXISTS bid_winner_vendor_id UUID;
