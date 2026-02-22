-- P3-04: Document versioning — locking/checkout and per-revision approval

ALTER TABLE cde_document_containers
    ADD COLUMN IF NOT EXISTS locked_by_id    UUID,
    ADD COLUMN IF NOT EXISTS locked_by_name  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS locked_at       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMP;

ALTER TABLE cde_document_revisions
    ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS approval_comment TEXT;
