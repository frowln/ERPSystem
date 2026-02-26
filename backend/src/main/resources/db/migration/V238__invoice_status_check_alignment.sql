-- Align DB-level invoice status check with application enum.
-- Without this migration, creating invoices in NEW status fails with 409 (data integrity violation).

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_invoice_status;

ALTER TABLE invoices
    ADD CONSTRAINT chk_invoice_status CHECK (
        status IN (
            'NEW',
            'UNDER_REVIEW',
            'LINKED_TO_POSITION',
            'ON_APPROVAL',
            'APPROVED',
            'CLOSED',
            'REJECTED',
            'DRAFT',
            'SENT',
            'PARTIALLY_PAID',
            'PAID',
            'OVERDUE',
            'CANCELLED'
        )
    );
