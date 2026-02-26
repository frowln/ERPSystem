-- Link EVM snapshots to WBS nodes for bottom-up earned value calculation
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS wbs_node_id UUID;
