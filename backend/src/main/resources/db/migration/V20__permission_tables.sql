-- =============================================================================
-- V20: Advanced RBAC/ACL Permission System (Odoo-style)
-- =============================================================================

-- =============================================================================
-- Permission Groups (аналог res.groups в Odoo)
-- =============================================================================
CREATE TABLE permission_groups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    display_name    VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(100) NOT NULL,
    parent_group_id UUID REFERENCES permission_groups(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sequence        INTEGER NOT NULL DEFAULT 10,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pg_name ON permission_groups(name);
CREATE INDEX IF NOT EXISTS idx_pg_category ON permission_groups(category);
CREATE INDEX IF NOT EXISTS idx_pg_parent ON permission_groups(parent_group_id);
CREATE INDEX IF NOT EXISTS idx_pg_active ON permission_groups(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pg_sequence ON permission_groups(sequence);

CREATE TRIGGER update_permission_groups_updated_at
    BEFORE UPDATE ON permission_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Model Access Rules (аналог ir.model.access в Odoo)
-- =============================================================================
CREATE TABLE model_access_rules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name  VARCHAR(100) NOT NULL,
    group_id    UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
    can_read    BOOLEAN NOT NULL DEFAULT FALSE,
    can_create  BOOLEAN NOT NULL DEFAULT FALSE,
    can_update  BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_model_access_model_group UNIQUE (model_name, group_id)
);

CREATE INDEX IF NOT EXISTS idx_mar_model ON model_access_rules(model_name);
CREATE INDEX IF NOT EXISTS idx_mar_group ON model_access_rules(group_id);

CREATE TRIGGER update_model_access_rules_updated_at
    BEFORE UPDATE ON model_access_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Record Rules (аналог ir.rule в Odoo)
-- =============================================================================
CREATE TABLE record_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    group_id        UUID REFERENCES permission_groups(id) ON DELETE CASCADE,
    domain_filter   JSONB NOT NULL DEFAULT '{}',
    perm_read       BOOLEAN NOT NULL DEFAULT TRUE,
    perm_write      BOOLEAN NOT NULL DEFAULT FALSE,
    perm_create     BOOLEAN NOT NULL DEFAULT FALSE,
    perm_unlink     BOOLEAN NOT NULL DEFAULT FALSE,
    is_global       BOOLEAN NOT NULL DEFAULT FALSE,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rr_model ON record_rules(model_name);
CREATE INDEX IF NOT EXISTS idx_rr_group ON record_rules(group_id);
CREATE INDEX IF NOT EXISTS idx_rr_global ON record_rules(is_global) WHERE is_global = TRUE;

CREATE TRIGGER update_record_rules_updated_at
    BEFORE UPDATE ON record_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Field Access Rules (доступ к полям модели)
-- =============================================================================
CREATE TABLE field_access_rules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name  VARCHAR(100) NOT NULL,
    field_name  VARCHAR(100) NOT NULL,
    group_id    UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
    can_read    BOOLEAN NOT NULL DEFAULT TRUE,
    can_write   BOOLEAN NOT NULL DEFAULT FALSE,
    deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_field_access UNIQUE (model_name, field_name, group_id)
);

CREATE INDEX IF NOT EXISTS idx_far_model ON field_access_rules(model_name);
CREATE INDEX IF NOT EXISTS idx_far_group ON field_access_rules(group_id);
CREATE INDEX IF NOT EXISTS idx_far_model_field ON field_access_rules(model_name, field_name);

CREATE TRIGGER update_field_access_rules_updated_at
    BEFORE UPDATE ON field_access_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- User Groups (связь пользователей с группами доступа)
-- =============================================================================
CREATE TABLE user_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id    UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
    deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_user_group UNIQUE (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_ug_user ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_ug_group ON user_groups(group_id);

CREATE TRIGGER update_user_groups_updated_at
    BEFORE UPDATE ON user_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Permission Audit Log (журнал изменений прав доступа)
-- =============================================================================
CREATE TABLE permission_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    action          VARCHAR(20) NOT NULL,
    target_user_id  UUID REFERENCES users(id),
    group_id        UUID REFERENCES permission_groups(id),
    details         JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_pal_action CHECK (action IN ('GRANT', 'REVOKE', 'CREATE_GROUP', 'UPDATE_GROUP', 'DELETE_GROUP',
        'SET_MODEL_ACCESS', 'CREATE_RULE', 'UPDATE_RULE', 'DELETE_RULE',
        'SET_FIELD_ACCESS', 'BULK_ASSIGN', 'BULK_REVOKE'))
);

CREATE INDEX IF NOT EXISTS idx_pal_user ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pal_target ON permission_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_pal_group ON permission_audit_log(group_id);
CREATE INDEX IF NOT EXISTS idx_pal_action ON permission_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_pal_created ON permission_audit_log(created_at);

