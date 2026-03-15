import { apiClient as client } from './client';

// ── SAML Types ──────────────────────────────────────────────────────────────

export interface SamlProvider {
  id: string;
  code: string;
  name: string;
  entityId: string;
  idpEntityId: string;
  idpSsoUrl: string;
  idpSloUrl?: string;
  idpCertificate: string;
  nameIdFormat: string;
  attributeMapping: string;
  active: boolean;
  autoProvisionUsers: boolean;
  defaultRole: string;
  iconUrl?: string;
}

export interface CreateSamlProviderRequest {
  code: string;
  name: string;
  entityId: string;
  idpEntityId: string;
  idpSsoUrl: string;
  idpSloUrl?: string;
  idpCertificate: string;
  nameIdFormat?: string;
  attributeMapping?: string;
  active?: boolean;
  autoProvisionUsers?: boolean;
  defaultRole?: string;
}

// ── LDAP Types ──────────────────────────────────────────────────────────────

export interface LdapConfig {
  id: string;
  name: string;
  serverUrl: string;
  baseDn: string;
  bindDn?: string;
  userSearchBase: string;
  userSearchFilter: string;
  groupSearchBase: string;
  groupSearchFilter: string;
  attributeMapping: string;
  groupRoleMapping: string;
  useSsl: boolean;
  useStarttls: boolean;
  connectionTimeoutMs: number;
  active: boolean;
  autoProvisionUsers: boolean;
  syncIntervalMinutes: number;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
}

export interface CreateLdapConfigRequest {
  name: string;
  serverUrl: string;
  baseDn: string;
  bindDn?: string;
  bindPassword?: string;
  userSearchBase?: string;
  userSearchFilter?: string;
  groupSearchBase?: string;
  groupSearchFilter?: string;
  attributeMapping?: string;
  groupRoleMapping?: string;
  useSsl?: boolean;
  useStarttls?: boolean;
  connectionTimeoutMs?: number;
  active?: boolean;
  autoProvisionUsers?: boolean;
  syncIntervalMinutes?: number;
}

// ── SAML API ────────────────────────────────────────────────────────────────

export async function listSamlProviders(): Promise<SamlProvider[]> {
  const res = await client.get('/sso/saml');
  return res.data?.data ?? [];
}

export async function getSamlProvider(id: string): Promise<SamlProvider> {
  const res = await client.get(`/sso/saml/${id}`);
  return res.data?.data;
}

export async function createSamlProvider(data: CreateSamlProviderRequest): Promise<SamlProvider> {
  const res = await client.post('/sso/saml', data);
  return res.data?.data;
}

export async function updateSamlProvider(id: string, data: Partial<CreateSamlProviderRequest>): Promise<SamlProvider> {
  const res = await client.put(`/sso/saml/${id}`, data);
  return res.data?.data;
}

export async function deleteSamlProvider(id: string): Promise<void> {
  await client.delete(`/sso/saml/${id}`);
}

// ── LDAP API ────────────────────────────────────────────────────────────────

export async function listLdapConfigs(): Promise<LdapConfig[]> {
  const res = await client.get('/sso/ldap');
  return res.data?.data ?? [];
}

export async function getLdapConfig(id: string): Promise<LdapConfig> {
  const res = await client.get(`/sso/ldap/${id}`);
  return res.data?.data;
}

export async function createLdapConfig(data: CreateLdapConfigRequest): Promise<LdapConfig> {
  const res = await client.post('/sso/ldap', data);
  return res.data?.data;
}

export async function updateLdapConfig(id: string, data: Partial<CreateLdapConfigRequest>): Promise<LdapConfig> {
  const res = await client.put(`/sso/ldap/${id}`, data);
  return res.data?.data;
}

export async function deleteLdapConfig(id: string): Promise<void> {
  await client.delete(`/sso/ldap/${id}`);
}

export async function testLdapConnection(id: string): Promise<LdapConfig> {
  const res = await client.post(`/sso/ldap/${id}/test`);
  return res.data?.data;
}
