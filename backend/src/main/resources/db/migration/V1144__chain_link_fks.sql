-- V1144: Цепочки данных — добавить отсутствующие FK
-- P0-1 (Цепочки 1, 6): КП → Договор — добавить proposal_id в contracts
ALTER TABLE contracts ADD COLUMN proposal_id UUID;
ALTER TABLE contracts ADD CONSTRAINT fk_contract_proposal
    FOREIGN KEY (proposal_id) REFERENCES commercial_proposals(id) ON DELETE SET NULL;
CREATE INDEX idx_contract_proposal ON contracts(proposal_id) WHERE proposal_id IS NOT NULL;

-- P0-2 (Цепочка 6): Лид → Контрагент — добавить counterparty_id в crm_leads
ALTER TABLE crm_leads ADD COLUMN counterparty_id UUID;
ALTER TABLE crm_leads ADD CONSTRAINT fk_crm_lead_counterparty
    FOREIGN KEY (counterparty_id) REFERENCES counterparties(id) ON DELETE SET NULL;
CREATE INDEX idx_crm_lead_counterparty ON crm_leads(counterparty_id) WHERE counterparty_id IS NOT NULL;
