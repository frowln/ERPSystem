-- =============================================================================
-- V1008: Демо-данные операционной деятельности
-- Ежедневные журналы, инспекции безопасности, проверки качества, панч-листы
-- =============================================================================

BEGIN;

-- =============================================================================
-- ЕЖЕДНЕВНЫЕ ЖУРНАЛЫ (daily_logs) — ЖК "Солнечный"
-- Последние 14 дней (с 30.01.2026 по 12.02.2026)
-- =============================================================================

-- 30 января 2026 (пятница)
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00001', p.id, '2026-01-30'::DATE, 'CLOUDY',
    -8.0, -3.0, 4.5,
    u.id, 'Сидоров С.С.', 'APPROVED',
    'Бетонирование перекрытия 5 этажа секции 1 (захватка 2). '
    || 'Утепление опалубки электропрогревом. Объём бетона 85 м3.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 31 января 2026 (суббота)
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00002', p.id, '2026-01-31'::DATE, 'SNOW',
    -12.0, -7.0, 6.0,
    u.id, 'Сидоров С.С.', 'APPROVED',
    'Уход за бетоном (электропрогрев). Снегопад — расчистка подъездных путей. '
    || 'Монтаж арматуры стен 6 этажа секции 1 — отложен из-за погоды.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 2 февраля 2026 (понедельник)
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00003', p.id, '2026-02-02'::DATE, 'FROST',
    -15.0, -10.0, 3.0,
    u.id, 'Сидоров С.С.', 'APPROVED',
    'Мороз -15. Арматурные работы стен 6 этажа секции 1. '
    || 'Монтаж опалубки. Прогрев бетона продолжается. '
    || 'На площадке 42 человека.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 3 февраля 2026
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00004', p.id, '2026-02-03'::DATE, 'CLOUDY',
    -10.0, -5.0, 2.5,
    u.id, 'Сидоров С.С.', 'APPROVED',
    'Продолжение арматурных работ стен 6 этажа. '
    || 'Приём бетона для стен (45 м3, АО "БетонПром"). '
    || 'Параллельно — кладка перегородок на 3 этаже.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 5 февраля 2026
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00005', p.id, '2026-02-05'::DATE, 'CLEAR',
    -7.0, -2.0, 1.5,
    u.id, 'Сидоров С.С.', 'APPROVED',
    'Снятие опалубки стен 6 этажа. Монтаж опалубки перекрытия 6 этажа. '
    || 'Обнаружена трещина в перекрытии 3 этажа — зафиксировано, RFI направлен. '
    || 'На площадке 48 человек.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 7 февраля 2026
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00006', p.id, '2026-02-07'::DATE, 'CLOUDY',
    -5.0, -1.0, 3.0,
    u.id, 'Сидоров С.С.', 'SUBMITTED',
    'Армирование перекрытия 6 этажа секции 1 (захватка 1). '
    || 'Завоз арматуры d16 (15 тонн, ООО "МеталлСнаб"). '
    || 'Начало земляных работ для секции 3.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 10 февраля 2026
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00007', p.id, '2026-02-10'::DATE, 'CLEAR',
    -4.0, 1.0, 2.0,
    u.id, 'Сидоров С.С.', 'SUBMITTED',
    'Бетонирование перекрытия 6 этажа секции 1 (80 м3). '
    || 'Потепление — прогноз плюсовых температур на неделю. '
    || 'Кладка наружных стен 4 этажа.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- 12 февраля 2026
INSERT INTO daily_logs (
    id, code, project_id, log_date, weather_conditions,
    temperature_min, temperature_max, wind_speed,
    shift_supervisor_id, shift_supervisor_name, status, general_notes, created_by
)
SELECT uuid_generate_v4(), 'KS6-00008', p.id, '2026-02-12'::DATE, 'CLEAR',
    -2.0, 3.0, 1.0,
    u.id, 'Сидоров С.С.', 'DRAFT',
    'Продолжение кладочных работ 4-5 этажей. '
    || 'Монтаж арматуры стен 7 этажа секции 1. '
    || 'Геодезическая съёмка выполненных конструкций.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, log_date) DO NOTHING;

-- =============================================================================
-- ЗАПИСИ ЕЖЕДНЕВНОГО ЖУРНАЛА (daily_log_entries)
-- =============================================================================

