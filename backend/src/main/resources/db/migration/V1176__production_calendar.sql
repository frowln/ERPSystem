-- =============================================================================
-- V1176: Production Calendar (Производственный календарь РФ)
--
-- Required for correct T-13 timesheet generation, overtime calculations,
-- and vacation pay (replacing hardcoded 168 hours/month).
-- Seeded with official Russian holiday calendar for 2025 and 2026.
-- =============================================================================

CREATE TABLE production_calendar (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_date    DATE NOT NULL,
    day_type         VARCHAR(20) NOT NULL CHECK (day_type IN (
        'WORKING', 'WEEKEND', 'HOLIDAY', 'PRE_HOLIDAY',
        'TRANSFERRED_WEEKEND', 'TRANSFERRED_WORKING'
    )),
    standard_hours   NUMERIC(4,1) NOT NULL DEFAULT 8.0,
    description      VARCHAR(255),
    year             INTEGER NOT NULL,
    organization_id  UUID REFERENCES organizations(id),
    deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    version          BIGINT DEFAULT 0,
    UNIQUE(calendar_date, organization_id)
);

CREATE INDEX idx_prod_calendar_date ON production_calendar(calendar_date);
CREATE INDEX idx_prod_calendar_year ON production_calendar(year);
CREATE INDEX idx_prod_calendar_org  ON production_calendar(organization_id);
CREATE INDEX idx_prod_calendar_type ON production_calendar(day_type);

-- =============================================================================
-- Seed: Generate all days for 2025 and 2026, then override holidays/pre-holidays.
-- Uses a PL/pgSQL block with generate_series for weekends, then explicit INSERTs.
-- =============================================================================

DO $$
DECLARE
    d DATE;
    dow INTEGER;   -- 0=Sun, 1=Mon, ..., 6=Sat
    yr INTEGER;
BEGIN
    -- Generate all 365/366 days for 2025 and 2026
    FOR yr IN 2025..2026 LOOP
        FOR d IN SELECT gs::date FROM generate_series(
            (yr || '-01-01')::date,
            (yr || '-12-31')::date,
            '1 day'::interval
        ) gs LOOP
            dow := EXTRACT(DOW FROM d);  -- 0=Sunday, 6=Saturday
            IF dow IN (0, 6) THEN
                INSERT INTO production_calendar (calendar_date, day_type, standard_hours, year, organization_id)
                VALUES (d, 'WEEKEND', 0.0, yr, NULL);
            ELSE
                INSERT INTO production_calendar (calendar_date, day_type, standard_hours, year, organization_id)
                VALUES (d, 'WORKING', 8.0, yr, NULL);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- =============================================================================
-- 2025 Official Russian Holidays (Постановление Правительства РФ)
-- =============================================================================

-- Новогодние каникулы: 1–8 января
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Новогодние каникулы' WHERE calendar_date BETWEEN '2025-01-01' AND '2025-01-08' AND organization_id IS NULL;

-- 23 февраля — День защитника Отечества (воскресенье → перенос на 24 фев)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День защитника Отечества' WHERE calendar_date = '2025-02-23' AND organization_id IS NULL;
-- Перенос выходного: пн 24 февраля — нерабочий
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День защитника Отечества (перенос)' WHERE calendar_date = '2025-02-24' AND organization_id IS NULL;

-- Предпраздничный: 21 февраля (пятница перед 23 февраля)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (23 февраля)' WHERE calendar_date = '2025-02-21' AND organization_id IS NULL;

-- 8 марта — Международный женский день (суббота → перенос на 10 марта)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Международный женский день' WHERE calendar_date = '2025-03-08' AND organization_id IS NULL;
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Международный женский день (перенос)' WHERE calendar_date = '2025-03-10' AND organization_id IS NULL;

-- Предпраздничный: 7 марта (пятница)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (8 марта)' WHERE calendar_date = '2025-03-07' AND organization_id IS NULL;

-- 1 мая — Праздник Весны и Труда (четверг)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Праздник Весны и Труда' WHERE calendar_date = '2025-05-01' AND organization_id IS NULL;

-- Предпраздничный: 30 апреля (среда)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (1 мая)' WHERE calendar_date = '2025-04-30' AND organization_id IS NULL;

-- 2 мая 2025 — перенос с 4 января (суббота → пятница, нерабочий)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Перенос с 4 января' WHERE calendar_date = '2025-05-02' AND organization_id IS NULL;

-- 9 мая — День Победы (пятница)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День Победы' WHERE calendar_date = '2025-05-09' AND organization_id IS NULL;

-- Предпраздничный: 8 мая (четверг)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (9 мая)' WHERE calendar_date = '2025-05-08' AND organization_id IS NULL;

-- 12 июня — День России (четверг)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День России' WHERE calendar_date = '2025-06-12' AND organization_id IS NULL;

