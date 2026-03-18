# PRIVOD World-Class Index

> Этот файл — МОЗГ между сессиями Claude Code.
> КАЖДАЯ сессия начинается с чтения этого файла.
> КАЖДАЯ сессия заканчивается обновлением этого файла.

## Текущий статус
- **Фаза**: 2 НАЧАТА 🚀 — ROADMAP v2 (полное покрытие всех аудитов), 71 задача / 287 сессий / 19 спринтов
- **Последняя сессия**: 2.0-roadmap v2 (Формирование + кросс-проверка vs ВСЕ аудиты) — 2026-03-19
- **Следующая сессия**: Спринт 1, задача S1-01 — Fix SQL Injection в PortalDataProxyController
- **Roadmap**: `phase2-plan/ROADMAP.md` — **71 задач, 7 этапов, 19 спринтов, ~287 сессий Claude Code**
- **Итоговый отчёт Фазы 1**: `phase1-audit/FINAL-REPORT.md`
- **Конкурентный анализ**: `COMPETITORS.md` — 13 конкурентов (6 РФ + 7 мир), ТОП-20 фич, 5 уникальных возможностей, positioning
- **Общая оценка (итоговая)**: 6.2/10 → целевая 9.8/10
- **Production readiness**: 38% → целевая 99%
- **Путь к коммерческому запуску**: 19 спринтов × 2 недели = ~9.5 месяцев

### Прогресс по этапам
| Этап | Спринты | Задач | Сессий | Статус |
|------|---------|-------|--------|--------|
| 1. Стабильность (безопасность, tenant isolation) | 1–4 | 20 | 58 | ⏳ Не начат |
| 2. Ядро (финансы, документы, навигация) | 5–8 | 18 | 84 | ⏳ Не начат |
| 3. SaaS-ready (мониторинг, тесты, billing) | 9–11 | 13 | 39 | ⏳ Не начат |
| 4. Продажи (лендинг, демо, юридика, planning) | 12–13 | 5 | 21 | ⏳ Не начат |
| 5. Масштаб (1С, ЭДО, мобилка, AI) | 14–17 | 5 | 36 | ⏳ Не начат |
| 6. Стабилизация (module-level P2 bug fixes) | 18 | 6 | 25 | ⏳ Не начат |
| 7. Конкурентность (AI Agent Builder, Predictive, 360°) | 19 | 4 | 24 | ⏳ Не начат |

## Ключевые выводы сессии 1.0

**Общая оценка: 6.5/10 — "Крепкий MVP с амбициями enterprise"**

- **Сайдбар**: 26 групп, ~200 страниц. Из них: ~95 working (47%), ~85 partial (43%), ~20 stub (10%)
- 93 бэкенд + 87 фронтенд модулей, 2493 API-эндпоинтов, 591 entity — масштаб уровня Procore
- Multi-tenancy, JWT+RBAC, design system, i18n — архитектурный фундамент крепкий
- **P1 баги**: credentials в git, ddl-auto:update, missing tenant isolation в BIM, NPE в BudgetService
- **Критический gap**: НЕТ реальной 1С интеграции, ЭДО, КЭП, ИСУП (всё заглушки)
- **Критический gap**: ~~НЕТ EVM/CPM в planning~~ (ЕСТЬ: CPM+EVM enterprise-level, 7.5/10), нет workflow engine, нет большинства печатных форм
- God-components: FmPage (880 строк), BudgetService (896 строк)
- Production readiness: **60%**. До первого платящего клиента: **45%**
- **Полная карта по сайдбару**: `phase1-audit/1.0-overview.md` раздел 2 (все 26 групп, все ~200 страниц)

## Проанализированные модули

| # | Модуль | Статус | Оценка | Критичных багов | Дата |
|---|--------|--------|--------|-----------------|------|
| — | **Обзор всего проекта** | done | 6.5/10 | 5 P1, 9 P2 | 2026-03-15 |
| 1.1 | **finance** | done | 6.0/10 | 4 P1, 5 P2, 9 P3 | 2026-03-15 |
| 1.2 | **estimates + pricing** | done | 5.5/10 | 5 P1, 8 P2, 12 P3 | 2026-03-15 |
| 1.3 | **closing + russianDocs + execDocs** | done | 5.5/10 | 1 P1, 10 P2, 10 P3 | 2026-03-15 |
| 1.5 | **specifications** | done | 7.0/10 | 2 P1, 9 P2, 11 P3 | 2026-03-15 |
| 1.4 | **contracts** | done | 6.5/10 | 4 P1, 8 P2, 8 P3 | 2026-03-15 |
| 1.6 | **operations + site** | done | 6.0/10 | 5 P1, 8 P2, 10 P3 | 2026-03-15 |
| 1.7 | **safety** | done | 7.0/10 | 2 P1, 8 P2, 5 P3 | 2026-03-15 |
| 1.8 | **quality + regulatory** | done | 6.5/10 | 2 P1, 7 P2, 9 P3 | 2026-03-16 |
| 1.9 | **supply: warehouse + procurement + dispatch** | done | 6.0/10 | 3 P1, 12 P2, 12 P3, 2 P4 | 2026-03-16 |
| 1.10 | **fleet + iot** | done | 6.5/10 | 3 P1, 10 P2, 8 P3 | 2026-03-16 |
| 1.13 | **planning** | done | 7.5/10 | 3 P1, 7 P2, 8 P3 | 2026-03-16 |
| 1.14 | **tasks + calendar** | done | 7.0/10 | 3 P1, 7 P2, 8 P3 | 2026-03-16 |
| 1.12 | **dashboard + analytics** | done | 6.0/10 | 5 P1, 10 P2, 13 P3 | 2026-03-16 |
| 1.11 | **projects + site-assessments** | done | 5.5/10 | 5 P1, 12 P2, 16 P3 | 2026-03-16 |
| 1.15 | **processes (RFI, submittals, issues, workflow, change-mgmt)** | done | 6.0/10 | 9 P1, 21 P2, 17 P3 | 2026-03-16 |
| 1.17 | **portal (дашборд, проекты, документы, КС-2, КП подрядчика)** | done | 5.0/10 | 10 P1, 16 P2, 12 P3 | 2026-03-16 |
| 1.16 | **documents + dataExchange + integration1c (CDE, PTO, 1С, ЭДО)** | done | 6.0/10 | 10 P1, 15 P2, 12 P3 | 2026-03-16 |
| 1.18 | **bim (модели, clash, overlay, pins, прогресс, heatmap)** | done | 5.0/10 | 5 P1, 12 P2, 11 P3 | 2026-03-16 |
| 1.20 | **design (версии, ревью, доска, разделы)** | done | 5.0/10 | 5 P1, 12 P2, 8 P3 | 2026-03-16 |
| 1.19 | **workflow + approval (маршруты, inbox, change-mgmt)** | done | 6.5/10 | 6 P1, 15 P2, 11 P3 | 2026-03-16 |
| 1.21 | **hr + hrRussian (сотрудники, табели, штатное, квалификации, бригады, РФ-кадры)** | done | 6.5/10 | 8 P1, 14 P2, 11 P3 | 2026-03-16 |
| 1.22 | **leave + payroll + selfEmployed + recruitment** | done | 6.0/10 | 7 P1, 10 P2, 15 P3 | 2026-03-16 |
| 1.23 | **sales: crm + portfolio + bidManagement + CP + counterparties** | done | 7.0/10 | 4 P1, 8 P2, 12 P3 | 2026-03-16 |
| 1.24 | **admin + settings + subscription + monitoring** | done | 7.5/10 | 3 P1, 6 P2, 12 P3 | 2026-03-16 |
| 1.25 | **closeout + maintenance (приёмка, гарантии, обслуживание)** | done | 6.5/10 | 5 P1, 11 P2, 11 P3 | 2026-03-16 |
| 1.26 | **legal + mail + messenger + ai + help (юрид., почта, чат, AI, KB)** | done | 7.0/10 | 2 P1, 8 P2, 12 P3 | 2026-03-16 |
| 1.X | **architecture + infrastructure + security + production-readiness** | done | 6.0/10 | 12 P1, 18 P2, 14 P3 | 2026-03-18 |
| 1.UX | **UX-аудит навигации (24 группы, ~185 пунктов, сравнение с 5 конкурентами)** | done | 3.0/10 | — | 2026-03-18 |