-- Записи для 30 января
INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, quantity, unit, start_time, end_time, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'WORK_PERFORMED',
    'Бетонирование перекрытия 5 этажа секции 1 (захватка 2)',
    85.0000, 'м3', '08:00'::TIME, '16:00'::TIME, 'Бригада Петренко', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00001'
ON CONFLICT DO NOTHING;

INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, quantity, unit, start_time, end_time, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'MATERIAL_RECEIVED',
    'Приём бетона B25 W6 F150 от АО "БетонПром" (11 миксеров)',
    85.0000, 'м3', '07:30'::TIME, '15:30'::TIME, 'Волков В.В.', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00001'
ON CONFLICT DO NOTHING;

INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, quantity, unit, start_time, end_time, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'EQUIPMENT_USED',
    'Автобетононасос Putzmeister 36м — подача бетона',
    1.0000, 'ед', '07:30'::TIME, '16:00'::TIME, 'Бригада Петренко', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00001'
ON CONFLICT DO NOTHING;

INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, quantity, unit, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'PERSONNEL',
    'Бригада бетонщиков — 12 чел., арматурщики — 8 чел., крановщик — 2 чел., ИТР — 4 чел.',
    26.0000, 'чел', 'Сидоров С.С.', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00001'
ON CONFLICT DO NOTHING;

-- Записи для 5 февраля (трещина)
INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, quantity, unit, start_time, end_time, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'WORK_PERFORMED',
    'Снятие опалубки стен 6 этажа секции 1. Контроль качества поверхности.',
    450.0000, 'м2', '08:00'::TIME, '14:00'::TIME, 'Бригада Козаченко', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00005'
ON CONFLICT DO NOTHING;

INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, start_time, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'INCIDENT_NOTE',
    'Обнаружена усадочная трещина в перекрытии 3 этажа (ось В-5/6). '
    || 'Длина ~1.5м, раскрытие 0.3мм. Зафиксировано фото. '
    || 'Направлен RFI проектировщику. Установлены маяки для наблюдения.',
    '11:30'::TIME, 'Новикова Н.Н.', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00005'
ON CONFLICT DO NOTHING;

INSERT INTO daily_log_entries (id, daily_log_id, entry_type, description, start_time, end_time, responsible_name, created_by)
SELECT uuid_generate_v4(), dl.id, 'VISITOR',
    'Визит представителя Заказчика (ООО "ДевелопМосква") — Смирнов А.П. '
    || 'Осмотр выполненных конструкций секции 1.',
    '14:00'::TIME, '16:00'::TIME, 'Петров П.П.', 'seed'
FROM daily_logs dl WHERE dl.code = 'KS6-00005'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ИНСПЕКЦИИ БЕЗОПАСНОСТИ (safety_inspections)
-- =============================================================================

-- Инспекция 1: Плановая проверка — ЖК Солнечный (COMPLETED, SATISFACTORY)
INSERT INTO safety_inspections (
    id, number, inspection_date, project_id,
    inspector_id, inspector_name, inspection_type, status, overall_rating,
    findings, recommendations, next_inspection_date, notes, created_by
)
SELECT uuid_generate_v4(), 'INS-00001', '2026-01-15'::DATE, p.id,
    u.id, 'Морозова М.М.', 'ROUTINE', 'COMPLETED', 'SATISFACTORY',
    'Площадка в удовлетворительном состоянии. '
    || 'СИЗ у всех работников в наличии. Ограждения котлована установлены. '
    || 'Замечания: 1) Не все стремянки зафиксированы. 2) Недостаточное освещение в зоне складирования.',
    '1) Закрепить все стремянки карабинами. '
    || '2) Установить дополнительные прожекторы в зоне склада. '
    || '3) Обновить информационные стенды по ТБ.',
    '2026-02-15'::DATE,
    'Плановая ежемесячная проверка. Общее состояние хорошее.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- Инспекция 2: Внеплановая после инцидента (COMPLETED, NEEDS_IMPROVEMENT)
