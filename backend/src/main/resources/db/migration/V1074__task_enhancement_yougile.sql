-- Task time tracking entries (stopwatch/timer)
CREATE TABLE IF NOT EXISTS task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  started_at TIMESTAMPTZ NOT NULL,
  stopped_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  description TEXT,
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entry_task ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entry_user ON task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entry_running ON task_time_entries(is_running) WHERE is_running = TRUE;

-- Task labels (colored tags/stickers)
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_label_org ON task_labels(organization_id);

-- Task label assignments (many-to-many)
CREATE TABLE IF NOT EXISTS task_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
  UNIQUE(task_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_label_assignment_task ON task_label_assignments(task_id);

-- Delegation fields on project_tasks
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_to_id UUID;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_to_name VARCHAR(255);
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_at TIMESTAMPTZ;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_by_id UUID;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_by_name VARCHAR(255);
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_task_delegated_to ON project_tasks(delegated_to_id) WHERE delegated_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_favorite ON project_tasks(is_favorite) WHERE is_favorite = TRUE;
