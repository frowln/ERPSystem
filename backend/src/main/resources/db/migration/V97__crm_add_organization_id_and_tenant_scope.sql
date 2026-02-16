-- =============================================================================
-- Multi-tenancy: CRM tenant isolation.
-- - crm_leads, crm_teams, crm_activities become tenant-scoped (organization_id NOT NULL)
-- - crm_stages supports global defaults (organization_id NULL) + tenant custom stages
-- =============================================================================

ALTER TABLE crm_stages
    ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE crm_leads
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE crm_leads l
SET organization_id = p.organization_id
FROM projects p
WHERE l.organization_id IS NULL
  AND l.project_id IS NOT NULL
  AND p.id = l.project_id;

UPDATE crm_leads l
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE l.organization_id IS NULL
  AND l.assigned_to_id IS NOT NULL
  AND u.id = l.assigned_to_id;

UPDATE crm_leads
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE crm_leads
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE crm_teams
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE crm_teams t
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE t.organization_id IS NULL
  AND t.leader_id IS NOT NULL
  AND u.id = t.leader_id;

UPDATE crm_teams
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE crm_teams
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE crm_activities
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE crm_activities a
SET organization_id = l.organization_id
FROM crm_leads l
WHERE a.organization_id IS NULL
  AND a.lead_id = l.id;

UPDATE crm_activities a
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE a.organization_id IS NULL
  AND a.user_id = u.id;

UPDATE crm_activities
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE crm_activities
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_stage_org ON crm_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_org ON crm_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_org_status ON crm_leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_team_org ON crm_teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_org ON crm_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_org_lead ON crm_activities(organization_id, lead_id);