INSERT INTO safety_inspections (
    id, number, inspection_date, project_id,
    inspector_id, inspector_name, inspection_type, status, overall_rating,
    findings, recommendations, next_inspection_date, notes, created_by
)
SELECT uuid_generate_v4(), 'INS-00002', '2026-02-03'::DATE, p.id,
    u.id, 'Морозова М.М.', 'UNSCHEDULED', 'COMPLETED', 'NEEDS_IMPROVEMENT',
    'Внеплановая проверка после падения работника с подмостей (лёгкая травма). '
    || 'Выявлено: 1) Подмости не закреплены к стене. '
    || '2) Работник не использовал страховочную привязь. '
    || '3) Наряд-допуск на работы на высоте не оформлен.',
    '1) Немедленно закрепить все подмости согласно ППР. '
    || '2) Провести внеплановый инструктаж по работам на высоте. '
    || '3) Обеспечить контроль наряд-допусков. '
    || '4) Усилить контроль за использованием СИЗ.',
    '2026-02-10'::DATE,
    'Контрольная проверка через неделю. Срок устранения замечаний — 3 дня.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- Инспекция 3: Контрольная проверка (COMPLETED, SATISFACTORY)
INSERT INTO safety_inspections (
    id, number, inspection_date, project_id,
    inspector_id, inspector_name, inspection_type, status, overall_rating,
    findings, recommendations, next_inspection_date, notes, created_by
)
SELECT uuid_generate_v4(), 'INS-00003', '2026-02-10'::DATE, p.id,
    u.id, 'Морозова М.М.', 'FOLLOWUP', 'COMPLETED', 'SATISFACTORY',
    'Контрольная проверка после INS-00002. Все замечания устранены. '
    || 'Подмости закреплены. Инструктаж проведён (48 человек). '
    || 'Журнал нарядов-допусков оформлен правильно.',
    'Продолжить контроль. Следующая плановая проверка по графику.',
    '2026-02-15'::DATE,
    'Замечания INS-00002 устранены в полном объёме.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- Инспекция 4: БЦ Горизонт — плановая (COMPLETED)
INSERT INTO safety_inspections (
    id, number, inspection_date, project_id,
    inspector_id, inspector_name, inspection_type, status, overall_rating,
    findings, recommendations, next_inspection_date, notes, created_by
)
SELECT uuid_generate_v4(), 'INS-00004', '2026-02-01'::DATE, p.id,
    u.id, 'Морозова М.М.', 'ROUTINE', 'COMPLETED', 'SATISFACTORY',
    'Площадка БЦ "Горизонт" в хорошем состоянии. Башенный кран обслужен. '
    || 'Замечания: 1) Загромождение эвакуационного прохода на -2 уровне.',
    '1) Расчистить эвакуационный проход. '
    || '2) Нанести разметку проходов на паркинге.',
    '2026-03-01'::DATE,
    'Плановая проверка объекта.',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00002' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- Инспекция 5: Запланирована (PLANNED)
INSERT INTO safety_inspections (
    id, number, inspection_date, project_id,
    inspector_id, inspector_name, inspection_type, status,
    notes, created_by
)
SELECT uuid_generate_v4(), 'INS-00005', '2026-02-15'::DATE, p.id,
    u.id, 'Морозова М.М.', 'ROUTINE', 'PLANNED',
    'Плановая ежемесячная проверка ЖК "Солнечный".',
    'seed'
FROM projects p, users u
WHERE p.code = 'PRJ-00001' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- НАРУШЕНИЯ БЕЗОПАСНОСТИ (safety_violations)
-- =============================================================================

INSERT INTO safety_violations (
    id, inspection_id, description, severity, status,
    due_date, assigned_to_id, assigned_to_name, resolved_at, resolution, created_by
)
SELECT uuid_generate_v4(), si.id,
    'Подмости не закреплены к стене на 5 этаже секции 1',
    'HIGH', 'RESOLVED',
    '2026-02-06'::DATE, u.id, 'Сидоров С.С.',
    '2026-02-05'::TIMESTAMP WITH TIME ZONE,
    'Все подмости закреплены дюбелями к стене. Проверено.',
    'seed'
FROM safety_inspections si, users u
WHERE si.number = 'INS-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO safety_violations (
    id, inspection_id, description, severity, status,
    due_date, assigned_to_id, assigned_to_name, resolved_at, resolution, created_by
)
SELECT uuid_generate_v4(), si.id,
    'Работник не использовал страховочную привязь при работе на высоте',
    'CRITICAL', 'RESOLVED',
    '2026-02-04'::DATE, u.id, 'Сидоров С.С.',
    '2026-02-04'::TIMESTAMP WITH TIME ZONE,
    'Проведён внеплановый инструктаж. Работник отстранён на 1 день. '
    || 'Выдана новая страховочная привязь.',
    'seed'
