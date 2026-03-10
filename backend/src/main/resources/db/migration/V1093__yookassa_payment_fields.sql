-- Add YooKassa payment tracking fields to billing_records
ALTER TABLE billing_records
    ADD COLUMN IF NOT EXISTS yookassa_payment_id   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS yookassa_idempotency   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS confirmation_url       VARCHAR(500),
    ADD COLUMN IF NOT EXISTS refund_id              VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_br_yookassa_payment ON billing_records(yookassa_payment_id)
    WHERE yookassa_payment_id IS NOT NULL;
