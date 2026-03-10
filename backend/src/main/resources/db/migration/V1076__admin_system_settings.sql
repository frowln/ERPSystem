CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'STRING',
  category VARCHAR(50),
  description VARCHAR(500),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_system_setting_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_setting_category ON system_settings(category);

-- Seed default settings (wrapped in exception handler for schema compatibility)
DO $$
BEGIN
  INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, display_name, description) VALUES
    (gen_random_uuid(), 'app.name', 'ПРИВОД', 'STRING', 'GENERAL', 'Название системы', 'Название системы'),
    (gen_random_uuid(), 'app.max_file_size_mb', '50', 'INTEGER', 'GENERAL', 'Макс. размер файла', 'Максимальный размер файла (МБ)'),
    (gen_random_uuid(), 'app.session_timeout_minutes', '480', 'INTEGER', 'SECURITY', 'Таймаут сессии', 'Таймаут сессии (минуты)'),
    (gen_random_uuid(), 'app.password_min_length', '8', 'INTEGER', 'SECURITY', 'Мин. длина пароля', 'Минимальная длина пароля'),
    (gen_random_uuid(), 'app.enable_2fa', 'false', 'BOOLEAN', 'SECURITY', '2FA', 'Обязательная двухфакторная аутентификация'),
    (gen_random_uuid(), 'notifications.email_enabled', 'true', 'BOOLEAN', 'NOTIFICATION', 'Email уведомления', 'Email уведомления'),
    (gen_random_uuid(), 'notifications.push_enabled', 'true', 'BOOLEAN', 'NOTIFICATION', 'Push уведомления', 'Push уведомления'),
    (gen_random_uuid(), 'notifications.digest_frequency', 'daily', 'STRING', 'NOTIFICATION', 'Частота дайджеста', 'Частота дайджеста'),
    (gen_random_uuid(), 'storage.max_total_gb', '100', 'INTEGER', 'GENERAL', 'Лимит хранилища', 'Лимит хранилища (ГБ)'),
    (gen_random_uuid(), 'integrations.1c_enabled', 'false', 'BOOLEAN', 'INTEGRATION', '1С интеграция', 'Интеграция с 1С')
  ON CONFLICT (setting_key) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  -- Table may have different schema from Hibernate, skip seeding
  NULL;
END $$;
