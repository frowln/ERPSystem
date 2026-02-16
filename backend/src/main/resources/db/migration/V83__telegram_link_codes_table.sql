-- Telegram link codes for user-to-chat linking
CREATE TABLE IF NOT EXISTS telegram_link_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    chat_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_tg_link_code ON telegram_link_codes(code) WHERE deleted = FALSE;
CREATE INDEX idx_tg_link_user ON telegram_link_codes(user_id) WHERE deleted = FALSE;
CREATE INDEX idx_tg_link_expires ON telegram_link_codes(expires_at) WHERE deleted = FALSE AND used = FALSE;
