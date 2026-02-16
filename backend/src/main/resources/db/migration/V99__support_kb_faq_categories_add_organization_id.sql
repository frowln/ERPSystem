-- =============================================================================
-- Multi-tenancy: tenant-scope support knowledge base entities.
-- - ticket_categories, knowledge_base, faqs
-- =============================================================================

ALTER TABLE ticket_categories
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE ticket_categories c
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE c.organization_id IS NULL
  AND c.default_assignee_id IS NOT NULL
  AND u.id = c.default_assignee_id;

UPDATE ticket_categories
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE ticket_categories
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ticket_categories
    DROP CONSTRAINT IF EXISTS ticket_categories_code_key;

ALTER TABLE ticket_categories
    ADD CONSTRAINT uq_ticket_category_org_code UNIQUE (organization_id, code);

ALTER TABLE knowledge_base
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE knowledge_base kb
SET organization_id = c.organization_id
FROM ticket_categories c
WHERE kb.organization_id IS NULL
  AND kb.category_id IS NOT NULL
  AND c.id = kb.category_id;

UPDATE knowledge_base kb
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE kb.organization_id IS NULL
  AND kb.author_id IS NOT NULL
  AND u.id = kb.author_id;

UPDATE knowledge_base
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE knowledge_base
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE knowledge_base
    DROP CONSTRAINT IF EXISTS knowledge_base_code_key;

ALTER TABLE knowledge_base
    ADD CONSTRAINT uq_kb_org_code UNIQUE (organization_id, code);

ALTER TABLE faqs
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE faqs f
SET organization_id = c.organization_id
FROM ticket_categories c
WHERE f.organization_id IS NULL
  AND f.category_id IS NOT NULL
  AND c.id = f.category_id;

UPDATE faqs
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE faqs
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_category_org ON ticket_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_category_org_code ON ticket_categories(organization_id, code);
CREATE INDEX IF NOT EXISTS idx_kb_org ON knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_kb_org_code ON knowledge_base(organization_id, code);
CREATE INDEX IF NOT EXISTS idx_faq_org ON faqs(organization_id);

