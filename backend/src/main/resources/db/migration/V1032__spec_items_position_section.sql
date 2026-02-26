-- Add position (e.g. "1", "1.1", "А1") and section_name (e.g. "СИСТЕМА ОТОПЛЕНИЯ") to spec_items
ALTER TABLE spec_items
    ADD COLUMN IF NOT EXISTS position    VARCHAR(20)  NULL,
    ADD COLUMN IF NOT EXISTS section_name VARCHAR(500) NULL;

COMMENT ON COLUMN spec_items.position     IS 'Position number from the PDF spec table (e.g. 1, 1.1, А1)';
COMMENT ON COLUMN spec_items.section_name IS 'Section header this item belongs to (e.g. СИСТЕМА ОТОПЛЕНИЯ, ОВ)';
