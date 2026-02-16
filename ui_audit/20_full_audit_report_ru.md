# Privod Next — тотальный аудит ERP/CRM для строительства (Procore-level target)

Дата: 2026-02-16

## Как читалось / ограничения

- Источники: код `backend/`, `frontend/`, миграции `backend/src/main/resources/db/migration`, CI/CD `.github/workflows`, результаты авто‑экстрактов в `equivalence_audit/` и `ui_audit/`.
- Метод: статический аудит + автоматический парсинг маршрутов/ролей/эндпоинтов/сущностей.
- Рантайм‑верификация (docker-compose поднять и прогнать сквозные сценарии) в этом проходе не фиксируется как 100% достоверная: вывод основан на коде.

---

## 1) Executive Summary (1 страница)

### Общая оценка продукта (из 10)

- **5.0 / 10** как «широкая платформа с большим количеством модулей, но с неравномерной глубиной и production‑блокерами».
- До уровня, где enterprise платит **$200+/user/month**, не хватает не UI‑полировки, а **доверия к данным (no demo fallback), тенант‑изоляции, консистентного RBAC, зрелых workflow cost/change/doc control**.

### Где мы сейчас vs Procore / Autodesk Build

- **По широте домена**: очень близко (модулей много, покрытие всего цикла стройки просматривается).
- **По глубине workflow (RFI/Submittals/Change/Cost/CDE)**: сейчас уровень **MVP/демо** на ряде ключевых экранов.
- **По production readiness**: CI/CD и контейнеризация есть, но **тенант‑изоляция + RBAC‑консистентность + секреты/сидинг** требуют доработки как P0.

### Топ‑5 сильных сторон

1. **Модульность backend**: 73 доменных модуля; высокий потенциал масштабирования по доменам.
2. **Единый API‑контракт**: `ApiResponse<T>` + `GlobalExceptionHandler` дают хорошую основу для стабильного UX ошибок.
3. **Design System на фронте**: `DataTable`, `Modal` (с focus trap), `PageHeader`, токены — база для консистентного enterprise UI.
4. **CI/CD уже «не игрушечный»**: CI прогоняет backend тесты, frontend lint/typecheck/tests, Playwright e2e; deploy workflows на staging/prod.
5. **Мобильный офлайн‑паттерн уже заложен**: локальные черновики + очередь отправки + фото в IndexedDB (это редкость для «черновых» ERP).

### Топ‑5 критических пробелов (блокеры лидерства)

1. **RBAC расшит**: роли в `@PreAuthorize` не совпадают с seed‑ролями → потенциальные 403/«невидимые» экраны/права.
2. **Мультитенантность не enforced**: `organizationId` часто приходит из запроса и не валидируется через principal → риск утечек межорганизационных данных.
3. **Скрытый demo fallback на ключевых экранах**: `placeholderData` используется как semantic‑fallback в ряде detail/form страниц.
4. **Документооборот/CDE до ISO19650‑grade не доведен** (статусы, transmittals, ревизии, неизменяемость критичных артефактов).
5. **Enterprise cost/change management chain** (Change Events → RFQ → Change Orders → Budget/Schedule impact) есть частями, но требуется связная «Procore‑логика».

### Стратегический вердикт

Система потенциально может стать «русским/глобальным Procore‑классом», потому что **архитектурно уже размечен весь цикл стройки**, но сейчас продукту мешают **3 P0‑вещи**: (1) консистентный RBAC, (2) истинная tenant‑изоляция, (3) вычищенная demo‑семантика и выравнивание экранов под реальные API.

---

## 2) Scorecard

### 2.1 Frontend technical audit (Часть II)

| Раздел | Оценка / 10 | Почему так (кратко) |
|---|---:|---|
| II.1 Архитектура компонентов | 7 | DS есть, роуты декомпозированы; но глубина реализации экранов разная |
| II.2 Консистентность кода | 6 | паттерны повторяются, но demo fallback + разная зрелость модулей |
| II.3 Стейт‑менеджмент | 7 | React Query + Zustand — хороший выбор, но требуется дисциплина invalidation/keys |
| II.4 Типизация | 5 | `as any`=114, `any` tokens=136; особенно в формах |
| II.5 Обработка ошибок | 6 | interceptor/toasts/EB есть; но demo fallback часто скрывает реальные ошибки |
| II.6 Производительность | 6 | lazy routes/код‑сплит есть, но нет virtualization/server pagination на heavy списках |
| II.7 Адаптивность | 6 | mobile layout + bottom nav есть, но таблицы и плотные формы требуют доработки |
| II.8 Доступность (a11y) | 7 | базовый уровень в DS заметен (Modal focus trap), но нужно добить системно |
| II.9 Дизайн‑система | 8 | токены+компоненты дают «enterprise baseline», можно масштабировать |

### 2.2 UX/UI audit (Часть III)

| Раздел | Оценка / 10 | Почему так (кратко) |
|---|---:|---|
| III.1 Визуальная иерархия | 6 | читаемо, но не хватает «директорских» акцентов KPI/риски |
| III.2 Навигация/IA | 4 | 167 пунктов меню → перегруз; нужна role‑based навигация, избранное |
| III.3 Консистентность UI | 7 | DS помогает, повторяемость хорошая |
| III.4 Формы/ввод | 6 | mobile autosave отличный; web‑формам нужен autosave и stronger validation |
| III.5 Таблицы/списки | 7 | DataTable мощный; не хватает saved views + virtualization |
| III.6 Feedback | 6 | toast/confirm есть; прогресс/rollback/undo не везде |
| III.7 Онбординг/empty | 5 | demo‑режим есть, но guided onboarding/help center не продуктовые |
| III.8 Плотность инфо | 6 | есть control density, но нужен «режим бухгалтера/снабженца» |
| III.9 Цвет/типографика | 7 | близко к enterprise, нужны статусы/контраст как система |
| III.10 Полировка | 6 | базово ок; premium‑ощущение придет после выравнивания данных и workflow |

### 2.3 Functional completeness by construction phases (Часть IV→V)

| Фаза | Оценка / 10 | Комментарий |
|---|---:|---|
| Feasibility/CRM/Portfolio | 4 | модули есть, но нет Procore‑grade pipeline/тендеров/аналитики |
| Design/BIM/Docs | 5 | BIM/CDE/Design присутствуют, но нужна «единая линия» версий/ревизий |
| Permits/Regulatory | 5 | regulatory модуль есть, но нужны интеграции/контроль сроков/рисков |
| Procurement/Warehouse/Logistics | 6 | закупки/склад сильнее среднего, но нужен RFQ compare + scoring |
| Construction/Field/QA/HSE | 6 | mobile офлайн паттерн хорош; расширять журналы/инспекции/план‑факт |
| Acting/Finance/EDO | 6 | finance/accounting/pto есть; важна связка «объемы→акты→выручка» |
| Closeout/Warranty | 5 | closeout модуль есть, но нужен full closeout package + warranty claims |

### 2.4 Production readiness (Часть VII)

