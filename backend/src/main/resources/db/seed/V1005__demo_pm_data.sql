-- =============================================================================
-- V1005: Демо-данные PM Workflow
-- RFI, Submittals, Issues, Change Events, Change Orders
-- =============================================================================

BEGIN;

-- =============================================================================
-- RFI — Запросы информации
-- =============================================================================

-- RFI-001: Уточнение по армированию (ANSWERED)
INSERT INTO rfis (
    id, project_id, number, subject, question, answer, status, priority,
    assigned_to_id, responsible_id, due_date, answered_date, answered_by_id,
    cost_impact, schedule_impact, related_spec_section, created_by
)
SELECT uuid_generate_v4(), p.id, 'RFI-001',
    'Уточнение армирования плиты перекрытия на отм. +3.300',
    'На чертеже АР-12 указано армирование плиты d12 шаг 200, '
    || 'однако на чертеже КР-08 — d16 шаг 150. Какой вариант корректный? '
    || 'Прошу уточнить до начала арматурных работ.',
    'Корректный вариант — по чертежу КР-08: d16 А500С шаг 150мм в обоих направлениях. '
    || 'Чертёж АР-12 будет скорректирован. Ревизия 2 выпущена 01.02.2026.',
    'ANSWERED', 'HIGH',
    eng.id, pm.id,
    '2026-01-28'::DATE, '2026-01-30'::DATE, eng.id,
    FALSE, FALSE, 'Раздел КР, Плиты перекрытий', 'seed'
FROM projects p, users pm, users eng
WHERE p.code = 'PRJ-00001'
  AND pm.email = 'petrov@stroyinvest.ru'
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- RFI-002: Несоответствие грунтов (OPEN)
INSERT INTO rfis (
    id, project_id, number, subject, question, status, priority,
    assigned_to_id, responsible_id, due_date,
    cost_impact, schedule_impact, related_spec_section, created_by
)
SELECT uuid_generate_v4(), p.id, 'RFI-002',
    'Несоответствие грунтов основания проектным данным',
    'При вскрытии котлована секции 2 обнаружены грунты ИГЭ-4 (суглинок тугопластичный) '
    || 'вместо проектного ИГЭ-2 (песок средней крупности). Несущая способность ниже расчётной. '
    || 'Требуется решение проектировщика о возможности устройства фундаментной плиты '
    || 'без дополнительного укрепления основания.',
    'OPEN', 'CRITICAL',
    eng.id, pm.id,
    '2026-02-15'::DATE,
    TRUE, TRUE, 'Раздел ОФ, Основания и фундаменты', 'seed'
FROM projects p, users pm, users eng
WHERE p.code = 'PRJ-00001'
  AND pm.email = 'petrov@stroyinvest.ru'
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- RFI-003: Утеплитель фасада (ASSIGNED)
INSERT INTO rfis (
    id, project_id, number, subject, question, status, priority,
    assigned_to_id, responsible_id, due_date,
    cost_impact, schedule_impact, created_by
)
SELECT uuid_generate_v4(), p.id, 'RFI-003',
    'Замена утеплителя фасада на аналог',
    'Проектом предусмотрен утеплитель ROCKWOOL Фасад Баттс 100мм, '
    || 'который на данный момент отсутствует у поставщиков. Допускается ли замена '
    || 'на аналог ТЕХНОНИКОЛЬ Техновент Стандарт 100мм с аналогичными характеристиками?',
    'ASSIGNED', 'NORMAL',
    eng.id, pm.id,
    '2026-02-20'::DATE,
    FALSE, FALSE, 'seed'
