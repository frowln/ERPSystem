-- =============================================================================
-- V28: Calendar & Construction Scheduling Module
-- Календарь и календарные планы строительства
-- =============================================================================

-- =============================================================================
-- Calendar Events (События календаря)
-- =============================================================================
CREATE TABLE calendar_events (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    event_type              VARCHAR(30) NOT NULL,
    start_date              DATE NOT NULL,
    start_time              TIME,
    end_date                DATE NOT NULL,
    end_time                TIME,
    is_all_day              BOOLEAN NOT NULL DEFAULT FALSE,
    project_id              UUID,
    task_id                 UUID,
    organizer_id            UUID NOT NULL,
    organizer_name          VARCHAR(255) NOT NULL,
    location                VARCHAR(500),
    is_online               BOOLEAN NOT NULL DEFAULT FALSE,
    meeting_url             VARCHAR(1000),
    recurrence_rule         VARCHAR(20) NOT NULL DEFAULT 'NONE',
    recurrence_end_date     DATE,
    color                   VARCHAR(7),
    priority                VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
    reminder_minutes_before INTEGER,
    status                  VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_event_type CHECK (event_type IN (
        'MEETING', 'DEADLINE', 'INSPECTION', 'DELIVERY', 'MILESTONE', 'HOLIDAY', 'TRAINING', 'OTHER'
    )),
    CONSTRAINT chk_event_recurrence CHECK (recurrence_rule IN (
        'NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'
    )),
    CONSTRAINT chk_event_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH')),
    CONSTRAINT chk_event_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_event_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_event_reminder CHECK (reminder_minutes_before IS NULL OR reminder_minutes_before >= 0)
);

