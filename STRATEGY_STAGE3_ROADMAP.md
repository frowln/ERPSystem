# ЭТАП 3: ДОРОЖНАЯ КАРТА ПРОДУКТА ПРИВОД

> **Дата:** 18 февраля 2026
> **Роль:** Chief Product Officer
> **Методология:** Синтез 6 аудитов: технический (100% codebase), UX/UI (437 TSX), безопасность (84 findings), 85 строительных процессов, конкурентный анализ (58+ решений), тренды ConTech 2025-2026
> **Предпосылки:** 2-3 fullstack-разработчика, Java Spring Boot + React 19 + PostgreSQL

---

## СОДЕРЖАНИЕ

1. [P0 -- Production Blockers (1-2 недели)](#p0--production-blockers-1-2-недели)
2. [P1 -- MVP для первых клиентов (1-2 месяца)](#p1--mvp-для-первых-клиентов-1-2-месяца)
3. [P2 -- Core Product (3-6 месяцев)](#p2--core-product-3-6-месяцев)
4. [P3 -- Market Parity (6-9 месяцев)](#p3--market-parity-6-9-месяцев)
5. [P4 -- Differentiation (9-12 месяцев)](#p4--differentiation-9-12-месяцев)
6. [P5 -- Market Leadership (12+ месяцев)](#p5--market-leadership-12-месяцев)
7. [Сводная диаграмма зависимостей](#сводная-диаграмма-зависимостей)
8. [Резюме трудозатрат](#резюме-трудозатрат)

---

## P0 -- Production Blockers (1-2 недели)

> Без исправления этих проблем система НЕ МОЖЕТ быть развёрнута даже в закрытой бета-версии с реальными данными клиентов. Каждый пункт -- прямой риск утечки данных, компрометации или юридических последствий.

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P0-01 | **Исправить MFA-плейсхолдер (TOTP)** | `MfaService.java:139` принимает ЛЮБОЙ 6-значный код как валидный. Необходимо внедрить библиотеку `com.eatthepath:java-totp` для полноценной RFC 6238 верификации. Backup-коды (line 129-134) хранятся в plaintext -- хэшировать через BCrypt. | 1 | Нет | MFA-верификация отклоняет случайные коды; backup-коды хранятся в BCrypt-хэше |
| P0-02 | **Внедрить MFA в поток логина** | `AuthService.java:46-101` выдаёт JWT сразу после проверки пароля, никогда не проверяя статус MFA. Добавить промежуточный шаг: если `mfaConfig.isEnabled()`, вернуть partial token, требующий верификации MFA. | 1 | P0-01 | Пользователь с включённым MFA не может получить полный JWT без ввода TOTP-кода |
| P0-03 | **Устранить XSS-уязвимости (3 файла)** | `AiAssistantPage.tsx:457` рендерит AI-ответы через `dangerouslySetInnerHTML` без санитизации -- XSS позволяет украсть JWT из localStorage. `ExportJobListPage.tsx:252` -- аналогичная проблема. Установить `dompurify`, обернуть все `dangerouslySetInnerHTML` через `DOMPurify.sanitize()`. | 0.5 | Нет | Zero `dangerouslySetInnerHTML` без DOMPurify; XSS-тест Semgrep проходит без findings |
| P0-04 | **Исправить Mass Assignment (6 контроллеров)** | `ReconciliationActController`, `PurchaseOrderController`, `WarehouseOrderController`, `LimitFenceSheetController`, `MaintenanceController`, `DispatchController` -- 14 методов принимают `@RequestBody` как JPA entity. Создать Request/Response DTO + MapStruct маппинг для каждого endpoint. Атакующий может установить `id`, `organizationId`, `version`, `deleted`. | 4 | Нет | Все 14 методов используют DTO; Jackson `@JsonIgnoreProperties(ignoreUnknown=true)` на всех Request DTO |
| P0-05 | **Реализовать валидацию webhook-подписей** | `IntegrationWebhookService.java:223-226` принимает любую непустую строку как валидную подпись. Реализовать HMAC-SHA256 с per-webhook секретным ключом, хранящимся в зашифрованном виде. | 0.5 | P0-11 | Webhook с неверной подписью возвращает 401; unit test проверяет отклонение поддельных payload |
| P0-06 | **Исправить React Hooks violation** | `FleetDetailPage.tsx:38-42` -- `useState` вызван после условного `return`. Переместить все хуки выше условного возврата. | 0.1 | Нет | ESLint `react-hooks/rules-of-hooks` проходит без ошибок на всех файлах |
| P0-07 | **Убрать hardcoded encryption key** | `SettingEncryptionService.java:29` -- default AES-ключ `0123456789abcdef...` используется если env-переменная не задана. Убрать default, сделать `${privod.settings.encryption-key:?must be set}`. | 0.25 | Нет | Приложение не стартует без установленного `ENCRYPTION_KEY`; key padding logic удалён |
| P0-08 | **Добавить @PreAuthorize на 13 мутирующих методов** | `CalendarEventController:185`, `TransmittalController:99`, `CrmController:208`, `DocumentController:108`, `KepController:168`, `LeaveController:101,110`, `NotificationController:98`, `PriceCoefficientController:117`, `ReportTemplateController:87`, `SupportTicketController:62,133`, `TaskController:125` -- все POST/PUT/DELETE без role-based авторизации. | 0.5 | Нет | 0 мутирующих методов без `@PreAuthorize`; integration test для каждого endpoint с unauthorized user |
| P0-09 | **Ротировать hardcoded admin пароль** | Миграции `V2` и `V76` содержат BCrypt-хэш `admin123`. Создать V115 миграцию: force password change flag на admin user. Убрать default password из `DataInitializer.java:92,104`. Сделать admin password env-variable. | 0.5 | Нет | Admin user имеет `forcePasswordChange=true`; DataInitializer читает пароль из env |
| P0-10 | **Отключить или ограничить открытую регистрацию** | `AuthService.java:104-135` -- `register()` не устанавливает `organizationId`, пользователь получает роль VIEWER и доступ к endpoints без tenant-фильтрации. Требовать invitation token с mandatory org assignment или отключить public registration. | 1 | Нет | Endpoint `/api/auth/register` требует invitation token; новый user получает organizationId из invitation |
| P0-11 | **Зашифровать credentials в БД (11+ сервисов)** | `OneCConfig.password`, `SbisConfig.password`, `OidcProvider.clientSecret`, `KepConfig.apiKey`, `WebhookConfig.secret`, `SmsConfig.apiKey`, `TelegramConfig.botToken`, `WeatherConfig.apiKey` -- всё хранится в plaintext. Реализовать JPA `AttributeConverter` с AES-GCM через уже существующий `SettingEncryptionService`. | 3 | P0-07 | Все credentials зашифрованы at rest; plaintext пароли исчезли из всех SELECT-запросов |
| P0-12 | **Убрать hardcoded JWT secret из docker-compose** | `docker-compose.yml:117` -- default JWT secret `xk8Pq2mN7v...` коммитирован в репозиторий. Заменить на `${JWT_SECRET:?must be set}`. | 0.1 | Нет | Docker Compose не запускается без установленного `JWT_SECRET` |
| P0-13 | **Исправить SSRF во всех интеграционных сервисах** | `SbisService.java:296-317`, `OneCIntegrationService.java:335-339`, `WebDavService.java:128,168`, `SmsService.java:265-276` -- user-controlled URL передаётся напрямую в `RestTemplate.exchange()`. Создать `UrlValidator` блокирующий private IP (10.x, 172.16-31.x, 192.168.x, 127.x), metadata endpoints (169.254.169.254), localhost. | 1 | Нет | UrlValidator блокирует все RFC 1918 и link-local адреса; unit test с 20+ тестовыми URL |
| P0-14 | **Сделать Project.organizationId NOT NULL** | `Project.java` -- `@Column(name = "organization_id")` без `nullable=false`. Это root entity для ~50 child entities с транзитивной tenant isolation. Flyway V115: `ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL` + backfill NULL значений. | 0.5 | Нет | Zero проектов с NULL organizationId; constraint-level enforcement |

**Итого P0: ~14 дней (2 недели)**

---

## P1 -- MVP для первых клиентов (1-2 месяца)

> Минимальный набор функций для того, чтобы 5-10 строительных компаний среднего размера (50-500 сотрудников) начали ежедневно использовать систему. Основан на процессах #19, #24, #25, #27, #57, #60, #65, #66 из карты строительных процессов.

### P1-A: Tenant Isolation (фундамент мультитенантности)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P1-01 | **Внедрить Hibernate @Filter для tenant isolation** | Создать `@FilterDef("tenantFilter")` на `BaseEntity` с автоматической активацией через `TenantInterceptor` на каждый HTTP-запрос. Это обеспечит infrastructure-level tenant isolation вместо ручных проверок в 124 сервисах. Бэкенд: `BaseEntity.java`, новый `TenantFilter.java`, `TenantInterceptor.java`. | 5 | P0-14 | Все SELECT-запросы автоматически фильтруются по organizationId; cross-tenant запрос невозможен |
| P1-02 | **Добавить organizationId к критическим entities (финансы + PII)** | Миграция V116: добавить `organization_id` к ~45 CRITICAL entities: `Budget`, `BudgetItem`, `Payment`, `Invoice`, `InvoiceLine`, `CashFlowEntry`, `PayrollTemplate`, `PayrollCalculation`, `CostCode`, `Commitment`, `CostForecast`, `CashFlowProjection`, `Estimate`, `Ks2Document`, `Ks3Document`, `Timesheet`, `Vacation`, `SickLeave`, `BusinessTrip`, `StaffingTable`, `OneCConfig`, `SbisConfig`, `KepCertificate`, `KepSignature`, `ApiKey`, `WebhookConfig`, `AiConversation`, `Channel`, `Message`, `Notification`, `WorkOrder`, `DispatchOrder`, `DispatchRoute`, `DailyReport`, `DocumentContainer`, `Transmittal`, `Dashboard`, `SavedReport`, `KpiDefinition`, `ImportJob`, `ExportJob`, `CalendarEvent`, `WorkCalendar`, `Comment`, `Activity`. Backfill через связь с Project/Employee/Organization. | 8 | P1-01 | 0 entities из списка без organizationId; SELECT COUNT подтверждает backfill = 100% |
| P1-03 | **Исправить phantom tenant isolation (6 сервисов)** | `ContractExtService`, `TimesheetService:220-224`, `CrewService`, `GeneralJournalService:183-186`, `EvmSnapshotService:61,67`, `WbsNodeService` -- вызывают `requireCurrentOrganizationId()` но не используют результат в queries. Провязать orgId до repository-level. | 2 | P1-01 | Каждый из 6 сервисов передаёт orgId в repository query; integration test проверяет cross-tenant блокировку |
| P1-04 | **Заменить @RequestParam organizationId на SecurityContext** | 10 эндпоинтов (`EmployeeController:49`, `TelegramController:69`, `PortfolioController:63/79/135/193`, `ProjectController:60`, `RevenueContractController:45`, `SearchController:44`, `AutoApprovalRuleController:48`) принимают organizationId как параметр от клиента -- атакующий может подставить чужой orgId. | 1 | Нет | Zero эндпоинтов с `@RequestParam organizationId`; orgId извлекается из SecurityContext |
| P1-05 | **Подключить ProtectedRoute ко всем route-файлам** | `projectRoutes`, `warehouseRoutes`, `operationsRoutes`, `qualityRoutes`, `hrRoutes` -- не используют `ProtectedRoute`. Только `financeRoutes` и `settingsRoutes` защищены. Обернуть все route-файлы в `ProtectedRoute` с соответствующими ролями из `routePermissions.ts`. | 1 | Нет | 100% route-файлов используют ProtectedRoute; unauthorized user видит 403 при прямом переходе |

### P1-B: Биллинговый цикл (КС-2/КС-3 -- процесс #27)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P1-06 | **Доработать форму КС-2: per-line НДС + валидация** | Бэкенд: `Ks2Document` entity существует, `ClosingDocumentService` имеет CRUD. Фронтенд: `FormKs2Page.tsx` существует, но НДС hardcoded `totalAmount * 0.2` без per-line отображения, нет валидации обязательных полей (workName, qty > 0), нет пустых строк. Добавить per-line НДС, валидацию Zod, проверку суммы НДС. | 3 | Нет | КС-2 с корректным per-line НДС; Zod-валидация блокирует сохранение без обязательных полей |
| P1-07 | **Печать КС-2/КС-3: CSS @media print** | Ни один документ в системе не имеет print stylesheet. КС-2 ОБЯЗАН печататься на A4 для регуляторного compliance. Создать `@media print` стили для `FormKs2Page`, `FormKs3Page`, обеспечить правильные разрывы страниц, нумерацию, формат РД-11-02. | 2 | P1-06 | Ctrl+P на КС-2 выдаёт корректный A4 с шапкой, подвалом и подписями; формат соответствует Постановлению Госкомстата 100 |
| P1-08 | **Связка КС-2 с объёмами работ (#25)** | Бэкенд: entities `WorkVolumeRecord`, `WbsNode` существуют. Сервис `WbsNodeService` реализован. Фронтенд: `Ks6CalendarPage.tsx` существует, но нет pipe от объёмов к КС-2. Добавить кнопку "Заполнить из объёмов" на FormKs2Page: автоматическое подтягивание cumulative quantities из field module для выбранного периода. | 4 | P1-06 | Кнопка "Заполнить из объёмов" подтягивает данные из WbsNode/WorkVolume; ручной ввод сокращается на 80% |
| P1-09 | **КС-3 с предпросмотром КС-2** | Фронтенд: `FormKs3Page.tsx` существует, но при выборе КС-2 для включения не показывает line items. Добавить inline-предпросмотр выбранных КС-2 перед формированием КС-3 summary. | 2 | P1-06 | Модальное окно показывает line items КС-2 перед включением; бухгалтер видит детали до подтверждения |

### P1-C: Управление проектами (процессы #19, #24)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P1-10 | **Ежедневный журнал работ: "Копировать из вчера" + фото** | Бэкенд: `DailyReport` entity существует, `DailyLogService` реализован. Фронтенд: `DailyLogCreatePage.tsx` -- нет кнопки "Копировать из вчера", нет inline-загрузки фото. Добавить `copyFromPrevious()` для Weather, WorkAreas, Workforce + интеграцию FileUpload для фото. Время заполнения журнала: с 15-35 мин до 5-10 мин. | 3 | P1-14 | Кнопка "Копировать" заполняет 70%+ полей из предыдущего дня; фото прикрепляются inline |
| P1-11 | **Учёт объёмов работ с привязкой к WBS (#25)** | Бэкенд: `WbsNode`, `WbsNodeService` существуют. Фронтенд: страница учёта объёмов существует частично в PTO-модуле. Создать выделенный UI для ежедневного ввода выполненных объёмов с привязкой к WBS-узлам и автоматическим расчётом % готовности. | 5 | Нет | Прораб вводит объёмы за день с привязкой к WBS; % готовности пересчитывается автоматически; данные доступны для КС-2 |
| P1-12 | **Автосохранение форм (useFormDraft на все критические формы)** | Хук `useFormDraft.ts` существует, но используется только на 3 страницах. Подключить ко всем формам >5 полей: KS-2, Daily Log, Purchase Request, Invoice, Employee, Project Setup. Потеря данных при навигации -- критическая боль для всех персон. | 2 | Нет | Все формы >5 полей авто-сохраняют черновик в localStorage; toast "Восстановлен черновик" при возврате |

### P1-D: Финансовый блок (процессы #57, #60)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P1-13 | **Стандартизировать форматирование денежных сумм** | `formatMoney()` используется неконсистентно: некоторые страницы показывают raw numbers, `PaymentFormPage` не отображает символ валюты, `BudgetFormPage` не показывает разделитель тысяч при вводе. Создать `formatMoneyPrecise()` с 2-decimal копеечной точностью, `tabular-nums` CSS, символ рубля. Применить ко ВСЕМ 40+ страницам с денежными суммами. | 2 | Нет | Единый формат "1 234 567,89 руб." на всех страницах; `tabular-nums` на всех таблицах с суммами |
| P1-14 | **Компонент FileUpload/Dropzone** | Критический missing компонент (аудит UX/UI: CRITICAL). Нужен для: BIM-модели, документы, фото daily log, инспекции, КС-2 приложения. Бэкенд: MinIO/S3 уже настроен, Apache Tika для content sniffing. Фронтенд: компонент полностью отсутствует. Создать с drag-drop, progress bar, preview, multiple files, type validation. | 3 | Нет | Компонент `<FileUpload>` в design system; используется на Daily Log, Documents, Inspections; поддержка drag-drop и multiple files |
| P1-15 | **Компонент Combobox/Autocomplete** | Аудит UX/UI: CRITICAL missing component. Все select-поля используют нативный `<select>` -- непригодно для 100K+ записей (материалы, контрагенты, сотрудники). Создать searchable Combobox с debounced API-поиском, клавиатурной навигацией, виртуализацией списка. | 3 | Нет | Компонент `<Combobox>` в design system; замена нативных `<select>` для материалов, контрагентов, сотрудников |
| P1-16 | **Компонент DatePicker** | Аудит UX/UI: CRITICAL missing component. Raw `<input type="date">` -- разное поведение в браузерах, нет calendar UI, неприемлем для Android. Создать DatePicker с календарной сеткой, диапазонами, keyboard navigation. | 3 | Нет | Компонент `<DatePicker>` в design system; единообразный calendar UI во всех браузерах |

### P1-E: Документооборот (процессы #65, #66)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P1-17 | **Фронтенд для лимитно-заборных карт (LimitFenceSheet)** | Бэкенд: `LimitFenceSheetController` -- 9 полноценных API endpoints (CRUD + issue/return/close). Фронтенд: ZERO -- нет страниц, маршрутов, API-клиента, пункта навигации. Процесс #36 (М-29). Создать: ListPage (с фильтрами по статусу, проекту, материалу), DetailPage (remaining limit, history), FormPage (выдача/возврат), routes, API client functions. | 5 | P1-15 | 4 страницы (list/detail/form/close); 9 API endpoints подключены; навигация в Warehouse группе |
| P1-18 | **Фронтенд для складских ордеров (WarehouseOrder)** | Бэкенд: `WarehouseOrderController` -- 9 endpoints (CRUD + items + confirm/cancel). Фронтенд: ZERO. Процесс #34. Создать: ListPage, DetailPage, FormPage (с позициями), confirm/cancel actions. | 4 | P1-15 | 3 страницы (list/detail/form); confirm/cancel workflow работает; интеграция с MovementFormPage |
| P1-19 | **Audit trail: метаданные "изменено кем/когда" на detail-страницах** | Аудит UX/UI: audit trail = 2/10 (Natalia persona). `BaseEntity` имеет `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, но ни одна detail-страница не отображает эти данные. `AuditService.userId` всегда NULL (`AuditService.java:28`). Исправить AuditService + добавить footer на все detail-страницы. | 2 | Нет | Каждая detail-страница показывает "Создано: [user] [date], Изменено: [user] [date]"; AuditService записывает корректный userId |

### P1-F: Data Integrity

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P1-20 | **Исправить race conditions (13 check-then-act)** | `JournalService:50-53`, `FixedAssetService:55-58`, `EnsService:78-81`, `CounterpartyService:49-52`, `BidScoringService:252-258`, `CommitmentService:273`, `CrewService`, `PricingService:63`, `TelegramWebhookService:76-81`, `RfiService:224-228`, `IssueService:224-228`, `LimitFenceSheetService`, `DispatchService:33`. Добавить UNIQUE constraints на DB-level + ON CONFLICT handling. Для sequence generation использовать PostgreSQL sequences. | 3 | Нет | UNIQUE constraints на все 13 паттернов; unit test с concurrent inserts проходит без DuplicateKeyException |
| P1-21 | **Добавить @Valid на 11 эндпоинтов** | `ScheduleItemController:97`, `CommentController:70`, `TelegramController:125`, `OneCController:238`, `SbisController:155`, `MaintenanceController:191/197/243`, `MessagingController:158`, `DispatchController:113/122`. Jakarta Bean Validation constraints не проверяются. | 0.5 | Нет | @Valid на всех 11 endpoints; невалидный JSON возвращает 400 с деталями ошибок |
| P1-22 | **Использовать SecureRandom в SmsService** | `SmsService.java:141` -- `Random` вместо `SecureRandom` для генерации verification codes. Предсказуемые коды подтверждения. | 0.1 | Нет | `SecureRandom` в SmsService; unit test проверяет непредсказуемость |

**Итого P1: ~63.6 дней (~13 недель при 1 разработчике, ~6-7 недель при 2)**

---

## P2 -- Core Product (3-6 месяцев)

> 80% ежедневных потребностей строительной компании. Добавление модулей качества, безопасности, техники, складских улучшений и интеграции с 1С.

### P2-A: Качество (#51-55)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P2-01 | **Расширить модуль инспекций: чек-листы по этапам (#51)** | Бэкенд: `QualityCheck` entity, `QualityCheckService`, `QualityCheckRepository` существуют. Но `QualityCheck` не имеет organizationId (аудит: CRITICAL). Фронтенд: `InspectionFormPage.tsx`, `QualityCheckDetailPage.tsx` -- создание только через модальное окно, нет полноценных чек-листов. Добавить: шаблоны чек-листов по типу работ, привязка к WBS-этапу, статус pass/fail per item, mandatory photo attachment. | 5 | P1-01, P1-02 | Шаблоны чек-листов для 10+ типов работ; инспекция привязана к WBS; процент прохождения автоматически |
| P2-02 | **Реестр дефектов с фотофиксацией (#53)** | Бэкенд: `NonConformanceService`, `Defect` entity существуют. Но не имеют organizationId. Фронтенд: `PunchItemCreateModal.tsx`, `PunchlistItemDetailPage.tsx`, `QualityBoardPage.tsx` -- базовая функциональность. Расширить: привязка дефекта к чертежу/плану (pin on drawing), обязательная фотография, severity classification, countdown до deadline. Конкурент-benchmark: PlanRadar, Fieldwire. | 5 | P1-14, P2-01 | Дефект создаётся с фото + pin на чертеже за <2 минуты; severity coloring; deadline countdown |
| P2-03 | **Отслеживание устранения замечаний (#55)** | Бэкенд: базовая логика в `PunchItem` entity. Фронтенд: `PunchlistItemDetailPage.tsx`. Добавить: workflow Reported -> Assigned -> In Progress -> Verification -> Closed, повторная инспекция (re-inspection loop), привязка к ответственному подрядчику, dashboard "Открытые замечания по подрядчику/проекту". | 3 | P2-02 | Lifecycle workflow с 5 статусами; dashboard группирует по подрядчику; SLA-таймер на каждый дефект |

### P2-B: Безопасность (#44-50)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P2-04 | **Журнал инструктажей по ОТ (#46)** | Бэкенд: `SafetyBriefing` entity может существовать в safety module, но frontend аудит показывает только `SafetyIncidentFormPage.tsx`, `SafetyInspectionFormPage.tsx`. Необходимо создать digital briefing journal: 5 типов инструктажей (вводный, первичный, повторный, внеплановый, целевой), auto-scheduling повторных, мобильная подпись, формат ГОСТ 12.0.004-2015. | 6 | P1-01, P1-14 | 5 типов инструктажей; auto-scheduling повторных каждые 6 мес; штраф 130 000 руб. за работника без инструктажа -- система блокирует допуск |
| P2-05 | **Матрица допусков и сертификаций (#44)** | Бэкенд: HR module имеет `Employee` entity с certifications. Фронтенд: `EmployeeDetailPage.tsx` показывает базовую информацию. Создать: certification matrix с multi-level expiry alerts (90/60/30/7 дней), типы сертификатов (Ростехнадзор, электробезопасность, высотные работы, медосмотр), блокировка допуска на площадку при истёкшем сертификате. | 5 | Нет | Dashboard сертификаций: цветовая индикация (зелёный/жёлтый/красный); email/push за 30 дней до истечения |
| P2-06 | **Расширить модуль инцидентов (#47): форма Н-1** | Бэкенд: safety module существует. Фронтенд: `SafetyIncidentCreateModal.tsx`, `SafetyIncidentDetailPage.tsx`, `IncidentInvestigateWizard.tsx` -- хорошая база (8/10 в аудите). Добавить: формат формы Н-1, автоматическая генерация уведомлений (24 часа для тяжёлых/смертельных), привязка фото-доказательств, witness statements. | 3 | P1-14 | Форма Н-1 генерируется в PDF; auto-notification для тяжёлых инцидентов; compliance с ТК РФ ст.227-231 |
| P2-07 | **Предписания надзорных органов (#48)** | Новая функциональность. Создать entity `RegulatoryPrescription` + CRUD + frontend. Трекинг предписаний от ГИТ, Ростехнадзор, Стройнадзор, МЧС: дата получения, deadline, ответственный, статус, countdown timer, escalation при приближении deadline. | 4 | P1-01 | Dashboard предписаний с countdown; автоэскалация за 7/3/1 день до deadline; 0 просроченных предписаний |

### P2-C: Техника и флот (#38-42)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P2-08 | **Электронные путевые листы (#40)** | Бэкенд: `Vehicle` entity, `FleetVehicle*` pages существуют. Но путевые листы (Приказ Минтранса 390/159) -- не реализованы. Создать entity `Waybill` + service + controller + frontend form. Поля: водитель, маршрут, пробег start/end, моточасы, расход ГСМ, медосмотр (checkbox), механик (checkbox). | 5 | P1-16, P1-15 | Электронный путевой лист: создание за <3 мин; расход ГСМ рассчитывается автоматически по нормативам |
| P2-09 | **Учёт моточасов и калькуляция машино-часа (#42)** | Бэкенд: `MaintenanceRecord` существует, fleet module реализован. Добавить: entity `EquipmentUsageLog` (date, hours, project, operator), калькулятор машино-часа (амортизация + ГСМ + ТО + страховка + оператор), сравнение own vs rent. Фронтенд: страница "Стоимость эксплуатации" с формулой МДС 81-3.2001. | 4 | Нет | Machine-hour rate рассчитывается автоматически; own-vs-rent dashboard; привязка к проектным бюджетам |
| P2-10 | **Графики ТО (#41)** | Бэкенд: `MaintenancePage.tsx` (fleet) существует, `MaintenanceController` реализован. Добавить: preventive maintenance scheduling по моточасам/пробегу, автонапоминания, history log, compliance tracking (техосмотр, страховка ОСАГО/КАСКО). | 3 | P2-09 | Календарь ТО с auto-напоминаниями; overdue ТО выделен красным; compliance трекер |

### P2-D: Складские улучшения (#34-37)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P2-11 | **Сканер штрих-кодов для склада** | Аудит UX/UI: Sergey (Foreman) -- 3/10. `MovementFormPage.tsx` требует ручного выбора материала из 300+ позиций. Интегрировать camera-based barcode/QR scanner (browser API или `@nickvdyck/barcode-scanner`). Автозаполнение material lookup по штрих-коду. | 3 | Нет | Camera scanner на MovementFormPage; материал определяется за <2 сек; mobile-first |
| P2-12 | **Quick Confirm для мобильного склада** | Аудит UX/UI: "6 scroll events per receipt" -- неприемлемо для поля. Создать режим "Быстрая приёмка": floating full-width кнопка "Подтвердить", минимум полей (scan + qty + confirm), 2-шаговый flow вместо 6-секционной формы. | 2 | P2-11 | Приёмка материала: scan -> qty -> confirm за <30 сек; floating кнопка на mobile |
| P2-13 | **Межобъектные перемещения (#35)** | Бэкенд: `StockMovement` entity, `StockMovementService` -- имеют transfer type. Фронтенд: `MovementFormPage.tsx` -- тип перемещения существует, но нет удобного UI для inter-site transfers. Добавить: dedicated "Межобъектное перемещение" flow с выбором source/destination projects, автоматическим созданием документов на обоих складах. | 3 | Нет | Одна операция создаёт расход на source и приход на destination; баланс сходится; документы привязаны |

### P2-E: Интеграция с 1С

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P2-14 | **Двусторонняя интеграция с 1С: контрагенты и номенклатура** | Бэкенд: `OneCIntegrationService`, `OneCDataExchangeService`, `OneCConfig` entity -- существуют, но credentials в plaintext (исправлено в P0-11). Фронтенд: `IntegrationsPage.tsx` (8.4/10 -- лучшая settings page). Реализовать: REST API обмен контрагентами (двусторонний), номенклатурой (из 1С), справочниками. fullSync в одной @Transactional -- разбить на chunks. | 7 | P0-11, P0-13 | Контрагенты синхронизируются каждые 15 мин; номенклатура из 1С доступна в ПРИВОД; расхождения <1% |
| P2-15 | **Интеграция с 1С: документы КС-2/КС-3** | Расширить `OneCDataExchangeService`: автоматическая выгрузка подписанных КС-2/КС-3 в 1С для проводок. Двусторонний статус: "Проведено в 1С" отображается в ПРИВОД. | 5 | P2-14, P1-06 | КС-2/КС-3 автоматически появляются в 1С после подписания в ПРИВОД; статус "Проведено" обновляется |
| P2-16 | **Фронтенд для Pricing Integration** | Бэкенд: `PricingController` -- 10 endpoints (databases, rates, indices, calculate). Фронтенд: ZERO. Создать UI для управления сметными базами, поиска расценок, загрузки CSV с коэффициентами (#16), калькуляции по индексам Минстроя. | 5 | P1-15 | 3 страницы (databases/rates/calculate); CSV import работает; поиск расценок <1 сек |

### P2-F: Тестирование и Performance

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P2-17 | **Backend unit tests: покрытие критических сервисов** | Текущее покрытие: 1 файл (`BidScoringServiceTest.java`). Написать тесты для 20 критических сервисов: `InvoiceService`, `PaymentService`, `BudgetService`, `ProcurementService`, `StockMovementService`, `EmployeeService`, `AuthService`, `MfaService`, `TimesheetService`, `Ks2/Ks3Service` и др. Минимум 200 unit tests. | 10 | Нет | >200 backend unit tests; coverage >40% для критических сервисов; CI блокирует merge при failing tests |
| P2-18 | **JOIN FETCH для TOP-20 hot-path repositories** | 0 JOIN FETCH во всех 434 repos -- системная N+1 проблема. Добавить `@EntityGraph` или JPQL JOIN FETCH для: InvoiceRepository, PaymentRepository, EmployeeRepository, ProjectRepository, ContractRepository, PurchaseRequestRepository, StockEntryRepository, WbsNodeRepository, DailyLogRepository, TimesheetRepository (и ещё 10 самых используемых). | 4 | Нет | API response time для list endpoints снижается на 50-70%; SQL log показывает 1 query вместо N+1 |
| P2-19 | **Конвертация unbounded List в Page** | ~60 методов возвращают `List<>` без пагинации для потенциально огромных наборов. Приоритет: `WbsNodeRepository.findByProjectId`, `StockEntryRepository.findLowStockEntries`, `DailyLogRepository.findProjectTimeline`, `VehicleRepository` (11 методов), `AccountEntryRepository`, `CrewAssignmentRepository`. | 3 | Нет | Все 20 критичных endpoints возвращают `Page<>` с max 100 элементов; `Pageable.unpaged()` полностью устранён |

**Итого P2: ~85 дней (~17 недель при 1 разработчике, ~9 недель при 2)**

---

## P3 -- Market Parity (6-9 месяцев)

> Паритет с конкурентами (Адепт, 1С:УСО, Procore). Полный документооборот с e-подписями, закрытие и гарантия, продвинутые финансы, мобильное приложение, субподрядный портал.

### P3-A: Документооборот с электронными подписями (#65-70)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P3-01 | **Полноценные маршруты согласования (#66)** | Бэкенд: approval workflow infrastructure существует частично (PurchaseRequest имеет approval flow). Создать универсальный `ApprovalWorkflowEngine`: configurable multi-step approval chains, parallel/sequential approvers, SLA timers, auto-escalation, delegation. Применить ко ВСЕМ документам: КС-2, КС-3, invoices, contracts, purchase orders. | 8 | Нет | Конфигурируемые цепочки согласования; SLA-таймеры; auto-escalation; один engine для всех типов документов |
| P3-02 | **Интеграция КЭП с КриптоПро (#67)** | Бэкенд: `KepController`, `KepSignature`, `KepCertificate` entities существуют. `KepSignWizard.tsx` -- фронтенд wizard есть. Но: plaintext API keys, cross-tenant доступ к сертификатам. Доработать: реальная интеграция с КриптоПро CSP, формирование PKCS#7 подписи, МЧД support, валидация сертификата через OCSP. | 7 | P0-11, P1-02 | КЭП-подпись на КС-2/КС-3 юридически значима; валидация через OCSP; формат 63-ФЗ |
| P3-03 | **Интеграция с ЭДО (СБИС/Диадок)** | Бэкенд: `SbisService.java` существует, `SbisConfig` с credentials. Расширить: отправка подписанных КС-2/КС-3 через СБИС API, получение входящих документов, статусы доставки/подписания, автоматическое сопоставление с контрагентами. | 6 | P0-11, P3-02, P2-14 | КС-2/КС-3 отправляются в ЭДО одним кликом; статус "Доставлено"/"Подписано" обновляется в реальном времени |
| P3-04 | **Версионирование документов (#69)** | Бэкенд: `DocumentContainer`, `RevisionSet` entities существуют в CDE module. Фронтенд: `DocumentContainerDetailPage.tsx` реализован. Расширить: visual diff между версиями, approval per version, lock/unlock для редактирования, mandatory checkout, history timeline. | 4 | Нет | Visual timeline версий; diff между версиями; принудительный checkout; "final_final_v3" больше невозможен |
| P3-05 | **Архивирование и сроки хранения (#70)** | Новая функциональность. Entity `ArchivePolicy` + настраиваемые сроки хранения по типу документа (125-ФЗ, Приказ Росархива 77). Автоматическое перемещение в архив по истечении active period. Полнотекстовый поиск по архиву. | 4 | P3-04 | Политики архивирования по типам; auto-archive; полнотекстовый поиск по архиву; compliance с 125-ФЗ |

### P3-B: Закрытие и гарантия (#71-75)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P3-06 | **Исполнительная документация (#71)** | Бэкенд: `HiddenWorkActController` (9 endpoints) -- ZERO frontend. `Ks11AcceptanceActController` -- ZERO frontend. `PtoDocumentService`, `ActOsvidetelstvovanieService` существуют. Создать: progressive documentation tracker привязанный к WBS, checklist required documents per work type, completion % dashboard, quality gate blocking WBS progression. | 8 | P1-11, P2-01 | Dashboard: % комплектности ИД по разделам; quality gate блокирует закрытие этапа без ИД; one-click генерация пакета для Стройнадзора |
| P3-07 | **Акты скрытых работ (АОСР) (#26)** | Бэкенд: `ActOsvidetelstvovanieRepository`, `ActOsvidetelstvovanieService` существуют. Фронтенд: `PtoDocumentFormPage.tsx` -- базовая форма. Расширить: формат РД-11-02-2006, 3-day advance notification to inspection parties (auto-email), mandatory photo/geodetic attachment, multi-party КЭП signing workflow. | 5 | P3-02, P1-14 | АОСР: auto-notification за 3 дня; формат РД-11-02; multi-party signing; привязка фото |
| P3-08 | **Гарантийные обязательства (#75)** | Новая функциональность. Entity `WarrantyObligation` (project, contractor, start_date, end_date, scope, claims). CRUD + frontend: list/detail/form. Dashboard гарантий по проектам с countdown до окончания. Связь с дефектами (P2-02) для warranty claims. | 5 | P2-02, P2-03 | Dashboard гарантий: active/expiring/expired; связь claim -> defect -> contractor; auto-notification за 30 дней до окончания |
| P3-09 | **Пусконаладочные работы и акт ввода (#56, #73)** | Бэкенд: `CommissioningChecklistService` существует. Расширить: configurable checklists по системам (HVAC, электрика, водоснабжение и т.д.), multi-party sign-off, привязка к ЗОС (заключение о соответствии). Frontend: dashboard систем с % ready. | 5 | P3-06 | Чек-листы по 10+ системам; подписание комиссией; генерация ЗОС-документа |

### P3-C: Продвинутые финансы (#59, #62, #63, #78)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P3-10 | **Прогнозирование денежного потока (#59)** | Бэкенд: `CashFlowProjectionService`, `CashFlowEntry` entity существуют, но без tenant isolation. Фронтенд: `CashFlowPage.tsx` -- базовый вид. Расширить: rolling 12-month forecast, integration с committed costs (PO/contracts), payment calendar, what-if scenarios, variance to forecast. | 5 | P1-01, P1-02 | 12-month rolling forecast; variance chart; what-if сценарии "если задержка платежа 30 дней" |
| P3-11 | **Прогнозирование прибыльности (#62)** | Бэкенд: `RevenueRecognitionPeriodService` существует. Фронтенд: `RevenueDashboardPage.tsx`, `RevenuePeriodsPage.tsx`. Расширить: WIP schedule (work-in-progress), profit fade detection (margin erosion over time), EAC/ETC per project, portfolio profitability view. | 5 | Нет | Profit fade alert при снижении margin >5%; EAC обновляется автоматически; portfolio view для CEO |
| P3-12 | **Полноценный EVM Dashboard (#78)** | Бэкенд: `EvmSnapshotService`, `EvmSnapshotRepository` -- существуют, но phantom tenant isolation. Фронтенд: `EvmDashboardPage.tsx` -- базовые gauges. Расширить: S-curve с confidence bands, CPI/SPI trend charts, TCPI calculator, drill-down to WBS level, forecasting (EAC, VAC, IEAC). Benchmark: Primavera P6. | 5 | P1-03, P1-11 | S-curve с реальными данными; CPI/SPI тренды за 6+ периодов; TCPI показывает требуемую производительность |
| P3-13 | **Управление изменениями (#18)** | Бэкенд: change management entities существуют. Фронтенд: `ChangeEventCreateModal.tsx`, `ChangeEventDetailPage.tsx`, `ChangeOrderDetailPage.tsx`, `ChangeOrderFormPage.tsx` -- полный набор. Расширить: integrated estimating (пересчёт по тем же нормативам), schedule impact link (привязка к CPM), budget impact visualization, trend analysis. | 4 | P2-16 | Change order с auto-recalculation по ГЭСН/ФЕР; impact на бюджет виден в реальном времени |

### P3-D: Мобильное приложение

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P3-14 | **Touch targets 44x44px + mobile card view** | Аудит UX/UI: Sergey (Foreman) 3/10. Все кнопки и чекбоксы <44px. DataTable checkboxes ~20px. Увеличить все interactive элементы до WCAG 2.5.5 minimum. Floating action buttons на mobile. | 3 | Нет | 100% interactive элементов >= 44x44px; Lighthouse accessibility score >= 90 |
| P3-15 | **Полноценный offline режим** | Бэкенд: WebSocket через STOMP/SockJS. Фронтенд: `offlineQueue.ts`, `sw.js` -- базовый PWA. Расширить: offline draft для Daily Log, Inspections, Stock Receipts. Background sync при восстановлении связи. Offline indicator в TopBar. Queue management UI. | 5 | Нет | Daily Log, Inspection, Stock Receipt работают без интернета; sync при восстановлении; 0 потерь данных |
| P3-16 | **Messaging мобильная версия** | Аудит UX/UI: Messaging 3.5/10 на mobile (3-column layout unusable на 375px). Реализовать modal-based threads: channel list -> conversation -> message input. | 3 | Нет | Messaging работает на 375px; modal-based navigation; touch-friendly ввод |

### P3-E: Субподрядный портал

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P3-17 | **Портал субподрядчика (self-service)** | Бэкенд: `PortalUser`, `PortalAuthService` entities существуют. Фронтенд: нет отдельного портала. Создать: отдельный frontend entry point для субподрядчиков. Функции: загрузка документов (сертификаты, лицензии), просмотр назначенных задач, отчётность о выполнении, КС-2 drafts, коммуникация с генподрядчиком. Ограниченный доступ -- только к своим проектам. | 8 | P1-01, P3-02 | Субподрядчик может загрузить сертификаты, видеть задачи, создавать draft КС-2; no access к чужим данным |

**Итого P3: ~90 дней (~18 недель при 1 разработчике, ~9-10 недель при 2)**

---

## P4 -- Differentiation (9-12 месяцев)

> Killer features, которые делают ПРИВОД очевидным выбором перед конкурентами. Автогенерация КС-2 из полевых данных, движок safety compliance, прогрессивная ИД с quality gates, мульти-проектный оптимизатор ресурсов.

### P4-A: Автогенерация КС-2 из полевых данных (Opportunity #1)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P4-01 | **Pipeline: Daily Log -> Volume -> КС-6а -> КС-2** | Создать end-to-end data pipeline: система подтягивает tracked volumes из field module (#25), ценит по встроенной базе ФСНБ-2022 с текущими квартальными индексами (#16), генерирует compliant КС-2, маршрутизирует для КЭП, формирует КС-3, выгружает в 1С. ONE CLICK monthly КС-2 generation. Цель: сократить billing cycle с 30 дней до 5 дней. | 10 | P1-06, P1-08, P2-15, P2-16, P3-02 | КС-2 генерируется одним кликом; сметчик проверяет и утверждает; zero manual data entry; billing cycle <7 дней |
| P4-02 | **Встроенная сметная база ГЭСН/ФЕР/ТЕР** | Процесс #14 -- один из 6 абсолютных must-have. Ни один облачный конкурент в РФ не имеет полноценных сметных баз. Реализовать: импорт нормативных баз ФСНБ-2022, поддержка ресурсно-индексного метода (РИМ), автоматическое обновление квартальных индексов Минстроя, калькуляция локальных смет. | 15 | P2-16 | Импорт ФСНБ-2022; расчёт по РИМ; автоматические квартальные индексы; калькуляция локальной сметы за 30 мин vs 4 часа в GrandSmeta |
| P4-03 | **OCR распознавание сметных документов** | Бэкенд: `OcrController` -- endpoints существуют, но ZERO frontend. Использовать для: сканирование бумажных смет, автораспознавание позиций КС-2, извлечение объёмов из Excel-файлов. Apache Tika уже в стеке. | 5 | P4-02, P1-14 | OCR распознаёт 90%+ позиций из PDF/фото смет; автозаполнение формы КС-2 из скана |

### P4-B: Safety Compliance Engine (Opportunity #2)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P4-04 | **Compliance engine: auto-scheduling + access blocking** | Расширить P2-04 и P2-05: (1) auto-schedule repeat briefings based on role + hazard exposure, (2) block site access for expired certifications (интеграция с TimesheetService -- нельзя отметить приход), (3) mobile incident reporting <2 min, (4) prescription tracker с countdown (P2-07), (5) AI risk scoring per project based on incident patterns. Единый "audit-ready" dashboard. | 8 | P2-04, P2-05, P2-06, P2-07 | Dashboard "Audit-ready": зелёный свет по всем проверкам; блокировка доступа при expired cert; risk score per project |
| P4-05 | **AI-scoring рисков безопасности** | На основе исторических данных инцидентов (из Safety module) тренировать ML-модель для прогнозирования risk score по проекту/участку. Факторы: тип работ, погода, количество субподрядчиков, статистика нарушений. Вывод: weekly risk report с recommendations. | 5 | P4-04 | Risk score обновляется weekly; корреляция score с реальными инцидентами >0.7; recommendations в natural language |

### P4-C: Прогрессивная ИД с Quality Gates (Opportunity #3)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P4-06 | **Quality gates на WBS-уровне** | Расширить P3-06: каждый WBS-узел имеет checklist required documents. Система БЛОКИРУЕТ progression to next construction stage если documentation for current stage incomplete. Configurable per project template. Visual progress bar "Документация / Качество / Объёмы". | 5 | P3-06, P2-01 | Quality gate блокирует закрытие WBS без: АОСР, чек-листов качества, фото; 0 ретроактивного scramble при сдаче |
| P4-07 | **One-click Стройнадзор package** | На основе P3-06 и P4-06: автоматическая генерация полного пакета ИД для Стройнадзора. Формат: структурированный PDF/zip с оглавлением, нумерацией, электронными подписями. Checklist completeness report. | 4 | P4-06, P3-02 | Package генерируется за 5 мин vs 2-3 дня; Стройнадзор принимает с первого раза; completeness = 100% |

### P4-D: Мульти-проектный ресурсный оптимизатор (Opportunity #4)

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P4-08 | **Visual multi-project allocation board** | Бэкенд: `ResourceAllocationService`, `CrewService` существуют. Фронтенд: `CrewPage.tsx`. Создать: Gantt-style visual board -- workers/equipment across projects. Drag-and-drop allocation. Conflict detection (same worker assigned to two projects). Skills-based filtering. | 6 | Нет | Visual board: 50+ workers x 10 projects; drag-drop; conflict alert; skills filter |
| P4-09 | **Skills-based matching + certification compliance** | Расширить P4-08: auto-suggest best-fit workers для assignment (навыки + сертификаты + геолокация + вахтовый график). Automatic certification compliance check before deployment. What-if scenario modeling. | 5 | P4-08, P2-05 | Auto-suggest top-3 candidates; blocked если expired cert; what-if "что если проект B задерживается на 2 недели" |

### P4-E: Advanced Analytics

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P4-10 | **Executive KPI rollup dashboard (#76)** | Аудит UX/UI: Andrey (CEO) -- 6.5/10. "No drill-down into project-level budgets", "No company-wide KPI rollup". Создать: portfolio dashboard с drill-down Project -> Budget -> Transaction. KPIs: EBIT, cash position, AR aging, project health (CPI/SPI), safety rate, resource utilization. | 5 | P3-11, P3-12 | CEO видит portfolio health на одном экране; drill-down в 2 клика до транзакции; export PDF для board presentations |
| P4-11 | **Конструктор отчётов (#81)** | Новая функциональность. Бэкенд: `ReportTemplateController` существует (87 -- generate). Фронтенд: нет конструктора. Создать: visual report builder (drag-drop fields, filters, grouping, charts). Сохранение шаблонов. Scheduled email delivery. PDF/Excel export. | 7 | Нет | Пользователь создаёт отчёт за 5 мин без IT; saved templates; scheduled delivery; PDF/Excel |

**Итого P4: ~80 дней (~16 недель при 1 разработчике, ~8-9 недель при 2)**

---

## P5 -- Market Leadership (12+ месяцев)

> Инновационные функции, выводящие ПРИВОД в лидеры рынка. AI, предиктивная аналитика, IoT, BIM, клиентский портал.

### P5-A: AI-функции

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P5-01 | **AI-ассистент на русском языке (конверсационный)** | Бэкенд: `AiConversation`, `AiTemplate`, `AiPrediction` entities существуют. `AiAssistantPage.tsx` -- реализован (7/10), но XSS (исправлено в P0-03), нет persistence контекста, отправляет данные в US-hosted OpenAI (152-ФЗ violation). Миграция на self-hosted LLM (vLLM + LLaMA) или YandexGPT/GigaChat. Функции: запросы к данным проектов на естественном языке ("Какие проекты с CPI < 0.9?"), помощь в заполнении форм, генерация отчётов. Benchmark: Procore Assist. | 10 | P0-03 | AI отвечает на русском; данные не покидают РФ; точность ответов >85%; response time <3 сек |
| P5-02 | **Предиктивная аналитика задержек и перерасхода** | На основе исторических данных проектов (schedules, budgets, field data) тренировать ML-модели для прогнозирования: (1) вероятность задержки >10%, (2) вероятность перерасхода >5%, (3) risk factors ranking. Факторы: weather, workforce productivity, material delivery delays, subcontractor performance. Benchmark: Autodesk Construction IQ, nPlan. | 12 | P5-01, P3-12 | Predictions обновляются weekly; alert при P(задержка)>60%; корреляция с реальными результатами >0.7 |
| P5-03 | **AI-классификация и обработка документов** | OCR + NLP для автоматической: (1) классификации загружаемых документов (КС-2, АОСР, чертёж, смета), (2) извлечения метаданных из PDF, (3) cross-verification КС-2 с сметными данными. Benchmark: Procore Datagrid. | 8 | P5-01, P4-03 | Auto-classification accuracy >90%; метаданные извлекаются без ручного ввода; cross-verification flags расхождения |
| P5-04 | **Monte Carlo simulation для Cost-to-Complete (#23, #63)** | Бэкенд: Monte Carlo модуль уже есть (фронтенд: `SimulationFormPage.tsx`). Расширить: интеграция risk register inputs -> Monte Carlo -> P10/P50/P90 cost and schedule forecasts. Trend charts EAC trajectory с confidence bands. TCPI calculator. Natural language insights ("Проект X имеет 73% вероятность перерасхода 15%"). | 6 | P3-12, P5-02 | P10/P50/P90 forecasts; trend charts; natural language insights; TCPI calculator |

### P5-B: IoT и телематика

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P5-05 | **IoT dashboard для оборудования (#39)** | Интеграция с GPS/ГЛОНАСС трекерами, телематикой Caterpillar/Komatsu (AEMP 2.0 standard), датчиками моточасов. Dashboard: realtime location, engine hours, fuel level, maintenance alerts. Geofencing: alert при выезде из зоны. | 8 | P2-09, P2-10 | GPS-карта всей техники; auto-update моточасов; geofence alerts; fuel consumption vs norms |
| P5-06 | **GPS-табели с геозонированием (#43)** | Мобильный check-in/check-out с GPS-верификацией присутствия на площадке. Auto-создание табелей. Привязка к проектам и cost codes. Geofencing: система фиксирует только работников в пределах площадки. Конкурент-benchmark: Contractor Foreman GPS Timecards. | 6 | P3-15 | GPS check-in/out; auto-таблицы T-13; geofence verification; экономия 10-15% ФОТ (исключение buddy punching) |

### P5-C: BIM

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P5-07 | **BIM viewer с clash detection** | Бэкенд: `BimModelService`, `BimClashService` существуют. Фронтенд: `BimViewer.tsx` (Three.js 0.135) -- загрузка IFC, но dark mode broken, memory leak. Расширить: clash detection visualization (highlight conflicts), integration с Renga/nanoCAD (отечественные BIM), defect linking (pin defect on 3D model). Обязательно по ПП 331 с 2024. | 10 | P2-02 | IFC viewer с clash detection; 10+ коллизий выделяются цветом; дефект привязывается к 3D-элементу |
| P5-08 | **Привязка дефектов к BIM (#54)** | Расширить P5-07: при создании дефекта (P2-02) можно pin на 3D-элемент BIM-модели. Навигация: click defect -> zoom to element in 3D. Cross-reference: defect list filtered by BIM element/floor/system. | 4 | P5-07, P2-02 | Дефект привязан к 3D-элементу; click -> zoom; фильтрация по этажу/системе |

### P5-D: Клиентский портал

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P5-09 | **Клиентский портал для заказчиков (#83)** | Расширить P3-17: отдельный portal для заказчиков/девелоперов. Функции: прогресс проекта с фотоотчётом, финансовый статус (invoices, payments), документы для подписания, communication thread, timeline milestones. Read-only доступ к dashboard. Benchmark: Buildertrend Client Portal. | 8 | P3-17 | Заказчик видит прогресс, фото, финансы; подписывает документы online; 0 звонков "как дела на стройке?" |
| P5-10 | **Управление рекламациями (#85)** | Новая функциональность для девелоперов. Entity `Claim` (unit, description, priority, status, assigned_contractor, photos). Self-service submission через Client Portal. Workflow: submitted -> triaged -> assigned -> in progress -> verification -> closed. SLA tracking. | 5 | P5-09, P3-08 | Жильцы подают рекламации online; SLA tracking; contractor assignment; resolution time <5 дней |

### P5-E: Compliance и масштабирование

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P5-11 | **152-ФЗ compliance: consent collection + PII encryption** | Аудит безопасности: 0/9 по 152-ФЗ. Создать: entity `DataConsent` + UI для сбора согласия (Art.9), JPA `AttributeConverter` с AES-GCM для Employee PII (passport, INN, SNILS, salary), data subject deletion service (hard delete with cascade для Art.21), privacy policy page. | 10 | P0-11 | Согласие собирается при onboarding; PII зашифрованы at rest; data deletion за <24 часа; privacy policy accessible |
| P5-12 | **Интеграция с ИСУП "Вертикаль"** | 87 регионов, 10 000+ пользователей, обязательна для госзаказа. API-интеграция: автоматическая передача данных о прогрессе, документов, фотоотчётов в ИСУП. Обратная связь: статус проверок. | 8 | P3-06 | Данные автоматически передаются в ИСУП; статус проверок обновляется в ПРИВОД; compliance для госзаказа |
| P5-13 | **Маркетплейс интеграций (API + SDK)** | Открытый REST API с OpenAPI спецификацией, API keys (уже есть SHA-256 hashing), rate limiting per key, webhooks. Developer portal с документацией. Первые 5 интеграций: ГРАНД-Смета, Renga, nanoCAD, банковские API, Telegram Bot. Benchmark: Procore (539+ apps). | 10 | Нет | OpenAPI spec published; developer portal; 5+ интеграций; rate limiting per key; webhook delivery >99% |
| P5-14 | **ESG-модуль: углеродный трекинг** | Ни один из 58+ конкурентов не имеет встроенного ESG. Трекинг: embodied carbon по материалам (GWP database), energy consumption per project, waste tracking, water usage. Auto-generate ESG report. First-mover advantage. | 7 | Нет | GWP per material tracked; project carbon footprint dashboard; auto ESG report; first-mover на рынке РФ |

### P5-F: i18n и Code Quality

| # | Задача | Описание | Трудоёмкость (дни) | Зависимости | Метрика успеха |
|---|--------|----------|--------------------|-------------|----------------|
| P5-15 | **Завершить i18n: 1,485 hardcoded strings** | ~1,485 hardcoded Russian strings в ~196 module files. Scripted extraction + manual review. Покрытие: labels, breadcrumbs, filters, placeholders, error messages, unit options. 19 файлов с наиболее критичными strings идентифицированы в аудите. | 10 | Нет | 0 hardcoded Russian strings в TSX-файлах; `t()` используется для 100% user-facing текста; переключение RU/EN работает |
| P5-16 | **Декомпозиция god-компонентов (TOP-10)** | 56 god-компонентов >300 строк. TOP-10: TenderEvaluateWizard (1,189), PurchaseOrderDetailPage (1,158), SettingsPage (799), PurchaseOrderListPage (702), PurchaseOrderFormPage (691). Procurement module -- 9 god-компонентов, суммарно ~5,800 строк. Декомпозировать на composable sub-components. | 8 | Нет | 0 компонентов >500 строк; TenderEvaluateWizard разбит на 4 step-компонента с React.memo; re-render time -80% |

**Итого P5: ~145 дней (~29 недель при 1 разработчике, ~15 недель при 2)**

---

## Сводная диаграмма зависимостей

```
P0 (2 нед) ─────────────────────────────────────────────────────────────
  P0-01 MFA fix ─── P0-02 MFA login flow
  P0-07 Encryption key ─── P0-11 Encrypt credentials ─── P0-05 Webhook validation
  P0-14 Project orgId NOT NULL
                    │
                    ▼
P1 (6-7 нед) ──────────────────────────────────────────────────────────
  P1-01 Hibernate Filter ─┬── P1-02 Add orgId to 145 entities
                          ├── P1-03 Fix phantom isolation
                          └── P1-04 Replace @RequestParam orgId
  P1-06 КС-2 per-line VAT ─┬── P1-07 Print КС-2/КС-3
                            └── P1-08 Link КС-2 to volumes ─── P1-09 КС-3 preview
  P1-14 FileUpload ─── P1-10 Daily Log photos
  P1-15 Combobox ───┬── P1-17 LimitFenceSheet UI
                    └── P1-18 WarehouseOrder UI
                    │
                    ▼
P2 (9 нед) ────────────────────────────────────────────────────────────
  P2-01 Quality checklists ─── P2-02 Defect registry ─── P2-03 Remediation
  P2-04 Safety briefings ──┐
  P2-05 Certifications ────┤── P4-04 Compliance engine (P4)
  P2-06 Incidents Н-1 ─────┘
  P2-07 Regulatory prescriptions
  P2-14 1C integration ─── P2-15 1C КС-2/КС-3 ─── P3-03 EDO integration (P3)
  P2-16 Pricing UI ─── P4-02 GESN/FER/TER (P4)
                    │
                    ▼
P3 (9-10 нед) ─────────────────────────────────────────────────────────
  P3-01 Approval workflows
  P3-02 KEP КриптоПро ─── P3-03 EDO ─── P4-01 Auto КС-2 (P4)
  P3-06 As-built docs ─── P4-06 Quality gates (P4)
  P3-08 Warranty ─── P5-10 Claims (P5)
  P3-17 Subcontractor portal ─── P5-09 Client portal (P5)
                    │
                    ▼
P4 (8-9 нед) ──────────────────────────────────────────────────────────
  P4-01 Auto КС-2 pipeline
  P4-02 GESN/FER/TER database ─── P4-03 OCR
  P4-04 Safety compliance engine ─── P4-05 AI risk scoring
  P4-06 Quality gates ─── P4-07 Стройнадзор package
  P4-08 Resource allocation ─── P4-09 Skills matching
                    │
                    ▼
P5 (15 нед) ───────────────────────────────────────────────────────────
  P5-01 AI assistant ─── P5-02 Predictive analytics ─── P5-04 Monte Carlo
  P5-03 AI doc classification
  P5-05 IoT dashboard    P5-06 GPS timesheets
  P5-07 BIM clash detection ─── P5-08 BIM defect linking
  P5-09 Client portal ─── P5-10 Claims
  P5-11 152-FZ compliance
  P5-12 ISUP integration
  P5-13 Marketplace
```

---

## Резюме трудозатрат

| Приоритет | Задач | Дни (dev-days) | Недели (1 dev) | Недели (2 dev) | Недели (3 dev) |
|-----------|:-----:|:--------------:|:--------------:|:--------------:|:--------------:|
| **P0 -- Production Blockers** | 14 | 14 | 3 | 2 | 1 |
| **P1 -- MVP** | 22 | 64 | 13 | 7 | 5 |
| **P2 -- Core Product** | 19 | 85 | 17 | 9 | 6 |
| **P3 -- Market Parity** | 17 | 90 | 18 | 10 | 7 |
| **P4 -- Differentiation** | 11 | 80 | 16 | 9 | 6 |
| **P5 -- Market Leadership** | 16 | 145 | 29 | 15 | 10 |
| **ИТОГО** | **99** | **478** | **96** | **52** | **35** |

### Timeline при 2-3 разработчиках

```
Месяц  1   2   3   4   5   6   7   8   9   10  11  12  13  14  15
       ├───┤
        P0 (2 нед)
           ├───────────┤
            P1 MVP (6-7 нед)
                        ├───────────────────┤
                         P2 Core (9 нед)
                                             ├───────────────────┤
                                              P3 Parity (9-10 нед)
                                                                  ├───────────────┤
                                                                   P4 Differ. (8-9 нед)
                                                                                    ├────────
                                                                                     P5 Leader.
```

### Ключевые вехи (milestones)

| Веха | Срок | Критерий |
|------|------|----------|
| **Security-ready** | Неделя 2 | Все P0 fixes deployed; penetration test пройден |
| **Closed Beta** | Месяц 2 | P1 complete; 5-10 компаний в закрытой бета; tenant isolation работает |
| **Public Beta** | Месяц 4 | P2 complete; 1С-интеграция; качество/безопасность/техника |
| **GA Launch** | Месяц 6 | P3 complete; КЭП/ЭДО; субподрядный портал; полный billing cycle |
| **Market Differentiation** | Месяц 9 | P4 complete; auto КС-2; ГЭСН/ФЕР; safety compliance engine |
| **Market Leadership** | Месяц 12+ | P5 in progress; AI; IoT; BIM; client portal; marketplace |

### Метрики успеха по фазам

| Фаза | Метрика | Цель |
|------|---------|------|
| P0 | Оценка безопасности (аудит) | С 4.2/10 до 7+/10 |
| P1 | Пилотные клиенты | 5-10 компаний |
| P1 | КС-2 creation time | С 35-66 мин до 10-15 мин |
| P2 | Покрытие процессов из TOP-20 | 14 из 20 (70%) |
| P2 | Backend test coverage | >40% критических сервисов |
| P3 | Billing cycle | С 30 дней до <10 дней |
| P3 | Функциональный паритет с конкурентами | 15/17 областей = полная реализация |
| P4 | КС-2 auto-generation time | 1 click, <5 мин review |
| P4 | Safety compliance score | "Audit-ready" dashboard |
| P5 | Платящие клиенты | 100 компаний |
| P5 | MRR | 5 млн руб/мес |
| P5 | Интеграции в marketplace | 5+ |

---

> *Дорожная карта составлена на основе синтеза 6 аудитов: полный технический аудит (1,500+ файлов), UX/UI аудит (437 TSX), аудит безопасности (84 findings), карта 85 строительных процессов, конкурентный анализ (58+ решений), анализ трендов ConTech 2025-2026. Все задачи содержат ссылки на конкретные backend entities/services и frontend модули/страницы из кодовой базы. Трудозатраты оценены в developer-days для fullstack-разработчиков уровня Senior.*