- Безопасность: ⚠️ (JWT/SC есть, но RBAC/сидинг/tenant‑изоляция — P0)
- Мультитенантность: ⚠️ (entity поля есть, enforcement нет)
- Локализация: ⚠️ (i18n используется в 33 TSX, но не системно)
- Биллинг: ❌
- Онбординг: ⚠️ (demo режим, но нет product onboarding)
- Уведомления: ⚠️ (WS есть, но rule‑engine/шаблоны/каналы частично)
- Мобильная версия: ⚠️ (есть, сильная база)
- Оффлайн: ⚠️ (черновики/очередь есть; SW базовый)
- Импорт/экспорт: ⚠️ (backend dataExchange есть; UI needs consistent UX)
- API/документация: ✅ (OpenAPI аннотации + Swagger)
- Масштабируемость: ⚠️ (Redis/Postgres ok, но tenancy/rate limiting/queue)
- Мониторинг: ⚠️ (actuator/health/metrics есть)
- Бэкапы: ⚠️ (deploy pipeline pg_dump есть, но продуктовый backup сервис симулирован)
- Юридическое (152‑ФЗ/GDPR): ❌
- CI/CD: ✅ (`.github/workflows` + deploy)
- SEO/маркетинг: ❌ (не цель ядра ERP)

---

## 3) Часть I — Глубокое изучение проекта

### 3.1 Масштаб и карта модулей

- Backend modules: **73** (по `backend/src/main/java/com/privod/platform/modules/*`).
- Frontend routes (auto‑extracted): **283** (`ui_audit/09_part1_frontend_route_status.csv`).
  - likely-real=184, partial=98, stub=1.
- Навигация: `frontend/src/config/navigation.ts` содержит **167** пунктов.

### 3.2 Backend: API карта (факт)

Топ модулей по числу endpoint’ов:

| Backend module | Controllers | Endpoints |
|---|---|---|
| pto | 7 | 51 |
| bim | 9 | 47 |
| integration | 7 | 44 |
| calendar | 4 | 42 |
| analytics | 4 | 41 |
| costManagement | 5 | 40 |
| finance | 4 | 39 |
| permission | 5 | 38 |
| settings | 6 | 38 |
| fleet | 4 | 37 |
| warehouse | 5 | 36 |
| contractExt | 6 | 34 |
| planning | 5 | 31 |
| pmWorkflow | 3 | 31 |
| hrRussian | 6 | 30 |
| accounting | 5 | 27 |
| changeManagement | 3 | 25 |
| hr | 3 | 25 |
| maintenance | 1 | 25 |
| safety | 3 | 25 |

Полный список: `ui_audit/09_part1_backend_api_by_module.csv`.

### 3.3 Backend: сущности и связи (факт)

- JPA relationship annotations почти не используются: {'@ManyToOne': 1, '@OneToMany': 0, '@ManyToMany': 2, '@OneToOne': 0}.
  - Реально это означает: связи между доменными объектами в основном через `UUID ...Id` поля (projectId, contractId, userId, ...).
- Плюсы подхода: меньше «Hibernate‑магии», проще миграции/серилизация.
- Минусы для enterprise: слабее реф‑интегритет, больше ручных проверок, сложнее делать графы данных и аналитические join‑запросы.

### 3.4 Backend: зрелость модулей по метрикам кода

Топ модулей по числу сущностей:

| Module | Entities | Controllers | Services | Repos | TODOs |
|---|---|---|---|---|---|
| integration | 26 | 15 | 15 | 27 | 3 |
| accounting | 17 | 5 | 6 | 17 | 0 |
| pto | 16 | 7 | 10 | 17 | 0 |
| hrRussian | 16 | 6 | 6 | 16 | 0 |
| russianDoc | 16 | 3 | 4 | 16 | 0 |
| messaging | 16 | 2 | 5 | 16 | 0 |
| bim | 12 | 9 | 9 | 12 | 0 |
| analytics | 12 | 4 | 7 | 12 | 0 |
| task | 11 | 2 | 5 | 11 | 4 |
| auth | 10 | 5 | 5 | 9 | 0 |
| contractExt | 9 | 6 | 6 | 11 | 0 |
| warehouse | 9 | 5 | 6 | 9 | 0 |
| regulatory | 9 | 3 | 4 | 9 | 0 |
| ops | 8 | 1 | 2 | 8 | 0 |
| quality | 7 | 3 | 5 | 7 | 0 |
| settings | 6 | 6 | 7 | 6 | 1 |
| costManagement | 6 | 5 | 5 | 6 | 0 |
| permission | 6 | 5 | 7 | 6 | 0 |
| calendar | 6 | 4 | 4 | 6 | 0 |
| chatter | 6 | 4 | 4 | 5 | 0 |

### 3.5 Явные stub‑сигналы в backend

| Module | Signals (sum) | File |
|---|---|---|
| monteCarlo | 70 | backend/src/main/java/com/privod/platform/modules/monteCarlo/service/MonteCarloService.java |
| integration | 12 | backend/src/main/java/com/privod/platform/modules/integration/govregistries/service/GovRegistryService.java |
| integration | 12 | backend/src/main/java/com/privod/platform/modules/integration/webdav/service/WebDavService.java |
| monteCarlo | 12 | backend/src/main/java/com/privod/platform/modules/monteCarlo/web/MonteCarloController.java |
| integration | 8 | backend/src/main/java/com/privod/platform/modules/integration/sms/service/SmsService.java |
| planning | 4 | backend/src/main/java/com/privod/platform/modules/planning/service/WbsNodeService.java |
| task | 4 | backend/src/main/java/com/privod/platform/modules/task/domain/TaskStatus.java |
| integration | 2 | backend/src/main/java/com/privod/platform/modules/integration/weather/service/WeatherService.java |
| analytics | 1 | backend/src/main/java/com/privod/platform/modules/analytics/service/AnalyticsSavedReportService.java |
| integration | 1 | backend/src/main/java/com/privod/platform/modules/integration/service/IntegrationEndpointService.java |
| integration | 1 | backend/src/main/java/com/privod/platform/modules/integration/service/IntegrationWebhookService.java |
| integration | 1 | backend/src/main/java/com/privod/platform/modules/integration/service/SbisService.java |

Полный список: `ui_audit/20_backend_stub_signals.csv`.

### 3.6 Frontend: зрелость по сегментам роутов

| Route segment | likely-real | partial | stub |
|---|---|---|---|
| pm | 6 | 7 | 0 |
| integrations | 2 | 5 | 0 |
| regulatory | 2 | 5 | 0 |
| operations | 4 | 4 | 0 |
| pto | 4 | 4 | 0 |
| change-management | 3 | 4 | 0 |
| bim | 1 | 4 | 0 |
| hr-russian | 0 | 4 | 0 |
| punchlist | 2 | 4 | 0 |
| warehouse | 10 | 3 | 0 |
| design | 3 | 3 | 0 |
| portfolio | 3 | 3 | 0 |
| legal | 0 | 3 | 0 |
| analytics | 2 | 3 | 0 |
| fleet | 5 | 2 | 0 |
| iot | 2 | 2 | 0 |
| maintenance | 4 | 2 | 0 |
| dispatch | 2 | 2 | 0 |
| cde | 2 | 2 | 0 |
| workflow | 2 | 2 | 0 |

### 3.7 Функциональная карта (Часть I.2)

Ниже — «реестр функций» через призму **маршрутов UI** (как proxy для “функций”, потому что для ERP пользовательская функция == экран/операция).

Ключ:
- `likely-real`: экран использует реальные API (по эвристике), без явных mock fallback.
- `partial`: есть сигналы `placeholderData`/mock tokens/или экран не дергает API.
- `stub`: placeholder/заглушка.

