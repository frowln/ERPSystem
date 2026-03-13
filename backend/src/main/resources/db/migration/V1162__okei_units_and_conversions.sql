-- P1-WAR-1: ОКЕИ справочник + таблица конвертации единиц измерения
-- ОКПД2: Общероссийский классификатор единиц измерения (ОК 015-94)

CREATE TABLE IF NOT EXISTS okei_units (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(10) NOT NULL,               -- Код ОКЕИ (e.g. 006 = м²)
    name_ru       VARCHAR(200) NOT NULL,              -- Наименование (русское)
    symbol_ru     VARCHAR(50) NOT NULL,               -- Буквенное обозначение (e.g. м²)
    name_en       VARCHAR(200),                       -- Наименование (английское)
    symbol_en     VARCHAR(50),                        -- English symbol
    category      VARCHAR(50),                        -- Категория (длина, масса, объём, ...)
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_okei_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_okei_symbol ON okei_units(symbol_ru);
CREATE INDEX IF NOT EXISTS idx_okei_category ON okei_units(category);

-- Populate common construction units (Приказ Минстроя №422/пр)
INSERT INTO okei_units (code, name_ru, symbol_ru, name_en, symbol_en, category) VALUES
    ('796', 'Штука',                      'шт.',   'piece',             'pc.',  'количество'),
    ('006', 'Квадратный метр',            'м²',    'square metre',      'm²',   'площадь'),
    ('005', 'Кубический метр',            'м³',    'cubic metre',       'm³',   'объём'),
    ('003', 'Метр',                       'м',     'metre',             'm',    'длина'),
    ('166', 'Килограмм',                  'кг',    'kilogram',          'kg',   'масса'),
    ('168', 'Тонна',                      'т',     'tonne',             't',    'масса'),
    ('383', 'Литр',                       'л',     'litre',             'L',    'объём'),
    ('112', 'Погонный метр',              'пм',    'running metre',     'lm',   'длина'),
    ('778', 'Упаковка',                   'уп.',   'package',           'pkg',  'количество'),
    ('048', 'Мешок',                      'мешок', 'bag',               'bag',  'количество'),
    ('707', 'Комплект',                   'компл.','set',               'set',  'количество'),
    ('119', 'Тысяча штук',               'тыс.шт.','thousand pieces',  'kpc',  'количество'),
    ('732', 'Рулон',                      'рул.',  'roll',              'roll', 'количество'),
    ('715', 'Лист',                       'лист',  'sheet',             'sht',  'количество'),
    ('384', 'Кубический дециметр (Литр)', 'дм³',   'cubic decimetre',   'dm³',  'объём'),
    ('055', 'Киловатт',                   'кВт',   'kilowatt',          'kW',   'мощность'),
    ('018', 'Гектар',                     'га',    'hectare',           'ha',   'площадь')
ON CONFLICT (code) DO NOTHING;

-- P1-WAR-1: Таблица конвертации между единицами измерения
CREATE TABLE IF NOT EXISTS unit_conversions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit_code  VARCHAR(10) NOT NULL REFERENCES okei_units(code),
    to_unit_code    VARCHAR(10) NOT NULL REFERENCES okei_units(code),
    factor          NUMERIC(20,10) NOT NULL,           -- to = from × factor
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_unit_conversion UNIQUE (from_unit_code, to_unit_code)
);

-- Common construction conversions
INSERT INTO unit_conversions (from_unit_code, to_unit_code, factor) VALUES
    ('168', '166', 1000),     -- т → кг
    ('166', '168', 0.001),    -- кг → т
    ('003', '112', 1),        -- м → пм (1:1)
    ('119', '796', 1000)      -- тыс.шт. → шт.
ON CONFLICT (from_unit_code, to_unit_code) DO NOTHING;
