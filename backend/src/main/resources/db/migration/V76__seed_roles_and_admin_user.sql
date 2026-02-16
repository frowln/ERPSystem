-- =============================================================================
-- V75: Seed system roles, permissions, and admin user
--
-- The dev profile runs with flyway.enabled=false and hibernate.ddl-auto=update,
-- so V2's seed data never executed. This migration ensures all required roles
-- exist regardless of profile.
-- =============================================================================

-- =============================================================================
-- 1. Seed all system roles (idempotent: skip if already present)
-- =============================================================================
INSERT INTO roles (id, code, name, description, system_role) VALUES
    (uuid_generate_v4(), 'ADMIN',               'Администратор',                'Full system access',                               TRUE),
    (uuid_generate_v4(), 'VIEWER',              'Наблюдатель',                  'Read-only access to the system',                   TRUE),
    (uuid_generate_v4(), 'PROJECT_MANAGER',     'Руководитель проекта',         'Manages projects and team assignments',            TRUE),
    (uuid_generate_v4(), 'ENGINEER',            'Инженер',                      'Technical engineering role',                        TRUE),
    (uuid_generate_v4(), 'FOREMAN',             'Прораб',                       'On-site construction supervisor',                  TRUE),
    (uuid_generate_v4(), 'SAFETY_OFFICER',      'Инженер по ТБ',               'Occupational safety and health',                   TRUE),
    (uuid_generate_v4(), 'QUALITY_INSPECTOR',   'Инспектор по качеству',        'Quality assurance and inspection',                 TRUE),
    (uuid_generate_v4(), 'WAREHOUSE_MANAGER',   'Начальник склада',             'Warehouse and inventory management',               TRUE),
    (uuid_generate_v4(), 'PROCUREMENT_MANAGER', 'Менеджер закупок',             'Procurement and purchasing management',            TRUE),
    (uuid_generate_v4(), 'FINANCIAL_CONTROLLER','Финансовый контролер',          'Financial oversight and control',                  TRUE),
    (uuid_generate_v4(), 'HR_MANAGER',          'HR менеджер',                  'Human resources management',                       TRUE),
    (uuid_generate_v4(), 'ESTIMATOR',           'Сметчик',                      'Cost estimation and budgeting',                    TRUE),
    (uuid_generate_v4(), 'SCHEDULER',           'Планировщик',                  'Project scheduling and planning',                  TRUE),
    (uuid_generate_v4(), 'DOCUMENT_CONTROLLER', 'Документовед',                 'Document management and control',                  TRUE),
    (uuid_generate_v4(), 'SYSTEM_INTEGRATOR',   'Системный интегратор',         'System integration and technical operations',      TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 2. Seed core permissions (idempotent: skip if already present)
-- =============================================================================
INSERT INTO permissions (id, code, name, module, description) VALUES
    -- Project permissions
    (uuid_generate_v4(), 'PROJECT_VIEW',    'View Projects',     'project',      'View project list and details'),
    (uuid_generate_v4(), 'PROJECT_CREATE',  'Create Projects',   'project',      'Create new projects'),
    (uuid_generate_v4(), 'PROJECT_EDIT',    'Edit Projects',     'project',      'Edit existing projects'),
    (uuid_generate_v4(), 'PROJECT_DELETE',  'Delete Projects',   'project',      'Delete projects'),
    (uuid_generate_v4(), 'PROJECT_STATUS',  'Change Status',     'project',      'Change project status'),
    -- Organization permissions
    (uuid_generate_v4(), 'ORG_VIEW',        'View Organizations',   'organization', 'View organizations'),
    (uuid_generate_v4(), 'ORG_CREATE',      'Create Organizations', 'organization', 'Create new organizations'),
    (uuid_generate_v4(), 'ORG_EDIT',        'Edit Organizations',   'organization', 'Edit organizations'),
    (uuid_generate_v4(), 'ORG_DELETE',      'Delete Organizations', 'organization', 'Delete organizations'),
    -- User management permissions
    (uuid_generate_v4(), 'USER_VIEW',       'View Users',       'auth',         'View user list'),
    (uuid_generate_v4(), 'USER_CREATE',     'Create Users',     'auth',         'Create new users'),
    (uuid_generate_v4(), 'USER_EDIT',       'Edit Users',       'auth',         'Edit user profiles'),
    (uuid_generate_v4(), 'USER_DELETE',     'Delete Users',     'auth',         'Deactivate users'),
    -- Audit permissions
    (uuid_generate_v4(), 'AUDIT_VIEW',      'View Audit Logs',  'audit',        'View system audit logs'),
    -- Contract permissions
    (uuid_generate_v4(), 'CONTRACT_VIEW',   'View Contracts',   'contract',     'View contracts'),
    (uuid_generate_v4(), 'CONTRACT_CREATE', 'Create Contracts', 'contract',     'Create new contracts'),
    (uuid_generate_v4(), 'CONTRACT_EDIT',   'Edit Contracts',   'contract',     'Edit existing contracts'),
    -- Estimate permissions
    (uuid_generate_v4(), 'ESTIMATE_VIEW',   'View Estimates',   'estimate',     'View estimates'),
    (uuid_generate_v4(), 'ESTIMATE_CREATE', 'Create Estimates', 'estimate',     'Create new estimates'),
    (uuid_generate_v4(), 'ESTIMATE_EDIT',   'Edit Estimates',   'estimate',     'Edit existing estimates'),
    -- Finance permissions
    (uuid_generate_v4(), 'FINANCE_VIEW',    'View Finance',     'finance',      'View financial data'),
    (uuid_generate_v4(), 'FINANCE_MANAGE',  'Manage Finance',   'finance',      'Manage financial operations'),
    -- Warehouse permissions
    (uuid_generate_v4(), 'WAREHOUSE_VIEW',  'View Warehouse',   'warehouse',    'View warehouse inventory'),
    (uuid_generate_v4(), 'WAREHOUSE_MANAGE','Manage Warehouse', 'warehouse',    'Manage warehouse operations'),
    -- HR permissions
    (uuid_generate_v4(), 'HR_VIEW',         'View HR',          'hr',           'View HR data'),
    (uuid_generate_v4(), 'HR_MANAGE',       'Manage HR',        'hr',           'Manage HR operations'),
    -- Safety permissions
    (uuid_generate_v4(), 'SAFETY_VIEW',     'View Safety',      'safety',       'View safety data'),
    (uuid_generate_v4(), 'SAFETY_MANAGE',   'Manage Safety',    'safety',       'Manage safety operations'),
    -- Quality permissions
    (uuid_generate_v4(), 'QUALITY_VIEW',    'View Quality',     'quality',      'View quality data'),
    (uuid_generate_v4(), 'QUALITY_MANAGE',  'Manage Quality',   'quality',      'Manage quality operations'),
    -- Document permissions
    (uuid_generate_v4(), 'DOCUMENT_VIEW',   'View Documents',   'document',     'View documents'),
    (uuid_generate_v4(), 'DOCUMENT_MANAGE', 'Manage Documents', 'document',     'Manage document operations'),
    -- Procurement permissions
    (uuid_generate_v4(), 'PROCUREMENT_VIEW',   'View Procurement',   'procurement', 'View procurement data'),
    (uuid_generate_v4(), 'PROCUREMENT_MANAGE', 'Manage Procurement', 'procurement', 'Manage procurement operations'),
    -- Schedule permissions
    (uuid_generate_v4(), 'SCHEDULE_VIEW',   'View Schedules',   'schedule',     'View project schedules'),
    (uuid_generate_v4(), 'SCHEDULE_MANAGE', 'Manage Schedules', 'schedule',     'Manage project schedules'),
    -- Integration permissions
    (uuid_generate_v4(), 'INTEGRATION_VIEW',   'View Integrations',   'integration', 'View system integrations'),
    (uuid_generate_v4(), 'INTEGRATION_MANAGE', 'Manage Integrations', 'integration', 'Manage system integrations')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 3. Assign permissions to roles
-- =============================================================================

-- ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- VIEWER gets read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'VIEWER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'CONTRACT_VIEW', 'ESTIMATE_VIEW',
                 'FINANCE_VIEW', 'WAREHOUSE_VIEW', 'HR_VIEW', 'SAFETY_VIEW',
                 'QUALITY_VIEW', 'DOCUMENT_VIEW', 'PROCUREMENT_VIEW', 'SCHEDULE_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- PROJECT_MANAGER gets project and team-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'PROJECT_MANAGER'
  AND p.code IN ('PROJECT_VIEW', 'PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_STATUS',
                 'ORG_VIEW', 'USER_VIEW', 'CONTRACT_VIEW', 'ESTIMATE_VIEW',
                 'SCHEDULE_VIEW', 'SCHEDULE_MANAGE', 'DOCUMENT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- ENGINEER gets technical permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ENGINEER'
  AND p.code IN ('PROJECT_VIEW', 'PROJECT_EDIT', 'ORG_VIEW', 'ESTIMATE_VIEW',
                 'DOCUMENT_VIEW', 'QUALITY_VIEW', 'SCHEDULE_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- FOREMAN gets on-site supervision permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'FOREMAN'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'SAFETY_VIEW', 'QUALITY_VIEW',
                 'WAREHOUSE_VIEW', 'DOCUMENT_VIEW', 'SCHEDULE_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- SAFETY_OFFICER gets safety-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SAFETY_OFFICER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'SAFETY_VIEW', 'SAFETY_MANAGE',
                 'DOCUMENT_VIEW', 'QUALITY_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- QUALITY_INSPECTOR gets quality-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'QUALITY_INSPECTOR'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'QUALITY_VIEW', 'QUALITY_MANAGE',
                 'DOCUMENT_VIEW', 'SAFETY_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- WAREHOUSE_MANAGER gets warehouse permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'WAREHOUSE_MANAGER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'WAREHOUSE_VIEW', 'WAREHOUSE_MANAGE',
                 'PROCUREMENT_VIEW', 'DOCUMENT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- PROCUREMENT_MANAGER gets procurement permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'PROCUREMENT_MANAGER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'PROCUREMENT_VIEW', 'PROCUREMENT_MANAGE',
                 'CONTRACT_VIEW', 'CONTRACT_CREATE', 'CONTRACT_EDIT',
                 'WAREHOUSE_VIEW', 'DOCUMENT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- FINANCIAL_CONTROLLER gets finance permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'FINANCIAL_CONTROLLER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'FINANCE_VIEW', 'FINANCE_MANAGE',
                 'CONTRACT_VIEW', 'ESTIMATE_VIEW', 'AUDIT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- HR_MANAGER gets HR permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'HR_MANAGER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'HR_VIEW', 'HR_MANAGE',
                 'USER_VIEW', 'USER_CREATE', 'USER_EDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- ESTIMATOR gets estimation permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ESTIMATOR'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'ESTIMATE_VIEW', 'ESTIMATE_CREATE',
                 'ESTIMATE_EDIT', 'CONTRACT_VIEW', 'DOCUMENT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- SCHEDULER gets scheduling permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SCHEDULER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'SCHEDULE_VIEW', 'SCHEDULE_MANAGE',
                 'DOCUMENT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- DOCUMENT_CONTROLLER gets document permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'DOCUMENT_CONTROLLER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'DOCUMENT_VIEW', 'DOCUMENT_MANAGE')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- SYSTEM_INTEGRATOR gets integration and admin-adjacent permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SYSTEM_INTEGRATOR'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW', 'INTEGRATION_VIEW', 'INTEGRATION_MANAGE',
                 'USER_VIEW', 'AUDIT_VIEW', 'DOCUMENT_VIEW')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- =============================================================================
-- 4. Seed admin user (password: admin123)
--    BCrypt hash: $2a$10$96KQ9KTRdDMvn/EJHZozNuzxtb/VfAcYHIegBJkvRgfbR9P9f/DAK
-- =============================================================================
INSERT INTO users (id, email, password_hash, first_name, last_name, enabled, deleted, created_at, created_by, version)
VALUES (
    uuid_generate_v4(),
    'admin@privod.com',
    '$2a$10$96KQ9KTRdDMvn/EJHZozNuzxtb/VfAcYHIegBJkvRgfbR9P9f/DAK',
    'Admin',
    'Admin',
    TRUE,
    FALSE,
    NOW(),
    'system',
    0
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 5. Assign ADMIN role to admin user
-- =============================================================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@privod.com' AND r.code = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
