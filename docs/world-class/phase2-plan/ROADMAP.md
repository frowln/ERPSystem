# ФАЗА 2 — ROADMAP: PRIVOD → WORLD-CLASS PRODUCTION

> **Автор**: CTO / Technical Program Manager
> **Дата создания**: 2026-03-19
> **Основан на**: ВСЕ файлы `docs/world-class/` — FINAL-REPORT (721 баг, 722 улучшения, 26 блокеров), 28 индивидуальных аудитов (1.0–1.26 + 1.X + 1.UX), BUGS.md, IMPROVEMENTS.md, COMPETITORS.md, GOLD-STANDARD.md
> **Цель**: довести систему от 6.2/10 (38% production-ready) до 9.8/10 (99% production-ready)
> **Горизонт**: 19 спринтов × 2 недели = ~9.5 месяцев, 71 задача, ~287 сессий Claude Code

---

## ОГЛАВЛЕНИЕ

1. [Обзор этапов](#1-обзор-этапов)
2. [Этап 1: Стабильность](#этап-1-стабильность--спринты-1-4)
3. [Этап 2: Ядро](#этап-2-ядро--спринты-5-8)
4. [Этап 3: SaaS-ready](#этап-3-saas-ready--спринты-9-11)
5. [Этап 4: Продажи](#этап-4-продажи--спринты-12-13)
6. [Этап 5: Масштаб](#этап-5-масштаб--спринты-14-17)
7. [Сводная таблица задач](#7-сводная-таблица-всех-задач)
8. [Метрики успеха](#8-метрики-успеха)

---

## 1. ОБЗОР ЭТАПОВ

| Этап | Спринты | Недели | Задач | Сессий | Цель | Результат |
|------|---------|--------|-------|--------|------|-----------|
| **1. Стабильность** | 1–4 | 8 | 21 | 59 | Безопасность, tenant isolation, data integrity | Безопасная система без data leaks |
| **2. Ядро** | 5–8 | 8 | 18 | 84 | Финансы, документы, навигация, UX | Работающий core flow end-to-end |
| **3. SaaS-ready** | 9–11 | 6 | 13 | 39 | Мониторинг, биллинг, тестирование, SSO | Готовность к первому платящему клиенту |
| **4. Продажи** | 12–13 | 4 | 5 | 21 | Лендинг, демо, юридика, Gantt | Можно продавать |
| **5. Масштаб** | 14–17 | 8 | 5 | 36 | 1С, ЭДО, мобилка, AI | Конкурентоспособный продукт |
| **6. Стабилизация** | 18 | 2 | 6 | 25 | Module-level P2 bug fixes | Все модули работают |
| **7. Конкурентность** | 19 | 2 | 4 | 24 | AI Agent Builder, Predictive, 360° | Лучше конкурентов |
| | **ИТОГО** | **38** | **71** | **287** | | **World-class production ERP** |

### Размеры задач (в сессиях Claude Code)

| Размер | Сессий | Описание |
|--------|--------|----------|
| **S** | 1 | Одна фокусная задача: правка конфига, исправление 1 бага, добавление 1 поля |
| **M** | 2–3 | Один модуль: миграция + entity + service + controller + frontend |
| **L** | 4–6 | Cross-cutting: изменение паттерна во многих файлах или целый новый модуль |
| **XL** | 7–12 | Масштабная интеграция или новая подсистема |

---

## ЭТАП 1: СТАБИЛЬНОСТЬ — Спринты 1-4

> **Цель**: система безопасна, данные изолированы, нет критических багов.
> **Без этого этапа запуск НЕВОЗМОЖЕН.**

---

### Спринт 1 — EMERGENCY SECURITY (2 недели)

> Блокеры B1-B12: без них данные можно украсть прямо сейчас.

---

#### [S1-01] Fix SQL Injection в PortalDataProxyController

- **Приоритет**: P1 (НЕМЕДЛЕННО)
- **Модули**: portal (backend)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.17-portal.md` §3 BUG-1 (7 мест SQL injection), `1.X-architecture.md` §2 Кластер 2, `FINAL-REPORT.md` B1, `BUGS.md` #258/#479
- **Описание**:
  Заменить 7 мест строковой конкатенации user input в SQL на JdbcTemplate с параметризованными запросами. Файл: `PortalDataProxyController.java`. Каждое место, где `String.format()` или `+` используется для построения SQL — заменить на `?` placeholders.
- **Критерий готовности**:
  - 0 мест конкатенации user input в SQL
  - Grep по `PortalDataProxy` не находит `"SELECT.*" +` или `String.format.*SELECT`
  - Backend компилируется
  - Существующие тесты проходят

**Сессии Claude Code:**
1. *Сессия 1*: Найти все 7 мест SQL injection → заменить на JdbcTemplate/NamedParameterJdbcTemplate → проверить компиляцию

---

#### [S1-02] Fix Identity Spoofing в Portal

- **Приоритет**: P1 (НЕМЕДЛЕННО)
- **Модули**: portal (backend)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.17-portal.md` §3 BUG-2 (portalUserId @RequestParam 8+ endpoints), `FINAL-REPORT.md` B7, `BUGS.md` #259
- **Описание**:
  В 8+ endpoints `portalUserId` передаётся как `@RequestParam` — клиент может подменить ID. Заменить на извлечение userId из JWT claims (SecurityUtils или аналог для portal-jwt).
- **Критерий готовности**:
  - 0 endpoints принимают `portalUserId` как @RequestParam
  - portalUserId извлекается из JWT на уровне SecurityContext
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Audit всех portal endpoints с portalUserId → заменить на JWT extraction → тест компиляции

---

#### [S1-03] Убрать Hardcoded Credentials из Git

- **Приоритет**: P1 (НЕМЕДЛЕННО)
- **Модули**: infrastructure (docker-compose, application.yml)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.X-architecture.md` §2 (hardcoded credentials), `1.0-overview.md` P1#1, `FINAL-REPORT.md` B8, `BUGS.md` #484-485
- **Описание**:
  docker-compose.yml содержит POSTGRES_PASSWORD, JWT_SECRET, MINIO credentials, Chekka API key. application.yml содержит credentials. Заменить на `${ENV_VAR:default_for_dev}` паттерн. Создать `.env.example` с описанием всех переменных.
- **Критерий готовности**:
  - Grep по `password`, `secret`, `api.key` в yml/docker-compose не находит реальных значений
  - `.env.example` создан с описанием всех переменных
  - docker-compose up работает с .env файлом
  - application.yml использует `${VAR}` синтаксис

**Сессии Claude Code:**
1. *Сессия 1*: Audit credentials → заменить на env vars → создать .env.example → проверить запуск

---

#### [S1-04] Fix ddl-auto + JWT Secret Validation + CORS + WebSocket Auth

- **Приоритет**: P1 (НЕМЕДЛЕННО)
- **Модули**: backend config, security
- **Зависимости**: нет
- **Объём**: M (2 сессии)
- **Источник**: `1.X-architecture.md` §2 (ddl-auto §B9, JWT §B10, CORS §B11, WebSocket §B12), `FINAL-REPORT.md` B9-B12
- **Описание**:
  4 быстрых security-фикса в одном блоке:
  1. `application-prod.yml`: `ddl-auto: validate` (не `update`)
  2. JWT secret: `throw` exception если длина < 32 символов в prod profile (вместо `warn`)
  3. CORS: `allowedHeaders(*)` → explicit list `[Content-Type, Authorization, Accept, X-Requested-With]`
  4. WebSocket: `/ws/**` require authentication при handshake (добавить JWT token validation в WebSocket config)
- **Критерий готовности**:
  - `ddl-auto: validate` в prod profile
  - Приложение не стартует с JWT secret < 32 символов в prod
  - CORS allowedHeaders — explicit list
  - WebSocket handshake требует valid JWT
  - Backend компилируется + тесты проходят

**Сессии Claude Code:**
1. *Сессия 1*: ddl-auto + JWT validation + CORS fix
2. *Сессия 2*: WebSocket auth (StompChannelInterceptor или HandshakeInterceptor) + тесты

---

#### [S1-05] Fix Webhook HMAC + PII Masking в Logback

- **Приоритет**: P1 (НЕМЕДЛЕННО / До запуска)
- **Модули**: subscription, logging
- **Зависимости**: нет
- **Объём**: M (2 сессии)
- **Источник**: `1.24-admin-settings-subscription-monitoring.md` §3 BUG-150 (webhook HMAC), `1.X-architecture.md` §2 (PII в логах), `FINAL-REPORT.md` B13/B18, `BUGS.md` #460/#490
- **Описание**:
  1. **Webhook HMAC**: если `YOOKASSA_WEBHOOK_SECRET` не задан → throw exception при старте (вместо skip verification). Без этого любой может POST на webhook и активировать подписку.
  2. **PII masking**: добавить logback pattern replacement для email, password, ИНН, СНИЛС, passport. Использовать `%replace` или custom layout в logback-spring.xml.
- **Критерий готовности**:
  - Приложение не стартует без YOOKASSA_WEBHOOK_SECRET в prod profile
  - Логи не содержат PII (тест: попробовать залогировать request с email/password → проверить stdout)
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Webhook HMAC mandatory + logback PII masking patterns
2. *Сессия 2*: Тест PII masking на реальных request patterns + документация

---

### Спринт 2 — TENANT ISOLATION: INFRASTRUCTURE (2 недели)

> RLS, MinIO, Redis, базовые entities. Фундамент для всех остальных tenant-фиксов.

---

#### [S2-01] PostgreSQL Row Level Security (RLS)

- **Приоритет**: P1
- **Модули**: database, infrastructure
- **Зависимости**: нет
- **Объём**: L (4 сессии)
- **Источник**: `1.X-architecture.md` §2 (PostgreSQL RLS отсутствует), `FINAL-REPORT.md` B3, `GOLD-STANDARD.md` §3.1
- **Описание**:
  Создать RLS policy на все tenant-scoped таблицы. Это 4-й слой защиты (после Hibernate @Filter, TenantFilterInterceptor, service validation). Необходимо:
  1. Flyway-миграция: `CREATE POLICY` на каждую таблицу с `organization_id`
  2. SET app.current_org_id на уровне connection (через Hibernate connection customizer или AOP)
  3. Тестирование: native SQL query не видит данные другого тенанта
  4. Обработка суперадмин-доступа (bypass RLS для admin panel)
- **Критерий готовности**:
  - RLS policy на ВСЕХ таблицах с organization_id
  - Native SQL запросы возвращают ТОЛЬКО данные текущего тенанта
  - SuperAdmin может видеть все данные
  - Backend компилируется + тесты проходят
  - Flyway миграции применяются без ошибок

**Сессии Claude Code:**
1. *Сессия 1*: Research — список ВСЕХ таблиц с organization_id, проектирование RLS strategy
2. *Сессия 2*: Flyway-миграция CREATE POLICY для финансовых таблиц (budgets, invoices, contracts, payments)
3. *Сессия 3*: RLS для остальных таблиц + connection-level SET app.current_org_id (AOP/interceptor)
4. *Сессия 4*: SuperAdmin bypass + тестирование + edge cases (reports, cross-project queries)

---

#### [S2-02] MinIO Tenant Prefix

- **Приоритет**: P1
- **Модули**: infrastructure, storage
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.X-architecture.md` §2 (MinIO без tenant prefix), `FINAL-REPORT.md` B4
- **Описание**:
  Файлы хранятся как `{UUID}.ext` — знание UUID = cross-tenant file access. Изменить key format на `{organizationId}/{UUID}.ext`. Миграция существующих файлов — отдельная задача (скрипт).
- **Критерий готовности**:
  - Новые файлы сохраняются как `{orgId}/{UUID}.ext`
  - Загрузка файлов проверяет orgId в path === current tenant
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Изменить FileStorageService → tenant-prefixed keys + URL generation + access check

---

#### [S2-03] Redis Tenant Namespace

- **Приоритет**: P1
- **Модули**: infrastructure, cache
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.X-architecture.md` §2 (Redis без tenant namespace), `FINAL-REPORT.md` B5
- **Описание**:
  Permission cache и другие кэши shared между тенантами. Добавить namespace: `{cacheName}:{orgId}:{key}`. Изменить RedisCacheManager config или кастомный key generator.
- **Критерий готовности**:
  - Все Redis-ключи содержат orgId
  - Cache eviction работает per-tenant
  - Backend компилируется + тесты проходят

**Сессии Claude Code:**
1. *Сессия 1*: Redis cache key prefix с orgId + cache config update + тест изоляции

---

#### [S2-04] Tenant Isolation Wave 1 — Финансы + HR (критичные PII)

- **Приоритет**: P1
- **Модули**: finance, hr, payroll, leave, recruitment, selfEmployed
- **Зависимости**: нет (application-level, не зависит от RLS)
- **Объём**: XL (8 сессий)
- **Источник**: `1.22-leave-payroll-selfemployed-recruitment.md` §3 (HR entities), `1.21-hr-hrRussian.md` §3 (EmploymentContract), `1.6-operations-site.md` §3 (Dispatch/DailyReport/M29), `1.14-tasks-calendar.md` §3 (Calendar), `1.26-legal-mail-messenger-ai-help.md` §3 (EmailMessage), `1.1-finance.md` §3 (BudgetService NPE), `FINAL-REPORT.md` B2 Кластер 1
- **Описание**:
  Первая волна — entities с финансовыми данными и PII (зарплаты, контракты, персональные данные). Для каждой entity:
  1. Flyway: `ALTER TABLE ADD COLUMN organization_id BIGINT`, `UPDATE SET organization_id = ...`, `ADD NOT NULL`, `CREATE INDEX`
  2. Entity: добавить `organizationId` + `@Filter`
  3. Service: добавить `SecurityUtils.getCurrentOrganizationId()` в create/list/get
  4. Repository: добавить `findByOrganizationIdAnd...` методы

  **Entities (волна 1, ~35 шт):**
  - HR: LeaveType, LeaveRequest, LeaveAllocation, PayrollTemplate, PayrollCalculation, Applicant, JobPosition, Interview, SelfEmployedContractor, SelfEmployedPayment, SelfEmployedRegistry, EmploymentContract (fix createContract)
  - Finance: BudgetService NPE fix, CashFlowEntry idempotency
  - Operations: DispatchOrder, DailyReport, M29Document
  - Calendar: CalendarEvent, ConstructionSchedule
  - Email: EmailMessage
- **Критерий готовности**:
  - ВСЕ перечисленные entities имеют organization_id + @Filter + index
  - create-методы устанавливают organizationId из SecurityUtils
  - list-методы фильтруют по organizationId
  - Flyway-миграции корректны
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Flyway-миграция для HR entities (12 таблиц) + entity changes
2. *Сессия 2*: Service/Repository changes для HR entities
3. *Сессия 3*: Flyway + entity + service для Leave + Payroll + SelfEmployed
4. *Сессия 4*: Flyway + entity + service для Operations (Dispatch, DailyReport, M29)
5. *Сессия 5*: Calendar entities + EmailMessage + fix EmploymentContract.createContract
6. *Сессия 6*: Finance fixes — BudgetService NPE, CashFlowEntry dedup, hardcoded 0.85
7. *Сессия 7*: Тестирование — компиляция, запуск, проверка что данные не утекают
8. *Сессия 8*: Финальная проверка + fix edge cases

---

### Спринт 3 — TENANT ISOLATION: REMAINING + AUTH (2 недели)

> Оставшиеся ~290 entities + @PreAuthorize на 200+ endpoints.

---

#### [S3-01] Tenant Isolation Wave 2 — BIM, Portal, Documents, Processes

- **Приоритет**: P1
- **Модули**: bim, portal, documents, processes, design, workflow, planning, dashboard
- **Зависимости**: S2-04 (паттерн отработан)
- **Объём**: XL (10 сессий)
- **Источник**: `1.18-bim.md` §3 (11 entities), `1.17-portal.md` §3 (3 entities), `1.16-documents-dataexchange-integration1c.md` §3 (CDE 6+PTO 5), `1.15-processes.md` §3 (RFI/Issues/CO), `1.20-design.md` §3 (3 entities), `1.19-workflow-approval.md` §3 (6 methods), `1.13-planning.md` §3 (3 entities), `1.12-dashboard-analytics.md` §3 (3 entities), `1.25-closeout-maintenance.md` §3 (5 entities), `1.10-fleet-iot.md` §3 (IoT 5), `FINAL-REPORT.md` B2 (324 entities)
- **Описание**:
  Вторая волна — оставшиеся ~290 entities без organizationId. Тот же шаблон: Flyway + entity + @Filter + service fix. Группировка по модулям:

  **BIM (11):** BimModel, BimElement, BimClash, BimVersion, BimViewer, DesignPackage, DesignDrawing, DrawingAnnotation, PhotoProgress, PhotoComparison, PhotoAlbum
  **Portal (3):** PortalMessage, PortalProject, PortalDocument
  **Documents/CDE (11):** DocumentContainer, DocumentRevision, Transmittal, RevisionSet, TransmittalItem, DocumentAuditEntry + 5 PTO entities
  **Processes (5+):** RFI list/get/overdue org filter, Issues, Submittals, ChangeOrderRequest
  **Design (3):** DesignVersion, DesignReview, DesignSection
  **Workflow (6):** WorkflowDefinition, AutomationExecution, approval chain/step/history methods
  **Planning (3):** EvmSnapshot, ScheduleBaseline, ResourceAllocation
  **Dashboard (3):** Dashboard, KpiDefinition, SavedReport
  **Maintenance (5):** MaintenanceRequest, MaintenanceEquipment, PreventiveSchedule, MaintenanceTeam, MaintenanceStage
  **IoT (5):** IoTDevice + 4 связанных таблицы
  **Other:** Collaborator, ReportingDeadline, AiConversation, QualityCertificate, FuelRecord, VehicleAssignment
- **Критерий готовности**:
  - 0 entities без organizationId (кроме справочных таблиц)
  - Все service-методы используют orgId для CRUD
  - Backend компилируется
  - Flyway миграции применяются

**Сессии Claude Code:**
1. *Сессия 1*: BIM — 11 entities: Flyway + entity + @Filter
2. *Сессия 2*: BIM — service/repository changes для 11 entities
3. *Сессия 3*: Portal (3) + Documents/CDE (6 entities) — Flyway + entity
4. *Сессия 4*: Documents PTO (5) + service changes for all documents
5. *Сессия 5*: Processes — RFI/Issues/Submittals org filter + ChangeOrderRequest entity
6. *Сессия 6*: Design (3) + Workflow (6 service methods) + Planning (3)
7. *Сессия 7*: Dashboard (3) + Maintenance (5) — Flyway + entity + service
8. *Сессия 8*: IoT (5) + Other (Collaborator, ReportingDeadline, AiConversation, etc.)
9. *Сессия 9*: Cross-check — полный grep на entities без @Filter
10. *Сессия 10*: Финальная компиляция + smoke test всех модулей

---

#### [S3-02] @PreAuthorize на 200+ GET Endpoints

- **Приоритет**: P2 (High)
- **Модули**: ВСЕ backend controllers (25+ контроллеров)
- **Зависимости**: нет
- **Объём**: L (5 сессий)
- **Источник**: `1.7-safety.md` §3 (15+), `1.8-quality-regulatory.md` §3 (20+), `1.9-supply-warehouse-procurement.md` §3 (22+), `1.18-bim.md` §3 (32), `1.13-planning.md` §3 (29), `1.14-tasks-calendar.md` §3 (14+), `1.15-processes.md` §3 (35+), `1.16-documents-dataexchange-integration1c.md` §3 (22+), `1.22-leave-payroll-selfemployed-recruitment.md` §3 (28+), `1.23-sales-crm-portfolio-bidmanagement.md` §3 (14+), `1.20-design.md` §3 (8), `1.19-workflow-approval.md` §3 (5), `1.26-legal-mail-messenger-ai-help.md` §3 (7+10), `1.25-closeout-maintenance.md` §3 (10+11), `FINAL-REPORT.md` B6 (200+ endpoints)
- **Описание**:
  200+ GET endpoints не имеют @PreAuthorize — любой аутентифицированный пользователь видит всё (зарплаты, PII, финансы). Добавить:
  - Минимум `@PreAuthorize("isAuthenticated()")` на все endpoints
  - Ролевую авторизацию где возможно: ADMIN/MANAGER для finance, HR для payroll, etc.
  - Использовать существующую RBAC матрицу из routePermissions.ts как reference
- **Критерий готовности**:
  - 0 GET endpoints без @PreAuthorize (grep-проверка)
  - Ролевые ограничения на sensitive endpoints (payroll, finance, admin)
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Safety (15) + Quality (20) + Warehouse (22) controllers
2. *Сессия 2*: BIM (32) + Planning (29) + Calendar (14) controllers
3. *Сессия 3*: Processes (35) + Documents (22) + HR (28) controllers
4. *Сессия 4*: Sales (14) + Design (8) + Workflow (5) + Legal (7) + Messenger (10) controllers
5. *Сессия 5*: Closeout (10) + Maintenance (11) + remaining + verification grep

---

### Спринт 4 — IDOR + DATA INTEGRITY + STUBS (2 недели)

> Ownership checks, НДС, sequence generators, global UNIQUE constraints.

---

#### [S4-01] Fix IDOR в 15+ Сервисах

- **Приоритет**: P1
- **Модули**: contracts, projects, sales, hr, ai, workflow, portal
- **Зависимости**: S2-04, S3-01 (tenant isolation должен быть готов)
- **Объём**: L (4 сессии)
- **Источник**: `1.4-contracts.md` §3 (ContractExt IDOR 8 ops), `1.11-projects-site-assessments.md` §3 (Milestone/Collaborator), `1.23-sales-crm-portfolio-bidmanagement.md` §3 (BidInvitation/BidEvaluation), `1.21-hr-hrRussian.md` §3 (EmploymentContract), `1.19-workflow-approval.md` §3 (ApprovalStep), `1.26-legal-mail-messenger-ai-help.md` §3 (AI IDOR), `1.17-portal.md` §3 (4 services), `FINAL-REPORT.md` B15
- **Описание**:
  IDOR — операции без проверки ownership/org:
  - ContractExt: 8 create операций без org check
  - Milestone: update/delete без tenant check
  - BidInvitation/BidEvaluation: findById без org filter
  - EmploymentContract: findById без org filter
  - ApprovalStep: approve/reject без ownership/approver check
  - AI: resolveConversation без userId check
  - Portal: 4 services getById без ownership
  Для каждого: добавить проверку `entity.organizationId == currentOrgId` и/или `entity.createdBy == currentUserId`.
- **Критерий готовности**:
  - Все перечисленные сервисы проверяют ownership
  - Попытка доступа к чужим данным → 403 Forbidden
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: ContractExt (8 ops) + Milestone IDOR fix
2. *Сессия 2*: BidInvitation + BidEvaluation + EmploymentContract
3. *Сессия 3*: ApprovalStep ownership + AI resolveConversation userId check
4. *Сессия 4*: Portal IDOR (4 services) + final verification

---

#### [S4-02] Fix НДС 22% Глобально

- **Приоритет**: P1
- **Модули**: finance, estimates, contracts, frontend (FmPage)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.1-finance.md` §3 BUG-F1 (VatCalculator 20%), `1.2-estimates-pricing.md` §3 (LocalEstimate НДС), `1.4-contracts.md` (Contract НДС), `FINAL-REPORT.md` B14, `IMPROVEMENTS.md` Must-Have #9
- **Описание**:
  VatCalculator.DEFAULT_RATE = 0.20 (должно быть 0.22 с 2026). Также НДС hardcoded в:
  - Contract entity
  - Invoice entity
  - LocalEstimate creation
  - FmPage.tsx + FmItemsTable.tsx (уже исправлено на 0.20, нужно 0.22)
  Сделать configurable через application.yml `app.vat.default-rate: 0.22` с возможностью override per-tenant.
- **Критерий готовности**:
  - НДС = 22% по умолчанию
  - Configurable через application.yml
  - grep `0.20` / `0.2` / `20%` в финансовых модулях → 0 hardcoded мест
  - Backend + frontend build success

**Сессии Claude Code:**
1. *Сессия 1*: VatCalculator → configurable + все frontend/backend references → 22%

---

#### [S4-03] Fix Global UNIQUE → Tenant-scoped UNIQUE

- **Приоритет**: P1
- **Модули**: specifications, operations, supply, projects
- **Зависимости**: S2-04, S3-01 (organization_id добавлен)
- **Объём**: S (1 сессия)
- **Источник**: `1.5-specifications.md` §3 BUG-S2 (Specification.name), `1.6-operations-site.md` §3 (M29Document.name), `1.9-supply-warehouse-procurement.md` §3 (PurchaseRequest.name), `FINAL-REPORT.md` B17
- **Описание**:
  8+ таблиц имеют `UNIQUE(name)` вместо `UNIQUE(organization_id, name)`:
  Specification.name, M29Document.name, PurchaseRequest.name, WorkOrder.code и др.
  Тенант B блокирован если тенант A использовал такое же имя.
  Flyway: DROP old UNIQUE + ADD new UNIQUE(org_id, name).
- **Критерий готовности**:
  - Все UNIQUE constraints включают organization_id
  - Два тенанта могут иметь одинаковые name/code
  - Flyway миграция применяется

**Сессии Claude Code:**
1. *Сессия 1*: Flyway миграция для всех 8+ таблиц: DROP + ADD composite UNIQUE

---

#### [S4-04] Fix AtomicLong → DB Sequence

- **Приоритет**: P1
- **Модули**: operations (DispatchService), documents (PtoCodeGenerator)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.6-operations-site.md` §3 BUG-O9 (DispatchService.orderSequence), `1.16-documents-dataexchange-integration1c.md` §3 (PtoCodeGenerator), `FINAL-REPORT.md` B24
- **Описание**:
  DispatchService.orderSequence и PtoCodeGenerator используют AtomicLong — сбрасываются при рестарте → коллизии номеров. Заменить на PostgreSQL SEQUENCE (per-tenant или global).
- **Критерий готовности**:
  - DB sequence вместо AtomicLong
  - Номера уникальны после рестарта
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Flyway CREATE SEQUENCE + service refactor для обоих мест

---

#### [S4-05] Удалить Production Stubs (критичные)

- **Приоритет**: P1
- **Модули**: bim, analytics, safety, tasks, closeout
- **Зависимости**: нет
- **Объём**: M (3 сессии)
- **Источник**: `1.18-bim.md` §3 (simulateClashDetection), `1.25-closeout-maintenance.md` §3 (computeChecklistMetrics), `1.7-safety.md` §3 (countOverdueTrainings=0), `1.14-tasks-calendar.md` §3 (hasAccess=true), `1.12-dashboard-analytics.md` §3 (hardcoded 0.85, DEFECT_WEIGHT), `FINAL-REPORT.md` B23/B26
- **Описание**:
  Стабы, которые пишут FAKE данные в DB или возвращают ложную информацию:
  1. `simulateClashDetection()` — пишет Random данные в production DB → заменить на честный "not implemented" ответ или убрать
  2. `computeChecklistMetrics()` — fabricates IN_PROGRESS=60%, FAILED=20% → считать реально из DB
  3. `SafetyRiskScoringService.countOverdueTrainings()` = always 0 → реальный COUNT WHERE deadline < NOW()
  4. `TaskParticipantService.hasAccess()` = always true → реальная проверка через project membership
  5. `AnalyticsDataService hardcoded 0.85` → реальный SUM(actual_cost)/SUM(planned_cost)
  6. `PredictiveAnalyticsService DEFECT_WEIGHT copy-paste` → fix weight values
- **Критерий готовности**:
  - 0 стабов, пишущих fake данные в DB
  - Все метрики считаются из реальных данных
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: simulateClashDetection → stub/error + computeChecklistMetrics → real query
2. *Сессия 2*: countOverdueTrainings → real + hasAccess → real check + hardcoded 0.85 → real
3. *Сессия 3*: DEFECT_WEIGHT fix + финальный grep на оставшиеся `return 0` / `return true` stubs

---

#### [S4-06] Fix N+1 + In-Memory Pagination в BudgetService

- **Приоритет**: P1
- **Модули**: finance (backend)
- **Зависимости**: нет
- **Объём**: M (2 сессии)
- **Источник**: `1.1-finance.md` §3 BUG-F14 (BudgetService N+1 + in-memory pagination), `1.X-architecture.md` (InvoiceMatchingEngine, recalculateKs3Totals), `FINAL-REPORT.md` B25
- **Описание**:
  `BudgetService.getExpenses()` загружает ВСЕ записи в RAM → OOM при реальных данных. Также: `InvoiceMatchingEngine`, `recalculateKs3Totals`, `getPendingForUser` — N+1 queries.
  Заменить на: DB-level pagination (Pageable), JOIN FETCH для связанных entities, batch queries.
- **Критерий готовности**:
  - getExpenses использует DB pagination (Pageable)
  - N+1 queries заменены на JOIN FETCH / @EntityGraph
  - При 10K+ записях нет OOM
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: BudgetService.getExpenses → Pageable + JOIN FETCH
2. *Сессия 2*: InvoiceMatchingEngine + recalculateKs3Totals + getPendingForUser → batch queries

---

## ЭТАП 2: ЯДРО — Спринты 5-8

> **Цель**: core business flow работает end-to-end. Финансы, документы, печатные формы.

---

### Спринт 5 — ФИНАНСОВОЕ ЯДРО (2 недели)

---

#### [S5-01] Реализовать 5 Стабов EstimateAdvancedService

- **Приоритет**: P1
- **Модули**: estimates (backend + frontend)
- **Зависимости**: S4-02 (НДС 22%)
- **Объём**: XL (8 сессий)
- **Источник**: `1.2-estimates-pricing.md` §3 BUG-E1..E5 (5 стабов EstimateAdvancedService), `FINAL-REPORT.md` B26, `IMPROVEMENTS.md` Must-Have #24-27
- **Описание**:
  5 стабов — ядро сметного модуля:
  1. `searchNormativeRates()` — поиск по ГЭСН/ФЕР/ТЕР справочнику (можно начать с embedded JSON, потом DB)
  2. `importLsr()` — уже частично реализован, доработать полный pipeline
  3. `getComparison()` — сравнение смет (plan vs fact, version vs version)
  4. `exportEstimate()` — экспорт в формат ГРАНД-Смета XML
  5. `validateForExport()` — валидация полноты сметы перед экспортом
- **Критерий готовности**:
  - Все 5 методов возвращают реальные данные
  - importLsr создаёт полную иерархию (разделы → позиции → ресурсы)
  - exportEstimate генерирует валидный XML
  - Backend компилируется + тесты

**Сессии Claude Code:**
1. *Сессия 1*: searchNormativeRates — data model + embedded ГЭСН/ФЕР index + search API
2. *Сессия 2*: searchNormativeRates — frontend integration (autocomplete, preview)
3. *Сессия 3*: importLsr — доработка полного pipeline с коэффициентами
4. *Сессия 4*: importLsr — frontend wizard improvements + error handling
5. *Сессия 5*: getComparison — backend logic (version diff, plan-fact)
6. *Сессия 6*: getComparison — frontend comparison UI
7. *Сессия 7*: exportEstimate — ГРАНД-Смета XML format + validateForExport
8. *Сессия 8*: Integration tests + edge cases

---

#### [S5-02] Fix CashFlowEntry Idempotency

- **Приоритет**: P1
- **Модули**: finance (backend)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Источник**: `1.1-finance.md` §3 BUG-F8 (CashFlowEntry дублирование), `FINAL-REPORT.md` §4 Кластер 4
- **Описание**:
  При повторной оплате счёта создаются дублирующие CashFlowEntry. Добавить `UNIQUE(invoice_id, payment_date, amount)` или idempotency key.
- **Критерий готовности**:
  - Дубли невозможны (DB constraint)
  - Повторная оплата → 409 Conflict или update existing
  - Flyway миграция + backend fix

**Сессии Claude Code:**
1. *Сессия 1*: Flyway UNIQUE constraint + service idempotency check

---

#### [S5-03] Dual Entity Cleanup

- **Приоритет**: P1
- **Модули**: procurement, sales (bidManagement)
- **Зависимости**: S3-01 (tenant isolation)
- **Объём**: M (3 сессии)
- **Источник**: `1.9-supply-warehouse-procurement.md` §3 BUG-W1 (Dual PurchaseOrder), `1.23-sales-crm-portfolio-bidmanagement.md` §3 BUG-130 (Dual BidPackage), `FINAL-REPORT.md` §4 P3 Duplicate modules
- **Описание**:
  2 критических дублирования:
  1. **Dual PurchaseOrder**: `procurement.PurchaseOrder` + `procurementExt.PurchaseOrder` маппят ОДНУ таблицу с разными status enum → data corruption. Объединить в один entity.
  2. **Dual BidPackage**: `bidManagement.BidPackage` + `portfolio.BidPackage` → Portfolio-версия без @Filter. Объединить.
- **Критерий готовности**:
  - 1 PurchaseOrder entity с единым status enum
  - 1 BidPackage entity с @Filter
  - Frontend адаптирован
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: PurchaseOrder merge — backend (entity + service + controller)
2. *Сессия 2*: BidPackage merge — backend + frontend
3. *Сессия 3*: Frontend adaptation + тесты

---

### Спринт 6 — ПЕЧАТНЫЕ ФОРМЫ (2 недели)

---

#### [S6-01] КС-2 / КС-3 PDF по ГОСТ

- **Приоритет**: P1 (Must Have)
- **Модули**: closing (backend), russianDocs
- **Зависимости**: S4-02 (НДС 22%)
- **Объём**: L (6 сессий)
- **Источник**: `1.3-closing-russiandocs-execdocs.md` §3 (КС-2/КС-3 PDF = toast-заглушки), `GOLD-STANDARD.md` §16 (печатные формы по ГОСТ), `IMPROVEMENTS.md` Must-Have #13
- **Описание**:
  Генерация КС-2 (акт выполненных работ) и КС-3 (справка о стоимости) в PDF по Постановлению Госкомстата РФ от 11.11.1999 № 100. Использовать OpenPDF или iText. Формы должны содержать:
  - Все обязательные поля по ГОСТ
  - Правильный НДС (22%)
  - Заполнение из данных системы (проект, контрагент, работы, суммы)
  - Возможность скачать PDF и напечатать
- **Критерий готовности**:
  - КС-2 PDF генерируется по данным из системы
  - КС-3 PDF генерируется
  - Форматы соответствуют ГОСТ (проверить визуально)
  - Кнопки "Скачать PDF" на frontend
  - НДС = 22%

**Сессии Claude Code:**
1. *Сессия 1*: КС-2 template — OpenPDF layout по ГОСТ (структура, шрифты, размеры)
2. *Сессия 2*: КС-2 data mapping — заполнение из Ks2Entity + Ks2LineEntity
3. *Сессия 3*: КС-3 template + data mapping
4. *Сессия 4*: Backend endpoint `GET /api/closing/ks2/{id}/pdf` + `ks3/{id}/pdf`
5. *Сессия 5*: Frontend — кнопки скачивания, предпросмотр
6. *Сессия 6*: Тестирование с реальными данными + edge cases (длинные names, many lines)

---

#### [S6-02] М-29 + Счёт/СФ/УПД PDF

- **Приоритет**: P1 (Must Have)
- **Модули**: operations (М-29), finance (Счёт/СФ/УПД)
- **Зависимости**: S6-01 (OpenPDF infrastructure)
- **Объём**: L (5 сессий)
- **Источник**: `1.6-operations-site.md` §4 (М-29 export = toast), `1.1-finance.md` (Счёт/СФ), `GOLD-STANDARD.md` §16, `IMPROVEMENTS.md` Must-Have #14/18
- **Описание**:
  1. **М-29** — отчёт о расходе материалов на строительстве (по данным warehouse + m29Document)
  2. **Счёт на оплату** — стандартный вид
  3. **Счёт-фактура** — по Постановлению Правительства №1137
  4. **УПД (универсальный передаточный документ)** — объединяет счёт-фактуру и товарную накладную
- **Критерий готовности**:
  - М-29 PDF генерируется из данных системы
  - Счёт/СФ/УПД PDF с правильными реквизитами
  - Backend endpoints + frontend кнопки

**Сессии Claude Code:**
1. *Сессия 1*: М-29 template + data mapping
2. *Сессия 2*: Счёт на оплату template
3. *Сессия 3*: Счёт-фактура по Постановлению №1137
4. *Сессия 4*: УПД + backend endpoints для всех 4 форм
5. *Сессия 5*: Frontend integration + тестирование

---

#### [S6-03] Т-12/Т-13 Табель + АОСР

- **Приоритет**: P2 (Should Have)
- **Модули**: hr (Т-12/Т-13), closing/execDocs (АОСР)
- **Зависимости**: S6-01 (OpenPDF infrastructure)
- **Объём**: L (4 сессии)
- **Источник**: `1.21-hr-hrRussian.md` §4 (0 печатных форм), `1.3-closing-russiandocs-execdocs.md` §3 (АОСР), `GOLD-STANDARD.md` §16, `IMPROVEMENTS.md` Must-Have #15/17
- **Описание**:
  1. **Т-12** — табель учёта рабочего времени (полная версия)
  2. **Т-13** — табель (сокращённая версия)
  3. **АОСР** — акт скрытых работ (обязательная исполнительная документация)
- **Критерий готовности**:
  - Т-12/Т-13 PDF генерируется из hr timesheet данных
  - АОСР PDF генерируется
  - Backend endpoints + frontend buttons

**Сессии Claude Code:**
1. *Сессия 1*: Т-13 template + data mapping from timesheets
2. *Сессия 2*: Т-12 template (расширенный)
3. *Сессия 3*: АОСР template + data mapping from execDocs
4. *Сессия 4*: Backend endpoints + frontend integration

---

### Спринт 7 — ДОКУМЕНТЫ + WORKFLOW (2 недели)

---

#### [S7-01] ExecDocs Backend (5 entities + CRUD)

- **Приоритет**: P1 (Must Have)
- **Модули**: execDocs (backend + frontend)
- **Зависимости**: S3-01 (tenant isolation)
- **Объём**: L (5 сессий)
- **Источник**: `1.3-closing-russiandocs-execdocs.md` §3 BUG-C12 (5 execDocs страниц = localStorage), `IMPROVEMENTS.md` Must-Have #20
- **Описание**:
  5 frontend страниц execDocs работают на localStorage — данные теряются при очистке кэша. Создать:
  1. Backend entities: AosrDocument, Ks6Journal, WeldingJournal, IncomingControlAct, SpecialJournal
  2. Flyway-миграции
  3. REST controllers + DTOs
  4. Перевести frontend на API calls
- **Критерий готовности**:
  - 5 entities с CRUD endpoints
  - Frontend использует API вместо localStorage
  - Данные сохраняются в БД
  - Tenant isolation (organization_id)

**Сессии Claude Code:**
1. *Сессия 1*: Entity + Flyway для AosrDocument + Ks6Journal
2. *Сессия 2*: Entity + Flyway для WeldingJournal + IncomingControlAct + SpecialJournal
3. *Сессия 3*: Services + Controllers + DTOs для всех 5
4. *Сессия 4*: Frontend migration — localStorage → API calls
5. *Сессия 5*: Тестирование + edge cases

---

#### [S7-02] Объединение 2 Систем Согласования

- **Приоритет**: P2 (Should Have)
- **Модули**: workflow, approval
- **Зависимости**: S3-01 (tenant isolation в обоих)
- **Объём**: L (5 сессий)
- **Источник**: `1.19-workflow-approval.md` §3 (2 конкурирующие системы approval + workflowEngine), `IMPROVEMENTS.md` Should-Have (объединение 2 систем)
- **Описание**:
  Сейчас 2 конкурирующие системы: `approval` (Chain/Step model) + `workflowEngine` (Instance model). Двойная attack surface, дублирование, путаница. Объединить в единый Workflow Engine:
  - Сохранить лучшее: ApprovalInbox UI (лучший), batch decisions, SLA urgency, ConditionBuilder
  - Мигрировать все chain-based approvals на unified engine
  - Удалить дублирующий модуль
- **Критерий готовности**:
  - 1 система согласования (не 2)
  - ApprovalInbox работает через unified engine
  - Все существующие workflows мигрированы
  - Backend компилируется + frontend works

**Сессии Claude Code:**
1. *Сессия 1*: Analysis — mapping approval→workflow fields, migration plan
2. *Сессия 2*: Backend — unified WorkflowEngine service
3. *Сессия 3*: Flyway data migration + API adaptation
4. *Сессия 4*: Frontend — unified ApprovalInbox + WorkflowBuilder
5. *Сессия 5*: Remove old module + тесты

---

#### [S7-03] Fix Frontend↔Backend Mismatches (10+ модулей)

- **Приоритет**: P2
- **Модули**: bim, closeout, design, fleet, contracts, operations, procurement, recruitment, leave
- **Зависимости**: S3-01 (new fields may need tenant)
- **Объём**: L (4 сессии)
- **Источник**: `1.18-bim.md` §3 (10+ API path mismatches), `1.25-closeout-maintenance.md` §3 (6 API paths), `1.20-design.md` §3 (15+ field mismatches), `1.4-contracts.md` §3 BUG-C5 (status enums), `1.6-operations-site.md` §3 (Dispatch status), `1.22-leave-payroll-selfemployed-recruitment.md` §3 (Recruitment/Leave/Payroll enums)
- **Описание**:
  10+ модулей имеют status enum / API path / field mismatches:
  - BIM: 10+ API path mismatches
  - Closeout: 6 API path mismatches → 404
  - Design: 15+ field mismatches → undefined on list pages
  - Contracts: COMPLETED/TERMINATED vs CLOSED/CANCELLED
  - Operations: Dispatch DRAFT/SCHEDULED vs PLANNED
  - Recruitment: SCREENING vs INITIAL_QUALIFICATION
  - Leave/Payroll: PIECE_RATE/MIXED vs PIECEWORK/BONUS
- **Критерий готовности**:
  - 0 frontend API calls returning 404 due to path mismatch
  - Status enums synchronized
  - List pages show real data (no undefined)

**Сессии Claude Code:**
1. *Сессия 1*: BIM (10+) + Closeout (6) path fixes
2. *Сессия 2*: Design (15+ fields) + Contracts (status) fixes
3. *Сессия 3*: Operations + Recruitment + Leave/Payroll enum fixes
4. *Сессия 4*: Smoke test all affected pages + fix remaining

---

### Спринт 8 — UX NAVIGATION + MOCK PAGES (2 недели)

---

#### [S8-01] Реструктуризация Навигации: 24 → 10 Групп

- **Приоритет**: P1 (Must Have)
- **Модули**: config/navigation.ts, config/routePermissions.ts, frontend sidebar
- **Зависимости**: нет
- **Объём**: L (5 сессий)
- **Источник**: `1.UX-navigation.md` — **полный аудит: поштучные вердикты по ВСЕМ ~185 пунктам сайдбара** (§3 вердикты по 26 группам, §4 рекомендации по каждому пункту: merge/move/rename/delete/keep). Содержит целевую структуру 10 групп, ~60 пунктов, конкретные merge/rename для каждого дубля
- **Описание**:
  UX навигации = 3.0/10. 24 группы / ~185 пунктов (Procore ~12, PlanRadar ~7). Реструктуризация:
  1. **24 → 10 групп**: Главная, Проекты, Финансы, Документы, Снабжение, Кадры, Стройплощадка, Качество, Аналитика, Настройки
  2. **~185 → ~60 пунктов**: merge дублей, убрать нишевые (Калькулятор факторинга, IoT, BIM → скрыть)
  3. **Удалить 6+ дублей**: наряд-заказы ×2, штатное ×2, табели ×2, М-29 ×2
  4. **Переименовать 10+ непонятных**: RFI → Запросы, Сабмиталы → Согласования, CDE → Хранилище документов
  5. **Портал подрядчика** → отдельный URL (не в основном sidebar)
  6. **Мессенджер/Почта/Согласования** → кнопки в хедере с badge
- **Критерий готовности**:
  - ≤ 10 групп в sidebar
  - ≤ 60 пунктов
  - 0 дублей
  - Все пункты на русском (понятном)
  - Портал подрядчика на /portal/* (отдельный layout)

**Сессии Claude Code:**
1. *Сессия 1*: Plan — новая структура navigation.ts (10 групп, ~60 пунктов)
2. *Сессия 2*: navigation.ts + i18n keys перемещение/переименование
3. *Сессия 3*: routePermissions.ts update + sidebar component adaptation
4. *Сессия 4*: Header buttons (Messenger, Mail, Approvals) + Portal separate layout
5. *Сессия 5*: Тестирование навигации + fix broken links

---

#### [S8-02] Ролевая Фильтрация Навигации

- **Приоритет**: P1 (Must Have)
- **Модули**: config/navigation.ts, sidebar component
- **Зависимости**: S8-01 (новая структура)
- **Объём**: M (3 сессии)
- **Источник**: `1.UX-navigation.md` §5.4 #12-13 (ролевые наборы: Директор 15, Прораб 7, Сметчик 8, Кадровик 6, Снабженец 6, Бухгалтер 7), §5.4 #14 (per-user favorites)
- **Описание**:
  Прораб видит «Калькулятор факторинга» и «IoT датчики» — 185 пунктов для всех ролей. Реализовать:
  - Ролевые наборы: Директор (15), Прораб (7), Сметчик (8), Кадровик (6), Снабженец (6), Бухгалтер (7)
  - Фильтрация sidebar по текущей роли из authStore
  - Fallback для ADMIN: видит всё
- **Критерий готовности**:
  - Каждая роль видит ТОЛЬКО свои пункты
  - Прораб: ≤ 10 пунктов
  - ADMIN: видит всё
  - Нет 404 при навигации (все видимые пункты = рабочие)

**Сессии Claude Code:**
1. *Сессия 1*: Role→navigation mapping + filtering logic
2. *Сессия 2*: Sidebar component integration + authStore check
3. *Сессия 3*: Тестирование для каждой роли + fix edge cases

---

#### [S8-03] Подключить 12+ Mock Board Pages к API

- **Приоритет**: P2
- **Модули**: operations, safety, quality, procurement, bim, design, leave, recruitment, maintenance, contracts, processes
- **Зависимости**: S3-01 (tenant isolation)
- **Объём**: L (6 сессий)
- **Источник**: `1.6-operations-site.md` (WorkOrderBoard), `1.8-quality-regulatory.md` (PermitBoard), `1.15-processes.md` (ChangeOrderBoard), `1.20-design.md` (DesignReviewBoard), `1.22-leave-payroll-selfemployed-recruitment.md` (LeaveBoardPage, ApplicantBoardPage), `1.25-closeout-maintenance.md` (MaintenanceBoardPage), `1.23-sales-crm-portfolio-bidmanagement.md` (ContractorRatings), `FINAL-REPORT.md` §4 P2 (100% mock pages)
- **Описание**:
  12+ Kanban board pages используют `useState([])` — пустые или mock. Подключить к реальным API:
  WorkOrderBoard, PermitBoard, ChangeOrderBoard, DesignReviewBoard, ContractorRatings, LeaveBoardPage, ApplicantBoardPage, MaintenanceBoardPage, PredictiveAnalytics(frontend), CommissioningBoard, SafetyBoardPage(data), PortalSettings/Branding
- **Критерий готовности**:
  - Все board pages загружают данные из API
  - DnD работает (перетаскивание → API PATCH status)
  - Данные сохраняются при refresh

**Сессии Claude Code:**
1. *Сессия 1*: WorkOrderBoard + PermitBoard → API
2. *Сессия 2*: ChangeOrderBoard + DesignReviewBoard → API
3. *Сессия 3*: LeaveBoardPage + ApplicantBoardPage → API
4. *Сессия 4*: MaintenanceBoardPage + ContractorRatings → API
5. *Сессия 5*: CommissioningBoard + SafetyBoardPage → API
6. *Сессия 6*: Remaining boards + тестирование

---

## ЭТАП 3: SaaS-READY — Спринты 9-11

> **Цель**: мониторинг, тестирование, инфраструктура для production.

---

### Спринт 9 — МОНИТОРИНГ + BILLING (2 недели)

---

#### [S9-01] Реальные Health Checks + Backups

- **Приоритет**: P1 (Блокер B16)
- **Модули**: admin, monitoring, infrastructure
- **Зависимости**: нет
- **Объём**: M (3 сессии)
- **Источник**: `1.24-admin-settings-subscription-monitoring.md` §3 BUG-148..149 (5/6 health fake, backup simulated), `FINAL-REPORT.md` B16
- **Описание**:
  5/6 health checks = fake (return "UP" always). BackupService = simulated (log only).
  1. **Health checks**: PostgreSQL ping, Redis ping, MinIO bucket exists, WebSocket status, Flyway migration status
  2. **Backups**: pg_dump через ProcessBuilder, cron schedule, upload to MinIO, retention policy
  3. **Backup restore testing**: automated monthly restore to temp DB + verify row count
- **Критерий готовности**:
  - Health checks возвращают реальный статус
  - pg_dump создаёт реальный backup файл
  - Backup восстанавливается из dump
  - Admin dashboard показывает реальный health

**Сессии Claude Code:**
1. *Сессия 1*: Health checks — real implementations для всех 6 компонентов
2. *Сессия 2*: BackupService — pg_dump + MinIO storage + retention
3. *Сессия 3*: Backup restore test + admin dashboard integration

---

#### [S9-02] Billing Hardening: Dunning + Prorated + Free Tier

- **Приоритет**: P2 (Should Have)
- **Модули**: subscription, admin
- **Зависимости**: S1-05 (webhook HMAC)
- **Объём**: L (4 сессии)
- **Источник**: `1.24-admin-settings-subscription-monitoring.md` §4 (dunning, prorated), `COMPETITORS.md` §5 #4 (Free Tier — Fieldwire/MacroERP), `IMPROVEMENTS.md` Should-Have (billing)
- **Описание**:
  Billing gaps:
  1. **Dunning**: retry failed payments (3 attempts, increasing intervals), email notifications, grace period, account suspension
  2. **Prorated billing**: пересчёт при смене тарифа mid-cycle
  3. **Free Tier**: план "Бесплатный" — 1 проект, 3 пользователя, ограниченные модули (конкурент: Fieldwire $0, MacroERP $0)
  4. **Закрывающие документы**: автогенерация акта + счёт-фактуры для SaaS-клиентов
- **Критерий готовности**:
  - Failed payment → retry 3x → email → suspend
  - Upgrade mid-month → prorated charge
  - Free tier доступен на /pricing
  - Акт + СФ генерируются для каждого платежа

**Сессии Claude Code:**
1. *Сессия 1*: Dunning logic — retry, email, suspension
2. *Сессия 2*: Prorated billing calculation + YooKassa integration
3. *Сессия 3*: Free Tier — plan limits, feature gating
4. *Сессия 4*: Closing documents (акт + СФ) for SaaS + frontend

---

#### [S9-03] Structured Logging + Sentry

- **Приоритет**: P2 (Should Have)
- **Модули**: infrastructure (backend + frontend)
- **Зависимости**: S1-05 (PII masking)
- **Объём**: M (2 сессии)
- **Источник**: `1.X-architecture.md` §2 (plain text stdout, нет ELK/Loki, нет Sentry), `IMPROVEMENTS.md` Should-Have (structured logging + Sentry)
- **Описание**:
  1. **Structured JSON logging**: logstash-logback-encoder → JSON формат с traceId, userId, orgId, requestPath
  2. **Sentry**: error tracking для backend (Spring) + frontend (React). Автоматический capture exceptions + source maps.
- **Критерий готовности**:
  - Логи в JSON формате с enrichment (userId, orgId, traceId)
  - Sentry DSN настроен, ошибки появляются в Sentry
  - Source maps загружены для frontend
  - PII не попадает в Sentry (проверка)

**Сессии Claude Code:**
1. *Сессия 1*: logstash-logback-encoder + MDC enrichment (userId, orgId, traceId)
2. *Сессия 2*: Sentry backend (sentry-spring-boot) + frontend (@sentry/react) + source maps

---

### Спринт 10 — SECURITY HARDENING (2 недели)

---

#### [S10-01] SAST/DAST + Dependency Scanning в CI

- **Приоритет**: P1 (Блокер B21)
- **Модули**: CI/CD pipeline
- **Зависимости**: нет
- **Объём**: M (2 сессии)
- **Источник**: `1.X-architecture.md` §2 (нет SAST/DAST/dependency scanning), `FINAL-REPORT.md` B21, `GOLD-STANDARD.md` §4.2
- **Описание**:
  1. **SAST**: Semgrep для Java + TypeScript (rules: SQL injection, XSS, SSRF, hardcoded secrets)
  2. **DAST**: OWASP ZAP baseline scan against staging
  3. **Dependency scanning**: Trivy для Docker images + Dependabot для npm + Gradle
  4. Интеграция в CI pipeline — PR не мёржится если critical findings
- **Критерий готовности**:
  - CI pipeline включает SAST + dependency scan
  - 0 critical findings в текущем коде
  - Dependabot/Renovate создаёт PR при vulnerability
  - DAST scan schedule (weekly)

**Сессии Claude Code:**
1. *Сессия 1*: Semgrep rules + CI pipeline integration + Trivy
2. *Сессия 2*: Dependabot config + OWASP ZAP setup + fix existing findings

---

#### [S10-02] JWT Access Token → 15-30 min + Key Rotation

- **Приоритет**: P2 (Should Have)
- **Модули**: security (backend)
- **Зависимости**: S1-04 (JWT secret fix)
- **Объём**: M (2 сессии)
- **Источник**: `1.X-architecture.md` §2 (JWT access token 24h, нет key rotation), `FINAL-REPORT.md` B20
- **Описание**:
  JWT access token = 24h — украденный токен действует сутки. Реализовать:
  1. Access token TTL → 15 минут
  2. Refresh token → 7 дней (httpOnly cookie)
  3. Key rotation — автоматическая каждые 30 дней, поддержка 2 активных ключей
  4. Frontend: silent refresh через interceptor
- **Критерий готовности**:
  - Access token = 15 min
  - Refresh token в httpOnly cookie
  - Silent refresh работает (пользователь не замечает)
  - Key rotation раз в 30 дней

**Сессии Claude Code:**
1. *Сессия 1*: Backend — refresh token endpoint + key rotation + token TTL
2. *Сессия 2*: Frontend — silent refresh in axios interceptor + cookie handling

---

#### [S10-03] ApiRateLimitService → Redis Distributed

- **Приоритет**: P1 (Блокер B19)
- **Модули**: security (backend)
- **Зависимости**: S2-03 (Redis tenant namespace)
- **Объём**: S (1 сессия)
- **Источник**: `1.X-architecture.md` §2 (ApiRateLimitService ConcurrentHashMap), `FINAL-REPORT.md` B19
- **Описание**:
  ConcurrentHashMap rate limiter → multi-instance = bypass (3x rate limit). Заменить на Redis INCR + EXPIRE (sliding window).
- **Критерий готовности**:
  - Rate limit через Redis (distributed)
  - Работает корректно при 2+ instances
  - Backend компилируется

**Сессии Claude Code:**
1. *Сессия 1*: Redis-based rate limiter (INCR + EXPIRE) + fallback to in-memory

---

### Спринт 11 — ТЕСТИРОВАНИЕ (2 недели)

---

#### [S11-01] Unit Tests для Критичных Расчётов

- **Приоритет**: P2 (Should Have)
- **Модули**: payroll, estimates (ЛСР-парсер), finance (EVM, budget)
- **Зависимости**: S5-01 (estimates stubs implemented)
- **Объём**: L (5 сессий)
- **Источник**: `1.21-hr-hrRussian.md` §3 (PayrollService НДФЛ), `1.22-leave-payroll-selfemployed-recruitment.md` §3 (payroll tests), `1.2-estimates-pricing.md` (ЛСР-парсер), `1.13-planning.md` (EVM), `1.1-finance.md` (BudgetService/VatCalculator), `IMPROVEMENTS.md` Should-Have (тесты)
- **Описание**:
  Модули с расчётами, ошибка в которых = судебные иски или финансовые потери:
  1. **PayrollService**: НДФЛ 5 ступеней, ОПС порог, overtime/night, районный коэффициент — min 15 test cases
  2. **ЛСР-парсер (parseGrandSmeta)**: min 10 кейсов (разные форматы xlsx, edge cases)
  3. **EVM**: CPI/SPI/EAC/ETC calculations — 10 cases
  4. **BudgetService**: margin, rollup, forecast — 10 cases
  5. **VatCalculator**: НДС 22%, УСН exception, rounding — 5 cases
- **Критерий готовности**:
  - ≥ 50 новых unit tests
  - Покрытие критичных расчётов ≥ 90%
  - Все тесты проходят

**Сессии Claude Code:**
1. *Сессия 1*: PayrollService — НДФЛ 5 ступеней + ОПС порог (15 tests)
2. *Сессия 2*: ЛСР-парсер — 10 кейсов (normal, edge, empty, malformed)
3. *Сессия 3*: EVM — CPI/SPI/EAC/ETC (10 tests)
4. *Сессия 4*: BudgetService — margin, rollup, forecast (10 tests)
5. *Сессия 5*: VatCalculator + integration tests для финансовой цепочки

---

#### [S11-02] E2E Tests: Financial Chain

- **Приоритет**: P2 (Should Have)
- **Модули**: e2e (Playwright)
- **Зависимости**: S5-01, S6-01 (estimates + print forms)
- **Объём**: L (4 сессии)
- **Источник**: `.claude/plans/financial-chain-test-spec.md` (165 assertions), `1.1-finance.md` §4 (финансовая цепочка E2E)
- **Описание**:
  E2E тест полной финансовой цепочки:
  Проект → Бюджет → ЛСР (импорт) → КЛ → ФМ → КП → Договор → КС-2 → КС-3 → Оплата → PDF
  165 assertions (из `financial-chain-test-spec.md`), точные числа.
- **Критерий готовности**:
  - E2E тест проходит от создания проекта до генерации PDF
  - Все суммы проверены (НДС 22%, маржа, итоги)
  - Тест запускается в CI

**Сессии Claude Code:**
1. *Сессия 1*: E2E fixtures + project/budget/LSR setup
2. *Сессия 2*: КЛ → ФМ → КП flow
3. *Сессия 3*: Договор → КС-2 → КС-3 → Оплата
4. *Сессия 4*: PDF verification + full chain run + CI integration

---

## ЭТАП 4: ПРОДАЖИ — Спринты 12-13

> **Цель**: продукт можно продавать. Лендинг, демо, юридика.

---

### Спринт 12 — ЛЕНДИНГ + ДЕМО (2 недели)

---

#### [S12-01] Professional Landing Page

- **Приоритет**: P2 (Should Have)
- **Модули**: frontend (landing)
- **Зависимости**: S9-02 (Free Tier, pricing)
- **Объём**: L (4 сессии)
- **Источник**: `COMPETITORS.md` §7 (positioning), `GOLD-STANDARD.md` §9 (marketing site), `IMPROVEMENTS.md` Should-Have (landing)
- **Описание**:
  Текущий LandingPage — базовый. Нужен professional marketing site:
  - Hero section с value proposition: "Единственная строительная ERP, которая говорит на языке российской стройки"
  - Фичи по ролям: Директор, ПТО, Сметчик, Прораб, Снабженец
  - Тарифы с калькулятором (Free → Starter → Pro → Enterprise)
  - Кейсы / социальное доказательство
  - Сравнение с конкурентами (PRIVOD vs 1С, vs Procore, vs PUSK)
  - CTA: "Попробовать бесплатно" → регистрация → сразу в систему
  - SEO: meta tags, structured data, sitemap
- **Критерий готовности**:
  - Landing page с 6+ секциями
  - Responsive (desktop + mobile)
  - Lighthouse performance ≥ 80
  - CTA → Registration flow работает

**Сессии Claude Code:**
1. *Сессия 1*: Hero + Features by role sections
2. *Сессия 2*: Pricing calculator + Comparison table
3. *Сессия 3*: Social proof + CTA + SEO meta
4. *Сессия 4*: Responsive polish + performance optimization

---

#### [S12-02] Demo Environment + Onboarding Wizard

- **Приоритет**: P2 (Should Have)
- **Модули**: frontend, admin, backend (seed)
- **Зависимости**: S8-01 (navigation restructure)
- **Объём**: L (4 сессии)
- **Источник**: `GOLD-STANDARD.md` §8.1 (onboarding wizard), §9.2 (demo/trial), `COMPETITORS.md` §2.3 (Buildertrend sandbox), `1.UX-navigation.md` §5.5 (empty states → CTA)
- **Описание**:
  1. **Sandbox**: предзаполненный проект с реальными данными (сметы, КС-2, задачи, бюджет) — для "потыкать"
  2. **Onboarding wizard**: при первом входе: "Создай компанию → Настрой структуру → Создай первый проект → Пригласи коллег"
  3. **Interactive product tour**: tooltips на ключевых элементах (10-15 шагов)
  4. **Seed script**: автоматическое создание демо-данных для каждого нового тенанта
- **Критерий готовности**:
  - Новый пользователь видит wizard при первом входе
  - Sandbox проект содержит данные во всех core модулях
  - Product tour проводит через основной workflow
  - Seed script создаёт consistent demo data

**Сессии Claude Code:**
1. *Сессия 1*: Onboarding wizard (4 steps) + API
2. *Сессия 2*: Sandbox seed script (расширенный, с финансовой цепочкой)
3. *Сессия 3*: Product tour (react-joyride или custom) — 15 шагов
4. *Сессия 4*: Тестирование full onboarding flow

---

### Спринт 13 — ЮРИДИКА + ПОРТАЛ (2 недели)

---

#### [S13-01] 152-ФЗ Compliance Package

- **Приоритет**: P1 (Блокер B22)
- **Модули**: legal, admin, compliance
- **Зависимости**: S1-05 (PII masking)
- **Объём**: M (3 сессии)
- **Источник**: `1.X-architecture.md` §2 (152-ФЗ модель угроз отсутствует), `FINAL-REPORT.md` B22, `GOLD-STANDARD.md` §11.2
- **Описание**:
  Обязательные документы оператора ПДн:
  1. **Модель угроз ИСПДн** — документ (шаблон + заполнение)
  2. **Приказ о назначении ответственного** за обработку ПДн
  3. **Положение об обработке ПДн** — внутренний документ
  4. **Уведомление Роскомнадзора** — checklist + инструкция
  5. **Согласие на обработку ПДн** — обновлённая форма при регистрации
  6. **DPA (Data Processing Agreement)** — для enterprise клиентов
- **Критерий готовности**:
  - Все документы сгенерированы (шаблоны)
  - Checklist 152-ФЗ = 100% (не localStorage mock)
  - DPA доступен для скачивания
  - Согласие на ПДн обязательно при регистрации

**Сессии Claude Code:**
1. *Сессия 1*: Модель угроз + Приказ + Положение (шаблоны)
2. *Сессия 2*: RKN checklist → real backend + DPA page
3. *Сессия 3*: Registration consent update + документация

---

#### [S13-02] Портал Подрядчика — Security Fix + Separate URL

- **Приоритет**: P1
- **Модули**: portal (frontend + backend)
- **Зависимости**: S1-01 (SQL injection), S1-02 (identity spoofing), S3-01 (tenant isolation)
- **Объём**: L (4 сессии)
- **Источник**: `1.17-portal.md` — **полный аудит портала** (10 P1, 16 P2, 12 P3: SQL injection, identity spoofing, 5 unrouted pages, cross-tenant admin, IDOR 4 services, PortalSettings localStorage)
- **Описание**:
  Portal сейчас = 5.0/10 с SQL injection и identity spoofing. После security fixes из этапа 1:
  1. Отдельный layout на `/portal/*` (не в основном sidebar)
  2. Отдельная JWT auth (уже есть, доработать)
  3. 5 unrouted pages → добавить routes (DailyReports, Defects, Photos, RFI, Signatures)
  4. PortalAdmin → доступ только для ADMIN текущего tenant (не cross-tenant)
- **Критерий готовности**:
  - Portal на `/portal/*` с отдельным layout
  - 0 unrouted pages
  - PortalAdmin = tenant-scoped
  - 0 SQL injection / identity spoofing

**Сессии Claude Code:**
1. *Сессия 1*: Separate portal layout + routing
2. *Сессия 2*: 5 unrouted pages → add routes + basic UI
3. *Сессия 3*: PortalAdmin tenant-scoping
4. *Сессия 4*: Тестирование portal flow end-to-end

---

## ЭТАП 5: МАСШТАБ — Спринты 14-17

> **Цель**: интеграции, мобилка, AI — конкурентоспособность.

---

### Спринт 14 — 1С ИНТЕГРАЦИЯ (2 недели)

---

#### [S14-01] 1С Двусторонняя Синхронизация

- **Приоритет**: P1 (Must Have для российского рынка)
- **Модули**: integration1c (backend + frontend)
- **Зависимости**: S6-01 (print forms — данные для 1С)
- **Объём**: XL (12 сессий)
- **Источник**: `1.16-documents-dataexchange-integration1c.md` §3 (DataExchange НЕТ controllers, Integration1C export = stubs, OData/SOAP клиенты есть), `GOLD-STANDARD.md` §6.1 (1С двусторонняя), `IMPROVEMENTS.md` Must-Have #1
- **Описание**:
  OData и SOAP клиенты УЖЕ ЕСТЬ в коде, но export = stubs. Реализовать:
  1. **Справочники**: контрагенты, номенклатура, счета бухучёта — двусторонний sync
  2. **Документы**: счета, акты (КС-2), накладные, платёжки — export в 1С
  3. **Оплаты**: импорт банковских выписок из 1С
  4. **Настраиваемый маппинг полей** — у каждого клиента 1С настроена по-своему
  5. **Журнал синхронизации** — UI: что ушло, что пришло, где ошибки
  6. **DataExchange REST controllers** — сейчас 0 controllers (frontend → 404)
- **Критерий готовности**:
  - Контрагенты синхронизируются с 1С
  - КС-2/КС-3 экспортируются в 1С
  - Банковские выписки импортируются
  - Журнал синхронизации показывает историю
  - Маппинг полей настраивается per-tenant

**Сессии Claude Code:**
1. *Сессия 1*: DataExchange REST controllers (10 endpoints)
2. *Сессия 2*: Counterparty sync — PRIVOD → 1С (OData POST)
3. *Сессия 3*: Counterparty sync — 1С → PRIVOD (OData GET + merge)
4. *Сессия 4*: Nomenclature sync (materials, services)
5. *Сессия 5*: КС-2 export to 1С
6. *Сессия 6*: КС-3 + Invoice export
7. *Сессия 7*: Bank statement import from 1С
8. *Сессия 8*: Field mapping config (per-tenant settings)
9. *Сессия 9*: Sync log UI (journal)
10. *Сессия 10*: Frontend — 1С settings page, sync dashboard
11. *Сессия 11*: Error handling, retry, conflict resolution
12. *Сессия 12*: Integration tests + documentation

---

### Спринт 15 — ЭДО + ФГИС ЦС (2 недели)

---

#### [S15-01] Diadok ЭДО — Реальный REST API

- **Приоритет**: P1 (Must Have)
- **Модули**: documents (DiadokClient), frontend
- **Зависимости**: S6-01 (print forms — PDF для подписания)
- **Объём**: XL (8 сессий)
- **Источник**: `1.16-documents-dataexchange-integration1c.md` §3 (DiadokClient = 100% mock), `1.3-closing-russiandocs-execdocs.md` §3 (ЭДО не работает), `GOLD-STANDARD.md` §6.2, `IMPROVEMENTS.md` Must-Have #2
- **Описание**:
  DiadokClient = 100% mock. Реализовать реальную интеграцию с Контур.Диадок REST API:
  1. Авторизация по API key + certificate
  2. Отправка документов (УПД, акт, накладная)
  3. Получение входящих документов
  4. Подписание КЭП (через browser plugin или CryptoPro JCP)
  5. Статусы документов (ожидает подписи → подписан → отклонён)
  6. Роуминг — отправка контрагентам на других операторах ЭДО
- **Критерий готовности**:
  - Документы отправляются через Diadok API
  - Входящие документы отображаются
  - Статусы обновляются
  - КЭП подписание работает (хотя бы через API token)

**Сессии Claude Code:**
1. *Сессия 1*: DiadokClient — auth + API configuration
2. *Сессия 2*: Send documents (УПД, акт)
3. *Сессия 3*: Receive incoming documents
4. *Сессия 4*: Document status tracking + webhooks
5. *Сессия 5*: КЭП signing flow (API token mode)
6. *Сессия 6*: Frontend — ЭДО inbox, outbox, signing UI
7. *Сессия 7*: Roaming + error handling
8. *Сессия 8*: Integration tests + documentation

---

#### [S15-02] ФГИС ЦС — Индексы Минстроя

- **Приоритет**: P2 (Should Have)
- **Модули**: estimates (backend)
- **Зависимости**: S5-01 (estimates stubs)
- **Объём**: M (3 сессии)
- **Источник**: `IMPROVEMENTS.md` Must-Have #12 (ФГИС ЦС индексы), `GOLD-STANDARD.md` §6.3 (госсистемы)
- **Описание**:
  Индексы пересчёта в текущие цены из ФГИС ЦС (федеральная система ценообразования в строительстве). API или парсинг с сайта fgiscs.minstroyrf.ru.
- **Критерий готовности**:
  - Индексы загружаются из ФГИС ЦС
  - Автоматическое применение к сметам при пересчёте
  - Обновление по расписанию (ежемесячно)

**Сессии Claude Code:**
1. *Сессия 1*: ФГИС ЦС API/parser client
2. *Сессия 2*: Index storage + application to estimates
3. *Сессия 3*: Frontend UI + scheduled updates

---

### Спринт 16 — МОБИЛКА + OFFLINE (2 недели)

---

#### [S16-01] PWA Enhancement + Mobile UX

- **Приоритет**: P2 (Should Have)
- **Модули**: frontend (PWA, responsive)
- **Зависимости**: S8-01 (navigation restructure)
- **Объём**: L (5 сессий)
- **Источник**: `GOLD-STANDARD.md` §7 (мобильная версия — MUST HAVE), `1.UX-navigation.md` §5.5 (мобильная навигация 5 пунктов bottom tab), `COMPETITORS.md` §5 #5 (native mobile — PUSK/Procore/Fieldwire)
- **Описание**:
  PWA уже есть, но базовый. Для полноценного мобильного опыта:
  1. **Мобильная навигация**: bottom tab bar (5 пунктов: Главная, Проекты, Задачи, Камера, Ещё)
  2. **Offline mode**: DailyReport, Defect, Photo — полноценная работа без сети + sync queue
  3. **Conflict resolution**: если двое редактировали оффлайн → merge/pick
  4. **Camera integration**: фото → задача/дефект прямо с мобильного
  5. **Push notifications**: напоминания, согласования, deadlines
  6. **Touch-friendly UI**: крупные кнопки, свайпы для actions
- **Критерий готовности**:
  - Bottom tab bar на мобильных
  - DailyReport работает offline + syncs
  - Camera → фото → attach to entity
  - Push notifications работают

**Сессии Claude Code:**
1. *Сессия 1*: Mobile bottom tab navigation
2. *Сессия 2*: Offline mode for DailyReport + Defect (IndexedDB + sync)
3. *Сессия 3*: Conflict resolution strategy
4. *Сессия 4*: Camera integration + touch-friendly UI improvements
5. *Сессия 5*: Push notifications + тестирование на mobile devices

---

### Спринт 17 — AI + PERFORMANCE (2 недели)

---

#### [S17-01] AI Features: OCR + Photo Analysis

- **Приоритет**: P2 (Should Have — конкурентное преимущество)
- **Модули**: ai (backend + frontend)
- **Зависимости**: нет
- **Объём**: L (5 сессий)
- **Источник**: `COMPETITORS.md` §5 #2-3 (Photo AI, OCR — Procore/PUSK.APP), `1.26-legal-mail-messenger-ai-help.md` §3 B17-B18 (Photo/Risk = 100% mock), `IMPROVEMENTS.md` Must-Have #25-26
- **Описание**:
  AI модуль = 40% mock. Реализовать реальные фичи:
  1. **OCR распознавание счетов/УПД**: загрузить скан → AI извлекает данные → предзаполнить форму (как PUSK.APP)
  2. **Photo AI**: анализ фото стройки → определение % готовности (сравнение с планом)
  3. **AI-ассистент для российского строительного права**: вопрос → ответ по ГОСТ/СП/СНиП/ФЗ
  4. **Автоклассификация документов**: загрузил файл → система определила тип
- **Критерий готовности**:
  - OCR: загрузить фото счёта → данные извлечены с 80%+ accuracy
  - Photo AI: загрузить фото → % готовности (даже approximate)
  - AI-ассистент отвечает на вопросы по строительному праву
  - Автоклассификация работает для 10+ типов документов

**Сессии Claude Code:**
1. *Сессия 1*: OCR pipeline — upload → preprocess → API call → structured data
2. *Сессия 2*: OCR frontend — drag-drop → preview → confirm → create entity
3. *Сессия 3*: Photo AI — comparison mode (plan vs photo)
4. *Сессия 4*: AI-ассистент — строительное право prompt engineering + context
5. *Сессия 5*: Document autoclassification + тестирование

---

#### [S17-02] Performance + Load Testing

- **Приоритет**: P2 (Should Have)
- **Модули**: infrastructure, backend
- **Зависимости**: S4-06 (N+1 fixes)
- **Объём**: M (3 сессии)
- **Источник**: `1.X-architecture.md` §2 (нет нагрузочных тестов, N+1 queries), `1.1-finance.md` §3 (BudgetService god-class 896 LOC), `1.12-dashboard-analytics.md` (AnalyticsDataService 1136 LOC), `IMPROVEMENTS.md` Should-Have (декомпозиция, load tests, pagination)
- **Описание**:
  Production capacity неизвестна. Реализовать:
  1. **k6 нагрузочные тесты**: основные API endpoints, 100/500/1000 concurrent users
  2. **DB optimization**: composite indexes (daily_reports, tasks), EXPLAIN ANALYZE hot queries
  3. **Server-side pagination**: убрать `size: 200/500` → proper Pageable (10-50 per page)
  4. **God-class decomposition** (top 3): BudgetService (896), ClosingDocumentService (660), AnalyticsDataService (1136)
- **Критерий готовности**:
  - k6 тесты проходят: p95 < 500ms при 100 concurrent users
  - Composite indexes на hot tables
  - 0 endpoints с `size: 500`
  - Top 3 god-classes разбиты на 2-3 focused services

**Сессии Claude Code:**
1. *Сессия 1*: k6 load test scripts + composite DB indexes
2. *Сессия 2*: Server-side pagination audit + fix
3. *Сессия 3*: God-class decomposition (BudgetService → 3, AnalyticsDataService → 3)

---

## 7. СВОДНАЯ ТАБЛИЦА ВСЕХ ЗАДАЧ

| # | ID | Задача | Этап | Спринт | P | Сессий | Статус |
|---|-----|--------|------|--------|---|--------|--------|
| | | **ЭТАП 1: СТАБИЛЬНОСТЬ** | | | | | |
| 1 | S1-01 | Fix SQL Injection Portal | 1 | 1 | P1 | 1 | ⏳ |
| 2 | S1-02 | Fix Identity Spoofing Portal | 1 | 1 | P1 | 1 | ⏳ |
| 3 | S1-03 | Убрать Hardcoded Credentials | 1 | 1 | P1 | 1 | ⏳ |
| 4 | S1-04 | Fix ddl-auto + JWT + CORS + WebSocket | 1 | 1 | P1 | 2 | ⏳ |
| 5 | S1-05 | Fix Webhook HMAC + PII Masking | 1 | 1 | P1 | 2 | ⏳ |
| 6 | S1-06 | Portal: Blocked User Login + SLA Bug | 1 | 1 | P1 | 1 | ⏳ |
| 7 | S2-01 | PostgreSQL RLS | 1 | 2 | P1 | 4 | ⏳ |
| 8 | S2-02 | MinIO Tenant Prefix | 1 | 2 | P1 | 1 | ⏳ |
| 9 | S2-03 | Redis Tenant Namespace | 1 | 2 | P1 | 1 | ⏳ |
| 10 | S2-04 | Tenant Isolation Wave 1 (Finance+HR) | 1 | 2 | P1 | 8 | ⏳ |
| 11 | S3-01 | Tenant Isolation Wave 2 (All remaining) | 1 | 3 | P1 | 10 | ⏳ |
| 12 | S3-02 | @PreAuthorize 200+ Endpoints | 1 | 3 | P2 | 5 | ⏳ |
| 13 | S4-01 | Fix IDOR 15+ Сервисов | 1 | 4 | P1 | 4 | ⏳ |
| 14 | S4-02 | Fix НДС 22% | 1 | 4 | P1 | 1 | ⏳ |
| 15 | S4-03 | Global UNIQUE → Tenant-scoped | 1 | 4 | P1 | 1 | ⏳ |
| 16 | S4-04 | AtomicLong → DB Sequence | 1 | 4 | P1 | 1 | ⏳ |
| 17 | S4-05 | Удалить Production Stubs | 1 | 4 | P1 | 3 | ⏳ |
| 18 | S4-06 | Fix N+1 + In-Memory Pagination | 1 | 4 | P1 | 2 | ⏳ |
| 19 | S4-07 | Fix P1 Broken Pages: Projects, Processes, Design | 1 | 4 | P1 | 5 | ⏳ |
| 20 | S4-08 | Fix P1: Leave IDOR, ContractSign, Finance Calc | 1 | 4 | P1 | 3 | ⏳ |
| 21 | S4-09 | Fix P1: BIM Endpoints, WorkOrder, M29, GPS | 1 | 4 | P1 | 2 | ⏳ |
| | | **ЭТАП 2: ЯДРО** | | | | | |
| 22 | S5-01 | 5 Стабов EstimateAdvancedService | 2 | 5 | P1 | 8 | ⏳ |
| 23 | S5-02 | CashFlowEntry Idempotency | 2 | 5 | P1 | 1 | ⏳ |
| 24 | S5-03 | Dual Entity Cleanup | 2 | 5 | P1 | 3 | ⏳ |
| 25 | S5-04 | Авансы, Удержания, CO→Budget Auto-recalc | 2 | 5 | P1 | 5 | ⏳ |
| 26 | S6-01 | КС-2 / КС-3 PDF по ГОСТ | 2 | 6 | P1 | 6 | ⏳ |
| 27 | S6-02 | М-29 + Счёт/СФ/УПД PDF | 2 | 6 | P1 | 5 | ⏳ |
| 28 | S6-03 | Т-12/Т-13 + АОСР PDF | 2 | 6 | P2 | 4 | ⏳ |
| 29 | S6-04 | HR Печатные Формы: Т-1..Т-8 | 2 | 6 | P2 | 6 | ⏳ |
| 30 | S7-01 | ExecDocs Backend (5 entities) | 2 | 7 | P1 | 5 | ⏳ |
| 31 | S7-02 | Объединение 2 Систем Согласования | 2 | 7 | P2 | 5 | ⏳ |
| 32 | S7-03 | Fix Frontend↔Backend Mismatches | 2 | 7 | P2 | 4 | ⏳ |
| 33 | S7-04 | Наряд-допуски на Опасные Работы | 2 | 7 | P2 | 3 | ⏳ |
| 34 | S7-05 | Visual Workflow Editor (drag-and-drop) | 2 | 7 | P2 | 4 | ⏳ |
| 35 | S8-01 | Навигация 24 → 10 Групп | 2 | 8 | P1 | 5 | ⏳ |
| 36 | S8-02 | Ролевая Фильтрация Навигации | 2 | 8 | P1 | 3 | ⏳ |
| 37 | S8-03 | Mock Board Pages → API | 2 | 8 | P2 | 6 | ⏳ |
| 38 | S8-04 | Cmd+K + Favorites + "Мой день" | 2 | 8 | P2 | 4 | ⏳ |
| 39 | S8-05 | God-Components + Error Boundaries + Loading | 2 | 8 | P2 | 5 | ⏳ |
| | | **ЭТАП 3: SaaS-READY** | | | | | |
| 40 | S9-01 | Real Health Checks + Backups | 3 | 9 | P1 | 3 | ⏳ |
| 41 | S9-02 | Billing: Dunning + Prorated + Free Tier | 3 | 9 | P2 | 4 | ⏳ |
| 42 | S9-03 | Structured Logging + Sentry | 3 | 9 | P2 | 2 | ⏳ |
| 43 | S9-04 | Status Page + External Monitoring + Vault | 3 | 9 | P2 | 2 | ⏳ |
| 44 | S9-05 | Log Aggregation (Loki/ELK) | 3 | 9 | P2 | 2 | ⏳ |
| 45 | S10-01 | SAST/DAST + Dependency Scanning | 3 | 10 | P1 | 2 | ⏳ |
| 46 | S10-02 | JWT 15min + Key Rotation | 3 | 10 | P2 | 2 | ⏳ |
| 47 | S10-03 | Rate Limiter → Redis | 3 | 10 | P1 | 1 | ⏳ |
| 48 | S10-04 | SSO (SAML 2.0 / OIDC) | 3 | 10 | P1 | 5 | ⏳ |
| 49 | S11-01 | Unit Tests (50+ critical calculations) | 3 | 11 | P2 | 5 | ⏳ |
| 50 | S11-02 | E2E Financial Chain Test | 3 | 11 | P2 | 4 | ⏳ |
| 51 | S11-03 | HR Legal: МРОТ, Вычеты, Коэффициенты, НС+ПЗ | 3 | 11 | P2 | 5 | ⏳ |
| | | **ЭТАП 4: ПРОДАЖИ** | | | | | |
| 52 | S12-01 | Professional Landing Page | 4 | 12 | P2 | 4 | ⏳ |
| 53 | S12-02 | Demo Environment + Onboarding | 4 | 12 | P2 | 4 | ⏳ |
| 54 | S13-01 | 152-ФЗ Compliance Package | 4 | 13 | P1 | 3 | ⏳ |
| 55 | S13-02 | Портал Подрядчика Fix + Separate URL | 4 | 13 | P1 | 4 | ⏳ |
| 56 | S13-03 | Gantt Interactive + S-Curve + MS Project Import | 4 | 13 | P2 | 6 | ⏳ |
| | | **ЭТАП 5: МАСШТАБ** | | | | | |
| 57 | S14-01 | 1С Двусторонняя Синхронизация | 5 | 14 | P1 | 12 | ⏳ |
| 58 | S15-01 | Diadok ЭДО — Real API | 5 | 15 | P1 | 8 | ⏳ |
| 59 | S15-02 | ФГИС ЦС Индексы | 5 | 15 | P2 | 3 | ⏳ |
| 60 | S16-01 | PWA + Mobile UX + Offline | 5 | 16 | P2 | 5 | ⏳ |
| 61 | S17-01 | AI: OCR + Photo + Assistant | 5 | 17 | P2 | 5 | ⏳ |
| 62 | S17-02 | Performance + Load Testing | 5 | 17 | P2 | 3 | ⏳ |
| | | **ЭТАП 6: СТАБИЛИЗАЦИЯ** | | | | | |
| 63 | S18-01 | Processes Module P2 Fixes (25 bugs) | 6 | 18 | P2 | 4 | ⏳ |
| 64 | S18-02 | Portal Module P2 Fixes (15 bugs) | 6 | 18 | P2 | 3 | ⏳ |
| 65 | S18-03 | HR/Payroll/Leave/Recruitment P2 Fixes (20 bugs) | 6 | 18 | P2 | 4 | ⏳ |
| 66 | S18-04 | BIM + Design + Documents P2 Fixes (30 bugs) | 6 | 18 | P2 | 5 | ⏳ |
| 67 | S18-05 | Sales/CRM + Closeout/Maintenance + Admin P2 (30) | 6 | 18 | P2 | 5 | ⏳ |
| 68 | S18-06 | Legal/Mail/Messenger/AI/Help + Infra (25 bugs) | 6 | 18 | P2 | 4 | ⏳ |
| | | **ЭТАП 7: КОНКУРЕНТНОСТЬ** | | | | | |
| 69 | S19-01 | AI Agent Builder (no-code) | 7 | 19 | P3 | 10 | ⏳ |
| 70 | S19-02 | AI Predictive Analytics + Contractor Scoring | 7 | 19 | P2 | 6 | ⏳ |
| 71 | S19-03 | 360° Фото + Plan-Centric Defects + Audit Trail | 7 | 19 | P3 | 6 | ⏳ |
| 72 | S19-04 | National AI Standard + Minstroy Integration | 7 | 19 | P2 | 2 | ⏳ |

> **Обозначения статуса**: ⏳ Не начата | 🔄 В работе | ✅ Выполнена | ⛔ Заблокирована
>
> **Как обновлять**: после выполнения задачи Claude Code меняет ⏳ → ✅ в этой таблице,
> обновляет счётчик в 00-INDEX.md, и создаёт лог в `phase3-execution/[ID]-log.md`.

### Итого

| Метрика | Значение |
|---------|----------|
| **Задач** | **71** |
| **Сессий Claude Code** | **~287** |
| **P1 задач** | 33 (46%) |
| **P2 задач** | 34 (48%) |
| **P3 задач** | 4 (6%) |
| **Этап 1 (Стабильность)** | 21 задача, ~59 сессий |
| **Этап 2 (Ядро)** | 18 задач, ~84 сессии |
| **Этап 3 (SaaS-ready)** | 13 задач, ~39 сессий |
| **Этап 4 (Продажи)** | 5 задач, ~21 сессия |
| **Этап 5 (Масштаб)** | 5 задач, ~36 сессий |
| **Этап 6 (Стабилизация)** | 6 задач, ~25 сессий |
| **Этап 7 (Конкурентность)** | 4 задачи, ~24 сессии |
| **Product Backlog** | ~500+ пунктов (Приложение B) |

---

## 8. МЕТРИКИ УСПЕХА

### По этапам

| Этап | Метрика | Текущее | Целевое |
|------|---------|---------|---------|
| **1. Стабильность** | Entities с tenant isolation | 47% | 100% |
| | Endpoints с @PreAuthorize | ~30% | 100% |
| | SQL Injection points | 7 | 0 |
| | Hardcoded credentials | 5+ | 0 |
| | P1 bugs | 129 | < 10 |
| **2. Ядро** | Print forms (PDF) | 0 | 8+ |
| | Production stubs | 15+ | 0 |
| | Mock board pages | 12+ | 0 |
| | Navigation groups | 24 | ≤ 10 |
| | Frontend↔Backend mismatches | 30+ | 0 |
| **3. SaaS-ready** | Health checks (real) | 1/6 | 6/6 |
| | Unit test coverage (critical) | < 20% | > 80% |
| | E2E tests | 0 | 10+ scenarios |
| | SAST/DAST in CI | No | Yes |
| | Backup restore tested | No | Monthly |
| **4. Продажи** | Landing page sections | 3 | 8+ |
| | Onboarding wizard | No | Yes |
| | 152-ФЗ compliance | ~70% | 100% |
| | Free Tier | No | Yes |
| **5. Масштаб** | 1С integration | Mock | Real sync |
| | ЭДО | Mock | Diadok API |
| | Mobile UX | Basic PWA | Full mobile |
| | AI features (real) | 40% | 80%+ |

### Общая оценка

| Контрольная точка | Оценка | Production-ready |
|-------------------|--------|------------------|
| Сейчас | 6.2/10 | 38% |
| После этапа 1 | 7.5/10 | 65% |
| После этапа 2 | 8.2/10 | 80% |
| После этапа 3 | 8.8/10 | 90% |
| После этапа 4 | 9.0/10 | 95% |
| После этапа 5 | 9.5/10 | 98% |

---

## ПРИЛОЖЕНИЕ: ЗАВИСИМОСТИ ЗАДАЧ (ГРАФ)

```
S1-01 ─────────────────────────────────────────────── S13-02
S1-02 ─────────────────────────────────────────────── S13-02
S1-03 ───────────────────────────────────── (independent)
S1-04 ──────────────────────────── S10-02
S1-05 ──────── S9-03, S13-01

S2-01 ─────────────────────────────────── (independent, parallel to S2-04)
S2-02 ─────────────────────────────────── (independent)
S2-03 ──────────────────────────── S10-03
S2-04 ──── S3-01, S4-01

S3-01 ──── S4-01, S7-01, S8-03, S13-02
S3-02 ─────────────────────────────────── (independent)

S4-01 ─────────────────────────────────── (end of security chain)
S4-02 ──── S5-01, S6-01
S4-03 ─── requires S2-04/S3-01 (org_id must exist)
S4-06 ──────────────────────────── S17-02

S5-01 ──── S11-01, S11-02, S15-02
S5-03 ─── requires S3-01

S6-01 ──── S6-02, S6-03, S11-02, S14-01, S15-01
S7-02 ─── requires S3-01

S8-01 ──── S8-02, S12-02, S16-01
S9-02 ──── S12-01

S14-01 ─────────────────────────────────── (independent of other Этап 5)
S15-01 ─────────────────────────────────── (independent)
S16-01 ─────────────────────────────────── (independent)
S17-01 ─────────────────────────────────── (independent)
```

---

## ADDENDUM: ПОЛНОЕ ПОКРЫТИЕ ВСЕХ АУДИТОВ (добавлено 2026-03-19)

> После кросс-проверки ROADMAP vs ВСЕ файлы аудита обнаружено **~250 пропущенных пунктов**.
> Ниже — дополнительные задачи, организованные по спринтам. Каждая задача привязана к конкретному
> источнику (файлу аудита, BUGS.md, IMPROVEMENTS.md, COMPETITORS.md).

---

### ДОПОЛНЕНИЯ К СПРИНТУ 1 (Emergency Security)

#### [S1-06] Portal: Blocked User Login + SLA Bug

- **Приоритет**: P1
- **Модули**: portal (backend)
- **Зависимости**: нет
- **Объём**: S (1 сессия)
- **Описание**:
  1. PortalAuthService: проверка `isBlocked` после password match → заблокированный пользователь получает JWT (timing attack). Переставить check ПЕРЕД password verification.
  2. ClientClaimService: SLA recalculated from `now()` instead of `createdAt` при смене приоритета → SLA "сжимается".
- **Источник**: 1.17-portal.md BUG-9, BUG-10
- **Критерий готовности**: Заблокированный юзер НЕ получает JWT; SLA считается от createdAt

**Сессии**: 1 сессия

---

### ДОПОЛНЕНИЯ К СПРИНТУ 4 (IDOR + Data Integrity + Stubs)

#### [S4-07] Fix P1 Broken Pages: Projects, Processes, Design

- **Приоритет**: P1
- **Модули**: projects, processes, design (frontend + backend)
- **Зависимости**: нет
- **Объём**: L (5 сессий)
- **Описание**:
  P1 баги из индивидуальных аудитов, потерянные при суммаризации:
  1. **DB CHECK constraint blocks 6 ProjectTypes** → Flyway: ALTER CHECK to include all 11 types (1.11, BUG P1#3)
  2. **SiteAssessment no update endpoint** → Add @PutMapping + sync entity with V1055 migration (12 missing columns) (1.11, BUG P1#4-5)
  3. **ChangeOrderDetailPage calls CREATE instead of UPDATE** → Fix `as any` → correct changeStatus API call (1.15, PROC-B06)
  4. **ChangeEventDetailPage same bug** → Fix (1.15, PROC-B07)
  5. **RfiFormPage navigation → all 404** → `/rfi` → `/pm/rfis` (1.15, PROC-B09)
  6. **IDOR path variable ignoring** in RFI/Issues/Submittals → validate path param matches body (1.15, PROC-B04)
  7. **DesignSectionListPage → 400** (missing required projectId) (1.20, BUG-D5)
  8. **Design field mismatches (15+ fields undefined)** → align frontend types with backend DTO (1.20, BUG-D2)
  9. **Design PATCH /status not exists** → use POST submit-for-review/approve (1.20, BUG-D3)
  10. **ProjectSetupWizard = STUB** → wire handleFinish to real project creation API (1.11, P2#12)
  11. **PortfolioHealthPage 4/7 RAG = hashCode%5** → compute from real project data (1.11, P2#16)
- **Источник**: 1.11, 1.15, 1.20 audit files + BUGS.md
- **Критерий готовности**: Все перечисленные pages функциональны; 0 "as any" casts hiding type errors

**Сессии Claude Code:**
1. *Сессия 1*: ProjectType CHECK + SiteAssessment update endpoint + entity sync
2. *Сессия 2*: ChangeOrder/ChangeEvent status → correct API + RfiFormPage routes
3. *Сессия 3*: IDOR path variable validation + Design field alignment
4. *Сессия 4*: Design status API + DesignSectionListPage projectId
5. *Сессия 5*: ProjectSetupWizard → real API + PortfolioHealthPage → real metrics

---

#### [S4-08] Fix P1 Broken: Leave IDOR, ContractSign, Finance Calc

- **Приоритет**: P1
- **Модули**: leave, contracts, finance (backend + frontend)
- **Зависимости**: S2-04 (tenant isolation)
- **Объём**: M (3 сессии)
- **Описание**:
  1. **Leave approverId from query param** → extract from JWT; validate current user = designated approver (1.22, BUG-HR-06)
  2. **Leave createRequest no employee ownership** → validate employeeId belongs to current user's org + accessible employees (1.22, BUG-HR-07)
  3. **ContractSignWizard data NOT saved** → persist signing metadata (signatory, role, date, doc number, file) to backend (1.4, BUG-C4)
  4. **ContractFormPage silently drops insurance/procurement** → remove `delete payload.*` for valid fields (1.4, BUG-C8)
  5. **BudgetItemSyncService max() → sum()** for payment aggregation (1.1, BUG-F12)
  6. **CashFlowService.generateForecast() ignores paymentDelayDays and includeVat** → use parameters (1.1, BUG-F22)
  7. **SafetyComplianceService.hasUpcomingTraining() GLOBAL** → filter by employee + org (1.7, P1)
  8. **computeChecklistMetrics() FRONTEND FAKE** → compute from real API data (1.25, P1)
- **Источник**: 1.22, 1.4, 1.1, 1.7, 1.25 audit files
- **Критерий готовности**: Self-approval impossible; ContractSign saves data; BudgetItem uses sum(); CashFlow uses parameters

**Сессии Claude Code:**
1. *Сессия 1*: Leave approverId + ownership check
2. *Сессия 2*: ContractSignWizard persist + ContractFormPage stop dropping fields
3. *Сессия 3*: BudgetItemSync sum() + CashFlow parameters + SafetyCompliance filter + computeChecklistMetrics real

---

#### [S4-09] Fix Misc P1: BIM Endpoints, WorkOrder Progress, M29 Zeros, Fuel Price

- **Приоритет**: P1-P2
- **Модули**: bim, operations, fleet
- **Зависимости**: нет
- **Объём**: M (2 сессии)
- **Описание**:
  1. **BIM 3 pages → 404** (ConstructionProgress, PropertySets, BcfTopics) → create stub endpoints or disable pages (1.18, P1)
  2. **WorkOrder progress 10h=100%** → add plannedLaborHours field, real % calculation (1.6, BUG-O14)
  3. **M29 totalOveruse/totalSavings = hardcoded 0** → compute from real data (1.6, BUG-O12)
  4. **Fuel price hardcoded 60 руб/л** → configurable via application.yml (1.10)
  5. **CompetitiveListService.autoSelectBestPrices() bypasses min proposals** → add validation (1.5, BUG-S8)
  6. **GPS frontend paths → all 404** → align /fleet/gps/* with backend /api/iot/equipment/* (1.10, P1)
- **Источник**: 1.18, 1.6, 1.10, 1.5 audit files
- **Критерий готовности**: BIM pages load; WorkOrder progress realistic; M29 shows real overuse; GPS endpoints work

**Сессии Claude Code:**
1. *Сессия 1*: BIM endpoints + GPS path alignment + fuel configurable
2. *Сессия 2*: WorkOrder progress + M29 totals + autoSelectBestPrices validation

---

### ДОПОЛНЕНИЯ К СПРИНТУ 5 (Финансовое ядро)

#### [S5-04] Авансы, Удержания, CO→Budget Auto-recalc

- **Приоритет**: P1 (Must Have для строительства)
- **Модули**: finance, contracts (backend + frontend)
- **Зависимости**: S4-02 (НДС 22%)
- **Объём**: L (5 сессий)
- **Описание**:
  Базовые финансовые операции, без которых строительная ERP не продаётся:
  1. **Авансы и их зачёт** — создание аванса, привязка к контракту, зачёт при КС-2 оплате
  2. **Гарантийные удержания** — % от каждого КС-2, накопление, release по сроку
  3. **Штрафные удержания** — за просрочку/качество, привязка к претензиям
  4. **Change Order → auto budget recalc** — при approve CO автоматически обновить бюджет проекта
  5. **Multi-level budget approval** — creator ≠ approver (разделение обязанностей)
- **Источник**: IMPROVEMENTS.md Must-Have #11-13, FINAL-REPORT Should-Have
- **Критерий готовности**: Аванс создаётся и зачитывается; Удержания видны в бюджете; CO → budget auto

**Сессии Claude Code:**
1. *Сессия 1*: Advance entity + Flyway + service + привязка к контракту
2. *Сессия 2*: Advance offset при оплате КС-2
3. *Сессия 3*: Warranty/penalty retention entities + auto-calculation
4. *Сессия 4*: CO → budget auto-recalculation
5. *Сессия 5*: Multi-level budget approval + frontend

---

### ДОПОЛНЕНИЯ К СПРИНТУ 6 (Печатные формы)

#### [S6-04] HR Печатные Формы: Т-1, Т-2, Т-3, Т-5, Т-6, Т-8

- **Приоритет**: P2 (Should Have — юридическая обязанность)
- **Модули**: hr, hrRussian
- **Зависимости**: S6-01 (OpenPDF infrastructure)
- **Объём**: L (6 сессий)
- **Описание**:
  Обязательные кадровые формы:
  1. **Т-1** — приказ о приёме на работу
  2. **Т-2** — личная карточка работника
  3. **Т-3** — штатное расписание
  4. **Т-5** — приказ о переводе
  5. **Т-6** — приказ об отпуске
  6. **Т-8** — приказ об увольнении
- **Источник**: IMPROVEMENTS.md Must-Have #17, 1.21-hr-hrRussian.md BUG-144, GOLD-STANDARD §1.13
- **Критерий готовности**: Все 6 форм генерируются в PDF из данных системы

**Сессии Claude Code:**
1-6: По одной сессии на каждую форму (template + data mapping + endpoint + frontend button)

---

### ДОПОЛНЕНИЯ К СПРИНТУ 7 (Документы + Workflow)

#### [S7-04] Наряд-допуски на Опасные Работы (Work Permits)

- **Приоритет**: P2 (Should Have — юридическая обязанность по ТК РФ)
- **Модули**: safety (backend + frontend)
- **Зависимости**: S3-01 (tenant isolation)
- **Объём**: M (3 сессии)
- **Описание**:
  Юридическое требование для стройки: наряд-допуски на высоту, огневые, ограниченные пространства.
  Entity WorkPermit (type, area, conditions, PPE, approvers, validity period) + CRUD + approval workflow + PDF.
- **Источник**: 1.7-safety.md F1, GOLD-STANDARD §1.11, IMPROVEMENTS.md Should-Have #124
- **Критерий готовности**: WorkPermit CRUD + approval + PDF генерация

**Сессии**: 3 (entity+migration, service+controller+frontend, PDF+approval)

---

#### [S7-05] Visual Workflow Editor (drag-and-drop)

- **Приоритет**: P2 (Must Have в IMPROVEMENTS)
- **Модули**: workflow (frontend)
- **Зависимости**: S7-02 (unified workflow engine)
- **Объём**: L (4 сессии)
- **Описание**:
  Визуальный конструктор маршрутов согласования без кода (react-flow или аналог):
  - Drag-and-drop шаги, соединения
  - Условная маршрутизация (сумма > X → доп.шаг)
  - Параллельные и последовательные пути
  - Делегирование и эскалация
- **Источник**: IMPROVEMENTS.md Must-Have #5, GOLD-STANDARD §1.8
- **Критерий готовности**: Workflow создаётся визуально; условия работают; сохраняется в backend

**Сессии**: 4 (react-flow setup, step/connection builder, conditions UI, backend integration)

---

### ДОПОЛНЕНИЯ К СПРИНТУ 8 (UX Navigation)

#### [S8-04] Cmd+K Global Search + Favorites + "Мой день"

- **Приоритет**: P2 (Should Have — конкурентный стандарт)
- **Модули**: frontend (global)
- **Зависимости**: S8-01 (navigation restructure)
- **Объём**: L (4 сессии)
- **Описание**:
  3 стратегические UX-фичи из аудита навигации:
  1. **Cmd+K / Ctrl+K** — command palette поиск по всем разделам, проектам, документам, сотрудникам
  2. **Избранное** — per-user pinned items (до 10 в sidebar top), drag-and-drop порядок
  3. **"Мой день"** — персональный дашборд: мои задачи на сегодня, pending согласования, overdue items, последние изменения в моих проектах
- **Источник**: 1.UX-navigation.md §5.4 #14, #17; §5.5 "Мой день"
- **Критерий готовности**: Cmd+K открывает поиск; Favorites сохраняются per-user; "Мой день" показывает live данные

**Сессии Claude Code:**
1. *Сессия 1*: Cmd+K command palette (cmdk library или custom)
2. *Сессия 2*: Favorites — backend (UserPreference entity) + frontend sidebar section
3. *Сессия 3*: "Мой день" dashboard — API агрегация (tasks, approvals, overdue)
4. *Сессия 4*: Frontend "Мой день" page + polish + тестирование

---

#### [S8-05] God-Component Decomposition + Error Boundaries + Loading States

- **Приоритет**: P2-P3
- **Модули**: frontend (cross-cutting)
- **Зависимости**: нет
- **Объём**: L (5 сессий)
- **Описание**:
  1. **God-components**: FmPage (880), Ks2DetailPage (1175), SpecificationDetailPage (1241), CalendarPage (797), ApprovalInboxPage (868) → разбить каждый на 3-5 sub-components
  2. **Error Boundary** для lazy chunk failures (белый экран при плохой сети)
  3. **Loading states** (skeleton loaders) для всех list/detail pages
  4. **Empty states** — "Создай первый проект" с CTA вместо пустых таблиц
  5. **3 оставшихся HTML5 DnD → @dnd-kit**: CommissioningBoard, RfiBoardPage, + any remaining
- **Источник**: FINAL-REPORT P3, IMPROVEMENTS.md Should-Have, 1.15, 1.25, GOLD-STANDARD §8.1
- **Критерий готовности**: God-components ≤ 300 LOC each; Error Boundary catches chunk failures; Skeletons on all pages

**Сессии Claude Code:**
1. *Сессия 1*: FmPage + Ks2DetailPage decomposition
2. *Сессия 2*: SpecificationDetailPage + CalendarPage decomposition
3. *Сессия 3*: ApprovalInboxPage decomposition + Error Boundary wrapper
4. *Сессия 4*: Skeleton loaders + empty states (reusable components)
5. *Сессия 5*: 3 HTML5 DnD → @dnd-kit + тестирование

---

### ДОПОЛНЕНИЯ К СПРИНТУ 9 (Мониторинг + Billing)

#### [S9-04] Status Page + External Monitoring + Secrets Management

- **Приоритет**: P2
- **Модули**: infrastructure, monitoring
- **Зависимости**: S9-01 (real health checks)
- **Объём**: M (2 сессии)
- **Описание**:
  1. **Status page** (status.privod.ru) — публичная страница состояния сервисов
  2. **External uptime monitoring** — UptimeRobot или Better Uptime → alert если сервис недоступен извне
  3. **Secrets management** — HashiCorp Vault или AWS Secrets Manager. S1-03 убирает credentials из git, но нет ротации и central management.
- **Источник**: IMPROVEMENTS.md Should-Have, 1.X-architecture.md, GOLD-STANDARD §5.2
- **Критерий готовности**: Status page доступна; External monitor настроен; Secrets хранятся в Vault

**Сессии**: 2 (status page + external monitoring, Vault setup + integration)

---

#### [S9-05] Log Aggregation (Loki/ELK)

- **Приоритет**: P2
- **Модули**: infrastructure
- **Зависимости**: S9-03 (structured JSON logging)
- **Объём**: M (2 сессии)
- **Описание**:
  S9-03 добавляет JSON формат логов, но нет централизованного хранилища. Добавить Loki + Grafana или ELK stack для поиска, анализа и retention логов. Docker-compose конфигурация.
- **Источник**: IMPROVEMENTS.md Should-Have, 1.X-architecture.md, GOLD-STANDARD §5.2
- **Критерий готовности**: Логи доступны через Grafana/Kibana; Retention 30 дней; Поиск по traceId/userId

**Сессии**: 2 (Loki/Promtail setup, Grafana dashboards + log queries)

---

### ДОПОЛНЕНИЯ К СПРИНТУ 10 (Security Hardening)

#### [S10-04] SSO (SAML 2.0 / OIDC)

- **Приоритет**: P1 (Must Have для enterprise)
- **Модули**: security (backend), admin (frontend)
- **Зависимости**: S1-04 (JWT improvements)
- **Объём**: L (5 сессий)
- **Описание**:
  Enterprise клиенты требуют SSO через Active Directory / Keycloak / Okta. Реализовать:
  1. SAML 2.0 Service Provider (Spring Security SAML2)
  2. OIDC Relying Party (Spring Security OAuth2 Client)
  3. Automatic user provisioning from IdP claims → PRIVOD User
  4. Admin UI: настройка SSO per-tenant (IdP URL, certificate, mappings)
  5. Fallback на password auth если SSO не настроен
- **Источник**: IMPROVEMENTS.md Must-Have #7, GOLD-STANDARD §4.1
- **Критерий готовности**: SSO login через SAML/OIDC работает; User auto-provisioned; Admin UI для настройки

**Сессии Claude Code:**
1. *Сессия 1*: Spring Security SAML2 configuration
2. *Сессия 2*: OIDC (OAuth2 Client) configuration
3. *Сессия 3*: Auto-provisioning + tenant-specific IdP settings
4. *Сессия 4*: Admin UI — SSO settings page
5. *Сессия 5*: Тестирование с Keycloak + documentation

---

### ДОПОЛНЕНИЯ К СПРИНТУ 11 (Тестирование)

#### [S11-03] HR Legal Compliance: МРОТ, Вычеты, Коэффициенты, НС+ПЗ

- **Приоритет**: P2 (Should Have — юридическая обязанность)
- **Модули**: payroll, hr (backend)
- **Зависимости**: нет
- **Объём**: L (5 сессий)
- **Описание**:
  Юридически обязательные расчёты для строительных компаний:
  1. **МРОТ валидация** — зарплата ≥ 22,440 ₽/мес (2026), configurable
  2. **Налоговые вычеты НК РФ ст.218-221** — стандартные, детские, социальные, имущественные
  3. **Районный коэффициент + северная надбавка** (ТК РФ ст.294) — per-region configurable
  4. **НС и ПЗ взносы** — 0.2-8.5% по классу проф.риска (обязательно для стройки)
  5. **PIECEWORK calculation** — rate × output вместо fixed baseSalary
  6. **nightHours/holidayHours** — извлекать из timesheet data (сейчас always 0)
  7. **OPS_THRESHOLD** → configurable (меняется ежегодно)
  8. **Self-employed**: FNS НПД API integration + лимит 2.4М₽/год (ФЗ-422)
- **Источник**: 1.21, 1.22 audit files, IMPROVEMENTS.md Must-Have #381-386, #414-415
- **Критерий готовности**: PayrollService корректно считает МРОТ, вычеты, коэффициенты, НС+ПЗ; тесты покрывают все формулы

**Сессии Claude Code:**
1. *Сессия 1*: МРОТ validation + OPS_THRESHOLD configurable + PIECEWORK formula
2. *Сессия 2*: Налоговые вычеты (стандартные + детские)
3. *Сессия 3*: Районный коэффициент + северная надбавка + nightHours/holidayHours
4. *Сессия 4*: НС+ПЗ по классу проф.риска
5. *Сессия 5*: Self-employed FNS НПД API + 2.4M limit + тесты

---

### ДОПОЛНЕНИЯ К СПРИНТУ 13 (Юридика + Портал)

#### [S13-03] Планирование: Gantt Interactive + S-Curve + Import

- **Приоритет**: P2 (Should Have)
- **Модули**: planning (frontend + backend)
- **Зависимости**: S3-01 (tenant isolation planning entities)
- **Объём**: L (6 сессий)
- **Описание**:
  1. **Gantt interactive** — drag-and-drop tasks, WBS CRUD UI, стрелки зависимостей, edit duration
  2. **S-Curve EVM** — визуализация Planned Value / Earned Value / Actual Cost по времени (Recharts)
  3. **MS Project import** — .mpp через MPXJ library → tasks + dependencies + resources
- **Источник**: IMPROVEMENTS.md Should-Have, 1.13-planning.md, GOLD-STANDARD §1.2
- **Критерий готовности**: Gantt перетаскивается; S-Curve рисуется из реальных EVM данных; .mpp импортируется

**Сессии Claude Code:**
1. *Сессия 1*: Gantt library integration (dhtmlx-gantt или frappe-gantt)
2. *Сессия 2*: Gantt — WBS CRUD, drag, resize, dependency arrows
3. *Сессия 3*: Gantt — backend API for drag-and-drop save
4. *Сессия 4*: S-Curve EVM visualization (Recharts)
5. *Сессия 5*: MS Project import — MPXJ + mapping to PRIVOD tasks
6. *Сессия 6*: Frontend import wizard + тестирование

---

### НОВЫЙ: СПРИНТ 18 — MODULE-LEVEL BUG FIXES (2 недели)

> ~130 P2 багов по модулям, не покрытых другими задачами.

#### [S18-01] Processes Module P2 Fixes (25 bugs)

- **Приоритет**: P2
- **Модули**: pmWorkflow, changeManagement, workflow
- **Объём**: L (4 сессии)
- **Описание**: Query key mismatches, edit form defaults not updating, SubmittalCreateModal reviewer mapping, IssueListPage kanban ignores filters, RfiBoardPage HTML5 DnD, navigation path errors, dashboard chart type mismatches, race conditions in number generation, in-memory pagination OOM, missing email notifications for RFI, RFI PDF export.
- **Источник**: 1.15-processes.md (PROC-B10 through PROC-B42)

#### [S18-02] Portal Module P2 Fixes (15 bugs)

- **Приоритет**: P2
- **Модули**: portal
- **Объём**: M (3 сессии)
- **Описание**: 5 unrouted pages, PortalProjectListPage navigation to internal route, Ks2Draft review no org validation, TaskController nullable portalUserId, MessageService sender spoofing, AuthController no rate limiting, no pagination UI, N+1 snapshot queries, no VAT in financial summary, Settings/Branding localStorage→backend, hardcoded activeUsers, photo upload broken, KS-2 draft positional detail.
- **Источник**: 1.17-portal.md (BUG-11 through BUG-24)

#### [S18-03] HR/Payroll/Leave/Recruitment P2 Fixes (20 bugs)

- **Приоритет**: P2
- **Модули**: hr, payroll, leave, recruitment, selfEmployed
- **Объём**: L (4 сессии)
- **Описание**: Recruitment PII not encrypted, SelfEmployed INN no checksum, Payroll NPE on null normHours, LeaveType validity not checked, Recruitment status no state machine, Leave approve race condition, Payroll frontend-backend type mismatches, Dual SelfEmployed entities (Contractor V79 vs Worker V1134), missing LeaveRequest form pages, missing JobPosition detail page, payroll_adjustments table unused, StaffingTablePage no T-3 form, socialRate 2.9% missing НС+ПЗ, updateLaborBudgetActual swallows exceptions, TimesheetT13Page no validation.
- **Источник**: 1.21-hr-hrRussian.md, 1.22-leave-payroll-selfemployed-recruitment.md

#### [S18-04] BIM + Design + Documents P2 Fixes (30 bugs)

- **Приоритет**: P2
- **Модули**: bim, design, documents, cde, pto, integration1c
- **Объём**: L (5 сессий)
- **Описание**:
  **BIM**: DrawingOverlay/DrawingPins mock pages, uploadModel content-type mismatch, cross-linking endpoints 404, ClashDetection button no-op, DesignPackage reject missing, dual clash system consolidation.
  **Design**: Status enum mismatch, duplicate API files, hardcoded sections, update ignores fields, no detail pages (404), deleteSection no cascade check, design/bim overlap.
  **Documents**: CDE locking not implemented (columns exist), CDE revision approval not implemented, SmartDocRecognition mock, DocumentContainer tabs mock, Integration1C encryptedPassword not encrypted, EdoService UPD XML hardcoded INN, Integration1C 30+ path mismatches, HiddenWorkAct photoIds JSONB.
- **Источник**: 1.18-bim.md, 1.20-design.md, 1.16-documents-dataexchange-integration1c.md

#### [S18-05] Sales/CRM + Closeout/Maintenance + Admin P2 Fixes (30 bugs)

- **Приоритет**: P2
- **Модули**: crm, portfolio, bidManagement, closeout, maintenance, admin, subscription
- **Объём**: L (5 сессий)
- **Описание**:
  **Sales**: Opportunity activities stub, ContractorRatings mock, КП PDF export stub, CRM N+1, Map<String,Object> instead of DTO, convertToCounterparty no REST endpoint.
  **Closeout**: StroynadzorPackageDocument no orgId, AsBuiltTracker no @PreAuthorize, hardcoded Russian strings, CommissioningBoard HTML5 DnD.
  **Maintenance**: RequestForm edit calls create, no detail pages (404), BoardPage wrong navigation, hardcoded options, status type mismatch, duplicate API layer.
  **Admin**: PaymentController refund no org-scope, YooKassaService NPE, RoskomnadzorPage localStorage, storageUsedMb=0, AdminDashboardService systemHealthy=true, tenant data export missing, tenant account deletion missing, IP Whitelist not enforced.
- **Источник**: 1.23, 1.24, 1.25 audit files

#### [S18-06] Legal/Mail/Messenger/AI/Help Fixes + Infra (25 bugs)

- **Приоритет**: P2
- **Модули**: legal, mail, messenger, ai, help, infrastructure
- **Объём**: L (4 сессии)
- **Описание**:
  **Legal**: 7 GET без PreAuthorize, includeConfidential no RBAC.
  **Mail**: Attachment storage no size limit, email base-url localhost:3000, no retry failed emails.
  **Messenger**: 10 GET без PreAuthorize, pinMessage no role check, offline queue missing, message limit 200 hardcoded.
  **AI**: Unbounded thread pool DoS, token count=0 for SSE, systemPrompt empty.
  **Help**: Backend/frontend KB not synchronized, missing FAQ page, missing KB admin UI.
  **Infra**: File upload 5GB no limit, CSP unsafe-inline, Flyway validate-on-migrate: false, notifications no cleanup TTL, daily_reports missing composite index, JwtAuthFilter swallows exceptions.
- **Источник**: 1.26, 1.X audit files

---

### НОВЫЙ: СПРИНТ 19 — COMPETITIVE FEATURES (2 недели)

> Стратегические конкурентные фичи из COMPETITORS.md

#### [S19-01] AI Agent Builder (no-code) — Стратегическая Инициатива

- **Приоритет**: P3 (планирование — реализация H2 2026)
- **Модули**: ai (backend + frontend)
- **Зависимости**: S17-01 (AI features)
- **Объём**: XL (10 сессий)
- **Описание**:
  Пользователь создаёт AI-агентов через natural language промпты без кода. Готовые агенты: RFI Creation, Daily Log, Document Search, КС-2 Checker, НДС Calculator, Regulatory Checker.
  Включает: AI privacy policy (данные клиентов НЕ используются для обучения).
- **Источник**: COMPETITORS.md Must-Steal #1, Procore Agent Builder
- **Критерий готовности**: Пользователь может создать агента из промпта; 5+ готовых агентов; Privacy policy

**Сессии**: 10 (architecture, agent runtime, pre-built agents ×5, UI builder, testing, privacy)

---

#### [S19-02] AI Predictive Analytics + Contractor Scoring

- **Приоритет**: P2 (Should Have — конкурентный differentiator)
- **Модули**: analytics, ai (backend + frontend)
- **Зависимости**: S4-05 (stubs removed), S17-01 (AI infrastructure)
- **Объём**: L (6 сессий)
- **Описание**:
  1. **Predictive analytics**: ML модели для предсказания задержек, перерасходов, рисков на основе исторических данных проектов
  2. **Contractor scoring**: автоматический рейтинг = f(сроки, качество, цены, КС-2, претензии), авто-черный список, рекомендации при создании КЛ
  3. **Document Chain Intelligence**: AI валидация полноты цепочки документов (Спец→КЛ→ФМ→КП→Договор→КС-2→КС-3), авто-напоминания о недостающих
- **Источник**: COMPETITORS.md Must-Steal #7, Unique Opportunities #3, #4
- **Критерий готовности**: Прогнозы задержек на дашборде; Contractor score виден при создании КЛ; Missing documents highlighted

**Сессии**: 6 (data pipeline, prediction model, contractor scoring, document chain AI, frontend dashboards, testing)

---

#### [S19-03] 360° Фото + Plan-Centric Defects + Immutable Audit Trail

- **Приоритет**: P3 (Nice/Should Have)
- **Модули**: operations, quality, documents (frontend + backend)
- **Зависимости**: S16-01 (mobile/camera)
- **Объём**: L (6 сессий)
- **Описание**:
  1. **360° фото viewer** — загрузка, просмотр панорам, привязка к чертежам, timeline сравнение
  2. **Plan-centric defect tracking** — клик на чертеже → создание дефекта с фото, GPS-координатами, привязкой к элементу
  3. **Immutable audit trail** — append-only audit log с cryptographic hash chain для юридических споров
- **Источник**: COMPETITORS.md Should-Steal #6, #8, #11
- **Критерий готовности**: 360° фото просматриваются; Дефекты создаются на чертеже; Audit trail неизменяемый

**Сессии**: 6 (360 viewer, floor plan annotation, defect-on-plan, audit trail architecture, hash chain, frontend)

---

#### [S19-04] National AI Standard Compliance + Minstroy Integration

- **Приоритет**: P2 (регуляторное требование с 1 апреля 2026)
- **Модули**: compliance, ai
- **Зависимости**: S17-01 (AI features)
- **Объём**: M (2 сессии)
- **Описание**:
  Национальный стандарт AI для строительства обязателен с 1 апреля 2026 (Росстандарт). Подготовка:
  1. Анализ требований стандарта → checklist соответствия
  2. Документация AI-функций системы по требованиям стандарта
  3. Подготовка к интеграции с облачной платформой Минстроя "Управление строительством" (2026)
- **Источник**: COMPETITORS.md §8
- **Критерий готовности**: Checklist соответствия стандарту; Документация AI; План интеграции с Минстроем

**Сессии**: 2

---

### ОБНОВЛЁННАЯ СВОДНАЯ ТАБЛИЦА

| Этап | Спринты | Задач (было) | Задач (стало) | Сессий (было) | Сессий (стало) |
|------|---------|-------------|--------------|--------------|---------------|
| 1. Стабильность | 1–4 | 17 | 20 (+3) | 47 | 58 (+11) |
| 2. Ядро | 5–8 | 12 | 18 (+6) | 55 | 84 (+29) |
| 3. SaaS-ready | 9–11 | 8 | 13 (+5) | 23 | 39 (+16) |
| 4. Продажи | 12–13 | 4 | 5 (+1) | 15 | 21 (+6) |
| 5. Масштаб | 14–17 | 5 | 5 | 36 | 36 |
| **6. Стабилизация** | **18** | **0** | **6** | **0** | **25** |
| **7. Конкурентность** | **19** | **0** | **4** | **0** | **24** |
| **ИТОГО** | **19** | **46** | **71 (+25)** | **178** | **287 (+109)** |

### ОБНОВЛЁННЫЕ МЕТРИКИ

| Контрольная точка | Оценка | Production-ready |
|-------------------|--------|------------------|
| Сейчас | 6.2/10 | 38% |
| После этапа 1 (спринт 4) | 7.5/10 | 65% |
| После этапа 2 (спринт 8) | 8.5/10 | 82% |
| После этапа 3 (спринт 11) | 9.0/10 | 92% |
| После этапа 4 (спринт 13) | 9.2/10 | 95% |
| После этапа 5 (спринт 17) | 9.5/10 | 97% |
| После этапа 6 (спринт 18) | 9.7/10 | 98% |
| После этапа 7 (спринт 19) | 9.8/10 | 99% |

---

> **Этот roadmap — живой документ.** Обновляется в начале каждого спринта.
> Прогресс отслеживается в `00-INDEX.md` (статус фазы 2) и `phase3-execution/` (логи выполнения).
>
> **Кросс-проверка завершена 2026-03-19**: все файлы из `docs/world-class/` (BUGS.md, IMPROVEMENTS.md,
> COMPETITORS.md, 1.0-1.26+1.X+1.UX audit files, GOLD-STANDARD.md) проверены на покрытие в roadmap.

---

## ПРИЛОЖЕНИЕ B: PRODUCT BACKLOG (P3 + Nice-to-Have + Nice-to-Steal)

> Всё, что НЕ вошло в спринты 1-19, но зафиксировано в аудитах.
> Это полировка после запуска — НЕ блокеры production.
> Приоритизировать и подтягивать в спринты по мере освобождения ресурсов.
> Каждый пункт имеет ссылку на источник для трассируемости.

---

### B1. P3 БАГИ ПО МОДУЛЯМ (~295 шт)

#### B1.1 God-Classes (оставшиеся 4 из 7)

| Класс | LOC | Модуль | Источник |
|-------|-----|--------|----------|
| CompetitiveListService | 558 | specifications | `1.5-specifications.md` P3 |
| MaintenanceService | 522 | maintenance | `1.25-closeout-maintenance.md` P3 |
| SelfEmployedService | 675 | selfEmployed | `1.22-leave-payroll-selfemployed-recruitment.md` P3 |
| ApprovalInstanceService | 620 | workflow | `1.19-workflow-approval.md` P3 |

> Top 3 (BudgetService 896, ClosingDocumentService 660, AnalyticsDataService 1136) покрыты в S17-02.

#### B1.2 Дублирующие Модули (оставшиеся)

| Дубль | Что | Источник |
|-------|-----|----------|
| EDO × 2 | `russianDoc.EdoService` + `edo.EdoService` | `1.16-documents-dataexchange-integration1c.md` P3 |
| DailyLog × 2 | `operations/DailyLog*` + `dailylog/DailyLog*` (разные API paths) | `1.6-operations-site.md` P3 BUG-O21 |
| Dispatch × 2 | `operations.DispatchService` + `dispatch.DispatchService` | `1.6-operations-site.md` P3 |
| Design API × 2 | `src/api/design.ts` + `src/modules/design/api.ts` | `1.20-design.md` P3 BUG-D8 |
| Maintenance API × 2 | `api/maintenance.ts` + `modules/maintenance/api.ts` | `1.25-closeout-maintenance.md` P3 |
| Workflow API × 2 | `api/workflow.ts` + `modules/workflow/api.ts` | `1.19-workflow-approval.md` P3 |
| Geofence × 2 | `geofence_zones` (IoT) + `site_geofences` (GPS) | `1.10-fleet-iot.md` P3 |

> BidPackage×2 и PurchaseOrder×2 покрыты в S5-03.

#### B1.3 Cross-Module Imports

| Нарушитель | Импортирует из | Источник |
|-----------|----------------|----------|
| PayrollService | finance, hr, calendar (6 imports) | `1.21-hr-hrRussian.md` P1 BUG-129 |
| CompetitiveListService | estimates, specs, finance (7 imports) | `1.2-estimates-pricing.md` P3 |
| EstimateService | specs, finance, operations (4 imports) | `1.2-estimates-pricing.md` P3 |
| ApprovalService | specifications (SpecificationRepository) | `1.19-workflow-approval.md` P3 BUG-WF-B32 |

> PayrollService → domain events покрыт рефакторингом, но не выделен в отдельную задачу.

#### B1.4 Finance P3

- InvoiceStatus: 13 статусов с дублирующими путями (DRAFT/NEW, SENT/UNDER_REVIEW) → упростить state machine | `1.1-finance.md` BUG-F7
- BudgetStatus APPROVED can roll back to DRAFT без Change Order | `1.1-finance.md` BUG-F6
- SpecificationStatus same: APPROVED → DRAFT без CO | `1.5-specifications.md` BUG-S17
- CompetitiveListService.overallBestPrice = min среди winners, а не total → бессмысленная метрика | `1.2-estimates-pricing.md` BUG-E22
- Hardcoded Russian strings: FmPage (5 строк), FmItemsTable (3 строки) | `1.1-finance.md` BUG-F5
- N+1 в recalculateKs3Totals, enrichLeadPage, bulkCalculate | `1.1-finance.md` P3, `1.X-architecture.md`
- PriceSuggestionService loads all prices in RAM for median | `1.X-architecture.md` P3

#### B1.5 Operations / Safety / Quality P3

- WaybillPrintTemplate exists but not imported anywhere | `1.10-fleet-iot.md` P3
- Geofence false EXITED alerts for STORAGE zones | `1.10-fleet-iot.md` P3 BUG
- IoT sensor_data no partitioning/retention (26M records/month at 50 sensors) | `1.10-fleet-iot.md` P3
- Prescription overdue status no auto-update (no scheduler when deadline < today) | `1.8-quality-regulatory.md` P3 BUG-119
- SafetyBoardPage HTML5 DnD (если не мигрирована в S8-05) | `1.7-safety.md` P2
- DefectDashboard cross-tenant aggregation (6 queries без org filter) — покрыт S3-01 | `1.6-operations-site.md` P2

#### B1.6 HR / Payroll P3

- No advance salary calculation (TK RF st.136 — 2 times/month) | `1.21-hr-hrRussian.md` P3
- No sick leave calculation (FZ-255) | `1.21-hr-hrRussian.md` P3
- No vacation pay calculation (TK RF st.139) | `1.21-hr-hrRussian.md` P3
- No export to PDF/Excel on ANY HR page | `1.21-hr-hrRussian.md` P3
- No expiring certificate/qualification notifications | `1.21-hr-hrRussian.md` P3
- EmployeeDetailPage missing "Documents" tab for scanned passport/SNILS | `1.21-hr-hrRussian.md` P3
- SelfEmployed FNS verification STUB (always returns ACTIVE) | `1.22-leave-payroll-selfemployed-recruitment.md` P3
- SelfEmployed fiscal receipt check STUB | `1.22-leave-payroll-selfemployed-recruitment.md` P3
- SelfEmployed Contractor INN globally UNIQUE (same as P1 pattern) | `1.22-leave-payroll-selfemployed-recruitment.md` P3

#### B1.7 Workflow / Approval P3

- ApprovalStep.isOverdue field never updated (no scheduler) | `1.19-workflow-approval.md` P3 WF-B24
- WorkflowDefinitionResponse stepsCount not returned | `1.19-workflow-approval.md` P3 WF-B26
- SLA deadline set for ALL steps at chain creation (should be at step activation) | `1.19-workflow-approval.md` P3 WF-B27
- Hardcoded Russian error strings (6 locations) | `1.19-workflow-approval.md` P3 WF-B31
- Missing parallel approval paths (only sequential) | `1.19-workflow-approval.md` P3
- Missing approval analytics dashboard (avg time, bottleneck steps) | `1.19-workflow-approval.md` P3
- Missing workflow versioning | `1.19-workflow-approval.md` P3
- Missing escalation notification (TODO in code) | `1.19-workflow-approval.md` P3

#### B1.8 Documents / CDE / PTO P3

- DrawingViewerPage no real PDF rendering (SVG canvas with grid, no PDF.js) | `1.16-documents-dataexchange-integration1c.md` P3
- HiddenWorkActFormPage no multi-party signature workflow | `1.16-documents-dataexchange-integration1c.md` P3
- ChekkaService in-memory cache no eviction (memory leak) | `1.16-documents-dataexchange-integration1c.md` P3
- ItdValidationPage hardcoded demo data | `1.16-documents-dataexchange-integration1c.md` P3
- Ks6CalendarPage hardcoded demo calendar | `1.16-documents-dataexchange-integration1c.md` P3
- PTO code uniqueness globally unique (not per-tenant) | `1.16-documents-dataexchange-integration1c.md` P3

#### B1.9 Portal P3

- Missing invite-link flow for portal user registration | `1.17-portal.md` P3
- Missing portal onboarding wizard | `1.17-portal.md` P3
- PortalAuthService forgotPassword/resetPassword = placeholder | `1.17-portal.md` P3

#### B1.10 BIM P3

- No 5D BIM (cost linked to BIM elements) — Gold Standard requirement | `1.18-bim.md` P3
- No file size limit for BIM model upload — DoS risk | `1.18-bim.md` P3

#### B1.11 Sales / CRM P3

- BidPackageStatus no state machine validation (CLOSED→DRAFT allowed) | `1.23-sales-crm-portfolio-bidmanagement.md` P3 BUG-136
- Opportunity.organizationId nullable (bypass @Filter) | `1.23-sales-crm-portfolio-bidmanagement.md` P3 BUG-138
- BidInvitation bidPackageId not validated on update | `1.23-sales-crm-portfolio-bidmanagement.md` P3 BUG-139
- Counterparty INN no checksum digit validation | `1.23-sales-crm-portfolio-bidmanagement.md` P3 BUG-140
- CrmLead updateLead stage bypass (no sequential validation) | `1.23-sales-crm-portfolio-bidmanagement.md` P3 BUG-141
- assessMarginByAnalog uses probability instead of margin | `1.23-sales-crm-portfolio-bidmanagement.md` P3 BUG-144
- No CRM Kanban drag-and-drop | `1.23-sales-crm-portfolio-bidmanagement.md` P3
- No BidManagementService tests | `1.23-sales-crm-portfolio-bidmanagement.md` P3
- CrmLead search only 3 fields | `1.23-sales-crm-portfolio-bidmanagement.md` P3

#### B1.12 Admin / Subscription P3

- SubscriptionService Integer.MAX_VALUE for unlimited | `1.24-admin-settings-subscription-monitoring.md` P3 BUG-151
- Auto-creates FREE trial without sign-up | `1.24-admin-settings-subscription-monitoring.md` P3 BUG-152
- FeatureFlagService no tenant scope | `1.24-admin-settings-subscription-monitoring.md` P3 BUG-153
- NotificationService loses notifications on userId lookup fail | `1.24-admin-settings-subscription-monitoring.md` P3 BUG-154
- TenantManagementService.getTenantDetail NPE on empty audit logs | `1.24-admin-settings-subscription-monitoring.md` P3 BUG-155
- ProfilePage avatar upload placeholder (button no-op) | `1.24-admin-settings-subscription-monitoring.md` P3
- SecuritySettingsPage toggles without re-authentication | `1.24-admin-settings-subscription-monitoring.md` P3
- Missing MAU/DAU/retention/churn/MRR/ARR metrics | `1.24-admin-settings-subscription-monitoring.md` P3
- Missing usage-based billing | `1.24-admin-settings-subscription-monitoring.md` P3
- Missing mass notifications UI | `1.24-admin-settings-subscription-monitoring.md` P3
- Missing API Keys for integrations (HMAC-signed) | `1.24-admin-settings-subscription-monitoring.md` P3
- No session concurrency limit enforcement | `1.24-admin-settings-subscription-monitoring.md` P3

#### B1.13 Closeout / Maintenance P3

- WarrantyClaimDetailPage no workflow action buttons | `1.25-closeout-maintenance.md` P3
- HandoverPackageDetailPage minimal info (no document list) | `1.25-closeout-maintenance.md` P3
- Missing Lessons Learned page (Gold Standard §1.19) | `1.25-closeout-maintenance.md` P3
- Missing project archive functionality | `1.25-closeout-maintenance.md` P3
- 0 tests for StroynadzorPackageService | `1.25-closeout-maintenance.md` P3
- 0 tests for AsBuiltTrackerService | `1.25-closeout-maintenance.md` P3

#### B1.14 Legal / Mail / Messenger / AI / Help P3

- Email base-url hardcoded localhost:3000 | `1.26-legal-mail-messenger-ai-help.md` P3 B6
- No retry for failed email notifications | `1.26-legal-mail-messenger-ai-help.md` P3 B7
- Messages limit=200 hardcoded | `1.26-legal-mail-messenger-ai-help.md` P3 B10
- getOrganizationUsers in-memory search (100 cap) | `1.26-legal-mail-messenger-ai-help.md` P3 B11
- AI Photo analysis = 100% frontend mock | `1.26-legal-mail-messenger-ai-help.md` P3 B17
- AI Risk predictions = 100% frontend mock | `1.26-legal-mail-messenger-ai-help.md` P3 B18
- AI systemPrompt = "" (no context about PRIVOD) | `1.26-legal-mail-messenger-ai-help.md` P3 B19
- LegalCaseResponse doesn't resolve names (only UUID) | `1.26-legal-mail-messenger-ai-help.md` P3 B3
- LegalController includeConfidential no RBAC role check | `1.26-legal-mail-messenger-ai-help.md` P3 B2
- Missing rich-text editor in email compose | `1.26-legal-mail-messenger-ai-help.md` P3
- Missing attachment upload in email compose | `1.26-legal-mail-messenger-ai-help.md` P3
- Missing KB admin UI (backend CRUD exists, no frontend) | `1.26-legal-mail-messenger-ai-help.md` P3
- Missing FAQ page on frontend (backend API exists) | `1.26-legal-mail-messenger-ai-help.md` P3
- 0 tests in ALL 5 modules | `1.26-legal-mail-messenger-ai-help.md` P2
- Missing message pagination (cursor-based) | `1.26-legal-mail-messenger-ai-help.md` P3

#### B1.15 Infrastructure P3

- N+1 User.roles EAGER fetch | `1.X-architecture.md` P3
- No PgBouncer for connection multiplexing | `1.X-architecture.md` P3
- Certificate renewal not automated (no Let's Encrypt) | `1.X-architecture.md` P3
- AlertManager only Telegram (no email fallback) | `1.X-architecture.md` P3
- Notifications table no cleanup (grows indefinitely) | `1.X-architecture.md` P3
- No Grafana dashboards for Prometheus | `1.X-architecture.md` P3
- No RUM (Real User Monitoring) | `1.X-architecture.md` P3
- SystemStatusController exposes JVM info | `1.X-architecture.md` P3
- Flyway out-of-order: true (compliance risk) | `1.X-architecture.md` P3
- Swagger UI exposed by default | `1.X-architecture.md` P4
- DEBUG logging level in base config | `1.X-architecture.md` P4
- DataTable CSV export без t() | `BUGS.md` P4
- N+1 batch resolution pattern duplicated | `BUGS.md` P4
- client.ts auth/redirect logic duplicated | `BUGS.md` P4
- WAF missing (no ModSecurity/Cloudflare) | `1.0-overview.md` P3
- Auto-rollback missing on failed health check | `1.0-overview.md` P3
- Documentation scattered across 5+ directories | `1.0-overview.md` P3
- JwtAuthenticationFilter silently swallows ALL exceptions | `1.0-overview.md` P2
- Coverage gating missing in CI | `1.0-overview.md` P3

---

### B2. NICE-TO-HAVE УЛУЧШЕНИЯ (~180 шт из IMPROVEMENTS.md)

#### B2.1 UX / Frontend

- Cmd+K global search → **покрыт S8-04**
- Персональный дашборд «Мой день» → **покрыт S8-04**
- Saved views / filters — "мои задачи", "просроченные КС-2" | `IMPROVEMENTS.md` Nice, `GOLD-STANDARD.md` §8.1
- Настраиваемые дашборды (drag-and-drop виджеты) | `IMPROVEMENTS.md` Nice, `GOLD-STANDARD.md` §8.1
- Animations и transitions | `GOLD-STANDARD.md` §8.1
- Keyboard shortcuts для опытных пользователей | `GOLD-STANDARD.md` §8.1
- Bulk actions — выбрать несколько → массовое действие | `GOLD-STANDARD.md` §8.1
- Storybook — каталог компонентов | `GOLD-STANDARD.md` §2.3
- WCAG 2.1 AA accessibility (контрастность, клавиатурная навигация, screen reader) | `GOLD-STANDARD.md` §8.2
- Масштабируемость шрифтов | `GOLD-STANDARD.md` §8.2
- Часовые пояса — проекты в разных регионах | `GOLD-STANDARD.md` §8.3
- Мобильная навигация bottom tab → **покрыт S16-01**

#### B2.2 Планирование

- 4D визуализация (график + BIM) | `GOLD-STANDARD.md` §1.2
- Lookahead schedules на 2-4 недели | `GOLD-STANDARD.md` §1.2
- Автообновление графика из ежедневных отчётов | `GOLD-STANDARD.md` §1.2
- Учёт погодных дней (API погоды) | `GOLD-STANDARD.md` §1.2, `1.UX-navigation.md` §5.5

#### B2.3 Финансы

- Признание выручки по % завершения (МСФО 15 / ФСБУ) | `GOLD-STANDARD.md` §1.3
- Взаимозачёты между контрагентами | `GOLD-STANDARD.md` §1.3
- Variable VAT rates per FM line (0%, 10%, 20%) | `IMPROVEMENTS.md` Should-Have
- Акт сверки взаиморасчётов PDF | `GOLD-STANDARD.md` §16
- ТОРГ-12 (товарная накладная) PDF | `GOLD-STANDARD.md` §16
- Доверенность М-2 PDF | `GOLD-STANDARD.md` §16
- Форма С-3 (акт инвентаризации незавершённого строительства) | `GOLD-STANDARD.md` §16

#### B2.4 Снабжение / Склад

- QR/штрих-коды для складского учёта (мобильный сканер) | `GOLD-STANDARD.md` §1.5-1.6
- Автоматические заявки при минимальном остатке | `GOLD-STANDARD.md` §1.5
- Резервирование материалов под проект/работу | `GOLD-STANDARD.md` §1.6
- Three-way invoice matching (PO↔Receipt↔Invoice) → **покрыт в бэклоге, не в спринте**
- Рейтинг поставщиков (по срокам, качеству, ценам) | `GOLD-STANDARD.md` §1.5

#### B2.5 Документооборот

- Watermark / защита документов | `GOLD-STANDARD.md` §1.7
- Полнотекстовый поиск по содержимому (OCR сканов) | `GOLD-STANDARD.md` §1.7
- Шаблоны документов с автозаполнением | `GOLD-STANDARD.md` §1.7
- Электронный архив долгосрочного хранения | `GOLD-STANDARD.md` §1.7

#### B2.6 Коммуникации

- Calendar sync Google/Outlook | `GOLD-STANDARD.md` §1.18
- Telegram-бот уведомления/согласования | `GOLD-STANDARD.md` §1.18
- @упоминания с уведомлением | `GOLD-STANDARD.md` §1.18
- Лента активности по проекту (real-time) | `GOLD-STANDARD.md` §1.18

#### B2.7 Безопасность / Compliance

- IP whitelist для enterprise | `GOLD-STANDARD.md` §4.1
- SCIM авто-провизионинг из AD/LDAP | `GOLD-STANDARD.md` §4.1, `IMPROVEMENTS.md` Should-Have
- DLP (Data Loss Prevention) | `GOLD-STANDARD.md` §4.2
- Penetration testing (annually) | `GOLD-STANDARD.md` §4.2
- SOC 2 сертификация | `GOLD-STANDARD.md` §4.3

#### B2.8 Инфраструктура

- Blue-green / canary deployments | `GOLD-STANDARD.md` §5.1
- Feature flags — включение/выключение без деплоя | `GOLD-STANDARD.md` §5.1
- Terraform IaC | `GOLD-STANDARD.md` §5.1
- Redis Sentinel / Cluster | `GOLD-STANDARD.md` §5.3
- CDN для статики | `GOLD-STANDARD.md` §5.3
- Auto-scaling по CPU/memory | `GOLD-STANDARD.md` §5.3
- PgBouncer | `1.X-architecture.md` P3
- Backup в отдельный регион | `GOLD-STANDARD.md` §5.4
- RTO < 1 час, RPO < 15 минут | `GOLD-STANDARD.md` §5.4
- DR Runbook контакты заполнить | `1.X-architecture.md` P2

#### B2.9 Маркетинг / Продажи

- Блог со статьями для ЦА | `GOLD-STANDARD.md` §9.1
- Кейсы клиентов | `GOLD-STANDARD.md` §9.1
- Страницы сравнения (PRIVOD vs 1С, vs Procore, vs PUSK) | `GOLD-STANDARD.md` §9.1, `COMPETITORS.md` §7
- SEO: семантическое ядро, structured data, sitemap | `GOLD-STANDARD.md` §9.1
- Живой чат для консультаций (Carrot Quest, JivoSite) | `GOLD-STANDARD.md` §9.1
- Видео-демо по модулям (3-5 мин каждый) | `GOLD-STANDARD.md` §9.2
- Калькулятор ROI на сайте | `GOLD-STANDARD.md` §9.4
- Email-рассылки onboarding drip | `GOLD-STANDARD.md` §9.3
- Telegram-канал продукта | `GOLD-STANDARD.md` §9.3
- Реферальная программа | `GOLD-STANDARD.md` §9.3
- CSAT / NPS опросы после тикетов | `GOLD-STANDARD.md` §10.1
- Feature request board (голосование) | `GOLD-STANDARD.md` §10.3
- Churn prediction по падению активности | `GOLD-STANDARD.md` §10.3
- Changelog / What's New | `GOLD-STANDARD.md` §10.2

#### B2.10 Юридика

- Оферта для юрлиц (публичная или индивидуальная) | `GOLD-STANDARD.md` §11.1
- Лицензионный договор | `GOLD-STANDARD.md` §11.1
- SLA (Service Level Agreement) | `GOLD-STANDARD.md` §11.1
- NDA шаблон | `GOLD-STANDARD.md` §11.1
- Торговая марка в Роспатенте | `GOLD-STANDARD.md` §11.3
- Свидетельство в Реестре российского ПО (Минцифры) | `GOLD-STANDARD.md` §11.3

#### B2.11 Портал / API

- SDK для Python и JavaScript | `GOLD-STANDARD.md` §6.5
- Sandbox (тестовая среда) для разработчиков | `GOLD-STANDARD.md` §6.5
- Webhooks → API документация | `GOLD-STANDARD.md` §6.5
- Портал субподрядчика (бесплатный аккаунт, задания, КС-2) | `GOLD-STANDARD.md` §14
- Портал заказчика (дашборд, фотоотчёты, согласования) | `GOLD-STANDARD.md` §13
- Брендирование портала (логотип, цвета подрядчика) | `GOLD-STANDARD.md` §13

#### B2.12 Admin Panel (вендора)

- Feature flags per-tenant | `GOLD-STANDARD.md` §15
- Аналитика по использованию (какие модули популярны) | `GOLD-STANDARD.md` §15
- Массовые уведомления | `GOLD-STANDARD.md` §15
- Управление базой знаний (CRUD) | `GOLD-STANDARD.md` §15
- Обратная связь (сводка запросов фич) | `GOLD-STANDARD.md` §15

---

### B3. NICE-TO-STEAL КОНКУРЕНТНЫЕ ФИЧИ (~18 шт из COMPETITORS.md)

| # | Фича | Конкурент | Источник |
|---|------|-----------|----------|
| 1 | Takeoff tool из цифровых планов (измерения, площади, объёмы) | Buildertrend | `COMPETITORS.md` §5 #16 |
| 2 | AI prediction of safety incidents (weekly, trained on 10K+ project-years) | Oracle Advisor | `COMPETITORS.md` §5 #17 |
| 3 | Generative scheduling — AI итерация миллионов вариантов графика | ALICE Technologies | `COMPETITORS.md` §5 #18 |
| 4 | Built-in email marketing (campaigns from system) | Buildertrend | `COMPETITORS.md` §5 #19 |
| 5 | Facility Management module (post-construction lifecycle) | PlanRadar | `COMPETITORS.md` §5 #20 |
| 6 | Voice commands on mobile (Procore Assist) | Procore | `COMPETITORS.md` §2.1 |
| 7 | Built-in project financing for clients (GreenSky) | Buildertrend | `COMPETITORS.md` §2.3 |
| 8 | Per-active-job pricing model | CoConstruct | `COMPETITORS.md` §2.4 |
| 9 | Personal implementation coach included | CoConstruct | `COMPETITORS.md` §2.4 |
| 10 | Hardware integration (GPS, geodesy, sensors from Trimble devices) | Trimble Viewpoint | `COMPETITORS.md` §2.7 |
| 11 | AI Title Block Extraction from drawings | Trimble Viewpoint | `COMPETITORS.md` §2.7 |
| 12 | Deep learning schedule risk prediction (750K+ historical schedules) | nPlan | `COMPETITORS.md` §3 |
| 13 | 360-camera/drone/LiDAR auto-mapping to plans/BIM | OpenSpace | `COMPETITORS.md` §3 |
| 14 | Computer vision from 360 cameras on hardhats → BIM comparison | Buildots | `COMPETITORS.md` §3 |
| 15 | AI scan plans to create bid packages, 100% scope coverage | Downtobid | `COMPETITORS.md` §3 |
| 16 | AI document review via Claude MCP, Magic Markups | Bluebeam MAX | `COMPETITORS.md` §3/Appendix |
| 17 | Neural CAD / BIM-native AI assistant | Autodesk ACC | `COMPETITORS.md` Appendix |
| 18 | ML for schedules + drone/LiDAR monitoring | Sarex | `COMPETITORS.md` Appendix |

---

### B4. СТРАТЕГИЧЕСКИЕ РЕШЕНИЯ (не фичи, а решения бизнеса)

| # | Решение | Контекст | Источник |
|---|---------|----------|----------|
| 1 | Определить pricing model: per-user vs flat vs ACV vs per-project | Procore=ACV, Fieldwire=per-user+free, Buildertrend=flat, Pragmacore=per-project | `COMPETITORS.md` Next Steps #2 |
| 2 | On-premise deployment option | Pragmacore, 1С, БИТ — закрытые корпоративные сети | `COMPETITORS.md` §1.2 |
| 3 | CIS localization (kz, uz) | PUSK.APP жалобы "нет казахского", рынок СНГ | `COMPETITORS.md` §6 #5 |
| 4 | App Marketplace / Open API developer portal | Procore 500+ integrations | `COMPETITORS.md` §2.1 |
| 5 | Bottom-up adoption strategy (field workers first) | Fieldwire go-to-market | `COMPETITORS.md` §2.5 |
| 6 | AI privacy policy (data NOT used for training) | Fieldwire commitment | `COMPETITORS.md` §2.5 |
| 7 | Competitive positioning docs для sales team | vs каждый конкурент | `COMPETITORS.md` §7 |
| 8 | Свидетельство в Реестр российского ПО (Минцифры) | Преимущество при госзакупках | `GOLD-STANDARD.md` §11.3 |

---

### B5. ТЕСТИРОВАНИЕ (оставшийся долг)

| Модуль | Тестов сейчас | Что нужно | Источник |
|--------|--------------|-----------|----------|
| closing | 0 | Unit: КС-2 totals, КС-3 cumulative, StroynadzorPackage BFS | `1.3`, `1.25` |
| operations | 0 | Unit: Dispatch sequencing, M29 calculations, DailyReport validation | `1.6` |
| bim | 0 | Unit: Clash detection (when real), IFC parser | `1.18` |
| design | 0 | Unit: Status machine, version transitions | `1.20` |
| workflow | 0 | Unit: SLA calculation, condition evaluation, step transitions (33 cases) | `1.19` |
| payroll | 0 (beyond S11-01) | Integration: full payslip generation E2E | `1.21`, `1.22` |
| selfEmployed | 0 | Unit: НПД calculation, limit check, INN validation | `1.22` |
| maintenance | 0 | Unit: Preventive schedule, cost tracking | `1.25` |
| closeout | 0 | Unit: BFS aggregation, quality gates | `1.25` |
| legal | 0 | Unit: Case lifecycle, deadline tracking | `1.26` |
| mail | 0 | Unit: Email parsing, attachment handling | `1.26` |
| messenger | 0 | Unit: Channel permissions, thread resolution | `1.26` |
| ai | 0 | Unit: Token counting, conversation isolation | `1.26` |
| help | 0 | Unit: Context routing, article matching | `1.26` |
| bidManagement | 0 | Unit: Leveling matrix, invitation flow, scoring | `1.23` |
| contracts | 0 (beyond state machine) | Integration: Approval workflow (15 cases), state transitions (33) | `1.4` |
| portal | 0 | Integration: Auth flow, KS-2 draft lifecycle | `1.17` |

---

> **Итого в Product Backlog: ~500+ пунктов** (295 P3 багов + 180 Nice-to-Have + 18 Nice-to-Steal + стратегические решения + тестовый долг).
> Каждый пункт трассируем до конкретного файла аудита.
> Приоритизация и планирование — после завершения спринтов 1-19.