FROM safety_inspections si, users u
WHERE si.number = 'INS-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO safety_violations (
    id, inspection_id, description, severity, status,
    due_date, assigned_to_id, assigned_to_name, created_by
)
SELECT uuid_generate_v4(), si.id,
    'Загромождение эвакуационного прохода на -2 уровне паркинга',
    'MEDIUM', 'IN_PROGRESS',
    '2026-02-08'::DATE, u.id, 'Сидоров С.С.',
    'seed'
FROM safety_inspections si, users u
WHERE si.number = 'INS-00004' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ПРОВЕРКИ КАЧЕСТВА (quality_checks)
-- =============================================================================

-- QC-001: Проверка скрытых работ — армирование фундамента (PASS)
INSERT INTO quality_checks (
    id, code, project_id, check_type, name, description,
    planned_date, actual_date, inspector_id, inspector_name,
    result, status, findings, created_by
)
SELECT uuid_generate_v4(), 'QC-00001', p.id, 'HIDDEN_WORK',
    'Приёмка скрытых работ: армирование фундаментной плиты секции 1',
    'Проверка соответствия армирования фундаментной плиты проектной документации. '
    || 'Раздел КЖ, лист 12.',
    '2025-08-15'::DATE, '2025-08-15'::DATE,
    eng.id, 'Новикова Н.Н.',
    'PASS', 'COMPLETED',
    'Армирование соответствует проекту. Защитный слой 50мм — выдержан. '
    || 'Нахлёсты арматуры в пределах нормы. Акт скрытых работ подписан.',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- QC-002: Входной контроль бетона (PASS)
INSERT INTO quality_checks (
    id, code, project_id, check_type, name, description,
    planned_date, actual_date, inspector_id, inspector_name,
    result, status, findings, created_by
)
SELECT uuid_generate_v4(), 'QC-00002', p.id, 'INCOMING_MATERIAL',
    'Входной контроль: бетон B25 W6 F150 (партия 15.01.2026)',
    'Проверка паспорта бетонной смеси, отбор проб, испытания на сжатие.',
    '2026-01-15'::DATE, '2026-01-15'::DATE,
    eng.id, 'Новикова Н.Н.',
    'PASS', 'COMPLETED',
    'Паспорт соответствует. Осадка конуса — 18см (норма 16-20). '
    || 'Образцы для испытаний отобраны (6 кубов). '
    || 'Результат на 7 сутки: 22.5 МПа (норма >17.5). '
    || 'Прогноз на 28 сутки: соответствует B25.',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- QC-003: Промежуточная проверка монолита 5 этажа (CONDITIONAL_PASS)
INSERT INTO quality_checks (
    id, code, project_id, check_type, name, description,
    planned_date, actual_date, inspector_id, inspector_name,
    result, status, findings, recommendations, created_by
)
SELECT uuid_generate_v4(), 'QC-00003', p.id, 'INTERMEDIATE_WORK',
    'Промежуточная проверка: монолитное перекрытие 5 этажа секции 1',
    'Визуальный осмотр и инструментальный контроль перекрытия после снятия опалубки.',
    '2026-02-01'::DATE, '2026-02-01'::DATE,
    eng.id, 'Новикова Н.Н.',
    'CONDITIONAL_PASS', 'COMPLETED',
    'Общее состояние удовлетворительное. Геометрия в пределах допуска. '
    || 'Замечание: каверны в зоне сопряжения колонны К-12 и перекрытия (глубина до 20мм). '
    || 'Требуется ремонтная подливка.',
    'Выполнить ремонтную подливку безусадочным составом EMACO S88. '
    || 'Повторная проверка после набора прочности.',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- QC-004: Входной контроль арматуры (PASS)
