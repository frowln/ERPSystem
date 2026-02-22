# ПРИВОД ERP/CRM — ДЕТАЛЬНЫЕ ТЕХНИЧЕСКИЕ СПЕЦИФИКАЦИИ (Задачи 1-15)

> **Дата:** 18 февраля 2026
> **Автор:** CPO / Senior Architect
> **Для:** Команда разработки
> **Методология:** Спецификации основаны на полном аудите кодовой базы (1,500+ файлов), аудите безопасности (84 findings), карте 85 строительных процессов и конкурентном анализе (58+ решений)

---

## ОГЛАВЛЕНИЕ

### P0 — Блокеры безопасности / Production:
1. [JWT Secret Management + Token Rotation](#задача-1-jwt-secret-management--token-rotation)
2. [Rate Limiting (API + Auth)](#задача-2-rate-limiting-api--auth)
3. [Input Validation & SQL Injection Prevention](#задача-3-input-validation--sql-injection-prevention)
4. [CORS Configuration Fix](#задача-4-cors-configuration-fix)
5. [Audit Logging (кто что когда)](#задача-5-audit-logging-кто-что-когда)
6. [Password Policy + Account Lockout](#задача-6-password-policy--account-lockout)
7. [HTTPS Enforcement + Security Headers](#задача-7-https-enforcement--security-headers)

### P1 — MVP Core:
8. [КС-2/КС-3 Generation Module](#задача-8-кс-2кс-3-generation-module)
9. [Work Volume Tracking](#задача-9-work-volume-tracking)
10. [Digital Daily Logs (Общий журнал работ)](#задача-10-digital-daily-logs-общий-журнал-работ)
11. [Basic CPM Scheduling Enhancement](#задача-11-basic-cpm-scheduling-enhancement)
12. [1C Integration (синхронизация данных)](#задача-12-1c-integration-синхронизация-данных)
13. [Document Approval Workflow Engine](#задача-13-document-approval-workflow-engine)
14. [Electronic Signature Integration (КЭП)](#задача-14-electronic-signature-integration-кэп)
15. [Real-time Plan-Fact Dashboard](#задача-15-real-time-plan-fact-dashboard)

---

## Задача 1: JWT Secret Management + Token Rotation

### Описание

Текущая реализация JWT в системе ПРИВОД содержит несколько критических уязвимостей. Во-первых, в `docker-compose.yml:117` указан hardcoded default-секрет: `APP_JWT_SECRET: "${JWT_SECRET:-xk8Pq2mN7vR4tY9wA3cF6hJ0lBnE5sG8dI1oU4zK7mX2pQ9rT6yW3aD0fH5jL}"`. Если переменная окружения не задана, любой, кто имеет доступ к репозиторию (все разработчики), может подделать JWT-токен для ЛЮБОГО пользователя системы. Во-вторых, JWT не содержит `organizationId` (`JwtTokenProvider.java:61-69`), что делает невозможным tenant-scoped контроль доступа на уровне токена.

Во-вторых, refresh-токен не ротируется при использовании (`AuthService.java:137-163`). При каждом обновлении access-токена генерируется новый refresh-токен, но старый остаётся валидным — это позволяет атакующему, перехватившему refresh-токен, использовать его бесконечно (replay attack). Также отсутствует серверный logout — нет blacklist для отозванных токенов, а entity `UserSession` существует в коде, но не подключена к auth flow.

Пользователь видит: более безопасный процесс аутентификации. При logout токены немедленно перестают работать. При подозрительной активности система автоматически отзывает все сессии пользователя. Администратор может видеть активные сессии и принудительно завершать их.

### Сущности/Таблицы БД

```sql
-- Таблица для хранения семейств refresh-токенов и обнаружения replay-атак
CREATE TABLE refresh_token_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID,
    family_id UUID NOT NULL, -- уникальный ID семейства токенов (одна цепочка ротации)
    current_token_hash VARCHAR(64) NOT NULL, -- SHA-256 хэш текущего refresh-токена
    previous_token_hash VARCHAR(64), -- хэш предыдущего токена (для grace period)
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(100), -- LOGOUT, STOLEN, ADMIN_FORCE, PASSWORD_CHANGE
    device_info VARCHAR(500), -- User-Agent + IP для отображения сессий
    ip_address VARCHAR(45),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_rtf_user ON refresh_token_families(user_id) WHERE deleted = FALSE;
CREATE INDEX idx_rtf_family ON refresh_token_families(family_id) WHERE deleted = FALSE;
CREATE INDEX idx_rtf_token_hash ON refresh_token_families(current_token_hash) WHERE deleted = FALSE AND is_revoked = FALSE;
CREATE INDEX idx_rtf_expires ON refresh_token_families(expires_at) WHERE deleted = FALSE AND is_revoked = FALSE;

-- Таблица blacklist для отозванных access-токенов (хранятся до истечения TTL)
CREATE TABLE revoked_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_jti VARCHAR(64) NOT NULL UNIQUE, -- JWT ID (jti claim)
    user_id UUID NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL, -- когда токен всё равно истёк бы — для cleanup
    reason VARCHAR(100)
);

CREATE INDEX idx_rat_jti ON revoked_access_tokens(token_jti);
CREATE INDEX idx_rat_expires ON revoked_access_tokens(expires_at);
```

**Модификации существующих сущностей:**

Файл: `backend/src/main/java/com/privod/platform/infrastructure/security/JwtTokenProvider.java`
- Добавить claim `jti` (JWT ID) в access-токен для поддержки blacklist
- Добавить claim `orgId` (organizationId) в access-токен
- Добавить claim `familyId` в refresh-токен

Файл: `backend/src/main/java/com/privod/platform/modules/auth/domain/User.java`
- Без изменений (lockedUntil и failedLoginAttempts уже есть)

### API Endpoints

```
POST /api/auth/login
  Request:  { email: string, password: string }
  Response: { accessToken: string, refreshToken: string, expiresIn: number, user: UserResponse }
  Изменения: access-токен теперь содержит jti + orgId. Refresh-токен содержит familyId.
  Roles: PUBLIC

POST /api/auth/refresh
  Request:  { refreshToken: string }
  Response: { accessToken: string, refreshToken: string, expiresIn: number }
  Изменения:
    1. Валидирует refresh-токен по хэшу в refresh_token_families
    2. Если токен уже использован (reuse detection) — отзывает ВСЁ семейство
    3. Генерирует новый refresh-токен, записывает хэш, помечает старый как previous
    4. Grace period 30 сек для previous_token_hash (race condition при параллельных запросах)
  Roles: PUBLIC

POST /api/auth/logout
  Request:  {} (токен в Authorization header)
  Response: { success: true }
  Действия:
    1. Добавляет jti текущего access-токена в revoked_access_tokens
    2. Отзывает refresh-token family для текущего устройства
  Roles: AUTHENTICATED

POST /api/auth/logout-all
  Request:  {}
  Response: { success: true, revokedSessions: number }
  Действия: Отзывает ВСЕ refresh-token families пользователя
  Roles: AUTHENTICATED

GET /api/auth/sessions
  Response: [{ id, deviceInfo, ipAddress, lastUsedAt, issuedAt, isCurrent }]
  Roles: AUTHENTICATED

DELETE /api/auth/sessions/{familyId}
  Response: { success: true }
  Действия: Отзывает конкретную сессию
  Roles: AUTHENTICATED

POST /api/admin/users/{userId}/revoke-sessions
  Response: { success: true, revokedSessions: number }
  Действия: Администратор принудительно завершает все сессии пользователя
  Roles: [ADMIN]
```

### Экраны (UI Description)

**1. Страница «Активные сессии» (Settings > Security > Sessions)**
- Расположение: внутри `frontend/src/modules/settings/SettingsPage.tsx`, новая вкладка «Безопасность»
- Таблица: Device/Browser | IP | Последняя активность | Дата входа | Действия
- Текущая сессия помечена зелёным бейджем «Текущая»
- Кнопка «Завершить» для каждой сессии (кроме текущей)
- Кнопка «Завершить все другие сессии» в заголовке
- Переиспользуемые компоненты: `DataTable` из `frontend/src/design-system/components/DataTable/index.tsx`, `Button`, `StatusBadge`

**2. Кнопка Logout**
- Расположение: `frontend/src/design-system/components/TopBar/index.tsx` (уже есть, нужно подключить к реальному API)
- Вызывает `POST /api/auth/logout`, затем очищает `authStore` и редиректит на `/login`

**3. Админ-панель: управление сессиями пользователей**
- Расположение: `frontend/src/modules/settings/UsersAdminPage.tsx`
- В карточке пользователя кнопка «Завершить все сессии» (видна только ADMIN)

### Бизнес-правила и валидации

1. **JWT Secret**: убрать default-значение из docker-compose. Использовать `${JWT_SECRET:?JWT_SECRET must be set}`. Минимальная длина секрета — 64 символа (256 бит). Валидация при старте приложения — если длина < 64, приложение не запускается.

2. **Access Token TTL**: уменьшить с 24 часов (`docker-compose.prod.yml:135`) до 15 минут (900000 мс). Это стандарт для финансовых SaaS.

3. **Refresh Token TTL**: 7 дней (текущее значение 604800000 мс — ОК).

4. **Refresh Token Rotation**: при каждом использовании refresh-токена генерируется новый. Старый становится невалидным. Если обнаружено повторное использование старого токена (replay) — отзывается ВСЁ семейство токенов (все устройства пользователя). Это паттерн из RFC 6819.

5. **Grace Period**: 30 секунд для предыдущего refresh-токена. Причина: если два запроса на refresh прилетают почти одновременно (race condition в браузере), второй запрос использует «уже ротированный» токен. Без grace period это ложно детектируется как replay attack.

6. **Blacklist Cleanup**: Cron-задача каждые 15 минут удаляет записи из `revoked_access_tokens` с `expires_at < NOW()`. Для `refresh_token_families` — удаление записей старше 30 дней.

7. **Redis Cache**: для performance blacklist проверки — кэшировать revoked jti в Redis SET с TTL = оставшийся срок жизни токена. Проверка `JwtAuthenticationFilter` сначала смотрит в Redis, при промахе — в PostgreSQL.

8. **Password Change**: при смене пароля отзываются ВСЕ refresh-token families пользователя (кроме текущей сессии, если пользователь сам менял пароль).

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Login/Refresh/Logout | Да | Да | Да | Да | Да |
| Просмотр своих сессий | Да | Да | Да | Да | Да |
| Завершить свою сессию | Да | Да | Да | Да | Да |
| Завершить все свои сессии | Да | Да | Да | Да | Да |
| Завершить сессии другого пользователя | Да | Нет | Нет | Нет | Нет |

### Edge Cases

1. **Параллельные refresh-запросы**: два таба браузера одновременно отправляют refresh. Решение: grace period 30 сек для previous_token_hash.
2. **Redis недоступен**: fallback на проверку blacklist в PostgreSQL. Логировать warning.
3. **Миграция существующих пользователей**: при первом запуске после обновления у пользователей нет записей в `refresh_token_families`. При следующем login они автоматически создадутся. Существующие refresh-токены перестанут работать — пользователям нужно будет залогиниться заново. Это приемлемо для security-критичного обновления.
4. **Clock skew**: если серверы имеют рассинхронизацию часов > 30 сек, grace period может не работать. Решение: использовать NTP на всех серверах.
5. **Massive logout (ADMIN отзывает все сессии)**: может быть много записей в blacklist. Решение: batch insert в Redis + PostgreSQL.

### UX-эталон

**Procore** не реализует управление сессиями (у них SSO через IdP). Лучший эталон — **GitHub**: показывает активные сессии с устройством, IP, геолокацией, позволяет отзывать индивидуально. **Google Account** — эталон для «Завершить все другие сессии».

---

## Задача 2: Rate Limiting (API + Auth)

### Описание

Текущая реализация rate limiting в `RateLimitFilter.java` имеет три критические проблемы. Первая: используется in-memory `ConcurrentHashMap`, что не работает при горизонтальном масштабировании (несколько инстансов backend). Каждый инстанс имеет свой счётчик, и атакующий может распределить запросы между инстансами. Вторая: IP-адрес извлекается из заголовка `X-Forwarded-For` без валидации (`RateLimitFilter.java:96-105`). Атакующий может подделать заголовок и обходить rate limit. Третья: отсутствует cleanup механизм для expired windows — потенциальная утечка памяти при длительной работе.

Пользователь видит: система стабильно работает даже при DDoS-атаках. Brute-force атаки на логин блокируются автоматически. API отвечает с корректными HTTP 429 заголовками, показывающими когда можно повторить запрос.

### Сущности/Таблицы БД

Таблицы БД не требуются — rate limiting хранится в Redis.

**Структура данных в Redis:**

```
# Sliding window counter для общего API
KEY:   rate:{ip}:{window_minute}
VALUE: counter (integer)
TTL:   120 seconds (2 минуты — покрывает текущее + предыдущее окно)

# Sliding window counter для auth endpoints
KEY:   rate:auth:{ip}:{window_minute}
VALUE: counter (integer)
TTL:   120 seconds

# Временный бан IP (после превышения лимита N раз подряд)
KEY:   rate:ban:{ip}
VALUE: 1
TTL:   300 seconds (5 минут бан)

# Per-user rate limit (после аутентификации)
KEY:   rate:user:{userId}:{window_minute}
VALUE: counter (integer)
TTL:   120 seconds
```

### API Endpoints

Новых endpoint не требуется. Изменяется поведение всех существующих endpoints:

```
Все endpoints:
  Response Headers (всегда):
    X-RateLimit-Limit: 100
    X-RateLimit-Remaining: 87
    X-RateLimit-Reset: 1708300800 (Unix timestamp когда окно сбросится)

  При превышении лимита:
    HTTP 429 Too Many Requests
    Retry-After: 45 (секунды до сброса)
    Body: { "status": 429, "error": "Too Many Requests", "message": "Превышен лимит запросов. Попробуйте через {N} секунд." }

Лимиты по категориям:
  /api/auth/login:       5 req/min per IP  (brute-force защита)
  /api/auth/register:    3 req/min per IP  (spam защита)
  /api/auth/refresh:     20 req/min per IP (частый refresh нормален)
  /api/auth/**:          10 req/min per IP (остальные auth endpoints)
  /api/** (authenticated): 200 req/min per user + 100 req/min per IP
  /api/** (unauthenticated): 30 req/min per IP
```

### Экраны (UI Description)

**Frontend: обработка HTTP 429**

Файл: `frontend/src/api/client.ts` — добавить обработку в response interceptor:
- При получении 429: показать toast «Слишком много запросов. Подождите {Retry-After} секунд»
- Автоматический retry после Retry-After с exponential backoff
- Максимум 3 retry, затем показать ошибку пользователю
- Не показывать повторные toast для того же endpoint (dedup через `recentErrorToasts` Map, который уже существует)

**Admin Dashboard: мониторинг rate limiting** (опционально, Phase 2)
- Расположение: `frontend/src/modules/monitoring/` (новый модуль)
- График: запросы/мин по IP (top-10 нагруженных IP)
- Таблица заблокированных IP с причиной и временем разблокировки
- Переиспользуемые компоненты: `MetricCard`, `DataTable`

### Бизнес-правила и валидации

1. **Алгоритм Sliding Window**: использовать Redis MULTI/EXEC для атомарного инкремента. Формула: `current_window_count + previous_window_count * (1 - elapsed_fraction)`. Это точнее, чем fixed window.

2. **IP Resolution (КРИТИЧНО — исправление H13)**:
   - Использовать ТОЛЬКО `X-Real-IP` от доверенного proxy (nginx)
   - Fallback: `request.getRemoteAddr()`
   - НИКОГДА не использовать `X-Forwarded-For` напрямую (легко подделать)
   - В `application.yml` добавить: `app.rate-limit.trusted-proxies: 172.16.0.0/12,10.0.0.0/8` (Docker networks)
   - Валидировать что `X-Real-IP` приходит только от trusted proxy

3. **Graduated Response**:
   - 1-е превышение: HTTP 429 + Retry-After: 60
   - 2-е превышение за 5 мин: HTTP 429 + Retry-After: 120
   - 3-е превышение за 5 мин: временный бан IP на 5 минут (Redis key `rate:ban:{ip}`)
   - Бан IP: HTTP 429 + Retry-After: 300

4. **Whitelist**: admin может добавить IP в whitelist (для мониторинга, интеграций). Хранится в Redis SET `rate:whitelist`.

5. **Redis Fallback**: если Redis недоступен — использовать in-memory fallback (текущую реализацию), но логировать WARNING каждые 60 секунд. Не блокировать запросы из-за недоступности Redis.

6. **Cleanup**: scheduled task каждые 5 минут вызывает `cleanup()` для in-memory fallback. Redis keys имеют TTL и очищаются автоматически.

### Роли и доступ

Rate limiting применяется ко ВСЕМ ролям одинаково. Whitelist IP — только ADMIN.

### Edge Cases

1. **Легитимный офис за NAT**: 50 пользователей с одного IP. Решение: per-user rate limit (200 req/min) для аутентифицированных, per-IP (100 req/min) для неаутентифицированных.
2. **WebSocket**: не rate-limit'ить WebSocket соединения (уже исключены в `shouldNotFilter`).
3. **Health check**: `/actuator/health` исключён из rate limiting (уже сделано).
4. **File upload**: POST с multipart — считать как 1 запрос, не как N (по числу chunks).
5. **Batch API**: если появится batch endpoint — считать как 1 запрос + проверять размер batch.

### UX-эталон

**Procore API**: 3600 req/hour per user (60/min). **GitHub API**: 5000 req/hour authenticated, 60/hour unauthenticated. Наши лимиты (200/min authenticated) — более щедрые, чем Procore, что подходит для ERP с большим количеством запросов на странице.

---

## Задача 3: Input Validation & SQL Injection Prevention

### Описание

SQL Injection: проект получил оценку 9/10 за SQL injection prevention — все query параметризованы, 0 string concatenation в SQL. Однако существуют другие критические проблемы валидации ввода. Mass Assignment (P0-4): 6 контроллеров (14 методов) привязывают `@RequestBody` напрямую к JPA entity вместо DTO. Атакующий может установить `id`, `organizationId`, `createdAt`, `deleted`, `version`. XSS (P0-3): 3 файла используют `dangerouslySetInnerHTML` без санитизации. SSRF (C9): все интеграционные сервисы принимают user-configured URLs без валидации.

Также 11 POST/PUT/PATCH endpoints не имеют аннотации `@Valid`, из-за чего Jakarta Bean Validation constraints (javax.validation) не проверяются на этих endpoints.

Пользователь видит: система корректно валидирует все входные данные, показывает понятные ошибки валидации на русском языке, и не позволяет ввести вредоносные данные.

### Сущности/Таблицы БД

Новых таблиц не требуется. Требуется создание DTO-классов.

**Новые DTO (Request/Response) для 6 контроллеров с mass assignment:**

```java
// 1. ReconciliationActController (backend/.../accounting/web/dto/)
public record CreateReconciliationActRequest(
    @NotNull UUID contractId,
    @NotNull UUID counterpartyId,
    @NotNull LocalDate periodFrom,
    @NotNull LocalDate periodTo,
    @NotNull @Positive BigDecimal ourBalance,
    @NotNull @Positive BigDecimal theirBalance,
    String notes
) {}

public record UpdateReconciliationActRequest(
    @NotNull LocalDate periodFrom,
    @NotNull LocalDate periodTo,
    @NotNull @PositiveOrZero BigDecimal ourBalance,
    @NotNull @PositiveOrZero BigDecimal theirBalance,
    String notes,
    @NotNull Long version  // optimistic lock
) {}

// 2. PurchaseOrderController (backend/.../procurement/web/dto/)
public record CreatePurchaseOrderRequest(
    @NotNull UUID projectId,
    @NotNull UUID supplierId,
    @NotBlank @Size(max = 500) String description,
    LocalDate expectedDeliveryDate,
    @NotEmpty List<CreatePurchaseOrderItemRequest> items
) {}

public record CreatePurchaseOrderItemRequest(
    @NotNull UUID materialId,
    @NotBlank @Size(max = 500) String description,
    @NotNull @Positive BigDecimal quantity,
    @NotNull @Size(max = 20) String unit,
    @NotNull @Positive BigDecimal unitPrice,
    String notes
) {}

// 3. WarehouseOrderController (backend/.../warehouse/web/dto/)
public record CreateWarehouseOrderRequest(
    @NotNull UUID warehouseId,
    @NotNull UUID projectId,
    @NotBlank @Size(max = 20) String orderType, // RECEIPT, ISSUE, TRANSFER
    List<CreateWarehouseOrderItemRequest> items,
    String notes
) {}

public record CreateWarehouseOrderItemRequest(
    @NotNull UUID materialId,
    @NotNull @Positive BigDecimal quantity,
    @NotNull @Size(max = 20) String unit,
    String notes
) {}

// 4. LimitFenceSheetController (backend/.../warehouse/web/dto/)
public record CreateLimitFenceSheetRequest(
    @NotNull UUID projectId,
    @NotNull UUID contractId,
    @NotBlank @Size(max = 100) String number,
    @NotNull LocalDate periodFrom,
    @NotNull LocalDate periodTo,
    String notes
) {}

// 5. MaintenanceController (backend/.../maintenance/web/dto/)
public record CreateMaintenanceTeamRequest(
    @NotBlank @Size(max = 200) String name,
    UUID leaderId,
    List<UUID> memberIds
) {}

public record CreatePreventiveScheduleRequest(
    @NotNull UUID vehicleId,
    @NotBlank @Size(max = 50) String maintenanceType,
    @NotNull Integer intervalDays,
    @NotNull Integer intervalHours,
    LocalDate nextDueDate
) {}

// 6. DispatchController (backend/.../ops/web/dto/)
public record CreateDispatchRouteRequest(
    @NotBlank @Size(max = 200) String name,
    @NotNull UUID vehicleId,
    UUID driverId,
    @NotNull LocalDate routeDate,
    List<CreateRouteWaypointRequest> waypoints
) {}
```

### API Endpoints

Существующие endpoints без изменения URL, но с заменой `@RequestBody Entity` на `@RequestBody @Valid DTO`:

```
POST   /api/reconciliation-acts        — CreateReconciliationActRequest
PUT    /api/reconciliation-acts/{id}    — UpdateReconciliationActRequest
POST   /api/purchase-orders            — CreatePurchaseOrderRequest
PUT    /api/purchase-orders/{id}        — UpdatePurchaseOrderRequest
POST   /api/purchase-orders/{id}/items  — CreatePurchaseOrderItemRequest
PUT    /api/purchase-orders/{id}/items/{itemId} — UpdatePurchaseOrderItemRequest
POST   /api/warehouse-orders           — CreateWarehouseOrderRequest
PUT    /api/warehouse-orders/{id}       — UpdateWarehouseOrderRequest
POST   /api/warehouse-orders/{id}/items — CreateWarehouseOrderItemRequest
POST   /api/limit-fence-sheets         — CreateLimitFenceSheetRequest
PUT    /api/limit-fence-sheets/{id}     — UpdateLimitFenceSheetRequest
POST   /api/maintenance/teams          — CreateMaintenanceTeamRequest
PUT    /api/maintenance/teams/{id}      — UpdateMaintenanceTeamRequest
POST   /api/maintenance/preventive-schedules — CreatePreventiveScheduleRequest
POST   /api/dispatch/routes            — CreateDispatchRouteRequest
PUT    /api/dispatch/routes/{id}        — UpdateDispatchRouteRequest

Также добавить @Valid на 11 endpoints без неё:
  ScheduleItemController:97, CommentController:70, TelegramController:125,
  OneCController:238, SbisController:155, MaintenanceController:191/197/243,
  MessagingController:158, DispatchController:113/122
```

### Экраны (UI Description)

**1. XSS Fix — AI Assistant (`frontend/src/modules/ai/AiAssistantPage.tsx:457`)**
- Заменить custom `renderMarkdown()` + `dangerouslySetInnerHTML` на `react-markdown` с `rehype-sanitize`
- Установить: `npm install react-markdown rehype-sanitize remark-gfm`
- Код: `<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{msg.content}</ReactMarkdown>`

**2. XSS Fix — Export Jobs (`frontend/src/modules/dataExchange/ExportJobListPage.tsx:252`)**
- Убрать `dangerouslySetInnerHTML`, заменить на React-компоненты для рендеринга label maps

**3. Валидационные ошибки на формах**
- Все формы, использующие React Hook Form + Zod (уже в проекте), должны показывать inline-ошибки
- `GlobalExceptionHandler.java` уже возвращает MethodArgumentNotValidException как 400 с деталями
- Frontend должен парсить `fieldErrors` из ответа и показывать под соответствующими полями

### Бизнес-правила и валидации

**Общие правила валидации для ВСЕХ DTO:**

1. **String fields**: `@Size(max = N)` на всех строковых полях. Max 500 для name/description, 2000 для notes, 50 для codes/numbers.
2. **Money fields**: `@PositiveOrZero` для amounts, `@DecimalMax("999999999999999.99")` (15 digits + 2 decimal).
3. **UUID fields**: Jakarta `@NotNull` для обязательных, nullable для опциональных. Формат валидируется автоматически Jackson.
4. **Dates**: `@NotNull` для обязательных. `periodFrom < periodTo` — custom validator.
5. **Collections**: `@NotEmpty` для обязательных списков, `@Size(max = 1000)` для предотвращения DoS.
6. **Nested objects**: `@Valid` на вложенных DTO для каскадной валидации.

**SSRF Prevention (для интеграционных сервисов):**

```java
// Новый класс: infrastructure/security/UrlValidator.java
public class UrlValidator {
    private static final Set<String> BLOCKED_HOSTS = Set.of(
        "localhost", "127.0.0.1", "0.0.0.0", "::1",
        "metadata.google.internal", "169.254.169.254"
    );

    public static void validateExternalUrl(String url) {
        URI uri = URI.create(url);
        String host = uri.getHost();
        // Блокировать: localhost, private IPs (10.x, 172.16-31.x, 192.168.x), metadata endpoints
        if (BLOCKED_HOSTS.contains(host) || isPrivateIp(host)) {
            throw new IllegalArgumentException("URL указывает на внутренний ресурс");
        }
        // Разрешить только http/https
        if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) {
            throw new IllegalArgumentException("Разрешены только HTTP/HTTPS URL");
        }
    }
}
```

Применить в: `SbisService.java`, `OneCIntegrationService.java`, `WebDavService.java`, `SmsService.java`, `WeatherService.java`, `GovRegistryService.java`.

### Роли и доступ

Валидация применяется ко ВСЕМ ролям одинаково — это не вопрос RBAC, а вопрос data integrity.

### Edge Cases

1. **Длинный Unicode-текст**: `@Size` считает символы, не байты. UTF-8 символ может быть 4 байта. Для PostgreSQL VARCHAR(500) это ОК — PostgreSQL тоже считает символы.
2. **Zero-width characters**: могут обойти визуальную проверку. Добавить sanitizer, удаляющий zero-width characters из имён и номеров документов.
3. **JSON injection в SMS** (M10): экранировать спецсимволы в `SmsService.java:347-354` при формировании JSON для WhatsApp API.
4. **Огромный JSON body**: Spring по умолчанию лимитирует body до 2MB. Для file upload — 50MB (уже настроено в `application.yml:48-49`). Для API — добавить `spring.servlet.multipart.max-request-size: 2MB` для не-multipart запросов.
5. **MapStruct маппинг**: использовать MapStruct `@Mapper` для конвертации DTO <-> Entity. Добавить `@Mapping(target = "id", ignore = true)`, `@Mapping(target = "organizationId", ignore = true)`, `@Mapping(target = "createdAt", ignore = true)` etc.

### UX-эталон

**Procore**: все endpoints используют строгие JSON Schema для валидации. Ошибки возвращаются с `field_name` + `error_message`. **Autodesk ACC**: серверная валидация с i18n error messages.

---

## Задача 4: CORS Configuration Fix

### Описание

Текущая CORS-конфигурация в `SecurityConfig.java:96-116` имеет несколько проблем. Во-первых, `allowedOrigins` берётся из `CorsProperties`, но default-значение в `application.yml:119` содержит только localhost-адреса. При деплое в production, если переменная окружения `CORS_ALLOWED_ORIGINS` не задана или задана неправильно, API либо не работает с фронтендом (если origin не совпадает), либо открыт для всех (если используется wildcard). Во-вторых, существует дублирование CORS-конфигурации (M16): `WebConfig` и `SecurityConfig` могут конфликтовать с разными `allowedHeaders`.

Пользователь видит: система корректно работает с нескольких доменов (основной домен + staging + admin-панель), при этом блокируя запросы от неавторизованных источников.

### Сущности/Таблицы БД

Новых таблиц не требуется.

**Модификация конфигурации:**

Файл: `backend/src/main/java/com/privod/platform/infrastructure/config/CorsProperties.java`
```java
@ConfigurationProperties(prefix = "app.cors")
@Validated
public record CorsProperties(
    @NotEmpty List<String> allowedOrigins  // убрать default, сделать обязательным
) {}
```

Файл: `application.yml`
```yaml
app.cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:?CORS_ALLOWED_ORIGINS must be set}
```

### API Endpoints

Нет новых endpoints. Изменяется CORS-поведение всех endpoints.

### Экраны (UI Description)

Нет изменений UI. CORS — серверная конфигурация.

### Бизнес-правила и валидации

1. **Единая точка конфигурации**: удалить CORS из `WebConfig`, оставить ТОЛЬКО в `SecurityConfig.java`. Одна конфигурация — нет конфликтов.

2. **Allowed Origins**: строгий список доменов. Никогда `*`. Формат: `https://app.privod.ru,https://staging.privod.ru`. При development: `http://localhost:3000,http://localhost:5173`.

3. **Allowed Methods**: `GET, POST, PUT, PATCH, DELETE, OPTIONS`. Не добавлять `HEAD`, `TRACE`.

4. **Allowed Headers**: `Authorization, Content-Type, X-Requested-With, Accept, Origin, X-API-Key, Cache-Control, X-Request-ID`.

5. **Exposed Headers**: `Authorization, X-Total-Count, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After`.

6. **Max Age**: `3600` (1 час кэширования preflight — уже установлено).

7. **Allow Credentials**: `true` (необходимо для передачи cookies/Authorization header).

8. **Validation при старте**: если `CORS_ALLOWED_ORIGINS` содержит `*` — приложение не запускается с error message: «Wildcard CORS origin запрещён в production. Укажите конкретные домены.»

### Роли и доступ

Не применимо — CORS работает до аутентификации.

### Edge Cases

1. **Несколько доменов**: origin из запроса проверяется по списку, Spring CORS поддерживает это нативно.
2. **Subdomain wildcard**: НЕ поддерживать `*.privod.ru` — это позволяет XSS на любом поддомене компрометировать API.
3. **WebSocket CORS**: `/ws/**` уже в `permitAll()`, но WebSocket handshake тоже должен проверять Origin. Добавить origin-check в `WebSocketConfigurer`.
4. **API Key requests**: запросы с API Key (без cookies) тоже должны проходить CORS. Убедиться что `X-API-Key` в `allowedHeaders`.

### UX-эталон

Стандартная конфигурация, специфичных эталонов нет. Следовать OWASP CORS Cheat Sheet.

---

## Задача 5: Audit Logging (кто что когда)

### Описание

В системе уже есть базовая инфраструктура аудита: `AuditService` логирует CREATE/UPDATE/DELETE/STATUS_CHANGE, а модуль `immutableAudit` хранит хэш-цепочки записей (`ImmutableRecord`). Однако по результатам аудита безопасности выявлены критические проблемы. AuditService userId всегда NULL (H18) — userId не извлекается из SecurityContext. Отсутствует логирование READ-операций для PII-данных (H19) — нарушение 152-ФЗ. Нет аудита bulk-операций, экспорта данных, изменения ролей и прав. Отсутствует tenant isolation в `AuditLogRepository` — аудит-записи доступны cross-tenant.

Для строительной ERP аудит-лог критически важен: при спорах по КС-2, при расследовании инцидентов, при проверках Стройнадзора необходимо точно знать кто, когда и что изменил в документе.

Пользователь видит: полный журнал действий по каждому объекту (проекту, документу, акту), возможность фильтрации по пользователю/действию/периоду, экспорт журнала в PDF/Excel для проверяющих органов.

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы audit_logs (добавить недостающие колонки)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id VARCHAR(64);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_name VARCHAR(200);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS field_changes JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Новые индексы для audit_logs
CREATE INDEX CONCURRENTLY idx_audit_org ON audit_logs(organization_id, created_at DESC) WHERE deleted = FALSE;
CREATE INDEX CONCURRENTLY idx_audit_user ON audit_logs(user_id, created_at DESC) WHERE deleted = FALSE;
CREATE INDEX CONCURRENTLY idx_audit_entity ON audit_logs(entity_type, entity_id) WHERE deleted = FALSE;
CREATE INDEX CONCURRENTLY idx_audit_action ON audit_logs(action, created_at DESC) WHERE deleted = FALSE;
CREATE INDEX CONCURRENTLY idx_audit_request ON audit_logs(request_id) WHERE deleted = FALSE;

-- Таблица для хранения PII access log (отдельно, для 152-ФЗ)
CREATE TABLE pii_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- Employee, PersonalCard, SelfEmployedContractor
    entity_id UUID NOT NULL,
    access_type VARCHAR(30) NOT NULL, -- READ, EXPORT, DOWNLOAD, PRINT
    fields_accessed TEXT[], -- список полей: {passport, inn, snils, salary}
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_id VARCHAR(64)
);

CREATE INDEX idx_pii_org_date ON pii_access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_pii_entity ON pii_access_logs(entity_type, entity_id);
CREATE INDEX idx_pii_user ON pii_access_logs(user_id, accessed_at DESC);

-- Партиционирование audit_logs по месяцам (для production с большим объёмом)
-- Рекомендация: при > 10М записей перейти на партиционированную таблицу
```

### API Endpoints

```
GET /api/audit-logs
  Params: {
    entityType?: string, entityId?: UUID, userId?: UUID,
    action?: string, dateFrom?: ISO8601, dateTo?: ISO8601,
    page: int, size: int, sort: string
  }
  Response: PaginatedResponse<AuditLogEntry>
  Roles: [ADMIN, MANAGER]

GET /api/audit-logs/entity/{entityType}/{entityId}
  Response: AuditLogEntry[]  (история конкретного объекта)
  Roles: [ADMIN, MANAGER, ENGINEER] (если имеет доступ к объекту)

GET /api/audit-logs/user/{userId}
  Response: PaginatedResponse<AuditLogEntry>
  Roles: [ADMIN]

GET /api/audit-logs/export
  Params: { entityType?, userId?, dateFrom, dateTo, format: PDF|XLSX }
  Response: binary file
  Roles: [ADMIN]

GET /api/pii-access-logs
  Params: { entityType?, entityId?, userId?, dateFrom?, dateTo?, page, size }
  Response: PaginatedResponse<PiiAccessLog>
  Roles: [ADMIN]
```

### Экраны (UI Description)

**1. Страница «Журнал аудита» (Settings > Audit Log)**
- Расположение: `frontend/src/modules/settings/AuditLogPage.tsx` (новый файл)
- Фильтры (верхняя панель): Тип объекта (select), Пользователь (search + select), Действие (multi-select: Создание, Изменение, Удаление, Просмотр, Экспорт), Период (date range picker)
- Таблица: Дата/время | Пользователь | Действие | Объект | Описание | IP
- По клику на строку — detail panel справа с полным diff (old_values → new_values) в формате JSON diff viewer
- Кнопка «Экспорт» в PDF/Excel
- Компоненты: `DataTable` с server-side pagination, `FormField` для фильтров, `Modal` для деталей

**2. Timeline аудита на карточке объекта**
- На каждой detail-page (Invoice, Contract, KS-2 и т.д.) — вкладка «История изменений»
- Вертикальный timeline: время | пользователь (avatar + имя) | действие | краткое описание
- По клику — раскрывается diff
- Компонент: новый `AuditTimeline` в `frontend/src/design-system/`

**3. Доступ к PII-логу**
- Расположение: `frontend/src/modules/settings/PiiAccessLogPage.tsx`
- Только для ADMIN
- Таблица: Дата | Пользователь | Тип данных | Сотрудник | Поля | IP

### Бизнес-правила и валидации

1. **UserId fix (H18)**: извлекать из `SecurityContextHolder.getContext().getAuthentication()`. Если `CustomUserDetails` — получить `getId()`. Если API Key auth — логировать ID API Key.

2. **Действия для аудита**:
   - `CREATE` — создание объекта
   - `UPDATE` — обновление полей (с diff: old_values/new_values)
   - `DELETE` — мягкое удаление
   - `STATUS_CHANGE` — смена статуса (DRAFT → SUBMITTED → APPROVED)
   - `READ` — только для PII-сущностей (Employee, PersonalCard, SelfEmployedContractor)
   - `EXPORT` — экспорт данных (PDF, Excel, CSV)
   - `DOWNLOAD` — скачивание файлов
   - `LOGIN` / `LOGOUT` / `LOGIN_FAILED` — auth events
   - `ROLE_CHANGE` — изменение ролей пользователя
   - `PERMISSION_CHANGE` — изменение прав

3. **Field Changes**: при UPDATE записывать diff в формате:
   ```json
   {
     "fieldChanges": [
       { "field": "status", "old": "DRAFT", "new": "SUBMITTED" },
       { "field": "totalAmount", "old": "1500000.00", "new": "1750000.00" }
     ]
   }
   ```

4. **Immutable**: записи аудита НЕЛЬЗЯ удалять или изменять. `softDelete()` запрещён на уровне entity (override `softDelete()` с throw).

5. **Tenant Isolation**: все audit-запросы фильтруются по `organization_id`. Администратор видит только аудит своей организации.

6. **Retention**: хранить audit_logs минимум 5 лет (требование 152-ФЗ и строительного законодательства). pii_access_logs — минимум 3 года.

7. **Async logging**: записи аудита создаются асинхронно (через Spring `@Async` или event bus), чтобы не замедлять основной request pipeline.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр журнала аудита | Да | Да (только свой проект) | Нет | Нет | Нет |
| Просмотр истории объекта | Да | Да | Да (свои объекты) | Да (финансовые) | Нет |
| Экспорт журнала аудита | Да | Нет | Нет | Нет | Нет |
| Просмотр PII access log | Да | Нет | Нет | Нет | Нет |

### Edge Cases

1. **Большой diff**: при обновлении JSONB-поля (например, `formT2Data` в PersonalCard) — не хранить полный JSONB diff, только changed top-level keys.
2. **Batch operations**: при bulk update — создавать одну audit-запись с metadata `{"batchSize": 150, "affectedIds": [...]}`.
3. **Scheduled tasks**: системные операции (cron) — логировать с `userId = SYSTEM`.
4. **High volume**: при 100+ пользователях audit_logs растёт быстро. Партиционирование по месяцам при > 10М записей.
5. **PII в audit**: НЕ хранить значения PII-полей в `old_values`/`new_values`. Для passport/INN/SNILS записывать `"***"`. Полные значения — только в encrypted PII storage.

### UX-эталон

**Procore**: Change History на каждом объекте с timeline view и diff viewer. **1C**: журнал регистрации с фильтрацией по пользователю и объекту. Наш подход объединяет лучшее из обоих.

---

## Задача 6: Password Policy + Account Lockout

### Описание

Текущая реализация account lockout уже работает (`User.java:86-97`): после 5 неудачных попыток аккаунт блокируется на 15 минут. Таблица `users` расширена миграцией `V114__users_account_lockout.sql`. Однако отсутствует password policy: нет минимальных требований к сложности пароля (L2), нет проверки по словарю распространённых паролей (L3), нет принудительной смены пароля при первом входе (hardcoded admin123 — C4), нет истории паролей (пользователь может повторно установить тот же пароль).

Для строительной ERP с финансовыми данными и PII сотрудников слабые пароли — прямой путь к утечке данных.

Пользователь видит: при регистрации и смене пароля — визуальный индикатор силы пароля (password strength meter). Понятные требования к паролю на русском языке. При первом входе с временным паролем — обязательная смена.

### Сущности/Таблицы БД

```sql
-- Таблица истории паролей (для запрета повторного использования)
CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    password_hash VARCHAR(255) NOT NULL, -- BCrypt hash
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pwd_history_user ON password_history(user_id, created_at DESC);

-- Модификация таблицы users
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;

-- Обновить admin: пометить must_change_password = true
UPDATE users SET must_change_password = TRUE WHERE email IN ('admin@privod.ru', 'admin@privod.com');
```

### API Endpoints

```
POST /api/auth/login
  Изменения в Response: добавить поле mustChangePassword: boolean
  Если mustChangePassword = true — frontend должен редиректить на /change-password

POST /api/auth/change-password
  Request: { currentPassword: string, newPassword: string, confirmPassword: string }
  Response: { success: true }
  Валидация:
    - newPassword !== currentPassword
    - newPassword соответствует password policy
    - newPassword не совпадает с последними 5 паролями
    - confirmPassword === newPassword
  Roles: AUTHENTICATED

GET /api/auth/password-policy
  Response: {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true,
    maxRepeatingChars: 3,
    historyCount: 5,
    expirationDays: 90 (null если не используется)
  }
  Roles: PUBLIC (нужно на странице регистрации)

POST /api/admin/users/{userId}/force-password-reset
  Response: { success: true }
  Действия: устанавливает must_change_password = true
  Roles: [ADMIN]
```

### Экраны (UI Description)

**1. Password Strength Meter (компонент)**
- Новый компонент: `frontend/src/design-system/components/PasswordStrength/index.tsx`
- Визуально: горизонтальная полоса с 4 уровнями (Слабый/Средний/Хороший/Сильный)
- Цвета: красный → оранжевый → жёлтый → зелёный
- Под полосой: список требований с чекбоксами (✓ Минимум 10 символов, ✓ Заглавная буква, ...)
- Реализация: вычисление на клиенте (не отправлять пароль для проверки силы)

**2. Экран принудительной смены пароля**
- URL: `/change-password` (или модальное окно поверх dashboard)
- Если `mustChangePassword = true` после логина — редирект сюда
- Поля: Текущий пароль | Новый пароль (+ PasswordStrength) | Подтверждение нового пароля
- Кнопка «Изменить пароль» неактивна пока все требования не выполнены
- После успешной смены — редирект на dashboard

**3. Модификация страницы регистрации (`frontend/src/modules/auth/`)**
- Добавить PasswordStrength компонент к полю пароля
- Загружать policy из `GET /api/auth/password-policy`

### Бизнес-правила и валидации

1. **Минимальные требования к паролю:**
   - Длина: минимум 10 символов, максимум 128
   - Заглавная буква: минимум 1
   - Строчная буква: минимум 1
   - Цифра: минимум 1
   - Спецсимвол: минимум 1 (`!@#$%^&*()_+-=[]{}|;:,.<>?`)
   - Не более 3 повторяющихся символов подряд (aaa — запрещено)
   - Не содержит email пользователя или его части (до @)

2. **Словарь запрещённых паролей**: встроенный список из 10,000 самых распространённых паролей (password, 12345678, qwerty, admin123 и т.д.). Файл `backend/src/main/resources/common-passwords.txt`. Проверка case-insensitive.

3. **История паролей**: хранить последние 5 хэшей. При смене проверять что новый пароль не совпадает ни с одним из 5 предыдущих.

4. **BCrypt cost factor**: увеличить с 10 (default) до 12. Файл: `SecurityConfig.java:92`: `new BCryptPasswordEncoder(12)`.

5. **Принудительная смена**: admin123 → обязательная смена при первом входе. Администратор может принудительно заставить пользователя сменить пароль.

6. **Expiration (опционально)**: по умолчанию выключена. Администратор может включить для организации: `password_expires_at = NOW() + 90 days`.

7. **Account Lockout (уже реализовано, уточнения)**:
   - 5 неудачных попыток → блокировка на 15 минут (текущее поведение — OK)
   - Добавить: логирование lockout в audit_logs
   - Добавить: email-уведомление пользователю при блокировке
   - Добавить: admin может разблокировать пользователя досрочно

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Изменить свой пароль | Да | Да | Да | Да | Да |
| Принудительная смена пароля другого | Да | Нет | Нет | Нет | Нет |
| Разблокировать аккаунт | Да | Нет | Нет | Нет | Нет |
| Настроить password policy организации | Да | Нет | Нет | Нет | Нет |

### Edge Cases

1. **Миграция существующих паролей**: НЕ заставлять всех менять пароль. Только admin123 → must_change_password. Политика применяется только к новым/изменяемым паролям.
2. **API Key auth**: password policy не применяется к API Keys — у них своя генерация (уже SHA-256).
3. **OIDC/SSO users**: password policy не применяется — пароль управляется IdP.
4. **Пользователь забыл пароль**: пока нет password reset flow (отдельная задача). Админ может установить временный пароль + must_change_password.
5. **Timing attack**: при проверке `passwordEncoder.matches()` время выполнения зависит от того, является ли email валидным. BCrypt имеет built-in timing-safe comparison, но стоит добавить dummy BCrypt check для несуществующих email.

### UX-эталон

**Procore**: требует 8+ символов, uppercase, lowercase, digit. **GitHub**: password strength meter + breach database check (haveibeenpwned). Наш подход ближе к GitHub, но без внешнего API (используем локальный словарь).

---

## Задача 7: HTTPS Enforcement + Security Headers

### Описание

Текущая конфигурация nginx (`nginx/nginx.conf`) уже включает хорошую TLS-настройку: TLS 1.2+1.3, AEAD ciphers, OCSP stapling, HSTS с preload. Однако по результатам аудита выявлены проблемы: CSP позволяет `'unsafe-inline'` для стилей (M14) — это ослабляет защиту от XSS. Static assets location strips security headers (M15). Отсутствует `server_tokens off` (L7). Отсутствуют `proxy_buffer` hardening (L9). Nginx во frontend Dockerfile работает от root (M22).

Для финансовой строительной ERP с PII данными и integration с 1С, корректные security headers — обязательное требование для прохождения security audit заказчиков.

Пользователь видит: сайт загружается только по HTTPS, браузер показывает зелёный замок, все security headers корректно установлены (проверяемо на securityheaders.com, оценка A+).

### Сущности/Таблицы БД

Новых таблиц не требуется.

### API Endpoints

Нет новых endpoints. Изменяется только конфигурация nginx.

### Экраны (UI Description)

Нет изменений UI.

### Бизнес-правила и валидации

**Полная конфигурация Security Headers для nginx:**

```nginx
# === ДОБАВИТЬ в http {} блок ===
server_tokens off;  # Скрыть версию nginx (L7)

# === ОБНОВИТЬ security headers в server {} блок ===
# Все ответы (API + static)
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;

# HSTS (уже есть, проверить always)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# CSP (ОБНОВИТЬ — убрать unsafe-inline для styles)
# Tailwind CSS использует inline styles через className, не через style=""
# Но hot-reload в dev требует unsafe-inline. В production:
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' wss://$host; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
# Примечание: 'unsafe-inline' для style-src временно необходим из-за Tailwind.
# В будущем: nonce-based CSP.

# Убрать deprecated X-XSS-Protection (L6)
# Не добавлять X-XSS-Protection — он deprecated и может создать уязвимости

# === ОБНОВИТЬ location для static assets (M15) ===
location /assets/ {
    # Security headers наследуются из server {} блока благодаря 'always'
    expires 1y;
    access_log off;
    add_header Cache-Control "public, immutable" always;
    # Повторить security headers (nginx не наследует add_header в location)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
}

# === Proxy buffer hardening (L9) ===
proxy_buffer_size 16k;
proxy_buffers 4 16k;
proxy_busy_buffers_size 32k;
client_max_body_size 55m;  # Соответствует Spring multipart limit
client_body_buffer_size 128k;

# === HTTPS Redirect (если не настроено) ===
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

**Frontend Dockerfile — запуск nginx от non-root (M22):**

```dockerfile
# В frontend/Dockerfile после COPY:
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 8080
# Изменить listen с 80 на 8080 в nginx.conf внутри контейнера
```

**Backend — HTTPS enforcement в Spring:**

```java
// В SecurityConfig.java добавить:
http.requiresChannel(channel -> {
    if (isProduction()) {
        channel.anyRequest().requiresSecure();
    }
});
```

### Роли и доступ

Не применимо — security headers работают для всех пользователей.

### Edge Cases

1. **Development**: в dev-режиме CSP должен разрешать `'unsafe-eval'` для Vite hot reload. Использовать отдельный nginx.dev.conf.
2. **BIM Viewer (Three.js)**: `script-src` может потребовать `'wasm-unsafe-eval'` для WebAssembly в IFC viewer. Добавить только если needed.
3. **WebSocket**: `connect-src 'self' wss://$host` — разрешить WebSocket connections.
4. **Sentry**: если Sentry SDK загружается, добавить `https://*.sentry.io` в `connect-src`.
5. **Swagger UI**: в non-production добавить `script-src 'unsafe-inline'` для Swagger JS.

### UX-эталон

**securityheaders.com**: целевая оценка A+. **Mozilla Observatory**: целевая оценка A. Конкуренты (Procore, Autodesk) имеют A/A+ — это стандарт для enterprise SaaS.

---
