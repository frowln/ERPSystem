-- Add lag_days, organization_id, and created_at to task_dependencies for critical path analysis
ALTER TABLE task_dependencies ADD COLUMN IF NOT EXISTS lag_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE task_dependencies ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_dependencies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Backfill organization_id from predecessor task's project → organization
UPDATE task_dependencies td
SET organization_id = p.organization_id
FROM project_tasks pt
JOIN projects p ON p.id = pt.project_id
WHERE td.task_id = pt.id
  AND td.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_task_dep_organization ON task_dependencies(organization_id);
