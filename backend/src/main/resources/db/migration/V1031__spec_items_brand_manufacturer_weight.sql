-- V1031: Add brand, manufacturer, weight to spec_items
-- These fields mirror the real-world specification document format:
-- Тип/Марка (brand), Завод-изготовитель (manufacturer), Вес (weight)

ALTER TABLE spec_items
    ADD COLUMN IF NOT EXISTS brand        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
    ADD COLUMN IF NOT EXISTS weight       NUMERIC(10, 3);
