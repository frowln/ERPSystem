-- Task participants: 4-role model (Постановщик/Ответственный/Соисполнитель/Наблюдатель)
CREATE TABLE IF NOT EXISTS task_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    user_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(30) NOT NULL CHECK (role IN ('RESPONSIBLE', 'CO_EXECUTOR', 'OBSERVER')),
    added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    added_by_id     UUID,
    added_by_name   VARCHAR(255)
);

CREATE INDEX idx_tp_task ON task_participants(task_id);
CREATE INDEX idx_tp_user ON task_participants(user_id);
CREATE INDEX idx_tp_role ON task_participants(role);
CREATE UNIQUE INDEX uq_task_participant_user_role ON task_participants(task_id, user_id, role);

-- Task visibility column: PARTICIPANTS_ONLY (default), PROJECT, ORGANIZATION
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS visibility VARCHAR(30) NOT NULL DEFAULT 'PARTICIPANTS_ONLY';

-- Ensure delegation columns exist (V1105 may have added them)
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_to_id UUID;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS delegated_to_name VARCHAR(255);

-- Migrate existing tasks: auto-create participants from assignee/reporter
INSERT INTO task_participants (id, task_id, user_id, user_name, role, added_at)
SELECT gen_random_uuid(), t.id, t.assignee_id, COALESCE(t.assignee_name, 'Не указан'), 'RESPONSIBLE', now()
FROM project_tasks t
WHERE t.assignee_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM task_participants tp
      WHERE tp.task_id = t.id AND tp.user_id = t.assignee_id AND tp.role = 'RESPONSIBLE'
  );

INSERT INTO task_participants (id, task_id, user_id, user_name, role, added_at)
SELECT gen_random_uuid(), t.id, t.reporter_id, COALESCE(t.reporter_name, 'Не указан'), 'OBSERVER', now()
FROM project_tasks t
WHERE t.reporter_id IS NOT NULL
  AND t.reporter_id != COALESCE(t.assignee_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND NOT EXISTS (
      SELECT 1 FROM task_participants tp
      WHERE tp.task_id = t.id AND tp.user_id = t.reporter_id AND tp.role = 'OBSERVER'
  );

-- Set existing tasks to ORGANIZATION visibility (backward compatibility)
UPDATE project_tasks SET visibility = 'ORGANIZATION' WHERE visibility = 'PARTICIPANTS_ONLY';
