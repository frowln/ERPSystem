-- Add delegation fields to project_tasks table
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_to_id UUID;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_to_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_task_delegated_to ON project_tasks(delegated_to_id);