FROM projects p, users pm, users eng
WHERE p.code = 'PRJ-00001'
  AND pm.email = 'petrov@stroyinvest.ru'
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- RFI-004: БЦ Горизонт — глубина заложения свай (CLOSED)
INSERT INTO rfis (
    id, project_id, number, subject, question, answer, status, priority,
    assigned_to_id, responsible_id, due_date, answered_date, answered_by_id,
    cost_impact, schedule_impact, created_by
)
SELECT uuid_generate_v4(), p.id, 'RFI-001',
    'Глубина заложения буронабивных свай по оси Г',
    'По результатам пробного бурения по оси Г скальный грунт залегает на глубине 18м '
    || 'вместо проектных 14м. Просим уточнить проектную длину свай по данной оси.',
    'Увеличить длину свай по оси Г до 19м. Ростверк без изменений. '
    || 'Выпущена корректировка чертежа КЖ-02.1 ревизия 3.',
    'CLOSED', 'HIGH',
    eng.id, pm.id,
    '2025-12-20'::DATE, '2025-12-18'::DATE, eng.id,
    TRUE, FALSE, 'seed'
FROM projects p, users pm, users eng
WHERE p.code = 'PRJ-00002'
  AND pm.email = 'petrov@stroyinvest.ru'
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- RFI-005: БЦ Горизонт — тип витража (OPEN)
INSERT INTO rfis (
    id, project_id, number, subject, question, status, priority,
    assigned_to_id, responsible_id, due_date,
    cost_impact, schedule_impact, created_by
)
SELECT uuid_generate_v4(), p.id, 'RFI-002',
    'Уточнение типа витражного остекления на отметках +70.000 - +90.000',
    'Проектом предусмотрено панорамное остекление с применением триплекса 8мм. '
    || 'На этажах 20-25 ветровая нагрузка выше расчётной для данного типа стекла. '
    || 'Требуется ли переход на триплекс 10мм или усиление алюминиевого профиля?',
    'OPEN', 'HIGH',
    eng.id, pm.id,
    '2026-02-25'::DATE,
    TRUE, FALSE, 'seed'
FROM projects p, users pm, users eng
WHERE p.code = 'PRJ-00002'
  AND pm.email = 'petrov@stroyinvest.ru'
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- RFI-006: ЖК Солнечный — гидроизоляция паркинга (DRAFT)
INSERT INTO rfis (
    id, project_id, number, subject, question, status, priority,
    assigned_to_id, due_date,
    cost_impact, schedule_impact, created_by
)
SELECT uuid_generate_v4(), p.id, 'RFI-004',
    'Тип гидроизоляции подземного паркинга',
    'Запрашиваю уточнение по типу гидроизоляции стен подземного паркинга: '
    || 'обмазочная (Пенетрон) или оклеечная (Техноэласт)?',
    'DRAFT', 'NORMAL',
    eng.id, '2026-03-01'::DATE,
    FALSE, FALSE, 'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001'
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- =============================================================================
-- RFI Ответы
-- =============================================================================
INSERT INTO rfi_responses (id, rfi_id, responder_id, response_text, is_official, responded_at, created_by)
SELECT uuid_generate_v4(), r.id, u.id,
    'Проверил по проекту. Однозначно КР-08. Армирование d16 А500С шаг 150.',
    TRUE, NOW() - INTERVAL '12 days', 'seed'
FROM rfis r, users u
WHERE r.number = 'RFI-001' AND r.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00001')
  AND u.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SUBMITTALS — Передача документов на рассмотрение
-- =============================================================================

