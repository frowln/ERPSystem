-- P1-WAR-3: M29Line.materialId — ссылка на материал для auto-fill фактических количеств из движений склада
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS material_id UUID;
CREATE INDEX IF NOT EXISTS idx_m29_line_material ON m29_lines(material_id);
