-- Добавляем поля description, action_type, action_config в workflow_steps
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS action_config JSONB;
