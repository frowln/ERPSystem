CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    storage_path VARCHAR(1000),
    description VARCHAR(1000),
    uploaded_by VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_attachment_entity ON file_attachments (entity_type, entity_id);
