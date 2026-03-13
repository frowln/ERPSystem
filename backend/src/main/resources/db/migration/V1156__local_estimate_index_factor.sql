-- P1-EST-3: Add index_factor column to local_estimates for BASIS_INDEX calculation method.
-- МДС 81-35.2004: текущая цена = базисная цена 2001 × индекс.
-- Default 8.0 corresponds to the approximate Minstroy RIM index for 2025.
ALTER TABLE local_estimates
    ADD COLUMN IF NOT EXISTS index_factor NUMERIC(8, 4) DEFAULT 8.0000;
