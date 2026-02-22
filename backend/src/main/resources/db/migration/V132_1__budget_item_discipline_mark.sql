-- V132.1: Add discipline_mark to budget_items for Russian construction discipline tracking

ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS discipline_mark VARCHAR(10);

COMMENT ON COLUMN budget_items.discipline_mark IS 'Russian construction discipline mark: АР, ОВ, ВК, ЭОМ, АОВ, СС, ПБ, etc.';
