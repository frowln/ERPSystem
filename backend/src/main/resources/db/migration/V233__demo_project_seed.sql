-- =============================================================================
-- V233: Comprehensive demo project with full financial workflow
-- Project: ЖК "Солнечный Парк" — Residential construction
-- =============================================================================

-- Default org ID
DO $$
DECLARE
    org_id UUID := '00000000-0000-0000-0000-000000000001';
    admin_id UUID;

    -- Project
    proj_id UUID := 'a0000000-0001-0000-0000-000000000001';

    -- Specifications
    spec_eo_id UUID := 'a0000000-0002-0001-0000-000000000001';
    spec_ov_id UUID := 'a0000000-0002-0002-0000-000000000001';
    spec_kr_id UUID := 'a0000000-0002-0003-0000-000000000001';
    spec_vk_id UUID := 'a0000000-0002-0004-0000-000000000001';

    -- Spec items (ЭО materials)
    si_eo_cable1 UUID := 'a0000000-0003-0001-0001-000000000001';
    si_eo_cable2 UUID := 'a0000000-0003-0001-0002-000000000001';
    si_eo_lumin UUID  := 'a0000000-0003-0001-0003-000000000001';
    si_eo_switch UUID := 'a0000000-0003-0001-0004-000000000001';
    si_eo_panel UUID  := 'a0000000-0003-0001-0005-000000000001';
    si_eo_sock UUID   := 'a0000000-0003-0001-0006-000000000001';
    si_eo_tray UUID   := 'a0000000-0003-0001-0007-000000000001';
    si_eo_work1 UUID  := 'a0000000-0003-0001-0008-000000000001';
    si_eo_work2 UUID  := 'a0000000-0003-0001-0009-000000000001';
    si_eo_work3 UUID  := 'a0000000-0003-0001-000a-000000000001';

    -- Spec items (ОВ materials)
    si_ov_pipe1 UUID := 'a0000000-0003-0002-0001-000000000001';
    si_ov_pipe2 UUID := 'a0000000-0003-0002-0002-000000000001';
    si_ov_radia UUID := 'a0000000-0003-0002-0003-000000000001';
    si_ov_boil UUID  := 'a0000000-0003-0002-0004-000000000001';
    si_ov_pump UUID  := 'a0000000-0003-0002-0005-000000000001';
    si_ov_valve UUID := 'a0000000-0003-0002-0006-000000000001';
    si_ov_work1 UUID := 'a0000000-0003-0002-0007-000000000001';
    si_ov_work2 UUID := 'a0000000-0003-0002-0008-000000000001';

    -- Spec items (КР materials)
    si_kr_conc UUID  := 'a0000000-0003-0003-0001-000000000001';
    si_kr_rebar UUID := 'a0000000-0003-0003-0002-000000000001';
    si_kr_form UUID  := 'a0000000-0003-0003-0003-000000000001';
    si_kr_brick UUID := 'a0000000-0003-0003-0004-000000000001';
    si_kr_steel UUID := 'a0000000-0003-0003-0005-000000000001';
    si_kr_work1 UUID := 'a0000000-0003-0003-0006-000000000001';
    si_kr_work2 UUID := 'a0000000-0003-0003-0007-000000000001';
    si_kr_work3 UUID := 'a0000000-0003-0003-0008-000000000001';

    -- Spec items (ВК materials)
    si_vk_pipe1 UUID := 'a0000000-0003-0004-0001-000000000001';
    si_vk_pipe2 UUID := 'a0000000-0003-0004-0002-000000000001';
    si_vk_fit UUID   := 'a0000000-0003-0004-0003-000000000001';
    si_vk_pump UUID  := 'a0000000-0003-0004-0004-000000000001';
    si_vk_work1 UUID := 'a0000000-0003-0004-0005-000000000001';

    -- Budget
    bud_id UUID := 'a0000000-0004-0000-0000-000000000001';

    -- Budget sections
    bsec_eo UUID := 'a0000000-0005-0001-0000-000000000001';
    bsec_ov UUID := 'a0000000-0005-0002-0000-000000000001';
    bsec_kr UUID := 'a0000000-0005-0003-0000-000000000001';
    bsec_vk UUID := 'a0000000-0005-0004-0000-000000000001';

    -- Budget items (ЭО)
    bi_eo_cable1 UUID := 'a0000000-0006-0001-0001-000000000001';
    bi_eo_cable2 UUID := 'a0000000-0006-0001-0002-000000000001';
    bi_eo_lumin UUID  := 'a0000000-0006-0001-0003-000000000001';
    bi_eo_switch UUID := 'a0000000-0006-0001-0004-000000000001';
    bi_eo_panel UUID  := 'a0000000-0006-0001-0005-000000000001';
    bi_eo_sock UUID   := 'a0000000-0006-0001-0006-000000000001';
    bi_eo_tray UUID   := 'a0000000-0006-0001-0007-000000000001';
    bi_eo_work1 UUID  := 'a0000000-0006-0001-0008-000000000001';
    bi_eo_work2 UUID  := 'a0000000-0006-0001-0009-000000000001';
    bi_eo_work3 UUID  := 'a0000000-0006-0001-000a-000000000001';

    -- Budget items (ОВ)
    bi_ov_pipe1 UUID := 'a0000000-0006-0002-0001-000000000001';
    bi_ov_pipe2 UUID := 'a0000000-0006-0002-0002-000000000001';
    bi_ov_radia UUID := 'a0000000-0006-0002-0003-000000000001';
    bi_ov_boil UUID  := 'a0000000-0006-0002-0004-000000000001';
    bi_ov_pump UUID  := 'a0000000-0006-0002-0005-000000000001';
    bi_ov_valve UUID := 'a0000000-0006-0002-0006-000000000001';
    bi_ov_work1 UUID := 'a0000000-0006-0002-0007-000000000001';
    bi_ov_work2 UUID := 'a0000000-0006-0002-0008-000000000001';

    -- Budget items (КР)
    bi_kr_conc UUID  := 'a0000000-0006-0003-0001-000000000001';
    bi_kr_rebar UUID := 'a0000000-0006-0003-0002-000000000001';
    bi_kr_form UUID  := 'a0000000-0006-0003-0003-000000000001';
    bi_kr_brick UUID := 'a0000000-0006-0003-0004-000000000001';
    bi_kr_steel UUID := 'a0000000-0006-0003-0005-000000000001';
    bi_kr_work1 UUID := 'a0000000-0006-0003-0006-000000000001';
    bi_kr_work2 UUID := 'a0000000-0006-0003-0007-000000000001';
    bi_kr_work3 UUID := 'a0000000-0006-0003-0008-000000000001';

    -- Budget items (ВК)
    bi_vk_pipe1 UUID := 'a0000000-0006-0004-0001-000000000001';
    bi_vk_pipe2 UUID := 'a0000000-0006-0004-0002-000000000001';
    bi_vk_fit UUID   := 'a0000000-0006-0004-0003-000000000001';
    bi_vk_pump UUID  := 'a0000000-0006-0004-0004-000000000001';
    bi_vk_work1 UUID := 'a0000000-0006-0004-0005-000000000001';

    -- Contracts
    ctr_client UUID := 'a0000000-0007-0001-0000-000000000001';
    ctr_sub_eo UUID := 'a0000000-0007-0002-0000-000000000001';
    ctr_sub_ov UUID := 'a0000000-0007-0003-0000-000000000001';
    ctr_sub_kr UUID := 'a0000000-0007-0004-0000-000000000001';
    ctr_sup_cable UUID := 'a0000000-0007-0005-0000-000000000001';
    ctr_sup_pipe UUID  := 'a0000000-0007-0006-0000-000000000001';
    ctr_sup_conc UUID  := 'a0000000-0007-0007-0000-000000000001';
    ctr_sub_vk UUID := 'a0000000-0007-0008-0000-000000000001';

    -- Estimates
    est_eo UUID := 'a0000000-0008-0001-0000-000000000001';
    est_ov UUID := 'a0000000-0008-0002-0000-000000000001';
    est_kr UUID := 'a0000000-0008-0003-0000-000000000001';
    est_vk UUID := 'a0000000-0008-0004-0000-000000000001';

    -- Invoices
    inv_cable1 UUID := 'a0000000-0009-0001-0000-000000000001';
    inv_cable2 UUID := 'a0000000-0009-0002-0000-000000000001';
    inv_pipe1 UUID  := 'a0000000-0009-0003-0000-000000000001';
    inv_pipe2 UUID  := 'a0000000-0009-0004-0000-000000000001';
    inv_conc1 UUID  := 'a0000000-0009-0005-0000-000000000001';
    inv_rebar UUID  := 'a0000000-0009-0006-0000-000000000001';
    inv_lumin UUID  := 'a0000000-0009-0007-0000-000000000001';
    inv_radia UUID  := 'a0000000-0009-0008-0000-000000000001';
    inv_client1 UUID := 'a0000000-0009-0009-0000-000000000001';
    inv_client2 UUID := 'a0000000-0009-000a-0000-000000000001';

    -- Invoice lines
    il_cable1_1 UUID := 'a0000000-000a-0001-0001-000000000001';
    il_cable1_2 UUID := 'a0000000-000a-0001-0002-000000000001';
    il_cable2_1 UUID := 'a0000000-000a-0002-0001-000000000001';
    il_pipe1_1 UUID  := 'a0000000-000a-0003-0001-000000000001';
    il_pipe1_2 UUID  := 'a0000000-000a-0003-0002-000000000001';
    il_pipe2_1 UUID  := 'a0000000-000a-0004-0001-000000000001';
    il_conc1_1 UUID  := 'a0000000-000a-0005-0001-000000000001';
    il_rebar_1 UUID  := 'a0000000-000a-0006-0001-000000000001';
    il_lumin_1 UUID  := 'a0000000-000a-0007-0001-000000000001';
    il_radia_1 UUID  := 'a0000000-000a-0008-0001-000000000001';
    il_cl1_1 UUID    := 'a0000000-000a-0009-0001-000000000001';
    il_cl1_2 UUID    := 'a0000000-000a-0009-0002-000000000001';
    il_cl2_1 UUID    := 'a0000000-000a-000a-0001-000000000001';

    -- KS-2 documents
    ks2_1 UUID := 'a0000000-000b-0001-0000-000000000001';
    ks2_2 UUID := 'a0000000-000b-0002-0000-000000000001';
    ks2_3 UUID := 'a0000000-000b-0003-0000-000000000001';
    ks2_4 UUID := 'a0000000-000b-0004-0000-000000000001';
    ks2_5 UUID := 'a0000000-000b-0005-0000-000000000001';

    -- KS-3 documents
    ks3_1 UUID := 'a0000000-000c-0001-0000-000000000001';
    ks3_2 UUID := 'a0000000-000c-0002-0000-000000000001';

    -- Commercial proposals
    cp1 UUID := 'a0000000-000d-0001-0000-000000000001';

    -- Competitive lists
    cl_eo UUID := 'a0000000-000e-0001-0000-000000000001';
    cl_kr UUID := 'a0000000-000e-0002-0000-000000000001';

    -- Project sections
    ps_eo UUID := 'a0000000-000f-0001-0000-000000000001';
    ps_ov UUID := 'a0000000-000f-0002-0000-000000000001';
    ps_kr UUID := 'a0000000-000f-0003-0000-000000000001';
    ps_vk UUID := 'a0000000-000f-0004-0000-000000000001';
    ps_ar UUID := 'a0000000-000f-0005-0000-000000000001';
    ps_ss UUID := 'a0000000-000f-0006-0000-000000000001';
    ps_gs UUID := 'a0000000-000f-0007-0000-000000000001';
    ps_pb UUID := 'a0000000-000f-0008-0000-000000000001';

