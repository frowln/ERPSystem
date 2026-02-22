-- P0-14: Make Project.organizationId NOT NULL to enforce tenant isolation
-- First, backfill any NULL values with a placeholder (the first organization found)
UPDATE projects
SET organization_id = (
    SELECT id FROM organizations WHERE deleted = false ORDER BY created_at LIMIT 1
)
WHERE organization_id IS NULL
  AND (SELECT COUNT(*) FROM organizations WHERE deleted = false) > 0;

-- Now enforce NOT NULL constraint
ALTER TABLE projects
    ALTER COLUMN organization_id SET NOT NULL;
