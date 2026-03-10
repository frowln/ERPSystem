-- Expand notification_type CHECK constraint to include all NotificationType enum values
-- Fixes: DataIntegrityViolationException when sending MESSAGE/CALL notifications

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notif_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notif_type CHECK (notification_type IN (
    'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK', 'APPROVAL', 'SYSTEM',
    'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'COMMENT_ADDED',
    'DOCUMENT_UPLOADED', 'APPROVAL_REQUIRED', 'BUDGET_THRESHOLD',
    'SAFETY_ALERT', 'MESSAGE', 'CALL'
));

-- Also expand notification_batches constraint
ALTER TABLE notification_batches DROP CONSTRAINT IF EXISTS chk_batch_notif_type;
ALTER TABLE notification_batches ADD CONSTRAINT chk_batch_notif_type CHECK (notification_type IN (
    'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK', 'APPROVAL', 'SYSTEM',
    'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'COMMENT_ADDED',
    'DOCUMENT_UPLOADED', 'APPROVAL_REQUIRED', 'BUDGET_THRESHOLD',
    'SAFETY_ALERT', 'MESSAGE', 'CALL'
));

-- Expand column width from VARCHAR(20) to VARCHAR(30) to fit longer enum names
ALTER TABLE notifications ALTER COLUMN notification_type TYPE VARCHAR(30);
ALTER TABLE notification_batches ALTER COLUMN notification_type TYPE VARCHAR(30);
