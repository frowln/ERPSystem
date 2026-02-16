-- =============================================================================
-- V21: Settings / Administration module tables
-- =============================================================================

-- =============================================================================
-- System Settings
-- =============================================================================
CREATE TABLE system_settings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key         VARCHAR(255) NOT NULL,
    setting_value       TEXT,
    setting_type        VARCHAR(30) NOT NULL DEFAULT 'STRING',
    category            VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    display_name        VARCHAR(500) NOT NULL,
    description         TEXT,
    is_editable         BOOLEAN NOT NULL DEFAULT TRUE,
    is_encrypted        BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_system_setting_key UNIQUE (setting_key),
    CONSTRAINT chk_setting_type CHECK (setting_type IN (
        'STRING', 'INTEGER', 'BOOLEAN', 'JSON', 'SECRET'
    )),
    CONSTRAINT chk_setting_category CHECK (category IN (
        'GENERAL', 'EMAIL', 'SECURITY', 'INTEGRATION', 'NOTIFICATION', 'BACKUP'
    ))
);

CREATE INDEX IF NOT EXISTS idx_system_setting_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_setting_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_setting_active ON system_settings(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed system settings
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, display_name, description, is_editable, is_encrypted) VALUES
    (uuid_generate_v4(), 'company_name', 'ООО ПРИВОД', 'STRING', 'GENERAL', 'Название компании', 'Юридическое название организации', TRUE, FALSE),
    (uuid_generate_v4(), 'company_inn', '', 'STRING', 'GENERAL', 'ИНН компании', 'Идентификационный номер налогоплательщика', TRUE, FALSE),
    (uuid_generate_v4(), 'company_kpp', '', 'STRING', 'GENERAL', 'КПП компании', 'Код причины постановки на учёт', TRUE, FALSE),
    (uuid_generate_v4(), 'company_ogrn', '', 'STRING', 'GENERAL', 'ОГРН компании', 'Основной государственный регистрационный номер', TRUE, FALSE),
    (uuid_generate_v4(), 'company_address', '', 'STRING', 'GENERAL', 'Юридический адрес', 'Юридический адрес организации', TRUE, FALSE),
    (uuid_generate_v4(), 'company_phone', '', 'STRING', 'GENERAL', 'Телефон компании', 'Основной контактный телефон', TRUE, FALSE),
    (uuid_generate_v4(), 'company_email', '', 'STRING', 'GENERAL', 'Email компании', 'Основной email организации', TRUE, FALSE),
    (uuid_generate_v4(), 'company_logo_url', '', 'STRING', 'GENERAL', 'URL логотипа', 'Ссылка на логотип компании', TRUE, FALSE),
    (uuid_generate_v4(), 'default_currency', 'RUB', 'STRING', 'GENERAL', 'Валюта по умолчанию', 'Валюта, используемая по умолчанию в системе', TRUE, FALSE),
    (uuid_generate_v4(), 'default_language', 'ru', 'STRING', 'GENERAL', 'Язык по умолчанию', 'Язык интерфейса по умолчанию', TRUE, FALSE),
    (uuid_generate_v4(), 'default_timezone', 'Europe/Moscow', 'STRING', 'GENERAL', 'Часовой пояс', 'Часовой пояс по умолчанию', TRUE, FALSE),
    (uuid_generate_v4(), 'session_timeout_minutes', '30', 'INTEGER', 'SECURITY', 'Тайм-аут сессии (мин)', 'Время бездействия до автоматического выхода', TRUE, FALSE),
    (uuid_generate_v4(), 'max_login_attempts', '5', 'INTEGER', 'SECURITY', 'Макс. попыток входа', 'Максимальное количество неудачных попыток входа до блокировки', TRUE, FALSE),
    (uuid_generate_v4(), 'password_min_length', '8', 'INTEGER', 'SECURITY', 'Мин. длина пароля', 'Минимальная длина пароля пользователя', TRUE, FALSE),
    (uuid_generate_v4(), 'require_2fa', 'false', 'BOOLEAN', 'SECURITY', 'Требовать 2FA', 'Обязательная двухфакторная аутентификация', TRUE, FALSE),
    (uuid_generate_v4(), 'smtp_host', '', 'STRING', 'EMAIL', 'SMTP сервер', 'Адрес SMTP сервера для отправки писем', TRUE, FALSE),
    (uuid_generate_v4(), 'smtp_port', '587', 'INTEGER', 'EMAIL', 'Порт SMTP', 'Порт SMTP сервера', TRUE, FALSE),
    (uuid_generate_v4(), 'smtp_username', '', 'STRING', 'EMAIL', 'Логин SMTP', 'Имя пользователя для SMTP аутентификации', TRUE, FALSE),
    (uuid_generate_v4(), 'smtp_password', '', 'SECRET', 'EMAIL', 'Пароль SMTP', 'Пароль для SMTP аутентификации', TRUE, TRUE),
    (uuid_generate_v4(), 'smtp_from_email', 'noreply@privod.ru', 'STRING', 'EMAIL', 'Email отправителя', 'Адрес отправителя исходящих писем', TRUE, FALSE),
    (uuid_generate_v4(), 'smtp_use_tls', 'true', 'BOOLEAN', 'EMAIL', 'Использовать TLS', 'Шифрование TLS для SMTP соединения', TRUE, FALSE),
    (uuid_generate_v4(), 'telegram_bot_token', '', 'SECRET', 'INTEGRATION', 'Токен Telegram-бота', 'API токен Telegram-бота для уведомлений', TRUE, TRUE),
    (uuid_generate_v4(), 'telegram_chat_id', '', 'STRING', 'INTEGRATION', 'Chat ID Telegram', 'Идентификатор чата для уведомлений Telegram', TRUE, FALSE),
    (uuid_generate_v4(), 'backup_enabled', 'true', 'BOOLEAN', 'BACKUP', 'Резервное копирование', 'Включить автоматическое резервное копирование', TRUE, FALSE),
    (uuid_generate_v4(), 'backup_schedule', '0 2 * * *', 'STRING', 'BACKUP', 'Расписание бэкапа', 'Cron-выражение расписания резервного копирования', TRUE, FALSE),
    (uuid_generate_v4(), 'backup_retention_days', '30', 'INTEGER', 'BACKUP', 'Хранение бэкапов (дни)', 'Количество дней хранения резервных копий', TRUE, FALSE);

