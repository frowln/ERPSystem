-- Crews (construction brigades/teams)
CREATE TABLE IF NOT EXISTS crews (
    id                 UUID         NOT NULL PRIMARY KEY,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by         VARCHAR(255),
    deleted            BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at         TIMESTAMPTZ,
    updated_by         VARCHAR(255),
    version            BIGINT       DEFAULT 0,
    organization_id    UUID,
    name               VARCHAR(255) NOT NULL,
    foreman_id         UUID,
    foreman_name       VARCHAR(255),
    foreman_phone      VARCHAR(50),
    workers_count      INTEGER      DEFAULT 0,
    current_project_id UUID,
    current_project    VARCHAR(255),
    status             VARCHAR(30)  DEFAULT 'ACTIVE',
    specialization     VARCHAR(255),
    performance        INTEGER      DEFAULT 0,
    active_orders      INTEGER      DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crews_org    ON crews (organization_id);
CREATE INDEX IF NOT EXISTS idx_crews_status ON crews (status);

ALTER TABLE crews ADD CONSTRAINT crews_status_check
    CHECK (status IN ('ACTIVE', 'IDLE', 'ON_LEAVE', 'DISBANDED'));
