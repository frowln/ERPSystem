ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS chk_crm_lead_status;
ALTER TABLE crm_leads ADD CONSTRAINT chk_crm_lead_status CHECK (status IN ('NEW', 'QUALIFIED', 'PROPOSITION', 'NEGOTIATION', 'WON', 'LOST'));
