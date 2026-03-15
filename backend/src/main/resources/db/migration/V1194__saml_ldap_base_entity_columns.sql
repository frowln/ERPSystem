-- Add missing BaseEntity columns (created_by, updated_by, version) to saml_providers and ldap_configs
ALTER TABLE saml_providers ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE saml_providers ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE saml_providers ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE ldap_configs ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE ldap_configs ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE ldap_configs ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
