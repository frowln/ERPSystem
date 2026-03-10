CREATE TABLE IF NOT EXISTS feature_flags (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key      VARCHAR(100) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    enabled       BOOLEAN NOT NULL DEFAULT FALSE,
    organization_scoped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    version       BIGINT DEFAULT 0,
    deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flag_key ON feature_flags (flag_key);

DO $$
BEGIN
  INSERT INTO feature_flags (id, flag_key, name, description, enabled, organization_scoped, created_at)
  VALUES
    (gen_random_uuid(), 'ai_assistant',       'AI-ассистент',             'Встроенный AI-чат и рекомендации',           TRUE,  FALSE, now()),
    (gen_random_uuid(), 'bim_viewer',         'BIM-просмотрщик',         '3D-просмотр BIM-моделей',                    TRUE,  FALSE, now()),
    (gen_random_uuid(), 'mobile_app',         'Мобильное приложение',    'Доступ через мобильное приложение',           FALSE, FALSE, now()),
    (gen_random_uuid(), 'advanced_analytics', 'Продвинутая аналитика',   'Расширенные отчёты и прогнозирование',       FALSE, TRUE,  now()),
    (gen_random_uuid(), 'api_access',         'API-доступ',              'Доступ к REST API для внешних интеграций',    TRUE,  FALSE, now()),
    (gen_random_uuid(), 'custom_workflows',   'Пользовательские процессы', 'Настройка автоматизированных workflow',     FALSE, TRUE,  now())
  ON CONFLICT (flag_key) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
