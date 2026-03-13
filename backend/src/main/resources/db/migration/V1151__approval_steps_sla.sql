-- V1149: P1-DOC-1 — ApprovalStep SLA дедлайны
-- При создании шага — устанавливается deadline = now() + slaHours
-- @Scheduled job проверяет просроченные шаги и эскалирует
ALTER TABLE approval_steps
    ADD COLUMN IF NOT EXISTS sla_hours INTEGER,
    ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN approval_steps.sla_hours IS
    'Максимальное время на согласование в часах (по умолчанию — из шаблона ApprovalChain)';
COMMENT ON COLUMN approval_steps.deadline IS
    'Крайний срок = createdAt + slaHours; заполняется при старте шага';
COMMENT ON COLUMN approval_steps.is_overdue IS
    'TRUE если дедлайн просрочен (@Scheduled job ApprovalSlaCheckJob)';
COMMENT ON COLUMN approval_steps.escalated_at IS
    'Время последней эскалации (уведомление руководителю)';
