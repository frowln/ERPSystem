-- =============================================================================
-- Users table
-- =============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    position        VARCHAR(200),
    avatar_url      VARCHAR(500),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    organization_id UUID,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_organization ON users(organization_id);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Roles table
-- =============================================================================
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    system_role BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_role_code ON roles(code);

-- =============================================================================
-- Permissions table
-- =============================================================================
CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    module      VARCHAR(50) NOT NULL,
    description VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_permission_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permission_module ON permissions(module);

-- =============================================================================
-- Join tables
-- =============================================================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =============================================================================
-- Seed system roles
-- =============================================================================
INSERT INTO roles (id, code, name, description, system_role) VALUES
    (uuid_generate_v4(), 'ADMIN',           'Администратор',           'Full system access',                      TRUE),
    (uuid_generate_v4(), 'PROJECT_MANAGER', 'Руководитель проекта',    'Manages projects and team assignments',   TRUE),
    (uuid_generate_v4(), 'ENGINEER',        'Инженер',                 'Technical engineering role',               TRUE),
    (uuid_generate_v4(), 'FOREMAN',         'Прораб',                  'On-site construction supervisor',         TRUE),
    (uuid_generate_v4(), 'ACCOUNTANT',      'Бухгалтер',              'Financial and accounting operations',     TRUE),
    (uuid_generate_v4(), 'SUPPLY_MANAGER',  'Менеджер снабжения',     'Materials and supply chain management',   TRUE),
    (uuid_generate_v4(), 'SAFETY_OFFICER',  'Инженер по ТБ',          'Occupational safety and health',          TRUE),
    (uuid_generate_v4(), 'VIEWER',          'Наблюдатель',            'Read-only access to the system',          TRUE);

-- =============================================================================
-- Seed permissions
-- =============================================================================
INSERT INTO permissions (id, code, name, module, description) VALUES
    -- Project permissions
    (uuid_generate_v4(), 'PROJECT_VIEW',    'View Projects',     'project', 'View project list and details'),
    (uuid_generate_v4(), 'PROJECT_CREATE',  'Create Projects',   'project', 'Create new projects'),
    (uuid_generate_v4(), 'PROJECT_EDIT',    'Edit Projects',     'project', 'Edit existing projects'),
    (uuid_generate_v4(), 'PROJECT_DELETE',  'Delete Projects',   'project', 'Delete projects'),
    (uuid_generate_v4(), 'PROJECT_STATUS',  'Change Status',     'project', 'Change project status'),
    -- Organization permissions
    (uuid_generate_v4(), 'ORG_VIEW',        'View Organizations',   'organization', 'View organizations'),
    (uuid_generate_v4(), 'ORG_CREATE',      'Create Organizations', 'organization', 'Create new organizations'),
    (uuid_generate_v4(), 'ORG_EDIT',        'Edit Organizations',   'organization', 'Edit organizations'),
    (uuid_generate_v4(), 'ORG_DELETE',      'Delete Organizations', 'organization', 'Delete organizations'),
    -- User management permissions
    (uuid_generate_v4(), 'USER_VIEW',       'View Users',       'auth', 'View user list'),
    (uuid_generate_v4(), 'USER_CREATE',     'Create Users',     'auth', 'Create new users'),
    (uuid_generate_v4(), 'USER_EDIT',       'Edit Users',       'auth', 'Edit user profiles'),
    (uuid_generate_v4(), 'USER_DELETE',     'Delete Users',     'auth', 'Deactivate users'),
    -- Audit permissions
    (uuid_generate_v4(), 'AUDIT_VIEW',      'View Audit Logs',  'audit', 'View system audit logs');

-- =============================================================================
-- Assign all permissions to ADMIN role
-- =============================================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN';

-- Assign project permissions to PROJECT_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'PROJECT_MANAGER'
  AND p.code IN ('PROJECT_VIEW', 'PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_STATUS', 'ORG_VIEW', 'USER_VIEW');

-- Assign view permissions to VIEWER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'VIEWER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW');

-- Assign permissions to ENGINEER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ENGINEER'
  AND p.code IN ('PROJECT_VIEW', 'PROJECT_EDIT', 'ORG_VIEW');

-- Assign permissions to FOREMAN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'FOREMAN'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW');

-- Assign permissions to ACCOUNTANT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ACCOUNTANT'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW');

-- Assign permissions to SUPPLY_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SUPPLY_MANAGER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW');

-- Assign permissions to SAFETY_OFFICER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SAFETY_OFFICER'
  AND p.code IN ('PROJECT_VIEW', 'ORG_VIEW');

-- =============================================================================
-- Seed admin user (password: admin123 - bcrypt hash)
-- =============================================================================
INSERT INTO users (id, email, password_hash, first_name, last_name, enabled, created_by)
VALUES (
    uuid_generate_v4(),
    'admin@privod.ru',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'System',
    'Administrator',
    TRUE,
    'system'
);

-- Assign ADMIN role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@privod.ru' AND r.code = 'ADMIN';