| Module | Route | Component | Status | Quality (1-10) | Signals |
|---|---|---|---|---|---|
| * | /* | NotFoundPage | likely-real | 7 | no apiClient usage detected |
| ai-assistant | /ai-assistant | AiAssistantPage | likely-real | 7 |  |
| analytics | /analytics | AnalyticsDashboardPage | likely-real | 7 |  |
| analytics | /analytics/audit-pivot | AuditPivotPage | partial | 4 | mockTokens=1; no apiClient usage detected |
| analytics | /analytics/bonus-calculations | BonusCalculationsPage | partial | 4 | placeholderData=1; mockTokens=7 |
| analytics | /analytics/kpi-achievements | KpiAchievementsPage | partial | 4 | placeholderData=1; mockTokens=7 |
| analytics | /analytics/project-charts | ProjectAnalyticsChartPage | likely-real | 7 | no apiClient usage detected |
| bim | /bim/clash-detection | ClashDetectionPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| bim | /bim/clash-detection/board | ClashBoardPage | likely-real | 7 | no apiClient usage detected |
| bim | /bim/design-packages | DesignPackagePage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| bim | /bim/models | BimModelListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| bim | /bim/models/:id | BimModelDetailPage | partial | 4 | placeholderData=1; mockTokens=8; no apiClient usage detected |
| calendar | /calendar | CalendarPage | partial | 4 | placeholderData=1; mockTokens=4 |
| calendar | /calendar/events/:id/edit | CalendarEventFormPage | likely-real | 7 |  |
| calendar | /calendar/events/new | CalendarEventFormPage | likely-real | 7 |  |
| cde | /cde/documents | DocumentContainerListPage | likely-real | 7 | no apiClient usage detected |
| cde | /cde/documents/:id | DocumentContainerDetailPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| cde | /cde/transmittals | TransmittalListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| cde | /cde/transmittals/:id | TransmittalDetailPage | likely-real | 7 | no apiClient usage detected |
| change-management | /change-management/events | ChangeEventListPage | likely-real | 7 |  |
| change-management | /change-management/events/:id | ChangeEventDetailPage | partial | 4 | placeholderData=1; mockTokens=4 |
| change-management | /change-management/orders | ChangeOrderListPage | likely-real | 7 |  |
| change-management | /change-management/orders/:id | ChangeOrderDetailPage | partial | 4 | placeholderData=2; mockTokens=10 |
| change-management | /change-management/orders/:id/edit | ChangeOrderFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| change-management | /change-management/orders/board | ChangeOrderBoardPage | likely-real | 7 | no apiClient usage detected |
| change-management | /change-management/orders/new | ChangeOrderFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| closeout | /closeout/commissioning | CommissioningPage | partial | 4 | placeholderData=1; mockTokens=7 |
| closeout | /closeout/commissioning/board | CommissioningBoardPage | likely-real | 7 | no apiClient usage detected |
| closeout | /closeout/dashboard | CloseoutDashboardPage | partial | 4 | placeholderData=2; mockTokens=14 |
| closeout | /closeout/handover | HandoverPage | likely-real | 7 |  |
| closeout | /closeout/warranty | WarrantyPage | likely-real | 7 |  |
| contracts | /contracts | ContractListPage | likely-real | 7 |  |
| contracts | /contracts/:id | ContractDetailPage | likely-real | 7 |  |
| contracts | /contracts/:id/edit | ContractFormPage | likely-real | 7 |  |
| contracts | /contracts/board | ContractBoardPage | likely-real | 7 | no apiClient usage detected |
| contracts | /contracts/new | ContractFormPage | likely-real | 7 |  |
| cost-management | /cost-management/budget | CostBudgetOverviewPage | partial | 4 | placeholderData=1; mockTokens=4 |
| cost-management | /cost-management/cashflow | CostCashflowPage | likely-real | 7 |  |
| cost-management | /cost-management/codes | CostCodeListPage | likely-real | 7 |  |
| cost-management | /cost-management/commitments | CommitmentsPage | likely-real | 7 |  |
| cost-management | /cost-management/commitments/:id | CommitmentDetailPage | partial | 4 | mockTokens=9; no apiClient usage detected |
| cost-management | /cost-management/commitments/:id/edit | CommitmentFormPage | likely-real | 7 |  |
| cost-management | /cost-management/commitments/new | CommitmentFormPage | likely-real | 7 |  |
| cost-management | /cost-management/forecast | ForecastPage | likely-real | 7 |  |
| crew | /crew | CrewPage | likely-real | 7 |  |
| crm | /crm/dashboard | CrmDashboardPage | likely-real | 7 |  |
| crm | /crm/leads | CrmLeadListPage | partial | 4 | placeholderData=2; mockTokens=11 |
| crm | /crm/leads/:id | CrmLeadDetailPage | partial | 4 | placeholderData=2; mockTokens=10 |
| crm | /crm/leads/:id/edit | CrmLeadFormPage | likely-real | 7 |  |
| crm | /crm/leads/new | CrmLeadFormPage | likely-real | 7 |  |
| daily-log | /daily-log | DailyLogPage | likely-real | 7 | mockTokens=2 |
| daily-log | /daily-log/board | DailyLogBoardPage | likely-real | 7 | no apiClient usage detected |
| daily-logs | /daily-logs/:id/edit | DailyLogFormPage | likely-real | 7 |  |
| daily-logs | /daily-logs/new | DailyLogFormPage | likely-real | 7 |  |
| data-exchange | /data-exchange/1c-config | OneCConfigPage | likely-real | 7 |  |
| data-exchange | /data-exchange/1c-logs | OneCExchangeLogPage | partial | 4 | placeholderData=1; mockTokens=7 |
| data-exchange | /data-exchange/export | DataExportPage | likely-real | 7 |  |
| data-exchange | /data-exchange/import | DataImportPage | likely-real | 7 |  |
| data-exchange | /data-exchange/mapping | DataMappingPage | likely-real | 7 |  |
| design | /design/reviews | DesignReviewPage | partial | 4 | placeholderData=1; mockTokens=7 |
| design | /design/reviews/board | DesignReviewBoardPage | likely-real | 7 | no apiClient usage detected |
| design | /design/sections | DesignSectionListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| design | /design/versions | DesignVersionListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| design | /design/versions/:id/edit | DesignVersionFormPage | likely-real | 7 |  |
| design | /design/versions/new | DesignVersionFormPage | likely-real | 7 |  |
| dispatch | /dispatch/orders | DispatchOrderListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| dispatch | /dispatch/orders/:id/edit | DispatchOrderFormPage | likely-real | 7 |  |
| dispatch | /dispatch/orders/new | DispatchOrderFormPage | likely-real | 7 |  |
| dispatch | /dispatch/routes | DispatchRouteListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| documents | /documents | DocumentListPage | stub | 1 | no apiClient usage detected |
| documents | /documents/:id/edit | DocumentFormPage | likely-real | 7 |  |
| documents | /documents/new | DocumentFormPage | likely-real | 7 |  |
| employees | /employees | EmployeeListPage | likely-real | 7 |  |
| employees | /employees/:id | EmployeeDetailPage | likely-real | 7 |  |
| employees | /employees/:id/edit | EmployeeFormPage | likely-real | 7 |  |
| employees | /employees/new | EmployeeFormPage | likely-real | 7 |  |
| estimates | /estimates | EstimateListPage | likely-real | 7 |  |
| estimates | /estimates/:id | EstimateDetailPage | likely-real | 7 |  |
| estimates | /estimates/pivot | EstimatePivotPage | likely-real | 7 |  |
| fleet | /fleet | FleetListPage | likely-real | 7 |  |
| fleet | /fleet/:id | FleetDetailPage | partial | 4 | placeholderData=1; mockTokens=4 |
| fleet | /fleet/:id/edit | FleetVehicleFormPage | likely-real | 7 |  |
| fleet | /fleet/fuel | FuelPage | likely-real | 7 |  |
| fleet | /fleet/maintenance | MaintenancePage | partial | 4 | placeholderData=1; mockTokens=7; no apiClient usage detected |
| fleet | /fleet/maintenance/board | FleetMaintenanceBoardPage | likely-real | 7 | no apiClient usage detected |
| fleet | /fleet/new | FleetVehicleFormPage | likely-real | 7 |  |
| hr-russian | /hr-russian/employment-contracts | EmploymentContractListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| hr-russian | /hr-russian/personnel-orders | PersonnelOrderListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| hr-russian | /hr-russian/staffing | StaffingTablePage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| hr-russian | /hr-russian/timesheets | TimeSheetPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| hr | /hr/crew-time-calendar | CrewTimeCalendarPage | partial | 4 | mockTokens=4; no apiClient usage detected |
| hr | /hr/crew-time-entries | CrewTimeEntriesPage | partial | 4 | placeholderData=1; mockTokens=7 |
| hr | /hr/crew-timesheets | CrewTimeSheetsPage | likely-real | 7 |  |
| hr | /hr/timesheet-pivot | TimesheetPivotPage | likely-real | 7 | no apiClient usage detected |
| integrations | /integrations | IntegrationsDashboardPage | likely-real | 7 |  |
| integrations | /integrations/1c | OneCSettingsPage | partial | 4 | placeholderData=2; mockTokens=11 |
| integrations | /integrations/bim | BimIntegrationPage | likely-real | 7 |  |
| integrations | /integrations/edo | EdoSettingsPage | partial | 4 | placeholderData=1; mockTokens=6 |
| integrations | /integrations/sbis | SbisSettingsPage | partial | 4 | placeholderData=2; mockTokens=11 |
| integrations | /integrations/telegram | TelegramPage | partial | 4 | placeholderData=3; mockTokens=12 |
| integrations | /integrations/weather | WeatherIntegrationPage | partial | 4 | placeholderData=2; mockTokens=9 |
| iot | /iot/alerts | AlertsPage | likely-real | 7 |  |
| iot | /iot/devices | DevicesPage | likely-real | 7 | no apiClient usage detected |
| iot | /iot/devices/:id | DeviceDetailPage | partial | 4 | placeholderData=2; mockTokens=11 |
| iot | /iot/sensors | SensorsPage | partial | 4 | placeholderData=1; mockTokens=7 |
| kep | /kep/certificates | KepCertificateListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| kep | /kep/signing-requests | KepSigningRequestListPage | likely-real | 7 | mockTokens=2 |
| kpi | /kpi | KpiPage | likely-real | 7 |  |
| ks2 | /ks2 | Ks2ListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| ks3 | /ks3 | Ks3ListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| leave | /leave/allocations | LeaveAllocationPage | likely-real | 7 |  |
| leave | /leave/board | LeaveBoardPage | likely-real | 7 | no apiClient usage detected |
| leave | /leave/requests | LeaveRequestListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| leave | /leave/types | LeaveTypesPage | likely-real | 7 |  |
| legal | /legal/cases | LegalCaseListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| legal | /legal/cases/:id | LegalCaseDetailPage | partial | 4 | placeholderData=3; mockTokens=16 |
| legal | /legal/templates | LegalTemplateListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| m29 | /m29 | M29ListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| maintenance | /maintenance/board | MaintenanceBoardPage | likely-real | 7 | no apiClient usage detected |
| maintenance | /maintenance/dashboard | MaintenanceDashboardPage | likely-real | 7 |  |
| maintenance | /maintenance/equipment | EquipmentListPage | likely-real | 7 |  |
| maintenance | /maintenance/requests | MaintenanceRequestListPage | likely-real | 7 |  |
| maintenance | /maintenance/requests/:id/edit | MaintenanceRequestFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| maintenance | /maintenance/requests/new | MaintenanceRequestFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| messaging | /messaging | MessagingPage | likely-real | 7 | mockTokens=4 |
| messaging | /messaging/calls | CallsPage | likely-real | 7 |  |
| messaging | /messaging/favorites | FavoritesPage | partial | 4 | mockTokens=2; no apiClient usage detected |
| mobile | /mobile/dashboard | MobileDashboardPage | likely-real | 7 | mockTokens=9 |
| mobile | /mobile/photos | MobilePhotosPage | likely-real | 7 |  |
| mobile | /mobile/reports | MobileReportsPage | likely-real | 7 |  |
| mobile | /mobile/reports/new | MobileReportNewPage | likely-real | 7 |  |
| monitoring | /monitoring | MonitoringDashboardPage | partial | 4 | mockTokens=1; no apiClient usage detected |
| monte-carlo | /monte-carlo | SimulationListPage | likely-real | 7 |  |
| monte-carlo | /monte-carlo/:id | SimulationDetailPage | partial | 4 | placeholderData=1; mockTokens=4 |
| monte-carlo | /monte-carlo/:id/edit | SimulationFormPage | likely-real | 7 |  |
| monte-carlo | /monte-carlo/new | SimulationFormPage | likely-real | 7 |  |
| notifications | /notifications | NotificationsPage | likely-real | 7 |  |
| operations | /operations/daily-logs | OperationsDailyLogsPage | likely-real | 7 | no apiClient usage detected |
| operations | /operations/daily-logs/:id | DailyLogDetailPage | partial | 4 | mockTokens=16; no apiClient usage detected |
| operations | /operations/daily-logs/new | DailyLogCreatePage | likely-real | 7 | no apiClient usage detected |
| operations | /operations/dashboard | OperationsDashboardPage | partial | 4 | mockTokens=4; no apiClient usage detected |
| operations | /operations/dispatch-calendar | DispatchCalendarPage | partial | 4 | mockTokens=4; no apiClient usage detected |
| operations | /operations/work-orders | WorkOrdersPage | likely-real | 7 | no apiClient usage detected |
| operations | /operations/work-orders/:id | WorkOrderDetailPage | partial | 4 | placeholderData=1; no apiClient usage detected |
| operations | /operations/work-orders/board | WorkOrderBoardPage | likely-real | 7 | no apiClient usage detected |
| payroll | /payroll | PayrollTemplateListPage | likely-real | 7 |  |
| payroll | /payroll/calculate | PayrollCalculationPage | likely-real | 7 |  |
| payroll | /payroll/templates/:id/edit | PayrollTemplateFormPage | likely-real | 7 |  |
| payroll | /payroll/templates/new | PayrollTemplateFormPage | likely-real | 7 |  |
| planning | /planning/baseline | ScheduleBaselinePage | likely-real | 7 |  |
| planning | /planning/evm | EvmDashboardPage | likely-real | 7 |  |
| planning | /planning/gantt | GanttChartPage | likely-real | 7 |  |
| planning | /planning/resources | ResourceAllocationPage | likely-real | 7 |  |
| planning | /planning/wbs | WbsTreePage | likely-real | 7 |  |
| pm | /pm/issues | IssueListPage | likely-real | 7 |  |
| pm | /pm/issues/:id | IssueDetailPage | partial | 4 | placeholderData=2; mockTokens=10 |
| pm | /pm/issues/:id/edit | IssueFormPage | likely-real | 7 |  |
| pm | /pm/issues/new | IssueFormPage | likely-real | 7 |  |
| pm | /pm/rfis | RfiListPage | likely-real | 7 |  |
| pm | /pm/rfis/:id | RfiDetailPage | partial | 4 | placeholderData=2; mockTokens=9 |
| pm | /pm/rfis/:id/edit | RfiFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| pm | /pm/rfis/board | RfiBoardPage | likely-real | 7 | no apiClient usage detected |
| pm | /pm/rfis/new | RfiFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| pm | /pm/submittals | SubmittalListPage | likely-real | 7 |  |
| pm | /pm/submittals/:id | SubmittalDetailPage | partial | 4 | placeholderData=2; mockTokens=10 |
| pm | /pm/submittals/:id/edit | SubmittalFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| pm | /pm/submittals/new | SubmittalFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| portal | /portal | PortalDashboardPage | likely-real | 7 |  |
| portal | /portal/admin | PortalAdminPage | likely-real | 7 |  |
| portal | /portal/documents | PortalDocumentListPage | likely-real | 7 |  |
| portal | /portal/messages | PortalMessageListPage | likely-real | 7 |  |
| portal | /portal/projects | PortalProjectListPage | likely-real | 7 |  |
| portfolio | /portfolio/bid-comparison | BidComparisonPage | likely-real | 7 |  |
| portfolio | /portfolio/opportunities | OpportunitiesPage | likely-real | 7 |  |
| portfolio | /portfolio/opportunities/:id | OpportunityDetailPage | partial | 4 | placeholderData=2; mockTokens=11 |
| portfolio | /portfolio/opportunities/:id/edit | OpportunityFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| portfolio | /portfolio/opportunities/new | OpportunityFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| portfolio | /portfolio/tenders | TendersPage | likely-real | 7 | mockTokens=2 |
| price-coefficients | /price-coefficients | PriceCoefficientListPage | likely-real | 7 |  |
| price-coefficients | /price-coefficients/:id | PriceCoefficientDetailPage | partial | 4 | placeholderData=1; mockTokens=4 |
| price-coefficients | /price-coefficients/:id/edit | PriceCoefficientFormPage | likely-real | 7 |  |
| price-coefficients | /price-coefficients/new | PriceCoefficientFormPage | likely-real | 7 |  |
| procurement | /procurement | PurchaseRequestListPage | likely-real | 7 |  |
| procurement | /procurement/:id | PurchaseRequestDetailPage | partial | 4 | placeholderData=1; mockTokens=6 |
| procurement | /procurement/:id/edit | PurchaseRequestFormPage | likely-real | 7 |  |
| procurement | /procurement/board | PurchaseRequestBoardPage | likely-real | 7 | no apiClient usage detected |
| procurement | /procurement/new | PurchaseRequestFormPage | likely-real | 7 |  |
| projects | /projects | ProjectListPage | likely-real | 7 |  |
| projects | /projects/:id | ProjectDetailPage | likely-real | 7 |  |
| projects | /projects/:id/edit | ProjectFormPage | likely-real | 7 |  |
| projects | /projects/new | ProjectFormPage | likely-real | 7 |  |
| pto | /pto/documents | PtoDocumentListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| pto | /pto/documents/:id | PtoDocumentDetailPage | partial | 4 | mockTokens=8; no apiClient usage detected |
| pto | /pto/documents/:id/edit | PtoDocumentFormPage | likely-real | 7 |  |
| pto | /pto/documents/board | PtoDocumentBoardPage | likely-real | 7 | no apiClient usage detected |
| pto | /pto/documents/new | PtoDocumentFormPage | likely-real | 7 |  |
| pto | /pto/ks6-calendar | Ks6CalendarPage | likely-real | 7 | no apiClient usage detected |
| pto | /pto/lab-tests | LabTestListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| pto | /pto/work-permits | WorkPermitListPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| punchlist | /punchlist/board | PunchlistBoardPage | likely-real | 7 | no apiClient usage detected |
| punchlist | /punchlist/dashboard | PunchlistDashboardPage | partial | 4 | mockTokens=9; no apiClient usage detected |
| punchlist | /punchlist/items | PunchlistItemsPage | partial | 4 | placeholderData=1; mockTokens=4 |
| punchlist | /punchlist/items/:id | PunchlistItemDetailPage | likely-real | 7 | mockTokens=5 |
| punchlist | /punchlist/items/:id/edit | PunchListItemFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| punchlist | /punchlist/items/new | PunchListItemFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| quality | /quality | QualityListPage | likely-real | 7 |  |
| quality | /quality/:id | QualityCheckDetailPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| quality | /quality/board | QualityBoardPage | likely-real | 7 | no apiClient usage detected |
| quality | /quality/certificates | MaterialCertificatesPage | likely-real | 7 |  |
| quality | /quality/inspections/:id/edit | InspectionFormPage | likely-real | 7 |  |
| quality | /quality/inspections/new | InspectionFormPage | likely-real | 7 |  |
| quality | /quality/tolerance-checks | ToleranceChecksPage | likely-real | 7 |  |
| quality | /quality/tolerance-rules | ToleranceRulesPage | likely-real | 7 |  |
| recruitment | /recruitment/applicants | ApplicantListPage | likely-real | 7 | mockTokens=2 |
| recruitment | /recruitment/applicants/:id | ApplicantDetailPage | partial | 4 | placeholderData=2; mockTokens=14 |
| recruitment | /recruitment/applicants/:id/edit | ApplicantFormPage | likely-real | 7 |  |
| recruitment | /recruitment/applicants/board | ApplicantBoardPage | likely-real | 7 | no apiClient usage detected |
| recruitment | /recruitment/applicants/new | ApplicantFormPage | likely-real | 7 |  |
| recruitment | /recruitment/jobs | JobPositionListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| regulatory | /regulatory/dashboard | RegulatoryDashboardPage | partial | 4 | mockTokens=4; no apiClient usage detected |
| regulatory | /regulatory/inspections | InspectionsPage | likely-real | 7 |  |
| regulatory | /regulatory/licenses | LicensesPage | partial | 4 | placeholderData=1; mockTokens=7 |
| regulatory | /regulatory/permits | PermitsPage | partial | 4 | placeholderData=1; mockTokens=7 |
| regulatory | /regulatory/permits/:id | PermitDetailPage | partial | 4 | mockTokens=9; no apiClient usage detected |
| regulatory | /regulatory/permits/board | PermitBoardPage | likely-real | 7 | no apiClient usage detected |
| regulatory | /regulatory/reporting-calendar | ReportingCalendarPage | partial | 4 | placeholderData=1; mockTokens=7 |
| reports | /reports | ReportsPage | likely-real | 7 |  |
| revenue | /revenue/contracts | RevenueContractsPage | likely-real | 7 | mockTokens=2 |
| revenue | /revenue/contracts/:id | RevenueContractDetailPage | partial | 4 | placeholderData=2; mockTokens=10 |
| revenue | /revenue/dashboard | RevenueDashboardPage | likely-real | 7 |  |
| revenue | /revenue/periods | RevenuePeriodsPage | likely-real | 7 | mockTokens=2 |
| russian-docs | /russian-docs/:id | DocumentDetailPage | partial | 4 | placeholderData=2; mockTokens=10 |
| russian-docs | /russian-docs/create | DocumentCreatePage | likely-real | 7 |  |
| russian-docs | /russian-docs/edo | EdoDocumentsPage | likely-real | 7 |  |
| russian-docs | /russian-docs/ks2 | Ks2GeneratorPage | likely-real | 7 | no apiClient usage detected |
| russian-docs | /russian-docs/ks3 | Ks3GeneratorPage | likely-real | 7 | no apiClient usage detected |
| russian-docs | /russian-docs/list | RussianDocListPage | likely-real | 7 | no apiClient usage detected |
| russian-docs | /russian-docs/sbis | SbisDocumentsPage | likely-real | 7 |  |
| safety | /safety | SafetyPage | likely-real | 7 |  |
| safety | /safety/board | SafetyBoardPage | likely-real | 7 | no apiClient usage detected |
| safety | /safety/incidents/:id/edit | SafetyIncidentFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| safety | /safety/incidents/new | SafetyIncidentFormPage | partial | 4 | placeholderData=1; mockTokens=3 |
| search | /search | GlobalSearchPage | likely-real | 7 | mockTokens=1 |
| self-employed | /self-employed | SelfEmployedContractorListPage | likely-real | 7 |  |
| self-employed | /self-employed/contractors/:id/edit | SelfEmployedContractorFormPage | likely-real | 7 |  |
| self-employed | /self-employed/contractors/new | SelfEmployedContractorFormPage | likely-real | 7 |  |
| self-employed | /self-employed/payments | SelfEmployedPaymentListPage | likely-real | 7 |  |
| self-employed | /self-employed/registries | SelfEmployedRegistryListPage | likely-real | 7 |  |
| specifications | /specifications | SpecificationListPage | likely-real | 7 |  |
| specifications | /specifications/:id | SpecificationDetailPage | likely-real | 7 |  |
| specifications | /specifications/:id/edit | SpecificationFormPage | likely-real | 7 |  |
| specifications | /specifications/analog-requests | AnalogRequestsPage | likely-real | 7 |  |
| specifications | /specifications/analogs | MaterialAnalogsPage | likely-real | 7 |  |
| specifications | /specifications/new | SpecificationFormPage | likely-real | 7 |  |
| support | /support/dashboard | SupportDashboardPage | partial | 4 | placeholderData=1; mockTokens=7 |
| support | /support/tickets | SupportTicketsPage | likely-real | 7 | no apiClient usage detected |
| support | /support/tickets/:id | SupportTicketDetailPage | likely-real | 7 | no apiClient usage detected |
| support | /support/tickets/board | TicketBoardPage | likely-real | 7 | no apiClient usage detected |
| tasks | /tasks | TaskBoardPage | likely-real | 7 |  |
| tasks | /tasks/gantt | GanttPage | likely-real | 7 |  |
| tasks | /tasks/list | TaskListPage | partial | 4 | placeholderData=1; mockTokens=7 |
| tax-risk | /tax-risk | TaxRiskListPage | likely-real | 7 |  |
| tax-risk | /tax-risk/:id | TaxRiskDetailPage | partial | 4 | placeholderData=1; mockTokens=4 |
| tax-risk | /tax-risk/:id/edit | TaxRiskFormPage | likely-real | 7 |  |
| tax-risk | /tax-risk/new | TaxRiskFormPage | likely-real | 7 |  |
| timesheets | /timesheets | TimesheetListPage | likely-real | 7 |  |
| warehouse | /warehouse/inventory | InventoryPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| warehouse | /warehouse/locations | WarehouseLocationsPage | partial | 4 | placeholderData=1; mockTokens=4; no apiClient usage detected |
| warehouse | /warehouse/materials | MaterialListPage | likely-real | 7 |  |
| warehouse | /warehouse/materials/:id | MaterialDetailPage | partial | 4 | mockTokens=7; no apiClient usage detected |
| warehouse | /warehouse/materials/:id/edit | MaterialFormPage | likely-real | 7 |  |
| warehouse | /warehouse/materials/new | MaterialFormPage | likely-real | 7 |  |
| warehouse | /warehouse/movements | MovementListPage | likely-real | 7 |  |
| warehouse | /warehouse/movements/:id/edit | MovementFormPage | likely-real | 7 |  |
| warehouse | /warehouse/movements/board | MovementBoardPage | likely-real | 7 | no apiClient usage detected |
| warehouse | /warehouse/movements/new | MovementFormPage | likely-real | 7 |  |
| warehouse | /warehouse/stock | StockPage | likely-real | 7 |  |
| warehouse | /warehouse/stock-alerts | StockAlertsPage | likely-real | 7 |  |
| warehouse | /warehouse/stock-limits | StockLimitsPage | likely-real | 7 |  |
| workflow | /workflow/designer | WorkflowDesignerPage | partial | 4 | placeholderData=2; mockTokens=7 |
| workflow | /workflow/designer/:id | WorkflowDesignerPage | partial | 4 | placeholderData=2; mockTokens=7 |
| workflow | /workflow/instances | WorkflowInstancePage | likely-real | 7 |  |
| workflow | /workflow/templates | WorkflowTemplateListPage | likely-real | 7 |  |

---

## 4) Часть II — Технический аудит фронтенда (факт‑базировано)

### 4.1 P0/P1 проблемы, которые прямо сейчас ломают ценность

#### 🔴 CRITICAL: ApiResponse unwrap (исправлено в этом проходе)

- Было: `frontend/src/api/client.ts` проверял `'SUCCESS' in response.data` вместо `'success'`.
- Риск: API‑ответы не распаковываются → большинство `api/*.ts` начинает работать на пустых данных или ломается.
- Исправление: заменено на `'success' in response.data`.

#### 🔴 CRITICAL: demo/placeholderData как semantic fallback

Метрика: `placeholderData` = **107** в **86** файлах.

Примеры (file:line):
- `frontend/src/modules/rfi/RfiDetailPage.tsx` (placeholderData)
- `frontend/src/modules/submittals/SubmittalDetailPage.tsx` (placeholderData)
- `frontend/src/modules/integrations/TelegramPage.tsx` (placeholderData)
- `frontend/src/design-system/components/TopBar/index.tsx` (placeholderData)

Решение уровня Procore:
- Ввести жёсткий флаг `isDemoMode` и **запретить** semantic fallback в production mode.
- В non‑demo показывать только: loading → empty → error/retry.
- На транзакционных действиях в demo: блокировать мутации, показывать баннер «демо».

#### 🔴 CRITICAL: RBAC mismatch фронт/бэк/seed

См. раздел 7.1 — это production blocker.

### 4.2 Типизация

- `as any` casts: **114** (57 файлов)
- `any` tokens: **136** (61 файлов)

Проблема: `as any` в формах → скрытые runtime баги (особенно при связке enum/status/workflow).

Пример:
- `frontend/src/modules/quality/InspectionFormPage.tsx` содержит множественные `as any` (см. `as any` occurrences).

Решение:
- Завести строго типизированные union/enum для form state.
- Типизировать API client responses через `zod` (у вас он есть) и генерировать `ApiResponse<T>` types.

### 4.3 Производительность и data-heavy

- Сейчас DataTable дает богатый UX, но на больших списках нужны:
  - server‑side pagination/filtering/sorting,
  - virtualization (react-virtual),
  - saved views.

### 4.4 Тестируемость UI

- `frontend/src` тесты: **14**
- Playwright specs: **13**, `toHaveScreenshot` calls: **1**

Рекомендация:
- Увеличить долю **component tests** на DS + «критические формы».
- Расширить visual regression (минимум: 10 ключевых экранов × 4 viewport).

---

## 5) Часть III — UX/UI аудит (4 роли)

### 5.1 Директор (CEO/CFO/Директор по стройке)

- Ожидание (Procore‑уровень): портфель, EAC/ETC, risk register, прогноз по срокам/деньгам, drill‑down до контракта/акта/объема.
- Текущее: есть `analytics/`, `planfact/`, `finance/`, но «директорская» история пока не замкнута в 2‑3 клика.

Ключевой гэп:
- Нет единого «портфельного» дашборда: маржа, cashflow, риски, отклонения, change events.

### 5.2 Прораб (field/mobile/offline)

- Сильная сторона: `MobileReportNewPage` уже делает autosave черновика + очередь отправки offline.
- Гэп: offline стратегия для чтения (план, задачи, документы) пока не системная (SW не кеширует API).

### 5.3 Снабженец

- Сильная сторона: procurement/warehouse модули и мощный DataTable.
- Гэп: RFQ compare + scoring (см. competitor benchmarks: Procore/Autodesk, bid tables).

### 5.4 Бухгалтер

- Сильная сторона: `accounting/`, `finance/`, `pto/`, `russianDoc/`.
- Гэп: end‑to‑end «объемы → КС‑2/КС‑3 → UPD/ЭДО → закрытие периода» и контроль версий документов.

---

## 6) Часть IV — Рынок и конкуренты (ссылки)

### 6.1 Полный цикл строительства: требования к ERP

Источник внутренней карты: `research/construction_process_map.json`.

| Phase | Key outputs | Required ERP capabilities (excerpt) |
|---|---|---|
| Стратегия, feasibility, бюджет класса 5-4 | business case, initial budget, risk register, brief | CRM/opportunity, estimate_classification, portfolio_budgeting, risk_register, document_register |
| Проектирование (ПД/РД), сметы, экспертиза | project documentation sections, working documentation, expertise package, baseline estimate class 3-2 | cde_versioning, design_sections_catalog, estimate_versions, requirements_traceability, expertise_management |
| Разрешение на строительство | building permit package | permit_tracking, stakeholder_signoffs, audit_trail |
| Снабжение, закупки, склад, логистика | MR/RFQ/PO, receiving, inventory, M-2, M-29 | procurement_workflow, supplier_mgmt, warehouse_mgmt, powers_of_attorney_M2, materials_norm_vs_fact_M29 |
| Строительство, контроль, журналы, QA/QC, HSE | general journal, as-built documentation, inspections, punch list, daily logs | field_mobile_offline, journals_registry, inspection_checklists, nonconformance, hse_incidents, immutable_audit |
| Актирование, расчеты, выручка по мере готовности, ЭДО | KS-2/KS-3/KS-6a, UPD, progress billing, EAC/ETC forecasts | measurement_to_acting, progress_revenue_recognition, edi_upd_xml, cost_forecasting_evm, cashflow |
| Ввод в эксплуатацию и передача | commissioning package, handover docs, warranties | handover_checklists, asset_register, warranty_management, closeout_packaging |

### 6.2 Конкуренты: что обязаны перенять

Ниже — ссылки на первоисточники (публичная документация/страницы продуктов), по которым формировались бенчмарки:

- Procore RFI FAQ: https://support.procore.com/faq/what-is-an-rfi
- Procore Change Events (RFQ / Potential Change Orders): https://support.procore.com/products/online/user-guide/project-level/change-events
- Procore Submittals FAQ: https://support.procore.com/faq/what-is-a-submittal
- Autodesk Build (RFI/Submittals/Cost): https://construction.autodesk.com/products/autodesk-build/
- CMiC (Construction ERP/Financials/PM): https://cmicglobal.com/
- Trimble Viewpoint / Vista: https://viewpoint.com/
- Bluebeam collaboration/markup: https://www.bluebeam.com/solutions/revu/
- Fieldwire features nav (tasks/punch/inspection/plans): https://www.fieldwire.com/features/
- PlanRadar (docs/reporting/inspections): https://www.planradar.com/features/
- Smartsheet construction solution: https://www.smartsheet.com/solutions/construction
- monday.com (dashboards/automations): https://monday.com/features/dashboards ; https://monday.com/features/automations
- 1C:Подрядчик строительства (features): https://solutions.1c.ru/catalog/stroy/features

---

## 7) Часть V — GAP анализ

### 7.1 P0: RBAC роли не сходятся (backend code vs seed)

Missing in seed (используются в `@PreAuthorize`, но не создаются миграцией):

| Role code (used in @PreAuthorize) | Example location |
|---|---|
| BID_MANAGER | backend/src/main/java/com/privod/platform/modules/portfolio/web/PortfolioController.java:161 |
| CONTRACT_MANAGER | backend/src/main/java/com/privod/platform/modules/contractExt/web/ContractExtController.java:51 |
| COST_MANAGER | backend/src/main/java/com/privod/platform/modules/costManagement/web/BudgetLineController.java:94 |
| DESIGNER | backend/src/main/java/com/privod/platform/modules/design/web/DesignController.java:76 |
| DOCUMENT_MANAGER | backend/src/main/java/com/privod/platform/modules/russianDoc/web/OcrController.java:57 |
| FINANCE_MANAGER | backend/src/main/java/com/privod/platform/modules/costManagement/web/BudgetLineController.java:94 |
| FLEET_MANAGER | backend/src/main/java/com/privod/platform/modules/fleet/web/FuelController.java:63 |
| INSPECTOR | backend/src/main/java/com/privod/platform/modules/ops/web/WorkOrderController.java:190 |
| LAWYER | backend/src/main/java/com/privod/platform/modules/contractExt/web/LegalCaseController.java:64 |
| LOGISTICS_MANAGER | backend/src/main/java/com/privod/platform/modules/procurementExt/web/DeliveryController.java:61 |
| MAINTENANCE_MANAGER | backend/src/main/java/com/privod/platform/modules/maintenance/web/MaintenanceController.java:77 |
| MANAGER | backend/src/main/java/com/privod/platform/modules/integration/weather/web/WeatherController.java:34 |
| OPERATOR | backend/src/main/java/com/privod/platform/modules/fleet/web/FuelController.java:63 |
| PLANNER | backend/src/main/java/com/privod/platform/modules/monteCarlo/web/MonteCarloController.java:66 |
| PORTAL_CONTRACTOR | backend/src/main/java/com/privod/platform/modules/portal/web/PortalProjectController.java:29 |
| PORTAL_CUSTOMER | backend/src/main/java/com/privod/platform/modules/portal/web/PortalProjectController.java:29 |
| PORTAL_SUBCONTRACTOR | backend/src/main/java/com/privod/platform/modules/portal/web/PortalProjectController.java:29 |
| PORTAL_SUPPLIER | backend/src/main/java/com/privod/platform/modules/portal/web/PortalProjectController.java:29 |
| QUALITY_MANAGER | backend/src/main/java/com/privod/platform/modules/quality/web/NonConformanceController.java:58 |
| RECRUITER | backend/src/main/java/com/privod/platform/modules/recruitment/web/RecruitmentController.java:70 |
| REGULATORY_MANAGER | backend/src/main/java/com/privod/platform/modules/regulatory/web/RegulatoryReportController.java:58 |
| SAFETY_MANAGER | backend/src/main/java/com/privod/platform/modules/hr/web/EmployeeController.java:109 |
| SALES_MANAGER | backend/src/main/java/com/privod/platform/modules/portfolio/web/PortfolioController.java:95 |
| SUPPORT_MANAGER | backend/src/main/java/com/privod/platform/modules/support/web/KnowledgeBaseController.java:55 |
| SYSTEM | backend/src/main/java/com/privod/platform/modules/immutableAudit/web/ImmutableRecordController.java:60 |

Unused in @PreAuthorize (сидятся, но не используются в коде):

| Role code (seeded) | Seed location |
|---|---|
| DOCUMENT_CONTROLLER | backend/src/main/resources/db/migration/V76__seed_roles_and_admin_user.sql:26 |
| FINANCIAL_CONTROLLER | backend/src/main/resources/db/migration/V76__seed_roles_and_admin_user.sql:22 |
| QUALITY_INSPECTOR | backend/src/main/resources/db/migration/V76__seed_roles_and_admin_user.sql:19 |
| SCHEDULER | backend/src/main/resources/db/migration/V76__seed_roles_and_admin_user.sql:25 |
| SYSTEM_INTEGRATOR | backend/src/main/resources/db/migration/V76__seed_roles_and_admin_user.sql:27 |
| VIEWER | backend/src/main/resources/db/migration/V2__auth_tables.sql:84 |

Решение:
- Единый справочник ролей (enum) + генерация seed миграций из кода.
- Сведение frontend `UserRole` + `routePermissions.ts` к backend ролям.

### 7.2 P0: tenant‑изоляция не enforced

Факт:
- `ProjectController.list` принимает `organizationId` как query param и передает в сервис (`backend/src/main/java/.../ProjectController.java:59-66`).
- `ProjectService.create/update` принимает `organizationId` из request body (`ProjectService.java:82`, `ProjectService.java:116-118`).

Риск:
- Межорганизационный доступ/подмена данных при наличии роли.

Решение:
- Получать `organizationId` из `CustomUserDetails` / SecurityContext, а не из запроса.
- Добавить tenant filter на уровне репозиториев/specifications.
- Вынести «tenant guard» в общий слой (AOP/Filter).

---

## 8) Часть VI — Интеграции (prioritized)

У вас уже есть сильный задел в `modules/integration/*` (1C, SBIS, EDO, WebDAV, SMS, Weather, Gov registries).

Priority P0/P1 (critical):
- Финансы/учет: 1C, банки, сверки, акты, ЭДО.
- Документы/подпись: Диадок/СБИС/Контур, КЭП.
- Файлы/CDE: S3/SharePoint/OneDrive/WebDAV + версии/метаданные.

Priority P2 (important):
- BIM: Revit/Navisworks/IFC workflows.
- Коммуникации: email, Telegram/WhatsApp, webhooks.

Priority P3 (nice):
- IoT/метео/бетон, GPS, marketplace материалов.

---

## 9) Часть VII — Production readiness (детализация)

P0 blockers:
1. RBAC mismatch.
2. Tenant isolation.
3. Seed admin user with static password (`V76__seed_roles_and_admin_user.sql:259-287`).
4. Dev/Docker migration parity: `application-dev.yml` disables Flyway; `application-docker.yml` baselines Flyway at `999` while `ddl-auto: update` is enabled → migrations/seeds are not applied consistently across environments.  

---

## 10) Competitive Matrix (high-level)

| Capability area | Privod Next | Procore | Autodesk Build | CMiC | Vista | Fieldwire | Bluebeam | 1C |
|---|---|---|---|---|---|---|---|---|
| RFIs | Partial | Strong | Strong | Medium | Medium | Weak | None | Weak |
| Submittals | Partial | Strong | Strong | Medium | Medium | Weak | None | Weak |
| Change events / RFQ / CO chain | Partial | Strong | Strong | Strong | Medium | Weak | None | Weak |
| Cost mgmt (commitments/EAC) | Medium | Strong | Strong | Strong | Strong | Weak | None | Strong |
| Docs/CDE/revisions | Partial | Strong | Strong | Medium | Medium | Weak | Strong (PDF layer) | Medium |
| Field mobile/offline | Medium | Strong | Strong | Medium | Medium | Strong | Medium | Weak |
| QA/QC + punchlist | Medium | Strong | Strong | Medium | Medium | Strong | Weak | Weak |
| Accounting / compliance (RU) | Medium | Weak | Weak | Strong | Strong | Weak | Weak | Strong |

---

## 11) Полный список проблем и рекомендаций (сжатый реестр)

🔴 CRITICAL
- Production RBAC mismatch: `ui_audit/09_part1_rbac_role_mismatch.csv`.
- Tenant isolation missing: `ProjectController`/`ProjectService` (organizationId from request).
- Demo fallback in detail/forms: multiple `placeholderData:` usages (см. `functions.rg` по `placeholderData`).

🟠 SERIOUS
- Typing debt in forms (`as any` hotspots): `InspectionFormPage.tsx`.
- Table scalability: virtualization/server pagination missing.
- Документы: `/documents` имеет stub маршрут.

🟡 IMPROVEMENT
- i18n adoption incomplete (есть, но не во всех доменах).
- Saved views / presets для power users.

🔵 POLISH
- Пересобрать навигацию по ролям + избранное.

---

## 12) Стратегическая дорожная карта (P0–P4)

- P0 — Production blockers (0–4 недели)
  - RBAC унификация (код ↔ seed ↔ фронт).
  - Tenant isolation enforcement.
  - Убрать semantic demo fallback на критичных экранах.
  - Security hardening: убрать статический admin seed для prod.

- P1 — Core Value (1–3 месяца)
  - RFI/Submittals/Change Events chain как единый workflow.
  - Procurement RFQ compare + scoring.
  - CDE: transmittals, revision sets, ISO19650‑подобный lifecycle.

- P2 — Market parity (3–6 месяцев)
  - EAC/ETC/cashflow forecasting.
  - Saved views + virtualization на heavy таблицах.
  - Импорт/экспорт UX по всем сущностям.

- P3 — Market leadership (6–12 месяцев)
  - BIM workflows + link issues/RFI/change to model/drawings.
  - Rule engine/automation (как monday/Jira) для approvals.

- P4 — Innovation (12+)
  - AI ассистент по фото/рискам/прогнозам.
  - IoT/geo/marketplace.

---

## 13) Что сделано хорошо (на чем строить)

- Design System и токены.
- Мобильный offline draft + очередь.
- Сильный backend модульный фундамент.
- CI/CD и docker‑топология.

