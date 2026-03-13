-- ОКЕИ — Общероссийский классификатор единиц измерения (ОК 015-94)
-- System-level reference: shared across all tenants (no organization_id)

CREATE TABLE IF NOT EXISTS units_of_measure (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    okei_code        VARCHAR(3)   NOT NULL,
    symbol           VARCHAR(20)  NOT NULL,
    name             VARCHAR(200) NOT NULL,
    quantity_group   VARCHAR(50),
    base_unit_code   VARCHAR(3),
    conversion_factor NUMERIC(18, 6),
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    version          BIGINT       NOT NULL DEFAULT 0,
    deleted          BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_uom_okei_code UNIQUE (okei_code)
);

CREATE INDEX IF NOT EXISTS idx_uom_symbol ON units_of_measure (symbol);
CREATE INDEX IF NOT EXISTS idx_uom_group  ON units_of_measure (quantity_group);

-- ── Seed most-used ОКЕИ codes for Russian construction ────────────────────────
INSERT INTO units_of_measure
    (okei_code, symbol, name, quantity_group, base_unit_code, conversion_factor)
VALUES
    -- Штучный
    ('796', 'шт',      'Штука',              'Штучный',  NULL,  NULL),
    ('904', 'компл',   'Комплект',           'Штучный',  NULL,  NULL),
    -- Длина
    ('006', 'м',       'Метр',               'Длина',    NULL,  NULL),
    ('003', 'мм',      'Миллиметр',          'Длина',    '006', 0.001),
    ('033', 'км',      'Километр',           'Длина',    '006', 1000),
    ('742', 'пог.м',   'Погонный метр',      'Длина',    '006', 1),
    -- Площадь
    ('055', 'м2',      'Квадратный метр',    'Площадь',  NULL,  NULL),
    ('356', 'га',      'Гектар',             'Площадь',  '055', 10000),
    -- Объём
    ('113', 'м3',      'Кубический метр',    'Объём',    NULL,  NULL),
    ('383', 'л',       'Литр',               'Объём',    '113', 0.001),
    -- Масса
    ('166', 'кг',      'Килограмм',          'Масса',    NULL,  NULL),
    ('168', 'т',       'Тонна',              'Масса',    '166', 1000),
    -- Мощность
    ('111', 'кВт',     'Киловатт',           'Мощность', NULL,  NULL),
    ('112', 'л.с.',    'Лошадиная сила',     'Мощность', NULL,  NULL),
    -- Прочее
    ('760', 'усл.ед',  'Условная единица',   'Прочее',   NULL,  NULL)
ON CONFLICT (okei_code) DO NOTHING;