-- Submittal 1: Шоп-дравинг арматурных каркасов (APPROVED)
INSERT INTO pm_submittals (
    id, project_id, number, title, description, submittal_type, status,
    spec_section, due_date, submitted_date, submitted_by_id, lead_time,
    created_by
)
SELECT uuid_generate_v4(), p.id, 'SUB-001',
    'Шоп-дравинг: Арматурные каркасы фундаментной плиты секции 1',
    'Рабочие чертежи арматурных каркасов фундаментной плиты секции 1, '
    || 'включая спецификацию арматуры, узлы сопряжения и схемы установки.',
    'SHOP_DRAWING', 'APPROVED',
    'КЖ — Конструкции железобетонные',
    '2025-11-15'::DATE, '2025-11-10'::DATE, eng.id, 10,
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Submittal 2: Образцы отделочных материалов (UNDER_REVIEW)
INSERT INTO pm_submittals (
    id, project_id, number, title, description, submittal_type, status,
    spec_section, due_date, submitted_date, submitted_by_id, lead_time,
    created_by
)
SELECT uuid_generate_v4(), p.id, 'SUB-002',
    'Образцы: Керамогранит для МОП и фасадная плитка',
    'Образцы отделочных материалов: '
    || '1) Керамогранит 600x600 для входных групп и холлов; '
    || '2) Клинкерная плитка для цокольной части фасада.',
    'SAMPLE', 'UNDER_REVIEW',
    'АР — Архитектурные решения',
    '2026-03-01'::DATE, '2026-02-05'::DATE, eng.id, 21,
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00001' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Submittal 3: Проектная смесь бетона (APPROVED)
INSERT INTO pm_submittals (
    id, project_id, number, title, description, submittal_type, status,
    spec_section, due_date, submitted_date, submitted_by_id, lead_time,
    created_by
)
SELECT uuid_generate_v4(), p.id, 'SUB-001',
    'Проектная смесь бетона B30 W8 F200 для монолитного каркаса',
    'Состав бетонной смеси, протоколы испытаний, '
    || 'сертификаты компонентов от АО "БетонПром".',
    'DESIGN_MIX', 'APPROVED',
    'КЖ — Конструкции железобетонные',
    '2025-04-01'::DATE, '2025-03-20'::DATE, eng.id, 14,
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00002' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Submittal 4: Спецификация лифтового оборудования (SUBMITTED)
INSERT INTO pm_submittals (
    id, project_id, number, title, description, submittal_type, status,
    spec_section, due_date, submitted_date, submitted_by_id, lead_time,
    created_by
)
SELECT uuid_generate_v4(), p.id, 'SUB-002',
    'Спецификация лифтового оборудования (8 лифтов)',
    'Техническая документация на скоростные лифты OTIS GeN2: '
    || 'характеристики, габариты шахт, требования к электропитанию.',
    'PRODUCT_DATA', 'SUBMITTED',
    'ОВ — Отопление и вентиляция',
    '2026-06-01'::DATE, '2026-02-10'::DATE, eng.id, 60,
    'seed'
FROM projects p, users eng
WHERE p.code = 'PRJ-00002' AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- =============================================================================
-- SUBMITTAL REVIEWS
-- =============================================================================
INSERT INTO pm_submittal_reviews (id, submittal_id, reviewer_id, status, comments, reviewed_at, stamp_type, created_by)
SELECT uuid_generate_v4(), s.id, u.id, 'APPROVED',
    'Армирование соответствует проекту. Утверждено к производству.',
    NOW() - INTERVAL '60 days', 'APPROVED', 'seed'
FROM pm_submittals s, users u
WHERE s.number = 'SUB-001'
  AND s.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00001')
  AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ISSUES — Проблемы/замечания проекта
-- =============================================================================

-- Issue 1: Задержка поставки арматуры (IN_PROGRESS)
INSERT INTO pm_issues (
    id, project_id, number, title, description, issue_type, status, priority,
    assigned_to_id, reported_by_id, due_date, location, created_by
)
SELECT uuid_generate_v4(), p.id, 'ISS-001',
    'Задержка поставки арматуры d32 для ростверка секции 2',
    'ООО "МеталлСнаб" задерживает поставку арматуры d32 А500С на 2 недели '
    || 'из-за отсутствия на складе. Требуемый объём: 45 тонн. '
    || 'Влияет на график армирования ростверка секции 2.',
    'COORDINATION', 'IN_PROGRESS', 'HIGH',
    supply.id, foreman.id,
    '2026-02-20'::DATE, 'Секция 2, фундамент', 'seed'
FROM projects p, users supply, users foreman
WHERE p.code = 'PRJ-00001'
  AND supply.email = 'volkov@stroyinvest.ru'
  AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Issue 2: Трещина в перекрытии (OPEN)