-- =============================================================================
-- Seed Permission Groups
-- =============================================================================
INSERT INTO permission_groups (id, name, display_name, description, category, parent_group_id, is_active, sequence) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'base_user',        'Базовый пользователь',     'Базовые права доступа для всех пользователей системы',           'Общие',         NULL, TRUE, 10),
    ('a0000000-0000-0000-0000-000000000002', 'project_manager',  'Менеджер проектов',         'Управление проектами, контрактами и сметами',                    'Проекты',       'a0000000-0000-0000-0000-000000000001', TRUE, 20),
    ('a0000000-0000-0000-0000-000000000003', 'director',         'Руководитель',              'Полный доступ к проектам и финансам, одобрение документов',       'Управление',    'a0000000-0000-0000-0000-000000000002', TRUE, 30),
    ('a0000000-0000-0000-0000-000000000004', 'accountant',       'Бухгалтер',                 'Финансовые операции, закрывающие документы, учёт',                'Финансы',       'a0000000-0000-0000-0000-000000000001', TRUE, 40),
    ('a0000000-0000-0000-0000-000000000005', 'warehouse_keeper', 'Кладовщик',                 'Управление складом, приёмка и выдача материалов',                'Склад',         'a0000000-0000-0000-0000-000000000001', TRUE, 50),
    ('a0000000-0000-0000-0000-000000000006', 'safety_officer',   'Инженер ОТ',                'Охрана труда, техника безопасности, инструктажи',                'Безопасность',  'a0000000-0000-0000-0000-000000000001', TRUE, 60),
    ('a0000000-0000-0000-0000-000000000007', 'hr_manager',       'HR-менеджер',               'Управление персоналом, табели, кадровый учёт',                   'Персонал',      'a0000000-0000-0000-0000-000000000001', TRUE, 70),
    ('a0000000-0000-0000-0000-000000000008', 'administrator',    'Администратор',             'Полный доступ ко всем модулям системы и настройкам',             'Администрирование', 'a0000000-0000-0000-0000-000000000003', TRUE, 100);

-- =============================================================================
-- Seed Model Access Rules
-- =============================================================================

