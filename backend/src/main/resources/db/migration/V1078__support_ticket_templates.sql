CREATE TABLE IF NOT EXISTS ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  default_priority VARCHAR(20) DEFAULT 'MEDIUM',
  body_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_template_org ON ticket_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_template_active ON ticket_templates(is_active) WHERE is_active = TRUE;

-- Seed default templates (wrapped in exception handler for schema compatibility)
DO $$
BEGIN
  INSERT INTO ticket_templates (id, name, description, category, default_priority, body_template, is_active) VALUES
    (gen_random_uuid(), 'Ошибка в системе', 'Сообщить о найденной ошибке', 'TECHNICAL', 'HIGH', 'Описание ошибки:\n\nШаги для воспроизведения:\n1.\n2.\n3.\n\nОжидаемое поведение:\n\nФактическое поведение:', true),
    (gen_random_uuid(), 'Запрос доступа', 'Запросить доступ к модулю или функции', 'ACCESS', 'MEDIUM', 'Модуль/функция:\n\nОбоснование необходимости доступа:', true),
    (gen_random_uuid(), 'Вопрос по работе', 'Задать вопрос по функционалу', 'GENERAL', 'LOW', 'Вопрос:\n\nЧто уже попробовали:', true),
    (gen_random_uuid(), 'Запрос на доработку', 'Предложить улучшение системы', 'FEATURE_REQUEST', 'MEDIUM', 'Описание предложения:\n\nКакую проблему решает:\n\nКак это должно работать:', true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
