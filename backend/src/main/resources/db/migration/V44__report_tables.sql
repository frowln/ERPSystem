-- =============================================================================
-- PDF Report Generation (Генерация PDF отчетов)
-- =============================================================================

-- =============================================================================
-- PDF Report Templates (Шаблоны PDF отчетов)
-- =============================================================================
CREATE TABLE pdf_report_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    report_type         VARCHAR(50) NOT NULL,
    template_html       TEXT NOT NULL,
    header_html         TEXT,
    footer_html         TEXT,
    paper_size          VARCHAR(20) NOT NULL DEFAULT 'A4',
    orientation         VARCHAR(20) NOT NULL DEFAULT 'PORTRAIT',
    margin_top          INTEGER NOT NULL DEFAULT 20,
    margin_bottom       INTEGER NOT NULL DEFAULT 20,
    margin_left         INTEGER NOT NULL DEFAULT 15,
    margin_right        INTEGER NOT NULL DEFAULT 15,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_paper_size CHECK (paper_size IN ('A4', 'A3', 'LETTER')),
    CONSTRAINT chk_orientation CHECK (orientation IN ('PORTRAIT', 'LANDSCAPE'))
);

CREATE INDEX IF NOT EXISTS idx_pdf_report_template_code ON pdf_report_templates(code);
CREATE INDEX IF NOT EXISTS idx_pdf_report_template_type ON pdf_report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_pdf_report_template_active ON pdf_report_templates(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_pdf_report_templates_updated_at
    BEFORE UPDATE ON pdf_report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Generated Reports (Сгенерированные отчеты)
-- =============================================================================
CREATE TABLE generated_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id         UUID NOT NULL,
    entity_type         VARCHAR(100),
    entity_id           UUID,
    parameters          JSONB DEFAULT '{}'::jsonb,
    file_url            VARCHAR(1000) NOT NULL,
    file_size           BIGINT NOT NULL DEFAULT 0,
    generated_by_id     UUID NOT NULL,
    generated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_generated_report_template FOREIGN KEY (template_id)
        REFERENCES pdf_report_templates(id) ON DELETE RESTRICT,
    CONSTRAINT chk_generated_report_file_size CHECK (file_size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_gen_report_template ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_gen_report_entity ON generated_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gen_report_generated_by ON generated_reports(generated_by_id);
CREATE INDEX IF NOT EXISTS idx_gen_report_generated_at ON generated_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_gen_report_active ON generated_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_generated_reports_updated_at
    BEFORE UPDATE ON generated_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Print Forms (Печатные формы)
-- =============================================================================
CREATE TABLE print_forms (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    entity_type         VARCHAR(100) NOT NULL,
    template_id         UUID NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_print_form_template FOREIGN KEY (template_id)
        REFERENCES pdf_report_templates(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_print_form_code ON print_forms(code);
CREATE INDEX IF NOT EXISTS idx_print_form_entity ON print_forms(entity_type);
CREATE INDEX IF NOT EXISTS idx_print_form_template ON print_forms(template_id);
CREATE INDEX IF NOT EXISTS idx_print_form_active ON print_forms(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_print_forms_updated_at
    BEFORE UPDATE ON print_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
