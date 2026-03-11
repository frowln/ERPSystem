import type { Role } from './auth.fixture';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

/** JWT token cache per role */
const tokenCache = new Map<Role, { token: string; expiresAt: number }>();

/** Default credentials — mirrors auth.fixture.ts */
const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@privod.ru',
    password: process.env.E2E_ADMIN_PASS || 'admin123',
  },
  manager: {
    email: process.env.E2E_MANAGER_EMAIL || 'manager@privod.ru',
    password: process.env.E2E_MANAGER_PASS || 'manager123',
  },
  engineer: {
    email: process.env.E2E_ENGINEER_EMAIL || 'engineer@privod.ru',
    password: process.env.E2E_ENGINEER_PASS || 'engineer123',
  },
  accountant: {
    email: process.env.E2E_ACCOUNTANT_EMAIL || 'accountant@privod.ru',
    password: process.env.E2E_ACCOUNTANT_PASS || 'accountant123',
  },
  viewer: {
    email: process.env.E2E_VIEWER_EMAIL || 'viewer@privod.ru',
    password: process.env.E2E_VIEWER_PASS || 'viewer123',
  },
};

/**
 * Get a JWT token for a given role, caching for reuse.
 * Authenticates via POST /api/auth/login.
 */
async function getToken(role: Role): Promise<string> {
  const cached = tokenCache.get(role);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const creds = CREDENTIALS[role];
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });

  if (!res.ok) {
    throw new Error(`API login failed for role ${role}: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const token: string = data.token ?? data.data?.token ?? data.accessToken ?? data.data?.accessToken;
  if (!token) {
    throw new Error(`No token in login response for role ${role}: ${JSON.stringify(data)}`);
  }

  // Cache for 25 minutes (JWT usually valid for 30)
  tokenCache.set(role, { token, expiresAt: Date.now() + 25 * 60_000 });
  return token;
}

/**
 * Make an authenticated API request as a specific role.
 */
export async function authenticatedRequest(
  role: Role,
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const token = await getToken(role);
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (data !== undefined && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(data);
  }

  return fetch(fullUrl, options);
}

/**
 * Create an entity via POST. Returns the created entity with id.
 */
export async function createEntity<T extends { id?: string }>(
  endpoint: string,
  data: Record<string, unknown>,
  role: Role = 'admin',
): Promise<T> {
  const res = await authenticatedRequest(role, 'POST', endpoint, data);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`createEntity ${endpoint} failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  // Handle ApiResponse<T> wrapper: { data: T } or direct T
  return (json.data ?? json) as T;
}

/**
 * Get an entity by ID.
 */
export async function getEntity<T>(
  endpoint: string,
  id: string,
  role: Role = 'admin',
): Promise<T> {
  const res = await authenticatedRequest(role, 'GET', `${endpoint}/${id}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`getEntity ${endpoint}/${id} failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

/**
 * Update an entity by ID.
 */
export async function updateEntity<T>(
  endpoint: string,
  id: string,
  data: Record<string, unknown>,
  role: Role = 'admin',
): Promise<T> {
  const res = await authenticatedRequest(role, 'PUT', `${endpoint}/${id}`, data);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`updateEntity ${endpoint}/${id} failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

/**
 * Delete an entity by ID.
 */
export async function deleteEntity(
  endpoint: string,
  id: string,
  role: Role = 'admin',
): Promise<void> {
  const res = await authenticatedRequest(role, 'DELETE', `${endpoint}/${id}`);

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`deleteEntity ${endpoint}/${id} failed: ${res.status} ${body}`);
  }
}

/**
 * List entities from a paginated endpoint.
 */
export async function listEntities<T>(
  endpoint: string,
  params?: Record<string, string>,
  role: Role = 'admin',
): Promise<T[]> {
  const searchParams = new URLSearchParams(params);
  const url = params ? `${endpoint}?${searchParams}` : endpoint;
  const res = await authenticatedRequest(role, 'GET', url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`listEntities ${endpoint} failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  // Handle PageResponse { content: T[] } or ApiResponse<T[]> { data: T[] } or direct T[]
  return json.content ?? json.data ?? json;
}

export { API_BASE, BASE_URL };
