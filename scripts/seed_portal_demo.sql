-- =============================================================================
-- Portal Demo Seed Data
-- Run: psql -h localhost -p 15432 -U privod -d privod2 -f scripts/seed_portal_demo.sql
-- =============================================================================

-- Get first organization and admin user
DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_proj1_id UUID;
  v_proj2_id UUID;
  v_proj3_id UUID;
  v_portal_user1 UUID;
  v_portal_user2 UUID;
  v_portal_user3 UUID;
BEGIN

  -- Find existing org and admin
  SELECT id INTO v_org_id FROM organizations WHERE deleted = FALSE LIMIT 1;
  SELECT id INTO v_admin_id FROM users WHERE deleted = FALSE LIMIT 1;

  IF v_org_id IS NULL OR v_admin_id IS NULL THEN
    RAISE NOTICE 'No organization or users found. Run main seed first.';
    RETURN;
  END IF;

  -- Get first 3 projects
  SELECT id INTO v_proj1_id FROM projects WHERE organization_id = v_org_id AND deleted = FALSE ORDER BY created_at LIMIT 1;
  SELECT id INTO v_proj2_id FROM projects WHERE organization_id = v_org_id AND deleted = FALSE AND id != v_proj1_id ORDER BY created_at LIMIT 1;
  SELECT id INTO v_proj3_id FROM projects WHERE organization_id = v_org_id AND deleted = FALSE AND id != v_proj1_id AND id != COALESCE(v_proj2_id, v_proj1_id) ORDER BY created_at LIMIT 1;

  IF v_proj1_id IS NULL THEN
    RAISE NOTICE 'No projects found. Run main seed first.';
    RETURN;
  END IF;

  -- =========================================================================
  -- Portal Users (idempotent — skip if exists)
  -- =========================================================================

  -- Contractor user
  INSERT INTO portal_users (id, email, password_hash, first_name, last_name, phone, organization_id, organization_name, inn, portal_role, status, created_by)
  VALUES (
    'a0000000-0000-4000-a000-000000000001',
    'contractor@demo-portal.ru',
    '$2a$10$dummyhashcontractor1234567890abcdefgh',
    'Иванов', 'Пётр Сергеевич',
    '+7 (916) 111-22-33',
    v_org_id,
    'ООО "СтройТехМонтаж"', '7712345678',
    'CONTRACTOR', 'ACTIVE', 'system'
  ) ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE', first_name = 'Иванов', last_name = 'Пётр Сергеевич';
  SELECT id INTO v_portal_user1 FROM portal_users WHERE email = 'contractor@demo-portal.ru';

  -- Subcontractor user
  INSERT INTO portal_users (id, email, password_hash, first_name, last_name, phone, organization_id, organization_name, inn, portal_role, status, created_by)
  VALUES (
    'a0000000-0000-4000-a000-000000000002',
    'subcontractor@demo-portal.ru',
    '$2a$10$dummyhashsubcontractor12345678abcdef',
    'Сидоров', 'Алексей Михайлович',
    '+7 (926) 444-55-66',
    v_org_id,
    'ООО "ЭлектроМонтажПро"', '7798765432',
    'SUBCONTRACTOR', 'ACTIVE', 'system'
  ) ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE', first_name = 'Сидоров', last_name = 'Алексей Михайлович';
  SELECT id INTO v_portal_user2 FROM portal_users WHERE email = 'subcontractor@demo-portal.ru';

  -- Customer user
  INSERT INTO portal_users (id, email, password_hash, first_name, last_name, phone, organization_id, organization_name, inn, portal_role, status, created_by)
  VALUES (
    'a0000000-0000-4000-a000-000000000003',
    'customer@demo-portal.ru',
    '$2a$10$dummyhashcustomer1234567890abcdefghij',
    'Козлова', 'Мария Андреевна',
    '+7 (903) 777-88-99',
    v_org_id,
    'ООО "ДевелопИнвест"', '7701112233',
    'CUSTOMER', 'ACTIVE', 'system'
  ) ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE', first_name = 'Козлова', last_name = 'Мария Андреевна';
  SELECT id INTO v_portal_user3 FROM portal_users WHERE email = 'customer@demo-portal.ru';

  -- =========================================================================
  -- Portal Project Access (grant all 3 users access to projects)
  -- =========================================================================

  -- Contractor → all 3 projects (full access)
  INSERT INTO portal_projects (portal_user_id, project_id, organization_id, access_level, can_view_finance, can_view_documents, can_view_schedule, can_view_photos, granted_by_id)
  VALUES (v_portal_user1, v_proj1_id, v_org_id, 'FULL', TRUE, TRUE, TRUE, TRUE, v_admin_id)
  ON CONFLICT (portal_user_id, project_id) DO NOTHING;

  IF v_proj2_id IS NOT NULL THEN
    INSERT INTO portal_projects (portal_user_id, project_id, organization_id, access_level, can_view_finance, can_view_documents, can_view_schedule, can_view_photos, granted_by_id)
    VALUES (v_portal_user1, v_proj2_id, v_org_id, 'FULL', TRUE, TRUE, TRUE, TRUE, v_admin_id)
    ON CONFLICT (portal_user_id, project_id) DO NOTHING;
  END IF;

  IF v_proj3_id IS NOT NULL THEN
    INSERT INTO portal_projects (portal_user_id, project_id, organization_id, access_level, can_view_finance, can_view_documents, can_view_schedule, can_view_photos, granted_by_id)
    VALUES (v_portal_user1, v_proj3_id, v_org_id, 'LIMITED', FALSE, TRUE, TRUE, TRUE, v_admin_id)
    ON CONFLICT (portal_user_id, project_id) DO NOTHING;
  END IF;

  -- Subcontractor → first 2 projects
  INSERT INTO portal_projects (portal_user_id, project_id, organization_id, access_level, can_view_finance, can_view_documents, can_view_schedule, can_view_photos, granted_by_id)
  VALUES (v_portal_user2, v_proj1_id, v_org_id, 'LIMITED', FALSE, TRUE, TRUE, TRUE, v_admin_id)
  ON CONFLICT (portal_user_id, project_id) DO NOTHING;

  IF v_proj2_id IS NOT NULL THEN
    INSERT INTO portal_projects (portal_user_id, project_id, organization_id, access_level, can_view_finance, can_view_documents, can_view_schedule, can_view_photos, granted_by_id)
    VALUES (v_portal_user2, v_proj2_id, v_org_id, 'LIMITED', FALSE, TRUE, TRUE, FALSE, v_admin_id)
    ON CONFLICT (portal_user_id, project_id) DO NOTHING;
  END IF;

  -- Customer → first project (view only)
  INSERT INTO portal_projects (portal_user_id, project_id, organization_id, access_level, can_view_finance, can_view_documents, can_view_schedule, can_view_photos, granted_by_id)
  VALUES (v_portal_user3, v_proj1_id, v_org_id, 'VIEW_ONLY', TRUE, TRUE, TRUE, TRUE, v_admin_id)
  ON CONFLICT (portal_user_id, project_id) DO NOTHING;

  -- =========================================================================
  -- Portal Messages
  -- =========================================================================

  INSERT INTO portal_messages (organization_id, from_portal_user_id, to_internal_user_id, project_id, subject, content, is_read)
  VALUES
    (v_org_id, v_portal_user1, v_admin_id, v_proj1_id, 'Вопрос по графику поставки оборудования', 'Добрый день! Просим уточнить сроки поставки вентиляционного оборудования на объект. По договору поставка запланирована на 15 марта, но от поставщика нет подтверждения. Просим сообщить актуальный статус.', FALSE),
    (v_org_id, v_portal_user1, v_admin_id, v_proj1_id, 'Акт скрытых работ — монтаж фундамента', 'Направляем акт скрытых работ по монтажу фундаментной плиты секции А. Просим согласовать и подписать в течение 3 рабочих дней.', TRUE),
    (v_org_id, v_portal_user3, v_admin_id, v_proj1_id, 'Запрос фотоотчёта за февраль', 'Прошу предоставить фотоотчёт о ходе строительных работ за февраль 2026 года. Необходимо для отчёта перед инвесторами.', FALSE),
    (v_org_id, v_portal_user2, v_admin_id, v_proj1_id, 'Готовность электромонтажных работ', 'Уведомляем о завершении электромонтажных работ на 3 этаже. Готовы к приёмке. Просим назначить дату осмотра.', TRUE)
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- Portal Tasks
  -- =========================================================================

  INSERT INTO portal_tasks (organization_id, portal_user_id, project_id, title, description, status, priority, due_date)
  VALUES
    (v_org_id, v_portal_user1, v_proj1_id, 'Предоставить исполнительную документацию по фундаменту', 'Подготовить и передать ИД: акты скрытых работ, исполнительные схемы, сертификаты на материалы', 'IN_PROGRESS', 'HIGH', NOW() + INTERVAL '5 days'),
    (v_org_id, v_portal_user1, v_proj1_id, 'Устранить замечания по монтажу перегородок', 'По результатам авторского надзора выявлены отклонения от проекта в осях 3-5. Требуется устранение.', 'PENDING', 'CRITICAL', NOW() + INTERVAL '2 days'),
    (v_org_id, v_portal_user2, v_proj1_id, 'Завершить монтаж электрощитовых 4 этажа', 'Монтаж и подключение электрощитовых панелей на 4 этаже', 'IN_PROGRESS', 'MEDIUM', NOW() + INTERVAL '10 days'),
    (v_org_id, v_portal_user1, v_proj1_id, 'Согласовать график производства работ на апрель', 'Предоставить актуализированный календарный план на апрель 2026', 'PENDING', 'MEDIUM', NOW() + INTERVAL '7 days'),
    (v_org_id, v_portal_user3, v_proj1_id, 'Проверить отчёт по освоению бюджета', 'Рассмотреть и утвердить ежемесячный отчёт по освоению бюджета проекта', 'PENDING', 'LOW', NOW() + INTERVAL '14 days'),
    (v_org_id, v_portal_user1, v_proj1_id, 'Подготовить КС-2 за март', 'Сформировать акт выполненных работ за март 2026', 'COMPLETED', 'HIGH', NOW() - INTERVAL '3 days')
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- Portal KS-2 Drafts
  -- =========================================================================

  INSERT INTO portal_ks2_drafts (organization_id, portal_user_id, project_id, draft_number, status, reporting_period_start, reporting_period_end, total_amount, work_description)
  VALUES
    (v_org_id, v_portal_user1, v_proj1_id, 'КС2-001/03-2026', 'SUBMITTED', '2026-03-01', '2026-03-31', 4850000.00, 'Монтаж фундаментной плиты секции А, армирование, бетонирование М300'),
    (v_org_id, v_portal_user1, v_proj1_id, 'КС2-002/03-2026', 'DRAFT', '2026-03-01', '2026-03-31', 2100000.00, 'Кладка наружных стен 1-3 этаж, утепление фасада'),
    (v_org_id, v_portal_user1, v_proj1_id, 'КС2-003/02-2026', 'APPROVED', '2026-02-01', '2026-02-28', 6200000.00, 'Земляные работы, устройство котлована, свайное поле'),
    (v_org_id, v_portal_user2, v_proj1_id, 'КС2-ЭМ-001/03-2026', 'SUBMITTED', '2026-03-01', '2026-03-31', 1350000.00, 'Электромонтажные работы 1-3 этаж: кабельные трассы, щитовые')
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- Portal Documents (share existing project documents with portal users)
  -- =========================================================================

  -- Share existing project documents (if any) with contractor
  INSERT INTO portal_documents (organization_id, portal_user_id, project_id, document_id, shared_by_id, title, file_name, file_size)
  SELECT v_org_id, v_portal_user1, v_proj1_id, d.id, v_admin_id, d.title, d.file_name, d.file_size
  FROM documents d
  WHERE d.project_id = v_proj1_id AND d.deleted = FALSE
  LIMIT 5
  ON CONFLICT (portal_user_id, document_id) DO NOTHING;

  -- =========================================================================
  -- RFIs (Requests for Information)
  -- =========================================================================

  INSERT INTO rfis (id, project_id, organization_id, number, subject, question, status, priority, due_date, cost_impact, schedule_impact, related_spec_section, deleted)
  VALUES
    (gen_random_uuid(), v_proj1_id, v_org_id, 'RFI-001', 'Уточнение по армированию фундаментной плиты', 'В разделе КР (лист 12) указано армирование ø16 с шагом 200, но в пояснительной записке — ø14 с шагом 150. Просим уточнить корректные параметры.', 'OPEN', 'HIGH', NOW() + INTERVAL '5 days', TRUE, FALSE, 'КР', FALSE),
    (gen_random_uuid(), v_proj1_id, v_org_id, 'RFI-002', 'Согласование замены кабельной продукции', 'Кабель ВВГнг-LS 5х10 по проекту отсутствует на складе поставщика. Просим согласовать замену на ВВГнг(А)-FRLS 5х10 того же сечения.', 'ASSIGNED', 'NORMAL', NOW() + INTERVAL '3 days', TRUE, FALSE, 'ЭС', FALSE),
    (gen_random_uuid(), v_proj1_id, v_org_id, 'RFI-003', 'Расположение пожарного гидранта', 'На генплане пожарный гидрант ПГ-3 расположен в зоне проезда техники. Просим уточнить возможность переноса или организацию объезда.', 'ANSWERED', 'NORMAL', NOW() - INTERVAL '2 days', FALSE, TRUE, 'ГП', FALSE),
    (gen_random_uuid(), v_proj1_id, v_org_id, 'RFI-004', 'Тип ограждающих конструкций витража', 'В проекте АР (лист 7) указан витраж из алюминиевого профиля. Просим уточнить конкретного производителя и тип системы (Schuco, Alutech или аналог).', 'OPEN', 'CRITICAL', NOW() + INTERVAL '1 day', TRUE, TRUE, 'АР', FALSE),
    (gen_random_uuid(), v_proj1_id, v_org_id, 'RFI-005', 'Глубина заложения дренажной системы', 'Проектная отметка дренажа -2.80 м конфликтует с проходкой канализации на -2.70 м. Требуется решение по разводке.', 'CLOSED', 'LOW', NOW() - INTERVAL '10 days', FALSE, FALSE, 'ВК', FALSE)
  ON CONFLICT DO NOTHING;

  -- RFI Responses
  INSERT INTO rfi_responses (id, rfi_id, responder_id, response_text, is_official, deleted)
  SELECT gen_random_uuid(), r.id, v_admin_id, 'Гидрант ПГ-3 можно перенести на 5 метров к востоку. Обновлённый генплан направлен в приложении. Объезд техники обеспечен.', TRUE, FALSE
  FROM rfis r WHERE r.number = 'RFI-003' AND r.project_id = v_proj1_id
  ON CONFLICT DO NOTHING;

  INSERT INTO rfi_responses (id, rfi_id, responder_id, response_text, is_official, deleted)
  SELECT gen_random_uuid(), r.id, v_admin_id, 'Вопрос находится на рассмотрении у проектировщика. Ожидаемый срок ответа — 2 рабочих дня.', FALSE, FALSE
  FROM rfis r WHERE r.number = 'RFI-002' AND r.project_id = v_proj1_id
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Portal demo data seeded successfully!';
  RAISE NOTICE 'Portal users: contractor@demo-portal.ru, subcontractor@demo-portal.ru, customer@demo-portal.ru';
  RAISE NOTICE 'Projects linked: % (+ up to 2 more)', v_proj1_id;

END $$;
