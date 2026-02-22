-- P3-07: AOSR hidden work act enhancements (RD-11-02-2006)

-- Add new columns to hidden_work_acts
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS act_number VARCHAR(100);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS materials_used JSONB;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS geodetic_data JSONB;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS drawing_reference VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS sni_p_reference VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS construction_method TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS next_work_permitted TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS inspection_date DATE;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_hwa_number ON hidden_work_acts(act_number) WHERE deleted = FALSE;

-- Attachments for hidden work acts
CREATE TABLE IF NOT EXISTS hidden_work_act_attachments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID NOT NULL,
    act_id            UUID NOT NULL REFERENCES hidden_work_acts(id),
    attachment_type   VARCHAR(30) NOT NULL,
    file_name         VARCHAR(500) NOT NULL,
    file_path         VARCHAR(1000) NOT NULL,
    file_size         BIGINT,
    mime_type         VARCHAR(100),
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    version           BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hwa_att_act ON hidden_work_act_attachments(act_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_hwa_att_type ON hidden_work_act_attachments(attachment_type) WHERE deleted = FALSE;

-- Multi-party signatures for hidden work acts
CREATE TABLE IF NOT EXISTS hidden_work_act_signatures (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID NOT NULL,
    act_id            UUID NOT NULL REFERENCES hidden_work_acts(id),
    signer_user_id    UUID NOT NULL,
    signer_name       VARCHAR(300) NOT NULL,
    signer_role       VARCHAR(50) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    signed_at         TIMESTAMPTZ,
    kep_signature_id  UUID,
    rejection_reason  TEXT,
    comment_text      TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    version           BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hwa_sig_act ON hidden_work_act_signatures(act_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_hwa_sig_role ON hidden_work_act_signatures(signer_role) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_hwa_sig_user ON hidden_work_act_signatures(signer_user_id) WHERE deleted = FALSE;
