-- Go/No-Go checklist fields on opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS go_no_go_checklist JSONB DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS checklist_score INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS analog_margin_percent NUMERIC(8,4);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS analog_project_id UUID;
