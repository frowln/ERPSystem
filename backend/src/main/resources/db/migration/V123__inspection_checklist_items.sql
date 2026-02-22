-- =============================================================================
-- V123: Add inspection checklist items and WBS binding for quality checks
-- Supports P2-01: per-item pass/fail checklists, WBS stage binding
-- =============================================================================

-- 1. Add wbs_node_id to quality_checks for WBS stage binding
ALTER TABLE quality_checks ADD COLUMN IF NOT EXISTS wbs_node_id UUID;
CREATE INDEX IF NOT EXISTS idx_qc_wbs_node ON quality_checks (wbs_node_id);

-- 2. Create inspection_checklist_items table
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quality_check_id UUID NOT NULL REFERENCES quality_checks(id),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    result VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_checklist_item_check ON inspection_checklist_items (quality_check_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_result ON inspection_checklist_items (result);