-- Базовый пользователь: чтение основных моделей
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('project',        'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('contract',       'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('task',           'a0000000-0000-0000-0000-000000000001', TRUE,  TRUE,  TRUE,  FALSE),
    ('document',       'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('organization',   'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('specification',  'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('estimate',       'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('warehouse',      'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('employee',       'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('finance',        'a0000000-0000-0000-0000-000000000001', FALSE, FALSE, FALSE, FALSE),
    ('procurement',    'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('closing_doc',    'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('plan_fact',      'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('safety',         'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('m29',            'a0000000-0000-0000-0000-000000000001', TRUE,  FALSE, FALSE, FALSE),
    ('hr',             'a0000000-0000-0000-0000-000000000001', FALSE, FALSE, FALSE, FALSE);

-- Менеджер проектов: CRUD на проекты, контракты, сметы, задачи
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('project',        'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('contract',       'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('task',           'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  TRUE),
    ('document',       'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('specification',  'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('estimate',       'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('procurement',    'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('closing_doc',    'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('plan_fact',      'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE),
    ('m29',            'a0000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  FALSE);

-- Руководитель: всё как у менеджера + удаление + финансы
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('project',        'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE,  TRUE,  TRUE),
    ('contract',       'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE,  TRUE,  TRUE),
    ('finance',        'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE,  TRUE,  FALSE),
    ('organization',   'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE,  TRUE,  FALSE),
    ('employee',       'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE,  TRUE,  FALSE);

-- Бухгалтер: финансы, закрывающие документы
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('finance',        'a0000000-0000-0000-0000-000000000004', TRUE,  TRUE,  TRUE,  FALSE),
    ('closing_doc',    'a0000000-0000-0000-0000-000000000004', TRUE,  TRUE,  TRUE,  FALSE),
    ('contract',       'a0000000-0000-0000-0000-000000000004', TRUE,  FALSE, TRUE,  FALSE),
    ('estimate',       'a0000000-0000-0000-0000-000000000004', TRUE,  FALSE, FALSE, FALSE),
    ('plan_fact',      'a0000000-0000-0000-0000-000000000004', TRUE,  TRUE,  TRUE,  FALSE);

-- Кладовщик: склад, снабжение, М-29
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('warehouse',      'a0000000-0000-0000-0000-000000000005', TRUE,  TRUE,  TRUE,  TRUE),
    ('procurement',    'a0000000-0000-0000-0000-000000000005', TRUE,  TRUE,  TRUE,  FALSE),
    ('m29',            'a0000000-0000-0000-0000-000000000005', TRUE,  TRUE,  TRUE,  FALSE);

-- Инженер ОТ: безопасность, документы
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('safety',         'a0000000-0000-0000-0000-000000000006', TRUE,  TRUE,  TRUE,  TRUE),
    ('document',       'a0000000-0000-0000-0000-000000000006', TRUE,  TRUE,  TRUE,  FALSE),
    ('employee',       'a0000000-0000-0000-0000-000000000006', TRUE,  FALSE, FALSE, FALSE);

-- HR-менеджер: персонал, табели
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('hr',             'a0000000-0000-0000-0000-000000000007', TRUE,  TRUE,  TRUE,  TRUE),
    ('employee',       'a0000000-0000-0000-0000-000000000007', TRUE,  TRUE,  TRUE,  TRUE);

-- Администратор: полный доступ ко всем моделям
INSERT INTO model_access_rules (model_name, group_id, can_read, can_create, can_update, can_delete) VALUES
    ('project',        'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('contract',       'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('task',           'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('document',       'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('organization',   'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('specification',  'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('estimate',       'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('warehouse',      'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('employee',       'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('finance',        'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('procurement',    'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('closing_doc',    'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('plan_fact',      'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('safety',         'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('m29',            'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE),
    ('hr',             'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE,  TRUE,  TRUE);

-- =============================================================================
-- Seed Record Rules
-- =============================================================================

-- Базовый пользователь: видит только свои проекты (где он участник или создатель)
INSERT INTO record_rules (name, model_name, group_id, domain_filter, perm_read, perm_write, perm_create, perm_unlink, is_global) VALUES
    ('Видеть только свои проекты',
     'project', 'a0000000-0000-0000-0000-000000000001',
     '{"field": "createdBy", "op": "=", "value": "$currentUser"}',
     TRUE, FALSE, FALSE, FALSE, FALSE);

-- Базовый пользователь: видит только свои задачи
INSERT INTO record_rules (name, model_name, group_id, domain_filter, perm_read, perm_write, perm_create, perm_unlink, is_global) VALUES
    ('Видеть только свои задачи',
     'task', 'a0000000-0000-0000-0000-000000000001',
     '{"field": "assigneeId", "op": "=", "value": "$currentUser"}',
     TRUE, TRUE, TRUE, FALSE, FALSE);

-- Менеджер проектов: видит проекты своего подразделения
INSERT INTO record_rules (name, model_name, group_id, domain_filter, perm_read, perm_write, perm_create, perm_unlink, is_global) VALUES
    ('Проекты подразделения',
     'project', 'a0000000-0000-0000-0000-000000000002',
     '{"field": "organizationId", "op": "=", "value": "$currentUserOrganization"}',
     TRUE, TRUE, TRUE, FALSE, FALSE);

-- Руководитель: видит все проекты
INSERT INTO record_rules (name, model_name, group_id, domain_filter, perm_read, perm_write, perm_create, perm_unlink, is_global) VALUES
    ('Все проекты',
     'project', 'a0000000-0000-0000-0000-000000000003',
     '{"field": "id", "op": "!=", "value": null}',
     TRUE, TRUE, TRUE, TRUE, FALSE);

-- Администратор: видит все записи (глобальное правило)
INSERT INTO record_rules (name, model_name, group_id, domain_filter, perm_read, perm_write, perm_create, perm_unlink, is_global) VALUES
    ('Полный доступ администратора',
     'project', 'a0000000-0000-0000-0000-000000000008',
     '{"field": "id", "op": "!=", "value": null}',
     TRUE, TRUE, TRUE, TRUE, TRUE);

-- =============================================================================
-- Seed Field Access Rules
-- =============================================================================

-- Финансовые поля проектов доступны только бухгалтеру и руководителю
INSERT INTO field_access_rules (model_name, field_name, group_id, can_read, can_write) VALUES
    ('project', 'budgetAmount',   'a0000000-0000-0000-0000-000000000001', FALSE, FALSE),
    ('project', 'contractAmount', 'a0000000-0000-0000-0000-000000000001', FALSE, FALSE),
    ('project', 'budgetAmount',   'a0000000-0000-0000-0000-000000000004', TRUE,  TRUE),
    ('project', 'contractAmount', 'a0000000-0000-0000-0000-000000000004', TRUE,  TRUE),
    ('project', 'budgetAmount',   'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE),
    ('project', 'contractAmount', 'a0000000-0000-0000-0000-000000000003', TRUE,  TRUE),
    ('project', 'budgetAmount',   'a0000000-0000-0000-0000-000000000002', TRUE,  FALSE),
    ('project', 'contractAmount', 'a0000000-0000-0000-0000-000000000002', TRUE,  FALSE);

-- Зарплатные поля доступны только HR и руководителю
INSERT INTO field_access_rules (model_name, field_name, group_id, can_read, can_write) VALUES
    ('employee', 'salary',    'a0000000-0000-0000-0000-000000000001', FALSE, FALSE),
    ('employee', 'salary',    'a0000000-0000-0000-0000-000000000007', TRUE,  TRUE),
    ('employee', 'salary',    'a0000000-0000-0000-0000-000000000003', TRUE,  FALSE),
    ('employee', 'salary',    'a0000000-0000-0000-0000-000000000008', TRUE,  TRUE);

-- Назначить admin-пользователя в группу "Администратор"
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, 'a0000000-0000-0000-0000-000000000008'
FROM users u
WHERE u.email = 'admin@privod.ru';
