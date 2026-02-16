-- =============================================================================
-- Sequences for punch list module
-- =============================================================================
CREATE SEQUENCE punch_list_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE punch_item_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Punch Lists (Списки замечаний)
-- =============================================================================
CREATE TABLE punch_lists (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    code                VARCHAR(50) UNIQUE,
    name                VARCHAR(500) NOT NULL,
    created_by_id       UUID,
    due_date            DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    completion_percent  INTEGER DEFAULT 0,
    area_or_zone        VARCHAR(255),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_punch_list_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT chk_punch_list_percent CHECK (completion_percent >= 0 AND completion_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_punch_list_project ON punch_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_status ON punch_lists(status);
CREATE INDEX IF NOT EXISTS idx_punch_list_code ON punch_lists(code);
CREATE INDEX IF NOT EXISTS idx_punch_list_active ON punch_lists(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_punch_lists_updated_at
    BEFORE UPDATE ON punch_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Punch Items (Замечания)
-- =============================================================================
CREATE TABLE punch_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    punch_list_id       UUID REFERENCES punch_lists(id) ON DELETE CASCADE,
    number              INTEGER NOT NULL,
    description         TEXT NOT NULL,
    location            VARCHAR(255),
    category            VARCHAR(50),
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to_id      UUID,
    photo_urls          JSONB,
    fix_deadline        DATE,
    fixed_at            TIMESTAMP WITH TIME ZONE,
    verified_by_id      UUID,
    verified_at         TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_punch_item_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_punch_item_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_punch_item_list ON punch_items(punch_list_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_status ON punch_items(status);
CREATE INDEX IF NOT EXISTS idx_punch_item_priority ON punch_items(priority);
CREATE INDEX IF NOT EXISTS idx_punch_item_assigned ON punch_items(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_active ON punch_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_punch_items_updated_at
    BEFORE UPDATE ON punch_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Punch Item Comments (Комментарии к замечаниям)
-- =============================================================================
CREATE TABLE punch_item_comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    punch_item_id       UUID REFERENCES punch_items(id) ON DELETE CASCADE,
    author_id           UUID,
    content             TEXT NOT NULL,
    attachment_url      VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_punch_comment_item ON punch_item_comments(punch_item_id);
CREATE INDEX IF NOT EXISTS idx_punch_comment_active ON punch_item_comments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_punch_item_comments_updated_at
    BEFORE UPDATE ON punch_item_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