BEGIN
    -- Find admin user
    SELECT id INTO admin_id FROM users WHERE email = 'admin@privod.com' LIMIT 1;
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM users LIMIT 1;
    END IF;

    -- =========================================================================
    -- CLEANUP: Remove old demo/test data (preserve system data)
    -- =========================================================================
    DELETE FROM competitive_list_entries WHERE competitive_list_id IN (SELECT id FROM competitive_lists WHERE project_id = proj_id);
    DELETE FROM competitive_lists WHERE project_id = proj_id;
    DELETE FROM commercial_proposal_items WHERE proposal_id IN (SELECT id FROM commercial_proposals WHERE project_id = proj_id);
    DELETE FROM commercial_proposals WHERE project_id = proj_id;
    DELETE FROM contract_budget_items WHERE contract_id IN (SELECT id FROM contracts WHERE project_id = proj_id);
    DELETE FROM ks3_ks2_links WHERE ks3_id IN (SELECT id FROM ks3_documents WHERE project_id = proj_id);
    DELETE FROM ks2_lines WHERE ks2_id IN (SELECT id FROM ks2_documents WHERE project_id = proj_id);
    DELETE FROM ks3_documents WHERE project_id = proj_id;
    DELETE FROM ks2_documents WHERE project_id = proj_id;
    DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE project_id = proj_id);
    DELETE FROM invoices WHERE project_id = proj_id;
    DELETE FROM payments WHERE project_id = proj_id;
    DELETE FROM estimate_items WHERE project_id = proj_id;
    DELETE FROM estimates WHERE project_id = proj_id;
    DELETE FROM spec_items WHERE specification_id IN (SELECT id FROM specifications WHERE project_id = proj_id);
    DELETE FROM specifications WHERE project_id = proj_id;
    DELETE FROM budget_items WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = proj_id);
    DELETE FROM budgets WHERE project_id = proj_id;
    DELETE FROM contracts WHERE project_id = proj_id;
    DELETE FROM project_sections WHERE project_id = proj_id;
    DELETE FROM project_members WHERE project_id = proj_id;
    DELETE FROM projects WHERE id = proj_id;

    -- =========================================================================
    -- 1. PROJECT
    -- =========================================================================
    INSERT INTO projects (id, code, name, description, status, organization_id, manager_id,
        planned_start_date, planned_end_date, actual_start_date,
        address, city, region, budget_amount, contract_amount, type, category, priority,
        created_at, deleted)
    VALUES (
        proj_id, 'PRJ-DEMO-001', 'ЖК "Солнечный Парк"',
        'Жилой комплекс комфорт-класса: 3 корпуса, 240 квартир, подземный паркинг, благоустройство территории. Общая площадь 28 500 м². Генподряд с полным циклом СМР.',
        'IN_PROGRESS', org_id, admin_id,
        '2025-03-01', '2026-12-31', '2025-03-15',
        'ул. Парковая, д. 12', 'Москва', 'Московская область',
        450000000.00, 385000000.00,
        'RESIDENTIAL', 'Жилищное строительство', 'HIGH',
        NOW(), FALSE
    );

    -- =========================================================================
    -- 2. PROJECT SECTIONS (disciplines)
    -- =========================================================================
    INSERT INTO project_sections (id, organization_id, project_id, code, name, is_enabled, is_custom, sequence) VALUES
        (ps_eo, org_id, proj_id, 'ЭО',  'Электроосвещение', TRUE, FALSE, 1),
        (ps_ov, org_id, proj_id, 'ОВ',  'Отопление и вентиляция', TRUE, FALSE, 2),
        (ps_kr, org_id, proj_id, 'КР',  'Конструктивные решения', TRUE, FALSE, 3),
        (ps_vk, org_id, proj_id, 'ВК',  'Водоснабжение и канализация', TRUE, FALSE, 4),
        (ps_ar, org_id, proj_id, 'АР',  'Архитектурные решения', TRUE, FALSE, 5),
        (ps_ss, org_id, proj_id, 'СС',  'Связь и сигнализация', TRUE, FALSE, 6),
        (ps_gs, org_id, proj_id, 'ГС',  'Газоснабжение', FALSE, FALSE, 7),
        (ps_pb, org_id, proj_id, 'ПБ',  'Пожарная безопасность', TRUE, FALSE, 8);

    -- =========================================================================
    -- 3. SPECIFICATIONS (4 discipline specs)
    -- =========================================================================
    INSERT INTO specifications (id, name, project_id, organization_id, status, notes,
        created_at, deleted, doc_version, is_current) VALUES
        (spec_eo_id, 'SPEC-ЭО-001', proj_id, org_id, 'APPROVED', 'Спецификация электроосвещения — корпуса 1-3', NOW(), FALSE, 1, TRUE),
        (spec_ov_id, 'SPEC-ОВ-001', proj_id, org_id, 'APPROVED', 'Спецификация отопления и вентиляции', NOW(), FALSE, 1, TRUE),
        (spec_kr_id, 'SPEC-КР-001', proj_id, org_id, 'ACTIVE',   'Спецификация конструктивных решений', NOW(), FALSE, 1, TRUE),
        (spec_vk_id, 'SPEC-ВК-001', proj_id, org_id, 'APPROVED', 'Спецификация водоснабжения', NOW(), FALSE, 1, TRUE);

    -- =========================================================================
    -- 4. SPEC ITEMS (~30 positions across 4 disciplines)
    -- =========================================================================

    -- ЭО Materials (7 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_eo_cable1, spec_eo_id, 1, 'MATERIAL', 'Кабель ВВГнг-LS 3×2.5',        'КАБ-001', 12000, 'м',    1440000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_eo_cable2, spec_eo_id, 2, 'MATERIAL', 'Кабель ВВГнг-LS 5×4.0',        'КАБ-002', 3500,  'м',     840000, 'selected',     'approved', NOW(), FALSE, FALSE),
        (si_eo_lumin,  spec_eo_id, 3, 'MATERIAL', 'Светильник LED встраиваемый 18W', 'СВТ-001', 960,   'шт',   2880000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_eo_switch, spec_eo_id, 4, 'MATERIAL', 'Выключатель двухклавишный',      'ВЫК-001', 480,   'шт',    192000, 'in_selection', 'approved', NOW(), FALSE, FALSE),
        (si_eo_panel,  spec_eo_id, 5, 'EQUIPMENT','Щит ЩР-36 встраиваемый',         'ЩИТ-001', 24,    'шт',    576000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_eo_sock,   spec_eo_id, 6, 'MATERIAL', 'Розетка двойная с/з IP20',       'РОЗ-001', 1440,  'шт',    432000, 'in_selection', 'in_work',  NOW(), FALSE, FALSE),
        (si_eo_tray,   spec_eo_id, 7, 'MATERIAL', 'Лоток кабельный 100×50 мм',     'ЛТК-001', 2400,  'м',     960000, 'selected',     'approved', NOW(), FALSE, FALSE);

    -- ЭО Works (3 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_eo_work1, spec_eo_id, 8,  'WORK', 'Прокладка кабеля в лотках',         12000, 'м',    1800000, 'not_started', 'approved', NOW(), FALSE, FALSE),
        (si_eo_work2, spec_eo_id, 9,  'WORK', 'Монтаж светильников встраиваемых',   960,   'шт',    768000, 'not_started', 'approved', NOW(), FALSE, FALSE),
        (si_eo_work3, spec_eo_id, 10, 'WORK', 'Монтаж и подключение щитов ЩР-36',  24,    'шт',    360000, 'not_started', 'in_work',  NOW(), FALSE, FALSE);

    -- ОВ Materials (6 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_ov_pipe1, spec_ov_id, 1, 'MATERIAL', 'Труба стальная Ø 76×3.5 мм',     'ТРС-001', 1800,  'м',     2160000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_ov_pipe2, spec_ov_id, 2, 'MATERIAL', 'Труба ППР Ø 32 мм',              'ТРП-001', 4500,  'м',     1350000, 'selected',     'approved', NOW(), FALSE, FALSE),
        (si_ov_radia, spec_ov_id, 3, 'EQUIPMENT','Радиатор биметаллический 500/10',  'РАД-001', 720,   'шт',    5760000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_ov_boil,  spec_ov_id, 4, 'EQUIPMENT','Котёл газовый настенный 24 кВт',   'КОТ-001', 3,     'шт',     360000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_ov_pump,  spec_ov_id, 5, 'EQUIPMENT','Насос циркуляционный Grundfos',    'НАС-001', 12,    'шт',     720000, 'in_selection', 'approved', NOW(), FALSE, FALSE),
        (si_ov_valve, spec_ov_id, 6, 'MATERIAL', 'Клапан балансировочный Ø 32',     'КЛП-001', 240,   'шт',     480000, 'selected',     'approved', NOW(), FALSE, FALSE);

    -- ОВ Works (2 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_ov_work1, spec_ov_id, 7, 'WORK', 'Монтаж трубопроводов отопления',   6300, 'м',    3780000, 'not_started', 'approved', NOW(), FALSE, FALSE),
        (si_ov_work2, spec_ov_id, 8, 'WORK', 'Установка радиаторов отопления',   720,  'шт',   1080000, 'not_started', 'approved', NOW(), FALSE, FALSE);

    -- КР Materials (5 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_kr_conc,  spec_kr_id, 1, 'MATERIAL', 'Бетон В25 (М350) с доставкой',   'БТН-001', 4200,  'м³', 33600000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_kr_rebar, spec_kr_id, 2, 'MATERIAL', 'Арматура А500С Ø 12 мм',         'АРМ-001', 185,   'т',  11100000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_kr_form,  spec_kr_id, 3, 'EQUIPMENT','Опалубка щитовая PERI TRIO',       'ОПЛ-001', 1200,  'м²',  3600000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_kr_brick, spec_kr_id, 4, 'MATERIAL', 'Кирпич керамический М150',        'КРП-001', 280000,'шт',  3360000, 'selected',     'approved', NOW(), FALSE, FALSE),
        (si_kr_steel, spec_kr_id, 5, 'MATERIAL', 'Металлоконструкции (балки, колонны)', 'МТК-001', 120, 'т', 10800000, 'in_selection', 'approved', NOW(), FALSE, FALSE);

    -- КР Works (3 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_kr_work1, spec_kr_id, 6, 'WORK', 'Бетонирование фундаментов и перекрытий', 4200, 'м³', 12600000, 'not_started', 'approved', NOW(), FALSE, FALSE),
        (si_kr_work2, spec_kr_id, 7, 'WORK', 'Армирование конструкций',                185,  'т',   5550000, 'not_started', 'approved', NOW(), FALSE, FALSE),
        (si_kr_work3, spec_kr_id, 8, 'WORK', 'Кирпичная кладка наружных стен',         4500, 'м²',  9000000, 'not_started', 'in_work',  NOW(), FALSE, FALSE);

    -- ВК Materials (3 items)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_vk_pipe1, spec_vk_id, 1, 'MATERIAL', 'Труба ПЭ 100 SDR 17 Ø 110 мм', 'ТРВ-001', 1500,  'м',   1500000, 'ordered',      'approved', NOW(), FALSE, FALSE),
        (si_vk_pipe2, spec_vk_id, 2, 'MATERIAL', 'Труба канализационная Ø 110 мм', 'ТРК-001', 3000,  'м',   1200000, 'selected',     'approved', NOW(), FALSE, FALSE),
        (si_vk_fit,   spec_vk_id, 3, 'MATERIAL', 'Фитинги ПЭ (комплект)',          'ФТГ-001', 300,   'компл', 450000, 'in_selection', 'approved', NOW(), FALSE, FALSE);

    -- ВК Equipment (1 item)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_vk_pump,  spec_vk_id, 4, 'EQUIPMENT','Насосная станция водоснабжения',   'НСТ-001', 3,     'компл', 900000, 'ordered', 'approved', NOW(), FALSE, FALSE);

    -- ВК Works (1 item)
    INSERT INTO spec_items (id, specification_id, sequence, item_type, name, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status,
        created_at, deleted, is_customer_provided) VALUES
        (si_vk_work1, spec_vk_id, 5, 'WORK', 'Монтаж трубопроводов ВК',          4500, 'м',    2700000, 'not_started', 'approved', NOW(), FALSE, FALSE);

    -- =========================================================================
    -- 5. BUDGET (Financial Model)
    -- =========================================================================
    INSERT INTO budgets (id, name, project_id, organization_id, status, planned_revenue, planned_cost, planned_margin, actual_cost, notes,
        created_at, deleted)
    VALUES (
        bud_id, 'Бюджет ЖК "Солнечный Парк" — Основной',
        proj_id, org_id, 'ACTIVE',
        385000000.00, 310000000.00, 75000000.00, 42500000.00,
        'Основной бюджет проекта с разбивкой по разделам ЭО, ОВ, КР, ВК',
        NOW(), FALSE
    );

    -- Budget sections (is_section = true)
    INSERT INTO budget_items (id, budget_id, sequence, category, name, planned_amount, is_section, item_type, discipline_mark,
        created_at, deleted) VALUES
        (bsec_eo, bud_id, 1, 'MATERIALS', 'Раздел ЭО — Электроосвещение',        9858000,  TRUE, 'MATERIALS', 'ЭО', NOW(), FALSE),
        (bsec_ov, bud_id, 2, 'MATERIALS', 'Раздел ОВ — Отопление и вентиляция',  15690000, TRUE, 'MATERIALS', 'ОВ', NOW(), FALSE),
        (bsec_kr, bud_id, 3, 'MATERIALS', 'Раздел КР — Конструктивные решения',   89610000, TRUE, 'MATERIALS', 'КР', NOW(), FALSE),
        (bsec_vk, bud_id, 4, 'MATERIALS', 'Раздел ВК — Водоснабжение',           6750000,  TRUE, 'MATERIALS', 'ВК', NOW(), FALSE);

    -- ЭО Budget items (materials)
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_eo_cable1, bud_id, bsec_eo, 1, 'MATERIALS', 'Кабель ВВГнг-LS 3×2.5',        1440000,  'MATERIALS', FALSE, 12000, 'м',   115.00, 120.00, 130.00, 125.00, 1.04, 'ЭО', 'CONTRACTED', NOW(), FALSE),
        (bi_eo_cable2, bud_id, bsec_eo, 2, 'MATERIALS', 'Кабель ВВГнг-LS 5×4.0',         840000,  'MATERIALS', FALSE, 3500,  'м',   230.00, 240.00, 260.00, 250.00, 1.04, 'ЭО', 'CONTRACTED', NOW(), FALSE),
        (bi_eo_lumin,  bud_id, bsec_eo, 3, 'MATERIALS', 'Светильник LED встраиваемый 18W',2880000,  'MATERIALS', FALSE, 960,   'шт',  2850.00,3000.00,3200.00,3100.00,1.05, 'ЭО', 'PLANNED', NOW(), FALSE),
        (bi_eo_switch, bud_id, bsec_eo, 4, 'MATERIALS', 'Выключатель двухклавишный',       192000,  'MATERIALS', FALSE, 480,   'шт',  380.00, 400.00, 450.00, 420.00, 1.05, 'ЭО', 'PLANNED', NOW(), FALSE),
        (bi_eo_panel,  bud_id, bsec_eo, 5, 'EQUIPMENT', 'Щит ЩР-36 встраиваемый',         576000,  'MATERIALS', FALSE, 24,    'шт',  22000,  24000,  26000,  25000,  1.09, 'ЭО', 'CONTRACTED', NOW(), FALSE),
        (bi_eo_sock,   bud_id, bsec_eo, 6, 'MATERIALS', 'Розетка двойная с/з IP20',        432000,  'MATERIALS', FALSE, 1440,  'шт',  280.00, 300.00, 340.00, 320.00, 1.07, 'ЭО', 'PLANNED', NOW(), FALSE),
        (bi_eo_tray,   bud_id, bsec_eo, 7, 'MATERIALS', 'Лоток кабельный 100×50 мм',       960000, 'MATERIALS', FALSE, 2400,  'м',   380.00, 400.00, 440.00, 420.00, 1.05, 'ЭО', 'PLANNED', NOW(), FALSE);

    -- ЭО Budget items (works)
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_eo_work1, bud_id, bsec_eo, 8,  'LABOR', 'Прокладка кабеля в лотках',         1800000, 'WORKS', FALSE, 12000, 'м',   140.00, 150.00, 165.00, 160.00, 1.07, 'ЭО', 'PLANNED', NOW(), FALSE),
        (bi_eo_work2, bud_id, bsec_eo, 9,  'LABOR', 'Монтаж светильников встраиваемых',    768000, 'WORKS', FALSE, 960,   'шт',  750.00, 800.00, 880.00, 850.00, 1.07, 'ЭО', 'PLANNED', NOW(), FALSE),
        (bi_eo_work3, bud_id, bsec_eo, 10, 'LABOR', 'Монтаж и подключение щитов ЩР-36',   360000, 'WORKS', FALSE, 24,    'шт',  14000,  15000,  16500,  16000,  1.07, 'ЭО', 'PLANNED', NOW(), FALSE);

    -- ОВ Budget items (materials)
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_ov_pipe1, bud_id, bsec_ov, 1, 'MATERIALS', 'Труба стальная Ø 76×3.5 мм',     2160000, 'MATERIALS', FALSE, 1800, 'м',   1100.00, 1200.00, 1300.00, 1250.00, 1.09, 'ОВ', 'CONTRACTED', NOW(), FALSE),
        (bi_ov_pipe2, bud_id, bsec_ov, 2, 'MATERIALS', 'Труба ППР Ø 32 мм',              1350000, 'MATERIALS', FALSE, 4500, 'м',   280.00,  300.00,  330.00,  315.00,  1.07, 'ОВ', 'PLANNED', NOW(), FALSE),
        (bi_ov_radia, bud_id, bsec_ov, 3, 'EQUIPMENT', 'Радиатор биметаллический 500/10',  5760000, 'MATERIALS', FALSE, 720,  'шт',  7500.00, 8000.00, 8800.00, 8500.00, 1.07, 'ОВ', 'CONTRACTED', NOW(), FALSE),
        (bi_ov_boil,  bud_id, bsec_ov, 4, 'EQUIPMENT', 'Котёл газовый настенный 24 кВт',    360000, 'MATERIALS', FALSE, 3,    'шт',  110000,  120000,  135000,  130000,  1.09, 'ОВ', 'CONTRACTED', NOW(), FALSE),
        (bi_ov_pump,  bud_id, bsec_ov, 5, 'EQUIPMENT', 'Насос циркуляционный Grundfos',     720000, 'MATERIALS', FALSE, 12,   'шт',  55000,   60000,   66000,   64000,   1.09, 'ОВ', 'PLANNED', NOW(), FALSE),
        (bi_ov_valve, bud_id, bsec_ov, 6, 'MATERIALS', 'Клапан балансировочный Ø 32',       480000, 'MATERIALS', FALSE, 240,  'шт',  1900.00, 2000.00, 2200.00, 2100.00, 1.05, 'ОВ', 'PLANNED', NOW(), FALSE);

    -- ОВ Budget items (works)
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_ov_work1, bud_id, bsec_ov, 7, 'LABOR', 'Монтаж трубопроводов отопления', 3780000, 'WORKS', FALSE, 6300, 'м',   560.00, 600.00, 660.00, 640.00, 1.07, 'ОВ', 'PLANNED', NOW(), FALSE),
        (bi_ov_work2, bud_id, bsec_ov, 8, 'LABOR', 'Установка радиаторов отопления', 1080000, 'WORKS', FALSE, 720,  'шт',  1400.00,1500.00,1650.00,1600.00,1.07, 'ОВ', 'PLANNED', NOW(), FALSE);

    -- КР Budget items (materials)
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_kr_conc,  bud_id, bsec_kr, 1, 'MATERIALS', 'Бетон В25 (М350) с доставкой', 33600000, 'MATERIALS', FALSE, 4200, 'м³',  7500.00, 8000.00, 8800.00, 8500.00, 1.07, 'КР', 'CONTRACTED', NOW(), FALSE),
        (bi_kr_rebar, bud_id, bsec_kr, 2, 'MATERIALS', 'Арматура А500С Ø 12 мм',       11100000, 'MATERIALS', FALSE, 185,  'т',   56000,   60000,   66000,   64000,   1.07, 'КР', 'CONTRACTED', NOW(), FALSE),
        (bi_kr_form,  bud_id, bsec_kr, 3, 'EQUIPMENT', 'Опалубка щитовая PERI TRIO',      3600000, 'MATERIALS', FALSE, 1200, 'м²',  2800.00, 3000.00, 3300.00, 3200.00, 1.07, 'КР', 'CONTRACTED', NOW(), FALSE),
        (bi_kr_brick, bud_id, bsec_kr, 4, 'MATERIALS', 'Кирпич керамический М150',        3360000, 'MATERIALS', FALSE, 280000,'шт', 11.50,   12.00,   13.20,   12.80,   1.04, 'КР', 'PLANNED', NOW(), FALSE),
        (bi_kr_steel, bud_id, bsec_kr, 5, 'MATERIALS', 'Металлоконструкции (балки)',      10800000, 'MATERIALS', FALSE, 120,  'т',   85000,   90000,   99000,   96000,   1.06, 'КР', 'PLANNED', NOW(), FALSE);

    -- КР Budget items (works)
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_kr_work1, bud_id, bsec_kr, 6, 'LABOR', 'Бетонирование фундаментов и перекрытий', 12600000, 'WORKS', FALSE, 4200, 'м³',  2800.00, 3000.00, 3300.00, 3200.00, 1.07, 'КР', 'CONTRACTED', NOW(), FALSE),
        (bi_kr_work2, bud_id, bsec_kr, 7, 'LABOR', 'Армирование конструкций',                 5550000, 'WORKS', FALSE, 185,  'т',   28000,   30000,   33000,   32000,   1.07, 'КР', 'PLANNED', NOW(), FALSE),
        (bi_kr_work3, bud_id, bsec_kr, 8, 'LABOR', 'Кирпичная кладка наружных стен',          9000000, 'WORKS', FALSE, 4500, 'м²',  1850.00, 2000.00, 2200.00, 2100.00, 1.08, 'КР', 'PLANNED', NOW(), FALSE);

    -- ВК Budget items
    INSERT INTO budget_items (id, budget_id, parent_id, sequence, category, name, planned_amount, item_type, is_section, quantity, unit, cost_price, sale_price, estimate_price, customer_price, coefficient, discipline_mark, doc_status,
        created_at, deleted) VALUES
        (bi_vk_pipe1, bud_id, bsec_vk, 1, 'MATERIALS', 'Труба ПЭ 100 SDR 17 Ø 110 мм', 1500000, 'MATERIALS', FALSE, 1500, 'м',   950.00, 1000.00, 1100.00, 1050.00, 1.05, 'ВК', 'CONTRACTED', NOW(), FALSE),
        (bi_vk_pipe2, bud_id, bsec_vk, 2, 'MATERIALS', 'Труба канализационная Ø 110 мм', 1200000, 'MATERIALS', FALSE, 3000, 'м',   380.00, 400.00,  440.00,  420.00,  1.05, 'ВК', 'PLANNED', NOW(), FALSE),
        (bi_vk_fit,   bud_id, bsec_vk, 3, 'MATERIALS', 'Фитинги ПЭ (комплект)',           450000, 'MATERIALS', FALSE, 300,  'компл',1420.00,1500.00, 1650.00, 1600.00, 1.06, 'ВК', 'PLANNED', NOW(), FALSE),
        (bi_vk_pump,  bud_id, bsec_vk, 4, 'EQUIPMENT', 'Насосная станция водоснабжения',   900000, 'MATERIALS', FALSE, 3,    'компл',280000, 300000,  330000,  320000,  1.07, 'ВК', 'CONTRACTED', NOW(), FALSE),
        (bi_vk_work1, bud_id, bsec_vk, 5, 'LABOR',     'Монтаж трубопроводов ВК',         2700000, 'WORKS',    FALSE, 4500, 'м',   560.00, 600.00,  660.00,  640.00,  1.07, 'ВК', 'PLANNED', NOW(), FALSE);

    -- =========================================================================
    -- 6. CONTRACTS (8 contracts: 1 client + 4 subcontractors + 3 suppliers)
    -- =========================================================================
    INSERT INTO contracts (id, name, number, contract_date, partner_name, project_id, organization_id, status, amount, vat_rate, vat_amount, total_with_vat, planned_start_date, planned_end_date, contract_direction, notes,
        created_at, deleted) VALUES
        -- CLIENT contract (нам платят)
        (ctr_client, 'Генеральный подряд ЖК "Солнечный Парк"', 'ДОГ-2025-001', '2025-02-15',
         'ООО "СолнечныйГрад Девелопмент"', proj_id, org_id, 'ACTIVE',
         385000000.00, 20.00, 77000000.00, 462000000.00,
         '2025-03-01', '2026-12-31', 'CLIENT',
         'Генеральный подряд на строительство ЖК. Включает все виды СМР.',
         NOW(), FALSE),

        -- SUBCONTRACTOR contracts (мы платим за работы)
        (ctr_sub_eo, 'Субподряд ЭО — ООО "ЭлектроМонтаж"', 'ДОГ-2025-002', '2025-03-10',
         'ООО "ЭлектроМонтаж"', proj_id, org_id, 'ACTIVE',
         12500000.00, 20.00, 2500000.00, 15000000.00,
         '2025-04-01', '2026-06-30', 'CONTRACTOR',
         'Электромонтажные работы по разделу ЭО, корпуса 1-3',
         NOW(), FALSE),

        (ctr_sub_ov, 'Субподряд ОВ — ООО "ТеплоСтрой"', 'ДОГ-2025-003', '2025-03-15',
         'ООО "ТеплоСтрой"', proj_id, org_id, 'ACTIVE',
         18500000.00, 20.00, 3700000.00, 22200000.00,
         '2025-04-15', '2026-09-30', 'CONTRACTOR',
         'Монтаж систем отопления и вентиляции',
         NOW(), FALSE),

        (ctr_sub_kr, 'Субподряд КР — ООО "МонолитСтрой"', 'ДОГ-2025-004', '2025-03-01',
         'ООО "МонолитСтрой"', proj_id, org_id, 'ACTIVE',
         95000000.00, 20.00, 19000000.00, 114000000.00,
         '2025-03-15', '2026-10-31', 'CONTRACTOR',
         'Монолитные и кладочные работы по разделу КР',
         NOW(), FALSE),

        -- SUPPLIER contracts (мы платим за материалы)
        (ctr_sup_cable, 'Поставка кабельной продукции — ООО "КабельТорг"', 'ДОГ-2025-005', '2025-03-20',
         'ООО "КабельТорг"', proj_id, org_id, 'ACTIVE',
         2800000.00, 20.00, 560000.00, 3360000.00,
         '2025-04-01', '2025-09-30', 'CONTRACTOR',
         'Поставка кабеля ВВГнг-LS различных сечений',
         NOW(), FALSE),

        (ctr_sup_pipe, 'Поставка трубной продукции — ООО "ТрубоСнаб"', 'ДОГ-2025-006', '2025-03-25',
         'ООО "ТрубоСнаб"', proj_id, org_id, 'SIGNED',
         5200000.00, 20.00, 1040000.00, 6240000.00,
         '2025-04-15', '2025-12-31', 'CONTRACTOR',
         'Поставка стальных и ПП труб для ОВ и ВК',
         NOW(), FALSE),

        (ctr_sup_conc, 'Поставка бетона — ООО "БетонПром"', 'ДОГ-2025-007', '2025-03-05',
         'ООО "БетонПром"', proj_id, org_id, 'ACTIVE',
         35000000.00, 20.00, 7000000.00, 42000000.00,
         '2025-03-20', '2026-08-31', 'CONTRACTOR',
         'Поставка товарного бетона В25 (М350)',
         NOW(), FALSE),

        (ctr_sub_vk, 'Субподряд ВК — ООО "АкваМонтаж"', 'ДОГ-2025-008', '2025-04-01',
         'ООО "АкваМонтаж"', proj_id, org_id, 'SIGNED',
         8500000.00, 20.00, 1700000.00, 10200000.00,
         '2025-05-01', '2026-08-31', 'CONTRACTOR',
         'Монтаж систем водоснабжения и канализации',
         NOW(), FALSE);

    -- =========================================================================
    -- 7. CONTRACT ↔ BUDGET ITEM LINKS
    -- =========================================================================
    INSERT INTO contract_budget_items (contract_id, budget_item_id, allocated_quantity, allocated_amount) VALUES
        -- Cable supplier → ЭО cables
        (ctr_sup_cable, bi_eo_cable1, 12000, 1380000),
        (ctr_sup_cable, bi_eo_cable2, 3500,   805000),
        -- ЭО subcontractor → ЭО works
        (ctr_sub_eo, bi_eo_work1, 12000, 1680000),
        (ctr_sub_eo, bi_eo_work2, 960,    720000),
        (ctr_sub_eo, bi_eo_work3, 24,     336000),
        -- Pipe supplier → ОВ and ВК pipes
        (ctr_sup_pipe, bi_ov_pipe1, 1800,  1980000),
        (ctr_sup_pipe, bi_vk_pipe1, 1500,  1425000),
        -- ОВ subcontractor → ОВ works
        (ctr_sub_ov, bi_ov_work1, 6300,   3528000),
        (ctr_sub_ov, bi_ov_work2, 720,    1008000),
        -- Concrete supplier → КР concrete
        (ctr_sup_conc, bi_kr_conc, 4200,  31500000),
        -- КР subcontractor → КР works
        (ctr_sub_kr, bi_kr_work1, 4200,  11760000),
        (ctr_sub_kr, bi_kr_work2, 185,    5180000),
        (ctr_sub_kr, bi_kr_work3, 4500,   8325000),
        -- ВК subcontractor → ВК works
        (ctr_sub_vk, bi_vk_work1, 4500,   2520000);

    -- =========================================================================
    -- 8. ESTIMATES (4 discipline estimates)
    -- =========================================================================
    INSERT INTO estimates (id, name, project_id, organization_id, specification_id, status, total_amount, notes,
        created_at, deleted, invoiced_amount, ordered_amount, total_spent) VALUES
        (est_eo, 'Смета ЭО — Электроосвещение корпуса 1-3',  proj_id, org_id, spec_eo_id, 'APPROVED', 12258000, 'Сметный расчёт по разделу ЭО', NOW(), FALSE, 0, 0, 0),
        (est_ov, 'Смета ОВ — Отопление и вентиляция',         proj_id, org_id, spec_ov_id, 'APPROVED', 17550000, 'Сметный расчёт по разделу ОВ', NOW(), FALSE, 0, 0, 0),
        (est_kr, 'Смета КР — Конструктивные решения',         proj_id, org_id, spec_kr_id, 'ACTIVE',   92610000, 'Сметный расчёт по разделу КР (основной объём)', NOW(), FALSE, 0, 0, 0),
        (est_vk, 'Смета ВК — Водоснабжение и канализация',    proj_id, org_id, spec_vk_id, 'APPROVED',  7750000, 'Сметный расчёт по разделу ВК', NOW(), FALSE, 0, 0, 0);

    -- Estimate items (ЭО — linked to spec items)
    INSERT INTO estimate_items (id, estimate_id, project_id, spec_item_id, sequence, name, quantity, unit_of_measure, unit_price, unit_price_customer, amount, amount_customer,
        created_at, deleted, delivered_amount, invoiced_amount, ordered_amount) VALUES
        (gen_random_uuid(), est_eo, proj_id, si_eo_cable1, 1, 'Кабель ВВГнг-LS 3×2.5',          12000, 'м',   115.00,  130.00, 1380000,  1560000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_cable2, 2, 'Кабель ВВГнг-LS 5×4.0',           3500, 'м',   230.00,  260.00,  805000,   910000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_lumin,  3, 'Светильник LED 18W',                960, 'шт',  2850.00, 3200.00, 2736000, 3072000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_switch, 4, 'Выключатель двухклавишный',          480, 'шт',  380.00,  450.00,  182400,   216000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_panel,  5, 'Щит ЩР-36 встраиваемый',             24, 'шт',  22000,   26000,   528000,   624000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_sock,   6, 'Розетка двойная с/з IP20',          1440, 'шт',  280.00,  340.00,  403200,   489600, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_tray,   7, 'Лоток кабельный 100×50 мм',        2400, 'м',   380.00,  440.00,  912000,  1056000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_work1,  8, 'Прокладка кабеля в лотках',        12000, 'м',   140.00,  165.00, 1680000,  1980000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_work2,  9, 'Монтаж светильников',                960, 'шт',  750.00,  880.00,  720000,   844800, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_eo, proj_id, si_eo_work3, 10, 'Монтаж щитов ЩР-36',                 24, 'шт',  14000,   16500,   336000,   396000, NOW(), FALSE, 0, 0, 0);

    -- Estimate items (ОВ)
    INSERT INTO estimate_items (id, estimate_id, project_id, spec_item_id, sequence, name, quantity, unit_of_measure, unit_price, unit_price_customer, amount, amount_customer,
        created_at, deleted, delivered_amount, invoiced_amount, ordered_amount) VALUES
        (gen_random_uuid(), est_ov, proj_id, si_ov_pipe1, 1, 'Труба стальная Ø 76×3.5',   1800, 'м',   1100.00, 1300.00,  1980000, 2340000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_pipe2, 2, 'Труба ППР Ø 32 мм',         4500, 'м',    280.00,  330.00,  1260000, 1485000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_radia, 3, 'Радиатор биметал. 500/10',    720, 'шт',  7500.00, 8800.00, 5400000, 6336000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_boil,  4, 'Котёл газовый 24 кВт',          3, 'шт', 110000,  135000,    330000,  405000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_pump,  5, 'Насос Grundfos',               12, 'шт',  55000,   66000,    660000,  792000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_valve, 6, 'Клапан балансировочный',       240, 'шт',  1900.00, 2200.00,  456000,  528000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_work1, 7, 'Монтаж трубопроводов ОВ',     6300, 'м',    560.00,  660.00, 3528000, 4158000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_ov, proj_id, si_ov_work2, 8, 'Установка радиаторов',          720, 'шт',  1400.00, 1650.00, 1008000, 1188000, NOW(), FALSE, 0, 0, 0);

    -- Estimate items (КР)
    INSERT INTO estimate_items (id, estimate_id, project_id, spec_item_id, sequence, name, quantity, unit_of_measure, unit_price, unit_price_customer, amount, amount_customer,
        created_at, deleted, delivered_amount, invoiced_amount, ordered_amount) VALUES
        (gen_random_uuid(), est_kr, proj_id, si_kr_conc,  1, 'Бетон В25 (М350)',            4200, 'м³',  7500.00, 8800.00,  31500000, 36960000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_rebar, 2, 'Арматура А500С Ø 12',          185, 'т',  56000,   66000,    10360000, 12210000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_form,  3, 'Опалубка PERI TRIO',           1200, 'м²',  2800.00, 3300.00,  3360000,  3960000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_brick, 4, 'Кирпич М150',               280000, 'шт',    11.50,   13.20,  3220000,  3696000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_steel, 5, 'Металлоконструкции',            120, 'т',  85000,   99000,   10200000, 11880000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_work1, 6, 'Бетонирование',               4200, 'м³',  2800.00, 3300.00,  11760000, 13860000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_work2, 7, 'Армирование',                  185, 'т',  28000,   33000,     5180000,  6105000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_kr, proj_id, si_kr_work3, 8, 'Кирпичная кладка',            4500, 'м²',  1850.00, 2200.00,   8325000,  9900000, NOW(), FALSE, 0, 0, 0);

    -- Estimate items (ВК)
    INSERT INTO estimate_items (id, estimate_id, project_id, spec_item_id, sequence, name, quantity, unit_of_measure, unit_price, unit_price_customer, amount, amount_customer,
        created_at, deleted, delivered_amount, invoiced_amount, ordered_amount) VALUES
        (gen_random_uuid(), est_vk, proj_id, si_vk_pipe1, 1, 'Труба ПЭ 100 Ø 110',         1500, 'м',    950.00, 1100.00, 1425000, 1650000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_vk, proj_id, si_vk_pipe2, 2, 'Труба канализ. Ø 110',        3000, 'м',    380.00,  440.00, 1140000, 1320000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_vk, proj_id, si_vk_fit,   3, 'Фитинги ПЭ (компл.)',          300, 'компл',1420.00,1650.00,  426000,  495000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_vk, proj_id, si_vk_pump,  4, 'Насосная станция ВК',             3, 'компл',280000, 330000,   840000,  990000, NOW(), FALSE, 0, 0, 0),
        (gen_random_uuid(), est_vk, proj_id, si_vk_work1, 5, 'Монтаж трубопроводов ВК',     4500, 'м',    560.00,  660.00, 2520000, 2970000, NOW(), FALSE, 0, 0, 0);

    -- =========================================================================
    -- 9. INVOICES (10 invoices: 8 received from suppliers + 2 issued to client)
    -- =========================================================================

    -- Received invoices (from suppliers/subcontractors)
    INSERT INTO invoices (id, number, invoice_date, due_date, project_id, contract_id, organization_id, partner_name, invoice_type, status, subtotal, vat_rate, vat_amount, total_amount, paid_amount, discipline_mark, matching_status, notes,
        created_at, deleted) VALUES
        (inv_cable1, 'СЧ-2025-0067', '2025-04-15', '2025-05-15', proj_id, ctr_sup_cable, org_id,
         'ООО "КабельТорг"', 'RECEIVED', 'PAID', 1150000, 20.00, 230000, 1380000, 1380000,
         'ЭО', 'FULLY_MATCHED', 'Кабель ВВГнг-LS 3×2.5 — поставка 1 партия',
         NOW(), FALSE),

        (inv_cable2, 'СЧ-2025-0089', '2025-05-20', '2025-06-20', proj_id, ctr_sup_cable, org_id,
         'ООО "ЭлектроПром"', 'RECEIVED', 'PARTIALLY_PAID', 670000, 20.00, 134000, 805000, 400000,
         'ЭО', 'PARTIALLY_MATCHED', 'Кабель ВВГнг-LS 5×4.0 — альтернативный поставщик',
         NOW(), FALSE),

        (inv_pipe1, 'СЧ-2025-0102', '2025-04-25', '2025-05-25', proj_id, ctr_sup_pipe, org_id,
         'ООО "ТрубоСнаб"', 'RECEIVED', 'PAID', 1650000, 20.00, 330000, 1980000, 1980000,
         'ОВ', 'FULLY_MATCHED', 'Трубы стальные Ø 76 — полный объём',
         NOW(), FALSE),

        (inv_pipe2, 'СЧ-2025-0145', '2025-05-10', '2025-06-10', proj_id, ctr_sup_pipe, org_id,
         'ООО "ТрубоСнаб"', 'RECEIVED', 'SENT', 1187500, 20.00, 237500, 1425000, 0,
         'ВК', 'PARTIALLY_MATCHED', 'Труба ПЭ 100 Ø 110 — водоснабжение',
         NOW(), FALSE),

        (inv_conc1, 'СЧ-2025-0055', '2025-04-05', '2025-05-05', proj_id, ctr_sup_conc, org_id,
         'ООО "БетонПром"', 'RECEIVED', 'PAID', 6250000, 20.00, 1250000, 7500000, 7500000,
         'КР', 'FULLY_MATCHED', 'Бетон В25 — 1-й этап поставки (1000 м³)',
         NOW(), FALSE),

        (inv_rebar, 'СЧ-2025-0071', '2025-04-18', '2025-05-18', proj_id, NULL, org_id,
         'ООО "МеталлТрейд"', 'RECEIVED', 'PAID', 4600000, 20.00, 920000, 5520000, 5520000,
         'КР', 'FULLY_MATCHED', 'Арматура А500С — 1-я партия (80 т)',
         NOW(), FALSE),

        (inv_lumin, 'СЧ-2025-0112', '2025-05-05', '2025-06-05', proj_id, NULL, org_id,
         'ООО "СветоТехника"', 'RECEIVED', 'SENT', 1140000, 20.00, 228000, 1368000, 0,
         'ЭО', 'UNMATCHED', 'Светильники LED 18W — предложение 400 шт',
         NOW(), FALSE),

        (inv_radia, 'СЧ-2025-0098', '2025-05-01', '2025-06-01', proj_id, NULL, org_id,
         'ООО "ТермоТех"', 'RECEIVED', 'PARTIALLY_PAID', 2250000, 20.00, 450000, 2700000, 1350000,
         'ОВ', 'PARTIALLY_MATCHED', 'Радиаторы биметаллические — 300 шт',
         NOW(), FALSE);

    -- Issued invoices (to client)
    INSERT INTO invoices (id, number, invoice_date, due_date, project_id, contract_id, organization_id, partner_name, invoice_type, status, subtotal, vat_rate, vat_amount, total_amount, paid_amount, discipline_mark, notes,
        created_at, deleted) VALUES
        (inv_client1, 'ВЫС-2025-0001', '2025-05-31', '2025-06-30', proj_id, ctr_client, org_id,
         'ООО "СолнечныйГрад Девелопмент"', 'ISSUED', 'PAID',
         25000000, 20.00, 5000000, 30000000, 30000000,
         NULL, 'Аванс по генподряду — 1-й этап (фундамент)',
         NOW(), FALSE),

        (inv_client2, 'ВЫС-2025-0002', '2025-07-31', '2025-08-31', proj_id, ctr_client, org_id,
         'ООО "СолнечныйГрад Девелопмент"', 'ISSUED', 'PARTIALLY_PAID',
         18000000, 20.00, 3600000, 21600000, 12000000,
         NULL, 'Оплата по КС-3 №1 — работы апрель-июнь',
         NOW(), FALSE);

    -- =========================================================================
    -- 10. INVOICE LINES
    -- =========================================================================
    INSERT INTO invoice_lines (id, invoice_id, name, quantity, unit_of_measure, unit_price, amount,
        created_at, deleted) VALUES
        -- Cable invoice 1 lines
        (il_cable1_1, inv_cable1, 'Кабель ВВГнг-LS 3×2.5 мм², бухта 500м', 8000, 'м', 115.00, 920000, NOW(), FALSE),
        (il_cable1_2, inv_cable1, 'Кабель ВВГнг-LS 3×2.5 мм², бухта 200м', 4000, 'м', 115.00, 460000, NOW(), FALSE),
        -- Cable invoice 2 lines
        (il_cable2_1, inv_cable2, 'Кабель ВВГнг-LS 5×4.0 мм²',             3500, 'м', 230.00, 805000, NOW(), FALSE),
        -- Pipe invoice 1 lines
        (il_pipe1_1, inv_pipe1, 'Труба стальная Ø 76×3.5 мм, 6м',          1200, 'м', 1100.00, 1320000, NOW(), FALSE),
        (il_pipe1_2, inv_pipe1, 'Труба стальная Ø 76×3.5 мм, 6м (2-я партия)', 600, 'м', 1100.00, 660000, NOW(), FALSE),
        -- Pipe invoice 2 (ВК)
        (il_pipe2_1, inv_pipe2, 'Труба ПЭ 100 SDR 17 Ø 110 мм',           1500, 'м', 950.00, 1425000, NOW(), FALSE),
        -- Concrete
        (il_conc1_1, inv_conc1, 'Бетон В25 (М350), доставка миксером',     1000, 'м³', 7500.00, 7500000, NOW(), FALSE),
        -- Rebar
        (il_rebar_1, inv_rebar, 'Арматура А500С Ø 12 мм, 11.7м',            80, 'т', 56000, 4480000, NOW(), FALSE),
        -- Luminaires
        (il_lumin_1, inv_lumin, 'Светильник LED встраиваемый 18W',           400, 'шт', 2850.00, 1140000, NOW(), FALSE),
        -- Radiators
        (il_radia_1, inv_radia, 'Радиатор биметаллический Rifar 500/10',    300, 'шт', 7500.00, 2250000, NOW(), FALSE),
        -- Client invoice 1 lines
        (il_cl1_1, inv_client1, 'СМР по разделу КР — фундамент, 1-й этап', 1, 'компл', 20000000, 20000000, NOW(), FALSE),
        (il_cl1_2, inv_client1, 'Инженерные сети — подготовительные работы', 1, 'компл', 5000000,   5000000, NOW(), FALSE),
        -- Client invoice 2 lines
        (il_cl2_1, inv_client2, 'СМР по КС-3 №1 (апрель-июнь 2025)',       1, 'компл', 18000000, 18000000, NOW(), FALSE);

    -- =========================================================================
    -- 11. KS-2 DOCUMENTS (5 acts)
    -- =========================================================================
    INSERT INTO ks2_documents (id, number, document_date, name, project_id, contract_id, status, total_amount, total_quantity,
        created_at, deleted) VALUES
        (ks2_1, 'КС2-001', '2025-04-30', 'Акт КС-2 — Бетонирование фундаментной плиты корпуса 1', proj_id, ctr_sub_kr, 'SIGNED', 4200000, 500, NOW(), FALSE),
        (ks2_2, 'КС2-002', '2025-05-31', 'Акт КС-2 — Армирование и бетонирование стен подвала',    proj_id, ctr_sub_kr, 'SIGNED', 6800000, 850, NOW(), FALSE),
        (ks2_3, 'КС2-003', '2025-06-30', 'Акт КС-2 — Монтаж перекрытий 1-го этажа корпуса 1',      proj_id, ctr_sub_kr, 'SIGNED', 5200000, 650, NOW(), FALSE),
        (ks2_4, 'КС2-004', '2025-06-30', 'Акт КС-2 — Электромонтаж подвал и 1-й этаж',             proj_id, ctr_sub_eo, 'SUBMITTED', 1800000, 3200, NOW(), FALSE),
        (ks2_5, 'КС2-005', '2025-07-31', 'Акт КС-2 — Монтаж трубопроводов ОВ, подвал корп. 1',     proj_id, ctr_sub_ov, 'DRAFT', 2100000, 800, NOW(), FALSE);

    -- KS-2 Lines
    INSERT INTO ks2_lines (id, ks2_id, sequence, name, quantity, unit_price, amount, unit_of_measure,
        created_at, deleted) VALUES
        -- KS2-001 (фундамент)
        (gen_random_uuid(), ks2_1, 1, 'Устройство бетонной подготовки',           150, 2800.00,  420000, 'м³', NOW(), FALSE),
        (gen_random_uuid(), ks2_1, 2, 'Армирование фундаментной плиты',            35, 28000,    980000, 'т',  NOW(), FALSE),
        (gen_random_uuid(), ks2_1, 3, 'Бетонирование фундаментной плиты',         350, 8000.00, 2800000, 'м³', NOW(), FALSE),

        -- KS2-002 (стены подвала)
        (gen_random_uuid(), ks2_2, 1, 'Армирование стен подвала',                   25, 28000,    700000, 'т',  NOW(), FALSE),
        (gen_random_uuid(), ks2_2, 2, 'Установка опалубки стен',                   800, 3000.00, 2400000, 'м²', NOW(), FALSE),
        (gen_random_uuid(), ks2_2, 3, 'Бетонирование стен подвала',                450, 8000.00, 3600000, 'м³', NOW(), FALSE),
        (gen_random_uuid(), ks2_2, 4, 'Демонтаж опалубки',                         800, 125.00,   100000, 'м²', NOW(), FALSE),

        -- KS2-003 (перекрытия)
        (gen_random_uuid(), ks2_3, 1, 'Установка опалубки перекрытия',             400, 3000.00, 1200000, 'м²', NOW(), FALSE),
        (gen_random_uuid(), ks2_3, 2, 'Армирование перекрытия',                     18, 28000,    504000, 'т',  NOW(), FALSE),
        (gen_random_uuid(), ks2_3, 3, 'Бетонирование перекрытия',                  250, 8000.00, 2000000, 'м³', NOW(), FALSE),
        (gen_random_uuid(), ks2_3, 4, 'Уход за бетоном',                           250, 600.00,   150000, 'м³', NOW(), FALSE),
        (gen_random_uuid(), ks2_3, 5, 'Демонтаж опалубки перекрытия',              400, 125.00,    50000, 'м²', NOW(), FALSE),

        -- KS2-004 (электромонтаж)
        (gen_random_uuid(), ks2_4, 1, 'Прокладка кабеля ВВГнг-LS 3×2.5 в лотках', 2500, 140.00,  350000, 'м',  NOW(), FALSE),
        (gen_random_uuid(), ks2_4, 2, 'Монтаж кабельных лотков 100×50',             800, 400.00,  320000, 'м',  NOW(), FALSE),
        (gen_random_uuid(), ks2_4, 3, 'Установка щита ЩР-36',                        4, 15000,    60000, 'шт', NOW(), FALSE),
        (gen_random_uuid(), ks2_4, 4, 'Монтаж светильников LED 18W',               120, 800.00,   96000, 'шт', NOW(), FALSE),
        (gen_random_uuid(), ks2_4, 5, 'Прокладка кабеля ВВГнг-LS 5×4.0',           700, 140.00,   98000, 'м',  NOW(), FALSE),

        -- KS2-005 (ОВ трубопроводы)
        (gen_random_uuid(), ks2_5, 1, 'Монтаж трубопроводов Ø 76 стальных',        500, 600.00,  300000, 'м',  NOW(), FALSE),
        (gen_random_uuid(), ks2_5, 2, 'Монтаж трубопроводов ППР Ø 32',             300, 600.00,  180000, 'м',  NOW(), FALSE),
        (gen_random_uuid(), ks2_5, 3, 'Установка радиаторов',                       80, 1500.00, 120000, 'шт', NOW(), FALSE),
        (gen_random_uuid(), ks2_5, 4, 'Установка запорной арматуры',                 40, 2000.00,  80000, 'шт', NOW(), FALSE);

    -- =========================================================================
    -- 12. KS-3 DOCUMENTS (2 summaries)
    -- =========================================================================
    INSERT INTO ks3_documents (id, number, document_date, name, period_from, period_to, project_id, contract_id, status, total_amount, retention_percent, retention_amount, net_amount,
        created_at, deleted) VALUES
        (ks3_1, 'КС3-001', '2025-06-30', 'Справка КС-3 — Работы апрель-июнь 2025',
         '2025-04-01', '2025-06-30', proj_id, ctr_sub_kr, 'SIGNED',
         16200000, 5.00, 810000, 15390000,
         NOW(), FALSE),

        (ks3_2, 'КС3-002', '2025-07-31', 'Справка КС-3 — Работы июль 2025 (ЭО+ОВ)',
         '2025-07-01', '2025-07-31', proj_id, NULL, 'DRAFT',
         3900000, 5.00, 195000, 3705000,
         NOW(), FALSE);

    -- KS-3 to KS-2 links
    INSERT INTO ks3_ks2_links (id, ks3_id, ks2_id, created_at, deleted) VALUES
        (gen_random_uuid(), ks3_1, ks2_1, NOW(), FALSE),
        (gen_random_uuid(), ks3_1, ks2_2, NOW(), FALSE),
        (gen_random_uuid(), ks3_1, ks2_3, NOW(), FALSE),
        (gen_random_uuid(), ks3_2, ks2_4, NOW(), FALSE),
        (gen_random_uuid(), ks3_2, ks2_5, NOW(), FALSE);

    -- =========================================================================
    -- 13. PAYMENTS (6 payments)
    -- =========================================================================
    INSERT INTO payments (id, number, payment_date, project_id, contract_id, organization_id, partner_name, payment_type, status, amount, vat_amount, total_amount, purpose, invoice_id,
        created_at, deleted) VALUES
        (gen_random_uuid(), 'ПЛТ-2025-001', '2025-04-20', proj_id, ctr_sup_cable, org_id,
         'ООО "КабельТорг"', 'OUTGOING', 'PAID', 1150000, 230000, 1380000,
         'Оплата за кабельную продукцию по счёту СЧ-2025-0067', inv_cable1,
         NOW(), FALSE),

        (gen_random_uuid(), 'ПЛТ-2025-002', '2025-05-10', proj_id, ctr_sup_conc, org_id,
         'ООО "БетонПром"', 'OUTGOING', 'PAID', 6250000, 1250000, 7500000,
         'Оплата за бетон В25 — 1-й этап', inv_conc1,
         NOW(), FALSE),

        (gen_random_uuid(), 'ПЛТ-2025-003', '2025-05-15', proj_id, NULL, org_id,
         'ООО "МеталлТрейд"', 'OUTGOING', 'PAID', 4600000, 920000, 5520000,
         'Оплата за арматуру А500С', inv_rebar,
         NOW(), FALSE),

        (gen_random_uuid(), 'ПЛТ-2025-004', '2025-05-20', proj_id, ctr_sup_pipe, org_id,
         'ООО "ТрубоСнаб"', 'OUTGOING', 'PAID', 1650000, 330000, 1980000,
         'Оплата за трубы стальные', inv_pipe1,
         NOW(), FALSE),

        (gen_random_uuid(), 'ПЛТ-2025-005', '2025-06-30', proj_id, ctr_client, org_id,
         'ООО "СолнечныйГрад Девелопмент"', 'INCOMING', 'PAID', 25000000, 5000000, 30000000,
         'Аванс по генподряду — 1-й этап', inv_client1,
         NOW(), FALSE),

        (gen_random_uuid(), 'ПЛТ-2025-006', '2025-08-15', proj_id, ctr_client, org_id,
         'ООО "СолнечныйГрад Девелопмент"', 'INCOMING', 'PAID', 10000000, 2000000, 12000000,
         'Частичная оплата по КС-3 №1', inv_client2,
         NOW(), FALSE);

    -- =========================================================================
    -- 14. COMMERCIAL PROPOSAL (КП — Себестоимость)
    -- =========================================================================
    INSERT INTO commercial_proposals (id, organization_id, project_id, budget_id, name, status, total_cost_price, notes)
    VALUES (
        cp1, org_id, proj_id, bud_id,
        'КП-001 — Себестоимость ЖК "Солнечный Парк"',
        'APPROVED', 42850000.00,
        'Коммерческое предложение с подобранными счетами для материалов ЭО, ОВ, КР'
    );

    -- CP Items (materials — linked to invoices)
    INSERT INTO commercial_proposal_items (proposal_id, budget_item_id, item_type, selected_invoice_line_id, cost_price, quantity, total_cost, status, notes) VALUES
        (cp1, bi_eo_cable1, 'MATERIAL', il_cable1_1, 115.00, 12000, 1380000, 'CONFIRMED', 'Выбран ООО "КабельТорг" — лучшая цена'),
        (cp1, bi_eo_cable2, 'MATERIAL', il_cable2_1, 230.00, 3500,   805000, 'CONFIRMED', 'Выбран ООО "ЭлектроПром"'),
        (cp1, bi_eo_lumin,  'MATERIAL', il_lumin_1,  2850.00, 960,  2736000, 'INVOICE_SELECTED', 'ООО "СветоТехника" — ожидает согласования'),
        (cp1, bi_ov_pipe1,  'MATERIAL', il_pipe1_1,  1100.00, 1800, 1980000, 'CONFIRMED', 'ООО "ТрубоСнаб" — договорная цена'),
        (cp1, bi_ov_radia,  'MATERIAL', il_radia_1,  7500.00, 720,  5400000, 'INVOICE_SELECTED', 'ООО "ТермоТех" — 300 шт в наличии, 420 под заказ'),
        (cp1, bi_kr_conc,   'MATERIAL', il_conc1_1,  7500.00, 4200,31500000, 'CONFIRMED', 'ООО "БетонПром" — рамочный контракт'),
        (cp1, bi_kr_rebar,  'MATERIAL', il_rebar_1,  56000,   185, 10360000, 'CONFIRMED', 'ООО "МеталлТрейд"'),
        (cp1, bi_vk_pipe1,  'MATERIAL', il_pipe2_1,   950.00, 1500, 1425000, 'CONFIRMED', 'ООО "ТрубоСнаб" — ПЭ трубы');

    -- CP Items (works — linked to estimates)
    INSERT INTO commercial_proposal_items (proposal_id, budget_item_id, item_type, trading_coefficient, cost_price, quantity, total_cost, status, notes) VALUES
        (cp1, bi_eo_work1, 'WORK', 0.9500, 140.00, 12000, 1680000, 'CONFIRMED', 'Субподряд ЭО — торговый коэфф. 0.95'),
        (cp1, bi_eo_work2, 'WORK', 0.9500, 750.00,  960,   720000, 'CONFIRMED', 'Субподряд ЭО'),
        (cp1, bi_ov_work1, 'WORK', 0.9300, 560.00, 6300,  3528000, 'CONFIRMED', 'Субподряд ОВ — торговый коэфф. 0.93'),
        (cp1, bi_kr_work1, 'WORK', 0.9000, 2800.00, 4200,11760000, 'CONFIRMED', 'Субподряд КР — крупный объём'),
        (cp1, bi_kr_work2, 'WORK', 0.9500, 28000,    185,  5180000, 'PENDING', 'Субподряд КР — ожидает решения'),
        (cp1, bi_vk_work1, 'WORK', 0.9500, 560.00, 4500,  2520000, 'PENDING', 'Субподряд ВК');

    -- =========================================================================
    -- 15. COMPETITIVE LISTS (2 lists)
    -- =========================================================================

    -- Competitive list for ЭО cables
    INSERT INTO competitive_lists (id, organization_id, project_id, specification_id, name, status, min_proposals_required, notes)
    VALUES (
        cl_eo, org_id, proj_id, spec_eo_id,
        'Конкурентный лист — Кабельная продукция ЭО',
        'DECIDED', 3,
        'Сравнение предложений 3 поставщиков на кабельную продукцию для раздела ЭО'
    );

    -- Entries for cable competitive list (3 vendors per item)
    INSERT INTO competitive_list_entries (competitive_list_id, spec_item_id, vendor_name, unit_price, quantity, total_price, delivery_days, payment_terms, is_winner, selection_reason, notes) VALUES
        -- Кабель 3×2.5 — 3 предложения
        (cl_eo, si_eo_cable1, 'ООО "КабельТорг"',    115.00, 12000, 1380000, 5,  '50% предоплата, 50% по факту', TRUE,  'Лучшая цена, быстрая доставка', 'Действующий поставщик'),
        (cl_eo, si_eo_cable1, 'ООО "ЭлектроПром"',    120.00, 12000, 1440000, 3,  '100% предоплата',              FALSE, NULL, 'Быстрая доставка, но дороже'),
        (cl_eo, si_eo_cable1, 'ООО "СтройМатериал"',  125.00, 12000, 1500000, 7,  'Отсрочка 30 дней',             FALSE, NULL, 'Отсрочка платежа, но самая высокая цена'),

        -- Кабель 5×4.0 — 3 предложения
        (cl_eo, si_eo_cable2, 'ООО "КабельТорг"',     235.00, 3500,  822500, 5,  '50% предоплата',               FALSE, NULL, 'Чуть дороже'),
        (cl_eo, si_eo_cable2, 'ООО "ЭлектроПром"',    230.00, 3500,  805000, 3,  '100% предоплата',              TRUE,  'Лучшая цена на данное сечение', 'Выбран для 5×4.0'),
        (cl_eo, si_eo_cable2, 'ООО "СтройМатериал"',  240.00, 3500,  840000, 10, 'Отсрочка 30 дней',             FALSE, NULL, 'Долгая доставка'),

        -- Светильники — 3 предложения
        (cl_eo, si_eo_lumin, 'ООО "СветоТехника"',   2850.00, 960, 2736000, 14, '30% предоплата',               TRUE,  'Лучшая цена, сертификат соответствия', 'Сертификаты в комплекте'),
        (cl_eo, si_eo_lumin, 'ООО "ЛюксЛайт"',      3000.00, 960, 2880000, 7,  '100% предоплата',              FALSE, NULL, 'Быстрая доставка, но дороже'),
        (cl_eo, si_eo_lumin, 'ООО "Электросвет"',    2950.00, 960, 2832000, 21, 'Отсрочка 45 дней',             FALSE, NULL, 'Средняя цена, длинная доставка');

    -- Competitive list for КР concrete/rebar
    INSERT INTO competitive_lists (id, organization_id, project_id, specification_id, name, status, min_proposals_required, notes)
    VALUES (
        cl_kr, org_id, proj_id, spec_kr_id,
        'Конкурентный лист — Бетон и арматура КР',
        'EVALUATING', 3,
        'Сравнение предложений на основные материалы КР: бетон и арматура'
    );

    INSERT INTO competitive_list_entries (competitive_list_id, spec_item_id, vendor_name, unit_price, quantity, total_price, delivery_days, payment_terms, is_winner, notes) VALUES
        -- Бетон — 3 предложения
        (cl_kr, si_kr_conc, 'ООО "БетонПром"',       7500.00, 4200, 31500000, 1, 'Оплата по факту выгрузки',    FALSE, 'Ближайший РБУ, 5 км'),
        (cl_kr, si_kr_conc, 'ООО "БетонМикс"',       7800.00, 4200, 32760000, 1, '50% предоплата',              FALSE, 'РБУ 15 км, надбавка за транспорт'),
        (cl_kr, si_kr_conc, 'ООО "СтройБетон"',      7200.00, 4200, 30240000, 2, 'Предоплата по графику',       FALSE, 'Самая низкая цена, но далеко (25 км)'),

        -- Арматура — 3 предложения
        (cl_kr, si_kr_rebar, 'ООО "МеталлТрейд"',   56000, 185, 10360000, 7,  '50% предоплата, 50% по факту', FALSE, 'Проверенный поставщик'),
        (cl_kr, si_kr_rebar, 'ООО "СталлПром"',      58000, 185, 10730000, 5,  '100% предоплата',              FALSE, 'Быстрая доставка, склад в Москве'),
        (cl_kr, si_kr_rebar, 'ООО "АрматураОпт"',    54000, 185,  9990000, 14, 'Отсрочка 14 дней',             FALSE, 'Самая низкая цена, но долгая доставка');

    RAISE NOTICE 'Demo project "ЖК Солнечный Парк" created successfully!';
    RAISE NOTICE 'Project ID: %', proj_id;
    RAISE NOTICE 'Budget ID: %', bud_id;
    RAISE NOTICE 'Specifications: 4 (ЭО, ОВ, КР, ВК)';
    RAISE NOTICE 'Spec items: 30';
    RAISE NOTICE 'Budget items: 31 (4 sections + 27 positions)';
    RAISE NOTICE 'Contracts: 8 (1 client + 4 subcontractors + 3 suppliers)';
    RAISE NOTICE 'Estimates: 4 with 31 line items';
    RAISE NOTICE 'Invoices: 10 (8 received + 2 issued) with 13 lines';
    RAISE NOTICE 'KS-2: 5 acts with 20 lines';
    RAISE NOTICE 'KS-3: 2 summaries linked to 5 KS-2 acts';
    RAISE NOTICE 'Payments: 6';
    RAISE NOTICE 'Commercial Proposal: 1 with 14 items';
    RAISE NOTICE 'Competitive Lists: 2 with 15 entries';
END $$;
