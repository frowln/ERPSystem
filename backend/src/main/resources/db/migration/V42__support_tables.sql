-- =============================================================================
-- Sequences for support module
-- =============================================================================
CREATE SEQUENCE support_ticket_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Ticket Categories (Категории заявок)
-- =============================================================================
CREATE TABLE ticket_categories (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(50) UNIQUE NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    default_assignee_id     UUID,
    sla_hours               INTEGER,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ticket_category_code ON ticket_categories(code);
CREATE INDEX IF NOT EXISTS idx_ticket_category_active ON ticket_categories(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ticket_categories_updated_at
    BEFORE UPDATE ON ticket_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Support Tickets (Заявки в техподдержку)
-- =============================================================================
CREATE TABLE support_tickets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(50) UNIQUE,
    subject                 VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    category                VARCHAR(100),
    priority                VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    reporter_id             UUID,
    assignee_id             UUID,
    due_date                DATE,
    resolved_at             TIMESTAMP WITH TIME ZONE,
    satisfaction_rating     INTEGER,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ticket_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_ticket_status CHECK (status IN (
        'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_RESPONSE', 'RESOLVED', 'CLOSED'
    )),
    CONSTRAINT chk_ticket_rating CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5))
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_ticket_reporter ON support_tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_assignee ON support_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_code ON support_tickets(code);
CREATE INDEX IF NOT EXISTS idx_support_ticket_active ON support_tickets(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Ticket Comments (Комментарии к заявкам)
-- =============================================================================
CREATE TABLE ticket_comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id           UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_id           UUID,
    content             TEXT NOT NULL,
    is_internal         BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_urls     JSONB,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ticket_comment_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comment_active ON ticket_comments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ticket_comments_updated_at
    BEFORE UPDATE ON ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Knowledge Base (База знаний)
-- =============================================================================
CREATE TABLE knowledge_base (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) UNIQUE,
    title               VARCHAR(500) NOT NULL,
    content             TEXT NOT NULL,
    category_id         UUID REFERENCES ticket_categories(id) ON DELETE SET NULL,
    tags                JSONB,
    views               INTEGER NOT NULL DEFAULT 0,
    is_published        BOOLEAN NOT NULL DEFAULT FALSE,
    author_id           UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kb_code ON knowledge_base(code);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_published ON knowledge_base(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_active ON knowledge_base(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FAQ (Часто задаваемые вопросы)
-- =============================================================================
CREATE TABLE faqs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question            TEXT NOT NULL,
    answer              TEXT NOT NULL,
    category_id         UUID REFERENCES ticket_categories(id) ON DELETE SET NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_faq_category ON faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_sort ON faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_faq_active ON faqs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