CREATE INDEX IF NOT EXISTS idx_event_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_event_project ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_event_organizer ON calendar_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_event_active ON calendar_events(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Calendar Event Attendees (Участники событий)
-- =============================================================================
CREATE TABLE calendar_event_attendees (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id            UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL,
    user_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255),
    response_status     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_required         BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_attendee_response CHECK (response_status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE')),
    CONSTRAINT uq_event_attendee UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendee_event ON calendar_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendee_user ON calendar_event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendee_active ON calendar_event_attendees(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_calendar_event_attendees_updated_at
    BEFORE UPDATE ON calendar_event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Construction Schedules (Календарные планы строительства)
-- =============================================================================
CREATE TABLE construction_schedules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,
    doc_version         INTEGER NOT NULL DEFAULT 1,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_schedule_status CHECK (status IN ('DRAFT', 'APPROVED', 'ACTIVE', 'COMPLETED')),
    CONSTRAINT chk_schedule_planned_dates CHECK (
        planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date
    ),
    CONSTRAINT chk_schedule_actual_dates CHECK (
        actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date
    )
);

CREATE INDEX IF NOT EXISTS idx_schedule_project ON construction_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON construction_schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedule_active ON construction_schedules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_construction_schedules_updated_at
    BEFORE UPDATE ON construction_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Schedule Items (Позиции календарного плана)
-- =============================================================================
CREATE TABLE schedule_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id             UUID NOT NULL REFERENCES construction_schedules(id) ON DELETE CASCADE,
    parent_item_id          UUID REFERENCES schedule_items(id) ON DELETE SET NULL,
    code                    VARCHAR(50),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    work_type               VARCHAR(30) NOT NULL,
    planned_start_date      DATE,
    planned_end_date        DATE,
    actual_start_date       DATE,
    actual_end_date         DATE,
    duration                INTEGER,
    progress                INTEGER NOT NULL DEFAULT 0,
    predecessor_item_id     UUID REFERENCES schedule_items(id) ON DELETE SET NULL,
    lag_days                INTEGER DEFAULT 0,
    responsible_id          UUID,
    responsible_name        VARCHAR(255),
    is_critical_path        BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_item_work_type CHECK (work_type IN (
        'PREPARATION', 'EARTHWORK', 'FOUNDATION', 'STRUCTURE', 'ROOFING',
        'MEP', 'FINISHING', 'LANDSCAPING', 'COMMISSIONING', 'OTHER'
    )),
    CONSTRAINT chk_item_progress CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT chk_item_duration CHECK (duration IS NULL OR duration >= 0),
    CONSTRAINT chk_item_planned_dates CHECK (
        planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date
    ),
    CONSTRAINT chk_item_actual_dates CHECK (
        actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date
    )
);

CREATE INDEX IF NOT EXISTS idx_schedule_item_schedule ON schedule_items(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_item_parent ON schedule_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_schedule_item_predecessor ON schedule_items(predecessor_item_id);
CREATE INDEX IF NOT EXISTS idx_schedule_item_work_type ON schedule_items(work_type);
CREATE INDEX IF NOT EXISTS idx_schedule_item_critical ON schedule_items(is_critical_path);
CREATE INDEX IF NOT EXISTS idx_schedule_item_sort ON schedule_items(schedule_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_schedule_item_active ON schedule_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_schedule_items_updated_at
    BEFORE UPDATE ON schedule_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Work Calendars (Производственные календари)
-- =============================================================================
CREATE TABLE work_calendars (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year                INTEGER NOT NULL,
    calendar_type       VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    project_id          UUID,
    name                VARCHAR(255) NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_calendar_type CHECK (calendar_type IN ('STANDARD', 'CUSTOM')),
    CONSTRAINT chk_calendar_year CHECK (year >= 2000 AND year <= 2100)
);

CREATE INDEX IF NOT EXISTS idx_work_calendar_year ON work_calendars(year);
CREATE INDEX IF NOT EXISTS idx_work_calendar_project ON work_calendars(project_id);
CREATE INDEX IF NOT EXISTS idx_work_calendar_type ON work_calendars(calendar_type);
CREATE INDEX IF NOT EXISTS idx_work_calendar_active ON work_calendars(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_work_calendars_updated_at
    BEFORE UPDATE ON work_calendars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Work Calendar Days (Дни производственного календаря)
-- =============================================================================
CREATE TABLE work_calendar_days (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id         UUID NOT NULL REFERENCES work_calendars(id) ON DELETE CASCADE,
    calendar_date       DATE NOT NULL,
    day_type            VARCHAR(20) NOT NULL,
    work_hours          NUMERIC(4,2) NOT NULL DEFAULT 8.0,
    note                VARCHAR(500),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_day_type CHECK (day_type IN ('WORKING', 'WEEKEND', 'HOLIDAY', 'SHORT_DAY', 'NON_WORKING')),
    CONSTRAINT chk_work_hours CHECK (work_hours >= 0 AND work_hours <= 24),
    CONSTRAINT uq_calendar_date UNIQUE (calendar_id, calendar_date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_day_calendar ON work_calendar_days(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_day_date ON work_calendar_days(calendar_date);
CREATE INDEX IF NOT EXISTS idx_calendar_day_type ON work_calendar_days(day_type);
CREATE INDEX IF NOT EXISTS idx_calendar_day_active ON work_calendar_days(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_work_calendar_days_updated_at
    BEFORE UPDATE ON work_calendar_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Seed Russian holidays for 2024-2026
-- Государственные праздники Российской Федерации
-- =============================================================================

-- Helper function to seed holidays for a work calendar
-- We will insert holidays directly after creating standard calendars

-- Create standard work calendars for 2024, 2025, 2026
INSERT INTO work_calendars (id, year, calendar_type, name, created_at, version)
VALUES
    ('a0000000-0000-0000-0000-000000002024', 2024, 'STANDARD', 'Производственный календарь 2024', NOW(), 0),
    ('a0000000-0000-0000-0000-000000002025', 2025, 'STANDARD', 'Производственный календарь 2025', NOW(), 0),
    ('a0000000-0000-0000-0000-000000002026', 2026, 'STANDARD', 'Производственный календарь 2026', NOW(), 0);

-- =============================================================================
-- 2024 Russian Holidays
-- =============================================================================
INSERT INTO work_calendar_days (id, calendar_id, calendar_date, day_type, work_hours, note, created_at, version) VALUES
-- Новогодние каникулы
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-01', 'HOLIDAY', 0, 'Новый год', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-02', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-03', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-04', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-05', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-06', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-07', 'HOLIDAY', 0, 'Рождество Христово', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-01-08', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
-- День защитника Отечества
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-02-23', 'HOLIDAY', 0, 'День защитника Отечества', NOW(), 0),
-- Международный женский день
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-03-08', 'HOLIDAY', 0, 'Международный женский день', NOW(), 0),
-- Праздник Весны и Труда
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-05-01', 'HOLIDAY', 0, 'Праздник Весны и Труда', NOW(), 0),
-- День Победы
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-05-09', 'HOLIDAY', 0, 'День Победы', NOW(), 0),
-- День России
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-06-12', 'HOLIDAY', 0, 'День России', NOW(), 0),
-- День народного единства
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-11-04', 'HOLIDAY', 0, 'День народного единства', NOW(), 0),
-- Предпраздничные сокращённые дни 2024
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-02-22', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-03-07', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-04-30', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-05-08', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-06-11', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-11-02', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002024', '2024-12-31', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0);

-- =============================================================================
-- 2025 Russian Holidays
-- =============================================================================
INSERT INTO work_calendar_days (id, calendar_id, calendar_date, day_type, work_hours, note, created_at, version) VALUES
-- Новогодние каникулы
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-01', 'HOLIDAY', 0, 'Новый год', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-02', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-03', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-04', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-05', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-06', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-07', 'HOLIDAY', 0, 'Рождество Христово', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-01-08', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
-- День защитника Отечества
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-02-23', 'HOLIDAY', 0, 'День защитника Отечества', NOW(), 0),
-- Международный женский день
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-03-08', 'HOLIDAY', 0, 'Международный женский день', NOW(), 0),
-- Праздник Весны и Труда
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-05-01', 'HOLIDAY', 0, 'Праздник Весны и Труда', NOW(), 0),
-- День Победы
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-05-09', 'HOLIDAY', 0, 'День Победы', NOW(), 0),
-- День России
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-06-12', 'HOLIDAY', 0, 'День России', NOW(), 0),
-- День народного единства
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-11-04', 'HOLIDAY', 0, 'День народного единства', NOW(), 0),
-- Предпраздничные сокращённые дни 2025
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-02-22', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-03-07', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-04-30', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-05-08', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-06-11', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-11-03', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002025', '2025-12-31', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0);

-- =============================================================================
-- 2026 Russian Holidays
-- =============================================================================
INSERT INTO work_calendar_days (id, calendar_id, calendar_date, day_type, work_hours, note, created_at, version) VALUES
-- Новогодние каникулы
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-01', 'HOLIDAY', 0, 'Новый год', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-02', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-03', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-04', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-05', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-06', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-07', 'HOLIDAY', 0, 'Рождество Христово', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-01-08', 'HOLIDAY', 0, 'Новогодние каникулы', NOW(), 0),
-- День защитника Отечества
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-02-23', 'HOLIDAY', 0, 'День защитника Отечества', NOW(), 0),
-- Международный женский день
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-03-08', 'HOLIDAY', 0, 'Международный женский день', NOW(), 0),
-- Праздник Весны и Труда
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-05-01', 'HOLIDAY', 0, 'Праздник Весны и Труда', NOW(), 0),
-- День Победы
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-05-09', 'HOLIDAY', 0, 'День Победы', NOW(), 0),
-- День России
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-06-12', 'HOLIDAY', 0, 'День России', NOW(), 0),
-- День народного единства
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-11-04', 'HOLIDAY', 0, 'День народного единства', NOW(), 0),
-- Предпраздничные сокращённые дни 2026
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-02-22', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-03-07', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-04-30', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-05-08', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-06-11', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-11-03', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0),
(uuid_generate_v4(), 'a0000000-0000-0000-0000-000000002026', '2026-12-31', 'SHORT_DAY', 7, 'Предпраздничный день', NOW(), 0);
