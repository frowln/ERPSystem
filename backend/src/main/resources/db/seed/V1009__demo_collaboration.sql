-- =============================================================================
-- V1009: Демо-данные collaboration stack
-- Tasks + Messaging + AI conversation traces
-- =============================================================================

BEGIN;

-- =============================================================================
-- TASKS
-- =============================================================================
INSERT INTO project_tasks (
    id, code, title, description, project_id, status, priority,
    assignee_id, assignee_name, reporter_id, reporter_name,
    planned_start_date, planned_end_date, estimated_hours, progress,
    wbs_code, tags, created_by
)
SELECT
    uuid_generate_v4(), 'TASK-00001',
    'Армирование перекрытия 7 этажа (секция 1)',
    'Подготовить карту армирования, проверить поставку арматуры d16/d20, выполнить армирование.',
    p.id, 'IN_PROGRESS', 'HIGH',
    a.id, 'Сидоров С.С.', r.id, 'Петров П.П.',
    '2026-02-10'::DATE, '2026-02-17'::DATE, 48.0, 55,
    'WBS-1.2.3', 'монолит,арматура,секция1', 'seed'
FROM projects p, users a, users r
WHERE p.code = 'PRJ-00001' AND a.email = 'sidorov@stroyinvest.ru' AND r.email = 'petrov@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_tasks (
    id, code, title, description, project_id, status, priority,
    assignee_id, assignee_name, reporter_id, reporter_name,
    planned_start_date, planned_end_date, estimated_hours, progress,
    wbs_code, tags, created_by
)
SELECT
    uuid_generate_v4(), 'TASK-00002',
    'Согласование RFI по трещине перекрытия',
    'Собрать заключение проектировщика, подготовить корректирующие мероприятия и срок устранения.',
    p.id, 'TODO', 'CRITICAL',
    a.id, 'Новикова Н.Н.', r.id, 'Петров П.П.',
    '2026-02-13'::DATE, '2026-02-20'::DATE, 24.0, 0,
    'WBS-1.2.9', 'rfi,качество,трещина', 'seed'
FROM projects p, users a, users r
WHERE p.code = 'PRJ-00001' AND a.email = 'novikova@stroyinvest.ru' AND r.email = 'petrov@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

INSERT INTO task_dependencies (id, task_id, depends_on_task_id, dependency_type)
SELECT uuid_generate_v4(), t2.id, t1.id, 'FINISH_TO_START'
FROM project_tasks t1, project_tasks t2
WHERE t1.code = 'TASK-00001' AND t2.code = 'TASK-00002'
  AND NOT EXISTS (
      SELECT 1 FROM task_dependencies d
      WHERE d.task_id = t2.id AND d.depends_on_task_id = t1.id
  );

INSERT INTO task_comments (id, task_id, author_id, author_name, content, created_by)
SELECT uuid_generate_v4(), t.id, u.id, 'Петров П.П.',
       'Фокус на сроках: закрыть до 20.02. При рисках эскалировать в PM daily.',
       'seed'
FROM project_tasks t, users u
WHERE t.code = 'TASK-00002' AND u.email = 'petrov@stroyinvest.ru'
  AND NOT EXISTS (
      SELECT 1 FROM task_comments c
      WHERE c.task_id = t.id
        AND c.content LIKE 'Фокус на сроках:%'
  );

-- =============================================================================
-- MESSAGING
-- =============================================================================
INSERT INTO channels (
    id, code, name, description, channel_type, creator_id, project_id,
    member_count, last_message_at, created_by
)
SELECT
    uuid_generate_v4(), 'CH-00001',
    'PRJ-00001 / Оперативный штаб',
    'Ежедневная коммуникация: прораб, ПТО, снабжение, финансы.',
    'PRIVATE', u.id, p.id, 4, NOW() - INTERVAL '5 minutes', 'seed'
FROM users u, projects p
WHERE u.email = 'petrov@stroyinvest.ru' AND p.code = 'PRJ-00001'
ON CONFLICT (code) DO NOTHING;

INSERT INTO channel_members (id, channel_id, user_id, user_name, role, unread_count, created_by)
SELECT uuid_generate_v4(), ch.id, u.id, 'Петров П.П.', 'OWNER', 0, 'seed'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (channel_id, user_id) DO NOTHING;

INSERT INTO channel_members (id, channel_id, user_id, user_name, role, unread_count, created_by)
SELECT uuid_generate_v4(), ch.id, u.id, 'Сидоров С.С.', 'MEMBER', 1, 'seed'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (channel_id, user_id) DO NOTHING;

