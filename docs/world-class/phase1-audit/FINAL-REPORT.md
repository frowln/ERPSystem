# ФАЗА 1 — ИТОГОВЫЙ СВОДНЫЙ ОТЧЁТ АУДИТА

> **Аудитор**: CTO / Technical Director
> **Дата завершения**: 2026-03-19
> **Охват**: 26 групп сайдбара + архитектура/инфра/security + UX-навигация + конкурентный анализ, ~200 страниц, 93 backend + 87 frontend модулей
> **Методология**: Code review + GOLD-STANDARD сравнение + конкурентный анализ 13 компаний + UX-аудит навигации
> **Сессии**: 1.0 (overview) + 1.1-1.26 (модули) + 1.X (architecture) + 1.UX (навигация) + COMPETITORS

---

## 1. EXECUTIVE SUMMARY

### Общая оценка: 6.2/10 — "Амбициозный MVP с системными проблемами безопасности"

PRIVOD — строительная ERP-платформа впечатляющего масштаба: **2493 API-эндпоинта, 591 JPA-сущность, 301 Flyway-миграция, ~200 UI-страниц**. По широте охвата функций (от сметы до BIM, от HR до КЭП) это уровень Procore. По глубине реализации и production-readiness — это MVP+, требующий серьёзной доработки безопасности перед запуском.

### Главные сильные стороны

1. **Масштаб покрытия** — почти полная цепочка строительного бизнеса в одной системе (26 доменных групп)
2. **Архитектурный фундамент** — модульный монолит Spring Boot + React, JWT+RBAC, multi-tenancy framework (3-layer в admin модуле)
3. **Российская специфика** — ГЭСН/ФЕР/ТЕР, КС-2/КС-3, М-29, НДФЛ 5-ступенчатый, ОПС порог, СОУТ, МДС 81-3.2001 маш.-час
4. **i18n** — 25k+ строк ru+en, полностью билингвальная система
5. **Уникальные фичи** — StroynadzorPackage (BFS 5-source aggregation), Leveling Matrix для КЛ, CPM+EVM enterprise-level, Legal модуль (нет у конкурентов), 7-dim RAG Portfolio Health
6. **Дизайн-система** — 38 компонентов, токены, dark mode на ~95% страниц
7. **Инфраструктура** — CI/CD, Docker, Prometheus, MinIO S3, Redis, WebSocket STOMP

### Главные слабости

