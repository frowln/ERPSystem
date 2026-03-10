-- Add color and icon fields to task_stages for visual customization
ALTER TABLE task_stages ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#3b82f6';
ALTER TABLE task_stages ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- Add stage_id to project_tasks for custom status mapping
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES task_stages(id);
CREATE INDEX IF NOT EXISTS idx_task_stage_id ON project_tasks(stage_id) WHERE stage_id IS NOT NULL;
