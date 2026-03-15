-- User favorites: allows any user to bookmark projects, tasks, documents, counterparties, contracts
CREATE TABLE user_favorites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    entity_type     VARCHAR(50)  NOT NULL,  -- PROJECT, TASK, DOCUMENT, COUNTERPARTY, CONTRACT
    entity_id       UUID         NOT NULL,
    entity_name     VARCHAR(500),           -- cached name for quick display
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_user_favorites_user     ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_entity   ON user_favorites(entity_type, entity_id);
