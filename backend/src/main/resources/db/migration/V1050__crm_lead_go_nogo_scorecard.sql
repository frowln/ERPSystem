-- Go/No-Go scorecard fields on CRM leads
ALTER TABLE crm_leads ADD COLUMN go_nogo_score INTEGER;
ALTER TABLE crm_leads ADD COLUMN go_nogo_result VARCHAR(20);
ALTER TABLE crm_leads ADD COLUMN go_nogo_data TEXT;
ALTER TABLE crm_leads ADD COLUMN go_nogo_evaluated_at TIMESTAMP;
ALTER TABLE crm_leads ADD COLUMN go_nogo_evaluated_by VARCHAR(255);
