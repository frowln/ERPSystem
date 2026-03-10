-- =============================================================================
-- V1089: Add purchase_order_id back-reference to purchase_requests
-- Allows tracking which PurchaseOrder was created from a PurchaseRequest
-- =============================================================================

ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id);
CREATE INDEX IF NOT EXISTS idx_pr_purchase_order ON purchase_requests(purchase_order_id);