INSERT INTO quality_checks (
    id, code, project_id, check_type, name, description,
    planned_date, actual_date, inspector_id, inspector_name,
    result, status, findings, created_by
)
SELECT uuid_generate_v4(), 'QC-00004', p.id, 'INCOMING_MATERIAL',
    'Входной контроль: арматура A500С d16 (партия 05.02.2026)',
    'Проверка сертификатов, замер диаметров, визуальный контроль.',
    '2026-02-05'::DATE, '2026-02-05'::DATE,
    eng.id, 'Новикова Н.Н.',
    'PASS', 'COMPLETED',
    'Сертификат завода-изготовителя в наличии. Класс A500С подтверждён. '
    || 'Диаметры в пределах допуска (15.8-16.2мм). Коррозия отсутствует.',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- QC-005: Проверка скрытых работ — БЦ Горизонт (PASS)
INSERT INTO quality_checks (
    id, code, project_id, check_type, name, description,
    planned_date, actual_date, inspector_id, inspector_name,
    result, status, findings, created_by
)
SELECT uuid_generate_v4(), 'QC-00005', p.id, 'HIDDEN_WORK',
    'Приёмка скрытых работ: гидроизоляция -3 уровня паркинга',
    'Проверка устройства оклеечной гидроизоляции стен и пола -3 уровня.',
    '2025-11-20'::DATE, '2025-11-20'::DATE,
    eng.id, 'Новикова Н.Н.',
    'PASS', 'COMPLETED',
    'Гидроизоляция выполнена в 2 слоя (Техноэласт ЭПП + Техноэласт ЭКП). '
    || 'Нахлёсты 100мм. Примыкания к стенам заведены на 300мм. '
    || 'Целостность покрытия подтверждена.',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00002' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- QC-006: Запланированная лабораторная проверка (PLANNED)
INSERT INTO quality_checks (
    id, code, project_id, check_type, name, description,
    planned_date, inspector_id, inspector_name,
    result, status, created_by
)
SELECT uuid_generate_v4(), 'QC-00006', p.id, 'LABORATORY',
    'Лабораторные испытания бетона: кубиковая прочность (28 суток)',
    'Испытание образцов бетона B25 от 15.01.2026 на сжатие (28 суток).',
    '2026-02-12'::DATE,
    eng.id, 'Новикова Н.Н.',
    'PENDING', 'PLANNED',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ПАНЧ-ЛИСТЫ (punch_lists) и ЗАМЕЧАНИЯ (punch_items)
-- =============================================================================

-- Панч-лист 1: Секция 1, этажи 1-3 (IN_PROGRESS)
INSERT INTO punch_lists (
    id, project_id, code, name, created_by_id, due_date, status,
    completion_percent, area_or_zone, created_by
)
SELECT uuid_generate_v4(), p.id, 'PL-00001',
    'Замечания по секции 1, этажи 1-3',
    eng.id, '2026-03-15'::DATE, 'IN_PROGRESS',
    40, 'Секция 1, этажи 1-3',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

-- Замечания к PL-00001
INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, created_by)
SELECT uuid_generate_v4(), pl.id, 1,
    'Каверны в бетоне колонны К-12 на стыке с перекрытием',
    'Секция 1, 3 этаж, ось В-5', 'Монолит', 'HIGH', 'IN_PROGRESS',
    u.id, '2026-02-20'::DATE, 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, created_by)
SELECT uuid_generate_v4(), pl.id, 2,
    'Трещина в перекрытии 3 этажа (связано с ISS-002)',
    'Секция 1, 3 этаж, ось В-5/6', 'Монолит', 'CRITICAL', 'OPEN',
    u.id, '2026-02-28'::DATE, 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, fixed_at, created_by)
SELECT uuid_generate_v4(), pl.id, 3,
    'Неровность стяжки пола (перепад >5мм на 2м)',
    'Секция 1, 1 этаж, вестибюль', 'Отделка', 'MEDIUM', 'FIXED',
    u.id, '2026-02-10'::DATE, NOW() - INTERVAL '5 days', 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, fixed_at, verified_by_id, verified_at, created_by)
SELECT uuid_generate_v4(), pl.id, 4,
    'Отсутствие закладных деталей для перил лестницы',
    'Секция 1, 2 этаж, лестничная клетка', 'Монолит', 'HIGH', 'VERIFIED',
    foreman.id, '2026-01-25'::DATE, NOW() - INTERVAL '20 days',
    eng.id, NOW() - INTERVAL '18 days', 'seed'
