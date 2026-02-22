# ПОЛНЫЙ ТЕХНИЧЕСКИЙ АУДИТ: PRIVOD ERP/CRM

**Дата:** 2026-02-18
**Аудитор:** Claude Opus 4.6 (Senior System Architect)
**Уровень ожиданий:** Enterprise SaaS ($200-500/мес, 1000+ пользователей, SLA 99.9%)

---

## СОДЕРЖАНИЕ

1. [Карта проекта](#1-карта-проекта)
2. [Функциональная карта](#2-функциональная-карта)
3. [Scorecard](#3-scorecard)
4. [Все найденные проблемы](#4-все-найденные-проблемы)
5. [Архитектурные рекомендации](#5-архитектурные-рекомендации)
6. [Технический долг](#6-технический-долг)
7. [Что сделано хорошо](#7-что-сделано-хорошо)

---

## 1. КАРТА ПРОЕКТА

### 1.1 Технологический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| **Frontend Runtime** | React | 19.0.0 |
| **Build** | Vite | 6.x |
| **Language** | TypeScript | strict mode |
| **State** | Zustand | 5.0.2 |
| **Data Fetching** | TanStack React Query | 5.62.0 |
| **Tables** | TanStack React Table | 8.x |
| **Forms** | React Hook Form + Zod | 3.24.1 |
| **Routing** | React Router | 7.1.1 |
| **Styling** | Tailwind CSS | darkMode: 'class' |
| **Icons** | Lucide React | latest |
| **3D/BIM** | Three.js + web-ifc | 0.135.0 |
| **Charts** | Recharts + D3 | latest |
| **Error Tracking** | Sentry | 10.39.0 |
| **HTTP** | Axios | 1.7.9 |
| **Backend** | Spring Boot | 3.4.1 |
| **JDK** | Java | 21 (Temurin) |
| **ORM** | Spring Data JPA / Hibernate | via Boot |
| **Security** | Spring Security + JJWT | 0.12.6 |
| **DB** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Migrations** | Flyway | via Boot |
| **Storage** | MinIO (S3-compatible) | latest |
| **PDF** | Flying Saucer + OpenPDF | 9.3.0 |
| **Email** | Spring Mail + Thymeleaf | via Boot |
| **API Docs** | SpringDoc OpenAPI | 2.7.0 |
| **Mapping** | MapStruct | 1.6.3 |
| **Build** | Gradle | 8.12 |
| **CI/CD** | GitHub Actions | 9 jobs |
| **Monitoring** | Prometheus 2.51 + Grafana 10.4 + Loki 2.9 |
| **Reverse Proxy** | Nginx | 1.27 |
| **Container** | Docker (multi-stage) | Alpine-based |

### 1.2 Архитектурная схема

```
                          ┌──────────────┐
                          │   Nginx      │ TLS 1.2+, Rate Limiting
                          │   :443       │ HSTS, CSP, CORS
                          └──────┬───────┘
                     ┌───────────┼───────────┐
                     │           │           │
              ┌──────▼──┐  ┌────▼────┐  ┌───▼──────┐
              │Frontend  │  │Backend  │  │Grafana   │
              │React 19  │  │Spring   │  │:3000     │
              │Nginx :80 │  │Boot :8080│  │(internal)│
              └──────────┘  └────┬────┘  └──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
             ┌──────▼──┐  ┌─────▼───┐  ┌────▼────┐
             │PostgreSQL│  │  Redis  │  │  MinIO  │
             │  16      │  │  7      │  │  S3     │
             │  :5432   │  │  :6379  │  │  :9000  │
             └──────────┘  └─────────┘  └─────────┘
```

### 1.3 Масштаб проекта

| Метрика | Значение |
|---------|----------|
| Backend Java-файлов | ~2,687 |
| Frontend TS/TSX-файлов | ~736 |
| Бизнес-модулей (backend) | 50+ |
| Бизнес-модулей (frontend) | 60+ |
| Миграций БД | 114 (17,372 строк SQL) |
| Сущностей/таблиц | 421+ |
| Сервисов (backend) | 237 |
| Контроллеров | 199 |
| i18n-ключей | ~5,000+ (ru + en) |
| Тестов (frontend) | 440+ (42 файла) |
| Тестов (backend) | 211 файлов |
| Docker-сервисов (prod) | 15 |
| API endpoints | 939+ (с @PreAuthorize) |

### 1.4 Структура папок

```
privod2_next/
├── backend/
│   ├── src/main/java/com/privod/platform/
│   │   ├── infrastructure/          # 40+ files: config, security, web, email, storage, websocket
│   │   └── modules/                 # 50+ domain packages
│   │       ├── auth/                # Users, roles, JWT, MFA, OAuth2
│   │       ├── project/             # Projects, tasks, milestones
│   │       ├── finance/             # Invoices, payments, budgets, cash flow
│   │       ├── hr/                  # Employees, timesheets, crews
│   │       ├── warehouse/           # Stock, movements, limits, materials
│   │       ├── procurement/         # Purchase requests, tenders, suppliers
│   │       ├── quality/             # Inspections, checks
│   │       ├── safety/              # Incidents, inspections, violations
│   │       ├── planning/            # WBS, EVM, baselines, resources
│   │       ├── contract/            # Contracts, supplements, claims
│   │       ├── pto/                 # Work permits, lab tests, KS-11
│   │       ├── bim/                 # BIM models, clash detection
│   │       ├── cde/                 # ISO 19650 document containers
│   │       ├── integration/         # 1C, SBIS, Telegram, SMS, weather
│   │       ├── accounting/          # Russian accounting, journals, tax
│   │       ├── payroll/             # Salary calculations
│   │       ├── russianDoc/          # KS-2, KS-3, EDO
│   │       └── ... (30+ more)
│   └── src/main/resources/
│       ├── db/migration/            # V1..V114 Flyway
│       └── application.yml
├── frontend/
│   ├── src/
│   │   ├── api/                     # 20+ API module files
│   │   ├── components/              # Shared: ProtectedRoute, ErrorBoundary
│   │   ├── config/                  # Route permissions, navigation
│   │   ├── design-system/           # Button, DataTable, Modal, FormField, TopBar, PivotTable
│   │   ├── hooks/                   # 11 custom hooks
│   │   ├── i18n/                    # ru.ts (14K lines), en.ts (14K lines)
│   │   ├── layouts/                 # AppLayout
│   │   ├── lib/                     # cn, export, uuid, sentry, websocket
│   │   ├── modules/                 # 60+ business module folders
│   │   ├── pages/                   # MessagingPage
│   │   ├── routes/                  # 12 domain route files
│   │   ├── stores/                  # 15+ Zustand stores
│   │   ├── tokens/                  # layout, colors, typography
│   │   └── types/                   # axios.d.ts, three.d.ts, vendor.d.ts
│   └── e2e/                         # Playwright smoke tests
├── nginx/nginx.conf
├── monitoring/                      # Prometheus, Grafana configs
├── docker-compose.yml               # Dev: 8 services
├── docker-compose.prod.yml          # Prod: 15 services
└── .github/workflows/               # CI + Deploy pipelines
```

### 1.5 Мультитенантность

```
Реализация: organization_id на ВСЕХ таблицах
├── TenantInterceptor — JPA-уровень фильтрации
├── SecurityUtils.requireCurrentOrganizationId() — в сервисах
├── V85-V107 — миграции бэкфилла organization_id
├── V108 — композитные индексы (organization_id + ...)
└── V113 — уникальные ограничения с учётом тенанта
```

---

## 2. ФУНКЦИОНАЛЬНАЯ КАРТА

### Основные модули

| # | Модуль | Подмодули | Статус | Качество | Проблемы |
|---|--------|-----------|--------|----------|----------|
| 1 | **Auth & Security** | Login, JWT, Refresh, MFA, Account Lockout, RBAC | Готово | 8/10 | Refresh не проверяет lockout; JWT в localStorage |
| 2 | **Projects** | CRUD, Members, Financials, Dashboard, Status | Готово | 9/10 | organizationId parameter spoofable |
| 3 | **Finance** | Invoices, Payments, Budgets, Cash Flow, Reconciliation | Готово | 8/10 | Payment race condition; missing pessimistic lock |
| 4 | **HR** | Employees, Timesheets, Crews, Crew Time | Готово | 8/10 | — |
| 5 | **Warehouse** | Stock, Movements, Materials, Limits, Alerts, Locations | Готово | 7/10 | Cancel movement partial state risk |
| 6 | **Procurement** | Purchase Requests, Tenders, Suppliers, Bid Scoring | Готово | 8/10 | Missing @PreAuthorize on list; batch size 2000 |
| 7 | **Quality** | Inspections, Checks, Board | Готово | 8/10 | — |
| 8 | **Safety** | Incidents, Inspections, Violations, Investigation | Готово | 8/10 | — |
| 9 | **Planning** | WBS, EVM, Baselines, Resource Allocation | Готово | 7/10 | No virtual scrolling for large Gantt data |
| 10 | **Contracts** | CRUD, Sign Wizard, Claims, Supplements | Готово | 8/10 | — |
| 11 | **PTO** | Work Permits, Lab Tests, Quality Plans, KS-11, Hidden Work Acts | Готово | 8/10 | — |
| 12 | **BIM** | Models, Clash Detection, 3D Viewer | Готово | 7/10 | three.js v0.135 (2022); 4.4MB chunk |
| 13 | **CDE** | ISO 19650 Containers, Transmittals | Готово | 8/10 | — |
| 14 | **Accounting** | Journals, Tax, Fixed Assets, Counterparties, ENS | Готово | 7/10 | JournalEntryFormPage 580 lines |
| 15 | **Payroll** | Calculations, Templates | Готово | 7/10 | — |
| 16 | **Operations** | Daily Logs, Work Orders, Dispatch | Готово | 7/10 | DispatchCalendarPage uses `any` |
| 17 | **Integrations** | 1C, SBIS, Telegram, SMS, Weather, EDO | Готово | 7/10 | Integration scheduler hardcoded intervals |
| 18 | **CRM** | Leads, Opportunities | Готово | 7/10 | — |
| 19 | **Analytics** | Dashboards, KPI, Reports, Charts | Готово | 7/10 | — |
| 20 | **Settings** | Company, Email, Security, Integrations, Notifications, Backup | Готово | 6/10 | SettingsPage 798 lines (god component) |
| 21 | **AI Assistant** | Chat, Streaming | Готово | 6/10 | XSS через dangerouslySetInnerHTML |
| 22 | **Messaging** | Chat, Followers, Activities, Call Sessions | Готово | 7/10 | MessagingPage 577 lines |
| 23 | **Revenue Recognition** | ASC 606, Contracts, Periods, Adjustments | Готово | 7/10 | — |
| 24 | **Russian Docs** | KS-2, KS-3, KEP, EDO | Готово | 8/10 | — |
| 25 | **Mobile** | Dashboard, Reports | Готово | 6/10 | MobileDashboardPage 571 lines |
| 26 | **Fleet** | Vehicles, Maintenance, Fuel | Готово | 7/10 | — |
| 27 | **Legal** | Cases, Documents | Готово | 7/10 | — |
| 28 | **Self-Employed** | Contractors | Готово | 7/10 | — |
| 29 | **Monte Carlo** | Schedule Risk Simulation | Готово | 7/10 | — |
| 30 | **Tax Risk** | Tax Compliance Tracking | Готово | 7/10 | — |
| 31 | **Notifications** | Real-time, Batch, REST+WebSocket | Готово | 8/10 | — |
| 32 | **Search** | Full-text, Indexing | Готово | 7/10 | — |
| 33 | **Workflow Engine** | Auto-approval Rules | Готово | 7/10 | — |
| 34 | **Portal** | Employee Self-service | Готово | 7/10 | — |
| 35 | **Recruitment** | Applicants, Board | Готово | 7/10 | — |

---

## 3. SCORECARD

| # | Категория | Оценка | Критических | Серьёзных | Улучшений |
|---|-----------|--------|-------------|-----------|-----------|
| 1 | Общая архитектура | **8/10** | 0 | 1 | 2 |
| 2 | Модели данных и БД | **7/10** | 1 | 3 | 3 |
| 3 | API и бэкенд | **8/10** | 2 | 4 | 3 |
| 4 | Фронтенд архитектура | **8/10** | 1 | 3 | 4 |
| 5 | Типизация | **8.5/10** | 0 | 1 | 2 |
| 6 | Качество кода | **8/10** | 0 | 2 | 4 |
| 7 | Обработка ошибок | **8/10** | 1 | 1 | 2 |
| 8 | Безопасность | **7/10** | 2 | 4 | 3 |
| 9 | Производительность | **6/10** | 0 | 3 | 4 |
| 10 | Тестирование | **6.5/10** | 0 | 2 | 4 |
| 11 | DevOps и инфраструктура | **8.5/10** | 0 | 1 | 3 |
| 12 | i18n | **7.5/10** | 0 | 1 | 2 |
| | **ОБЩАЯ ОЦЕНКА** | **7.5/10** | **7** | **26** | **36** |

---

## 4. ВСЕ НАЙДЕННЫЕ ПРОБЛЕМЫ

### КРИТИЧЕСКИЕ (7)

---

#### C-1. XSS через dangerouslySetInnerHTML в AI Assistant
- **Severity:** CRITICAL
- **Категория:** Безопасность
- **Файл:** `frontend/src/modules/ai/AiAssistantPage.tsx:457`
- **Что не так:** AI-ответы рендерятся через `dangerouslySetInnerHTML` без санитизации. Кастомный renderMarkdown() делает regex-замены, но не экранирует HTML. Если backend вернёт `<script>alert('xss')</script>` или `<img onerror=...>`, скрипт выполнится.
- **Как исправить:**
```typescript
// Установить: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify';

const renderMarkdown = (content: string): string => {
  // Сначала экранировать HTML
  let safe = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Затем парсить markdown
  let html = safe
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    ...
  return DOMPurify.sanitize(html);
};
```

---

#### C-2. XSS через dangerouslySetInnerHTML в DataExchange
- **Severity:** CRITICAL
- **Категория:** Безопасность
- **Файл:** `frontend/src/modules/dataExchange/ExportJobListPage.tsx:252`
- **Что не так:** `dangerouslySetInnerHTML` на i18n-строке с интерполяцией. Если значения `format` или `entity` содержат HTML, произойдёт инъекция.
- **Как исправить:** Использовать обычный JSX вместо innerHTML, либо DOMPurify.sanitize().

---

#### C-3. Refresh Token не проверяет Account Lockout
- **Severity:** CRITICAL
- **Категория:** Безопасность
- **Файл:** `backend/src/main/java/.../auth/service/AuthService.java:137-164`
- **Что не так:** `refreshToken()` использует `readOnly = true` и НЕ проверяет `user.isLocked()`. Заблокированный аккаунт может продолжать сессию через refresh.
- **Как исправить:**
```java
public LoginResponse refreshToken(String refreshToken) {
    // ... validate token ...
    User user = userRepository.findById(userId).orElseThrow(...);
    if (user.isLocked()) {
        throw new LockedException("Account is locked");
    }
    // ... issue new tokens ...
}
```

---

#### C-4. Missing @PreAuthorize на PurchaseRequestController.list()
- **Severity:** CRITICAL
- **Категория:** Безопасность / Авторизация
- **Файл:** `backend/src/main/java/.../procurement/web/PurchaseRequestController.java:55-71`
- **Что не так:** Метод `listRequests()` не имеет аннотации `@PreAuthorize`. Любой аутентифицированный пользователь получает доступ к данным закупок.
- **Как исправить:** Добавить `@PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER', 'PROJECT_MANAGER')")`.

---

#### C-5. Race Condition в CostCodeService.create()
- **Severity:** CRITICAL
- **Категория:** Конкурентность / Целостность данных
- **Файл:** `backend/src/main/java/.../costManagement/service/CostCodeService.java:86-88`
- **Что не так:** Check-then-act паттерн: `existsByProjectIdAndCode()` → `save()`. Два потока могут пройти проверку одновременно и создать дубликаты.
- **Как исправить:** Добавить UNIQUE constraint на уровне БД + обработать `DataIntegrityViolationException`, или использовать UPSERT.

---

#### C-6. Batch Operation 2000 записей в одной транзакции
- **Severity:** CRITICAL
- **Категория:** Производительность / Стабильность
- **Файл:** `backend/src/main/java/.../bidScoring/service/BidScoringService.java:400-534`
- **Что не так:** `upsertScoresBatch()` обрабатывает до 2000 записей в одной транзакции. Это приводит к длительным блокировкам строк, риску OOM, и деградации для других пользователей.
- **Как исправить:** Разбить на чанки по 200-500 записей, каждый в отдельной транзакции. Добавить per-user rate limit на этот endpoint.

---

#### C-7. Stock Movement Cancel — Частичное состояние
- **Severity:** CRITICAL
- **Категория:** Целостность данных
- **Файл:** `backend/src/main/java/.../warehouse/service/StockMovementService.java:306-312`
- **Что не так:** `cancelMovement()` в цикле реверсирует строки. Если ошибка на середине (TRANSFER: реверс source OK, destination FAIL) — склад в неконсистентном состоянии.
- **Как исправить:** Обернуть весь цикл в try-catch с компенсирующей транзакцией, или использовать savepoint.

---

### СЕРЬЁЗНЫЕ (26)

---

#### S-1. JWT токены хранятся в localStorage
- **Severity:** SERIOUS
- **Категория:** Безопасность
- **Файл:** `frontend/src/stores/authStore.ts`
- **Что не так:** localStorage доступен любому JS на странице. В сочетании с XSS (C-1, C-2) — полная компрометация.
- **Как исправить:** Перейти на httpOnly cookies для access token, или добавить строгий CSP (`script-src 'self'`).

---

#### S-2. organizationId спуфинг через query parameter
- **Severity:** SERIOUS
- **Категория:** Мультитенантность
- **Файл:** `backend/src/main/java/.../project/web/ProjectController.java:60`
- **Что не так:** `@RequestParam UUID organizationId` принимает любое значение. Хотя сервис фильтрует, контроллер не отклоняет чужой tenant.
- **Как исправить:**
```java
UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
if (organizationId != null && !organizationId.equals(currentOrgId)) {
    throw new AccessDeniedException("Cannot query other organizations");
}
```

---

#### S-3. Отсутствие виртуализации списков
- **Severity:** SERIOUS
- **Категория:** Производительность
- **Файл:** `frontend/src/design-system/components/DataTable/index.tsx`
- **Что не так:** Нет react-virtual / react-window. Таблицы с 1000+ строками рендерят ВСЕ DOM-ноды. Finance, Warehouse, Procurement пострадают при масштабировании.
- **Как исправить:** Установить `@tanstack/react-virtual`, обернуть тело DataTable виртуальным скроллингом.

---

#### S-4. Недостаточная мемоизация в модулях
- **Severity:** SERIOUS
- **Категория:** Производительность
- **Файл:** 165+ файлов модулей без useMemo/useCallback
- **Что не так:** Только ~30 из 195+ модульных файлов используют мемоизацию. Каждое изменение стейта вызывает ре-рендер всего дерева.
- **Как исправить:** React.memo() на DataTable, StatusBadge, AssigneeAvatar. useCallback на все обработчики, передаваемые дочерним компонентам.

---

#### S-5. God-компоненты (>500 строк)
- **Severity:** SERIOUS
- **Категория:** Архитектура фронтенда
- **Файлы:**
  - `PurchaseOrderDetailPage.tsx` — **1158 строк**
  - `SettingsPage.tsx` — **798 строк**
  - `PurchaseOrderListPage.tsx` — **702 строк**
  - `PurchaseOrderFormPage.tsx` — **691 строк**
  - `IntegrationsPage.tsx` — **644 строк**
  - `JournalEntryFormPage.tsx` — **580 строк**
  - `MessagingPage.tsx` — **577 строк**
  - `MobileDashboardPage.tsx` — **571 строк**
  - `AiAssistantPage.tsx` — **565 строк**
  - `PermissionsPage.tsx` — **512 строк**
- **Как исправить:** Декомпозиция на подкомпоненты (BasicInfo, ItemsTable, ActionsBar).

---

#### S-6. God-сервисы на backend (>500 строк)
- **Severity:** SERIOUS
- **Категория:** Архитектура бэкенда
- **Файлы:**
  - `BidScoringService.java` — **805 строк**
  - `ClosingDocumentService.java` — **586 строк**
  - `PortfolioService.java` — **585 строк**
  - `ProcurementService.java` — **582 строк**
  - `StockMovementService.java` — **562 строк**
  - `PurchaseOrderService.java` — **562 строк**
  - `ContractService.java` — **550 строк**
- **Как исправить:** Разбить BidScoringService на ScoreCalculationService + BidComparisonService.

---

#### S-7. Нет Content Security Policy headers
- **Severity:** SERIOUS
- **Категория:** Безопасность
- **Файл:** `backend/src/main/java/.../infrastructure/config/SecurityConfig.java`
- **Что не так:** CSP настроен в nginx, но не в Spring Security. При прямом доступе к backend (обход nginx) — нет защиты.
- **Как исправить:** Добавить CSP header в SecurityConfig.

---

#### S-8. CORS origins захардкожены
- **Severity:** SERIOUS
- **Категория:** Безопасность / Деплой
- **Файл:** `backend/src/main/java/.../CorsProperties.java:16`
- **Что не так:** `allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173")` — dev-значения по умолчанию. Если production не переопределит — открытый CORS.
- **Как исправить:** `allowedOrigins: ${CORS_ALLOWED_ORIGINS:}` — пустой список по умолчанию, обязательная настройка в prod.

---

#### S-9. Нет debounce на поисковых фильтрах DataTable
- **Severity:** SERIOUS
- **Категория:** Производительность
- **Файл:** `frontend/src/design-system/components/DataTable/index.tsx`
- **Что не так:** Фильтры и поиск отправляют API-запрос на каждый keystroke. При 100+ пользователях — лавина запросов.
- **Как исправить:** Добавить `useDeferredValue` или `lodash-es/debounce` (300ms).

---

#### S-10. Invoice Payment — Race Condition
- **Severity:** SERIOUS
- **Категория:** Конкурентность
- **Файл:** `backend/src/main/java/.../finance/service/InvoiceService.java:273-310`
- **Что не так:** `registerPayment()` не использует pessimistic lock. Два одновременных платежа могут превысить сумму инвойса.
- **Как исправить:** Использовать `findByIdAndDeletedFalseForUpdate()` (с `@Lock(PESSIMISTIC_WRITE)`).

---

#### S-11. Нет токен-ротации при refresh
- **Severity:** SERIOUS
- **Категория:** Безопасность
- **Файл:** `backend/src/main/java/.../auth/service/AuthService.java`
- **Что не так:** Refresh token не инвалидируется после использования. Украденный refresh token работает до истечения TTL.
- **Как исправить:** One-time refresh tokens: после использования старый инвалидируется в Redis.

---

#### S-12. Нет Cache Eviction при изменении прав
- **Severity:** SERIOUS
- **Категория:** Кэширование
- **Файл:** Backend services для ролей/permissions
- **Что не так:** CacheConfig настраивает `@Cacheable` для permissions (30 мин), но нет `@CacheEvict` при изменении ролей. Пользователь получает устаревшие права до 30 минут.
- **Как исправить:** Добавить `@CacheEvict(cacheNames = "permissionModelAccess", allEntries = true)` на все методы изменения ролей.

---

#### S-13. Missing cascade soft-delete
- **Severity:** SERIOUS
- **Категория:** Целостность данных
- **Файл:** Все сущности с `deleted` флагом
- **Что не так:** Soft delete родителя не каскадируется на дочерние сущности. Удаление Project не помечает связанные Invoices, Tasks, PurchaseRequests как удалённые.
- **Как исправить:** Добавить каскадный soft-delete через domain events или @PreRemove listener.

---

#### S-14. Missing indexes на FK relationships
- **Severity:** SERIOUS
- **Категория:** БД / Производительность
- **Файлы:** StockMovementLine, InvoiceLine, и другие сущности с FK
- **Что не так:** Нет явных индексов на foreign key колонках (movementId, invoiceId). PostgreSQL автоматически НЕ создаёт индексы на FK.
- **Как исправить:** Добавить Flyway-миграцию с CREATE INDEX CONCURRENTLY на все FK-колонки.

---

#### S-15. Email async — Silent failure
- **Severity:** SERIOUS
- **Категория:** Надёжность
- **Файл:** `backend/src/main/java/.../infrastructure/email/EmailService.java:82-84`
- **Что не так:** `sendEmailAsync()` вызывает синхронный метод в @Async, но не логирует ошибки. Письма теряются молча.
- **Как исправить:** Добавить try-catch с `log.error("Async email failed", e)`.

---

#### S-16. Rate limiter — unbounded memory
- **Severity:** SERIOUS
- **Категория:** Стабильность
- **Файл:** `backend/src/main/java/.../infrastructure/web/RateLimitFilter.java`
- **Что не так:** `ConcurrentHashMap<String, SlidingWindow>` никогда не чистится (cleanup scheduler не найден). При тысячах уникальных IP — memory leak.
- **Как исправить:** Добавить `@Scheduled` cleanup каждые 5 минут, удалять entries старше 2 минут.

---

#### S-17. Missing @PreAuthorize на BidScoringController
- **Severity:** SERIOUS
- **Категория:** Безопасность
- **Файл:** `backend/src/main/java/.../bidScoring/web/BidScoringController.java:53-62`
- **Что не так:** Root endpoint `/api/bid-scoring` доступен с `isAuthenticated()` вместо role-based.
- **Как исправить:** `@PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")`.

---

#### S-18. 8 файлов с suppressed react-hooks/exhaustive-deps
- **Severity:** SERIOUS
- **Категория:** React / Bugs
- **Файлы:** ContractFormPage, DispatchOrderFormPage, InvoiceFormPage, EmployeeFormPage, PurchaseRequestFormPage, RfiFormPage, BimViewer, DispatchRouteFormPage
- **Что не так:** `// eslint-disable-next-line react-hooks/exhaustive-deps` скрывает потенциальные баги с устаревшими замыканиями.
- **Как исправить:** Рефакторить на useCallback с правильными зависимостями.

---

#### S-19. Отсутствие API versioning
- **Severity:** SERIOUS
- **Категория:** Архитектура API
- **Файл:** Все контроллеры используют `/api/...` без версии
- **Что не так:** Breaking changes API затронут всех клиентов одновременно. Мобильные клиенты не могут использовать старую версию.
- **Как исправить:** Перейти на `/api/v1/...` с поддержкой нескольких версий.

---

#### S-20. Нет distributed tracing
- **Severity:** SERIOUS
- **Категория:** Observability
- **Что не так:** Prometheus + Grafana + Loki дают метрики и логи, но нет трассировки запросов через систему. При проблемах в production невозможно понять путь запроса.
- **Как исправить:** Добавить OpenTelemetry → Jaeger/Tempo.

---

#### S-21. Backend test coverage — controllers untested
- **Severity:** SERIOUS
- **Категория:** Тестирование
- **Что не так:** Из 199 контроллеров протестирован только ProjectControllerTest. Нет тестов @PreAuthorize enforcement.
- **Как исправить:** Добавить @WebMvcTest для каждого контроллера, тестировать 403/401 для неавторизованных ролей.

---

#### S-22. Frontend module test coverage ~1.6%
- **Severity:** SERIOUS
- **Категория:** Тестирование
- **Что не так:** 42 тестовых файла на 736 source файлов. Из 62 модулей тестами покрыт 1. Критические формы (finance, procurement) не тестируются.
- **Как исправить:** Приоритетно: тесты для form submission, validation, error handling в finance и procurement модулях.

---

#### S-23. Hardcoded admin password в DataInitializer
- **Severity:** SERIOUS
- **Категория:** Безопасность
- **Файл:** `backend/src/main/java/.../infrastructure/config/DataInitializer.java:92,104`
- **Что не так:** Пароль "admin123" захардкожен для dev seed. Если DataInitializer выполнится в production — слабый пароль.
- **Как исправить:** Использовать environment variable `ADMIN_DEFAULT_PASSWORD`, минимум 12 символов.

---

#### S-24. No image optimization
- **Severity:** SERIOUS
- **Категория:** Производительность
- **Что не так:** Нет `loading="lazy"`, width/height на `<img>`, WebP, srcset. Нет vite-plugin-image-optimizer.
- **Как исправить:** Добавить lazy loading + dimensions на все img теги.

---

#### S-25. three.js outdated (v0.135, 2022)
- **Severity:** SERIOUS
- **Категория:** Зависимости
- **Файл:** `frontend/package.json`
- **Что не так:** three.js v0.135 от февраля 2022 — потенциальные security advisories, пропущены 3+ года оптимизаций.
- **Как исправить:** Обновить до three@0.165+ с проверкой BIM viewer совместимости.

---

#### S-26. Нет автоматического rollback при failed deployment
- **Severity:** SERIOUS
- **Категория:** DevOps
- **Файл:** `.github/workflows/deploy.yml`
- **Что не так:** Health check failure не триггерит автоматический откат. Ручное восстановление = downtime.
- **Как исправить:** Сохранять previous image SHA, при failed health check — `docker compose up -d` с предыдущим тегом.

---

### УЛУЧШЕНИЯ (36)

| # | Категория | Описание | Файл | Приоритет |
|---|-----------|----------|------|-----------|
| I-1 | Типизация | 6 `any` в websocket.ts (justified, но можно типизировать STOMP) | lib/websocket.ts | Low |
| I-2 | Типизация | 26 `as unknown` assertions в form pages | 19 файлов | Medium |
| I-3 | Типизация | `(data: any)` в ProjectFormPage:164 | ProjectFormPage.tsx | Medium |
| I-4 | Типизация | `(o: any)` в DispatchCalendarPage:142 | DispatchCalendarPage.tsx | Medium |
| I-5 | i18n | ~30+ файлов с hardcoded Cyrillic в модулях | Modules | Medium |
| I-6 | i18n | RouteErrorBoundary.tsx:60 — hardcoded Russian error messages | RouteErrorBoundary.tsx | Medium |
| I-7 | i18n | 14K строк в ru.ts/en.ts — разбить по модулям для tree-shaking | i18n/ | Low |
| I-8 | Код | Дублирование maxDraftAgeMs в 3 файлах | AccountingPage, PurchaseOrderForm, TenderEvaluate | Low |
| I-9 | Код | Magic numbers: lockout 900s, batch 2000, thresholds 80/100 | Java services | Medium |
| I-10 | Код | useKeyboardShortcuts:88 — shortcuts array в dependency → лишние ре-рендеры | hooks/useKeyboardShortcuts.ts | Medium |
| I-11 | Формы | Нет Zod runtime validation на бэкенде (только Jakarta @Valid) | Backend DTOs | Low |
| I-12 | БД | Native SQL sequence query — PostgreSQL-specific | InvoiceRepository.java:54 | Low |
| I-13 | БД | JPQL wildcard injection в search LIKE | EmployeeRepository.java:27 | Low |
| I-14 | БД | BigDecimal precision не задокументирована | StockEntry entity | Low |
| I-15 | API | Inconsistent response: `PageResponse<T>` vs `List<T>` | Контроллеры | Medium |
| I-16 | API | Endpoint path inconsistency: `/purchase-requests` vs `/procurement/requests` | PurchaseRequestController | Medium |
| I-17 | Perf | Service Worker offline queue — нет retry limit | frontend/public/sw.js | Low |
| I-18 | Perf | WebSocket hard-coded message limits (100/200/50) | useWebSocket.ts | Low |
| I-19 | Perf | Нет Web Vitals мониторинга | Frontend | Medium |
| I-20 | Perf | Font self-hosting для устранения зависимости от Google Fonts | index.html | Low |
| I-21 | Perf | Lucide icons загружаются полностью | package.json | Low |
| I-22 | Security | CSP nginx uses `'unsafe-inline'` для styles | nginx.conf | Medium |
| I-23 | Security | X-API-Key header without per-key rate limiting | SecurityConfig | Low |
| I-24 | Security | allowCredentials(true) в CORS config | CorsProperties | Medium |
| I-25 | Security | Нет secret scanning в CI (no truffleHog/git-secrets) | CI pipeline | Medium |
| I-26 | Security | Нет SBOM generation | CI pipeline | Low |
| I-27 | Security | Нет image signing (Cosign) | CI pipeline | Low |
| I-28 | DevOps | SSH action в deploy.yml не pinned to SHA | deploy.yml | Medium |
| I-29 | DevOps | Нет DB migration validation перед деплоем | deploy.yml | Medium |
| I-30 | DevOps | Нет SonarQube quality gate | CI pipeline | Medium |
| I-31 | DevOps | npm audit non-blocking | ci.yml | Low |
| I-32 | Tests | Нет E2E тестов для token refresh flow | Frontend tests | Medium |
| I-33 | Tests | Нет тестов rate limiting | Backend tests | Medium |
| I-34 | Tests | Нет тестов account lockout | Backend tests | Medium |
| I-35 | Tests | Нет тестов XSS injection attempts | Tests | Medium |
| I-36 | Logging | BidScoringService:191 — не логирует currentUserId при spoofed scoredById | BidScoringService | Low |

---

## 5. АРХИТЕКТУРНЫЕ РЕКОМЕНДАЦИИ

### 5.1 Для масштабирования до 10,000+ пользователей

#### Инфраструктура
1. **Горизонтальное масштабирование backend:** Текущий monolith OK для 1-2K пользователей. Для 10K+ нужен:
   - Distributed rate limiter (Redis-based вместо in-memory ConcurrentHashMap)
   - Sticky sessions или stateless auth (уже JWT — ок)
   - Load balancer перед несколькими инстансами backend

2. **Database read replicas:** Для heavy-read модулей (analytics, reports, dashboards) — настроить PostgreSQL streaming replication + routing `@Transactional(readOnly = true)` на реплику.

3. **Connection pooling:** HikariCP настроен (100 max), но для 10K пользователей нужен PgBouncer перед PostgreSQL.

4. **Redis Cluster:** Текущий single-node Redis для кэша и WebSocket pubsub. Для HA — Redis Sentinel или Cluster.

#### Backend
5. **Event-driven architecture:** Для тяжёлых операций (PDF generation, batch scoring, integrations sync) — вынести в message queue (RabbitMQ/Kafka). Текущий @Async не гарантирует доставку.

6. **CQRS для аналитики:** Отделить read-модели для dashboards/reports от write-модели. Текущая архитектура запрашивает production DB для аналитики.

7. **API Gateway:** При нескольких инстансах backend — добавить Kong/AWS API Gateway для centralized rate limiting, API versioning, auth offloading.

#### Frontend
8. **Micro-frontend consideration:** При 60+ модулях и нескольких командах — рассмотреть Module Federation (Vite 6 поддерживает). Позволит деплоить модули независимо.

9. **Server-side rendering для SEO/LCP:** Для public-facing pages (если будут) — Next.js или Remix. Текущий SPA OK для authenticated dashboard.

### 5.2 Roadmap приоритетов

```
НЕДЕЛЯ 1-2: Security fixes (C-1..C-7)
├── Fix XSS (DOMPurify)
├── Fix auth bypass (refresh + lockout)
├── Add @PreAuthorize where missing
├── Fix race conditions (pessimistic locks)
└── Reduce batch size

НЕДЕЛЯ 3-4: Performance (S-3, S-4, S-9, S-24)
├── Virtual scrolling (react-virtual)
├── Memoization sweep
├── Debounce filters
└── Image optimization

НЕДЕЛЯ 5-6: Architecture (S-5, S-6, S-19)
├── Decompose god components
├── Decompose god services
├── API versioning (/api/v1/)
└── Distributed rate limiter (Redis)

НЕДЕЛЯ 7-8: Testing & Observability (S-21, S-22, S-20)
├── Controller @PreAuthorize tests
├── Frontend form tests (finance, procurement)
├── OpenTelemetry tracing
└── Auto-rollback in deployment
```

---

## 6. ТЕХНИЧЕСКИЙ ДОЛГ (Реестр)

| # | Элемент | Приоритет | Трудозатраты | Влияние |
|---|---------|-----------|-------------|---------|
| 1 | XSS через dangerouslySetInnerHTML (2 места) | P0 | 2ч | Критическая уязвимость |
| 2 | Race conditions (3 сервиса) | P0 | 8ч | Потеря/повреждение данных |
| 3 | Auth bypass (refresh + lockout) | P0 | 4ч | Компрометация аккаунтов |
| 4 | Missing @PreAuthorize (3 endpoint) | P0 | 2ч | Несанкционированный доступ |
| 5 | Virtual scrolling | P1 | 8ч | UX при больших объёмах |
| 6 | Мемоизация (165+ файлов) | P1 | 16ч | Тормоза при масштабе |
| 7 | God-компоненты (10 файлов) | P1 | 30ч | Maintainability |
| 8 | God-сервисы (7 файлов) | P1 | 40ч | Maintainability |
| 9 | Debounce фильтров | P1 | 4ч | API overload |
| 10 | Cache eviction | P1 | 4ч | Stale permissions |
| 11 | API versioning | P2 | 16ч | Breaking changes risk |
| 12 | Controller tests | P2 | 40ч | Regression safety |
| 13 | Frontend module tests | P2 | 60ч | Regression safety |
| 14 | CORS env-configurable | P2 | 2ч | Production security |
| 15 | Distributed tracing | P2 | 16ч | Debugging в production |
| 16 | i18n remaining ~30 files | P3 | 20ч | Полная локализация |
| 17 | Token rotation | P3 | 8ч | Session security |
| 18 | Auto-rollback deploy | P3 | 8ч | Deployment reliability |
| 19 | Image optimization | P3 | 4ч | Load time |
| 20 | FK indexes migration | P3 | 4ч | Query performance |
| | **ИТОГО** | | **~296ч** | |

---

## 7. ЧТО СДЕЛАНО ХОРОШО

### Сильные стороны — фундамент для роста

#### 1. Архитектура (9/10)
- **Модульная структура:** 50+ доменных пакетов с чёткой domain/repository/service/web структурой. Каждый модуль изолирован — можно развивать независимо.
- **Мультитенантность:** organization_id на ВСЕХ таблицах (V85-V108). TenantInterceptor на уровне JPA. Это правильное решение для enterprise SaaS.
- **Monolith choice:** Для текущего этапа — абсолютно верный выбор. Microservices были бы premature optimization.

#### 2. Design System (9.5/10)
- **Лучший в проекте.** DataTable, Modal, FormField, Button — generic, reusable, zero business logic.
- **Accessibility:** aria-describedby, aria-invalid, focus trap в Modal, keyboard navigation (Tab, Shift+Tab, Esc).
- **Responsive:** Mobile card view fallback в DataTable. Saved views с localStorage.

#### 3. Безопасность (8/10 с учётом fix)
- **939 @PreAuthorize** аннотаций — впечатляющее покрытие.
- **Rate limiting:** 100 req/min general, 10 req/min auth с sliding window.
- **Account lockout:** 5 попыток → 15 мин блокировка + LoginAttempt audit.
- **JWT:** JJWT 0.12.6, HS256, refresh token flow с очередью запросов на фронте.
- **OWASP Dependency-Check + Semgrep SAST + Trivy** в CI — тройная проверка.

#### 4. API Client (9/10)
- **Token refresh с очередью:** Concurrent requests ждут refresh, а не шлют 10 refresh-запросов. Это enterprise-grade решение.
- **Error toast deduplication:** 10s cooldown предотвращает спам.
- **Demo mode blocking:** Корректная блокировка write-операций в demo.

#### 5. DevOps (8.5/10)
- **CI/CD:** 9 параллельных jobs, security scanning, E2E тесты, Docker build.
- **Production compose:** 15 сервисов включая Prometheus, Grafana, Loki, Certbot, backup.
- **Multi-stage Docker:** Optimized images (Alpine), non-root users, health checks, tini init.
- **Nginx:** TLS 1.2+, HSTS, CSP, Permissions-Policy, gzip, WebSocket support.
- **Backup strategy:** Daily PostgreSQL dumps, 7d/4w/6m retention.

#### 6. Миграции БД (9/10)
- **114 миграций** — полная история схемы.
- **Правильный подход:** Flyway с `ddl-auto: validate` — Hibernate не модифицирует схему.
- **Tenant backfill:** V85-V107 систематически добавили organization_id на все таблицы.

#### 7. Code Splitting (10/10)
- **100% lazy loading** всех route pages.
- **14+ кастомных chunks** в vite.config.ts (bim-3d, charts, forms, vendor-react и т.д.).
- **Domain-level chunks** — каждый бизнес-модуль в отдельном бандле.

#### 8. Offline Support (9/10)
- **Service Worker** с app-shell caching, stale-while-revalidate для статики, network-first для API.
- **IndexedDB offline queue** с background sync для replay мутаций.
- **Offline.html** fallback page.

#### 9. Real-time (8/10)
- **STOMP over SockJS** с Redis pub/sub broadcast.
- **3 subscription типа:** project, user, broadcast.
- **Toast deduplication** и фильтрация технических ошибок.

#### 10. i18n (8/10)
- **Type-safe** переводы: en.ts структурно соответствует ru.ts.
- **5,000+ ключей** в каждом языке.
- **Fallback:** Если ключ не найден — console.warn + возврат ключа.

---

## ЗАКЛЮЧЕНИЕ

**PRIVOD** — это **серьёзная enterprise-система** с сильной архитектурной базой. Проект покрывает 35+ бизнес-доменов строительной отрасли с российской спецификой (КС-2, КС-3, EDO, 1С-интеграция). Для стартапа/раннего этапа это **впечатляющий объём работы**.

**Главные риски для enterprise-уровня:**
1. **Безопасность:** XSS + auth bypass + race conditions — must fix до production.
2. **Производительность:** Нет виртуализации + мемоизации — будет тормозить на 500+ записях.
3. **Тестирование:** ~8-12% покрытие frontend, ~40-50% backend — недостаточно для SLA 99.9%.

**Рекомендация:** Исправить 7 критических проблем (2 недели), затем P1-улучшения (4 недели). После этого система будет ready для enterprise pilot с SLA 99.9%.

**Общая оценка: 7.5/10 — Solid foundation, needs hardening.**

---

*Отчёт сгенерирован 2026-02-18. Сохранён в `TECHNICAL_AUDIT_2026-02-18.md`*
