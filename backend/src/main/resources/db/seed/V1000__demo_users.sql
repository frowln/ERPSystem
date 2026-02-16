-- =============================================================================
-- V1000: Демо-пользователи для тестовой среды
-- Пароль для всех пользователей: demo123
-- BCrypt hash: $2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi
-- =============================================================================

BEGIN;

-- =============================================================================
-- Демо-пользователи
-- Каждый пользователь имеет определённую роль в строительной компании
-- =============================================================================

-- Иванов И.И. — Генеральный директор (admin)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'ivanov@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Игорь',
    'Иванов',
    '+7 (495) 123-45-01',
    'Генеральный директор',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Петров П.П. — Руководитель проекта (project_manager)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'petrov@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Павел',
    'Петров',
    '+7 (495) 123-45-02',
    'Руководитель проекта',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Сидоров С.С. — Прораб (foreman)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'sidorov@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Сергей',
    'Сидоров',
    '+7 (495) 123-45-03',
    'Прораб',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Козлова К.К. — Финансовый директор (finance_manager / accountant)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'kozlova@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Ксения',
    'Козлова',
    '+7 (495) 123-45-04',
    'Финансовый директор',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Новикова Н.Н. — Инженер ПТО (pto_engineer / engineer)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'novikova@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Наталья',
    'Новикова',
    '+7 (495) 123-45-05',
    'Инженер ПТО',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Волков В.В. — Начальник снабжения (procurement_manager / supply_manager)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'volkov@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Виктор',
    'Волков',
    '+7 (495) 123-45-06',
    'Начальник снабжения',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Морозова М.М. — Специалист по ОТ (safety_specialist / safety_officer)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'morozova@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Мария',
    'Морозова',
    '+7 (495) 123-45-07',
    'Специалист по охране труда',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- Соколов А.А. — Инженер-сметчик (estimator / engineer)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, position, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'sokolov@stroyinvest.ru',
    '$2a$10$dXJ3SW6G7P50lGEMo1HUn.g0VmQMnA0BLYKe8o7/5x2W.APMkVAi',
    'Алексей',
    'Соколов',
    '+7 (495) 123-45-08',
    'Инженер-сметчик',
    TRUE,
    'seed'
) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- Назначение ролей демо-пользователям
-- Роли были созданы в V2__auth_tables.sql
-- =============================================================================

-- Иванов — ADMIN (Генеральный директор = полный доступ)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'ivanov@stroyinvest.ru' AND r.code = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Петров — PROJECT_MANAGER (Руководитель проекта)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'petrov@stroyinvest.ru' AND r.code = 'PROJECT_MANAGER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Сидоров — FOREMAN (Прораб)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'sidorov@stroyinvest.ru' AND r.code = 'FOREMAN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Козлова — ACCOUNTANT (Финансовый директор / Бухгалтер)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'kozlova@stroyinvest.ru' AND r.code = 'ACCOUNTANT'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Новикова — ENGINEER (Инженер ПТО)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'novikova@stroyinvest.ru' AND r.code = 'ENGINEER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Волков — SUPPLY_MANAGER (Начальник снабжения)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'volkov@stroyinvest.ru' AND r.code = 'SUPPLY_MANAGER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Морозова — SAFETY_OFFICER (Специалист по ОТ)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'morozova@stroyinvest.ru' AND r.code = 'SAFETY_OFFICER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Соколов — ENGINEER (Инженер-сметчик)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'sokolov@stroyinvest.ru' AND r.code = 'ENGINEER'
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
