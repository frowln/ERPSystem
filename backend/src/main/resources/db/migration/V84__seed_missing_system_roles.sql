-- =============================================================================
-- Seed missing system roles referenced in backend `@PreAuthorize` annotations.
--
-- Problem:
-- - Backend code references roles that were never inserted into `roles` via seeds.
-- - Those endpoints become effectively unreachable for intended non-admin users.
--
-- Notes:
-- - Idempotent via ON CONFLICT (code) DO NOTHING.
-- - This migration only creates role codes; permission mapping is handled separately.
-- =============================================================================

INSERT INTO roles (id, code, name, description, system_role) VALUES
    (uuid_generate_v4(), 'BID_MANAGER',          'Менеджер тендеров',         'Bid / tender management',                         TRUE),
    (uuid_generate_v4(), 'CONTRACT_MANAGER',     'Менеджер договоров',        'Contract lifecycle management',                    TRUE),
    (uuid_generate_v4(), 'COST_MANAGER',         'Менеджер затрат',           'Cost management and budgeting',                    TRUE),
    (uuid_generate_v4(), 'DESIGNER',             'Проектировщик',             'Design management role',                           TRUE),
    (uuid_generate_v4(), 'DOCUMENT_MANAGER',     'Менеджер документов',       'Document management (operational)',                TRUE),
    (uuid_generate_v4(), 'FINANCE_MANAGER',      'Финансовый менеджер',       'Finance operations and approvals',                 TRUE),
    (uuid_generate_v4(), 'FLEET_MANAGER',        'Менеджер автопарка',        'Fleet and equipment management',                   TRUE),
    (uuid_generate_v4(), 'INSPECTOR',            'Инспектор',                 'Inspection role (QA/HSE/field)',                   TRUE),
    (uuid_generate_v4(), 'LAWYER',               'Юрист',                     'Legal management role',                            TRUE),
    (uuid_generate_v4(), 'LOGISTICS_MANAGER',    'Менеджер логистики',        'Logistics and delivery coordination',              TRUE),
    (uuid_generate_v4(), 'MAINTENANCE_MANAGER',  'Менеджер обслуживания',     'Maintenance management role',                      TRUE),
    (uuid_generate_v4(), 'MANAGER',              'Руководитель',              'General manager role (legacy / compatibility)',     TRUE),
    (uuid_generate_v4(), 'OPERATOR',             'Оператор',                  'Operator role (fleet / dispatch)',                 TRUE),
    (uuid_generate_v4(), 'PLANNER',              'Планировщик',               'Planning / simulation role',                       TRUE),

    (uuid_generate_v4(), 'PORTAL_CUSTOMER',      'Портал: Заказчик',          'External portal access (customer)',                TRUE),
    (uuid_generate_v4(), 'PORTAL_CONTRACTOR',    'Портал: Подрядчик',         'External portal access (contractor)',              TRUE),
    (uuid_generate_v4(), 'PORTAL_SUBCONTRACTOR', 'Портал: Субподрядчик',      'External portal access (subcontractor)',           TRUE),
    (uuid_generate_v4(), 'PORTAL_SUPPLIER',      'Портал: Поставщик',         'External portal access (supplier)',                TRUE),

    (uuid_generate_v4(), 'QUALITY_MANAGER',      'Менеджер качества',         'Quality management role',                          TRUE),
    (uuid_generate_v4(), 'RECRUITER',            'Рекрутер',                  'Recruitment role',                                 TRUE),
    (uuid_generate_v4(), 'REGULATORY_MANAGER',   'Менеджер регуляторики',     'Permits / compliance management role',             TRUE),
    (uuid_generate_v4(), 'SAFETY_MANAGER',       'Менеджер по охране труда',  'Safety management role',                           TRUE),
    (uuid_generate_v4(), 'SALES_MANAGER',        'Менеджер продаж',           'Sales / portfolio role',                           TRUE),
    (uuid_generate_v4(), 'SUPPORT_MANAGER',      'Менеджер поддержки',        'Support and knowledge base role',                  TRUE),

    (uuid_generate_v4(), 'SYSTEM',               'Система',                   'Internal system role (automation / integrations)', TRUE)
ON CONFLICT (code) DO NOTHING;

