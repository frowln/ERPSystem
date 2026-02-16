-- =============================================================================
-- V1001: Демо-организации (контрагенты)
-- Основная компания, субподрядчики и поставщики
-- =============================================================================

BEGIN;

-- =============================================================================
-- ООО "СтройИнвест" — основная генподрядная компания
-- =============================================================================
INSERT INTO organizations (id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, type, active, created_by)
VALUES (
    uuid_generate_v4(),
    'ООО "СтройИнвест"',
    '7701234567',
    '770101001',
    '1027700123456',
    'г. Москва, ул. Строителей, д. 15, стр. 1',
    'г. Москва, ул. Строителей, д. 15, стр. 1, офис 301',
    '+7 (495) 100-20-30',
    'info@stroyinvest.ru',
    'COMPANY',
    TRUE,
    'seed'
) ON CONFLICT (inn) DO NOTHING;

-- =============================================================================
-- ООО "СубСтрой" — субподрядчик (общестроительные работы)
-- =============================================================================
INSERT INTO organizations (id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, type, active, created_by)
VALUES (
    uuid_generate_v4(),
    'ООО "СубСтрой"',
    '7702345678',
    '770201001',
    '1027700234567',
    'г. Москва, ул. Монтажная, д. 8',
    'г. Москва, ул. Монтажная, д. 8, офис 12',
    '+7 (495) 200-30-40',
    'info@substroy.ru',
    'COMPANY',
    TRUE,
    'seed'
) ON CONFLICT (inn) DO NOTHING;

-- =============================================================================
-- АО "БетонПром" — поставщик бетона и ЖБИ
-- =============================================================================
INSERT INTO organizations (id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, type, active, created_by)
VALUES (
    uuid_generate_v4(),
    'АО "БетонПром"',
    '7703456789',
    '770301001',
    '1027700345678',
    'Московская обл., г. Мытищи, Промзона, д. 5',
    'Московская обл., г. Мытищи, Промзона, д. 5',
    '+7 (495) 300-40-50',
    'sales@betonprom.ru',
    'COMPANY',
    TRUE,
    'seed'
) ON CONFLICT (inn) DO NOTHING;

-- =============================================================================
-- ООО "МеталлСнаб" — поставщик металлоконструкций и арматуры
-- =============================================================================
INSERT INTO organizations (id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, type, active, created_by)
VALUES (
    uuid_generate_v4(),
    'ООО "МеталлСнаб"',
    '7704567890',
    '770401001',
    '1027700456789',
    'г. Москва, Промышленный пр-д, д. 22',
    'г. Москва, Промышленный пр-д, д. 22, склад 3',
    '+7 (495) 400-50-60',
    'zakaz@metallsnab.ru',
    'COMPANY',
    TRUE,
    'seed'
) ON CONFLICT (inn) DO NOTHING;

-- =============================================================================
-- ИП Кузнецов — субподрядчик по электромонтажным работам
-- ИНН из 12 цифр для ИП
-- =============================================================================
INSERT INTO organizations (id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, type, active, created_by)
VALUES (
    uuid_generate_v4(),
    'ИП Кузнецов А.В. "Электромонтаж"',
    '770512345678',
    NULL,
    '304770500012345',
    'г. Москва, ул. Электрозаводская, д. 3, кв. 15',
    'г. Москва, ул. Электрозаводская, д. 3',
    '+7 (495) 500-60-70',
    'kuznetsov.electro@mail.ru',
    'COMPANY',
    TRUE,
    'seed'
) ON CONFLICT (inn) DO NOTHING;

-- =============================================================================
-- Привязка пользователей к основной организации "СтройИнвест"
-- =============================================================================
UPDATE users
SET organization_id = (SELECT id FROM organizations WHERE inn = '7701234567')
WHERE email IN (
    'ivanov@stroyinvest.ru',
    'petrov@stroyinvest.ru',
    'sidorov@stroyinvest.ru',
    'kozlova@stroyinvest.ru',
    'novikova@stroyinvest.ru',
    'volkov@stroyinvest.ru',
    'morozova@stroyinvest.ru',
    'sokolov@stroyinvest.ru'
)
AND organization_id IS NULL;

-- =============================================================================
-- Отделы основной компании
-- =============================================================================
INSERT INTO departments (id, name, code, organization_id, created_by)
SELECT uuid_generate_v4(), 'Управление', 'MGMT', o.id, 'seed'
FROM organizations o WHERE o.inn = '7701234567'
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, name, code, organization_id, created_by)
SELECT uuid_generate_v4(), 'Производственно-технический отдел', 'PTO', o.id, 'seed'
FROM organizations o WHERE o.inn = '7701234567'
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, name, code, organization_id, created_by)
SELECT uuid_generate_v4(), 'Отдел снабжения', 'SUPPLY', o.id, 'seed'
FROM organizations o WHERE o.inn = '7701234567'
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, name, code, organization_id, created_by)
SELECT uuid_generate_v4(), 'Финансовый отдел', 'FIN', o.id, 'seed'
FROM organizations o WHERE o.inn = '7701234567'
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, name, code, organization_id, created_by)
SELECT uuid_generate_v4(), 'Отдел охраны труда', 'HSE', o.id, 'seed'
FROM organizations o WHERE o.inn = '7701234567'
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, name, code, organization_id, created_by)
SELECT uuid_generate_v4(), 'Сметный отдел', 'EST', o.id, 'seed'
FROM organizations o WHERE o.inn = '7701234567'
ON CONFLICT DO NOTHING;

COMMIT;