-- =============================================================================
-- Email Templates
-- =============================================================================
CREATE TABLE email_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(100) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    subject             VARCHAR(500) NOT NULL,
    body_html           TEXT,
    body_text           TEXT,
    category            VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    variables           JSONB DEFAULT '[]'::jsonb,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_email_template_code UNIQUE (code),
    CONSTRAINT chk_email_template_category CHECK (category IN (
        'WORKFLOW', 'NOTIFICATION', 'REPORT', 'SYSTEM'
    ))
);

CREATE INDEX IF NOT EXISTS idx_email_template_code ON email_templates(code);
CREATE INDEX IF NOT EXISTS idx_email_template_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_template_active ON email_templates(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed email templates
INSERT INTO email_templates (id, code, name, subject, body_html, body_text, category, variables) VALUES
    (uuid_generate_v4(), 'contract_approval', 'Согласование договора', 'Договор {{contract_number}} требует согласования',
     '<h2>Согласование договора</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Договор <b>{{contract_number}}</b> &mdash; &laquo;{{contract_name}}&raquo; направлен на согласование.</p><p>Сумма: {{contract_amount}} руб.</p><p><a href="{{link}}">Перейти к договору</a></p>',
     'Договор {{contract_number}} — «{{contract_name}}» направлен на согласование. Сумма: {{contract_amount}} руб.',
     'WORKFLOW', '["recipient_name","contract_number","contract_name","contract_amount","link"]'::jsonb),

    (uuid_generate_v4(), 'task_assigned', 'Назначение задачи', 'Вам назначена задача: {{task_title}}',
     '<h2>Новая задача</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Вам назначена задача: <b>{{task_title}}</b></p><p>Проект: {{project_name}}</p><p>Срок: {{due_date}}</p><p><a href="{{link}}">Перейти к задаче</a></p>',
     'Вам назначена задача: {{task_title}}. Проект: {{project_name}}. Срок: {{due_date}}.',
     'WORKFLOW', '["recipient_name","task_title","project_name","due_date","link"]'::jsonb),

    (uuid_generate_v4(), 'task_completed', 'Задача выполнена', 'Задача {{task_title}} выполнена',
     '<h2>Задача выполнена</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Задача <b>{{task_title}}</b> выполнена пользователем {{completed_by}}.</p><p>Проект: {{project_name}}</p><p><a href="{{link}}">Перейти к задаче</a></p>',
     'Задача {{task_title}} выполнена пользователем {{completed_by}}. Проект: {{project_name}}.',
     'WORKFLOW', '["recipient_name","task_title","completed_by","project_name","link"]'::jsonb),

    (uuid_generate_v4(), 'incident_reported', 'Происшествие зарегистрировано', 'Зарегистрировано происшествие: {{incident_title}}',
     '<h2>Происшествие</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Зарегистрировано происшествие: <b>{{incident_title}}</b></p><p>Объект: {{project_name}}</p><p>Серьёзность: {{severity}}</p><p><a href="{{link}}">Подробнее</a></p>',
     'Зарегистрировано происшествие: {{incident_title}}. Объект: {{project_name}}. Серьёзность: {{severity}}.',
     'NOTIFICATION', '["recipient_name","incident_title","project_name","severity","link"]'::jsonb),

    (uuid_generate_v4(), 'inspection_scheduled', 'Запланирована проверка', 'Запланирована проверка: {{inspection_title}}',
     '<h2>Проверка</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Запланирована проверка: <b>{{inspection_title}}</b></p><p>Дата: {{inspection_date}}</p><p>Объект: {{project_name}}</p><p><a href="{{link}}">Подробнее</a></p>',
     'Запланирована проверка: {{inspection_title}}. Дата: {{inspection_date}}. Объект: {{project_name}}.',
     'NOTIFICATION', '["recipient_name","inspection_title","inspection_date","project_name","link"]'::jsonb),

    (uuid_generate_v4(), 'document_shared', 'Документ предоставлен', 'Документ «{{document_title}}» предоставлен вам',
     '<h2>Доступ к документу</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Вам предоставлен доступ к документу: <b>{{document_title}}</b></p><p>Предоставил: {{shared_by}}</p><p><a href="{{link}}">Открыть документ</a></p>',
     'Вам предоставлен доступ к документу: {{document_title}}. Предоставил: {{shared_by}}.',
     'NOTIFICATION', '["recipient_name","document_title","shared_by","link"]'::jsonb),

    (uuid_generate_v4(), 'password_reset', 'Сброс пароля', 'Запрос на сброс пароля',
     '<h2>Сброс пароля</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Получен запрос на сброс пароля вашей учётной записи.</p><p>Для сброса пароля перейдите по ссылке: <a href="{{reset_link}}">Сбросить пароль</a></p><p>Ссылка действительна в течение {{expiry_minutes}} минут.</p><p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>',
     'Для сброса пароля перейдите по ссылке: {{reset_link}}. Ссылка действительна {{expiry_minutes}} минут.',
     'SYSTEM', '["recipient_name","reset_link","expiry_minutes"]'::jsonb),

    (uuid_generate_v4(), 'welcome_email', 'Добро пожаловать', 'Добро пожаловать в ПРИВОД',
     '<h2>Добро пожаловать!</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Ваша учётная запись в системе ПРИВОД создана.</p><p>Логин: {{login}}</p><p>Временный пароль: {{temp_password}}</p><p><a href="{{link}}">Войти в систему</a></p><p>Пожалуйста, смените пароль при первом входе.</p>',
     'Ваша учётная запись создана. Логин: {{login}}. Временный пароль: {{temp_password}}. Ссылка: {{link}}',
     'SYSTEM', '["recipient_name","login","temp_password","link"]'::jsonb),

    (uuid_generate_v4(), 'daily_digest', 'Ежедневный дайджест', 'Ежедневный дайджест ПРИВОД за {{date}}',
     '<h2>Дайджест за {{date}}</h2><p>Уважаемый(ая) {{recipient_name}},</p><p>Задачи на сегодня: {{tasks_count}}</p><p>Просроченные задачи: {{overdue_count}}</p><p>Уведомления: {{notifications_count}}</p><p><a href="{{link}}">Перейти в систему</a></p>',
     'Дайджест за {{date}}. Задачи на сегодня: {{tasks_count}}. Просроченные: {{overdue_count}}.',
     'REPORT', '["recipient_name","date","tasks_count","overdue_count","notifications_count","link"]'::jsonb);

-- =============================================================================
-- Number Sequences
-- =============================================================================
CREATE TABLE number_sequences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    prefix              VARCHAR(20),
    suffix              VARCHAR(20),
    next_number         BIGINT NOT NULL DEFAULT 1,
    step                INTEGER NOT NULL DEFAULT 1,
    padding             INTEGER NOT NULL DEFAULT 5,
    reset_period        VARCHAR(20) NOT NULL DEFAULT 'NEVER',
    last_reset_date     DATE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_number_sequence_code UNIQUE (code),
    CONSTRAINT chk_sequence_step CHECK (step >= 1),
    CONSTRAINT chk_sequence_padding CHECK (padding >= 1 AND padding <= 20),
    CONSTRAINT chk_sequence_next CHECK (next_number >= 1),
    CONSTRAINT chk_sequence_reset_period CHECK (reset_period IN ('NEVER', 'YEARLY', 'MONTHLY'))
);

