-- =============================================================================
-- V225: BIM Clash Detection — test configs, results, viewer sessions, element metadata
-- =============================================================================

-- ─── bim_clash_tests ─────────────────────────────────────────────────────────
CREATE TABLE bim_clash_tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    project_id      UUID        NOT NULL,
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    model_a_id      UUID        NOT NULL REFERENCES bim_models(id),
    model_b_id      UUID        NOT NULL REFERENCES bim_models(id),
    tolerance_mm    DOUBLE PRECISION NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    total_clashes_found INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT      NOT NULL DEFAULT 0,
    deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bim_clash_test_org ON bim_clash_tests(organization_id);
CREATE INDEX idx_bim_clash_test_project ON bim_clash_tests(project_id);
CREATE INDEX idx_bim_clash_test_status ON bim_clash_tests(status);
CREATE INDEX idx_bim_clash_test_model_a ON bim_clash_tests(model_a_id);
CREATE INDEX idx_bim_clash_test_model_b ON bim_clash_tests(model_b_id);

-- ─── bim_clash_results ───────────────────────────────────────────────────────
CREATE TABLE bim_clash_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID        NOT NULL,
    clash_test_id       UUID        NOT NULL REFERENCES bim_clash_tests(id),
    element_a_guid      VARCHAR(255) NOT NULL,
    element_a_name      VARCHAR(500),
    element_a_type      VARCHAR(255),
    element_b_guid      VARCHAR(255) NOT NULL,
    element_b_name      VARCHAR(500),
    element_b_type      VARCHAR(255),
    clash_type          VARCHAR(30) NOT NULL DEFAULT 'HARD',
    clash_point_x       DOUBLE PRECISION,
    clash_point_y       DOUBLE PRECISION,
    clash_point_z       DOUBLE PRECISION,
    distance_mm         DOUBLE PRECISION,
    status              VARCHAR(30) NOT NULL DEFAULT 'NEW',
    assigned_to_user_id UUID,
    resolved_at         TIMESTAMPTZ,
    resolution_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT      NOT NULL DEFAULT 0,
    deleted             BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bim_clash_result_org ON bim_clash_results(organization_id);
CREATE INDEX idx_bim_clash_result_test ON bim_clash_results(clash_test_id);
CREATE INDEX idx_bim_clash_result_status ON bim_clash_results(status);
CREATE INDEX idx_bim_clash_result_type ON bim_clash_results(clash_type);
CREATE INDEX idx_bim_clash_result_assigned ON bim_clash_results(assigned_to_user_id);

-- ─── bim_viewer_sessions ─────────────────────────────────────────────────────
CREATE TABLE bim_viewer_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID        NOT NULL,
    user_id                 UUID        NOT NULL,
    model_id                UUID        NOT NULL REFERENCES bim_models(id),
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at                TIMESTAMPTZ,
    camera_position_json    JSONB,
    selected_elements_json  JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT      NOT NULL DEFAULT 0,
    deleted                 BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bim_viewer_session_org ON bim_viewer_sessions(organization_id);
CREATE INDEX idx_bim_viewer_session_user ON bim_viewer_sessions(user_id);
CREATE INDEX idx_bim_viewer_session_model ON bim_viewer_sessions(model_id);

-- ─── bim_element_metadata ────────────────────────────────────────────────────
CREATE TABLE bim_element_metadata (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    model_id        UUID        NOT NULL REFERENCES bim_models(id),
    element_guid    VARCHAR(255) NOT NULL,
    element_name    VARCHAR(500),
    ifc_type        VARCHAR(255),
    floor_name      VARCHAR(255),
    system_name     VARCHAR(255),
    properties_json JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT      NOT NULL DEFAULT 0,
    deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_bim_element_meta_model_guid ON bim_element_metadata(model_id, element_guid) WHERE deleted = FALSE;
CREATE INDEX idx_bim_element_meta_org ON bim_element_metadata(organization_id);
CREATE INDEX idx_bim_element_meta_model ON bim_element_metadata(model_id);
CREATE INDEX idx_bim_element_meta_ifc_type ON bim_element_metadata(ifc_type);
CREATE INDEX idx_bim_element_meta_floor ON bim_element_metadata(floor_name);
