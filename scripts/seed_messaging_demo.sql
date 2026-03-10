-- ===================================================================
-- SEED DATA: Messaging module — channels, members, messages, reactions
-- Requires: users, organizations already seeded
-- Idempotent: uses ON CONFLICT DO NOTHING
-- ===================================================================

-- Get the admin user and organization
DO $$
DECLARE
    v_admin_id UUID;
    v_org_id UUID;
    v_user2_id UUID;
    v_user3_id UUID;
    v_ch_general UUID := 'a0000000-0000-4000-a000-000000000c01';
    v_ch_project UUID := 'a0000000-0000-4000-a000-000000000c02';
    v_ch_finance UUID := 'a0000000-0000-4000-a000-000000000c03';
    v_ch_safety  UUID := 'a0000000-0000-4000-a000-000000000c04';
    v_ch_supply  UUID := 'a0000000-0000-4000-a000-000000000c05';
BEGIN
    -- Find admin
    SELECT id, organization_id INTO v_admin_id, v_org_id
    FROM users WHERE email = 'admin@privod.ru' LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'Admin user not found, skipping messaging seed';
        RETURN;
    END IF;

    -- Find or create additional users
    SELECT id INTO v_user2_id FROM users
    WHERE organization_id = v_org_id AND email != 'admin@privod.ru'
    ORDER BY created_at LIMIT 1;

    SELECT id INTO v_user3_id FROM users
    WHERE organization_id = v_org_id AND email != 'admin@privod.ru'
      AND (v_user2_id IS NULL OR id != v_user2_id)
    ORDER BY created_at LIMIT 1 OFFSET 1;

    -- Fallback: use admin as both if no other users
    IF v_user2_id IS NULL THEN v_user2_id := v_admin_id; END IF;
    IF v_user3_id IS NULL THEN v_user3_id := v_admin_id; END IF;

    -- ─── Channels ───
    INSERT INTO channels (id, code, name, description, channel_type, creator_id, member_count, last_message_at, is_pinned, is_archived, created_at, updated_at, deleted)
    VALUES
        (v_ch_general, 'CH-00001', 'Общий', 'Общий канал для всей команды. Новости, объявления, вопросы.', 'PUBLIC', v_admin_id, 3, NOW() - INTERVAL '5 minutes', false, false, NOW() - INTERVAL '30 days', NOW(), false),
        (v_ch_project, 'CH-00002', 'ЖК Солнечный — стройка', 'Оперативная координация строительства ЖК Солнечный', 'PUBLIC', v_admin_id, 3, NOW() - INTERVAL '10 minutes', false, false, NOW() - INTERVAL '25 days', NOW(), false),
        (v_ch_finance, 'CH-00003', 'Финансы и бюджет', 'Обсуждение бюджетов, счетов, оплат', 'PRIVATE', v_admin_id, 2, NOW() - INTERVAL '1 hour', false, false, NOW() - INTERVAL '20 days', NOW(), false),
        (v_ch_safety,  'CH-00004', 'Охрана труда', 'Вопросы безопасности на объектах, инструктажи, происшествия', 'PUBLIC', v_admin_id, 3, NOW() - INTERVAL '2 hours', false, false, NOW() - INTERVAL '15 days', NOW(), false),
        (v_ch_supply,  'CH-00005', 'Снабжение', 'Заявки на материалы, логистика, склад', 'PUBLIC', v_admin_id, 2, NOW() - INTERVAL '30 minutes', false, false, NOW() - INTERVAL '10 days', NOW(), false)
    ON CONFLICT (id) DO NOTHING;

    -- ─── Channel members ───
    INSERT INTO channel_members (id, channel_id, user_id, user_name, role, joined_at, is_muted, unread_count, created_at, updated_at, deleted)
    VALUES
        -- Общий
        (gen_random_uuid(), v_ch_general, v_admin_id, 'Администратор', 'OWNER', NOW() - INTERVAL '30 days', false, 0, NOW() - INTERVAL '30 days', NOW(), false),
        (gen_random_uuid(), v_ch_general, v_user2_id, 'Иванов И.И.', 'MEMBER', NOW() - INTERVAL '29 days', false, 2, NOW() - INTERVAL '29 days', NOW(), false),
        (gen_random_uuid(), v_ch_general, v_user3_id, 'Петров П.П.', 'MEMBER', NOW() - INTERVAL '28 days', false, 1, NOW() - INTERVAL '28 days', NOW(), false),
        -- ЖК Солнечный
        (gen_random_uuid(), v_ch_project, v_admin_id, 'Администратор', 'OWNER', NOW() - INTERVAL '25 days', false, 0, NOW() - INTERVAL '25 days', NOW(), false),
        (gen_random_uuid(), v_ch_project, v_user2_id, 'Иванов И.И.', 'MEMBER', NOW() - INTERVAL '24 days', false, 0, NOW() - INTERVAL '24 days', NOW(), false),
        (gen_random_uuid(), v_ch_project, v_user3_id, 'Петров П.П.', 'MEMBER', NOW() - INTERVAL '23 days', false, 3, NOW() - INTERVAL '23 days', NOW(), false),
        -- Финансы
        (gen_random_uuid(), v_ch_finance, v_admin_id, 'Администратор', 'OWNER', NOW() - INTERVAL '20 days', false, 0, NOW() - INTERVAL '20 days', NOW(), false),
        (gen_random_uuid(), v_ch_finance, v_user2_id, 'Иванов И.И.', 'MEMBER', NOW() - INTERVAL '19 days', false, 1, NOW() - INTERVAL '19 days', NOW(), false),
        -- Охрана труда
        (gen_random_uuid(), v_ch_safety, v_admin_id, 'Администратор', 'OWNER', NOW() - INTERVAL '15 days', false, 0, NOW() - INTERVAL '15 days', NOW(), false),
        (gen_random_uuid(), v_ch_safety, v_user2_id, 'Иванов И.И.', 'MEMBER', NOW() - INTERVAL '14 days', false, 0, NOW() - INTERVAL '14 days', NOW(), false),
        (gen_random_uuid(), v_ch_safety, v_user3_id, 'Петров П.П.', 'MEMBER', NOW() - INTERVAL '13 days', false, 0, NOW() - INTERVAL '13 days', NOW(), false),
        -- Снабжение
        (gen_random_uuid(), v_ch_supply, v_admin_id, 'Администратор', 'OWNER', NOW() - INTERVAL '10 days', false, 0, NOW() - INTERVAL '10 days', NOW(), false),
        (gen_random_uuid(), v_ch_supply, v_user2_id, 'Иванов И.И.', 'MEMBER', NOW() - INTERVAL '9 days', false, 0, NOW() - INTERVAL '9 days', NOW(), false)
    ON CONFLICT DO NOTHING;

    -- ─── Messages in "Общий" channel ───
    INSERT INTO messages (id, channel_id, author_id, author_name, content, message_type, is_edited, is_pinned, pinned_by, pinned_at, reaction_count, reply_count, created_at, updated_at, deleted)
    VALUES
        ('b0000000-0000-4000-b000-000000000001'::uuid, v_ch_general, v_admin_id, 'Администратор',
         'Добро пожаловать в общий канал! Здесь мы обсуждаем все организационные вопросы.', 'SYSTEM',
         false, true, v_admin_id, NOW() - INTERVAL '29 days', 0, 0, NOW() - INTERVAL '30 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000002'::uuid, v_ch_general, v_admin_id, 'Администратор',
         'Коллеги, напоминаю — еженедельная планёрка каждый понедельник в 10:00. Ссылка на видеозвонок будет в канале.', 'TEXT',
         false, true, v_admin_id, NOW() - INTERVAL '25 days', 2, 0, NOW() - INTERVAL '28 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000003'::uuid, v_ch_general, v_user2_id, 'Иванов И.И.',
         'Принято! А протоколы прошлых планёрок где можно посмотреть?', 'TEXT',
         false, false, null, null, 1, 0, NOW() - INTERVAL '28 days' + INTERVAL '30 minutes', NOW(), false),

        ('b0000000-0000-4000-b000-000000000004'::uuid, v_ch_general, v_admin_id, 'Администратор',
         'Протоколы хранятся в разделе "Документы" → папка "Протоколы совещаний". Доступ у всех менеджеров.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '28 days' + INTERVAL '45 minutes', NOW(), false),

        ('b0000000-0000-4000-b000-000000000005'::uuid, v_ch_general, v_user3_id, 'Петров П.П.',
         'Добрый день! Когда ожидается поставка арматуры на объект ЖК Солнечный? Нужно планировать работы.', 'TEXT',
         false, false, null, null, 0, 2, NOW() - INTERVAL '5 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000006'::uuid, v_ch_general, v_admin_id, 'Администратор',
         'По арматуре — поставка запланирована на следующий вторник. Детали в канале "Снабжение".', 'TEXT',
         false, false, null, null, 1, 0, NOW() - INTERVAL '5 days' + INTERVAL '15 minutes', NOW(), false),

        ('b0000000-0000-4000-b000-000000000007'::uuid, v_ch_general, v_user2_id, 'Иванов И.И.',
         '👍 Спасибо за оперативный ответ!', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '5 days' + INTERVAL '20 minutes', NOW(), false),

        -- Thread replies to message 5
        ('b0000000-0000-4000-b000-000000000008'::uuid, v_ch_general, v_admin_id, 'Администратор',
         'Уточню у поставщика точное время и напишу сюда.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '5 days' + INTERVAL '5 minutes', NOW(), false),

        ('b0000000-0000-4000-b000-000000000009'::uuid, v_ch_general, v_user3_id, 'Петров П.П.',
         'Хорошо, жду. Нам важно знать заранее, чтобы подготовить площадку.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes', NOW(), false)
    ON CONFLICT (id) DO NOTHING;

    -- Set parent_message_id for thread replies
    UPDATE messages SET parent_message_id = 'b0000000-0000-4000-b000-000000000005'::uuid
    WHERE id IN ('b0000000-0000-4000-b000-000000000008'::uuid, 'b0000000-0000-4000-b000-000000000009'::uuid)
      AND parent_message_id IS NULL;

    -- ─── Messages in "ЖК Солнечный — стройка" channel ───
    INSERT INTO messages (id, channel_id, author_id, author_name, content, message_type, is_edited, is_pinned, pinned_by, pinned_at, reaction_count, reply_count, created_at, updated_at, deleted)
    VALUES
        ('b0000000-0000-4000-b000-000000000010'::uuid, v_ch_project, v_admin_id, 'Администратор',
         'Канал создан для координации работ на объекте ЖК Солнечный. Адрес: г. Москва, ул. Строителей, 15.', 'SYSTEM',
         false, true, v_admin_id, NOW() - INTERVAL '24 days', 0, 0, NOW() - INTERVAL '25 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000011'::uuid, v_ch_project, v_user2_id, 'Иванов И.И.',
         'Сегодня завершили монолитные работы на 3-м этаже секции А. Бетон B25, объём 85 м³. Акт скрытых работ подписан.', 'TEXT',
         false, false, null, null, 3, 0, NOW() - INTERVAL '3 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000012'::uuid, v_ch_project, v_user3_id, 'Петров П.П.',
         'Отлично! Когда можно начинать кладку? Нужно минимум 3 дня на набор прочности.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '3 days' + INTERVAL '1 hour', NOW(), false),

        ('b0000000-0000-4000-b000-000000000013'::uuid, v_ch_project, v_admin_id, 'Администратор',
         'По графику кладка начинается в четверг. Кирпич уже на площадке — 45 000 шт. Раствор заказан.', 'TEXT',
         false, false, null, null, 2, 0, NOW() - INTERVAL '2 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000014'::uuid, v_ch_project, v_user2_id, 'Иванов И.И.',
         'Внимание! Завтра ожидается дождь. Нужно укрыть свежий бетон плёнкой. Ответственный — бригадир Сидоров.', 'TEXT',
         false, true, v_admin_id, NOW() - INTERVAL '1 day', 1, 0, NOW() - INTERVAL '1 day', NOW(), false),

        ('b0000000-0000-4000-b000-000000000015'::uuid, v_ch_project, v_user3_id, 'Петров П.П.',
         'Краны работают без замечаний. Вчера выполнили 12 подъёмов. График монтажа выдерживаем.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '10 minutes', NOW(), false)
    ON CONFLICT (id) DO NOTHING;

    -- ─── Messages in "Финансы и бюджет" channel ───
    INSERT INTO messages (id, channel_id, author_id, author_name, content, message_type, is_edited, is_pinned, pinned_by, pinned_at, reaction_count, reply_count, created_at, updated_at, deleted)
    VALUES
        ('b0000000-0000-4000-b000-000000000020'::uuid, v_ch_finance, v_admin_id, 'Администратор',
         'Бюджет на март утверждён. Общий лимит — 15 450 000 ₽. Детализация по статьям в разделе "Финансы".', 'TEXT',
         false, true, v_admin_id, NOW() - INTERVAL '10 days', 1, 0, NOW() - INTERVAL '15 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000021'::uuid, v_ch_finance, v_user2_id, 'Иванов И.И.',
         'Нужно согласовать счёт от ООО "СтройМатериалы" на 2 340 000 ₽ за арматуру. Срок оплаты — до 15-го.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '3 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000022'::uuid, v_ch_finance, v_admin_id, 'Администратор',
         'Счёт проверил. Цены соответствуют договору. Отправляю на оплату. Платёж уйдёт завтра.', 'TEXT',
         false, false, null, null, 1, 0, NOW() - INTERVAL '2 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000023'::uuid, v_ch_finance, v_admin_id, 'Администратор',
         'Кэш-флоу на апрель: прогнозируемый дефицит 800 000 ₽ во второй декаде. Нужно перенести оплату субподрядчикам.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '1 hour', NOW(), false)
    ON CONFLICT (id) DO NOTHING;

    -- ─── Messages in "Охрана труда" channel ───
    INSERT INTO messages (id, channel_id, author_id, author_name, content, message_type, is_edited, is_pinned, pinned_by, pinned_at, reaction_count, reply_count, created_at, updated_at, deleted)
    VALUES
        ('b0000000-0000-4000-b000-000000000030'::uuid, v_ch_safety, v_admin_id, 'Администратор',
         '⚠️ Напоминание: все работники ОБЯЗАНЫ проходить вводный инструктаж перед допуском на площадку.', 'TEXT',
         false, true, v_admin_id, NOW() - INTERVAL '14 days', 0, 0, NOW() - INTERVAL '14 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000031'::uuid, v_ch_safety, v_user2_id, 'Иванов И.И.',
         'Проведён внеплановый инструктаж по работе на высоте. Присутствовали 12 человек. Журнал подписан.', 'TEXT',
         false, false, null, null, 2, 0, NOW() - INTERVAL '7 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000032'::uuid, v_ch_safety, v_user3_id, 'Петров П.П.',
         'Обнаружено нарушение: на 2-м этаже секции Б отсутствует ограждение проёма. Фото приложено. Срок устранения — до завтра.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '3 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000033'::uuid, v_ch_safety, v_admin_id, 'Администратор',
         'Нарушение зафиксировано в журнале. Ограждение установлено. Бригадиру выдано предписание.', 'TEXT',
         false, false, null, null, 1, 0, NOW() - INTERVAL '2 hours', NOW(), false)
    ON CONFLICT (id) DO NOTHING;

    -- ─── Messages in "Снабжение" channel ───
    INSERT INTO messages (id, channel_id, author_id, author_name, content, message_type, is_edited, is_pinned, pinned_by, pinned_at, reaction_count, reply_count, created_at, updated_at, deleted)
    VALUES
        ('b0000000-0000-4000-b000-000000000040'::uuid, v_ch_supply, v_admin_id, 'Администратор',
         'Заявка на материалы оформляется через раздел "Снабжение" → "Заявки на закупку". Срок обработки — 2 рабочих дня.', 'TEXT',
         false, true, v_admin_id, NOW() - INTERVAL '9 days', 0, 0, NOW() - INTERVAL '9 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000041'::uuid, v_ch_supply, v_user2_id, 'Иванов И.И.',
         'Нужна арматура А500С ∅12 — 8 тонн, ∅16 — 5 тонн. Срок поставки — не позднее вторника.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '4 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000042'::uuid, v_ch_supply, v_admin_id, 'Администратор',
         'Заявку принял. Запросил ком. предложения у 3 поставщиков. Лучшая цена — 58 200 ₽/т у ООО "МеталлТрейд".', 'TEXT',
         false, false, null, null, 1, 0, NOW() - INTERVAL '3 days', NOW(), false),

        ('b0000000-0000-4000-b000-000000000043'::uuid, v_ch_supply, v_user2_id, 'Иванов И.И.',
         'Согласовано. Оформляйте заказ. И ещё — нужен бетон B25 W8 F200, 40 м³ на пятницу.', 'TEXT',
         false, false, null, null, 0, 0, NOW() - INTERVAL '30 minutes', NOW(), false)
    ON CONFLICT (id) DO NOTHING;

    -- ─── Reactions ───
    INSERT INTO message_reactions (id, message_id, user_id, user_name, emoji, created_at, updated_at, deleted)
    VALUES
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000002'::uuid, v_user2_id, 'Иванов И.И.', '👍', NOW() - INTERVAL '27 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000002'::uuid, v_user3_id, 'Петров П.П.', '✅', NOW() - INTERVAL '27 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000003'::uuid, v_admin_id, 'Администратор', '👌', NOW() - INTERVAL '27 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000006'::uuid, v_user3_id, 'Петров П.П.', '🙏', NOW() - INTERVAL '4 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000011'::uuid, v_admin_id, 'Администратор', '🎉', NOW() - INTERVAL '2 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000011'::uuid, v_user3_id, 'Петров П.П.', '💪', NOW() - INTERVAL '2 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000011'::uuid, v_user2_id, 'Иванов И.И.', '🎉', NOW() - INTERVAL '2 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000013'::uuid, v_user2_id, 'Иванов И.И.', '👍', NOW() - INTERVAL '1 day', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000013'::uuid, v_user3_id, 'Петров П.П.', '👍', NOW() - INTERVAL '1 day', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000014'::uuid, v_user3_id, 'Петров П.П.', '⚠️', NOW() - INTERVAL '1 day', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000020'::uuid, v_user2_id, 'Иванов И.И.', '📊', NOW() - INTERVAL '14 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000022'::uuid, v_user2_id, 'Иванов И.И.', '✅', NOW() - INTERVAL '1 day', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000031'::uuid, v_admin_id, 'Администратор', '✅', NOW() - INTERVAL '6 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000031'::uuid, v_user3_id, 'Петров П.П.', '👍', NOW() - INTERVAL '6 days', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000033'::uuid, v_user3_id, 'Петров П.П.', '✅', NOW() - INTERVAL '1 hour', NOW(), false),
        (gen_random_uuid(), 'b0000000-0000-4000-b000-000000000042'::uuid, v_user2_id, 'Иванов И.И.', '👍', NOW() - INTERVAL '2 days', NOW(), false)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Messaging seed data inserted: 5 channels, 22 messages, 16 reactions';
END $$;
