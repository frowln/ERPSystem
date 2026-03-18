-- Module visibility settings — admin can disable sidebar modules for all users
CREATE TABLE IF NOT EXISTS module_visibility (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    disabled_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_module_visibility_org UNIQUE (organization_id)
);

CREATE INDEX idx_module_visibility_org ON module_visibility (organization_id) WHERE deleted = FALSE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trg_module_visibility_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER module_visibility_updated_at
    BEFORE UPDATE ON module_visibility
    FOR EACH ROW EXECUTE FUNCTION trg_module_visibility_updated_at();