INSERT INTO channel_members (id, channel_id, user_id, user_name, role, unread_count, created_by)
SELECT uuid_generate_v4(), ch.id, u.id, 'Новикова Н.Н.', 'MEMBER', 2, 'seed'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'novikova@stroyinvest.ru'
ON CONFLICT (channel_id, user_id) DO NOTHING;

INSERT INTO channel_members (id, channel_id, user_id, user_name, role, unread_count, created_by)
SELECT uuid_generate_v4(), ch.id, u.id, 'Волков В.В.', 'MEMBER', 0, 'seed'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'volkov@stroyinvest.ru'
ON CONFLICT (channel_id, user_id) DO NOTHING;

INSERT INTO messages (
    id, channel_id, author_id, author_name, content, message_type, created_by, created_at
)
SELECT uuid_generate_v4(), ch.id, u.id, 'Петров П.П.',
       'Коллеги, фокус недели: закрыть армирование 7 этажа и RFI по трещине.',
       'TEXT', 'seed', NOW() - INTERVAL '15 minutes'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'petrov@stroyinvest.ru'
  AND NOT EXISTS (
      SELECT 1 FROM messages m
      WHERE m.channel_id = ch.id
        AND m.content LIKE 'Коллеги, фокус недели:%'
  );

INSERT INTO messages (
    id, channel_id, author_id, author_name, content, message_type, created_by, created_at
)
SELECT uuid_generate_v4(), ch.id, u.id, 'Сидоров С.С.',
       'По TASK-00001 сейчас 55%, бетон планируем принимать завтра с 09:00.',
       'TEXT', 'seed', NOW() - INTERVAL '10 minutes'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'sidorov@stroyinvest.ru'
  AND NOT EXISTS (
      SELECT 1 FROM messages m
      WHERE m.channel_id = ch.id
        AND m.content LIKE 'По TASK-00001 сейчас 55%'
  );

INSERT INTO messages (
    id, channel_id, author_id, author_name, content, message_type, created_by, created_at
)
SELECT uuid_generate_v4(), ch.id, u.id, 'Новикова Н.Н.',
       'RFI проектировщику отправлен, ожидаем ответ до 17:00.',
       'TEXT', 'seed', NOW() - INTERVAL '6 minutes'
FROM channels ch, users u
WHERE ch.code = 'CH-00001' AND u.email = 'novikova@stroyinvest.ru'
  AND NOT EXISTS (
      SELECT 1 FROM messages m
      WHERE m.channel_id = ch.id
        AND m.content LIKE 'RFI проектировщику отправлен%'
  );

-- =============================================================================
-- AI CONVERSATION TRACE
-- =============================================================================
INSERT INTO ai_conversations (id, user_id, project_id, title, status, last_message_at, created_by)
SELECT uuid_generate_v4(), u.id, p.id,
       'Риск по срокам: перекрытие секции 1',
       'ACTIVE', NOW() - INTERVAL '2 minutes', 'seed'
FROM users u, projects p
WHERE u.email = 'petrov@stroyinvest.ru' AND p.code = 'PRJ-00001'
  AND NOT EXISTS (
      SELECT 1 FROM ai_conversations c
      WHERE c.user_id = u.id AND c.project_id = p.id
        AND c.title = 'Риск по срокам: перекрытие секции 1'
  );

INSERT INTO ai_messages (id, conversation_id, role, content, tokens_used, model, created_by)
SELECT uuid_generate_v4(), c.id, 'USER',
       'Оцени риск срыва срока по TASK-00001 и предложи корректирующие меры.',
       120, 'gpt-4.1', 'seed'
FROM ai_conversations c
WHERE c.title = 'Риск по срокам: перекрытие секции 1'
  AND NOT EXISTS (
      SELECT 1 FROM ai_messages m
      WHERE m.conversation_id = c.id
        AND m.role = 'USER'
        AND m.content LIKE 'Оцени риск срыва срока%'
  );

INSERT INTO ai_messages (id, conversation_id, role, content, tokens_used, model, created_by)
SELECT uuid_generate_v4(), c.id, 'ASSISTANT',
       'Текущий риск: medium-high. Рекомендации: 1) усилить смену арматурщиков на 2 человека; '
       || '2) зафиксировать поставку бетона резервным поставщиком; 3) ежедневный контроль прогресса в 18:00.',
       280, 'gpt-4.1', 'seed'
FROM ai_conversations c
WHERE c.title = 'Риск по срокам: перекрытие секции 1'
  AND NOT EXISTS (
      SELECT 1 FROM ai_messages m
      WHERE m.conversation_id = c.id
        AND m.role = 'ASSISTANT'
        AND m.content LIKE 'Текущий риск: medium-high%'
  );

COMMIT;