1. **КРИТИЧЕСКАЯ: Tenant isolation сломан в 324 entities (53%)** — данные утекают между организациями (зарплаты, контракты, BIM-модели, AI-диалоги)
2. **КРИТИЧЕСКАЯ: SQL Injection** — 7 мест строковой конкатенации user input в SQL (портал)
3. **КРИТИЧЕСКАЯ: 200+ GET endpoints без @PreAuthorize** — любой аутентифицированный пользователь видит всё
4. **НДС 20% вместо 22%** — все финансовые расчёты занижены на ~1.6%
5. **PostgreSQL RLS отсутствует** — native SQL queries обходят Hibernate @Filter, нет 4-го слоя защиты
6. **MinIO без tenant prefix** — UUID файла = cross-tenant access через S3 API
7. **Redis/cache без tenant namespace** — permission cache shared между тенантами
8. **JWT secret validation = warning-only** — приложение стартует со слабым секретом
9. **WebSocket /ws/** permitAll** — upgrade без аутентификации
10. **CORS allowedHeaders(*) + credentials(true)** — arbitrary header injection
11. **PII не маскируется в логах** — нарушение 152-ФЗ
12. **Множество стабов/моков в production** — ~15 страниц с фейковыми данными, 12+ сервис-методов-заглушек
13. **Нет реальной 1С/ЭДО интеграции** — критично для российского рынка
14. **0 печатных форм** — нет ни КС-2, ни М-29, ни Т-12 в PDF по ГОСТ
15. **Нет SAST/DAST/dependency scanning в CI** — уязвимости не обнаруживаются автоматически
16. **Нет нагрузочных тестов** — production capacity неизвестна
17. **UX навигации: 3.0/10** — 24 группы / ~185 пунктов (Procore ~12, PlanRadar ~7). Перегруз в 10-25x
18. **6+ дублей в навигации** — наряд-заказы ×2, табели ×2, штатное ×2, М-29 ×2
19. **Ролевая фильтрация не работает** — прораб видит «Калькулятор факторинга» и «IoT датчики»

### Готовность к продакшену по направлениям

| Направление | Готовность | Комментарий |
|---|---|---|
| **Безопасность (Security)** | **15%** | 324 entity tenant leaks (53%), no RLS, SQL injection, MinIO/Redis no tenant namespace, IDOR, 200+ unprotected endpoints, JWT weak validation, CORS misconfigured, WebSocket permitAll, PII in logs |
| **Финансы (Core)** | **55%** | Логика есть, НДС неправильный, стабы в сметах, нет печатных форм |
| **Полевые операции** | **50%** | CRUD работает, tenant isolation сломан, нет offline sync |
| **Документооборот** | **40%** | CDE framework есть, ЭДО=mock, execDocs=localStorage, PTO no tenant |
| **Интеграции (1С/ЭДО/ИСУП)** | **10%** | Все заглушки. OData/SOAP клиенты есть, но не используются |
| **HR/Payroll** | **55%** | НДФЛ расчёт enterprise-level, 0 печатных форм, 8 entities no tenant |
| **UX/Accessibility** | **65%** | Dark mode, i18n, дизайн-система. Нет a11y, нет loading states |
| **UX навигации** | **20%** | 24 группы/~185 пунктов (конкуренты 7-12). 6+ дублей. Нет ролевой фильтрации. Перегруз 10-25x |
| **Тестирование** | **30%** | 663 unit теста, 0 integration/e2e, ~80% модулей без тестов |
| **Инфраструктура** | **60%** | Docker+CI есть. Health checks fake, backups simulated, no SAST |
| **Юридическое (152-ФЗ)** | **70%** | Страницы Terms/Privacy/Cookie есть. RKN checklist в localStorage |
| **Биллинг/SaaS** | **50%** | YooKassa интеграция есть. Webhook HMAC optional, dunning нет |
| **BIM** | **30%** | IFC.js viewer есть. 11 entities no tenant, clash detection fake |
| **Аналитика** | **40%** | ReportBuilder 12 sources уникален. Данные fabricated, predictive=mock |
| **Портал** | **20%** | Архитектурная идея правильная. SQL injection, identity spoofing |

**Средняя готовность к production: ~38%**
**Готовность к первому платящему клиенту: ~25%**

---

## 2. КРИТИЧЕСКИЕ БЛОКЕРЫ ПРОДАКШЕНА

> Без исправления этих пунктов запуск НЕВОЗМОЖЕН. Каждый = потенциальная потеря данных, взлом или судебный иск.

| # | Блокер | Модули | Усилия | Критичность |
|---|--------|--------|--------|-------------|
| **B1** | **SQL Injection в PortalDataProxyController** — 7 мест конкатенации user input в SQL | portal | 2ч | НЕМЕДЛЕННО |
| **B2** | **Tenant isolation: 324 entities (53%) без organizationId/@Filter** — зарплаты, контракты, BIM, AI, HR, IoT, email, maintenance, approval, design, calendar, planning, dashboard утекают между организациями | ВСЕ модули | 1-2 недели | НЕМЕДЛЕННО |
| **B3** | **PostgreSQL RLS отсутствует** — native SQL queries (PortalDataProxyController и др.) обходят Hibernate @Filter. Нет 4-го слоя защиты | DB layer | 3 дня | НЕМЕДЛЕННО |
| **B4** | **MinIO без tenant prefix** — файлы хранятся как `{UUID}.ext`, знание UUID = cross-tenant file access | S3 storage | 2ч | НЕМЕДЛЕННО |
| **B5** | **Redis/cache без tenant namespace** — permission cache shared между тенантами, cache poisoning | infra | 2ч | НЕМЕДЛЕННО |
| **B6** | **200+ GET endpoints без @PreAuthorize** — любой auth user видит всё (зарплаты, PII, финансы) | 25+ controllers | 2-3 дня | НЕМЕДЛЕННО |
| **B7** | **Identity spoofing в портале** — portalUserId из query param, можно подменить | portal | 4ч | НЕМЕДЛЕННО |
| **B8** | **Hardcoded credentials в git** — POSTGRES_PASSWORD, JWT_SECRET, MINIO, Chekka API key в docker-compose + application.yml | infra | 2ч | НЕМЕДЛЕННО |
| **B9** | **ddl-auto: update** — Hibernate может изменить схему БД в production | backend config | 30мин | НЕМЕДЛЕННО |
| **B10** | **JWT secret validation = warning-only** — приложение стартует со слабым/дефолтным секретом, все JWT подделываемы | security | 1ч | НЕМЕДЛЕННО |
| **B11** | **CORS allowedHeaders(*) + credentials(true)** — RFC 6454 нарушение, arbitrary header injection | security config | 30мин | НЕМЕДЛЕННО |
| **B12** | **WebSocket /ws/** permitAll** — upgrade без аутентификации, любой может подключиться к STOMP | security config | 2ч | НЕМЕДЛЕННО |
| **B13** | **PII не маскируется в логах** — email, пароли, ИНН, СНИЛС в stdout → нарушение 152-ФЗ | logging | 1 день | НЕМЕДЛЕННО |
| **B14** | **НДС 20% вместо 22%** — VatCalculator, Invoice, Contract, LocalEstimate. Все суммы занижены ~1.6% | finance, estimates, contracts | 4ч | До запуска |
| **B15** | **IDOR в 15+ сервисах** — ContractExt (8 операций), Milestone, Collaborator, BidInvitation, EmploymentContract, AI conversations | contracts, projects, sales, hr, ai | 2-3 дня | До запуска |
| **B16** | **Fake health checks + simulated backups** — оператор не узнает о сбоях, при потере БД = потеря ВСЕХ данных | monitoring | 3 дня | До запуска |
| **B17** | **Global UNIQUE constraints** — 8+ таблиц: Specification.name, M29Document.name, PurchaseRequest.name, WorkOrder.code и др. | 8+ entities | 1 день | До запуска |
| **B18** | **Webhook HMAC optional** — при незаданном YooKassa секрете любой может активировать подписку бесплатно | subscription | 2ч | До запуска |
| **B19** | **ApiRateLimitService in-memory** — ConcurrentHashMap вместо Redis, multi-instance = rate limit bypass (3x) | security | 1 день | До запуска |
| **B20** | **JWT access token 24h** — слишком долгий lifetime, украденный токен действует сутки. Нет key rotation | security | 2ч | До запуска |
| **B21** | **Нет SAST/DAST/dependency scanning в CI** — уязвимости не обнаруживаются автоматически | CI/CD | 1 день | До запуска |
| **B22** | **152-ФЗ модель угроз ИСПДн отсутствует** — обязательный документ для оператора ПДн | compliance | 2 дня (юрист) | До запуска |
| **B23** | **simulateClashDetection() пишет FAKE данные в production DB** | bim | 2ч | До запуска |
| **B24** | **AtomicLong для номеров** — DispatchService.orderSequence и PtoCodeGenerator сбрасываются при рестарте → коллизии | operations, pto | 2ч | До запуска |
| **B25** | **N+1 + in-memory pagination** — BudgetService.getExpenses() загружает ВСЕ в RAM → OOM | finance | 4ч | До запуска |
| **B26** | **5 production-stubs в EstimateAdvancedService** — importLsr, exportEstimate, searchNormativeRates, getComparison, validateForExport | estimates | 1-2 нед | До запуска |

---

## 3. ПОЛНАЯ КАРТА МОДУЛЕЙ

| # | Модуль | Оценка | Статус | P1 | P2 | P3 | Критичные проблемы |
|---|--------|--------|--------|----|----|----|--------------------|
| 1.1 | **Finance** | 6.0 | Partial | 4 | 5 | 9 | НДС 20%, N+1 OOM, CashFlow дубли, BudgetStatus rollback |
| 1.2 | **Estimates + Pricing** | 5.5 | Partial | 5 | 8 | 12 | 5 стабов, НДС, EstimateService no tenant, UUID fallback FK |
| 1.3 | **Closing + RusDocs + ExecDocs** | 5.5 | Partial | 1 | 10 | 10 | КС-2/КС-3 no orgId, execDocs=localStorage, DiadokClient=mock |
| 1.4 | **Contracts** | 6.5 | Partial | 4 | 8 | 8 | ContractExt IDOR (8 ops), SignWizard no save, НДС |
| 1.5 | **Specifications** | 7.0 | Working | 2 | 9 | 11 | name global UNIQUE, listSpecs no tenant. PDF parser лучший |
| 1.6 | **Operations + Site** | 6.0 | Partial | 5 | 8 | 10 | Dispatch/DailyReport/M29 no tenant, AtomicLong, WorkOrderBoard mock |
| 1.7 | **Safety** | 7.0 | Working | 2 | 8 | 5 | hasUpcomingTraining global, countOverdueTrainings=0 always |
| 1.8 | **Quality + Regulatory** | 6.5 | Working | 2 | 7 | 9 | ReportingDeadline no tenant, certificates cross-tenant |
| 1.9 | **Supply (Warehouse+Procurement)** | 6.0 | Partial | 3 | 12 | 12 | Dual PurchaseOrder entity, PurchaseRequest name global UNIQUE |
| 1.10 | **Fleet + IoT** | 6.5 | Partial | 3 | 10 | 8 | IoT 5 tables no org, GPS path mismatch→localStorage, FuelRecord no org |
| 1.11 | **Projects + SiteAssessments** | 5.5 | Partial | 5 | 12 | 16 | 2 IDOR, DB CHECK blocks new types, SiteAssessment edit broken |
| 1.12 | **Dashboard + Analytics** | 6.0 | Partial | 5 | 10 | 13 | 3 entities no tenant, hardcoded 0.85 cost, PredictiveAnalytics=mock |
| 1.13 | **Planning** | 7.5 | Working | 3 | 7 | 8 | EVM/Baseline/Resource no tenant. CPM+EVM enterprise-level |
| 1.14 | **Tasks + Calendar** | 7.0 | Working | 3 | 7 | 8 | CalendarEvent/Schedule no tenant, PROJECT visibility=true always |
| 1.15 | **Processes (RFI/Submittals/Issues)** | 6.0 | Partial | 9 | 21 | 17 | Системный cross-tenant в 5 модулях, IDOR path variable, CO Board mock |
| 1.16 | **Documents + DataExch + 1C** | 6.0 | Partial | 10 | 15 | 12 | CDE 6/7 entities no tenant, DataExchange=no controllers, Diadok=mock |
| 1.17 | **Portal** | 5.0 | Broken | 10 | 16 | 12 | **SQL INJECTION**, identity spoofing, 3 entities no org, admin cross-tenant |
| 1.18 | **BIM** | 5.0 | Broken | 5 | 12 | 11 | 11 entities no org, clashDetection=FAKE, 3 pages→404 |
| 1.19 | **Workflow + Approval** | 6.5 | Partial | 6 | 15 | 11 | ApprovalStep zero ownership, WorkflowDef cross-tenant, 2 конкурирующие системы |
| 1.20 | **Design** | 5.0 | Broken | 5 | 12 | 8 | 3 entities no org, Board=mock, 3/5 pages broken, field mismatch |
| 1.21 | **HR + hrRussian** | 6.5 | Partial | 8 | 14 | 11 | 8 entities no tenant, createContract no orgId, 6 cross-module imports |
| 1.22 | **Leave+Payroll+SelfEmployed+Recruit** | 6.0 | Partial | 7 | 10 | 15 | Tenant isolation 3/4 modules, 28+ GET no auth, IDOR approverId |
| 1.23 | **Sales: CRM+Portfolio+BidMgmt** | 7.0 | Working | 4 | 8 | 12 | Dual BidPackage entity, BidInvitation IDOR, listPackages cross-tenant |
| 1.24 | **Admin + Settings + Subscription** | 7.5 | Working | 3 | 6 | 12 | Health fake, backups simulated, webhook HMAC optional. Лучший модуль |
| 1.25 | **Closeout + Maintenance** | 6.5 | Partial | 5 | 11 | 11 | Maintenance ZERO tenant (5 entities), 6 API path mismatches |
| 1.26 | **Legal+Mail+Messenger+AI+Help** | 7.0 | Working | 2 | 8 | 12 | EmailMessage no tenant, AI IDOR. Legal=эталон, Messenger=enterprise |
| 1.X | **Architecture+Infra+Security** | 6.0 | Partial | 12 | 18 | 14 | 324 entities no tenant, no RLS, MinIO/Redis no tenant ns, JWT weak, CORS, PII in logs |
| 1.UX | **UX навигации** | 3.0 | Broken | — | — | — | 24→10 групп, ~185→~60 пунктов, 6+ дублей, 15+ непонятных названий, нет ролевой фильтрации |

**Средняя оценка: 6.2/10** | **Медиана: 6.25/10** | **Минимум: 5.0** (portal, bim, design) | **Максимум: 7.5** (planning, admin)
**Итого багов: 721** (P1: 129, P2: 290, P3: 295, P4: 7) | **Улучшений: 722** (Must: 153, Should: 394, Nice: 180)

---

## 4. БАГИ (приоритизированные)

### P1 — Critical (129 багов): система ломается или теряет данные

**Кластер 1: Tenant Isolation (324 entities / 53%)** — САМЫЙ МАССОВЫЙ

| Область | Entities без organizationId/@Filter |
|---------|-------------------------------------|
| BIM | BimModel, BimElement, BimClash, BimVersion, BimViewer, DesignPackage, DesignDrawing, DrawingAnnotation, PhotoProgress, PhotoComparison, PhotoAlbum (11) |
| Processes | RFI, Issues, Submittals — list/get/overdue без org filter; ChangeOrderRequest no orgId |
| HR | LeaveType, LeaveRequest, LeaveAllocation, PayrollTemplate, PayrollCalculation, Applicant, JobPosition, Interview, SelfEmployedContractor/Payment/Registry (11) |
| Portal | PortalMessage, PortalProject, PortalDocument (3) |
| Planning | EvmSnapshot, ScheduleBaseline, ResourceAllocation (3) |
| Dashboard | Dashboard, KpiDefinition, SavedReport (3) |
| Documents | DocumentContainer, DocumentRevision, Transmittal, RevisionSet, TransmittalItem, DocumentAuditEntry + 5 PTO entities (11) |
| Operations | DispatchOrder, DailyReport, M29Document (3) |
| Design | DesignVersion, DesignReview, DesignSection (3) |
| Maintenance | MaintenanceRequest, MaintenanceEquipment, PreventiveSchedule, MaintenanceTeam, MaintenanceStage (5) |
| Workflow | WorkflowDefinition CRUD, AutomationExecution, approval chain/step/history (6 service methods) |
| Calendar | CalendarEvent, ConstructionSchedule (2) |
| IoT | IoTDevice + 4 связанных таблицы (5) |
| Other | Collaborator, ReportingDeadline, EmailMessage, AiConversation, QualityCertificate |

**Кластер 2: SQL Injection + Identity**
- **SQL Injection в PortalDataProxyController** — 7 мест строковой конкатенации
- **Identity spoofing** — portalUserId из @RequestParam в 8+ endpoints
- **AI IDOR** — resolveConversation() без userId check

**Кластер 3: IDOR**
- ContractExt — 8 create операций без org check (системный IDOR)
- Milestone — update/delete без tenant check
- Collaborator — entity без org_id
- BidInvitation/BidEvaluation — findById без org filter
- EmploymentContract — findById без org filter
- ApprovalStep — approve/reject без ownership/approver check

**Кластер 4: Данные/Расчёты**
- НДС 20% вместо 22% в VatCalculator, Contract, LocalEstimate, Invoice
- BudgetService NPE на null revenue
- CashFlowEntry дублирование при повторной оплате
- AnalyticsDataService hardcoded 0.85 cost ratio
- PredictiveAnalyticsService DEFECT_WEIGHT copy-paste

**Кластер 5: Production Stubs**
- 5 заглушек EstimateAdvancedService
- simulateClashDetection() пишет FAKE в DB
- computeChecklistMetrics() fabricates данные (IN_PROGRESS=60%, FAILED=20%)
- SafetyRiskScoringService.countOverdueTrainings() = always 0
- TaskParticipantService.hasAccess() PROJECT = always true

**Кластер 6: Инфраструктура и Security Config (сессия 1.X)**
- **PostgreSQL RLS отсутствует** — native SQL обходит Hibernate @Filter
- **MinIO без tenant prefix** — UUID = cross-tenant file access
- **Redis/cache без tenant namespace** — permission cache shared
- **JWT secret validation = warning-only** — слабый секрет в production
- **CORS allowedHeaders(*) + credentials(true)** — arbitrary header injection
- **WebSocket /ws/** permitAll** — upgrade без auth
- **ApiRateLimitService in-memory** — multi-instance = bypass
- **PII не маскируется в логах** — 152-ФЗ нарушение
- Hardcoded credentials + Chekka API key в docker-compose + application.yml
- ddl-auto: update без production override
- HealthCheck 5/6 fake
- BackupService simulated
- AtomicLong sequences (2 места) — коллизии при рестарте
- PortalAuthService — blocked user может получить JWT (timing attack)

### P2 — High (290 багов): функционал не работает как должен

Основные категории:
- **200+ GET endpoints без @PreAuthorize** (safety 15+, quality 20+, warehouse 22+, BIM 32, planning 29, calendar 14+, processes 35+, documents 22+, HR 28+, sales 14+, design 8, workflow 5, legal 7, messenger 10, closeout 10+, maintenance 11)
- **Инфраструктурные (сессия 1.X)**: JWT access token 24h, нет key rotation, CSP unsafe-inline, file upload 5GB без rate limit, нет SAST/DAST, нет dependency scanning, нет log aggregation/structured logging, нет Sentry, нет auto-rollback, backup restore не тестируется, DR plan contacts пустые, нет external uptime monitoring, 152-ФЗ модель угроз отсутствует, Flyway validate-on-migrate: false
- **Frontend↔Backend mismatches** — status enums (10+ модулей), API paths (BIM 10+, closeout 6+, design 5+, fleet GPS)
- **100% mock pages** — WorkOrderBoard, PermitBoard, ChangeOrderBoard, PredictiveAnalytics, DrawingOverlay, DrawingPins, DesignReviewBoard, ContractorRatings, LeaveBoardPage, ApplicantBoardPage, MaintenanceBoardPage, PortalSettings/Branding
- **Stubs** — DiadokClient=mock, PDF/1C export КС-2/КС-3=toast, execDocs=localStorage, sendPriceRequests=log only, M29 export=toast
- **N+1 queries** — BudgetService, InvoiceMatchingEngine, recalculateKs3Totals, enrichLeadPage, getPendingForUser, bulkCalculate и др.
- **HTML5 DnD (mobile broken)** — CommissioningBoard, MaintenanceBoard, DesignReviewBoard (3 остались)

### P3 — Medium (295 багов): работает, но плохо

- God-components: FmPage (880), Ks2DetailPage (1175), SpecificationDetailPage (1241), CalendarPage (797), ApprovalInboxPage (868)
- God-classes: BudgetService (896), ClosingDocumentService (660), CompetitiveListService (558), AnalyticsDataService (1136), MaintenanceService (522), SelfEmployedService (675), ApprovalInstanceService (620)
- 0 тестов в 15+ модулях (closing, operations, BIM, design, workflow, payroll, selfEmployed, maintenance, closeout, legal, mail, messenger, ai, help)
- Cross-module imports (PayrollService 6, CompetitiveListService 7, EstimateService 4)
- Duplicate modules/API files (EDO x2, DailyLog x2, design API x2, maintenance API x2, workflow API x2, BidPackage x2)
- **Инфраструктурные (сессия 1.X)**: N+1 User.roles EAGER, нет PgBouncer, нет нагрузочных тестов, CORS maxAge 1h, нет Let's Encrypt auto-renewal, AlertManager только Telegram, notifications без cleanup, daily_reports без composite index, нет Grafana dashboards, нет status page, нет RUM, SystemStatus раскрывает JVM info, Flyway out-of-order: true, iot_sensor_data не партиционирована

### P4 — Low (7 багов)

- N+1 batch resolution паттерн дублируется
- client.ts auth/redirect logic повторяется
- DataTable CSV export без t()
- Swagger UI exposed by default
- DEBUG logging level в base config
- WorkOrder.code global UNIQUE
- Global UNIQUE constraints (cosmetic severity — tracked as P1 in business context)

---

## 5. IMPROVEMENTS (приоритизированные)

### Must Have (153 улучшений) — без этого не продашь

**Безопасность (TOP priority):**
1. Fix tenant isolation — 324 entities (1-2 недели app-level + 3 дня RLS)
2. Fix SQL injection portal (1 день)
3. PostgreSQL RLS на tenant-scoped таблицы — 4-й слой защиты (3 дня)
4. Tenant prefix в MinIO key path (2 часа)
5. Tenant namespace в Redis/cache ключи (2 часа)
6. @PreAuthorize на 200+ endpoints (3-4 дня)
7. Fix IDOR в 15+ сервисах (3-4 дня)
8. Fix identity spoofing portal (4 часа)
9. Fix НДС 22% глобально (4 часа)
10. Убрать hardcoded credentials + JWT secret throw (2 часа)
11. Fix CORS allowedHeaders → explicit list (30 мин)
12. Реальные health checks + backups (3 дня)
13. Mandatory webhook HMAC (2 часа)
14. SAST/DAST в CI — SonarQube/Semgrep + Trivy (1 день)
15. SSO (SAML 2.0 / OIDC) для enterprise (1-2 недели)
16. 152-ФЗ модель угроз ИСПДн (юрист, 2 дня)
17. PII masking в logback (1 день)

**Интеграции (российский рынок):**
10. Реальная 1С интеграция (3-4 недели)
11. Реальная ЭДО (Diadok REST API) (1-2 недели)
12. ФГИС ЦС индексы Минстроя (1 неделя)

**Печатные формы (юридическая обязанность):**
13. КС-2 / КС-3 PDF по ГОСТ (1 неделя)
14. М-29 PDF (3-5 дней)
15. Т-12 / Т-13 табель (3-5 дней)
16. Т-1...Т-8 кадровые приказы (5 недель)
17. АОСР, акт скрытых работ (3-5 дней)
18. Счёт, счёт-фактура, УПД (3-5 дней)

**UX навигации (сессия 1.UX):**
18. Ролевая фильтрация навигации — прораб видит 5-7 пунктов, не 185
19. Сократить 24 группы → 10, ~185 пунктов → ~60
20. Вынести Портал подрядчика на отдельный URL
21. Удалить 6+ дублирующих пунктов
22. Переименовать 10+ непонятных названий (RFI, Сабмиталы, CDE, Quality Gates)
23. Мессенджер/Почта/Согласования → кнопки в хедере с badge

**Конкурентные Must Steal (из COMPETITORS.md):**
24. AI Agent Builder (no-code) — как Procore
25. Photo AI / Computer Vision для фото стройки
26. OCR распознавание счетов/УПД — как PUSK.APP
27. Free Tier (3-5 юзеров) — как Fieldwire/MacroERP
28. Предиктивная аналитика — как Pragmacore
29. AI-ассистент для российского строительного права

**Функционал:**
30. Реализовать 5 стабов EstimateAdvancedService (1-2 недели)
20. ExecDocs backend (5 entities + CRUD) (1 неделя)
21. Визуальный редактор workflow (2-3 недели)
22. Портал подрядчика с реальной авторизацией (2-3 недели)
23. Fix 6+ closeout API path mismatches (2 дня)
24. МРОТ валидация в payroll (2 часа)
25. Налоговые вычеты НК РФ (1 неделя)
26. Районный коэффициент + северная надбавка (2 дня)

### Should Have (394 улучшения) — конкурентное преимущество

**Архитектура + Инфраструктура (сессия 1.X):**
- JWT access token → 15-30 мин + key rotation (2 дня)
- WebSocket аутентификация при upgrade (1 день)
- Structured JSON logging (logstash-logback-encoder) (1 день)
- Log aggregation — Loki + Grafana или ELK (2 дня)
- Sentry error tracking (frontend + backend) (1 день)
- Auto-rollback при failed health check (1 день)
- Automated backup restore testing (1 день)
- External uptime monitoring (1 час)
- Status page (status.privod.ru) (1 день)
- ApiRateLimitService → Redis distributed (1 день)
- Composite DB indexes (daily_reports, tasks) (1 час)
- Notifications cleanup TTL 90d (2 часа)
- Flyway validate-on-migrate: true (30 мин)
- Dependency scanning (Dependabot/Snyk) (1 час)
- File upload rate limiting + max 500MB (1 час)

**UX навигации (сессия 1.UX):**
- Проектно-центричная навигация (как Procore)
- Cmd+K/Ctrl+K поиск по всем разделам
- Финансы 29→7, Кадры 28→7, Качество 27→7+5, Снабжение 27→6, Документы 20→7
- «Избранное/закреплённые» — пользователь сам выбирает топ-5
- Один раздел «Аналитика» вместо 12+ дашбордов

**Конкурентные Should Steal:**
- Нативное мобильное приложение (React Native) — не только PWA
- 360° фото на планах (PlanRadar/OpenSpace)
- Plan-centric дефект-трекинг (PlanRadar)
- Кросс-проектный скоринг подрядчиков (Fieldwire)
- Unalterable audit trail (Aconex)
- AI классификация материалов (Pragmacore)
- BIM viewer 1ГБ+ федеративный (Fieldwire/Aconex)
- Клиентский портал с AI-обновлениями (Buildertrend)
- AI генерация submittals из спецификаций (Fieldwire)
- Selections management (Buildertrend)

**Архитектура (прежние):**
- Secrets management (Vault / AWS SM) (1 неделя)
- Декомпозиция 7 god-classes (1-2 недели)
- Декомпозиция 5 god-components (1 неделя)
- Объединение дублирующих модулей (EDO, BidPackage, DailyLog, dispatch) (1 неделя)
- Объединение 2 систем согласования (approval + workflowEngine) (1 неделя)

**Тестирование:**
- Unit тесты для критичных расчётов: PayrollService, LSR-парсер, EVM (2 недели)
- Integration тесты для 15+ модулей без тестов (3-4 недели)
- E2E тесты финансовой цепочки (1 неделя)

**UX:**
- Подключить 12+ mock Board pages к API (1-2 недели)
- Migrate 3 оставшихся HTML5 DnD на @dnd-kit (2 дня)
- Loading states, error boundaries, empty states (1-2 недели)
- Серверная пагинация (убрать size: 200/500) (3-5 дней)

**Финансы:**
- Авансы и их зачёт (1 неделя)
- Гарантийные/штрафные удержания (1 неделя)
- Change Order → авто-пересчёт бюджета (3-5 дней)
- Multi-level budget approval workflow (3-5 дней)

**Планирование:**
- Gantt drag/WBS CRUD UI (1-2 недели)
- S-Curve визуализация EVM (3-5 дней)
- MS Project / Primavera import (MPXJ) (1-2 недели)

### Nice to Have (180 улучшений) — полировка

- **UX навигации**: персональный дашборд «Мой день», мобильная навигация (5 пунктов bottom tab), отчёт для заказчика «в 1 клик», виджет погоды
- **Конкурентные Nice to Steal**: Takeoff из планов, AI предсказание инцидентов, генеративное планирование (ALICE), email-маркетинг, Facility Management
- **Инфраструктура (сессия 1.X)**: PgBouncer, Grafana dashboards, RUM, Blue-green deployments, Let's Encrypt, HashiCorp Vault, Kubernetes HA, Terraform IaC, k6/Gatling load tests, iot_sensor_data partitioning, CSP nonce-based
- Cmd+K global search
- 4D/5D BIM
- AI Agent Builder
- Predictive maintenance (ML)
- Calendar sync (Google/Outlook)
- No-code workflow canvas (react-flow)
- Мониторинг госзакупок (ЕИС API)
- Offline sync для полевых операций
- QR-коды для складского учёта
- 360° фото viewer

---

## 6. GAPS vs GOLD STANDARD

### Полностью отсутствует (из 16 направлений эталона)

| # | Функция Gold Standard | Статус в PRIVOD |
|---|----------------------|-----------------|
| 1 | **1С двусторонняя синхронизация** | OData/SOAP клиенты есть, export = stubs |
| 2 | **ЭДО (Diadok/СБИС)** | DiadokClient = 100% mock |
| 3 | **КЭП подписание** | CryptoPro JCP = не интегрирован |
| 4 | **Печатные формы по ГОСТ** | 0 из 15+ обязательных форм (КС-2, М-29, Т-12, ТОРГ-12...) |
| 5 | **SCIM авто-провизионинг** | Не реализован |
| 6 | **Нагрузочные тесты** | Не проводились |
| 7 | **SAST/DAST в CI** | Отсутствует |
| 8 | **Real IFC clash detection** | simulateClashDetection = FAKE random данные |
| 9 | **RLS на уровне PostgreSQL** | Только application-level @Filter (53% entities пропущены) |
| 10 | **Secrets management** | Credentials hardcoded в docker-compose + application.yml |
| 11 | **Status page** | Отсутствует |
| 12 | **Нагрузочное тестирование + autoscaling** | Не проводились / не настроено |
| 13 | **Structured logging + log aggregation** | Plain text stdout, нет ELK/Loki |
| 14 | **Error tracking (Sentry)** | Отсутствует |
| 15 | **External uptime monitoring** | Отсутствует |
| 16 | **PII masking в логах** | Не реализовано (152-ФЗ violation) |
| 17 | **Dependency vulnerability scanning** | Нет Dependabot/Snyk в CI |
| 18 | **Ролевая фильтрация навигации** | Все роли видят 185 пунктов |
| 19 | **AI Agent Builder** | Нет (Procore: no-code AI агенты) |
| 20 | **Photo AI / Computer Vision** | Mock (40%) |
| 21 | **OCR счетов/УПД** | Нет (PUSK.APP: production) |
| 22 | **Free Tier** | Нет (Fieldwire: $0) |

### Есть, но неполноценно

| # | Функция | Что есть | Что не работает |
|---|---------|----------|-----------------|
| 1 | **Multi-tenancy** | @Filter + TenantFilterInterceptor + service validation (admin) | 324 entities (53%) без org_id. Нет RLS. MinIO/Redis без tenant namespace |
| 2 | **Портал заказчика** | 20 frontend + 108 backend файлов | SQL injection, identity spoofing, 5 unrouted pages |
| 3 | **BIM** | IFC.js viewer, clash detection UI, overlay canvas | 11 entities no tenant, fake detection, 3 pages→404 |
| 4 | **Workflow Engine** | 2 системы: approval chains + workflow instances | Нет ownership check, cross-tenant, 0 тестов |
| 5 | **EVM** | CPM + CPI/SPI + baselines + forecasting | No tenant isolation, Gantt read-only, S-curve = mock |
| 6 | **Сметы** | ЛСР parser, ARPS import, LocalEstimate | 5 стабов, ГЭСН= hardcoded 3, нет коэффициентов |
| 7 | **HR/Payroll** | НДФЛ 5 ступеней, ОПС порог, ст.152/153/154 ТК РФ | 0 печатных форм, 8 entities no tenant, PIECEWORK=stub |
| 8 | **CRM** | Stage machine, Go/No-Go scorecard (15 критериев) | Dual BidPackage, ContractorRatings=mock |
| 9 | **AI** | Multi-provider (OpenAI+GigaChat+YandexGPT) | Photo analysis=mock, risk prediction=mock, IDOR |
| 10 | **Offline** | PWA + IndexedDB + sync queue | Нет conflict resolution, нет для DailyReport/Defect |
| 11 | **Мониторинг** | Prometheus + Grafana + alerts config | 5/6 health checks fake, backup simulated |
| 12 | **Биллинг** | YooKassa + plan tiers + trial | Webhook HMAC optional, no dunning, no prorated |

### Уже на уровне эталона или лучше

| # | Функция | Оценка | Преимущество |
|---|---------|--------|-------------|
| 1 | **Admin 3-layer tenant isolation** | 9/10 | Hibernate @Filter + TenantFilterInterceptor + service validation — reference implementation |
| 2 | **StroynadzorPackage** | 9/10 | BFS WBS traversal, 5-source aggregation, TOC+missing report — уникально |
| 3 | **CPM + Task Dependencies** | 8.5/10 | 4 dep types (FS/FF/SS/SF) + lags + CPM — лучше Procore (FS only) |
| 4 | **PayrollService НДФЛ** | 8/10 | 5-ступенчатый НДФЛ + ОПС порог ФЗ-178 + ст.152/153/154 ТК РФ |
| 5 | **Specification PDF Parser** | 8/10 | 6 парсеров (ПД, СПДС, Siemens, ABB, Schneider, generic) |
| 6 | **Legal Module** | 8/10 | Полный lifecycle (кейсы→решения→замечания→шаблоны→дашборд). Нет у Procore |
| 7 | **DaData/Checko risk scoring** | 8/10 | ИНН→ЕГРЮЛ, финансовые показатели, arbitration, scoring |
| 8 | **S3+Tika storage** | 8.5/10 | MinIO + auto-detection type + preview + versioning |
| 9 | **МДС 81-3.2001 калькулятор** | 8.5/10 | Маш.-час + Own vs Rent NPV сравнение |
| 10 | **Messenger** | 7.5/10 | Channels + threads + reactions + WebRTC calls |
| 11 | **i18n** | 8/10 | 25k+ строк, ru+en, type-safe match, lazy loading |
| 12 | **CRM Stage Machine** | 8/10 | Sequential stages + Go/No-Go scorecard (15 критериев) + Leveling Matrix |

---

## 7. КОНКУРЕНТНАЯ ПОЗИЦИЯ

> Полный анализ: `COMPETITORS.md` — 13 конкурентов (6 РФ + 7 мир), 881 строка.
> Рынок ПО для строительства в России: **6.4 млрд ₽** (2025), прогноз **>8 млрд ₽** к 2027.
> Национальный стандарт AI для строительства обязателен с **1 апреля 2026**.

### Российские конкуренты

| Конкурент | Фокус | Цена | Сильные стороны | Слабости |
|-----------|-------|------|-----------------|----------|
| **PUSK.APP** | Снабжение | 15-49.5K ₽/мес | OCR счетов (AI), чат при заявке, 1С XML | Только снабжение, нет смет/КС-2/EVM |
| **Pragmacore** | AI-аналитика | ~0.5% от бюджета проекта | Predictive AI, 150+ клиентов, Минстрой | Непрозрачные цены, 7-дневное внедрение |
| **БИТ.СТРОИТЕЛЬСТВО** | Полный цикл (на 1С) | Инд. | КС-2/М-29 печать, 1С native | UX 1990-х, требует лицензий 1С |
| **MacroERP** | Для застройщиков | От 0 ₽ | Free tier, быстрый старт | Только застройщики, поддержка 10-12 мес |
| **1С:ERP УСО** | Full ERP | $5-20M внедрение | Полная функциональность | Рейтинг 2.1/5, UX из 1990-х |
| **ЦУС** | BIM+IoT+аналитика | Enterprise | Госпроекты, геоданные | Дорого, сложно |

### Мировые конкуренты

| Конкурент | Цена | Сильные стороны | Слабости для РФ |
|-----------|------|-----------------|-----------------|
| **Procore** | $375+/user/мес | AI Agent Builder, Photo AI, SOC 2 | Нет КС-2, НДС, ГЭСН, 152-ФЗ. Дорого |
| **PlanRadar** | €26+/user/мес | 360° фото на планах, 100K+ проектов | Только дефект-трекинг, нет финансов |
| **Fieldwire** | $0-$54/user/мес | Free tier, offline-first, BIM 1ГБ+ | Нет финансов, нет российской специфики |
| **Buildertrend** | $99+/мес | Selections, клиентский портал | Для residential, не commercial/infra |
| **Oracle Primavera** | $$$ | CPM/EVM enterprise, AI Safety | Дорого, сложно, нет российских форм |
| **Autodesk Build** | $85/user/мес | Native BIM, real clash detection | Нет КС-2, 1С, НДС |
| **Aconex** | Enterprise | Unalterable audit trail | Документооборот only |

### Где мы лучше конкурентов

| Функция | PRIVOD | Лучший конкурент |
|---------|--------|-----------------|
| **Российская специфика** | ГЭСН/ФЕР/ТЕР, КС-2, М-29, НДФЛ, СОУТ, МДС 81-3 | БИТ (на 1С), 1С:ERP УСО |
| **Модулей** | 26 групп (~200 страниц) | Procore ~15, PlanRadar ~8 |
| **CPM dep types** | 4 (FS/FF/SS/SF) | Procore: 1 (FS only) |
| **Portfolio Health** | 7-dim RAG matrix | Procore: 5-6 dim |
| **Change Mgmt** | 4-level (CO→CE→COR→PCI) | Procore: 1-level |
| **Legal Module** | Полный lifecycle | Ни у кого нет |
| **Payroll** | НДФЛ 5-ступенчатый + ОПС | Ни у кого (строительные ERP) |
| **Leveling Matrix КЛ** | Визуальное сравнение предложений | Ни у кого |
| **StroynadzorPackage** | BFS + 5-source aggregation (9/10) | Ни у кого |
| **Цена** | Freemium (планируется) | Fieldwire $0, Procore $375+/user |

### Где мы хуже конкурентов

| Функция | PRIVOD | Конкуренты лучше |
|---------|--------|-----------------|
| **Production readiness** | 38% | Procore: 99%, PlanRadar: 95% |
| **AI** | 40% mock (photo/risk) | Procore: Agent Builder + Photo AI + Copilot |
| **OCR** | Нет | PUSK.APP: AI OCR счетов/УПД |
| **Мобильное приложение** | PWA (базовое) | Procore/PlanRadar/PUSK: нативные iOS/Android |
| **1С интеграция** | Заглушка | БИТ: native 1С, PUSK: 1С XML |
| **Печатные формы** | 0 | БИТ/1С: полный набор по ГОСТ |
| **BIM** | Fake clash detection | Autodesk: real BIM360 clash |
| **Безопасность** | 324 entity leaks, no RLS | Procore: SOC 2, pentest annually |
| **360° фото** | Нет | PlanRadar/OpenSpace: 360° на планах |
| **Gantt** | Read-only | Primavera: full interactive |
| **Predictive AI** | 100% mock frontend | Pragmacore: 150+ клиентов с реальным AI |

### ТОП-20 фич конкурентов, которых нет у PRIVOD (из COMPETITORS.md)

**Must Steal (7):**
1. AI Agent Builder (no-code) — Procore
2. Photo AI / Computer Vision — Procore, PlanRadar, Buildots
3. OCR распознавание счетов/УПД — PUSK.APP
4. Бесплатный тариф (Free Tier) — Fieldwire, MacroERP
5. Нативное мобильное приложение — PUSK, БИТ, Procore
6. 360° фотодокументация на планах — PlanRadar, OpenSpace
7. AI предиктивная аналитика — Pragmacore, Procore Insights

**Should Steal (8):** Plan-centric дефект-трекинг, Selections management, кросс-проектный анализ паттернов, Unalterable audit trail, AI классификация материалов, BIM viewer 1ГБ+, клиентский портал с обновлениями, AI генерация submittals

**Nice to Steal (5):** Takeoff из планов, AI предсказание инцидентов, генеративное планирование (ALICE), email-маркетинг, Facility Management

### 5 возможностей для уникального преимущества

1. **"Единственная полная российская цепочка Смета→КЛ→ФМ→КП→КС-2→КС-3→1С"** — ни один конкурент не покрывает весь цикл в одной системе
2. **"AI-ассистент, который понимает российское строительное право"** — ГОСТ, СП, СНиП, ФЗ, НК РФ. Procore Copilot не знает КС-2 и НДС
3. **"Scoring подрядчиков на основе реальных данных проектов"** — score = f(сроки, качество, цены, КС-2, претензии)
4. **"Document Chain Intelligence"** — AI валидация полноты цепочки документов (Спец→КЛ→ФМ→КП→Договор→КС-2→КС-3)
5. **"Enterprise для всех за цену SaaS"** — CPM+EVM+BIM+AI за freemium, когда Procore стоит $375/user

### Позиционирование (слоган)

> **"PRIVOD — единственная строительная ERP, которая говорит на языке российской стройки и думает как Procore"**

---

## 8. РЕКОМЕНДОВАННЫЙ ПОРЯДОК РАБОТЫ (ТОП-30 задач)

> Принцип: сначала безопасность, потом core функционал, потом UX.
> Без безопасности нельзя продавать. Без core функционала нечего демонстрировать.

### Спринт 0: НЕМЕДЛЕННО (2-3 дня) — БЛОКЕРЫ БЕЗОПАСНОСТИ

| # | Задача | Усилия | Почему первая |
|---|--------|--------|---------------|
| 1 | **Fix SQL Injection в PortalDataProxyController** — заменить конкатенацию на JdbcTemplate параметры | 1 день | Можно украсть ВСЕ данные ВСЕХ тенантов |
| 2 | **Fix identity spoofing** — portalUserId из JWT claims вместо @RequestParam | 4ч | Можно действовать от имени любого пользователя |
| 3 | **Fix hardcoded credentials** — docker-compose + application.yml → env vars, убрать Chekka API key | 2ч | При публикации репо — полный доступ к production |
| 4 | **Fix ddl-auto** — application-prod.yml: `ddl-auto: validate` | 30мин | Hibernate может DROP TABLE в production |
| 5 | **Fix JWT secret** — throw exception если слабый/дефолтный секрет в prod | 1ч | Все JWT подделываемы |
| 6 | **Fix CORS** — allowedHeaders → explicit list (Content-Type, Authorization, Accept) | 30мин | Arbitrary header injection |
| 7 | **Fix WebSocket auth** — /ws/** require authentication при upgrade | 2ч | Любой может подключиться к STOMP |
| 8 | **Fix webhook HMAC** — mandatory exception если YOOKASSA_WEBHOOK_SECRET не задан | 2ч | Бесплатная активация любой подписки |

### Спринт 1: TENANT ISOLATION (2-3 недели) — СИСТЕМНЫЙ FIX

| # | Задача | Усилия | Почему |
|---|--------|--------|--------|
| 9 | **Шаблонный fix tenant isolation** — Flyway ADD organization_id + INDEX + @Filter + SecurityUtils для 324 entities | 1-2 нед | Без этого данные тенантов утекают. №1 блокер SaaS |
| 10 | **PostgreSQL RLS** — CREATE POLICY на tenant-scoped таблицы | 3 дня | Native SQL обходит Hibernate @Filter |
| 11 | **MinIO tenant prefix** — `{organizationId}/{UUID}.ext` | 2ч | UUID файла = cross-tenant доступ |
| 12 | **Redis tenant namespace** — `{cacheName}:{orgId}:{key}` | 2ч | Shared permission cache |
| 13 | **@PreAuthorize на 200+ GET endpoints** — минимум isAuthenticated(), лучше role-based | 3-4 дня | VIEWER видит зарплаты, финансы, PII |
| 14 | **Fix IDOR в 15+ сервисах** — ownership check через org + user verification | 3-4 дня | Любой user может approve/delete чужие данные |
| 15 | **Fix Global UNIQUE → UNIQUE(org_id, name)** — 8+ таблиц | 1 день | Тенант B заблокирован если тенант A использовал номер |
| 16 | **PII masking в logback** — regex replacement для email, password, ИНН, СНИЛС | 1 день | 152-ФЗ нарушение |
| 17 | **SAST/DAST + dependency scanning в CI** — Semgrep + Trivy + Dependabot | 1 день | Уязвимости не обнаруживаются |
| 18 | **Fix AtomicLong → DB sequence** — DispatchService, PtoCodeGenerator | 2ч | Коллизии номеров при рестарте |

### Спринт 2: CORE ФИНАНСЫ (1-2 недели) — без этого не демо

| # | Задача | Усилия | Почему |
|---|--------|--------|--------|
| 19 | **Fix НДС 22%** — VatCalculator, Contract, Invoice, LocalEstimate, FmPage | 4ч | ВСЕ суммы занижены на ~1.6% |
| 20 | **Fix BudgetService N+1 + in-memory pagination** → SQL batch + DB pagination | 4ч | OOM при реальных данных |
| 21 | **Fix CashFlowEntry idempotency** — unique constraint invoice_id + status | 2ч | Дублирование финансовых записей |
| 22 | **Реализовать 5 стабов EstimateAdvancedService** | 1-2 нед | Сметный модуль — ядро для строительства |
| 23 | **Fix hardcoded 0.85 в AnalyticsDataService** — реальный SUM(actual_cost) | 4ч | Dashboard показывает фейковую маржу |
| 24 | **ApiRateLimitService → Redis** — distributed counters вместо ConcurrentHashMap | 1 день | Multi-instance = rate limit bypass |

### Спринт 3: ПЕЧАТНЫЕ ФОРМЫ (2-3 недели) — юридическая обязанность

| # | Задача | Усилия | Почему |
|---|--------|--------|--------|
| 25 | **КС-2 / КС-3 PDF** — iText/OpenPDF по ГОСТ (Постановление Госкомстата №1) | 1 нед | Обязательный документ при любой стройке |
| 26 | **М-29 PDF** — отчёт о расходе материалов | 3-5 дн | Нормативное требование |
| 27 | **Счёт / Счёт-фактура / УПД** | 3-5 дн | Без этого нельзя выставить клиенту документ |
| 28 | **Т-12/Т-13 табель** — учёт рабочего времени | 3-5 дн | Обязательная HR форма |
| 29 | **АОСР** — акт скрытых работ | 3-5 дн | Обязательная исполнительная документация |

### Спринт 4: ИНТЕГРАЦИИ + ИНФРА (3-4 недели) — конкурентная необходимость

| # | Задача | Усилия | Почему |
|---|--------|--------|--------|
| 30 | **1С интеграция** — OData/SOAP клиенты УЖЕ ЕСТЬ, нужно подключить export | 3-4 нед | Без 1С российский клиент не купит |
| 31 | **Diadok ЭДО** — реальный REST API вместо mock | 1-2 нед | ЭДО = обязательно для B2B |
| 32 | **Реальные health checks** — Redis ping, MinIO exists, WebSocket check | 1 день | Оператор должен видеть реальное состояние |
| 33 | **Реальные backups** — pg_dump через ProcessBuilder | 2 дня | Без backup = гарантированная потеря данных |
| 34 | **ExecDocs backend** — 5 entities (АОСР, КС-6, Welding, IncomingControl, SpecialJournal) | 1 нед | Исполнительная документация = core для стройки |
| 35 | **Structured JSON logging + Sentry** — logstash-logback-encoder + error tracking | 2 дня | Невозможно расследовать инциденты |
| 36 | **152-ФЗ модель угроз + назначение ответственного** | 3 дня (юрист) | Обязательные документы оператора ПДн |

### Спринт 5: UX + ТЕСТЫ (2-3 недели) — качество

| # | Задача | Усилия | Почему |
|---|--------|--------|--------|
| 37 | **Подключить 12+ mock Board pages к API** | 1-2 нед | Клиент увидит пустые страницы |
| 38 | **Fix 3 оставшихся HTML5 DnD → @dnd-kit** | 2 дня | Мобильные пользователи не могут использовать Kanban |
| 39 | **Unit тесты для PayrollService** — НДФЛ, ОПС, overtime, night | 2 дня | Ошибки в зарплате = судебные иски |
| 40 | **Unit тесты для LSR-парсера** — минимум 10 кейсов | 1 день | Импорт смет — критичная точка входа данных |
| 41 | **E2E тест финансовой цепочки** — Бюджет → ЛСР → КП → Счёт → Оплата | 3 дня | Подтверждение что core workflow работает end-to-end |
| 42 | **JWT access token → 15-30 мин + key rotation** | 2 дня | Украденный токен действует 24ч |

---

### Оценка трудозатрат

| Спринт | Описание | Оценка |
|--------|----------|--------|
| Спринт 0 | Security blockers | 1-2 дня |
| Спринт 1 | Tenant isolation | 3-4 недели |
| Спринт 2 | Core финансы | 1-2 недели |
| Спринт 3 | Печатные формы | 2-3 недели |
| Спринт 4 | Интеграции + инфра | 3-4 недели |
| Спринт 5 | UX + тесты | 2-3 недели |
| **ИТОГО до MVP** | | **~12-16 недель (3-4 месяца)** |

### До первого платящего клиента (дополнительно)

- 1С интеграция полная (4-6 недель)
- 10+ печатных форм (4-6 недель)
- E2E тесты (2-3 недели)
- Нагрузочное тестирование (1-2 недели)
- SSO для enterprise (1-2 недели)
- Marketing site + demo environment (2-3 недели)

**Итого до коммерческого запуска: ~6-8 месяцев** при полной загрузке 2-3 разработчиков.

---

## ЗАКЛЮЧЕНИЕ

PRIVOD — это проект с **впечатляющим масштабом и правильными архитектурными решениями**, но с **системными проблемами безопасности**, которые делают production-запуск невозможным в текущем состоянии.

**Три факта:**
1. **Масштаб уникален** — 26 модулей, 200 страниц, российская специфика. Ни у одного конкурента нет такого охвата для российского рынка.
2. **Безопасность критична** — SQL injection + 324 entity tenant leaks + no RLS + MinIO/Redis shared + 200 unprotected endpoints. Это не "можно потом", это "нельзя запускать".
3. **Путь к коммерческому продукту реален** — 3-4 месяца интенсивной работы до secure MVP, 6-8 месяцев до первого платящего клиента.

**Рекомендация**: немедленно начать со Спринта 0 (security blockers) и Спринта 1 (tenant isolation). Параллельно работать над печатными формами и 1С интеграцией. НЕ добавлять новые фичи пока не закрыты блокеры безопасности.

---

*Отчёт подготовлен по результатам глубокого аудита 26 модулей + архитектуры + UX-навигации + конкурентного анализа 13 компаний. Все находки задокументированы в файлах `phase1-audit/1.0-1.26` + `1.X-architecture.md` + `1.UX-navigation.md`, `BUGS.md` (721 баг), `IMPROVEMENTS.md` (722 улучшения), `COMPETITORS.md` (881 строка, 13 конкурентов).*
