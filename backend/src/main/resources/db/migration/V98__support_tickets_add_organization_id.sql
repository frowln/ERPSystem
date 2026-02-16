-- =============================================================================
-- Multi-tenancy: tenant-scope support tickets by organization_id.
-- =============================================================================

ALTER TABLE support_tickets
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE support_tickets t
SET organization_id = u.organization_id
FROM users u
WHERE t.organization_id IS NULL
  AND t.reporter_id IS NOT NULL
  AND u.id = t.reporter_id;

UPDATE support_tickets t
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE t.organization_id IS NULL
  AND t.assignee_id IS NOT NULL
  AND u.id = t.assignee_id;

UPDATE support_tickets
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE support_tickets
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_ticket_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_org_status ON support_tickets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_org_reporter ON support_tickets(organization_id, reporter_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_org_assignee ON support_tickets(organization_id, assignee_id);

