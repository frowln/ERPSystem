-- V226: Defect-to-BIM linking tables

CREATE TABLE defect_bim_links (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID         NOT NULL,
    defect_id            UUID         NOT NULL REFERENCES defects(id),
    model_id             UUID         NOT NULL REFERENCES bim_models(id),
    element_guid         VARCHAR(255) NOT NULL,
    element_name         VARCHAR(500),
    element_type         VARCHAR(200),
    floor_name           VARCHAR(200),
    system_name          VARCHAR(200),
    pin_x                DOUBLE PRECISION,
    pin_y                DOUBLE PRECISION,
    pin_z                DOUBLE PRECISION,
    camera_position_json JSONB,
    screenshot_url       VARCHAR(1000),
    notes                TEXT,
    linked_by_user_id    UUID,
    linked_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ,
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255),
    version              BIGINT       NOT NULL DEFAULT 0,
    deleted              BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX idx_defect_bim_link_org        ON defect_bim_links(organization_id);
CREATE INDEX idx_defect_bim_link_defect     ON defect_bim_links(defect_id);
CREATE INDEX idx_defect_bim_link_model      ON defect_bim_links(model_id);
CREATE INDEX idx_defect_bim_link_element    ON defect_bim_links(element_guid);
CREATE INDEX idx_defect_bim_link_floor      ON defect_bim_links(floor_name);
CREATE INDEX idx_defect_bim_link_system     ON defect_bim_links(system_name);

CREATE TABLE bim_defect_views (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID         NOT NULL,
    project_id            UUID         NOT NULL,
    name                  VARCHAR(500) NOT NULL,
    description           TEXT,
    model_id              UUID         REFERENCES bim_models(id),
    filter_floor          VARCHAR(200),
    filter_system         VARCHAR(200),
    filter_defect_status  VARCHAR(30),
    camera_preset_json    JSONB,
    element_guids_json    JSONB,
    is_shared             BOOLEAN      NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    version               BIGINT       NOT NULL DEFAULT 0,
    deleted               BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX idx_bim_defect_view_org     ON bim_defect_views(organization_id);
CREATE INDEX idx_bim_defect_view_project ON bim_defect_views(project_id);
CREATE INDEX idx_bim_defect_view_model   ON bim_defect_views(model_id);
