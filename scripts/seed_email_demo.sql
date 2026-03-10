-- seed_email_demo.sql
-- Демо-данные для модуля «Почта» (email_messages)
-- Запуск: psql -U privod -d privod_platform -f scripts/seed_email_demo.sql

-- Очистка предыдущих seed-записей (по message_uid LIKE 'seed-%')
DELETE FROM email_project_links WHERE email_id IN (SELECT id FROM email_messages WHERE message_uid LIKE 'seed-%');
DELETE FROM email_attachments WHERE email_id IN (SELECT id FROM email_messages WHERE message_uid LIKE 'seed-%');
DELETE FROM email_messages WHERE message_uid LIKE 'seed-%';

-- 1. Письмо от заказчика — смета
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0001-4000-8000-000000000001',
  'seed-001',
  'INBOX',
  'ivanov@zakazchik.ru',
  'Иванов Пётр Сергеевич',
  'admin@privod.ru',
  NULL,
  'Согласование сметы — ЖК «Новый Горизонт»',
  'Добрый день! Направляю на согласование локальную смету по разделу ОВиК для 2-го корпуса. Прошу рассмотреть и направить замечания до 15.03.2026. С уважением, Иванов П.С.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Добрый день!</p><p>Направляю на согласование локальную смету по разделу <b>ОВиК</b> для 2-го корпуса.</p><p>Прошу рассмотреть и направить замечания до <b>15.03.2026</b>.</p><br/><p>С уважением,<br/>Иванов Пётр Сергеевич<br/>Генеральный директор<br/>ООО «Заказчик-Инвест»<br/>+7 (495) 123-45-67</p></div>',
  NOW() - INTERVAL '2 hours',
  false, false, true,
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
);

-- Вложение к письму 1
INSERT INTO email_attachments (id, email_id, file_name, content_type, size_bytes, storage_path)
VALUES (
  'b0000001-0001-4000-8000-000000000001',
  'a0000001-0001-4000-8000-000000000001',
  'ЛС_ОВиК_Корпус2_v3.xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  245760,
  '/tmp/attachments/seed/ls_ovik.xlsx'
);

-- 2. Письмо от субподрядчика — КП
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0002-4000-8000-000000000002',
  'seed-002',
  'INBOX',
  'sales@klimat-pro.ru',
  'Климат-Про — Сидорова А.В.',
  'admin@privod.ru',
  'procurement@privod.ru',
  'КП на поставку кондиционеров Daikin — 2 корпус',
  'Добрый день! Направляем коммерческое предложение на поставку VRV-систем Daikin для 2-го корпуса ЖК «Новый Горизонт». Срок поставки — 45 рабочих дней. Условия оплаты: 50% предоплата, 50% по факту поставки.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Добрый день!</p><p>Направляем коммерческое предложение на поставку <b>VRV-систем Daikin</b> для 2-го корпуса ЖК «Новый Горизонт».</p><ul><li>Срок поставки — <b>45 рабочих дней</b></li><li>Условия оплаты: 50% предоплата, 50% по факту поставки</li><li>Гарантия: 36 месяцев</li></ul><p>КП во вложении.</p><br/><p>С уважением,<br/>Сидорова Анна Валерьевна<br/>Менеджер отдела продаж<br/>ООО «Климат-Про»</p></div>',
  NOW() - INTERVAL '5 hours',
  true, true, true,
  NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'
);

INSERT INTO email_attachments (id, email_id, file_name, content_type, size_bytes, storage_path)
VALUES (
  'b0000001-0002-4000-8000-000000000002',
  'a0000001-0002-4000-8000-000000000002',
  'КП_Daikin_VRV_корпус2.pdf',
  'application/pdf',
  1572864,
  '/tmp/attachments/seed/kp_daikin.pdf'
);

-- 3. Письмо от проектировщика — замечания
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0003-4000-8000-000000000003',
  'seed-003',
  'INBOX',
  'gip@proekt-buro.ru',
  'Козлов Дмитрий Андреевич',
  'admin@privod.ru',
  'engineer@privod.ru,pto@privod.ru',
  'Re: Замечания к рабочей документации — раздел ВК',
  'Добрый день! Замечания по рабочей документации раздела ВК (водоснабжение и канализация) устранены. Обновлённый комплект загружен в CDE. Прошу подтвердить получение.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Добрый день!</p><p>Замечания по рабочей документации раздела <b>ВК</b> (водоснабжение и канализация) <span style="color:green">устранены</span>.</p><p>Обновлённый комплект загружен в CDE (папка: <code>РД/ВК/Rev.3</code>).</p><p>Прошу подтвердить получение.</p><br/><p>С уважением,<br/>Козлов Д.А., ГИП<br/>ООО «ПроектБюро»</p></div>',
  NOW() - INTERVAL '1 day',
  true, false, false,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
);

