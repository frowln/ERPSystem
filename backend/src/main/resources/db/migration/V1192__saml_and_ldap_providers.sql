-- SAML 2.0 Identity Provider configurations
CREATE TABLE saml_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(1000) NOT NULL,           -- SP entity ID
    idp_entity_id VARCHAR(1000) NOT NULL,       -- IdP entity ID
    idp_sso_url VARCHAR(2000) NOT NULL,         -- IdP Single Sign-On URL
    idp_slo_url VARCHAR(2000),                  -- IdP Single Logout URL (optional)
    idp_certificate TEXT NOT NULL,              -- IdP X.509 certificate (PEM)
    sp_certificate TEXT,                        -- SP certificate (PEM, optional)
    sp_private_key TEXT,                        -- SP private key (PEM, encrypted)
    name_id_format VARCHAR(255) DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    attribute_mapping JSONB DEFAULT '{"email":"email","firstName":"givenName","lastName":"sn"}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_provision_users BOOLEAN NOT NULL DEFAULT true,
    default_role VARCHAR(50) DEFAULT 'VIEWER',
    icon_url VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_saml_providers_org ON saml_providers(organization_id) WHERE deleted = false;

-- LDAP/Active Directory configurations
CREATE TABLE ldap_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    server_url VARCHAR(1000) NOT NULL,          -- ldap://ad.company.com:389
    base_dn VARCHAR(500) NOT NULL,              -- DC=company,DC=com
    bind_dn VARCHAR(500),                       -- CN=service,OU=Users,DC=company,DC=com
    bind_password VARCHAR(500),                 -- encrypted
    user_search_base VARCHAR(500) DEFAULT 'OU=Users',
    user_search_filter VARCHAR(500) DEFAULT '(sAMAccountName={0})',
    group_search_base VARCHAR(500) DEFAULT 'OU=Groups',
    group_search_filter VARCHAR(500) DEFAULT '(member={0})',
    attribute_mapping JSONB DEFAULT '{"email":"mail","firstName":"givenName","lastName":"sn","username":"sAMAccountName"}',
    group_role_mapping JSONB DEFAULT '{}',       -- {"CN=Admins,OU=Groups,DC=...": "ADMIN"}
    use_ssl BOOLEAN NOT NULL DEFAULT false,
    use_starttls BOOLEAN NOT NULL DEFAULT false,
    connection_timeout_ms INTEGER DEFAULT 5000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_provision_users BOOLEAN NOT NULL DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 60,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),
    last_sync_message TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE INDEX idx_ldap_configs_org ON ldap_configs(organization_id) WHERE deleted = false;