CREATE INDEX IF NOT EXISTS idx_number_sequence_code ON number_sequences(code);

CREATE TRIGGER update_number_sequences_updated_at
    BEFORE UPDATE ON number_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed number sequences
INSERT INTO number_sequences (id, code, name, prefix, suffix, next_number, step, padding, reset_period) VALUES
    (uuid_generate_v4(), 'PRJ', 'Проекты', 'PRJ-', NULL, 1, 1, 5, 'NEVER'),
    (uuid_generate_v4(), 'CTR', 'Договоры', 'CTR-', NULL, 1, 1, 5, 'YEARLY'),
    (uuid_generate_v4(), 'TASK', 'Задачи', 'TASK-', NULL, 1, 1, 6, 'NEVER'),
    (uuid_generate_v4(), 'INV', 'Счета', 'INV-', NULL, 1, 1, 6, 'YEARLY'),
    (uuid_generate_v4(), 'PAY', 'Платежи', 'PAY-', NULL, 1, 1, 6, 'YEARLY'),
    (uuid_generate_v4(), 'MOV', 'Перемещения', 'MOV-', NULL, 1, 1, 6, 'MONTHLY'),
    (uuid_generate_v4(), 'EMP', 'Сотрудники', 'EMP-', NULL, 1, 1, 5, 'NEVER'),
    (uuid_generate_v4(), 'INC', 'Происшествия', 'INC-', NULL, 1, 1, 5, 'YEARLY'),
    (uuid_generate_v4(), 'DOC', 'Документы', 'DOC-', NULL, 1, 1, 6, 'NEVER');