-- 4. Срочное письмо от инспекции
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0004-4000-8000-000000000004',
  'seed-004',
  'INBOX',
  'nadzor@mosstroynadzor.ru',
  'Мосстройнадзор — Отдел проверок',
  'admin@privod.ru',
  NULL,
  'Уведомление о плановой проверке от 18.03.2026',
  'Уведомляем вас о проведении плановой проверки соблюдения требований градостроительного законодательства на объекте «ЖК Новый Горизонт» (корпус 2). Дата проверки: 18.03.2026. Просьба обеспечить доступ на объект и подготовить исполнительную документацию.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Уведомляем вас о проведении <b>плановой проверки</b> соблюдения требований градостроительного законодательства на объекте «ЖК Новый Горизонт» (корпус 2).</p><p><b>Дата проверки:</b> 18.03.2026</p><p><b>Проверяющий:</b> Белов К.М., старший инспектор</p><p>Просьба обеспечить:</p><ol><li>Доступ на объект</li><li>Исполнительную документацию за последние 3 месяца</li><li>Присутствие ответственного лица</li></ol><br/><p>Отдел проверок<br/>Комитет государственного строительного надзора г. Москвы</p></div>',
  NOW() - INTERVAL '3 hours',
  false, true, false,
  NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'
);

-- 5. Письмо от бухгалтерии
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0005-4000-8000-000000000005',
  'seed-005',
  'INBOX',
  'buh@privod.ru',
  'Иванова Ольга — Бухгалтерия',
  'admin@privod.ru',
  'accountant@privod.ru',
  'Акт сверки с ООО «Климат-Про» за февраль 2026',
  'Добрый день! Направляю акт сверки взаиморасчётов с ООО «Климат-Про» за февраль 2026 г. Расхождений не выявлено. Прошу подписать и вернуть скан.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Добрый день!</p><p>Направляю акт сверки взаиморасчётов с ООО «Климат-Про» за февраль 2026 г.</p><p style="color:green;font-weight:bold">Расхождений не выявлено ✓</p><p>Прошу подписать и вернуть скан.</p><br/><p>С уважением,<br/>Иванова Ольга<br/>Главный бухгалтер<br/>ООО «Привод»</p></div>',
  NOW() - INTERVAL '1 day 4 hours',
  true, false, true,
  NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '1 day 4 hours'
);

INSERT INTO email_attachments (id, email_id, file_name, content_type, size_bytes, storage_path)
VALUES (
  'b0000001-0005-4000-8000-000000000005',
  'a0000001-0005-4000-8000-000000000005',
  'Акт_сверки_КлиматПро_февраль2026.pdf',
  'application/pdf',
  524288,
  '/tmp/attachments/seed/akt_sverki.pdf'
);

-- 6. Письмо от HR — кадровые вопросы
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0006-4000-8000-000000000006',
  'seed-006',
  'INBOX',
  'hr@privod.ru',
  'Попова Мария — HR',
  'admin@privod.ru',
  NULL,
  'Приём нового сотрудника — инженер ПТО',
  'Добрый день! Кандидат на позицию инженера ПТО (Васильев А.Н.) успешно прошёл все этапы собеседования. Планируемая дата выхода: 15.03.2026. Прошу согласовать оклад и подразделение.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Добрый день!</p><p>Кандидат на позицию <b>инженера ПТО</b> — <b>Васильев Андрей Николаевич</b> — успешно прошёл все этапы собеседования.</p><table style="border-collapse:collapse;margin:10px 0"><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Позиция</b></td><td style="padding:4px 12px;border:1px solid #ddd">Инженер ПТО</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Подразделение</b></td><td style="padding:4px 12px;border:1px solid #ddd">Отдел ПТО</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Дата выхода</b></td><td style="padding:4px 12px;border:1px solid #ddd">15.03.2026</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Предложенный оклад</b></td><td style="padding:4px 12px;border:1px solid #ddd">120 000 ₽</td></tr></table><p>Прошу согласовать.</p><br/><p>Попова Мария, HR-менеджер</p></div>',
  NOW() - INTERVAL '6 hours',
  false, false, false,
  NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
);

