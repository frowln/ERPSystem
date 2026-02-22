-- V133: Add barcode column to materials table for barcode/QR scanner integration
ALTER TABLE materials ADD COLUMN IF NOT EXISTS barcode VARCHAR(200);

-- Index for fast barcode lookup (unique per organization)
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_org_barcode
    ON materials (organization_id, barcode) WHERE barcode IS NOT NULL AND deleted = false;
