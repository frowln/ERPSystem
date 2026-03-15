-- =============================================================================
-- V1177: Project Templates
-- Pre-built templates for common construction project types.
-- =============================================================================

CREATE TABLE project_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    template_type   VARCHAR(50) NOT NULL,
    stages          JSONB DEFAULT '[]',
    budget_items    JSONB DEFAULT '[]',
    task_templates  JSONB DEFAULT '[]',
    organization_id UUID REFERENCES organizations(id),
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT DEFAULT 0
);

CREATE INDEX idx_project_templates_type ON project_templates(template_type);
CREATE INDEX idx_project_templates_org  ON project_templates(organization_id);

-- Seed default templates (organization_id = NULL means system-wide)
INSERT INTO project_templates (name, description, template_type, stages, budget_items, task_templates) VALUES
(
    'Жилой комплекс',
    'Шаблон для жилищного строительства',
    'RESIDENTIAL',
    '[{"name":"Подготовительный период","order":1},{"name":"Нулевой цикл","order":2},{"name":"Возведение каркаса","order":3},{"name":"Кровля","order":4},{"name":"Инженерные сети","order":5},{"name":"Отделочные работы","order":6},{"name":"Благоустройство","order":7},{"name":"Ввод в эксплуатацию","order":8}]',
    '[{"name":"Проектирование","category":"DESIGN"},{"name":"Земляные работы","category":"CONSTRUCTION"},{"name":"Фундамент","category":"CONSTRUCTION"},{"name":"Каркас","category":"CONSTRUCTION"},{"name":"Кровля","category":"CONSTRUCTION"},{"name":"Фасад","category":"CONSTRUCTION"},{"name":"Инженерные сети","category":"MEP"},{"name":"Отделка","category":"FINISHING"},{"name":"Прочие расходы","category":"OTHER"}]',
    '[{"title":"Получение разрешения на строительство","stage":1},{"title":"Вынос осей в натуру","stage":1},{"title":"Котлован","stage":2},{"title":"Устройство фундамента","stage":2},{"title":"Монтаж каркаса","stage":3},{"title":"Устройство кровли","stage":4},{"title":"Монтаж лифтов","stage":5},{"title":"Отделка МОП","stage":6}]'
),
(
    'Промышленный объект',
    'Шаблон для промышленного строительства',
    'INDUSTRIAL',
    '[{"name":"ПИР","order":1},{"name":"Подготовка территории","order":2},{"name":"Фундаменты и основания","order":3},{"name":"Металлоконструкции","order":4},{"name":"Ограждающие конструкции","order":5},{"name":"Технологическое оборудование","order":6},{"name":"Пусконаладка","order":7}]',
    '[{"name":"ПИР","category":"DESIGN"},{"name":"Земляные работы","category":"CONSTRUCTION"},{"name":"Ж/Б работы","category":"CONSTRUCTION"},{"name":"Металлоконструкции","category":"CONSTRUCTION"},{"name":"Оборудование","category":"EQUIPMENT"},{"name":"Монтаж","category":"MEP"},{"name":"ПНР","category":"COMMISSIONING"}]',
    '[{"title":"Разработка ПД + РД","stage":1},{"title":"Подготовка площадки","stage":2},{"title":"Фундаменты","stage":3},{"title":"Монтаж МК","stage":4},{"title":"Монтаж оборудования","stage":6},{"title":"Пусконаладочные работы","stage":7}]'
),
(
    'Коммерческая недвижимость',
    'Шаблон для коммерческого строительства',
    'COMMERCIAL',
    '[{"name":"Предпроектная подготовка","order":1},{"name":"Проектирование","order":2},{"name":"Строительство","order":3},{"name":"Инженерия","order":4},{"name":"Отделка","order":5},{"name":"Ввод в эксплуатацию","order":6}]',
    '[{"name":"Земельный участок","category":"LAND"},{"name":"Проектирование","category":"DESIGN"},{"name":"СМР","category":"CONSTRUCTION"},{"name":"Инженерные системы","category":"MEP"},{"name":"Отделка","category":"FINISHING"},{"name":"Маркетинг","category":"OTHER"}]',
    '[{"title":"Оформление ЗУ","stage":1},{"title":"Архитектурная концепция","stage":2},{"title":"Рабочая документация","stage":2},{"title":"Общестроительные работы","stage":3},{"title":"Фасадные работы","stage":3},{"title":"Чистовая отделка","stage":5}]'
),
(
    'Инфраструктурный объект',
    'Шаблон для дорог, мостов, инженерных сетей',
    'INFRASTRUCTURE',
    '[{"name":"Изыскания","order":1},{"name":"Проектирование","order":2},{"name":"Подготовка территории","order":3},{"name":"Основные работы","order":4},{"name":"Благоустройство","order":5},{"name":"Приёмка","order":6}]',
    '[{"name":"Изыскания","category":"DESIGN"},{"name":"ПД + РД","category":"DESIGN"},{"name":"Земляные работы","category":"CONSTRUCTION"},{"name":"Дорожное покрытие","category":"CONSTRUCTION"},{"name":"Инженерные сети","category":"MEP"},{"name":"Благоустройство","category":"FINISHING"}]',
    '[{"title":"Инженерные изыскания","stage":1},{"title":"Проектная документация","stage":2},{"title":"Снос и демонтаж","stage":3},{"title":"Земляные работы","stage":4},{"title":"Устройство основания","stage":4},{"title":"Приёмочная комиссия","stage":6}]'
),
(
    'Капитальный ремонт',
    'Шаблон для капитального ремонта зданий',
    'RENOVATION',
    '[{"name":"Обследование","order":1},{"name":"Проектирование","order":2},{"name":"Демонтаж","order":3},{"name":"Усиление конструкций","order":4},{"name":"Новые конструкции","order":5},{"name":"Отделка","order":6},{"name":"Сдача","order":7}]',
    '[{"name":"Обследование","category":"DESIGN"},{"name":"Проектирование","category":"DESIGN"},{"name":"Демонтаж","category":"CONSTRUCTION"},{"name":"СМР","category":"CONSTRUCTION"},{"name":"Отделка","category":"FINISHING"},{"name":"Прочее","category":"OTHER"}]',
    '[{"title":"Техническое обследование","stage":1},{"title":"Проект ремонта","stage":2},{"title":"Демонтажные работы","stage":3},{"title":"Усиление фундамента","stage":4},{"title":"Замена перекрытий","stage":5},{"title":"Финишная отделка","stage":6}]'
);
