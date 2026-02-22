ALTER TABLE invoice_lines
    ADD COLUMN IF NOT EXISTS selected_for_cp BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE invoice_lines
SET selected_for_cp = is_selected_for_cp
WHERE selected_for_cp = FALSE
  AND is_selected_for_cp = TRUE;
