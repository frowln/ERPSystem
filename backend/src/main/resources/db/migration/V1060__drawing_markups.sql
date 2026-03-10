-- Drawing markups (PDF/document annotation layer)
CREATE TABLE IF NOT EXISTS drawing_markups (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID         NOT NULL,
    document_id      UUID         NOT NULL,
    page_number      INT          NOT NULL DEFAULT 1,
    markup_type      VARCHAR(30)  NOT NULL,
    x                NUMERIC(10,2) NOT NULL DEFAULT 0,
    y                NUMERIC(10,2) NOT NULL DEFAULT 0,
    width            NUMERIC(10,2),
    height           NUMERIC(10,2),
    rotation         NUMERIC(6,2) DEFAULT 0,
    color            VARCHAR(7)   DEFAULT '#FF0000',
    stroke_width     INT          DEFAULT 2,
    text_content     TEXT,
    author_name      VARCHAR(255),
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT now(),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    deleted          BOOLEAN      NOT NULL DEFAULT FALSE,
    version          BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_drawing_markup_org ON drawing_markups (organization_id);
CREATE INDEX IF NOT EXISTS idx_drawing_markup_doc ON drawing_markups (document_id);
CREATE INDEX IF NOT EXISTS idx_drawing_markup_doc_page ON drawing_markups (document_id, page_number);
