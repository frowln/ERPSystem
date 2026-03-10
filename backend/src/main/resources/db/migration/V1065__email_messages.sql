-- Email integration tables (Yandex IMAP/SMTP)

CREATE TABLE IF NOT EXISTS email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_uid VARCHAR(500) NOT NULL,
    message_id_header VARCHAR(1000),
    folder VARCHAR(100) NOT NULL DEFAULT 'INBOX',
    from_address VARCHAR(500) NOT NULL,
    from_name VARCHAR(500),
    to_addresses TEXT,
    cc_addresses TEXT,
    bcc_addresses TEXT,
    subject VARCHAR(2000),
    body_text TEXT,
    body_html TEXT,
    received_at TIMESTAMPTZ NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_draft BOOLEAN DEFAULT false,
    has_attachments BOOLEAN DEFAULT false,
    in_reply_to VARCHAR(1000),
    references_header TEXT,
    raw_headers TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(message_uid, folder)
);

CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    content_type VARCHAR(200),
    size_bytes BIGINT,
    storage_path VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_project_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    linked_by UUID,
    linked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(email_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_email_messages_folder ON email_messages(folder);
CREATE INDEX IF NOT EXISTS idx_email_messages_received ON email_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_from ON email_messages(from_address);
CREATE INDEX IF NOT EXISTS idx_email_messages_read ON email_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_email_messages_subject ON email_messages USING gin(to_tsvector('russian', subject));
CREATE INDEX IF NOT EXISTS idx_email_project_links_project ON email_project_links(project_id);
CREATE INDEX IF NOT EXISTS idx_email_project_links_email ON email_project_links(email_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_email ON email_attachments(email_id);
