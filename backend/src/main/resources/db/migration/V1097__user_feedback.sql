-- NPS/CSAT user feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    organization_id UUID         NOT NULL,
    type            VARCHAR(10)  NOT NULL,
    score           INTEGER      NOT NULL CHECK (score >= 0 AND score <= 10),
    comment         TEXT,
    page            VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_org ON user_feedback (user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_org ON user_feedback (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback (created_at);
