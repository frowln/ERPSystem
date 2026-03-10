-- V1071: Таблица кэша проверки СРО (Саморегулируемые организации)
-- ФЗ-315, ГрК РФ ст. 55.8 — обязательное членство для контрактов > 3 млн руб.

CREATE TABLE IF NOT EXISTS sro_verification_cache (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inn              VARCHAR(12)     NOT NULL,
    company_name     VARCHAR(500),
    is_member        BOOLEAN         NOT NULL DEFAULT false,
    sro_name         VARCHAR(500),
    sro_number       VARCHAR(100),
    certificate_number VARCHAR(100),
    member_since     DATE,
    status           VARCHAR(50)     DEFAULT 'UNKNOWN',
    allowed_work_types TEXT,          -- JSON-массив видов работ из приказа Минстроя
    compensation_fund NUMERIC(15,2),  -- Размер взноса в компенсационный фонд (руб.)
    competency_level VARCHAR(10),     -- Уровень ответственности: 1-5
    verified_at      TIMESTAMP WITH TIME ZONE,
    cached_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Стандартные поля BaseEntity
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    version          BIGINT          NOT NULL DEFAULT 0,
    deleted          BOOLEAN         NOT NULL DEFAULT false
);

-- Индекс для быстрого поиска по ИНН
CREATE INDEX IF NOT EXISTS idx_sro_cache_inn ON sro_verification_cache(inn);

-- Индекс для очистки устаревших записей кэша
CREATE INDEX IF NOT EXISTS idx_sro_cache_cached_at ON sro_verification_cache(cached_at);

COMMENT ON TABLE sro_verification_cache IS 'Кэш результатов проверки членства подрядчиков в СРО';
COMMENT ON COLUMN sro_verification_cache.inn IS 'ИНН подрядчика (10 цифр — юр.лицо, 12 — ИП)';
COMMENT ON COLUMN sro_verification_cache.status IS 'ACTIVE — действующий, SUSPENDED — приостановлен, EXCLUDED — исключён, NOT_FOUND — не найден';
COMMENT ON COLUMN sro_verification_cache.competency_level IS 'Уровень ответственности: 1 (до 60М), 2 (до 500М), 3 (до 3Б), 4 (до 10Б), 5 (>10Б)';
COMMENT ON COLUMN sro_verification_cache.compensation_fund IS 'Размер взноса в компенсационный фонд возмещения вреда (руб.)';
