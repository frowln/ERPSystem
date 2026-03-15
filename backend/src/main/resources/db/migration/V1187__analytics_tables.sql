-- DAU/MAU daily aggregation
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(30) NOT NULL, -- DAU, MAU, NEW_REGISTRATIONS
    metric_value INTEGER NOT NULL DEFAULT 0,
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usage_metrics_date_type ON usage_metrics(metric_date, metric_type);

-- Activation funnel events
CREATE TABLE IF NOT EXISTS activation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- REGISTERED, SETUP_COMPLETED, FIRST_PROJECT, FIRST_ESTIMATE, FIRST_KS2
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activation_events_org ON activation_events(organization_id, event_type);
CREATE INDEX idx_activation_events_user ON activation_events(user_id);

-- Page view events
CREATE TABLE IF NOT EXISTS page_view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    module_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_page_views_org_date ON page_view_events(organization_id, created_at);
CREATE INDEX idx_page_views_module ON page_view_events(module_name, created_at);

-- Customer health scores
CREATE TABLE IF NOT EXISTS customer_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE,
    overall_score INTEGER NOT NULL DEFAULT 50,
    engagement_score INTEGER NOT NULL DEFAULT 50,
    activity_score INTEGER NOT NULL DEFAULT 50,
    adoption_score INTEGER NOT NULL DEFAULT 50,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    last_login_at TIMESTAMPTZ,
    days_since_login INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    active_users_30d INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_health_scores_risk ON customer_health_scores(risk_level);