-- 7. Отправленное письмо
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0007-4000-8000-000000000007',
  'seed-007',
  'Sent',
  'admin@privod.ru',
  'Администратор ПРИВОД',
  'ivanov@zakazchik.ru',
  'engineer@privod.ru',
  'Re: Согласование сметы — ЖК «Новый Горизонт»',
  'Пётр Сергеевич, добрый день! Смету получили, передали в работу сметному отделу. Замечания направим до 14.03.2026.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Пётр Сергеевич, добрый день!</p><p>Смету получили, передали в работу сметному отделу. Замечания направим до <b>14.03.2026</b>.</p><br/><p>С уважением,<br/>Администратор<br/>ООО «Привод»</p></div>',
  NOW() - INTERVAL '1 hour',
  true, false, false,
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
);

-- 8. Ещё одно входящее — от поставщика материалов
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0008-4000-8000-000000000008',
  'seed-008',
  'INBOX',
  'logist@stroysnab.ru',
  'СтройСнаб — Логистика',
  'procurement@privod.ru',
  'admin@privod.ru',
  'Отгрузка арматуры А500С — партия №47',
  'Уведомляем, что партия арматуры А500С (12 мм, 25 тонн) отгружена 09.03.2026. Номер ТТН: ТТН-2026-03-0947. Ожидаемая доставка: 11.03.2026, склад объекта «ЖК Новый Горизонт».',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Уведомляем, что партия арматуры <b>А500С</b> отгружена.</p><table style="border-collapse:collapse;margin:10px 0"><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Материал</b></td><td style="padding:4px 12px;border:1px solid #ddd">Арматура А500С ø12 мм</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Объём</b></td><td style="padding:4px 12px;border:1px solid #ddd">25 тонн</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>ТТН</b></td><td style="padding:4px 12px;border:1px solid #ddd">ТТН-2026-03-0947</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Дата отгрузки</b></td><td style="padding:4px 12px;border:1px solid #ddd">09.03.2026</td></tr><tr><td style="padding:4px 12px;border:1px solid #ddd"><b>Дата доставки</b></td><td style="padding:4px 12px;border:1px solid #ddd">11.03.2026</td></tr></table><br/><p>Логистический отдел<br/>ООО «СтройСнаб»</p></div>',
  NOW() - INTERVAL '8 hours',
  true, false, false,
  NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'
);

-- 9. Письмо из банка
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0009-4000-8000-000000000009',
  'seed-009',
  'INBOX',
  'noreply@sberbank.ru',
  'Сбербанк — Корпоративные клиенты',
  'admin@privod.ru',
  NULL,
  'Банковская гарантия №БГ-2026-03821 одобрена',
  'Сообщаем, что заявка на банковскую гарантию по контракту ГК-2026/012 одобрена. Сумма: 45 000 000 руб. Срок: 12 месяцев. Подписание в личном кабинете.',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Уважаемый клиент!</p><p>Сообщаем, что заявка на банковскую гарантию одобрена:</p><ul><li><b>Номер:</b> БГ-2026-03821</li><li><b>Контракт:</b> ГК-2026/012</li><li><b>Сумма:</b> 45 000 000 ₽</li><li><b>Срок:</b> 12 месяцев</li></ul><p>Подпишите документы в <a href="#">личном кабинете</a>.</p><br/><p style="color:#888;font-size:12px">Это автоматическое уведомление, не отвечайте на него.</p></div>',
  NOW() - INTERVAL '2 days',
  true, true, false,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
);

-- 10. Черновик
INSERT INTO email_messages (id, message_uid, folder, from_address, from_name, to_addresses, cc_addresses, subject, body_text, body_html, received_at, is_read, is_starred, is_draft, has_attachments, created_at, updated_at)
VALUES (
  'a0000001-0010-4000-8000-000000000010',
  'seed-010',
  'Drafts',
  'admin@privod.ru',
  'Администратор ПРИВОД',
  'director@zakazchik.ru',
  NULL,
  'Ежемесячный отчёт о ходе строительства — март 2026',
  'Уважаемый генеральный директор! Направляю ежемесячный отчёт о ходе строительства ЖК «Новый Горизонт» за март 2026...',
  '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Уважаемый генеральный директор!</p><p>Направляю ежемесячный отчёт о ходе строительства ЖК «Новый Горизонт» за март 2026.</p><p><i>[черновик — дополнить данными]</i></p></div>',
  NOW() - INTERVAL '30 minutes',
  true, false, true, false,
  NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
);

SELECT 'Seed email_messages: 10 записей (7 inbox + 1 sent + 1 draft + 1 bank)' AS result;
