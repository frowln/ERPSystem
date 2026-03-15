-- Custom Fields: allow organizations to define arbitrary fields on entities
CREATE TABLE custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(30) NOT NULL,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_searchable BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    options JSONB,
    default_value TEXT,
    validation_regex VARCHAR(500),
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(organization_id, entity_type, field_key)
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    definition_id UUID NOT NULL REFERENCES custom_field_definitions(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    value_text TEXT,
    value_number DOUBLE PRECISION,
    value_date TIMESTAMP,
    value_boolean BOOLEAN,
    value_json JSONB,
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(definition_id, entity_id)
);

CREATE INDEX idx_cfd_org_entity ON custom_field_definitions(organization_id, entity_type) WHERE deleted = false;
CREATE INDEX idx_cfv_entity ON custom_field_values(entity_type, entity_id) WHERE deleted = false;
CREATE INDEX idx_cfv_definition ON custom_field_values(definition_id) WHERE deleted = false;
CREATE INDEX idx_cfv_searchable_text ON custom_field_values(definition_id, value_text) WHERE deleted = false;