INSERT INTO pm_issues (
    id, project_id, number, title, description, issue_type, status, priority,
    assigned_to_id, reported_by_id, due_date, location, created_by
)
SELECT uuid_generate_v4(), p.id, 'ISS-002',
    'Трещина в монолитном перекрытии 3 этажа секции 1',
    'Обнаружена усадочная трещина длиной ~1.5м в монолитном перекрытии на отм. +9.900. '
    || 'Ширина раскрытия 0.3мм. Требуется обследование конструкции и '
    || 'заключение проектировщика о допустимости.',
    'QUALITY', 'OPEN', 'CRITICAL',
    eng.id, foreman.id,
    '2026-02-14'::DATE, 'Секция 1, 3 этаж, ось В-5/6', 'seed'
FROM projects p, users eng, users foreman
WHERE p.code = 'PRJ-00001'
  AND eng.email = 'novikova@stroyinvest.ru'
  AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Issue 3: Вода в котловане (RESOLVED)
INSERT INTO pm_issues (
    id, project_id, number, title, description, issue_type, status, priority,
    assigned_to_id, reported_by_id, due_date, resolved_date, resolved_by_id,
    resolution, location, created_by
)
SELECT uuid_generate_v4(), p.id, 'ISS-003',
    'Подтопление котлована паркинга',
    'После обильных осадков произошло подтопление котлована на глубину 0.4м. '
    || 'Работы по бетонированию приостановлены до откачки воды.',
    'CONSTRUCTION', 'RESOLVED', 'HIGH',
    foreman.id, foreman.id,
    '2026-01-20'::DATE, '2026-01-22'::DATE, foreman.id,
    'Организована водоотливная система: 3 насоса Grundfos. '
    || 'Вода откачана за 2 дня. Установлены дополнительные дренажные колодцы.',
    'Котлован паркинга', 'seed'
FROM projects p, users foreman
WHERE p.code = 'PRJ-00001'
  AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Issue 4: БЦ — отклонение колонн от вертикали (IN_PROGRESS)
INSERT INTO pm_issues (
    id, project_id, number, title, description, issue_type, status, priority,
    assigned_to_id, reported_by_id, due_date, location, created_by
)
SELECT uuid_generate_v4(), p.id, 'ISS-001',
    'Отклонение колонн от вертикали выше допуска',
    'По результатам геодезической съёмки колонны по оси Б на 5 этаже '
    || 'имеют отклонение от вертикали 18мм при допуске 15мм по СП 70.13330. '
    || 'Требуется решение по исправлению.',
    'QUALITY', 'IN_PROGRESS', 'HIGH',
    foreman.id, eng.id,
    '2026-02-18'::DATE, '5 этаж, ось Б, между 3 и 7', 'seed'
FROM projects p, users eng, users foreman
WHERE p.code = 'PRJ-00002'
  AND eng.email = 'novikova@stroyinvest.ru'
  AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Issue 5: Несогласованность ИТМ (OPEN)
INSERT INTO pm_issues (
    id, project_id, number, title, description, issue_type, status, priority,
    assigned_to_id, reported_by_id, due_date, location, created_by
)
SELECT uuid_generate_v4(), p.id, 'ISS-002',
    'Коллизия трассы ОВ и кабельных лотков на 8 этаже',
    'Трасса приточной вентиляции пересекается с кабельными лотками '
    || 'на отм. +28.800. Требуется координация между разделами ОВ и ЭО.',
    'COORDINATION', 'OPEN', 'NORMAL',
    eng.id, foreman.id,
    '2026-02-28'::DATE, '8 этаж, техническое помещение', 'seed'
FROM projects p, users eng, users foreman
WHERE p.code = 'PRJ-00002'
  AND eng.email = 'novikova@stroyinvest.ru'
  AND foreman.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- Issue 6: Безопасность — отсутствие ограждения (CLOSED)
