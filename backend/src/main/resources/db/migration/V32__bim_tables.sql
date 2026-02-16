-- =====================================================
-- V32: BIM & Design module tables
-- =====================================================

-- Sequence for BIM model codes
CREATE SEQUENCE IF NOT EXISTS bim_model_number_seq START WITH 1;

-- ==================== BIM Models ====================
CREATE TABLE bim_models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500)  NOT NULL,
    project_id      UUID          NOT NULL,
    model_type      VARCHAR(30)   NOT NULL DEFAULT 'ARCHITECTURAL',
    format          VARCHAR(30)   NOT NULL DEFAULT 'IFC',
    file_url        VARCHAR(1000),
    file_size       BIGINT,
    description     TEXT,
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    uploaded_by_id  UUID,
    element_count   INTEGER       DEFAULT 0,
    model_version   INTEGER       DEFAULT 1,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    version         BIGINT        DEFAULT 0
);

CREATE INDEX idx_bim_model_project   ON bim_models (project_id);
CREATE INDEX idx_bim_model_status    ON bim_models (status);
CREATE INDEX idx_bim_model_type      ON bim_models (model_type);
CREATE INDEX idx_bim_model_format    ON bim_models (format);

-- ==================== BIM Elements ====================
CREATE TABLE bim_elements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID          NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    element_id      VARCHAR(255)  NOT NULL,
    ifc_type        VARCHAR(255)  NOT NULL,
    name            VARCHAR(500),
    properties      JSONB,
    geometry        JSONB,
    floor           VARCHAR(100),
    zone            VARCHAR(100),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    version         BIGINT        DEFAULT 0
);

CREATE INDEX idx_bim_element_model    ON bim_elements (model_id);
CREATE INDEX idx_bim_element_eid      ON bim_elements (element_id);
CREATE INDEX idx_bim_element_ifc_type ON bim_elements (ifc_type);

-- ==================== BIM Clashes ====================
CREATE TABLE bim_clashes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_a_id      UUID          NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    model_b_id      UUID          REFERENCES bim_models(id) ON DELETE SET NULL,
    element_a_id    VARCHAR(255),
    element_b_id    VARCHAR(255),
    clash_type      VARCHAR(30)   NOT NULL DEFAULT 'HARD',
    severity        VARCHAR(30)   NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(30)   NOT NULL DEFAULT 'NEW',
    description     TEXT,
    coordinates     JSONB,
    resolved_by_id  UUID,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    version         BIGINT        DEFAULT 0
);

CREATE INDEX idx_bim_clash_model_a   ON bim_clashes (model_a_id);
CREATE INDEX idx_bim_clash_model_b   ON bim_clashes (model_b_id);
CREATE INDEX idx_bim_clash_status    ON bim_clashes (status);
CREATE INDEX idx_bim_clash_severity  ON bim_clashes (severity);

-- ==================== BIM Versions ====================
CREATE TABLE bim_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            UUID          NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    version_number      INTEGER       NOT NULL,
    change_description  TEXT,
    file_url            VARCHAR(1000),
    uploaded_by_id      UUID,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    version             BIGINT        DEFAULT 0
);

CREATE INDEX idx_bim_version_model ON bim_versions (model_id);

-- ==================== BIM Viewers ====================
CREATE TABLE bim_viewers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id          UUID          NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    view_name         VARCHAR(255)  NOT NULL,
    camera_position   JSONB,
    description       TEXT,
    is_default        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    version           BIGINT        DEFAULT 0
);

CREATE INDEX idx_bim_viewer_model ON bim_viewers (model_id);

-- ==================== Design Packages ====================
CREATE SEQUENCE IF NOT EXISTS design_package_number_seq START WITH 1;

CREATE TABLE design_packages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID          NOT NULL,
    code              VARCHAR(50)   NOT NULL,
    name              VARCHAR(500)  NOT NULL,
    discipline        VARCHAR(30)   NOT NULL,
    status            VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    package_version   INTEGER       DEFAULT 1,
    approved_by_id    UUID,
    approved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    version           BIGINT        DEFAULT 0
);

CREATE INDEX idx_design_pkg_project    ON design_packages (project_id);
CREATE INDEX idx_design_pkg_status     ON design_packages (status);
CREATE INDEX idx_design_pkg_discipline ON design_packages (discipline);
CREATE UNIQUE INDEX idx_design_pkg_code ON design_packages (code) WHERE deleted = FALSE;