-- Предпраздничный: 11 июня (среда)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (12 июня)' WHERE calendar_date = '2025-06-11' AND organization_id IS NULL;

-- 13 июня 2025 — перенос с 5 января (воскресенье → пятница, нерабочий)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Перенос с 5 января' WHERE calendar_date = '2025-06-13' AND organization_id IS NULL;

-- 4 ноября — День народного единства (вторник)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День народного единства' WHERE calendar_date = '2025-11-04' AND organization_id IS NULL;

-- Предпраздничный: 3 ноября (понедельник)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (4 ноября)' WHERE calendar_date = '2025-11-03' AND organization_id IS NULL;

-- 31 декабря 2025 — перенос с 6 января (среда, нерабочий)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Перенос с 6 января' WHERE calendar_date = '2025-12-31' AND organization_id IS NULL;

-- Предпраздничный: 30 декабря (вторник, перед 31 декабря — выходным)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (Новый год)' WHERE calendar_date = '2025-12-30' AND organization_id IS NULL;

-- 1 ноября 2025 — рабочая суббота (перенос с 3 ноября)
UPDATE production_calendar SET day_type = 'TRANSFERRED_WORKING', standard_hours = 8.0,
    description = 'Рабочий день (перенос за 3 ноября)' WHERE calendar_date = '2025-11-01' AND organization_id IS NULL;

-- =============================================================================
-- 2026 Official Russian Holidays (Постановление Правительства РФ)
-- =============================================================================

-- Новогодние каникулы: 1–8 января
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Новогодние каникулы' WHERE calendar_date BETWEEN '2026-01-01' AND '2026-01-08' AND organization_id IS NULL;

-- 23 февраля — День защитника Отечества (понедельник)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День защитника Отечества' WHERE calendar_date = '2026-02-23' AND organization_id IS NULL;

-- Предпраздничный: 20 февраля (пятница)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (23 февраля)' WHERE calendar_date = '2026-02-20' AND organization_id IS NULL;

-- 8 марта — Международный женский день (воскресенье → перенос на 9 марта)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Международный женский день' WHERE calendar_date = '2026-03-08' AND organization_id IS NULL;
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Международный женский день (перенос)' WHERE calendar_date = '2026-03-09' AND organization_id IS NULL;

-- Предпраздничный: 6 марта (пятница)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (8 марта)' WHERE calendar_date = '2026-03-06' AND organization_id IS NULL;

-- 1 мая — Праздник Весны и Труда (пятница)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Праздник Весны и Труда' WHERE calendar_date = '2026-05-01' AND organization_id IS NULL;

-- Предпраздничный: 30 апреля (четверг)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (1 мая)' WHERE calendar_date = '2026-04-30' AND organization_id IS NULL;

-- 9 мая — День Победы (суббота → перенос на 11 мая)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День Победы' WHERE calendar_date = '2026-05-09' AND organization_id IS NULL;
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День Победы (перенос)' WHERE calendar_date = '2026-05-11' AND organization_id IS NULL;

-- Предпраздничный: 8 мая (пятница)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (9 мая)' WHERE calendar_date = '2026-05-08' AND organization_id IS NULL;

-- 12 июня — День России (пятница)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День России' WHERE calendar_date = '2026-06-12' AND organization_id IS NULL;

-- Предпраздничный: 11 июня (четверг)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (12 июня)' WHERE calendar_date = '2026-06-11' AND organization_id IS NULL;

-- 4 ноября — День народного единства (среда)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'День народного единства' WHERE calendar_date = '2026-11-04' AND organization_id IS NULL;

-- Предпраздничный: 3 ноября (вторник)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (4 ноября)' WHERE calendar_date = '2026-11-03' AND organization_id IS NULL;

-- 31 декабря 2026 — предпраздничный (четверг)
UPDATE production_calendar SET day_type = 'PRE_HOLIDAY', standard_hours = 7.0,
    description = 'Предпраздничный день (Новый год)' WHERE calendar_date = '2026-12-31' AND organization_id IS NULL;

-- =============================================================================
-- 2026: Transferred holidays from January kanikuly
-- Правительство РФ обычно переносит выходные из новогодних каникул.
-- Типичные переносы (уточняются Постановлением каждый год):
-- =============================================================================

-- Перенос с 3 января (суббота) на 31 декабря 2025 — уже обработан выше
-- Перенос с 4 января (воскресенье) на 2 мая (суббота → нерабочий)
UPDATE production_calendar SET day_type = 'HOLIDAY', standard_hours = 0.0,
    description = 'Перенос с 4 января' WHERE calendar_date = '2026-05-04' AND organization_id IS NULL;

-- Предпраздничный корректировки для дней, которые совпадают с выходными — не нужны
-- (предпраздничный применяется только к рабочим дням)
