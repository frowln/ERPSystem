-- P5-02: Predictive analytics for delays and cost overruns

CREATE TABLE prediction_models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    model_type      VARCHAR(20) NOT NULL CHECK (model_type IN ('DELAY', 'COST_OVERRUN', 'QUALITY_RISK')),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    training_data_json JSONB    NOT NULL DEFAULT '{}',
    accuracy_percent NUMERIC(5,2),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    trained_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT      NOT NULL DEFAULT 0,
    deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_prediction_model_org      ON prediction_models (organization_id);
CREATE INDEX idx_prediction_model_type     ON prediction_models (model_type);
CREATE INDEX idx_prediction_model_active   ON prediction_models (is_active) WHERE deleted = FALSE;

CREATE TABLE project_risk_predictions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id          UUID           NOT NULL,
    project_id               UUID           NOT NULL,
    model_id                 UUID,
    prediction_type          VARCHAR(20)    NOT NULL CHECK (prediction_type IN ('DELAY', 'COST_OVERRUN', 'QUALITY_RISK')),
    probability_percent      NUMERIC(5,2)   NOT NULL,
    confidence_level         VARCHAR(10)    NOT NULL CHECK (confidence_level IN ('LOW', 'MEDIUM', 'HIGH')),
    risk_factors_json        JSONB          NOT NULL DEFAULT '[]',
    predicted_delay_days     INTEGER,
    predicted_overrun_amount NUMERIC(18,2),
    alert_generated          BOOLEAN        NOT NULL DEFAULT FALSE,
    predicted_at             TIMESTAMPTZ    NOT NULL DEFAULT now(),
    valid_until              TIMESTAMPTZ,
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ,
    created_by               VARCHAR(255),
    updated_by               VARCHAR(255),
    version                  BIGINT         NOT NULL DEFAULT 0,
    deleted                  BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_risk_pred_model FOREIGN KEY (model_id)   REFERENCES prediction_models (id),
    CONSTRAINT fk_risk_pred_project FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE INDEX idx_risk_pred_org        ON project_risk_predictions (organization_id);
CREATE INDEX idx_risk_pred_project    ON project_risk_predictions (project_id);
CREATE INDEX idx_risk_pred_type       ON project_risk_predictions (prediction_type);
CREATE INDEX idx_risk_pred_alert      ON project_risk_predictions (alert_generated) WHERE deleted = FALSE;
CREATE INDEX idx_risk_pred_valid      ON project_risk_predictions (valid_until) WHERE deleted = FALSE;
CREATE INDEX idx_risk_pred_prob       ON project_risk_predictions (probability_percent DESC) WHERE deleted = FALSE;

CREATE TABLE risk_factor_weights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID           NOT NULL,
    factor_name     VARCHAR(200)   NOT NULL,
    factor_category VARCHAR(20)    NOT NULL CHECK (factor_category IN ('WEATHER', 'WORKFORCE', 'MATERIAL', 'SUBCONTRACTOR', 'FINANCIAL', 'REGULATORY')),
    weight_value    NUMERIC(5,4)   NOT NULL DEFAULT 1.0,
    description     TEXT,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT         NOT NULL DEFAULT 0,
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_risk_weight_org      ON risk_factor_weights (organization_id);
CREATE INDEX idx_risk_weight_category ON risk_factor_weights (factor_category);
CREATE UNIQUE INDEX idx_risk_weight_org_name ON risk_factor_weights (organization_id, factor_name) WHERE deleted = FALSE;
