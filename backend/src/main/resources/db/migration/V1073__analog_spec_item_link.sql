-- V1073: Link material analogs and analog requests to specification items.
-- Allows marking spec items as "has proposed replacement" in the specification detail view.

ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS spec_item_id UUID;
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS spec_item_id UUID;

CREATE INDEX IF NOT EXISTS idx_ma_spec_item ON material_analogs(spec_item_id) WHERE spec_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ar_spec_item ON analog_requests(spec_item_id) WHERE spec_item_id IS NOT NULL;