FROM punch_lists pl, users foreman, users eng
WHERE pl.code = 'PL-00001' AND foreman.email = 'sidorov@stroyinvest.ru' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, created_by)
SELECT uuid_generate_v4(), pl.id, 5,
    'Не заделаны монтажные отверстия в перекрытии 2 этажа',
    'Секция 1, 2 этаж, помещения 201-205', 'Монолит', 'MEDIUM', 'OPEN',
    u.id, '2026-02-25'::DATE, 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- Панч-лист 2: БЦ Горизонт, подземная часть (IN_PROGRESS)
INSERT INTO punch_lists (
    id, project_id, code, name, created_by_id, due_date, status,
    completion_percent, area_or_zone, created_by
)
SELECT uuid_generate_v4(), p.id, 'PL-00002',
    'Замечания по подземной части БЦ "Горизонт"',
    eng.id, '2026-03-31'::DATE, 'IN_PROGRESS',
    25, 'Подземная часть (-3, -2, -1 уровни)',
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00002' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, created_by)
SELECT uuid_generate_v4(), pl.id, 1,
    'Протечка через холодный шов в стене -3 уровня',
    'Паркинг -3 уровень, ось Д-8', 'Гидроизоляция', 'CRITICAL', 'IN_PROGRESS',
    u.id, '2026-02-20'::DATE, 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, created_by)
SELECT uuid_generate_v4(), pl.id, 2,
    'Недостаточный уклон пола к трапам в -2 уровне',
    'Паркинг -2 уровень, зона А', 'Полы', 'HIGH', 'OPEN',
    u.id, '2026-03-01'::DATE, 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, fixed_at, created_by)
SELECT uuid_generate_v4(), pl.id, 3,
    'Сколы защитного слоя на колоннах КЗ-5, КЗ-6',
    'Паркинг -1 уровень', 'Монолит', 'MEDIUM', 'FIXED',
    u.id, '2026-02-10'::DATE, NOW() - INTERVAL '4 days', 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO punch_items (id, punch_list_id, number, description, location, category, priority, status, assigned_to_id, fix_deadline, created_by)
SELECT uuid_generate_v4(), pl.id, 4,
    'Отклонение стены от вертикали на 22мм (допуск 15мм)',
    'Паркинг -2 уровень, ось Б-3/4', 'Монолит', 'HIGH', 'OPEN',
    u.id, '2026-03-15'::DATE, 'seed'
FROM punch_lists pl, users u WHERE pl.code = 'PL-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- НЕСООТВЕТСТВИЯ (non_conformances)
-- =============================================================================

-- NCR-001: Каверны в бетоне
INSERT INTO non_conformances (
    id, code, quality_check_id, project_id,
    severity, description, root_cause, corrective_action, preventive_action,
    status, responsible_id, due_date, cost, created_by
)
SELECT uuid_generate_v4(), 'NCR-00001', qc.id, p.id,
    'MINOR',
    'Каверны в бетоне в зоне сопряжения колонны К-12 и перекрытия 5 этажа. '
    || 'Глубина до 20мм, площадь ~0.3 м2.',
    'Недостаточное вибрирование бетонной смеси при укладке в стеснённых условиях.',
    'Ремонтная подливка безусадочным составом EMACO S88. '
    || 'Выполнено 08.02.2026.',
    'Усилить контроль вибрирования при бетонировании узлов. '
    || 'Дополнительный инструктаж бригады.',
    'VERIFIED', foreman.id, '2026-02-15'::DATE, 35000.00,
    'seed'
FROM projects p, quality_checks qc, users foreman
WHERE p.code = 'PRJ-00001'
  AND qc.code = 'QC-00003'
  AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- NCR-002: Трещина в перекрытии (расследуется)
INSERT INTO non_conformances (
    id, code, project_id,
    severity, description, root_cause,
    status, responsible_id, due_date, created_by
)
SELECT uuid_generate_v4(), 'NCR-00002', p.id,
    'MAJOR',
    'Усадочная трещина в монолитном перекрытии 3 этажа секции 1. '
    || 'Длина ~1.5м, ширина раскрытия 0.3мм. Расположение — по оси В-5/6.',
    'Предварительно: нарушение режима ухода за бетоном в зимних условиях. '
    || 'Ожидается заключение проектировщика.',
    'INVESTIGATING', foreman.id, '2026-02-28'::DATE,
    'seed'
FROM projects p, users foreman
WHERE p.code = 'PRJ-00001' AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

COMMIT;
