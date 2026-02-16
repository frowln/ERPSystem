-- =============================================================================
-- Multi-tenancy: tenant-scope legal module core entities.
-- - legal_cases
-- - contract_legal_templates
-- =============================================================================

ALTER TABLE legal_cases
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE legal_cases c
SET organization_id = p.organization_id
FROM projects p
WHERE c.organization_id IS NULL
  AND c.project_id IS NOT NULL
  AND p.id = c.project_id;

UPDATE legal_cases c
SET organization_id = ctr.organization_id
FROM contracts ctr
WHERE c.organization_id IS NULL
  AND c.contract_id IS NOT NULL
  AND ctr.id = c.contract_id;

UPDATE legal_cases
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE legal_cases
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE contract_legal_templates
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE contract_legal_templates
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE contract_legal_templates
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_legal_case_org ON legal_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_org_status ON legal_cases(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_legal_template_org ON contract_legal_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_legal_template_org_type ON contract_legal_templates(organization_id, template_type);

