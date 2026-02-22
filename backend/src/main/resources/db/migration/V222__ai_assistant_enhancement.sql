-- =============================================================================
-- P5-01: AI Assistant Enhancement
-- Model configs, conversation contexts, prompt templates, enhanced usage logs
-- =============================================================================

-- AI Model Configurations (per-organization LLM provider settings)
CREATE TABLE ai_model_configs (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id                 UUID NOT NULL REFERENCES organizations(id),
    provider                        VARCHAR(30) NOT NULL,
    api_url                         VARCHAR(1000),
    api_key_encrypted               VARCHAR(2000),
    model_name                      VARCHAR(200) NOT NULL,
    max_tokens                      INTEGER NOT NULL DEFAULT 4096,
    temperature                     DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    is_active                       BOOLEAN NOT NULL DEFAULT TRUE,
    is_default                      BOOLEAN NOT NULL DEFAULT FALSE,
    data_processing_agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                      VARCHAR(255),
    updated_by                      VARCHAR(255),
    version                         BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_model_provider CHECK (provider IN ('YANDEX_GPT', 'GIGACHAT', 'SELF_HOSTED', 'OPENAI'))
);

CREATE INDEX idx_ai_model_config_org ON ai_model_configs(organization_id);
CREATE INDEX idx_ai_model_config_provider ON ai_model_configs(provider);
CREATE INDEX idx_ai_model_config_active ON ai_model_configs(is_active) WHERE is_active = TRUE AND deleted = FALSE;
CREATE INDEX idx_ai_model_config_default ON ai_model_configs(organization_id, is_default) WHERE is_default = TRUE AND deleted = FALSE;

CREATE TRIGGER update_ai_model_configs_updated_at
    BEFORE UPDATE ON ai_model_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Conversation Contexts (bind conversations to domain entities)
CREATE TABLE ai_conversation_contexts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    conversation_id     UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    context_type        VARCHAR(30) NOT NULL,
    entity_id           UUID,
    entity_name         VARCHAR(500),
    context_data_json   JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_context_type CHECK (context_type IN ('PROJECT', 'DOCUMENT', 'ESTIMATE', 'SAFETY', 'FINANCE', 'GENERAL'))
);

CREATE INDEX idx_ai_conv_ctx_org ON ai_conversation_contexts(organization_id);
CREATE INDEX idx_ai_conv_ctx_conversation ON ai_conversation_contexts(conversation_id);
CREATE INDEX idx_ai_conv_ctx_type ON ai_conversation_contexts(context_type);
CREATE INDEX idx_ai_conv_ctx_entity ON ai_conversation_contexts(entity_id);
CREATE INDEX idx_ai_conv_ctx_active ON ai_conversation_contexts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_conversation_contexts_updated_at
    BEFORE UPDATE ON ai_conversation_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Prompt Templates (reusable prompts for construction domain)
CREATE TABLE ai_prompt_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    name                VARCHAR(500) NOT NULL,
    category            VARCHAR(30) NOT NULL,
    prompt_text_ru      TEXT NOT NULL,
    prompt_text_en      TEXT,
    variables_json      JSONB,
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_prompt_category CHECK (category IN ('DOCUMENT_GEN', 'REPORT', 'ANALYSIS', 'QUERY', 'CLASSIFICATION'))
);

CREATE INDEX idx_ai_prompt_tmpl_org ON ai_prompt_templates(organization_id);
CREATE INDEX idx_ai_prompt_tmpl_category ON ai_prompt_templates(category);
CREATE INDEX idx_ai_prompt_tmpl_system ON ai_prompt_templates(is_system) WHERE is_system = TRUE AND deleted = FALSE;
CREATE INDEX idx_ai_prompt_tmpl_active ON ai_prompt_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_prompt_templates_updated_at
    BEFORE UPDATE ON ai_prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add organization_id and enhanced columns to existing ai_usage_logs
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES ai_conversations(id);
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS model_config_id UUID REFERENCES ai_model_configs(id);
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS response_time_ms BIGINT;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS was_successful BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS cost_rub DOUBLE PRECISION DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_conversation ON ai_usage_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model_config ON ai_usage_logs(model_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_successful ON ai_usage_logs(was_successful);

-- Add organization_id to ai_conversations for tenant scoping
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_org ON ai_conversations(organization_id);