INSERT INTO pm_issues (
    id, project_id, number, title, description, issue_type, status, priority,
    assigned_to_id, reported_by_id, due_date, resolved_date, resolved_by_id,
    resolution, location, created_by
)
SELECT uuid_generate_v4(), p.id, 'ISS-004',
    'Отсутствие временного ограждения проёмов на 7 этаже',
    'При обходе площадки обнаружено отсутствие защитных ограждений '
    || 'у оконных проёмов на 7 этаже секции 1. Нарушение СНиП 12-03-2001.',
    'SAFETY', 'CLOSED', 'CRITICAL',
    foreman.id, safety.id,
    '2026-01-15'::DATE, '2026-01-15'::DATE, foreman.id,
    'Ограждения установлены в тот же день. Проведён инструктаж бригады.',
    'Секция 1, 7 этаж', 'seed'
FROM projects p, users foreman, users safety
WHERE p.code = 'PRJ-00001'
  AND foreman.email = 'sidorov@stroyinvest.ru'
  AND safety.email = 'morozova@stroyinvest.ru'
ON CONFLICT (project_id, number) DO NOTHING;

-- =============================================================================
-- ISSUE COMMENTS
-- =============================================================================
INSERT INTO pm_issue_comments (id, issue_id, author_id, comment_text, posted_at, created_by)
SELECT uuid_generate_v4(), i.id, u.id,
    'Связался с МеталлСнаб. Обещают отгрузку до 18 февраля. '
    || 'Параллельно ищу альтернативного поставщика на случай повторной задержки.',
    NOW() - INTERVAL '3 days', 'seed'
FROM pm_issues i, users u
WHERE i.number = 'ISS-001'
  AND i.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00001')
  AND u.email = 'volkov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CHANGE EVENTS — События изменений
-- =============================================================================