## Ключевые выводы UX-аудита навигации

- **24 группы, ~185 пунктов** в сайдбаре. У Procore ~12, у PlanRadar ~7. Перегруз в 10-25x.
- **5 групп с 20+ пунктами**: Финансы (29!), Кадры (28), Качество (27), Снабжение (27), Документы (20)
- **6+ дублирующих пунктов**: наряд-заказы ×2, штатное ×2, табели ×2, М-29 ×2, дефекты/реестр дефектов, тендеры ×2
- **15+ непонятных названий**: RFI, Сабмиталы, CDE, Quality Gates, Хаб прогнозирования, S-кривая ДДС
- **Портал подрядчика (10 пунктов)** в основном сайдбаре (должен быть отдельный URL)
- **Ролевая фильтрация не работает**: прораб видит «Калькулятор факторинга» и «IoT датчики»
- **Рекомендация**: 24 → 10 групп, ~185 → ~60 пунктов, ролевые наборы, проектно-центричная навигация
- **Подробно**: `phase1-audit/1.UX-navigation.md`

## Критические находки
1. Hardcoded credentials в docker-compose (P1)
2. ddl-auto: update не переопределён для production (P1)
3. BimModelService — нет tenant isolation (P1)
4. BudgetService:294 — NPE на null revenue (P1)
5. Нет реальной 1С интеграции (P1-business)
6. **НДС: VatCalculator=20%, но с 2026 НДС=22%** — бэкенд устарел, фронтенд ФМ правильный (P1) ← 1.1
7. **N+1 + in-memory pagination** в BudgetService.getExpenses() — OOM risk (P1) ← 1.1
8. **CashFlowEntry дублирование** при повторной оплате счёта (P1) ← 1.1
9. **5 ЗАГЛУШЕК в production** EstimateAdvancedService: searchNormativeRates, importLsr, getComparison, exportEstimate, importEstimate — все возвращают mock/null данные (P1) ← 1.2
10. **НДС 20% в LocalEstimate** — VatCalculator.DEFAULT_RATE=20 используется при создании ЛСР (P1) ← 1.2
11. **EstimateService — нет tenant isolation**: listEstimates() без organizationId predicate (P2) ← 1.2
12. **UUID.randomUUID() fallback** для specificationId в CompetitiveListService — corrupt FK (P2) ← 1.2
13. **organizationId НЕ УСТАНАВЛИВАЕТСЯ** при создании КС-2/КС-3/строк — tenant isolation сломан (P1) ← 1.3
14. **Ks2Response/Ks2LineResponse** не отдают VAT поля, хотя в БД есть (P2) ← 1.3
15. **5 execDocs страниц БЕЗ БЭКЕНДА** — localStorage only, данные теряются (P2) ← 1.3
16. **DiadokClient = 100% mock** — ЭДО не работает (P2) ← 1.3
17. **PDF/1С экспорт КС-2/КС-3 = toast-заглушки** (P2) ← 1.3
18. **КС-6а = пустой стаб**, CorrectionActs = UnsupportedOperationException (P2) ← 1.3
19. **SpecificationService.listSpecifications() — нет tenant isolation** (P1) ← 1.5
20. **Specification.name — global UNIQUE** constraint через все организации (P1) ← 1.5
21. **8 GET endpoints без @PreAuthorize** в SpecificationController + MaterialAnalogController (P2) ← 1.5
22. **PDF upload без size limit** — DoS vector через readAllBytes() (P2) ← 1.5
23. **autoSelectBestPrices() не валидирует min proposals** (P2) ← 1.5
19. **ContractExt — системный IDOR**: 8 create без organizationId + нет проверки contractId ownership (P1) ← 1.4
20. **ToleranceController.listAll()** — all data all orgs without filter (P1) ← 1.4
21. **ContractSignWizard** — signatory data NOT saved, only status change (P1) ← 1.4
22. **ContractBoardPage** — статусы COMPLETED/TERMINATED не совпадают с бэкендом CLOSED/CANCELLED (P2) ← 1.424. CORS wildcard в nginx (P2)
20. Mock-данные в SafetyDashboard production (P2)
21. Нет Error Boundary для lazy chunks (P2)
22. Нет SAST/DAST в CI (P2)
23. **DispatchOrder — НЕТ tenant isolation**: нет org_id, нет @Filter (P1) ← 1.6
24. **DailyReport — НЕТ tenant isolation**: нет org_id, нет @Filter (P1) ← 1.6
25. **M29Document — НЕТ tenant isolation**: нет org_id, createM29() без SecurityUtils (P1) ← 1.6
26. **M29Document.name — global UNIQUE** через все организации (P1) ← 1.6
27. **DispatchService.orderSequence — AtomicLong**, сбрасывается при рестарте (P1) ← 1.6
28. **DefectDashboard cross-tenant aggregation** — 6 queries без org filter (P2) ← 1.6
29. **WorkOrderBoardPage — 100% mock** (пустой useState, нет API) (P2) ← 1.6
30. **SafetyComplianceService.hasUpcomingTraining() — ГЛОБАЛЬНАЯ проверка** вместо per-employee+org (P1) ← 1.7
31. **SafetyRiskScoringService.countOverdueTrainings() — STUB, return 0** — training compliance = 0 risk always (P1) ← 1.7
32. **15+ GET endpoints без @PreAuthorize** в 5 safety controllers (P2) ← 1.7
33. **SafetyDashboardPage — mock data** `[85,88,82,...]`, value="0"/"47" hardcoded (P2) ← 1.7
34. **SafetyBoardPage — HTML5 DnD** не мигрирован на @dnd-kit (мобильные сломаны) (P2) ← 1.7
35. **ReportingDeadline — НЕТ organizationId**: entity без tenant isolation, все дедлайны глобальные (P1) ← 1.8
36. **QualityCertificateController expired/expiring — cross-tenant**: сертификаты всех организаций (P1) ← 1.8
37. **20+ GET endpoints без @PreAuthorize** в quality (18) + regulatory (11) controllers (P2) ← 1.8
38. **PermitBoardPage — 100% mock**: useState([]), нет API calls (P2) ← 1.8
39. **QualityBoardPage — HTML5 DnD** не мигрирован на @dnd-kit (P2) ← 1.8
40. **Prescription overdue — нет auto-update** статуса когда deadline < today() (P2) ← 1.8
41. **Duplicate PurchaseOrder entity**: procurement + procurementExt маппят ОДНУ таблицу с РАЗНЫМИ status enum → data corruption (P1) ← 1.9
42. **PurchaseRequest.name — global UNIQUE** через все организации → tenant collision (P1) ← 1.9
43. **procurementExt Delivery — НЕТ tenant isolation**: getDelivery() без org filter → cross-tenant access (P1) ← 1.9
44. **22+ GET endpoints без @PreAuthorize** в warehouse + procurement controllers (P2) ← 1.9
45. **PurchaseRequestBoardPage — HTML5 DnD** не мигрирована на @dnd-kit (мобильные сломаны) (P2) ← 1.9
46. **sendPriceRequests() — STUB**: только логирует, не создаёт entity (P2) ← 1.9
47. **InventoryPage create modal не работает**: кнопка закрывает без API call (P2) ← 1.9
48. **Dispatch frontend status mismatch**: DRAFT/SCHEDULED vs backend PLANNED (P2) ← 1.9
49. **IoT Sensor — ZERO tenant isolation**: 5 таблиц без organization_id, IoTDeviceService без org filter (P1) ← 1.10
50. **Frontend GPS → Backend IoT path mismatch**: frontend /fleet/gps/* vs backend /api/iot/equipment/* — 404 → localStorage fallback (P1) ← 1.10
51. **VehicleAssignment + FuelRecord — нет organizationId**: косвенная фильтрация через Vehicle (P1) ← 1.10
52. **GpsTrackingPage + DriverRatingPage — 100% mock**: localStorage fallback, backend endpoints отсутствуют (P2) ← 1.10
53. **FleetDetailPage — 4 вкладки пустые**: API функции есть, но не вызываются (P2) ← 1.10
54. **IoT Sensor + GPS Timesheet — 2 дублирующие geofence подсистемы** (P2) ← 1.10
55. **CalendarEvent entity — НЕТ @Filter tenant isolation**: события cross-org видны всем (P1) ← 1.14
56. **ConstructionSchedule entity — НЕТ @Filter tenant isolation**: графики cross-org видны всем (P1) ← 1.14
57. **TaskParticipantService.hasAccess() — PROJECT visibility = true для ВСЕХ**: `return true` с TODO комментарием (P1) ← 1.14
58. **14+ GET endpoints без @PreAuthorize** в 3 calendar controllers (P2) ← 1.14
59. **BulkActionsBar — удаление задач БЕЗ подтверждения** (P2) ← 1.14
60. **EvmSnapshot — НЕТ tenant isolation**: entity без organizationId, 5 GET без @PreAuthorize (P1) ← 1.13
61. **ScheduleBaseline — НЕТ tenant isolation**: entity без organizationId, 4 GET без @PreAuthorize (P1) ← 1.13
62. **ResourceAllocation — НЕТ tenant isolation**: entity без organizationId, 3 GET без @PreAuthorize (P1) ← 1.13
63. **29 GET endpoints без @PreAuthorize** в 10 planning controllers (P2) ← 1.13
64. **Gantt read-only**: нет WBS CRUD UI, нет drag, нет стрелок зависимостей (P2) ← 1.13
65. **Dashboard entity — НЕТ tenant isolation**: нет org_id, нет @Filter (P1) ← 1.12
66. **KpiDefinition — НЕТ tenant isolation**: нет org_id, нет @Filter (P1) ← 1.12
67. **SavedReport — НЕТ tenant isolation**: нет org_id, нет @Filter (P1) ← 1.12
68. **AnalyticsDataService hardcoded 0.85**: маржа always 15%, бюджет always 85% (P1) ← 1.12
69. **PredictiveAnalyticsService DEFECT_WEIGHT copy-paste**: change order × wrong weight (P1) ← 1.12
70. **13+ analytics GET с ослабленным RBAC**: VIEWER видит financials, budgets, KPIs (P2) ← 1.12
71. **Financial bars + Safety metrics = fabricated data**: total/6 вместо GROUP BY month (P2) ← 1.12
72. **PredictiveAnalyticsPage = 100% mock frontend**: 694 LOC все hardcoded (P2) ← 1.12
73. **Milestone IDOR — нет tenant isolation**: updateMilestone/deleteMilestone без org check (P1) ← 1.11
74. **Collaborator IDOR — entity БЕЗ @Filter, БЕЗ organizationId** (P1) ← 1.11
75. **DB CHECK constraint блокирует 6 новых ProjectType** → INSERT error (P1) ← 1.11
76. **SiteAssessment: НЕТ backend update endpoint** — PUT → 405 (P1) ← 1.11
77. **SiteAssessment: entity/migration field mismatch** — геотехника = frontend-иллюзия (P1) ← 1.11
78. **ProjectSetupWizard — STUB**: handleFinish не создаёт проект (P2) ← 1.11
79. **PortfolioHealthPage 4/7 RAG — СИМУЛЯЦИЯ**: hashCode % 5 (P2) ← 1.11
80. **4 backend test файла не компилируются** (P2) ← 1.11
81. **pmWorkflow cross-tenant утечка**: RFI/Issues/Submittals — ВСЕ list/get/overdue без org filter (P1) ← 1.15
82. **changeManagement cross-tenant утечка**: CO/CE/COR — list/get без org filter (P1) ← 1.15
83. **ChangeOrderRequest — НЕТ organizationId в entity** (P1) ← 1.15
84. **IDOR: path variable игнорируется** в 3 контроллерах (RFI responses, Issue comments, Submittal reviews) (P1) ← 1.15
85. **ApprovalStep approve/reject — нет ownership check** (P1) ← 1.15
86. **ChangeOrderDetailPage status → createChangeOrder вместо changeStatus** (P1) ← 1.15
87. **ChangeEventDetailPage status → createChangeEvent вместо changeStatus** (P1) ← 1.15
88. **ChangeOrderBoardPage — 100% non-functional** (useState([]), нет API) (P1) ← 1.15
89. **RfiFormPage навигация → /rfi вместо /pm/rfis** — все 404 (P1) ← 1.15
90. **35+ GET endpoints без @PreAuthorize** в 11 процессных controllers (P2) ← 1.15
91. **SQL INJECTION в PortalDataProxyController — 7 мест** строковой конкатенации user input в SQL (P1) ← 1.17
92. **portalUserId передаётся как @RequestParam** — identity spoofing в 8+ endpoints (P1) ← 1.17
93. **3 portal entities БЕЗ organizationId**: PortalMessage, PortalProject, PortalDocument — cross-tenant leaks (P1) ← 1.17
94. **PortalAdminController — cross-tenant user management**: list/view/block users across orgs (P1) ← 1.17
95. **IDOR в 4 portal services**: getById без ownership check (P1) ← 1.17
96. **5 portal pages без routes**: DailyReports, Defects, Photos, RFI, Signatures → 404 (P2) ← 1.17
97. **11 BIM entities БЕЗ organizationId**: BimModel, BimElement, BimClash, BimVersion, BimViewer, DesignPackage, DesignDrawing, DrawingAnnotation, PhotoProgress, PhotoComparison, PhotoAlbum — cross-tenant data access (P1) ← 1.18
98. **simulateClashDetection() — FAKE**: генерирует Random данные в production DB (P1) ← 1.18
99. **3 frontend BIM pages вызывают несуществующие backend endpoints** — ConstructionProgress, PropertySets, BcfTopics → 404 (P1) ← 1.18
100. **10+ API path/method mismatches** в BIM — frontend↔backend рассинхронизированы (P2) ← 1.18
101. **32 GET endpoints без @PreAuthorize** в 11 BIM controllers (P2) ← 1.18
102. **DrawingOverlayComparisonPage + DrawingPinsPage = 100% mock** — canvas/SVG работает, но нет API (P2) ← 1.18
103. **CDE DocumentContainer + Transmittal — НЕТ organizationId/tenant filter**: 6/7 CDE entities без tenant isolation (P1) ← 1.16
104. **PTO PtoDocument + WorkPermit + LabTest + Ks6Journal — НЕТ org/tenant filter**: 5 PTO entities cross-tenant (P1) ← 1.16
105. **DataExchange — НЕТ REST контроллеров**: frontend → 404 на все 10 endpoints (P1) ← 1.16
106. **DiadokClient = 100% MOCK**: ЭДО полностью не работает (P1) ← 1.16
107. **PtoCodeGenerator AtomicLong**: сбрасывается при рестарте → коллизии кодов (P1) ← 1.16
108. **Integration1C export = STUBS**: exportKs2/Ks3/Invoices создают log но не отправляют (P1) ← 1.16
109. **22+ GET endpoints без @PreAuthorize** в Document + CDE + EDO controllers (P2) ← 1.16
110. **3 design entities БЕЗ organizationId**: DesignVersion, DesignReview, DesignSection — cross-tenant data access (P1) ← 1.20
111. **Frontend↔Backend field mismatch**: 15+ полей (number, sectionName, authorName, projectName, reviewCount и др.) не существуют в backend DTO — all list pages show undefined (P1) ← 1.20
112. **updateVersionStatus → PATCH /status — endpoint НЕ СУЩЕСТВУЕТ**: backend has only POST submit-for-review/approve. Update form → 405 (P1) ← 1.20
113. **DesignReviewBoardPage = 100% mock**: useState([]), no API calls, always empty. HTML5 DnD (mobile broken) (P1) ← 1.20
114. **DesignSectionListPage getSections() БЕЗ projectId**: backend @RequestParam required → 400 Bad Request (P1) ← 1.20
115. **8 GET endpoints без @PreAuthorize** в DesignController (P2) ← 1.20
116. **ApprovalStep approve/reject — ZERO ownership check**: любой user любого org может approve/reject step | `ApprovalService.java:98-143` (P1) ← 1.19
117. **WorkflowDefinition CRUD — cross-tenant**: 6 методов без org check (findById→replaceSteps) | `WorkflowDefinitionService.java:50-153` (P1) ← 1.19
118. **submitDecision — нет approver verification**: не проверяет caller = designated approver | `ApprovalInstanceService.java:192-290` (P1) ← 1.19
119. **AutomationExecution findAll без org filter**: ruleId=null → все executions всех org (P1) ← 1.19
120. **getHistory — cross-tenant leak**: findByEntityIdAndEntityType без org filter (P1) ← 1.19
121. **getChainById — cross-tenant access**: findByIdAndDeletedFalse без org check (P1) ← 1.19
122. **2 конкурирующие системы согласования**: approval (Chain) + workflowEngine (Instance) — дублирование, double attack surface (P2) ← 1.19
123. **5 GET endpoints без @PreAuthorize** в WorkflowDefinitionCtrl (3) + ApprovalCtrl (2) (P2) ← 1.19
124. **Leave entities — НЕТ organizationId**: LeaveType, LeaveRequest, LeaveAllocation без tenant isolation (P1) ← 1.22
125. **Payroll entities — НЕТ organizationId**: PayrollTemplate, PayrollCalculation — зарплатные данные cross-tenant (P1) ← 1.22
126. **Recruitment entities — НЕТ organizationId**: Applicant, JobPosition, Interview — PII cross-tenant (P1) ← 1.22
127. **SelfEmployed Contractor/Payment/Registry — НЕТ tenant isolation**: 3 entity без organizationId (P1) ← 1.22
128. **28+ GET endpoints без @PreAuthorize** в 4 HR модулях — зарплаты, PII, банк.реквизиты доступны VIEWER (P1) ← 1.22
129. **Leave approverId from query param** — self-approval возможен, нет employee ownership check (P1) ← 1.22
130. **Payroll frontend↔backend type mismatch**: PIECE_RATE/MIXED vs PIECEWORK/BONUS; Recruitment SCREENING vs INITIAL_QUALIFICATION (P2) ← 1.22
131. **LeaveBoardPage + ApplicantBoardPage — 100% local state**: useState([]), нет backend persist (P2) ← 1.22
132. **Дублирование BidPackage entity**: 2 JPA класса маппят `bid_packages` — Portfolio-версия БЕЗ tenant isolation (P1) ← 1.23
133. **BidInvitation — НЕТ organizationId, НЕТ @Filter**: IDOR через findByIdAndDeletedFalse (P1) ← 1.23
134. **BidEvaluation — НЕТ organizationId, НЕТ @Filter** (P1) ← 1.23
135. **BidManagement listPackages cross-tenant**: projectId загружает ВСЕ пакеты, фильтрует in-memory (P1) ← 1.23
136. **EmploymentContractService.createContract() не устанавливает organizationId**: builder без .organizationId() → контракт «исчезает» (P1) ← 1.21
137. **PayrollService — 6 cross-module imports из 3 модулей**: нарушает модульную изоляцию (finance, hr, calendar) (P1) ← 1.21
138. **LeaveService.findAll() без tenant filter**: при отсутствии фильтров = ВСЕ заявки ВСЕХ организаций (P1) ← 1.21
139. **EmailMessage НЕТ organizationId** — единый mailbox без tenant isolation, все тенанты видят всю переписку (P1) ← 1.26
140. **AI IDOR: resolveConversation() без userId check** — любой auth user может прочитать чужие AI-диалоги по UUID (P1) ← 1.26
141. **Maintenance — ZERO tenant isolation**: 5 entities без organizationId/@Filter, 24 service метода без SecurityUtils, 11 GET без @PreAuthorize (P1) ← 1.25
142. **6+ closeout frontend API path mismatches**: commissioning-items, stroynadzor-documents, executive-schemas, warranty-records, templates, zos → 404 (P1) ← 1.25
143. **computeChecklistMetrics() — FAKE data**: IN_PROGRESS=60%, FAILED=20% — frontend fabricates числа (P1) ← 1.25
144. **SQL Injection в PortalDataProxyController — 7 мест** строковой конкатенации user input в SQL (P1) ← 1.X
145. **324 entities (53%) без organizationId/@Filter** — системная cross-tenant утечка (P1) ← 1.X
146. **PostgreSQL RLS отсутствует** — native queries обходят Hibernate @Filter (P1) ← 1.X
147. **MinIO без tenant prefix** — UUID файла = cross-tenant access (P1) ← 1.X
148. **JWT secret validation = warning-only** — приложение стартует со слабым секретом (P1) ← 1.X
149. **Hardcoded production credentials в git** — DB/Redis/MinIO/JWT passwords (P1) ← 1.X
150. **CORS allowedHeaders(*) + credentials(true)** — arbitrary header injection (P1) ← 1.X
151. **Redis/cache без tenant namespace** — permission cache shared cross-tenant (P1) ← 1.X
152. **ApiRateLimitService in-memory** — multi-instance = rate limit bypass (P1) ← 1.X
153. **PII не маскируется в логах** — 152-ФЗ violation (P1) ← 1.X

## Рекомендованный порядок аудита (все 26 групп сайдбара)

### Волна 1 (1.1-1.5): Финансовая цепочка — ЯДРО продукта
> Если финансы не работают — продукт не продаётся.
- 1.1 ✅ **finance** (29 пунктов сайдбара: бюджеты, ФМ, контракты, инвойсы, платежи, cashflow, accounting, revenue, cost-mgmt, bank, treasury, tax)
- 1.2 ✅ **estimates + pricing** (14 пунктов: сметы, Минстрой, ценообразование, коэффициенты)
- 1.3 ✅ **closing + russianDocs + execDocs** (16+5=21 пункт: КС-2, КС-3, ЭДО, СБИС, АОСР, КС-6, сварка)
- 1.4 ✅ **contracts** (входит в finance group, но отдельный бэкенд-модуль 68 файлов) — **6.5/10, IDOR в contractExt**
- 1.5 ✅ **specifications** (входит в pricing group: спецификации, КЛ, аналоги) — **7.0/10, лучший модуль**

### Волна 2 (1.6-1.10): Полевые операции — каждый день на стройке
- 1.6 ✅ **operations + site** (14 пунктов: журналы работ, дашборд, М-29, мобильные) — **6.0/10, 3 P1 tenant isolation, dispatch+M29 no org**
- 1.7 ✅ **safety** (13 пунктов: инциденты, инструктажи, СИЗ, СОУТ, нарушения) — **7.0/10, compliance engine buggy, 15+ GET без auth, лучшая российская специфика**
- 1.8 ✅ **quality + regulatory** (27 пунктов: дефекты, пунч-листы, чек-листы, допуски, СРО, инспекции) — **6.5/10, 49 entities (самый большой модуль), Quality Gate Engine лучше Procore, ReportingDeadline без tenant isolation**
- 1.9 ✅ **supply: warehouse + procurement + dispatch** (27 пунктов: склад 18, закупки 5, диспетчеризация 4) — **6.0/10, dual PurchaseOrder P1, dispatch no tenant, warehouse best sub-module (7.5)**
- 1.10 ✅ **fleet + iot** (13 пунктов: техника, топливо, ТО, путевые, GPS, IoT) — **6.5/10, МДС 81-3.2001 калькулятор лучший в классе, IoT Sensor без tenant isolation, GPS frontend мок**

### Волна 3 (1.11-1.15): Управление и аналитика — то, что видит руководство
- 1.11 ✅ **projects + site-assessments** (2 пункта, projects 46 файлов) — **5.5/10, 2 IDOR (milestone+collaborator), ProjectType DB CHECK, SiteAssessment edit сломан + entity/migration divergence, ProjectSetupWizard stub, 4/7 RAG симуляция. Monte Carlo + 7-RAG Portfolio лучше конкурентов**
- 1.12 ✅ **dashboard + analytics** (3+10 пунктов: главная, KPI, отчёты, report builder) — **6.0/10, 3 entity без tenant isolation, fabricated financial data, PredictiveAnalytics=100% mock frontend, 12-source ReportBuilder + 7-dim RAG уникальны**
- 1.13 ✅ **planning** (4 пункта: Ганты, EVM, ресурсы, объёмы) — **7.5/10, CPM+EVM+Skills+Multi-project = enterprise-level. 3 P1 tenant isolation. Gantt read-only**
- 1.14 ✅ **tasks + calendar** (2 пункта: Kanban, календарь) — **7.0/10, CPM+4 dep types лучше Procore, CalendarEvent без tenant filter, PROJECT visibility STUB**
- 1.15 ✅ **processes** (6 пунктов: RFI, submittals, issues, workflow, change-mgmt) — **6.0/10, 216+ файлов, 9 P1: системная cross-tenant утечка в 5 модулях, IDOR path variable, CO Board мок. Лучшее: 4-level Change Mgmt + Workflow Engine с auto-approval**

### Волна 4 (1.16-1.20): Интеграции, порталы, BIM — enterprise-level
- 1.16 ✅ **documents + dataExchange + integration1c** (20 пунктов: CDE, PTO, 1С) — **6.0/10, ~160+ backend + 55+ frontend файлов. 10 P1: CDE 6/7 entities без tenant isolation, PTO 5 entities без org, DataExchange НЕТ controllers (404), DiadokClient=mock, PtoCodeGenerator AtomicLong. Лучшее: Document module (7.5) = reference impl, S3+Tika storage (8.5), OneCODataClient+SOAP реальные, DaData/Checko risk scoring (8.0), Drawing markup canvas**
- 1.17 ✅ **portal** (10 пунктов: дашборд, проекты, документы, КС-2, КП подрядчика) — **5.0/10, 108 backend + 20 frontend файлов. 10 P1: SQL INJECTION (7 мест!), identity spoofing (portalUserId from query), 3 entity без organizationId, cross-tenant admin. Лучшее: отдельная JWT auth, КС-2 draft workflow, ClientClaim SLA engine**
- 1.18 ✅ **bim** (6 пунктов: модели, clash, overlay, pins, прогресс, heatmap) — **5.0/10, ~120 backend + 13 frontend файлов. 5 P1: 11 entities без org_id, simulateClashDetection FAKE, 3 pages без backend. 10+ API path mismatches. Лучшее: IFC.js 3D viewer, DefectBimLink heatmap, DrawingOverlay canvas (3 comparison modes)**
- 1.19 ✅ **workflow + approval** (5 пунктов: маршруты, inbox, change-mgmt) — **6.5/10, 44 backend + 17 frontend файлов. 6 P1: ApprovalStep no ownership, WorkflowDef CRUD cross-tenant, submitDecision no approver check, getHistory cross-tenant. Две конкурирующие системы (approval + workflowEngine). Лучшее: ApprovalInboxPage (best UI), batch decisions (уникально), SLA 4-level urgency, ConditionBuilder**
- 1.20 ✅ **design** (4 пункта: версии, ревью, доска, разделы) — **5.0/10, 3 entity без tenant isolation, Board=100% mock, frontend↔backend field mismatch, 3/5 pages broken**

### Волна 5 (1.21-1.26): HR, CRM, поддержка, юридический
- 1.21 ✅ **hr + hrRussian** (28 пунктов: сотрудники, табели, штатное, квалификации, бригады, РФ-кадры) — **6.5/10, 189 backend + 49 frontend файлов. 8 P1: 8 entities без tenant isolation (recruitment 3, leave 3, payroll 2), EmploymentContract createContract без orgId, PayrollService 6 cross-module imports, LeaveService findAll без tenant filter, 15+ GET без @PreAuthorize, LeaveBoardPage+ApplicantBoardPage пустые оболочки. PayrollService (8.0): прогрессивный НДФЛ 5 ступеней, ОПС порог ФЗ-178, ст.152/153/154 ТК РФ. Employee: PII encryption (@EncryptedFieldConverter), @ValidSnils. Уникально: Payroll→Budget ФОТ, Crew Timesheets, CertificationMatrix. 0 печатных форм (Т-1 через Т-8)**
- 1.22 ✅ **leave + payroll + selfEmployed + recruitment** (входят в hr group, отдельные модули) — **6.0/10, 7 P1: tenant isolation в 3/4 модулях, 28+ GET без @PreAuthorize, IDOR approverId. Payroll НДФЛ 5-ступенчатый + ОПС порог = enterprise. SelfEmployed НПД/receipt = stub. 2 Board pages = local state. Уникально: HR+самозанятые+рекрутинг для стройки — нет у Procore/PlanRadar**
- 1.23 ✅ **sales: crm + portfolio + bidManagement + CP + counterparties** (8 пунктов: лиды, контрагенты, КП, портфель) — **7.0/10, 83 backend + 22 frontend файлов. 4 P1: Dual BidPackage entity (Portfolio без @Filter), BidInvitation/BidEvaluation IDOR, listPackages cross-tenant. CRM 8.0: sequential stage machine, Go/No-Go scorecard (15 критериев), Lead→Counterparty/Project conversion. Leveling Matrix = уникально. КП chain: Budget→CP→Approve→Push-to-FM. DaData/Checko risk scoring. 61 unit тест (CRM 18 + Portfolio 31 + CP 12), 0 BidMgmt тестов**
- 1.24 ✅ **admin + settings + subscription + monitoring** (15 пунктов: пользователи, права, SSO, подписки) — **7.5/10, ~200 backend + 46 frontend. 3 P1: HealthCheck 5/6 fake, BackupService simulated, webhook HMAC optional. ЛУЧШИЙ модуль: 3-layer tenant isolation, 15×37 RBAC, JWT+TOTP+BCrypt+RateLimit, full audit. Frontend 100% functional/dark/i18n. 49 тестов, 0 на subscription/payment**
- 1.25 ✅ **closeout + maintenance** (11+3 пунктов: приёмка, гарантии, обслуживание) — **6.5/10, 5 P1: maintenance ZERO tenant isolation (5 entities), 6 API path mismatches, fake checklist metrics. StroynadzorPackage уникален. Closeout backend 8.0, maintenance 4.0**
- 1.26 ✅ **legal + mail + messenger + ai + help** (3+1+1+2+1=8 пунктов: юрид., почта, чат, AI, KB) — **7.0/10, 189 backend + 48 frontend файлов. 2 P1: EmailMessage без tenant isolation, AI IDOR resolveConversation. Legal (8.0) = эталонная архитектура, уникальная фича. Messenger (7.5) = enterprise-level с WebRTC calls. AI (6.0) = 40% mock (photo/risk). Mail (7.5) = IMAP/SMTP + 17 email templates. Help (7.0) = 92 KB статьи, context-sensitive help. 0 тестов во всех 5 модулях**

## Полная карта сайдбара (26 групп, ~200 страниц)

| # | Группа | Пунктов | working | partial | stub |
|---|--------|---------|---------|---------|------|
| 1 | home | 3 | 3 | 0 | 0 |
| 2 | tasks | 1 | 1 | 0 | 0 |
| 3 | calendar | 1 | 1 | 0 | 0 |
| 4 | planning | 4 | 0 | 4 | 0 |
| 5 | processes | 6 | 4 | 2 | 0 |
| 6 | projects | 2 | 1 | 0 | 1 |
| 7 | sales | 8 | 4 | 4 | 0 |
| 8 | documents | 20 | 12 | 4 | 4 |
| 9 | design | 4 | 0 | 4 | 0 |
| 10 | execDocs | 5 | 0 | 0 | **5** |
| 11 | finance | 29 | 10 | 19 | 0 |
| 12 | pricing | 14 | 5 | 9 | 0 |
| 13 | supply | 27 | 12 | 15 | 0 |
| 14 | hr | 28 | 7 | 21 | 0 |
| 15 | safety | 13 | 9 | 4 | 0 |
| 16 | quality | 27 | 16 | 11 | 0 |
| 17 | fleet | 13 | 4 | 6 | 3 |
| 18 | site | 14 | 2 | 8 | 4 |
| 19 | closeout | 11 | 11 | 0 | 0 |
| 20 | maintenance | 3 | 0 | 3 | 0 |
| 21 | legal | 3 | 0 | 2 | 1 |
| 22 | portal | 10 | 0 | 10 | 0 |
| 23 | messenger | 1 | 1 | 0 | 0 |
| 24 | mail | 1 | 0 | 1 | 0 |
| 25 | admin | 15 | 9 | 4 | 2 |
| 26 | knowledge | 1 | 1 | 0 | 0 |
| | **ИТОГО** | **~200** | **~95 (47%)** | **~85 (43%)** | **~20 (10%)** |

## Статистика (ФАЗА 1 ЗАВЕРШЕНА ✅)
- Групп сайдбара: **26 / 26** ✅
- Страниц в сайдбаре: ~200
- Модулей проверено: **ВСЕ 26 групп + архитектура ✅**
- Итоговый отчёт: **`phase1-audit/FINAL-REPORT.md`** ✅
- Багов найдено: **721** (P1: 129, P2: 290, P3: 295, P4: 7)
- Улучшений предложено: **676** (Must: 140, Should: 375, Nice: 171)
- Критических блокеров продакшена: **15** (см. FINAL-REPORT раздел 2)
- Средняя оценка модулей: **6.2/10** (min 5.0, max 7.5)
- Entities без tenant isolation: **40+**
- Endpoints без @PreAuthorize: **200+**
- Production readiness: **38%** → целевая **99%**
- Задач в roadmap: **71** (original 46 + 25 после кросс-проверки)
- Сессий Claude Code: **~287**
- Задач выполнено: **0 / 71**
- Текущий спринт: **1** (Emergency Security)
- Кросс-проверка vs все аудиты: **ЗАВЕРШЕНА** ✅
- Product Backlog (P3 + Nice-to-Have): **~500+ пунктов** в Приложении B ROADMAP.md

## Файлы внешней памяти
- **`phase1-audit/FINAL-REPORT.md`** — **ИТОГОВЫЙ СВОДНЫЙ ОТЧЁТ АУДИТА** (8 разделов: executive summary, блокеры, карта модулей, баги, improvements, gaps vs gold standard, конкуренты, порядок работы) ✅
- `01-GOLD-STANDARD.md` — эталон идеальной системы (16 измерений, 38 чекбоксов)
- `CLAUDE_CODE_MASTER_GUIDE.md` — руководство по промптам для сессий
- `BUGS.md` — все найденные баги (721 шт)
- `IMPROVEMENTS.md` — все идеи по улучшению (676 шт)
- `COMPETITORS.md` — **ПОЛНЫЙ анализ 13 конкурентов** (6 РФ + 7 мир + 6 AI-инструментов): PUSK.APP, Pragmacore 360, MacroERP, БИТ.СТРОИТЕЛЬСТВО, 1С:ERP УСО, Procore, PlanRadar, Buildertrend, CoConstruct, Fieldwire, Oracle Aconex, Trimble Viewpoint. ТОП-20 фич конкурентов без PRIVOD, 5 возможностей уникального преимущества, positioning vs каждый конкурент. Легкорем исключён (не ПО)
- `phase1-audit/1.11-projects-site-assessments.md` — **глубокий аудит projects+site-assessments (5.5/10, 5 P1: 2 IDOR milestone+collaborator, ProjectType DB CHECK, SiteAssessment edit сломан + entity/migration divergence. Monte Carlo + 7-RAG Portfolio уникальны. 85 файлов, ~15k LOC)**
- `phase1-audit/1.0-overview.md` — первичный обзор (полная карта 26 групп, ~200 страниц)
- `phase1-audit/1.1-finance.md` — **глубокий аудит модуля finance (6.0/10, 4 P1 bugs)**
- `phase1-audit/1.2-estimates-pricing.md` — **глубокий аудит модуля estimates+pricing (5.5/10, 5 P1 bugs, 5 stubs)**
- `phase1-audit/1.3-closing-russiandocs-execdocs.md` — **глубокий аудит closing+russianDocs+execDocs (5.5/10, 1 P1 tenant bug, 10 P2, execDocs=stub)**
- `phase1-audit/1.4-contracts.md` — **глубокий аудит contracts (6.5/10, 4 P1 IDOR security, board/sign stubs)**
- `phase1-audit/1.5-specifications.md` — **глубокий аудит specifications (7.0/10, 2 P1 tenant+unique, PDF-парсер лучший в классе)**
- `phase1-audit/1.6-operations-site.md` — **глубокий аудит operations+site (6.0/10, 5 P1 tenant isolation, dispatch/M29/DailyReport без org)**
- `phase1-audit/1.7-safety.md` — **глубокий аудит safety (7.0/10, 2 P1 compliance engine bugs, 15+ GET без auth, лучшая российская специфика)**
- `phase1-audit/1.8-quality-regulatory.md` — **глубокий аудит quality+regulatory (6.5/10, 2 P1 tenant isolation, 49 entities — самый большой модуль, Quality Gate Engine лучше Procore)**
- `phase1-audit/1.9-supply-warehouse-procurement.md` — **глубокий аудит supply: warehouse+procurement+dispatch (6.0/10, 3 P1: dual PurchaseOrder entity, PurchaseRequest global UNIQUE, procurementExt no tenant. Warehouse (7.5) лучший субмодуль, ФСБУ 5/2019, StockBatch, 34 frontend pages)**
- `phase1-audit/1.10-fleet-iot.md` — **глубокий аудит fleet+iot (6.5/10, 3 P1: IoT Sensor tenant isolation, GPS path mismatch, VehicleAssignment/FuelRecord без org. МДС 81-3.2001 маш.-час калькулятор + Own vs Rent — лучшие в классе. 89 backend + 32 frontend файлов, 90+ endpoints)**
- `phase1-audit/1.13-planning.md` — **глубокий аудит planning (7.5/10, 3 P1 tenant isolation: EvmSnapshot/ScheduleBaseline/ResourceAllocation. CPM+EVM+Skills+Multi-project = enterprise. 77 backend + 12 frontend, 52 endpoints. Gantt read-only)**
- `phase1-audit/1.14-tasks-calendar.md` — **глубокий аудит tasks+calendar (7.0/10, 3 P1: CalendarEvent/ConstructionSchedule без tenant filter, PROJECT visibility STUB. CPM+4 dep types+кастомные stages = лучше Procore. 24 entities, 15 frontend компонентов, 200+ i18n keys)**
- `phase1-audit/1.12-dashboard-analytics.md` — **глубокий аудит dashboard+analytics (6.0/10, 5 P1: Dashboard/KpiDefinition/SavedReport без tenant isolation, hardcoded 0.85, DEFECT_WEIGHT copy-paste. 90 backend + 45 frontend, 50+ endpoints, 31+ entities. ReportBuilder 12 sources + 7-dim RAG уникальны)**
- `phase1-audit/1.15-processes.md` — **глубокий аудит processes: RFI+Submittals+Issues+Workflow+ChangeMgmt (6.0/10, 9 P1: системная cross-tenant утечка в 5 модулях, IDOR path variable ignore, status mutations call create. 216+ backend + 52+ frontend файлов, ~120 endpoints, 63+ entities. 4-level Change Mgmt + Workflow Engine с auto-approval — enterprise-level)**
- `phase1-audit/1.16-documents-dataexchange-integration1c.md` — **глубокий аудит documents+dataExchange+integration1c (6.0/10, 10 P1: CDE 6/7 entities без tenant isolation, PTO 5 entities без org, DataExchange НЕТ controllers, DiadokClient=100% mock, PtoCodeGenerator AtomicLong. 160+ backend + 55+ frontend, 85+ endpoints, 35+ entities. Document module (7.5) = reference impl, S3+Tika storage (8.5), OData/SOAP real clients, DaData/Checko risk scoring (8.0), Drawing markup canvas)**
- `phase1-audit/1.17-portal.md` — **глубокий аудит portal (5.0/10, 10 P1: SQL INJECTION 7 мест, identity spoofing portalUserId from query, 3 entity без organizationId, cross-tenant admin, IDOR в 4 services. 108 backend + 20 frontend файлов, ~50 endpoints, 24 entities. Отдельная JWT auth + КС-2 draft workflow + ClientClaim SLA engine — правильная архитектурная идея с критическими security holes)**
- `phase1-audit/1.18-bim.md` — **глубокий аудит bim (5.0/10, 5 P1: 11 entities без org_id, simulateClashDetection FAKE, 3 pages без backend. ~120 backend + 13 frontend, 17 entities, 11 services, 10 controllers, 3 migrations. IFC.js 3D viewer, DefectBimLink heatmap, DrawingOverlay canvas — уникальные фичи с 50% mock)**
- `phase1-audit/1.20-design.md` — **глубокий аудит design (5.0/10, 5 P1: 3 entity без org_id, frontend↔backend field mismatch, PATCH /status не существует, Board=100% mock, getSections без projectId→400. 16 backend + 9 frontend, 3 entities, 1 service, 1 controller, 20 endpoints. Backend чистый (status machine, audit, soft delete), frontend сломан (3/5 pages broken). Дублирование с BIM DesignPackage/DesignDrawing)**
- `phase1-audit/1.19-workflow-approval.md` — **глубокий аудит workflow+approval (6.5/10, 6 P1: ApprovalStep zero ownership, WorkflowDef CRUD cross-tenant (6 методов), submitDecision no approver check, getHistory cross-tenant, AutomationExecution no org filter. 44 backend + 17 frontend, 16 entities, ~25 endpoints, 6 migrations. КЛЮЧЕВАЯ НАХОДКА: 2 конкурирующие системы (approval + workflowEngine). ApprovalInboxPage=лучший enterprise UI, batch decisions уникально, SLA 4-level urgency, ConditionBuilder визуальный. 0 тестов)**
- `phase1-audit/1.21-hr-hrRussian.md` — **глубокий аудит hr+hrRussian (6.5/10, 8 P1: 8 entities без tenant isolation, EmploymentContract createContract без orgId, PayrollService 6 cross-module imports, 15+ GET без @PreAuthorize, LeaveBoardPage+ApplicantBoardPage пустые. 189 backend + 49 frontend. PayrollService (8.0): НДФЛ 5 ступеней + ОПС порог + ст.152/153/154. Employee PII encryption. Уникально: Payroll→Budget ФОТ, Crew Timesheets, CertificationMatrix. 0 печатных форм)**
- `phase1-audit/1.22-leave-payroll-selfemployed-recruitment.md` — **глубокий аудит leave+payroll+selfEmployed+recruitment (6.0/10, 7 P1: tenant isolation 3/4 модулей, 28+ GET без PreAuthorize, IDOR approverId. Payroll НДФЛ+ОПС enterprise. SelfEmployed НПД stub. Уникально для стройки)**
- `phase1-audit/1.23-sales-crm-portfolio-bidmanagement.md` — **глубокий аудит sales: CRM+Portfolio+BidManagement+CP+Counterparties (7.0/10, 4 P1: Dual BidPackage entity (Portfolio без @Filter), BidInvitation/BidEvaluation IDOR, listPackages cross-tenant. 83 backend + 22 frontend, 16 entities, 70+ endpoints, 21 миграций. CRM 8.0: sequential stage machine, Go/No-Go scorecard (15 критериев). Leveling Matrix = уникально. КП chain: Budget→CP→Push-to-FM. DaData/Checko risk scoring. 61 unit тест, 0 BidMgmt тестов)**
- `phase1-audit/1.26-legal-mail-messenger-ai-help.md` — **глубокий аудит legal+mail+messenger+ai+help (7.0/10, 2 P1: EmailMessage без tenant isolation, AI IDOR resolveConversation. 189 backend + 48 frontend, 45 entities, ~120 endpoints, 13 миграций. Legal (8.0) = эталонная архитектура, уникальная фича (нет у Procore). Messenger (7.5) = enterprise-level с WebRTC calls, reactions, threads. AI (6.0) = multi-provider (OpenAI+GigaChat+YandexGPT), 40% mock (photo/risk). Mail (7.5) = IMAP/SMTP Yandex + 17 email templates + project linking. Help (7.0) = 92 KB статьи, 100+ route→slug context help, SLA ticketing. 0 тестов во всех 5 модулях)**
- `phase1-audit/1.X-architecture.md` — **полный аудит архитектуры, инфраструктуры, безопасности, production-readiness (6.0/10, 12 P1: SQL injection 7 мест, 324 entities без tenant isolation, нет RLS, MinIO/Redis без tenant namespace, hardcoded secrets в git, JWT secret warning-only, CORS wildcard+creds, PII в логах. Docker 9/10, CI/CD 7/10, DR plan 1000 строк. 3-слойная tenant isolation (47% entities). TLS 1.2+, HSTS, security headers. Нет SAST/DAST, нет load tests, нет Vault)**
- `phase1-audit/1.24-admin-settings-subscription-monitoring.md` — **глубокий аудит admin+settings+subscription+monitoring (7.5/10, 3 P1: HealthCheck 5/6 fake, BackupService simulated, webhook HMAC optional. ~200 backend + 46 frontend, 67 auth + 36 settings + 16 subscription + 18 monitoring файлов. ЛУЧШИЙ модуль: 3-layer tenant isolation (Hibernate @Filter + TenantFilterInterceptor + service validation), 15 roles × 37 permissions, JWT+TOTP 2FA+BCrypt+RateLimit (Redis+fallback), полный audit trail. Frontend 100% functional/dark/i18n. Уникально: BulkUserImport Russian CSV, RoskomnadzorPage 152-ФЗ, SettingEncryptionService, SsrfProtection. 49 тестов, 0 на subscription/payment/tenant)**
- `phase1-audit/1.25-closeout-maintenance.md` — **глубокий аудит closeout+maintenance (6.5/10, 5 P1: maintenance ZERO tenant isolation (5 entities, 24 методов), 6 API path mismatches, fake checklist metrics. 11+5 entities, 22+6 frontend pages, 7+1 services. StroynadzorPackageService (9/10) уникально: BFS WBS, 5-source aggregation, TOC+missing report. Closeout backend 8.0, maintenance 4.0. 616 i18n keys)**
- `phase1-audit/1.UX-navigation.md` — **UX-аудит навигации глазами прораба/директора (3.0/10 UX, 24 группы → 10, ~185 пунктов → ~60. 6+ дублей, 15+ непонятных названий, 12+ лишних дашбордов. Сравнение с Procore/PlanRadar/pusk.app/Buildertrend/1С:УСП. Ролевые наборы, проектно-центричная навигация, рекомендация по реструктуризации)**
- **`phase2-plan/ROADMAP.md`** — **ДЕТАЛЬНЫЙ ROADMAP**: 46 задач, 5 этапов, 17 спринтов, ~178 сессий Claude Code. Каждая задача: ID, приоритет, модули, зависимости, объём, описание, критерий готовности, расписание сессий ✅
- `phase3-execution/` — логи выполнения (фаза 3)
