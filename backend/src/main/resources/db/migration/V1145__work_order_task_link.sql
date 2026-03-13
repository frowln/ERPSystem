-- V1145: P0-5 (Цепочка 7): Task → WorkOrder — добавить task_id в work_orders
ALTER TABLE work_orders ADD COLUMN task_id UUID;
ALTER TABLE work_orders ADD CONSTRAINT fk_work_order_task
    FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE SET NULL;
CREATE INDEX idx_work_order_task ON work_orders(task_id) WHERE task_id IS NOT NULL;
