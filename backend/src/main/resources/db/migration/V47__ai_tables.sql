-- =============================================================================
-- AI/ML Assistant tables
-- =============================================================================

-- AI Conversations
CREATE TABLE ai_conversations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    project_id          UUID REFERENCES projects(id),
    title               VARCHAR(500) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_message_at     TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_conversation_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_project ON ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_active ON ai_conversations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Messages
CREATE TABLE ai_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL,
    content             TEXT NOT NULL,
    tokens_used         INTEGER DEFAULT 0,
    model               VARCHAR(100),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_message_role CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM'))
);

CREATE INDEX IF NOT EXISTS idx_ai_message_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_role ON ai_messages(role);
CREATE INDEX IF NOT EXISTS idx_ai_message_active ON ai_messages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_messages_updated_at
    BEFORE UPDATE ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Document Analysis
CREATE TABLE ai_document_analyses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL,
    analysis_type       VARCHAR(30) NOT NULL,
    result              JSONB,
    confidence          DOUBLE PRECISION,
    processed_at        TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_doc_analysis_type CHECK (analysis_type IN ('SUMMARY', 'EXTRACT_DATA', 'CLASSIFY', 'COMPARE')),
    CONSTRAINT chk_ai_doc_analysis_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_ai_doc_analysis_document ON ai_document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_analysis_type ON ai_document_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_doc_analysis_status ON ai_document_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_doc_analysis_active ON ai_document_analyses(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_document_analyses_updated_at
    BEFORE UPDATE ON ai_document_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Predictions
CREATE TABLE ai_predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    prediction_type     VARCHAR(30) NOT NULL,
    input_data          JSONB NOT NULL,
    result              JSONB NOT NULL,
    confidence          DOUBLE PRECISION,
    actual_value        DOUBLE PRECISION,
    accuracy            DOUBLE PRECISION,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ai_prediction_type CHECK (prediction_type IN ('COST', 'DURATION', 'RISK', 'RESOURCE'))
);

CREATE INDEX IF NOT EXISTS idx_ai_prediction_project ON ai_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_prediction_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_prediction_active ON ai_predictions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_predictions_updated_at
    BEFORE UPDATE ON ai_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Templates
CREATE TABLE ai_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    system_prompt       TEXT NOT NULL,
    category            VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    model               VARCHAR(100),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ai_template_code ON ai_templates(code);
CREATE INDEX IF NOT EXISTS idx_ai_template_category ON ai_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_template_active ON ai_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_templates_updated_at
    BEFORE UPDATE ON ai_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Usage Log
CREATE TABLE ai_usage_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    feature             VARCHAR(100) NOT NULL,
    tokens_input        INTEGER NOT NULL DEFAULT 0,
    tokens_output       INTEGER NOT NULL DEFAULT 0,
    cost                DOUBLE PRECISION DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_active ON ai_usage_logs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ai_usage_logs_updated_at
    BEFORE UPDATE ON ai_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
