-- V241: Add construction_kind field to projects table
-- Separates "вид строительства" (new/reconstruction/overhaul/demolition)
-- from "тип объекта" (residential/commercial/industrial/etc.)

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS construction_kind VARCHAR(50);

COMMENT ON COLUMN projects.construction_kind IS
    'Вид строительства: NEW_CONSTRUCTION, RECONSTRUCTION, OVERHAUL, DEMOLITION, TECH_REEQUIPMENT';
