-- F10: Constructability Review tables
CREATE TABLE IF NOT EXISTS constructability_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    organization_id UUID NOT NULL,
    specification_id UUID,
    title           VARCHAR(500) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    reviewer_name   VARCHAR(200) NOT NULL,
    review_date     DATE NOT NULL,
    overall_rating  VARCHAR(30),
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS constructability_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id       UUID NOT NULL REFERENCES constructability_reviews(id),
    category        VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    severity        VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    resolution      TEXT,
    rfi_id          UUID,
    assigned_to     VARCHAR(200),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cr_reviews_project ON constructability_reviews(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cr_reviews_org ON constructability_reviews(organization_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cr_items_review ON constructability_items(review_id) WHERE deleted = FALSE;