-- CE-001: Изменение грунтовых условий (связано с RFI-002)
INSERT INTO change_events (
    id, project_id, number, title, description, source, status,
    identified_by_id, identified_date,
    estimated_cost_impact, estimated_schedule_impact,
    contract_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CE-001',
    'Изменение грунтовых условий под секцией 2',
    'Фактические грунты не соответствуют проектным данным. '
    || 'Требуется устройство щебёночной подушки h=800мм и буронабивных свай '
    || 'вместо плитного фундамента. Дополнительный объём работ и материалов.',
    'FIELD_CONDITION', 'UNDER_REVIEW',
    foreman.id, '2026-02-05'::DATE,
    8500000.00, 14,
    c.id, 'seed'
FROM projects p, users foreman, contracts c
WHERE p.code = 'PRJ-00001'
  AND foreman.email = 'sidorov@stroyinvest.ru'
  AND c.number = 'CTR-2025-001'
ON CONFLICT (project_id, number) DO NOTHING;

-- CE-002: Запрос заказчика на доп. помещение (БЦ Горизонт)
INSERT INTO change_events (
    id, project_id, number, title, description, source, status,
    identified_by_id, identified_date,
    estimated_cost_impact, estimated_schedule_impact,
    contract_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CE-001',
    'Перепланировка 24-25 этажей под VIP-зону',
    'Заказчик запрашивает изменение планировки 24-25 этажей: '
    || 'объединение офисных помещений в VIP-переговорные, '
    || 'панорамная терраса, отдельный лифтовой холл.',
    'OWNER_REQUEST', 'APPROVED_FOR_PRICING',
    pm.id, '2026-01-20'::DATE,
    35000000.00, 21,
    c.id, 'seed'
FROM projects p, users pm, contracts c
WHERE p.code = 'PRJ-00002'
  AND pm.email = 'petrov@stroyinvest.ru'
  AND c.number = 'CTR-2025-006'
ON CONFLICT (project_id, number) DO NOTHING;

-- CE-003: Допработы по энергоэффективности (ЖК)
INSERT INTO change_events (
    id, project_id, number, title, description, source, status,
    identified_by_id, identified_date,
    estimated_cost_impact, estimated_schedule_impact,
    contract_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CE-002',
    'Усиление теплоизоляции фасада по новым нормам',
    'С 01.01.2026 вступили в силу изменения в СП 50.13330 '
    || 'с увеличением требований к сопротивлению теплопередаче. '
    || 'Необходимо увеличить толщину утеплителя со 100мм до 150мм.',
    'REGULATORY', 'IDENTIFIED',
    eng.id, '2026-01-15'::DATE,
    4200000.00, 0,
    c.id, 'seed'
FROM projects p, users eng, contracts c
WHERE p.code = 'PRJ-00001'
  AND eng.email = 'novikova@stroyinvest.ru'
  AND c.number = 'CTR-2025-001'
ON CONFLICT (project_id, number) DO NOTHING;

-- =============================================================================
-- CHANGE ORDER REQUESTS
-- =============================================================================
INSERT INTO change_order_requests (
    id, change_event_id, project_id, number, title, description, status,
    requested_by_id, requested_date, proposed_cost, proposed_schedule_change,
    justification, created_by
)
SELECT uuid_generate_v4(), ce.id, p.id, 'COR-001',
    'Запрос на допработы: перепланировка 24-25 этажей',
    'Стоимость перепланировки включает: демонтаж перегородок, '
    || 'новые перегородки из ГКЛ на металлическом каркасе, '
    || 'устройство террасы, дополнительное остекление, отделка VIP.',
    'SUBMITTED',
    pm.id, '2026-01-25'::DATE,
    35000000.00, 21,
    'Запрос заказчика. Финансирование подтверждено письмом от 22.01.2026.', 'seed'
FROM change_events ce, projects p, users pm
WHERE ce.number = 'CE-001'
  AND p.code = 'PRJ-00002'
  AND ce.project_id = p.id
  AND pm.email = 'petrov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CHANGE ORDERS — Дополнительные соглашения
-- =============================================================================
INSERT INTO change_orders (
    id, project_id, contract_id, number, title, description,
    change_order_type, status,
    total_amount, schedule_impact_days,
    original_contract_amount, revised_contract_amount,
    created_by
)
SELECT uuid_generate_v4(), p.id, c.id, 'CO-001',
    'Доп. соглашение №1: Перепланировка VIP-зоны 24-25 этажей',
    'Дополнительные работы по перепланировке 24-25 этажей согласно запросу заказчика. '
    || 'Включает демонтаж, новые конструкции, отделку и инженерные системы.',
    'ADDITION', 'PENDING_APPROVAL',
    35000000.00, 21,
    958333333.33, 993333333.33,
    'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00002' AND c.number = 'CTR-2025-006'
ON CONFLICT (project_id, number) DO NOTHING;

-- Change Order Items
INSERT INTO change_order_items (id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_by)
SELECT uuid_generate_v4(), co.id,
    'Демонтаж существующих перегородок 24-25 этажей', 850.0000, 'м2', 1200.00, 1020000.00, 1, 'seed'
FROM change_orders co WHERE co.number = 'CO-001'
  AND co.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00002')
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_by)
SELECT uuid_generate_v4(), co.id,
    'Устройство перегородок ГКЛ двойных с шумоизоляцией', 620.0000, 'м2', 8500.00, 5270000.00, 2, 'seed'
FROM change_orders co WHERE co.number = 'CO-001'
  AND co.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00002')
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_by)
SELECT uuid_generate_v4(), co.id,
    'Устройство панорамной террасы с остеклением', 180.0000, 'м2', 95000.00, 17100000.00, 3, 'seed'
FROM change_orders co WHERE co.number = 'CO-001'
  AND co.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00002')
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_by)
SELECT uuid_generate_v4(), co.id,
    'Отделка VIP-переговорных (премиум материалы)', 440.0000, 'м2', 25250.00, 11110000.00, 4, 'seed'
FROM change_orders co WHERE co.number = 'CO-001'
  AND co.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00002')
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_by)
SELECT uuid_generate_v4(), co.id,
    'Инженерные системы VIP-зоны (климат, освещение, СКС)', 1.0000, 'комп', 500000.00, 500000.00, 5, 'seed'
FROM change_orders co WHERE co.number = 'CO-001'
  AND co.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00002')
ON CONFLICT DO NOTHING;

COMMIT;