-- =============================================================================
-- Integration Configs
-- =============================================================================
CREATE TABLE integration_configs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(100) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    integration_type    VARCHAR(30) NOT NULL,
    base_url            VARCHAR(1000),
    api_key             TEXT,
    api_secret          TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_at        TIMESTAMP WITH TIME ZONE,
    sync_status         VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    config_json         JSONB DEFAULT '{}'::jsonb,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_integration_config_code UNIQUE (code),
    CONSTRAINT chk_integration_type CHECK (integration_type IN (
        'REST_API', 'WEBHOOK', 'FILE_IMPORT', 'OAUTH2'
    )),
    CONSTRAINT chk_sync_status CHECK (sync_status IN ('IDLE', 'SYNCING', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_integration_config_code ON integration_configs(code);
CREATE INDEX IF NOT EXISTS idx_integration_config_active ON integration_configs(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_integration_configs_updated_at
    BEFORE UPDATE ON integration_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed integration configs
INSERT INTO integration_configs (id, code, name, integration_type, base_url, is_active, config_json) VALUES
    (uuid_generate_v4(), '1c_integration', 'Интеграция с 1С', 'REST_API', '', FALSE, '{"version": "8.3", "exchange_format": "JSON"}'::jsonb),
    (uuid_generate_v4(), 'bank_api', 'Банковский API', 'REST_API', '', FALSE, '{"bank_name": "", "bik": ""}'::jsonb),
    (uuid_generate_v4(), 'sbis', 'СБИС', 'REST_API', 'https://online.sbis.ru/service/', FALSE, '{"app_client_id": "", "app_secret": ""}'::jsonb),
    (uuid_generate_v4(), 'edo_provider', 'Провайдер ЭДО', 'REST_API', '', FALSE, '{"provider": "Диадок", "box_id": ""}'::jsonb),
    (uuid_generate_v4(), 'telegram_bot', 'Telegram-бот', 'WEBHOOK', 'https://api.telegram.org', FALSE, '{"webhook_url": "", "allowed_updates": ["message","callback_query"]}'::jsonb);

-- =============================================================================
-- Notification Settings (per user)
-- =============================================================================
CREATE TABLE notification_settings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    notification_type   VARCHAR(30) NOT NULL,
    event_type          VARCHAR(50) NOT NULL,
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_notification_setting UNIQUE (user_id, notification_type, event_type),
    CONSTRAINT chk_notification_type CHECK (notification_type IN (
        'EMAIL', 'PUSH', 'TELEGRAM', 'IN_APP'
    )),
    CONSTRAINT chk_event_type CHECK (event_type IN (
        'TASK_ASSIGNED', 'TASK_COMPLETED', 'CONTRACT_APPROVED', 'CONTRACT_REJECTED',
        'INCIDENT_REPORTED', 'DOCUMENT_SHARED', 'DAILY_DIGEST', 'INSPECTION_SCHEDULED',
        'PAYMENT_RECEIVED', 'BUDGET_EXCEEDED', 'DEADLINE_APPROACHING'
    ))
);

CREATE INDEX IF NOT EXISTS idx_notification_setting_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_setting_type ON notification_settings(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_setting_event ON notification_settings(event_type);

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Audit Settings (per model)
-- =============================================================================
CREATE TABLE audit_settings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name          VARCHAR(255) NOT NULL,
    track_create        BOOLEAN NOT NULL DEFAULT TRUE,
    track_update        BOOLEAN NOT NULL DEFAULT TRUE,
    track_delete        BOOLEAN NOT NULL DEFAULT TRUE,
    track_read          BOOLEAN NOT NULL DEFAULT FALSE,
    retention_days      INTEGER NOT NULL DEFAULT 365,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_audit_setting_model UNIQUE (model_name),
    CONSTRAINT chk_retention_days CHECK (retention_days >= 1)
);

CREATE INDEX IF NOT EXISTS idx_audit_setting_model ON audit_settings(model_name);
CREATE INDEX IF NOT EXISTS idx_audit_setting_active ON audit_settings(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_audit_settings_updated_at
    BEFORE UPDATE ON audit_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default audit settings for core models
INSERT INTO audit_settings (id, model_name, track_create, track_update, track_delete, track_read, retention_days, is_active) VALUES
    (uuid_generate_v4(), 'Contract', TRUE, TRUE, TRUE, FALSE, 730, TRUE),
    (uuid_generate_v4(), 'Project', TRUE, TRUE, TRUE, FALSE, 730, TRUE),
    (uuid_generate_v4(), 'Task', TRUE, TRUE, TRUE, FALSE, 365, TRUE),
    (uuid_generate_v4(), 'Document', TRUE, TRUE, TRUE, TRUE, 365, TRUE),
    (uuid_generate_v4(), 'Employee', TRUE, TRUE, TRUE, FALSE, 730, TRUE),
    (uuid_generate_v4(), 'Invoice', TRUE, TRUE, TRUE, FALSE, 1095, TRUE),
    (uuid_generate_v4(), 'Payment', TRUE, TRUE, TRUE, FALSE, 1095, TRUE),
    (uuid_generate_v4(), 'StockMovement', TRUE, TRUE, TRUE, FALSE, 365, TRUE),
    (uuid_generate_v4(), 'SafetyIncident', TRUE, TRUE, TRUE, TRUE, 1095, TRUE),
    (uuid_generate_v4(), 'User', TRUE, TRUE, TRUE, FALSE, 730, TRUE);
