-- P1-CHN-3: FK на строку ЛСР для строки КС-2
-- Закрывает разрыв КС-2↔Смета, позволяет трассировать КС-2 Line→LocalEstimateLine
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS estimate_line_id UUID;