-- ==================== Design Drawings ====================
CREATE TABLE design_drawings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id      UUID          NOT NULL REFERENCES design_packages(id) ON DELETE CASCADE,
    number          VARCHAR(100)  NOT NULL,
    title           VARCHAR(500)  NOT NULL,
    revision        VARCHAR(20)   DEFAULT '0',
    scale           VARCHAR(50)   DEFAULT '1:100',
    format          VARCHAR(10)   DEFAULT 'A1',
    file_url        VARCHAR(1000),
    status          VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    discipline      VARCHAR(30)   NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    version         BIGINT        DEFAULT 0
);

CREATE INDEX idx_design_drawing_pkg        ON design_drawings (package_id);
CREATE INDEX idx_design_drawing_status     ON design_drawings (status);
CREATE INDEX idx_design_drawing_discipline ON design_drawings (discipline);

-- ==================== Drawing Annotations ====================
CREATE TABLE drawing_annotations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id       UUID          NOT NULL REFERENCES design_drawings(id) ON DELETE CASCADE,
    author_id        UUID,
    x                DOUBLE PRECISION NOT NULL DEFAULT 0,
    y                DOUBLE PRECISION NOT NULL DEFAULT 0,
    width            DOUBLE PRECISION DEFAULT 0,
    height           DOUBLE PRECISION DEFAULT 0,
    content          TEXT,
    annotation_type  VARCHAR(30)   NOT NULL DEFAULT 'PIN',
    status           VARCHAR(30)   NOT NULL DEFAULT 'OPEN',
    resolved_by_id   UUID,
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
    version          BIGINT        DEFAULT 0
);

CREATE INDEX idx_drawing_annotation_drawing ON drawing_annotations (drawing_id);
CREATE INDEX idx_drawing_annotation_status  ON drawing_annotations (status);

-- ==================== Drawing Markups ====================
CREATE TABLE drawing_markups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id      UUID          NOT NULL REFERENCES design_drawings(id) ON DELETE CASCADE,
    author_id       UUID,
    markup_data     JSONB,
    color           VARCHAR(20)   DEFAULT '#FF0000',
    layer           VARCHAR(100),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    version         BIGINT        DEFAULT 0
);

CREATE INDEX idx_drawing_markup_drawing ON drawing_markups (drawing_id);

-- ==================== Photo Progress ====================
CREATE TABLE photo_progress (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID          NOT NULL,
    title               VARCHAR(500)  NOT NULL,
    location            VARCHAR(500),
    photo_url           VARCHAR(1000) NOT NULL,
    thumbnail_url       VARCHAR(1000),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    taken_at            TIMESTAMPTZ,
    taken_by_id         UUID,
    weather_condition   VARCHAR(30),
    description         TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    version             BIGINT        DEFAULT 0
);

CREATE INDEX idx_photo_progress_project ON photo_progress (project_id);
CREATE INDEX idx_photo_progress_taken   ON photo_progress (taken_at);

-- ==================== Photo Comparisons ====================
CREATE TABLE photo_comparisons (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    before_photo_id   UUID          NOT NULL REFERENCES photo_progress(id) ON DELETE CASCADE,
    after_photo_id    UUID          NOT NULL REFERENCES photo_progress(id) ON DELETE CASCADE,
    project_id        UUID          NOT NULL,
    title             VARCHAR(500)  NOT NULL,
    description       TEXT,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    version           BIGINT        DEFAULT 0
);

CREATE INDEX idx_photo_comparison_project ON photo_comparisons (project_id);

-- ==================== Photo Albums ====================
CREATE TABLE photo_albums (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL,
    name            VARCHAR(500)  NOT NULL,
    description     TEXT,
    cover_photo_id  UUID          REFERENCES photo_progress(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    version         BIGINT        DEFAULT 0
);

CREATE INDEX idx_photo_album_project ON photo_albums (project_id);

-- ==================== Photo Album <==> Photo join table ====================
CREATE TABLE photo_album_photos (
    album_id  UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    photo_id  UUID NOT NULL REFERENCES photo_progress(id) ON DELETE CASCADE,
    PRIMARY KEY (album_id, photo_id)
);
