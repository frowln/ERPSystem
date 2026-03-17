# Найденные баги

> Этот файл обновляется КАЖДОЙ аудит-сессией Claude Code.
> Формат: [ПРИОРИТЕТ] [ТЕГ] Описание | Файл:строка

## P1 — Critical (система ломается или теряет данные)

1. [P1] [SECURITY] Hardcoded production credentials в docker-compose.server.yml (POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, MINIO_ROOT_PASSWORD) — утечка при публикации репо | `docker-compose.server.yml:14,50,82,87`
2. [P1] [SECURITY] Hardcoded dev credentials в docker-compose.yml (privod_dev password, JWT secret) | `docker-compose.yml`
3. [P1] [DATA] `spring.jpa.hibernate.ddl-auto: update` — Hibernate может самопроизвольно менять схему БД в production. application-prod.yml НЕ переопределяет на `validate` | `backend/src/main/resources/application.yml`
4. [P1] [SECURITY] BimModelService.listModels() — **нет organizationId проверки**. Данные одного tenant-а видны другому | `modules/bim/service/BimModelService.java:29-35`
5. [P1] [DATA] BudgetService — NPE risk: `budget.getActualRevenue().subtract(totalActualCost)` без null-check. Crash при расчёте маржи | `modules/finance/service/BudgetService.java:294`
6. [P1] [CALC] **НДС: Backend VatCalculator.DEFAULT_RATE = 20.00, но с 2026 НДС = 22%**. Фронтенд ФМ (0.22) и миграция V120 (22.00) правильные. Неправильные: VatCalculator, InvoiceFormPage (vatRate: '20'), миграции V13/V6/V91/V208/V231 (DEFAULT 20.00). Расхождение backend↔frontend | `VatCalculator.java:12`, `InvoiceFormPage.tsx:100`, `V13:154`, `V6:60` | **Сессия 1.1**
7. [P1] [PERF] BudgetService.getExpenses() — N+1 запрос (1 query на каждый бюджет) + in-memory pagination (все записи в RAM). OOM при 50+ бюджетов × 200 позиций | `BudgetService.java:718-741` | **Сессия 1.1**
8. [P1] [DATA] InvoiceService.registerPayment() — нет idempotency check при создании CashFlowEntry. Повторный вызов дублирует записи Cash Flow | `InvoiceService.java:330-337` | **Сессия 1.1**
9. [P1] [STUB] EstimateAdvancedService.searchNormativeRates() — ЗАГЛУШКА. Всегда возвращает 3 hardcoded расценки (ГЭСН/ФЕР/ТЕР 06-01-001-01), независимо от запроса. Сметчик получает фейковые цены | `EstimateAdvancedService.java:508-531` | **Сессия 1.2**
10. [P1] [STUB] EstimateAdvancedService.importLsr() — ЗАГЛУШКА. Не создаёт ни LocalEstimate, ни строки в БД. Возвращает random UUID. Данные пользователя **теряются** | `EstimateAdvancedService.java:537-553` | **Сессия 1.2**
11. [P1] [STUB] EstimateAdvancedService.getComparison() — ЗАГЛУШКА. План-факт всегда показывает одни и те же 2 позиции с фиксированными суммами | `EstimateAdvancedService.java:463-496` | **Сессия 1.2**
12. [P1] [STUB] EstimateAdvancedService.exportEstimate() — ЗАГЛУШКА. Пишет в историю «success», но возвращает пустой XML (2 строки). Пользователь может отправить пустой файл на ГГЭ | `EstimateAdvancedService.java:368-371` | **Сессия 1.2**
13. [P1] [CALC] LocalEstimate.vatRate = VatCalculator.DEFAULT_RATE = 20%, а с 2026 НДС = 22%. Все новые сметы считаются с заниженным НДС. Ошибка ~1.6% итоговой суммы | `LocalEstimate.java:88` | **Сессия 1.2**
14. [P1] [SECURITY] **SpecificationService.listSpecifications() — НЕТ tenant isolation**. Criteria Query без predicate по organizationId. Данные одного тенанта видны другому через GET /specifications | `SpecificationService.java:46-62` | **Сессия 1.5**
15. [P1] [DATA] **Specification.name — UNIQUE constraint через ВСЕ организации**. Global sequence + unique name = information leakage между тенантами + ломает partition isolation. Нужен составной UNIQUE(organization_id, name) | `Specification.java:39` | **Сессия 1.5**
16. [P1] [SECURITY] **organizationId НЕ УСТАНАВЛИВАЕТСЯ** при создании КС-2 (createKs2, generateKs2) и КС-3 (createKs3), а также строк КС-2 (addKs2Line, createKs2Lines). Документы создаются без tenant ID → tenant filter не работает → cross-tenant утечка данных | `ClosingDocumentService.java:86-93,150-159,344-354`, `Ks2PipelineService.java:117-127,310-319` | **Сессия 1.3**
17. [P1] [SECURITY] **Leave entities — НЕТ organizationId**: LeaveType, LeaveRequest, LeaveAllocation без tenant isolation. Отпуска видны cross-tenant | `LeaveType.java`, `LeaveRequest.java`, `LeaveAllocation.java` | **Сессия 1.22**
18. [P1] [SECURITY] **Payroll entities — НЕТ organizationId**: PayrollTemplate, PayrollCalculation без tenant isolation. Зарплатные данные утекают между тенантами | `PayrollTemplate.java`, `PayrollCalculation.java` | **Сессия 1.22**
19. [P1] [SECURITY] **Recruitment entities — НЕТ organizationId**: Applicant, JobPosition, Interview без tenant isolation. PII кандидатов (ФИО, email, зарплата) видны cross-tenant | `Applicant.java`, `JobPosition.java`, `Interview.java` | **Сессия 1.22**
20. [P1] [SECURITY] **SelfEmployed Contractor/Payment/Registry — НЕТ tenant isolation**: 3 entity без organizationId/@Filter (Worker+CompletionAct имеют) | `SelfEmployedContractor.java`, `SelfEmployedPayment.java`, `SelfEmployedRegistry.java` | **Сессия 1.22**
21. [P1] [SECURITY] **28+ GET endpoints без @PreAuthorize** в leave (7), payroll (4), selfEmployed (7), recruitment (10) — зарплаты, PII, банковские реквизиты доступны любому auth user | `LeaveController.java`, `PayrollController.java`, `SelfEmployedController.java`, `RecruitmentController.java` | **Сессия 1.22**
22. [P1] [SECURITY] **Leave approverId from query param** — нет проверки ownership, self-approval возможен | `LeaveController.java approve/refuse endpoints` | **Сессия 1.22**
23. [P1] [SECURITY] **Leave createRequest — no employee ownership check**: можно создать заявку от чужого имени | `LeaveService.java:createLeaveRequest()` | **Сессия 1.22**
24. [P1] [SECURITY] **EmploymentContractService.createContract() — НЕ устанавливает organizationId**: builder без .organizationId(), контракт создаётся с null → «исчезает» (tenant filter отсекает null). Entity имеет @Filter, но builder не заполняет orgId | `EmploymentContractService.java:54-68` | **Сессия 1.21**
25. [P1] [ARCH] **PayrollService — 6 cross-module imports из 3 модулей**: finance (BudgetItem/Category/Repository), hr (TimesheetStatus/Repository), calendar (WorkCalendarService). Нарушает «модули изолированы» (CLAUDE.md) | `PayrollService.java:4-9` | **Сессия 1.21**
26. [P1] [DATA] **LeaveService.listLeaveRequests() — findAll() без tenant filter**: без фильтров вызывает `leaveRequestRepository.findAll(pageable)` → ВСЕ заявки ВСЕХ организаций (LeaveRequest нет @Filter) | `LeaveService.java:104` | **Сессия 1.21**

## P2 — High (функционал не работает как должен)

1. [P2] [PERF] BudgetService — in-memory пагинация: загружает ВСЕ записи, потом subList. OOM при тысячах позиций бюджета | `modules/finance/service/BudgetService.java:737-741`
2. [P2] [SECURITY] BudgetController margin endpoint — `Map<String, Object>` вместо типизированного DTO. NPE + type confusion при невалидном input | `modules/finance/web/BudgetController.java:210-222`
3. [P2] [SECURITY] CORS wildcard: nginx использует `$http_origin` — любой домен может делать CORS-запросы | `deploy/nginx-privod2.conf`
4. [P2] [SECURITY] DefectService.listDefects() — нет фильтрации по organizationId. Потенциальная cross-tenant утечка | `modules/quality/service/DefectService.java:41-66`
5. [P2] [UX] SafetyDashboardPage — hardcoded mock-массив `[85, 88, 82, 90, 87, 92, 89, 91, 88, 93, 90, 92]` в production компоненте. Клиент увидит фейковые данные | `frontend/src/modules/safety/SafetyDashboardPage.tsx:303-312`
6. [P2] [UX] DefectRegisterPage export — заглушка (показывает toast, но ничего не экспортирует) | `frontend/src/modules/defects/DefectRegisterPage.tsx:126`
7. [P2] [STABILITY] routes/index.tsx — нет Error Boundary для lazy chunk failures. Белый экран при сбое загрузки | `frontend/src/routes/index.tsx`
8. [P2] [SECURITY] JwtAuthenticationFilter глотает все исключения молча — может скрывать security issues | `infrastructure/security/JwtAuthenticationFilter.java:49`
9. [P2] [SECURITY] nginx-privod2-ip.conf — NO TLS. Все данные (включая JWT) передаются в plaintext | `deploy/nginx-privod2-ip.conf`
10. [P2] [LOGIC] BudgetStatus: APPROVED→DRAFT разрешён — нарушает бизнес-инвариант. Утверждённый бюджет не должен откатываться | `BudgetStatus.java` | **Сессия 1.1**
11. [P2] [LOGIC] InvoiceStatus — 13 статусов с дублирующими путями (DRAFT vs NEW, SENT vs UNDER_REVIEW). canTransitionTo() 68 строк | `InvoiceStatus.java` | **Сессия 1.1**
12. [P2] [PERF] InvoiceMatchingEngine — O(n²) nested loop × Levenshtein O(m×k). 100K сравнений на реальных данных | `InvoiceMatchingEngine.java:49-62` | **Сессия 1.1**
13. [P2] [CALC] BudgetItemSyncService — `max()` вместо `sum()` для оплат (contractPaidByPayments vs contractPaidByInvoices). Занижение фактических затрат | `BudgetItemSyncService.java:181` | **Сессия 1.1**
14. [P2] [i18n] FmPage/FmItemsTable — 5 hardcoded русских строк в JSX (КП, поз., привязка к графику) | `FmPage.tsx:407,679`, `FmItemsTable.tsx:186,188,440` | **Сессия 1.1**
15. [P2] [STUB] EstimateAdvancedService.importEstimate() — заглушка, itemsImported=0. Файл принимается, но не парсится | `EstimateAdvancedService.java:65-83` | **Сессия 1.2**
16. [P2] [STUB] EstimateAdvancedService.validateForExport() — заглушка, всегда valid=true | `EstimateAdvancedService.java:338-348` | **Сессия 1.2**
17. [P2] [SECURITY] EstimateService.listEstimates() — нет явной фильтрации по organizationId. Только @Filter (зависит от конфигурации Session). Потенциальный cross-tenant leak | `EstimateService.java:58-75` | **Сессия 1.2**
18. [P2] [DATA] CompetitiveListService.createFromPurchaseRequest() — UUID.randomUUID() fallback для specificationId. Невалидный FK → corrupt data | `CompetitiveListService.java:94` | **Сессия 1.2**
19. [P2] [SECURITY] EstimateController GET endpoints — нет @PreAuthorize. Любой аутентифицированный пользователь видит все сметы | `EstimateController.java:51-68,110-115,165-171` | **Сессия 1.2**
20. [P2] [PERF] PriceSuggestionService — загрузка ВСЕХ цен в RAM для вычисления медианы. OOM при тысячах совпадений | `PriceSuggestionService.java:54` | **Сессия 1.2**
21. [P2] [i18n] EstimateListPage — hardcoded localStatusLabels: 'Черновик', 'Рассчитана', 'Утверждена', 'В архиве' без t() | `EstimateListPage.tsx:47-52` | **Сессия 1.2**
22. [P2] [BUG] estimatesApi.getPriceSuggestion() — отправляет param `itemName`, бэкенд ожидает `name`. Результат всегда пустой | `estimates.ts:212` vs `PriceSuggestionController.java:28` | **Сессия 1.2**
23. [P2] [API] **Ks2Response не отдаёт totalVatAmount, totalWithVat** — в БД есть (V118), DTO пропускает. Фронтенд не может показать НДС итоги | `Ks2Response.java:12-29` | **Сессия 1.3**
24. [P2] [API] **Ks2LineResponse не отдаёт vatRate, vatAmount** — построчный НДС скрыт от клиента. В БД хранится, но API не возвращает | `Ks2LineResponse.java:9-22` | **Сессия 1.3**
25. [P2] [PERF] **N+1 в recalculateKs3Totals()** — загружает каждый КС-2 по одному в цикле (`findById` в loop) вместо batch | `ClosingDocumentService.java:552-559` | **Сессия 1.3**
26. [P2] [PERF] **N+1 в getLinkedKs2ForKs3()** — то же: loop + findById для каждого link | `ClosingDocumentService.java:639-641` | **Сессия 1.3**
27. [P2] [STUB] **Ks6aController.getEntries()** — всегда возвращает пустой список. КС-6а — обязательная форма на стройке | `ClosingDocumentService.java:648-650` | **Сессия 1.3**
28. [P2] [STUB] **CorrectionActController.create()** — throws UnsupportedOperationException. Нельзя создать корректировочный акт | `ClosingDocumentService.java:658-661` | **Сессия 1.3**
29. [P2] [SECURITY] **RussianDocService.getUpd()** — `findById()` без tenant filter. Cross-tenant access risk | `RussianDocService.java:66` | **Сессия 1.3**
30. [P2] [STUB] **DiadokClient — 100% mock**: authenticate, sendDocument, getDocumentStatus, downloadSignedDocument — всё фейк | `DiadokClient.java:24-65` | **Сессия 1.3**
31. [P2] [STUB] **PDF/1C экспорт КС-2/КС-3** — handleExportPdf() и handleExport1C() только показывают toast, ничего не генерируют | `KsPrintFormsPage.tsx:330-336` | **Сессия 1.3**
32. [P2] [DATA] **execDocs localStorage** — нет tenant isolation, данные теряются при очистке браузера. 5 типов документов (АОСР, КС-6, сварка, ПКО, спецжурналы) без бэкенда | `execDocs.ts:22-26` | **Сессия 1.3**
33. [P2] [SECURITY] **SpecificationController 4 GET endpoints без @PreAuthorize**: GET /specifications, /{id}, /{id}/items, /{id}/summary — любой authenticated user видит все спецификации | `SpecificationController.java:55-161` | **Сессия 1.5**
34. [P2] [SECURITY] **MaterialAnalogController 4 GET endpoints без @PreAuthorize**: GET /analogs, /analogs/{id}, /analog-requests, /analog-requests/{id} | `MaterialAnalogController.java:51-129` | **Сессия 1.5**
35. [P2] [SECURITY] **PDF upload DoS**: readAllBytes() без size limit. 500MB+ PDF → OOM → crash | `SpecificationPdfParserService.java:241`, `SpecificationController.java:171-178` | **Сессия 1.5**
36. [P2] [SECURITY] **importPdfItems без size limit**: @RequestBody List без ограничения. 1M items → 1M INSERTs → DB overload | `SpecificationController.java:205-237` | **Сессия 1.5**
37. [P2] [LOGIC] **autoSelectBestPrices() НЕ валидирует min proposals**, хотя selectWinner() валидирует. Автовыбор обходит правило «минимум 3 предложения» | `CompetitiveListService.java:486-527` | **Сессия 1.5**
38. [P2] [STUB] **recalculateSupplyStatus() — no-op**: метод только логирует, ничего не делает. Фронтенд вызывает безрезультатно | `SpecificationService.java:457-461` | **Сессия 1.5**
39. [P2] [API] **getSupplySummary() возвращает item type summary, не supply coverage**. Фронтенд считает supply status клиент-side | `SpecificationService.java:452-455` | **Сессия 1.5**
40. [P2] [i18n] **Hardcoded русские строки** в SpecificationDetailPage: 'Заявка на закупку создана', 'Ошибка создания заявки' | `SpecificationDetailPage.tsx:233-236` | **Сессия 1.5**
41. [P2] [CODE] **SpecificationDetailPage — god-component** (1,241 строк, 15+ useState, 6 useMutation) | `SpecificationDetailPage.tsx` | **Сессия 1.5**
42. [P2] [SECURITY] **Recruitment PII plain text**: applicants partner_name, email, phone, salary хранятся без шифрования в VARCHAR | `V68__recruitment_leave_tables.sql`, `Applicant.java` | **Сессия 1.22**
43. [P2] [VALIDATION] **SelfEmployed INN — только формат, нет контрольной суммы ИФНС**: 123456789012 проходит валидацию | `SelfEmployedService.java:verifyNpd()` | **Сессия 1.22**
44. [P2] [BUG] **Payroll NPE в calculateBasePay()**: workCalendarService может вернуть null → compareTo NPE | `PayrollService.java:370` | **Сессия 1.22**
45. [P2] [LOGIC] **LeaveType validity period не проверяется**: expired leave types доступны для создания запросов | `LeaveService.java:createLeaveRequest()` | **Сессия 1.22**
46. [P2] [LOGIC] **Recruitment — нет state machine validation**: NEW → WON напрямую без собеседования | `RecruitmentService.java:updateApplicantStatus()` | **Сессия 1.22**
47. [P2] [DATA] **Leave approval race condition**: checkLeaveBalance → updateAllocation не атомарна, concurrent approve может превысить лимит | `LeaveService.java:approveLeaveRequest()` | **Сессия 1.22**
48. [P2] [STUB] **LeaveBoardPage — 100% local state**: useState([]), drag-and-drop без backend persist | `LeaveBoardPage.tsx` | **Сессия 1.22**
49. [P2] [STUB] **ApplicantBoardPage — 100% local state**: useState([]), HTML5 DnD (мобильные сломаны) | `ApplicantBoardPage.tsx` | **Сессия 1.22**
50. [P2] [UX] **Leave — missing form pages**: нет create/edit pages для requests, allocations, types | `frontend/src/modules/leave/` | **Сессия 1.22**
51. [P2] [UX] **Recruitment — missing job position CRUD**: только list page, нет detail/form | `frontend/src/modules/recruitment/` | **Сессия 1.22**
52. [P2] [CALC] **PayrollService socialRate = 2.9% (ВНиМ only)**: нет взноса НС и ПЗ (0.2-8.5%) для строительства → недоплата ФСС | `PayrollService.java:94` | **Сессия 1.21**
53. [P2] [CALC] **PIECEWORK — stub**: baseSalary вместо ставка × выработка | `PayrollService.java:389` | **Сессия 1.21**
54. [P2] [DATA] **Employee.employeeNumber — global UNIQUE** через все org | `Employee.java:29` | **Сессия 1.21**
55. [P2] [CALC] **nightHours/holidayHours не из табеля**: calculateFromTimesheetData() = null → зарплата занижена | `PayrollService.java:318-319` | **Сессия 1.21**
56. [P2] [SECURITY] **EmploymentContract IDOR**: getContractOrThrow() findById() без org filter | `EmploymentContractService.java:105-108` | **Сессия 1.21**
57. [P2] [PERF] **bulkCalculate() — N+1**: 100 сотрудников = 300+ queries | `PayrollService.java:267-274` | **Сессия 1.21**
58. [P2] [DATA] **updateLaborBudgetActual swallows ALL exceptions**: зарплата OK, бюджет ФОТ не обновлён | `PayrollService.java:351-353` | **Сессия 1.21**
59. [P2] [CALC] **OPS_THRESHOLD hardcoded 2 225 000**: ежегодно меняется | `PayrollService.java:562` | **Сессия 1.21**
60. [P2] [UX] **hrRussian 0 печатных форм**: Т-1/Т-2/Т-3/Т-5/Т-6/Т-8 обязательны | **Сессия 1.21**

## P3 — Medium (работает, но плохо)

1. [P3] [CODE] DefectService — inconsistent exceptions: RuntimeException (3 места) вместо EntityNotFoundException | `modules/quality/service/DefectService.java:72,110,136`
2. [P3] [CODE] BudgetService — god-class (896 строк, 8 репозиториев). Нужно разбить на BudgetItemService, BudgetCalculationService | `modules/finance/service/BudgetService.java`
3. [P3] [CODE] FmPage.tsx — god-component (880 строк, 41 useState). LSR-парсер встроен в компонент | `frontend/src/modules/finance/FmPage.tsx`
4. [P3] [CODE] WarehouseOrdersPage — index-based keys в map (React anti-pattern, ломает reconciliation) | `frontend/src/modules/warehouse/WarehouseOrdersPage.tsx:132-136`
5. [P3] [CODE] FmPage.tsx — `as any` cast нарушает type safety | `frontend/src/modules/finance/FmPage.tsx:312`
6. [P3] [CODE] FmPage.tsx — useCallback без `t()` в deps array | `frontend/src/modules/finance/FmPage.tsx:143`
7. [P3] [PERF] Column definitions в SafetyDashboard, DefectRegister, WarehouseOrders пересоздаются на каждый render (не мемоизированы) | Multiple files
8. [P3] [INFRA] Prometheus — PostgreSQL exporter target (postgres-exporter:9187) не определён в docker-compose, будет fail | `monitoring/prometheus.yml`
9. [P3] [INFRA] TELEGRAM_BOT_TOKEN/CHAT_ID — не валидируются при старте Alertmanager | `monitoring/alertmanager/alertmanager.yml`
10. [P3] [CONFIG] CSP allows `unsafe-inline` scripts — XSS risk | `nginx/nginx.conf`
11. [P3] [LOGIC] BudgetItemSyncService — молчаливый return при null contractId, без логирования. Пользователь не узнает о пропуске | `BudgetItemSyncService.java:64-66` | **Сессия 1.1**
12. [P3] [UX] Finance module — отсутствие loading states на 20+ страницах. Пустые таблицы при загрузке | Multiple finance pages | **Сессия 1.1**
13. [P3] [UX] Finance module — 0 error boundaries, 0 retry UI, 0 empty states с CTA | Multiple finance pages | **Сессия 1.1**
14. [P3] [TEST] Finance frontend — 0 компонентных тестов. LSR-парсер (критичный) без тестов | `frontend/src/modules/finance/` | **Сессия 1.1**
15. [P3] [CODE] Hardcoded UNITS и DISCIPLINE_MARKS — не из бэкенда/конфигурации. Дублирование в FinanceExpensesPage | `budgetDetailTypes.ts:124-126`, `FinanceExpensesPage.tsx:20` | **Сессия 1.1**
16. [P3] [A11Y] Finance module — 2 ARIA-атрибута на 54 файла. Inline-редакторы без label'ов | Multiple finance files | **Сессия 1.1**
17. [P3] [SECURITY] Нет separation of duties — FINANCE_MANAGER может создать + утвердить собственный бюджет | `BudgetController.java` | **Сессия 1.1**
18. [P3] [CODE] CashFlowService.generateForecast() — параметры paymentDelayDays и includeVat объявлены, но не используются | `CashFlowService.java:182-184` | **Сессия 1.1**
19. [P3] [VALID] AddBudgetItemModal — нет валидации отрицательных цен и нулевого quantity | `AddBudgetItemModal.tsx` | **Сессия 1.1**
20. [P3] [ARCH] EstimateService → specification module: 4 cross-module imports (SpecItem, Specification, SpecItemRepository, SpecificationRepository) | `EstimateService.java:25-28` | **Сессия 1.2**
21. [P3] [ARCH] CompetitiveListService — 7 cross-module imports: commercialProposal, finance, procurement. God-class connecting 4 modules | `CompetitiveListService.java:6-13` | **Сессия 1.2**
22. [P3] [CODE] PricingService.exportRatesToExcel() генерирует CSV с `;` разделителем, не xlsx. Метод misleading name | `PricingService.java:376-407` | **Сессия 1.2**
23. [P3] [CODE] normalizeWorkType() и normalizeQuarter() дублируются в LocalEstimateService и PricingService | `LocalEstimateService.java:666-701`, `PricingService.java:471-508` | **Сессия 1.2**
24. [P3] [PERF] SpecificationService.listSpecifications() — N+1: COUNT на каждую спецификацию (countBySpecificationIdAndDeletedFalse) | `SpecificationService.java:58-61` | **Сессия 1.2**
25. [P3] [LOGIC] CompetitiveListService.autoSelectBestPrices() — overallBestPrice = min из winners, не total. Бессмысленный KPI | `CompetitiveListService.java:513` | **Сессия 1.2**
26. [P3] [CODE] Дублированный EstimateServiceTest — 2 файла в разных директориях | `modules/estimate/EstimateServiceTest.java` + `modules/estimate/service/EstimateServiceTest.java` | **Сессия 1.2**
27. [P3] [PERF] specifications.batchCreateSpecItems — sequential HTTP calls (100 items = 100 requests) | `specifications.ts:108-115` | **Сессия 1.2**
28. [P3] [TEST] Estimate module — 28 тестов на 182 backend файла (~2% coverage). ARPS parser, weighted scoring без тестов | Multiple files | **Сессия 1.2**
29. [P3] [CODE] Volume Calculator — 5 типов работ hardcoded, формулы примитивные (L×W×H без коэффициентов) | `EstimateAdvancedService.java:557-589` | **Сессия 1.2**
30. [P3] [CODE] Дублированная директория frontend/src/modules/estimates/components/components/ — 6 файлов-дубликатов | **Сессия 1.2**
31. [P3] [CODE] **Ks2DetailPage = 1175 строк** — god-component с inline sub-components, 0 тестов | `Ks2DetailPage.tsx` | **Сессия 1.3**
32. [P3] [API] **EdoService.applyTemplate()** — `String.replace()` вместо template engine. Silent failure при отсутствии placeholder | `EdoService.java` (russianDoc module) | **Сессия 1.3**
33. [P3] [DATA] **OcrTask.totalLinesDetected, averageConfidence** — колонки в БД существуют, но НИКОГДА не заполняются сервисом | `OcrService.java` | **Сессия 1.3**
34. [P3] [LOGIC] **КС-3 нет кумулятивного итога** — "Выполнено с начала строительства" / "Выполнено за отчётный период" — обязательные поля формы КС-3 по Госкомстату | `Ks3Document.java` | **Сессия 1.3**
35. [P3] [ARCH] **Дублирование EDO модулей**: russianDoc/EdoDocument + edo/EdoDocument — два entity для одного домена | `modules/russianDoc/domain/EdoDocument.java`, `modules/edo/domain/EdoDocument.java` | **Сессия 1.3**
36. [P3] [i18n] **Closing i18n keys рассыпаны**: closing.ks2.*, forms.ks3.*, ks2Pipeline.* — нет единого prefix | `ru.ts`, `en.ts` | **Сессия 1.3**
37. [P3] [CODE] **execDocsApi uses `_silentErrors: true`** — ошибки API глотаются молча, пользователь не узнает о проблемах | `execDocs.ts` | **Сессия 1.3**
38. [P3] [VALID] **АОСР: нет валидации по РД-11-02-2006** — workType не из справочника, нет обязательных полей materialsUsed, geodeticData на фронтенде | `AosrPage.tsx` | **Сессия 1.3**
39. [P3] [VALID] **Welding Journal: нет ГОСТ-валидации** — нет проверки удостоверения сварщика, сертификата электродов, метода контроля | `WeldingJournalPage.tsx` | **Сессия 1.3**
40. [P3] [TEST] **0 frontend тестов** для 13 страниц closing module (5000 LOC), включая 1175-строчный Ks2DetailPage | `frontend/src/modules/closing/` | **Сессия 1.3**
41. [P3] [CODE] **Дублированный SpecificationServiceTest** — 2 практически идентичных файла в разных директориях | `specification/SpecificationServiceTest.java` + `specification/service/SpecificationServiceTest.java` | **Сессия 1.5**
42. [P3] [PERF] **createVersion() — N отдельных save()** вместо batch saveAll(). 300 позиций = 300 INSERTs | `SpecificationService.java:245-266` | **Сессия 1.5**
43. [P3] [PERF] **pushToFm — sequential API calls с sleep**. 200 позиций ≈ 200 HTTP запросов + 2 секунды delay | `SpecificationDetailPage.tsx:120-171` | **Сессия 1.5**
44. [P3] [LOGIC] **SpecificationStatus APPROVED→DRAFT разрешён**. Утверждённая спецификация может откатиться в черновик (должна идти через createVersion) | `SpecificationStatus.java:21` | **Сессия 1.5**
45. [P3] [LOGIC] **CompetitiveListStatus self-transition** (this == target → true). Бессмысленная операция, создающая audit log | `CompetitiveListStatus.java:23-24` | **Сессия 1.5**
46. [P3] [ARCH] **CompetitiveListService — 5 cross-module imports** из commercialProposal, finance, procurement. Orchestrator 4 модулей | `CompetitiveListService.java:5-11` | **Сессия 1.5**
47. [P3] [VALID] **addEntry() позволяет unitPrice=0 и quantity=0**. Нулевое предложение выиграет auto-select | `CompetitiveListService.java:199-200` | **Сессия 1.5**
48. [P3] [CODE] **detectItemType() default EQUIPMENT bias**. Неизвестные позиции по умолчанию «оборудование» | `SpecificationPdfParserService.java:633` | **Сессия 1.5**
49. [P3] [TEST] **0 тестов для CompetitiveListService** (558 LOC), PdfParserService (680 LOC), MaterialAnalogService (225 LOC) | **Сессия 1.5**
50. [P3] [SECURITY] **getSpecificationOrThrow() не проверяет org ownership** — IDOR risk при прямом доступе по UUID | `SpecificationService.java:463-467` | **Сессия 1.5**
51. [P3] [PERF] **N+1 в listSpecifications()** — COUNT на каждую спецификацию | `SpecificationService.java:58-61` | **Сессия 1.5** (дубль 1.2 BUG-E21)

## Contracts Module (Сессия 1.4)

52. [P1] [SECURITY] **ContractExt — системный IDOR**: 8 create-операций НЕ устанавливают organizationId и НЕ проверяют принадлежность contractId | `contractExt/service/*.java` | **Сессия 1.4**
53. [P1] [SECURITY] ToleranceController.listAll() — все допуски всех организаций без org filter | `contractExt/web/ToleranceController.java` | **Сессия 1.4**
54. [P1] [CALC] НДС 20% в контрактах — Contract.java:78 использует DEFAULT_RATE = 20.00, с 2026 НДС = 22% | `contract/domain/Contract.java:78` | **Сессия 1.4**
55. [P1] [DATA] ContractSignWizard — данные подписания НЕ сохраняются, только changeStatus('SIGNED') | `ContractSignWizard.tsx:76-87` | **Сессия 1.4**
56. [P2] [BUG] ContractBoardPage — статусы не совпадают с бэкендом (COMPLETED/TERMINATED vs CLOSED/CANCELLED) | `ContractBoardPage.tsx:17` | **Сессия 1.4**
57. [P2] [UX] ContractBoardPage — HTML5 DnD не работает на мобильных | `ContractBoardPage.tsx:115-119` | **Сессия 1.4**
58. [P2] [STUB] ContractDetailPage — вкладка "Документы" = hardcoded пустой массив | `ContractDetailPage.tsx:413-414` | **Сессия 1.4**
59. [P2] [DATA] ContractFormPage — Insurance/Procurement поля удаляются из payload | `ContractFormPage.tsx:188-199` | **Сессия 1.4**
60. [P2] [LOGIC] ДС не обновляет сумму контракта | `ContractSupplementService.java:42-61` | **Сессия 1.4**
61. [P2] [PERF] ContractListPage — size: 500 без серверной пагинации | `ContractListPage.tsx:63` | **Сессия 1.4**
62. [P2] [LOGIC] Approval logic bug — !pending||approved = always true без stage | `ContractService.java:526-534` | **Сессия 1.4**
63. [P2] [UX] Status modal — все статусы включая невалидные переходы | `ContractDetailPage.tsx:536-561` | **Сессия 1.4**
64. [P3] [CODE] ContractSignWizard — 8 `as any`, неправильный маппинг полей | `ContractSignWizard.tsx:59-68` | **Сессия 1.4**
65. [P3] [UX] Dark mode пропуски в ContractListPage | `ContractListPage.tsx:170,178` | **Сессия 1.4**
66. [P3] [CODE] BankGuaranteesPage — endpoint '/bank-guarantees' не существует | `BankGuaranteesPage.tsx:49` | **Сессия 1.4**
67. [P3] [CODE] ReclamationsPage — inline API вместо contractExtApi | `ReclamationsPage.tsx:48-49` | **Сессия 1.4**
68. [P3] [UX] ContractFormPage — номер обязателен но удаляется из payload | `ContractFormPage.tsx:18,187` | **Сессия 1.4**
69. [P3] [UX] ContractFormPage — defaultValues не сбрасываются при async загрузке | `ContractFormPage.tsx:126-172` | **Сессия 1.4**
70. [P3] [SECURITY] GET endpoints без @PreAuthorize | `ContractController.java:51-67` | **Сессия 1.4**
71. [P3] [ARCH] 5 cross-module imports contract → finance, project | `ContractService.java` | **Сессия 1.4**

## Operations + Site Module (Сессия 1.6)

72. [P1] [SECURITY] **DispatchOrder — НЕТ tenant isolation**: нет organization_id, нет @Filter. Все заявки всех организаций доступны любому authenticated user через GET/PUT/DELETE /api/dispatch/orders | `DispatchOrder.java`, `DispatchService.java:40-54` | **Сессия 1.6**
73. [P1] [SECURITY] **DailyReport — НЕТ tenant isolation**: нет organization_id, нет @Filter. Cross-tenant доступ через знание UUID work_order_id | `DailyReport.java`, `OpsService.java:172-176` | **Сессия 1.6**
74. [P1] [SECURITY] **M29Document — НЕТ tenant isolation**: нет organization_id, нет @Filter. createM29() не вызывает SecurityUtils.requireCurrentOrganizationId() | `M29Document.java`, `M29Service.java:58-77` | **Сессия 1.6**
75. [P1] [DATA] **M29Document.name — global UNIQUE через все организации**: тенант B не может создать М-29 с номером тенанта A. Information leakage + блокировка | `M29Document.java:32` | **Сессия 1.6**
76. [P1] [DATA] **DispatchService.orderSequence = AtomicLong(System.currentTimeMillis() % 100000)**: сбрасывается при рестарте JVM, коллизии номеров | `DispatchService.java:33` | **Сессия 1.6**
77. [P2] [SECURITY] **M29Controller GET endpoints БЕЗ @PreAuthorize**: GET /api/m29 и GET /api/m29/{id} — любой authenticated user видит все М-29 | `M29Controller.java:45-61` | **Сессия 1.6**
78. [P2] [SECURITY] **DispatchController GET — только isAuthenticated()**: VIEWER видит диспетчерские заявки и маршруты | `DispatchController.java:44-45,101-102` | **Сессия 1.6**
79. [P2] [SECURITY] **DefectService.getDashboard() — cross-tenant aggregation**: countOpen(), countOverdue(), countOpenBySeverity(), countByContractorAndStatus(), countByProjectAndStatus() — все без org filter | `DefectService.java:177-212`, `DefectRepository.java:18-43` | **Сессия 1.6**
80. [P2] [SECURITY] **DefectService.listDefects() — Specification без org filter**: базовый predicate = deleted=false, нет organizationId | `DefectService.java:43` | **Сессия 1.6**
81. [P2] [SECURITY] **DispatchRoute — НЕТ organization_id**: маршруты глобальные, конкуренты видят логистику друг друга | `DispatchRoute.java` | **Сессия 1.6**
82. [P2] [UX] **WorkOrderBoardPage — 100% mock**: useState<WoCard[]>([]), нет API. HTML5 DnD — не работает на мобильных | `WorkOrderBoardPage.tsx:39,51-52` | **Сессия 1.6**
83. [P2] [DATA] **M29ListPage totalOveruse/totalSavings = hardcoded 0**: MetricCards "Перерасход"/"Экономия" всегда 0 | `M29ListPage.tsx:74-75` | **Сессия 1.6**
84. [P2] [STUB] **M29ReportPage handleExport — toast-заглушка**: нет реальной генерации файла | `M29ReportPage.tsx:133-135` | **Сессия 1.6**
85. [P3] [LOGIC] **WorkOrder progress heuristic 10ч=100%**: нет plannedLaborHours, 200ч работа → 99% после 10ч | `OpsService.java:342-345` | **Сессия 1.6**
86. [P3] [LOGIC] **M29 нет approver tracking на entity**: нет approvedById/confirmedById. Нормативное требование для подписи | `M29Service.java:211-230` | **Сессия 1.6**
87. [P3] [CODE] **DefectService — RuntimeException x4 вместо EntityNotFoundException**: 500 вместо 404 | `DefectService.java:72,110,136,171` | **Сессия 1.6**
88. [P3] [SECURITY] **DefectController.delete() — только ADMIN+QM**: PROJECT_MANAGER не может удалять дефекты | `DefectController.java:104-105` | **Сессия 1.6**
89. [P3] [ARCH] **DispatchController.createRoute() — бизнес-логика в контроллере**: entity creation через Builder прямо в controller | `DispatchController.java:118-131` | **Сессия 1.6**
90. [P3] [PERF] **DispatchRoute entity в API response без DTO**: утечка internal fields (deleted, version) | `DispatchController.java:104` | **Сессия 1.6**
91. [P3] [VALID] **Defect.photoUrls — raw JSON без URL validation**: возможны javascript:, file://, base64 | `Defect.java:66-68` | **Сессия 1.6**
92. [P3] [ARCH] **Duplicate DailyLog frontend**: operations/DailyLog* + dailylog/DailyLog* — два модуля для одного домена | Оба модуля | **Сессия 1.6**
93. [P3] [ARCH] **Duplicate Defect services**: OpsService.defect CRUD + DefectService — два code path | `OpsService.java:242-324`, `DefectService.java` | **Сессия 1.6**
94. [P3] [TEST] **0 frontend тестов** для 25 страниц operations/dispatch/dailylog/siteAssessment/m29 | Все frontend модули | **Сессия 1.6**
95. [P4] [CODE] **WorkOrder.code — global UNIQUE**: может конфликтовать между тенантами | `WorkOrder.java:43` | **Сессия 1.6**

## Safety Module (Сессия 1.7)

96. [P1] [LOGIC] **SafetyComplianceService.hasUpcomingTraining() — ГЛОБАЛЬНАЯ проверка**: `trainingRepository.countUpcoming()` считает тренинги ВСЕХ организаций/сотрудников. Если у кого-то в системе есть предстоящий тренинг → auto-scheduling не создаст новых инструктажей. Ломает compliance engine | `SafetyComplianceService.java:413-421` | **Сессия 1.7**
97. [P1] [STUB] **SafetyRiskScoringService.countOverdueTrainings() — всегда 0**: `return 0; // Fall back to 0` — training compliance factor в risk scoring ВСЕГДА показывает 0 risk. Скрывает реальные проблемы с обучением | `SafetyRiskScoringService.java:709-715` | **Сессия 1.7**
98. [P2] [SECURITY] **15+ GET endpoints без @PreAuthorize** в safety controllers: инциденты (list, getById, dashboard, byProject), риск-скоринг (score, portfolio, factors, reports), метрики (LTIFR/TRIR), СИЗ (inventory, issues). Любой authenticated user видит все safety данные | `SafetyIncidentController:42-56,124-139`, `SafetyRiskScoringController:36-82`, `SafetyMetricsController:39-45`, `SafetyPpeController:40-55` | **Сессия 1.7**
99. [P2] [SECURITY] **SafetySoutController — isAuthenticated() only**: class-level `@PreAuthorize("isAuthenticated()")` без RBAC. VIEWER может создавать/удалять СОУТ карты | `SafetySoutController.java:28` | **Сессия 1.7**
100. [P2] [SECURITY] **SafetyComplianceService.parseJsonStringArray() — brittle regex**: `replaceAll("[\\[\\]\"\\s]", "")` ломается на escaped quotes, вложенных JSON, значениях с запятыми. Критично для compliance engine | `SafetyComplianceService.java:442-459` | **Сессия 1.7**
101. [P2] [UX] **SafetyDashboardPage — mock data в production**: hardcoded `[85,88,82,90,87,92,89,91,88,93,90,92]` trend, value="0" инциденты, value="47" дней. Клиент видит фейковые метрики | `SafetyDashboardPage.tsx:271,292,303` | **Сессия 1.7**
102. [P2] [UX] **SafetyBoardPage — HTML5 DnD, мобильные не работают**: `draggable`+`onDragStart`+`onDrop` вместо @dnd-kit. Единственный board из 18 НЕ мигрированный на TouchSensor | `SafetyBoardPage.tsx:59-61,87` | **Сессия 1.7**
103. [P2] [STUB] **safetyChecklist.ts — 100% localStorage, нет бэкенда**: 6 категорий, 16 пунктов чек-листов безопасности. TODO: "No backend endpoint exists". Нет persistence, нет tenant isolation | `safetyChecklist.ts:20` | **Сессия 1.7**
104. [P2] [CODE] **SafetyTrainingService — ObjectMapper через reflection**: `ObjectMapper.class.getDeclaredConstructor().newInstance()` каждый вызов. Silent `catch (Exception ignored)` глотает ошибки, participantCount=0 | `SafetyTrainingService.java:72-75` | **Сессия 1.7**
105. [P2] [CODE] **SafetyRiskScoringService — 30+ hardcoded thresholds**: normalization incidents/violations/certs/subcontractors/experience + DEFAULT_WEIGHT=1 для всех 6 факторов. Не конфигурируется per-tenant | `SafetyRiskScoringService.java:327-536` | **Сессия 1.7**
106. [P3] [CODE] **REPEAT_INTERVAL_MONTHS = 6 hardcoded** в SafetyBriefingService и SafetyTrainingService. По ТК РФ для разных видов работ период может быть 3 или 12 месяцев | `SafetyBriefingService.java`, `SafetyTrainingService.java` | **Сессия 1.7**
107. [P3] [UX] **AutoScheduleResponse misleading count**: `employees.size()` показывает ВСЕХ сотрудников, а не matched by rules | `SafetyComplianceService.java:113` | **Сессия 1.7**
108. [P3] [ARCH] **SafetyComplianceService — граница god-class** (461 LOC): auto-scheduling + compliance + access blocks + prescriptions | `SafetyComplianceService.java` | **Сессия 1.7**
109. [P3] [UX] **Нет фотофиксации** инцидентов и инспекций — нет file upload | `SafetyIncidentFormPage.tsx`, `SafetyInspectionFormPage.tsx` | **Сессия 1.7**
110. [P3] [TEST] **0 unit тестов** для SafetyComplianceService (461 LOC) и SafetyRiskScoringService (~500 LOC) — два самых сложных сервиса модуля | **Сессия 1.7**

## Quality + Regulatory Module (Сессия 1.8)

111. [P1] [SECURITY] **ReportingDeadline — НЕТ organizationId**: entity без tenant isolation. Все дедлайны глобальные — тенант A видит дедлайны тенанта B. ReportingCalendarService 4 метода (findAll, findByFilters, findUpcoming, findOverdue) возвращают данные ВСЕХ организаций | `regulatory/domain/ReportingDeadline.java`, `regulatory/service/ReportingCalendarService.java:47-74` | **Сессия 1.8**
112. [P1] [SECURITY] **QualityCertificateController expired/expiring — cross-tenant**: getExpiredCertificates() и getExpiringCertificates() возвращают сертификаты ВСЕХ организаций без org filter | `quality/web/QualityCertificateController.java:89-102` | **Сессия 1.8**
113. [P2] [SECURITY] **20+ GET endpoints без @PreAuthorize** в quality (18 GET) + regulatory (11 GET) controllers — VIEWER видит все проверки, сертификаты, инспекции, предписания | Quality: `QualityCheckController:42-56`, `NonConformanceController:41-55`, `QualityGateController:38-121`, `QualityCertificateController:42-102` + 4 more controllers. Regulatory: `RegulatoryInspectionController:43-123`, `ConstructionPermitController:40-54`, `RegulatoryReportController:41-55`, `PrescriptionController:44-108` | **Сессия 1.8**
114. [P2] [UX] **PermitBoardPage — 100% mock**: `useState<PermitCard[]>([])`, нет API calls. Kanban-доска разрешений всегда пустая | `frontend/src/modules/regulatory/PermitBoardPage.tsx:41` | **Сессия 1.8**
115. [P2] [UX] **QualityBoardPage — HTML5 DnD, мобильные сломаны**: draggable+onDragStart+onDrop. НЕ мигрирован на @dnd-kit (остальные 17 boards мигрированы) | `frontend/src/modules/quality/QualityBoardPage.tsx` | **Сессия 1.8**
116. [P2] [UX] **QualityCheckDetailPage — photo gallery = placeholder**: Camera icons без реальных фото, нет fetch из бэкенда/MinIO | `frontend/src/modules/quality/QualityCheckDetailPage.tsx:236-249` | **Сессия 1.8**
117. [P2] [DATA] **permits.ts + reportingCalendar.ts — localStorage fallback**: нет tenant isolation в localStorage, данные теряются при очистке | `frontend/src/api/permits.ts`, `frontend/src/api/reportingCalendar.ts` | **Сессия 1.8**
118. [P2] [DATA] **Inspection.prescriptionsJson — JSONB дублирует FK**: prescriptionsJson не обновляется при изменении Prescription статуса → данные расходятся | `regulatory/domain/RegulatoryInspection.java:prescriptionsJson` | **Сессия 1.8**
119. [P2] [LOGIC] **Prescription overdue — нет автоматического обновления**: статус OVERDUE не устанавливается когда deadline < today(). Нет scheduled job. Предписание показывается как IN_PROGRESS хотя просрочено | `regulatory/service/PrescriptionService.java` | **Сессия 1.8**
120. [P3] [UX] **RegulatoryDashboardPage — hardcoded projects**: проекты из i18n (projectSunny, projectBridgeLabel, projectCentral) вместо API | `frontend/src/modules/regulatory/RegulatoryDashboardPage.tsx:205-214` | **Сессия 1.8**
121. [P3] [ARCH] **3 defect code paths**: DefectService + OpsService defect CRUD + NonConformance — три системы для одного домена | `quality/service/DefectService.java`, `operations/service/OpsService.java:242-324`, `quality/domain/NonConformance.java` | **Сессия 1.8**
122. [P3] [ARCH] **2 prescription entry points**: PrescriptionService.createPrescription() + RegulatoryInspectionService.addPrescription() — два способа создать предписание | `regulatory/service/PrescriptionService.java`, `regulatory/service/RegulatoryInspectionService.java` | **Сессия 1.8**
123. [P3] [TEST] **0 frontend тестов для 34 страниц** quality + regulatory. QualityGatesPage, DefectPlanViewPage, PrescriptionDetailPage — сложная логика без покрытия | `frontend/src/modules/quality/`, `frontend/src/modules/regulatory/` | **Сессия 1.8**
124. [P3] [TEST] **Нет тестов для QualityGateService.evaluateGate()** — самая сложная бизнес-логика модуля (3-dimension completion + status + templates) | `quality/service/QualityGateService.java` | **Сессия 1.8**
125. [P3] [CODE] **PrescriptionStatus — нет canTransitionTo()**: changeStatus() принимает любой переход. COMPLETED→OPEN возможен | `regulatory/service/PrescriptionService.java` | **Сессия 1.8**
126. [P3] [PERF] **PrescriptionRepository — 14 custom @Query**: findOverdue, findApproachingDeadline сканируют все prescriptions. Нет composite index (org, status, deadline) | `regulatory/repository/PrescriptionRepository.java` | **Сессия 1.8**
127. [P3] [VALID] **MaterialInspection result — lowercase enum**: 'accepted'/'rejected'/'conditional' vs UPPERCASE в остальных enum. Inconsistency | `quality/domain/MaterialInspection.java` | **Сессия 1.8**
128. [P3] [DATA] **ReportingSubmission — нет organizationId**: даже с fix ReportingDeadline, submissions не изолированы | `regulatory/domain/ReportingSubmission.java` | **Сессия 1.8**

## Supply: Warehouse + Procurement + Dispatch (Сессия 1.9)

129. [P1] [ARCH] **Duplicate PurchaseOrder entity**: procurement и procurementExt маппят ОДНУ таблицу `purchase_orders` с РАЗНЫМИ status enum (SENT_TO_SUPPLIER vs SENT/CONFIRMED/INVOICED/CLOSED). Data corruption при чтении cross-module | `procurement/domain/PurchaseOrder.java`, `procurementExt/domain/PurchaseOrder.java` | **Сессия 1.9**
130. [P1] [DATA] **PurchaseRequest.name — global UNIQUE** через все организации. Глобальная sequence → два тенанта не могут иметь "ЗП-00001" | `procurement/domain/PurchaseRequest.java`, `V11__procurement_tables.sql:11` | **Сессия 1.9**
131. [P1] [SECURITY] **procurementExt Delivery — НЕТ tenant isolation**: getDelivery(id) использует findById() без org filter. Cross-tenant access | `procurementExt/service/ProcurementExtService.java` | **Сессия 1.9**
132. [P2] [ARCH] **Bean name conflict**: Два PurchaseOrderRepository и два PurchaseOrderItemRepository без qualifier → BeanDefinitionStoreException | `procurement/repository/PurchaseOrderRepository.java`, `procurementExt/repository/PurchaseOrderRepository.java` | **Сессия 1.9**
133. [P2] [CALC] **VAT 20% hardcoded** в PurchaseOrderItem default + V91 migration. С 2026 НДС=22% | `V91__purchase_orders_and_warehouse_orders.sql:50`, `PurchaseOrderItem.java` | **Сессия 1.9**
134. [P2] [STUB] **sendPriceRequests() — STUB**: ProcurementDirectoryService только логирует, не создаёт entity, не отправляет уведомления | `ProcurementDirectoryService.java:47-90` | **Сессия 1.9**
135. [P2] [BUG] **InventoryPage create modal не отправляет**: кнопка создания закрывает модал без API call | `frontend/src/modules/warehouse/InventoryPage.tsx` | **Сессия 1.9**
136. [P2] [BUG] **MaterialFormPage — поля не сохраняются**: minStockLevel, description отображаются но НЕ отправляются при submit | `frontend/src/modules/warehouse/MaterialFormPage.tsx` | **Сессия 1.9**
137. [P2] [BUG] **MovementBoardPage — drag-drop local only**: перетаскивание не отправляется на бэкенд | `frontend/src/modules/warehouse/MovementBoardPage.tsx` | **Сессия 1.9**
138. [P2] [UX] **PurchaseRequestBoardPage — HTML5 DnD**: не работает на iOS/Android. Не мигрирована на @dnd-kit | `frontend/src/modules/procurement/PurchaseRequestBoardPage.tsx` | **Сессия 1.9**
139. [P2] [API] **Duplicate API wrapper**: procurement.ts и purchaseOrders.ts с разными endpoint paths | `frontend/src/api/procurement.ts`, `frontend/src/api/purchaseOrders.ts` | **Сессия 1.9**
140. [P2] [BUG] **Dispatch frontend status mismatch**: DRAFT/SCHEDULED/COMPLETED vs backend PLANNED | `frontend/src/modules/dispatch/types.ts` vs `ops/domain/DispatchStatus.java` | **Сессия 1.9**
141. [P2] [SECURITY] **8 warehouse GET endpoints без @PreAuthorize**: MaterialController, InventoryCheckController, WarehouseLocationController | `warehouse/web/*.java` | **Сессия 1.9**
142. [P2] [SECURITY] **7 procurement GET endpoints без @PreAuthorize**: PurchaseRequestController, PurchaseOrderController | `procurement/web/*.java` | **Сессия 1.9**
143. [P2] [UX] **TurnoverReportWizard — 4 hardcoded warehouses** вместо API | `frontend/src/modules/warehouse/TurnoverReportWizard.tsx` | **Сессия 1.9**
144. [P3] [PERF] **N+1 в StockMovementService.listMovements()**: getMovementLines() per movement. 20 items=21 queries | `warehouse/service/StockMovementService.java:70-74` | **Сессия 1.9**
145. [P3] [PERF] **N+1 в InventoryCheckService.listChecks()**: getCheckLines() per check | `warehouse/service/InventoryCheckService.java:66-68` | **Сессия 1.9**
146. [P3] [PERF] **N+1 в ProcurementService.enrichList()**: 4 additional queries per page | `procurement/service/ProcurementService.java:471-500` | **Сессия 1.9**
147. [P3] [i18n] **Dispatch i18n mixed languages**: `forms.dispatchRoute` содержит 'Расстояние positive', 'Breadcrumb Dispatch' | `frontend/src/i18n/ru.ts:14930-14965` | **Сессия 1.9**
148. [P3] [UX] **MaterialDetailPage Edit → list**: навигация на список вместо формы | `frontend/src/modules/warehouse/MaterialDetailPage.tsx` | **Сессия 1.9**
149. [P3] [UX] **MovementDetailPage Edit → list**: аналогично | `frontend/src/modules/warehouse/MovementDetailPage.tsx` | **Сессия 1.9**
150. [P3] [ARCH] **Duplicate warehouse order pages**: WarehouseOrdersPage (modal) + WarehouseOrderListPage (standard) | Multiple files | **Сессия 1.9**
151. [P3] [ARCH] **Duplicate dispatch backends**: ops.DispatchController + procurementExt.DispatchController — два API для одного домена | `ops/web/DispatchController.java`, `procurementExt/web/DispatchController.java` | **Сессия 1.9**
152. [P3] [LOGIC] **PO budget cancel — no rollback**: при отмене PO зарезервированный бюджет не возвращается | `procurementExt/service/PurchaseOrderService.java:107-113` | **Сессия 1.9**
153. [P3] [API] **Missing createFromSpec endpoint**: ProcurementService имеет метод, но нет HTTP endpoint | `procurement/service/ProcurementService.java` | **Сессия 1.9**
154. [P3] [DATA] **DispatchRoute routeId ignored**: frontend передаёт, backend не имеет поля → data loss | `dispatch/DispatchOrderFormPage.tsx` vs `ops/domain/DispatchOrder.java` | **Сессия 1.9**
155. [P3] [DATA] **PurchaseRequestItem.status — String, не Enum**: VARCHAR(50) default "PENDING" без валидации | `procurement/domain/PurchaseRequestItem.java` | **Сессия 1.9**
156. [P4] [UX] **Movement number timestamp-based** на фронтенде (backend correct) | `frontend/src/modules/warehouse/MovementFormPage.tsx` | **Сессия 1.9**
157. [P4] [CODE] **StockPage LOW_STOCK_THRESHOLD = 0 hardcoded** | `frontend/src/modules/warehouse/StockPage.tsx` | **Сессия 1.9**

## Fleet + IoT (Сессия 1.10)

158. [P1] [SECURITY] **IoT Sensor модуль — ZERO tenant isolation**: 5 таблиц (iot_devices, iot_sensor_data, iot_alerts, iot_alert_rules, iot_dashboards) без organization_id. IoTDeviceService не фильтрует по org. Любой ADMIN/ENGINEER видит ВСЕ IoT-устройства ВСЕХ организаций | `iot/domain/IoTDevice.java`, `iot/service/IoTDeviceService.java`, `V48__iot_tables.sql` | **Сессия 1.10**
159. [P1] [API] **Frontend↔Backend GPS path mismatch**: frontend вызывает `/fleet/gps/statuses`, `/fleet/gps/vehicles/{id}/track`, `/fleet/gps/geofence-alerts` — эти endpoints НЕ СУЩЕСТВУЮТ. Backend IoT equipment на `/api/iot/equipment/*`. Результат: 404 → localStorage fallback → мусорные данные | `frontend/src/api/fleet.ts`, `iot/web/IotEquipmentController.java` | **Сессия 1.10**
160. [P1] [SECURITY] **VehicleAssignment + FuelRecord — НЕТ organizationId**: entities без org_id и @Filter. FuelRecordRepository.sumCostByProjectId() агрегирует по projectId без org filter | `fleet/domain/VehicleAssignment.java`, `fleet/domain/FuelRecord.java`, `fleet/repository/FuelRecordRepository.java` | **Сессия 1.10**
161. [P2] [BUG] **iotApi.getAlertRules() — не определён в api.ts**: AlertsPage вызывает функцию, которой нет в API-слое → runtime error на вкладке Rules | `frontend/src/modules/iot/AlertsPage.tsx`, `frontend/src/modules/iot/api.ts` | **Сессия 1.10**
162. [P2] [UX] **FleetDetailPage — 4 вкладки пустые**: Assignments, Maintenance, Fuel, Inspections рендерят `data=[]`. API функции существуют в fleet.ts, но НЕ вызываются | `frontend/src/modules/fleet/FleetDetailPage.tsx` | **Сессия 1.10**
163. [P2] [STUB] **GpsTrackingPage — 100% localStorage mock**: все 3 GPS API-функции возвращают localStorage fallback. Нет реального backend-соединения | `frontend/src/api/fleet.ts` (getGpsStatuses, getVehicleTrack, getGeofenceAlerts) | **Сессия 1.10**
164. [P2] [STUB] **DriverRatingPage — backend endpoints НЕ существуют**: `/fleet/drivers/ratings` и `/fleet/drivers/{id}/detail` нет в backend. try/catch → localStorage | `frontend/src/modules/fleet/DriverRatingPage.tsx`, `frontend/src/api/fleet.ts` | **Сессия 1.10**
165. [P2] [BUG] **AlertsPage acknowledge — toast-заглушка**: кнопка показывает toast, но НЕ вызывает iotApi.acknowledgeAlert(). Алерт остаётся ACTIVE в БД | `frontend/src/modules/iot/AlertsPage.tsx` | **Сессия 1.10**
166. [P2] [ARCH] **Нет @Scheduled для maintenance due detection**: getDueMaintenanceItems() только по API-запросу. Нет проактивных уведомлений о просроченном ТО | `fleet/service/MaintenanceScheduleService.java` | **Сессия 1.10**
167. [P2] [PERF] **iot_sensor_data — нет партиционирования/retention**: time-series растёт неограниченно. 50 датчиков × 5с = 864K записей/день | `V48__iot_tables.sql` | **Сессия 1.10**
168. [P2] [LOGIC] **Geofence EXITED alert для STORAGE зон**: `checkGeofenceViolations()` — техника покидающая склад получает EXITED alert. Логичен только для SITE зон | `iot/service/IotService.java` (checkGeofenceViolations) | **Сессия 1.10**
169. [P2] [ARCH] **GPS Timesheet — 2 параллельные geofence системы**: IoT geofence_zones + gpsTimesheet site_geofences — дублирование таблиц, логики, entities | `V218__iot_equipment_dashboard.sql`, `V219__gps_timesheets.sql` | **Сессия 1.10**
170. [P2] [PERF] **Hardcoded pagination size:200** на fleet list pages — 500+ vehicles OOM risk | `frontend/src/modules/fleet/FleetListPage.tsx`, FuelPage, MaintenancePage | **Сессия 1.10**
171. [P3] [UX] **FleetListPage "Add Vehicle"** — toast hint вместо навигации к /fleet/new | `frontend/src/modules/fleet/FleetListPage.tsx` | **Сессия 1.10**
172. [P3] [UX] **WaybillPrintTemplate не интегрирован** — компонент печати путевого листа (форма 4-П) не подключён к WaybillDetailPage | `frontend/src/modules/fleet/components/WaybillPrintTemplate.tsx` | **Сессия 1.10**
173. [P3] [BUG] **Create Rule modal — UI без backend**: AlertsPage модалка создания правила не отправляет данные | `frontend/src/modules/iot/AlertsPage.tsx` | **Сессия 1.10**
174. [P3] [BUG] **SensorsPage — NPE при пустой группе**: `devices[0].lastReadingAt` crash если devices=[] для sensor type | `frontend/src/modules/iot/SensorsPage.tsx` | **Сессия 1.10**
175. [P3] [SECURITY] **IoTController @PreAuthorize слишком узко**: только ADMIN+ENGINEER. Нет MANAGER, PROJECT_MANAGER, FOREMAN | `iot/web/IoTController.java` | **Сессия 1.10**
176. [P3] [UX] **GpsTrackingPage map — placeholder**: "Map functionality coming soon" вместо Leaflet/Mapbox карты | `frontend/src/modules/fleet/GpsTrackingPage.tsx` | **Сессия 1.10**
177. [P3] [UX] **DeviceDetailPage — упрощённая визуализация**: div bar вместо Recharts temporal chart для IoT readings | `frontend/src/modules/iot/DeviceDetailPage.tsx` | **Сессия 1.10**
178. [P3] [TEST] **Fleet tests — только happy path**: 7 функций × 1 тест. Нет edge cases, ошибок, валидации | `frontend/src/api/fleet.test.ts` | **Сессия 1.10**

179. [P1] [SECURITY] **CalendarEvent entity — НЕТ @Filter tenant isolation**: события одной организации видны другой. Нет `@Filter(name = "tenantFilter")` аннотации + все GET endpoints без @PreAuthorize | `calendar/domain/CalendarEvent.java` | **Сессия 1.14**
180. [P1] [SECURITY] **ConstructionSchedule entity — НЕТ @Filter tenant isolation**: графики строительства одной организации видны другой. Нет `@Filter(name = "tenantFilter")` | `calendar/domain/ConstructionSchedule.java` | **Сессия 1.14**
181. [P1] [SECURITY] **TaskParticipantService.hasAccess() — PROJECT visibility = true для ВСЕХ**: `case PROJECT: return true;` с комментарием "for now allow". Задачи с видимостью PROJECT доступны всем пользователям организации | `task/service/TaskParticipantService.java:175-176` | **Сессия 1.14**
182. [P2] [SECURITY] **14+ GET endpoints без @PreAuthorize** в 3 calendar controllers (CalendarEvent: 5, ConstructionSchedule: 4, WorkCalendar: 5) | `calendar/web/*Controller.java` | **Сессия 1.14**
183. [P2] [SECURITY] **TaskDependencyRepository — запросы без org filter**: findByTaskId(), findByDependsOnTaskId(), findAllByProjectId() — cross-org data leakage risk | `task/repository/TaskDependencyRepository.java` | **Сессия 1.14**
184. [P2] [SECURITY] **TaskParticipantRepository — запросы без org filter**: findByTaskId(), findByUserId(), findTaskIdsByUserId() — participant enumeration cross-org | `task/repository/TaskParticipantRepository.java` | **Сессия 1.14**
185. [P2] [UX] **BulkActionsBar — удаление задач БЕЗ подтверждения**: прораб может случайно удалить десятки задач. Нет ни confirm, ни модалки | `frontend/src/modules/tasks/BulkActionsBar.tsx` | **Сессия 1.14**
186. [P2] [BUG] **CalendarPage event type mismatch**: types.ts=4 типа, CalendarPage=7 типов. TypeScript не ловит несоответствие | `frontend/src/modules/calendar/types.ts` vs `CalendarPage.tsx` | **Сессия 1.14**
187. [P2] [i18n] **DependencyEditorModal — отсутствуют i18n keys**: `gantt.depType.finishToStart`, `gantt.depTypeShort.*` не найдены в ru.ts/en.ts → raw keys в UI | `frontend/src/modules/tasks/DependencyEditorModal.tsx` | **Сессия 1.14**
188. [P2] [SECURITY] **TaskLabelController.getLabels() — organizationId optional param**: берётся из query param, можно передать чужой orgId | `task/web/TaskLabelController.java` | **Сессия 1.14**
189. [P3] [DATA] **V1112 backward compat**: все PARTICIPANTS_ONLY задачи стали ORGANIZATION без уведомления пользователей | `V1112__task_participants_and_visibility.sql` | **Сессия 1.14**
190. [P3] [UX] **DependencyEditorModal — lag days принимает отрицательные значения**: нет min=0 constraint | `DependencyEditorModal.tsx` | **Сессия 1.14**
191. [P3] [BUG] **TaskTimerWidget — mixed duration units**: `durationSeconds ?? durationMinutes * 60` — зависит от формата API | `TaskTimerWidget.tsx` | **Сессия 1.14**
192. [P3] [BUG] **CalendarEventFormPage — TRAINING → OTHER mapping**: тип события теряется при сохранении/редактировании | `CalendarEventFormPage.tsx` | **Сессия 1.14**
193. [P3] [UX] **CalendarPage week view — hardcoded hours 7:00-20:00**: нет часовых поясов, не учитывает ночные работы | `CalendarPage.tsx` | **Сессия 1.14**
194. [P3] [UX] **CalendarPage event detail — projectId как UUID вместо имени проекта** | `CalendarPage.tsx` | **Сессия 1.14**
195. [P3] [UX] **TaskStagesManager — удаление стадии без проверки наличия задач**: задачи могут стать orphaned | `TaskStagesManager.tsx` | **Сессия 1.14**
196. [P3] [UX] **Favorites задач — localStorage only**: нет серверной персистенции, теряются при смене устройства | `frontend/src/api/tasks.ts` | **Сессия 1.14**

## Projects + Site Assessments (Сессия 1.11)

215. [P1] [SECURITY] **Milestone IDOR — нет tenant isolation**: updateMilestone/deleteMilestone по id без org check. findById() обходит @Filter | `ProjectMilestoneService.java:52-74` | **Сессия 1.11**
216. [P1] [SECURITY] **Collaborator IDOR — entity БЕЗ @Filter, БЕЗ organizationId**: acceptInvitation/removeCollaborator открыты cross-tenant | `ProjectCollaboratorService.java:63-93` | **Сессия 1.11**
217. [P1] [BUG] **DB CHECK constraint блокирует 6 новых ProjectType**: V4 CHECK vs Java enum 11 типов → DB error | `V4__project_tables.sql:40` + `ProjectType.java` | **Сессия 1.11**
218. [P1] [BUG] **SiteAssessment: НЕТ backend update endpoint**: Frontend PUT → 405. Edit flow сломан | `SiteAssessmentController.java` | **Сессия 1.11**
219. [P1] [BUG] **SiteAssessment: entity/migration field mismatch**: V1055 12 колонок не в JPA entity. Геотехника = иллюзия | `SiteAssessment.java` vs `V1055` | **Сессия 1.11**
220. [P2] [SECURITY] **5 financial queries без organizationId filter**: defense-in-depth нарушен | `ProjectFinancialService.java` repos | **Сессия 1.11**
221. [P2] [SECURITY] **8+ GET endpoints без @PreAuthorize** в 4 controllers | Multiple controllers | **Сессия 1.11**
222. [P2] [SECURITY] **ProjectTemplateController возвращает JPA entity** → field leakage | `ProjectTemplateController.java:30,50` | **Сессия 1.11**
223. [P2] [BUG] **SiteAssessment scoring mismatch**: backend >= 6, frontend >= 7 для CONDITIONAL | `SiteAssessment.java:140` vs `SiteAssessmentFormPage.tsx:137` | **Сессия 1.11**
224. [P2] [i18n] **SiteAssessmentFormPage — ~20+ missing i18n keys** → raw keys в UI | `SiteAssessmentFormPage.tsx` | **Сессия 1.11**
225. [P2] [BUG] **ProjectSetupWizard handleFinish STUB**: проект НЕ СОЗДАЁТСЯ | `ProjectSetupWizard.tsx:131-137` | **Сессия 1.11**
226. [P2] [BUG] **SiteAssessment edit не загружает данные**: нет useQuery | `SiteAssessmentFormPage.tsx` | **Сессия 1.11**
227. [P2] [PERF] **N+1 getDashboardTotals**: цикл × 5 SQL. 100 проектов = 500 queries | `ProjectFinancialService.java:186-199` | **Сессия 1.11**
228. [P2] [TEST] **4 backend теста не компилируются** | `ProjectControllerTest.java` + `ProjectServiceTest.java` | **Сессия 1.11**
229. [P2] [BUG] **PortfolioHealthPage 4/7 RAG — СИМУЛЯЦИЯ** hashCode % 5 | `PortfolioHealthPage.tsx:52-100` | **Сессия 1.11**
230. [P2] [BUG] **SiteAssessment notes не отправляется** | `SiteAssessmentFormPage.tsx:192-197` | **Сессия 1.11**
231. [P3] [BUG] **ProjectStatus missing CLOSEOUT** в enum | `ProjectStatus.java` | **Сессия 1.11**
232. [P3] [BUG] **ChangeStatusRequest.reason игнорируется** | `ProjectService.java:212-246` | **Сессия 1.11**
233. [P3] [BUG] **Construction Plans API — localStorage only** | `projects.ts:107-149` | **Сессия 1.11**
234. [P3] [BUG] **ProjectDesign API — silent failure → localStorage** | `projectDesign.ts:1-150` | **Сессия 1.11**
235. [P3] [CODE] **10+ `as any` в ProjectFormPage** | `ProjectFormPage.tsx:549-725` | **Сессия 1.11**
236. [P3] [CODE] **6 console statements в production** | `ProjectFormPage.tsx:643-731` | **Сессия 1.11**
237. [P3] [UX] **window.confirm вместо ConfirmDialog** | `ConstructabilityReview*.tsx` | **Сессия 1.11**
238. [P3] [UX] **ProjectTeamTab delete без confirmation** | `ProjectTeamTab.tsx:128` | **Сессия 1.11**
239. [P3] [UX] **RiskRegisterPage stale closure** | `RiskRegisterPage.tsx:182` | **Сессия 1.11**
240. [P3] [i18n] **SiteAssessment env status enum mismatch** | `SiteAssessmentFormPage.tsx` | **Сессия 1.11**
241. [P3] [ARCH] **ProjectService god-class 487 LOC** | `ProjectService.java` | **Сессия 1.11**
242. [P3] [ARCH] **Cross-module imports** | `ProjectService.java:6-10` | **Сессия 1.11**
243. [P3] [BUG] **ProjectDetailPage `any` в reduce** → NaN | `ProjectDetailPage.tsx:112-123` | **Сессия 1.11**
244. [P3] [i18n] **RF_REGIONS 89 hardcoded Russian** | `ProjectFormPage.tsx:110-136` | **Сессия 1.11**
245. [P3] [i18n] **DOC_CATEGORY hardcoded Russian** | `ProjectFormPage.tsx:148-157` | **Сессия 1.11**
246. [P3] [ARCH] **SiteAssessment core columns не в миграциях** | `SiteAssessment.java` | **Сессия 1.11**
247. [P3] [UX] **SiteAssessment custom criteria localStorage only** | `SiteAssessmentFormPage.tsx:37-49` | **Сессия 1.11**
248. [P3] [CODE] **Module-local types.ts устарел** 5 vs 11 | `modules/projects/types.ts` | **Сессия 1.11**

## Planning Module (Сессия 1.13)

197. [P1] [SECURITY] **EvmSnapshot — НЕТ tenant isolation**: entity без organizationId, без @Filter. 5 GET endpoints без @PreAuthorize. Cross-tenant EVM data leak | `planning/domain/EvmSnapshot.java`, `planning/web/EvmSnapshotController.java` | **Сессия 1.13**
198. [P1] [SECURITY] **ScheduleBaseline — НЕТ tenant isolation**: entity без organizationId, без @Filter. 4 GET endpoints без @PreAuthorize | `planning/domain/ScheduleBaseline.java`, `planning/web/ScheduleBaselineController.java` | **Сессия 1.13**
199. [P1] [SECURITY] **ResourceAllocation — НЕТ tenant isolation**: entity без organizationId, без @Filter. 3 GET без @PreAuthorize. Service не проверяет org | `planning/domain/ResourceAllocation.java`, `planning/web/ResourceAllocationController.java` | **Сессия 1.13**
200. [P2] [SECURITY] **29 GET endpoints без @PreAuthorize** across 10 planning controllers | All 10 controllers in `planning/web/` | **Сессия 1.13**
201. [P2] [STUB] **"Compare Versions" — toast-заглушка**: кнопка не вызывает backend diff endpoint | `ScheduleBaselinePage.tsx:138` | **Сессия 1.13**
202. [P2] [ARCH] **Дублирование API layer**: `modules/planning/api.ts` (337 LOC) + `api/planning.ts` (258 LOC) | **Сессия 1.13**
203. [P2] [STUB] **getResourceHistogram() — hardcoded return []** | `modules/planning/api.ts:273-276` | **Сессия 1.13**
204. [P2] [UX] **Нет WBS CRUD UI**: Gantt read-only, Backend CRUD полный | `GanttChartPage.tsx` | **Сессия 1.13**
205. [P2] [UX] **S-Curve — div bars вместо Recharts Line chart** | `EvmDashboardPage.tsx:207-227` | **Сессия 1.13**
206. [P2] [UX] **ResourceAllocationBoard — ввод UUID вместо picklist** | `ResourceAllocationBoardPage.tsx:301` | **Сессия 1.13**
207. [P3] [CALC] **EVM Bottom-up EAC = BAC** — заглушка | `EvmAnalyticsService.java:162` | **Сессия 1.13**
208. [P3] [CALC] **WBS-level EVM: AC = EV** — CV = 0 всегда | `EvmAnalyticsService.java:218` | **Сессия 1.13**
209. [P3] [CALC] **Confidence bands: ±10% от EV** — наивная формула | `EvmAnalyticsService.java:250-255` | **Сессия 1.13**
210. [P3] [CALC] **CPM: calendar days, не рабочие дни**. Ошибка ~28% | `WbsNodeService.java:270` | **Сессия 1.13**
211. [P3] [UX] **Gantt bars не draggable** | `GanttChartPage.tsx` | **Сессия 1.13**
212. [P3] [UX] **Нет зависимостей-стрелок на Gantt** | `GanttChartPage.tsx` | **Сессия 1.13**
213. [P3] [UX] **Нет Create Baseline кнопки** | `ScheduleBaselinePage.tsx` | **Сессия 1.13**
214. [P3] [PERF] **WorkVolume save — N sequential HTTP calls** | `WorkVolumeTrackingPage.tsx:103` | **Сессия 1.13**

## Dashboard + Analytics Module (Сессия 1.12)

215. [P1] [SECURITY] **Dashboard entity — НЕТ tenant isolation**: нет organization_id, нет @Filter. Дашборды глобальные — cross-tenant access | `analytics/domain/Dashboard.java` | **Сессия 1.12**
216. [P1] [SECURITY] **KpiDefinition entity — НЕТ tenant isolation**: нет organization_id, нет @Filter. KPI-определения видны всем тенантам | `analytics/domain/KpiDefinition.java` | **Сессия 1.12**
217. [P1] [SECURITY] **SavedReport entity — НЕТ tenant isolation**: нет organization_id, нет @Filter. Сохранённые отчёты cross-tenant accessible | `analytics/domain/SavedReport.java` | **Сессия 1.12**
218. [P1] [CALC] **AnalyticsDataService — hardcoded cost ratio 0.85**: `totalCosts = totalBudget * 0.85` — маржа always 15%, budget utilization capped at 85% | `AnalyticsDataService.java:101` | **Сессия 1.12**
219. [P1] [BUG] **PredictiveAnalyticsService DEFECT_WEIGHT copy-paste**: change order impact × DEFECT_WEIGHT вместо CHANGE_ORDER_WEIGHT | `PredictiveAnalyticsService.java:241` | **Сессия 1.12**
220. [P2] [SECURITY] **13+ analytics GET endpoints с ослабленным RBAC**: VIEWER видит financial dashboards, budgets, KPIs, export | `AnalyticsController.java:99+` | **Сессия 1.12**
221. [P2] [CALC] **Financial bars fabricated**: total/6 с variance factors вместо GROUP BY month | `AnalyticsDataService.java:263-277` | **Сессия 1.12**
222. [P2] [CALC] **Safety metrics fabricated**: total incidents / 6 months equally | `AnalyticsDataService.java:300-303` | **Сессия 1.12**
223. [P2] [STUB] **Report execution = mock**: outputSize=1024L hardcoded, нет генерации PDF/Excel | `AnalyticsSavedReportService.java` | **Сессия 1.12**
224. [P2] [PERF] **N+1 ×3 в AnalyticsDataService**: budget sums, project budgets, export — 50 projects = 100-150 SQL | `AnalyticsDataService.java:141,503,626` | **Сессия 1.12**
225. [P2] [PERF] **N+1 EVM snapshots** в ExecutiveKpiService per project | `ExecutiveKpiService.java:169-171` | **Сессия 1.12**
226. [P2] [UX] **PredictiveAnalyticsPage — 100% mock**: all data hardcoded, project selector non-functional | `PredictiveAnalyticsPage.tsx:19-147` | **Сессия 1.12**
227. [P2] [DATA] **kpiBonuses.ts — localStorage seed фейковые ФИО/зарплаты** при API fallback | `kpiBonuses.ts:39-75` | **Сессия 1.12**
228. [P2] [STUB] **dashboard.ts — getWidgets()=[], updateWidgetLayout()=no-op** | `dashboard.ts:154-161` | **Сессия 1.12**
229. [P2] [PERF] **getDistinctOrganizationIds() in-memory**: all projects loaded, filtered in Java | `PredictiveAnalyticsService.java:758-765` | **Сессия 1.12**
230. [P3] [CALC] **CPI formula wrong**: planned/actual вместо EVM EV/AC | `ExecutiveKpiService.java:192-197` | **Сессия 1.12**
231. [P3] [CALC] **SPI unstarted = 1.20**: arbitrary value | `ExecutiveKpiService.java:627-630` | **Сессия 1.12**
232. [P3] [CALC] **Fallback cost = budget*0.85 cascade** | `ExecutiveKpiService.java:128-129` | **Сессия 1.12**
233. [P3] [STUB] **4 stub summaries**: safety, procurement, warehouse, HR = zeros | `AnalyticsDataService.java:123,175,187,200` | **Сессия 1.12**
234. [P3] [i18n] **analytics.ts hardcoded Russian labels** не через t() | `analytics.ts:190-197` | **Сессия 1.12**
235. [P3] [i18n] **dashboard.ts hardcoded English labels** не через t() | `dashboard.ts:79-84` | **Сессия 1.12**
236. [P3] [UX] **No error boundaries on charts** — Recharts NaN = white screen | Dashboard, Analytics pages | **Сессия 1.12**
237. [P3] [UX] **Export = toast**, print = window.print() | `AnalyticsDashboardPage.tsx` | **Сессия 1.12**
238. [P3] [UX] **ReportBuilder no editing/scheduling/preview** | `ReportBuilderPage.tsx` | **Сессия 1.12**
239. [P3] [UX] **AuditPivot 5000 row limit, no date filter** | `AuditPivotPage.tsx` | **Сессия 1.12**
240. [P3] [CODE] **Custom SVG 463 LOC** вместо Recharts | `ProjectAnalyticsChartPage.tsx` | **Сессия 1.12**
241. [P3] [TEST] **0 компонентных тестов для 12 pages** | dashboard + analytics modules | **Сессия 1.12**
242. [P3] [CALC] **EVM export timeFraction=0.5 default** | `AnalyticsDataService.java:785` | **Сессия 1.12**

## Processes Module (Сессия 1.15)

249. [P1] [SECURITY] **pmWorkflow cross-tenant утечка**: RfiService, IssueService, PmSubmittalService — ВСЕ list/get/overdue без organizationId filter. @Filter(tenantFilter) не активирован | `RfiService.java:42-55,222-224`, `IssueService.java:42-54,221-224`, `PmSubmittalService.java:50-63,271-274` | **Сессия 1.15**
250. [P1] [SECURITY] **changeManagement cross-tenant утечка**: ChangeOrderService, ChangeEventService, ChangeOrderRequestService — list/get без org filter | `ChangeOrderService.java:45-47,284-287`, `ChangeEventService.java:33-43,194-197`, `ChangeOrderRequestService.java:161-164` | **Сессия 1.15**
251. [P1] [SECURITY] **ChangeOrderRequest entity — НЕТ organizationId, НЕТ @Filter**: entity полностью вне tenant isolation | `changeManagement/domain/ChangeOrderRequest.java` | **Сессия 1.15**
252. [P1] [SECURITY] **IDOR: path variable игнорируется**: 3 контроллера передают body.entityId вместо @PathVariable. POST на `/rfis/A/responses` с body `{rfiId: B}` → ответ к чужому RFI | `RfiController.java:117`, `IssueController.java:117`, `PmSubmittalController.java:165` | **Сессия 1.15**
253. [P1] [SECURITY] **ApprovalStep approve/reject — нет ownership check**: любой ADMIN/PM/FM может approve/reject step любой организации | `ApprovalService.java:98-143` | **Сессия 1.15**
254. [P1] [BUG] **ChangeOrderDetailPage status mutation вызывает createChangeOrder вместо changeStatus** — `as any` скрывает ошибку | `ChangeOrderDetailPage.tsx:56-58` | **Сессия 1.15**
255. [P1] [BUG] **ChangeEventDetailPage status mutation вызывает createChangeEvent вместо changeStatus** — аналогично | `ChangeEventDetailPage.tsx:41-43` | **Сессия 1.15**
256. [P1] [STUB] **ChangeOrderBoardPage — 100% non-functional**: useState([]), нет API, Kanban всегда пуст | `ChangeOrderBoardPage.tsx:49` | **Сессия 1.15**
257. [P1] [BUG] **RfiFormPage navigation routes — все 404**: навигация на `/rfi` и `/rfi/${id}` вместо `/pm/rfis` и `/pm/rfis/${id}` | `RfiFormPage.tsx:126,152,174,177,264` | **Сессия 1.15**
258. [P2] [SECURITY] **ChangeEvent.createFromRfi не устанавливает organizationId** → запись с org=null | `ChangeEventService.java:83-108` | **Сессия 1.15**
259. [P2] [SECURITY] **WorkflowDefinition findById/update/delete без org check** — cross-tenant CRUD | `WorkflowDefinitionService.java:50-57,78-112` | **Сессия 1.15**
260. [P2] [SECURITY] **ApprovalInstance.submitDecision не проверяет что caller = designated approver** | `ApprovalInstanceService.java:192-290` | **Сессия 1.15**
261. [P2] [SECURITY] **AutomationExecution findAll без org filter** когда ruleId=null | `WorkflowDefinitionService.java:158-166` | **Сессия 1.15**
262. [P2] [SECURITY] **35+ GET endpoints без @PreAuthorize** в 11 controllers модуля processes | Multiple controllers | **Сессия 1.15**
263. [P2] [BUG] **Edit forms defaultValues не обновляются** при async data load — поля пусты в edit mode | `RfiFormPage.tsx:83-106`, `SubmittalFormPage.tsx:84-109`, `IssueFormPage.tsx:82-105`, `ChangeOrderFormPage.tsx:92-117` | **Сессия 1.15**
264. [P2] [BUG] **Query key mismatches** — create/update invalidates camelCase, list uses kebab-case → stale data | `ChangeOrderFormPage.tsx:134,156-157`, `ChangeEventCreateModal.tsx:83` | **Сессия 1.15**
265. [P2] [BUG] **SubmittalCreateModal maps reviewerId → submittedById** — reviewer не передаётся | `SubmittalCreateModal.tsx:80` | **Сессия 1.15**
266. [P2] [BUG] **IssueListPage kanban игнорирует фильтры** — использует unfiltered `issues` | `IssueListPage.tsx:291` | **Сессия 1.15**
267. [P2] [BUG] **RfiBoardPage — HTML5 DnD** не работает на мобильных (не мигрирован на @dnd-kit) | `RfiBoardPage.tsx:87-104` | **Сессия 1.15**
268. [P2] [BUG] **ChangeOrderFormPage navigation — неправильные пути** после create/update | `ChangeOrderFormPage.tsx:136,159` | **Сессия 1.15**
269. [P2] [CALC] **Analytics budget impact — originalAmount из CO, не из контракта** | `ChangeManagementAnalyticsService.java:230-234` | **Сессия 1.15**
270. [P2] [PERF] **ApprovalInstanceService.getPendingForUser — сломанная пагинация** (in-memory filter) | `ApprovalInstanceService.java:356-375` | **Сессия 1.15**
271. [P2] [DATA] **Race condition в генерации номеров** RFI/Issue — MAX+1 без DB lock | `RfiService.java:227-231`, `IssueService.java:227-231` | **Сессия 1.15**
272. [P2] [PERF] **ChangeManagementAnalyticsService — in-memory aggregation** всех CO/CE проекта | `ChangeManagementAnalyticsService.java:124-394` | **Сессия 1.15**
273. [P2] [PERF] **N+1 в WorkflowDefinitionService.findAll** + ApprovalInstanceService.getPendingForUser | `WorkflowDefinitionService.java:38-47`, `ApprovalInstanceService.java:365-372` | **Сессия 1.15**
274. [P2] [i18n] **WorkflowDesignerPage hardcoded Russian role labels** не через t() | `WorkflowDesignerPage.tsx:43-50` | **Сессия 1.15**
275. [P2] [i18n] **WorkflowStepDesigner hardcoded English role labels** не через t() | `WorkflowStepDesigner.tsx:233-238` | **Сессия 1.15**
276. [P2] [UX] **Dashboard chart type mismatches** — 5 несоответствий types.ts vs column definitions → undefined в charts | `ChangeManagementDashboardPage.tsx` vs `types.ts` | **Сессия 1.15**
277. [P3] [BUG] **WorkflowDefinitionService.findAll ignores filter params** (search, entityType, isActive) | `WorkflowDefinitionService.java:34-47` | **Сессия 1.15**
278. [P3] [BUG] **Overdue RFI/Issue includes items due today** — dueDate <= today вместо < | `RfiRepository.java:33`, `IssueRepository.java:33` | **Сессия 1.15**
279. [P3] [BUG] **recalculateRevisedContractAmount uses only current CO**, не все approved CO | `ChangeOrderService.java:297-301` | **Сессия 1.15**
280. [P3] [STUB] **TODO: escalation notification не реализован** | `ApprovalInstanceService.java:473` | **Сессия 1.15**
281. [P3] [CODE] **Hardcoded status strings** в ApprovalService ("PENDING", "APPROVED") вместо enum | `ApprovalService.java:43,57,102,106` | **Сессия 1.15**
282. [P3] [CODE] **Hardcoded budget item name** 'Change Orders' → ломается при rename/i18n | `ChangeOrderService.java:167,172,176` | **Сессия 1.15**
283. [P3] [ARCH] **ApprovalInstanceService — god class 620 LOC** с 7 inner record DTOs | `ApprovalInstanceService.java` | **Сессия 1.15**
284. [P3] [ARCH] **ApprovalInboxPage — god component 867 LOC** — 5 модалок, 8+ useState | `ApprovalInboxPage.tsx` | **Сессия 1.15**
285. [P3] [UX] **Dark mode пропуски** в Change Management (10+ мест без dark: variants) | `ChangeOrder*.tsx`, `ChangeEvent*.tsx`, `ChangeManagementDashboardPage.tsx` | **Сессия 1.15**
286. [P3] [ARCH] **Duplicate workflow API files** — api/workflow.ts + modules/workflow/api.ts | **Сессия 1.15**
287. [P3] [ARCH] **Zod schemas call t() at import time** — validation messages frozen | 5 form pages | **Сессия 1.15**
288. [P3] [UX] **Нет confirmation dialog на Reject/Void** в 4 detail pages | **Сессия 1.15**
289. [P3] [i18n] **IssueDetailPage hardcoded "RFI:" / "Submittal:"** | `IssueDetailPage.tsx:264,267` | **Сессия 1.15**
290. [P3] [PERF] **Overdue endpoints return unbounded lists** — findOverdue* без пагинации | `RfiService.java:211-218`, `IssueService.java:210-218` | **Сессия 1.15**

## Documents + DataExchange + Integration1C Module (Сессия 1.16)

291. [P1] [SECURITY] **CDE DocumentContainer — НЕТ organizationId, НЕТ @Filter**: все документы CDE видны cross-tenant. Entity не имеет org_id, нет Hibernate tenant filter | `cde/domain/DocumentContainer.java` | **Сессия 1.16**
292. [P1] [SECURITY] **CDE Transmittal — НЕТ @Filter(tenantFilter)**: from_organization_id/to_organization_id есть, но нет tenant filter → list() возвращает transmittals всех организаций | `cde/domain/Transmittal.java` | **Сессия 1.16**
293. [P1] [SECURITY] **PTO PtoDocument — НЕТ organizationId, НЕТ @Filter**: документы ПТО доступны cross-tenant через GET /api/pto/documents | `pto/domain/PtoDocument.java` | **Сессия 1.16**
294. [P1] [SECURITY] **PTO WorkPermit — НЕТ organizationId, НЕТ @Filter**: наряд-допуски чужих организаций видны всем. Критично для safety compliance | `pto/domain/WorkPermit.java` | **Сессия 1.16**
295. [P1] [SECURITY] **PTO LabTest + Ks6Journal — НЕТ organizationId, НЕТ @Filter**: результаты лаб.испытаний и журналы КС-6 cross-tenant | `pto/domain/LabTest.java`, `pto/domain/Ks6Journal.java` | **Сессия 1.16**
296. [P1] [STUB] **DiadokClient = 100% MOCK**: authenticate() → fake token, sendDocument() → fake ID, downloadSignedDocument() → empty byte[]. ЭДО полностью не работает | `edo/service/DiadokClient.java` | **Сессия 1.16**
297. [P1] [DATA] **PtoCodeGenerator AtomicLong сбрасывается при рестарте JVM**: `new AtomicLong(System.currentTimeMillis() % 100000)` → коллизии кодов DOC-/WP-/ACT-/LT- | `pto/service/PtoCodeGenerator.java:13` | **Сессия 1.16**
298. [P1] [API] **DataExchange — НЕТ REST контроллеров**: backend services есть, но controller layer ПОЛНОСТЬЮ ОТСУТСТВУЕТ. Frontend вызывает /api/data-exchange/* → 404 на ВСЕ 10 endpoints | `dataExchange/web/` (только DTOs, нет controllers) | **Сессия 1.16**
299. [P1] [SECURITY] **CDE DocumentRevision — НЕТ organizationId**: FK на DocumentContainer, но DocumentContainer сам без org → double gap | `cde/domain/DocumentRevision.java` | **Сессия 1.16**
300. [P1] [STUB] **Integration1C export pipelines — STUBS**: exportInvoices(), exportKs2(), exportKs3(), syncMaterials() — все создают sync log но НЕ отправляют данные в 1С | `integration1c/service/Integration1cService.java` | **Сессия 1.16**
301. [P2] [SECURITY] **8 GET endpoints без @PreAuthorize в DocumentController**: list, getById, download-url, download, history, search, expiring + addComment — любой authenticated user | `document/web/DocumentController.java:51-77,110-126,167-183` | **Сессия 1.16**
302. [P2] [SECURITY] **10+ GET endpoints без @PreAuthorize в CDE controllers**: DocumentContainerController (list, getById, revisions, audit), TransmittalController (list, getById, items, acknowledge) | `cde/web/DocumentContainerController.java`, `cde/web/TransmittalController.java` | **Сессия 1.16**
303. [P2] [SECURITY] **4 GET endpoints без @PreAuthorize в EdoController**: config get, document history, check status, download signed | `edo/web/EdoController.java` | **Сессия 1.16**
304. [P2] [STUB] **SmartDocRecognitionPage — 100% mock frontend**: AI document recognition, OCR, classification — все на фейковых useState. Нет backend API | `frontend/src/modules/documents/SmartDocRecognitionPage.tsx` | **Сессия 1.16**
305. [P2] [STUB] **CDE Document Locking — НЕ РЕАЛИЗОВАНО**: V136 migration добавляет locked_by_id, locked_at, lock_expires_at, но service не использует | `V136__cde_document_locking_and_approval.sql` | **Сессия 1.16**
306. [P2] [STUB] **CDE Revision Approval — НЕ РЕАЛИЗОВАНО**: V136 добавляет approval_status, approval_comment, но не реализовано в сервисе | `V136__cde_document_locking_and_approval.sql` | **Сессия 1.16**
307. [P2] [UX] **PtoDocumentBoardPage — HTML5 DnD, мобильные сломаны**: draggable+onDragStart — не мигрирован на @dnd-kit | `frontend/src/modules/pto/PtoDocumentBoardPage.tsx` | **Сессия 1.16**
308. [P2] [STUB] **EdoService.sendDocument() — частичный STUB**: создаёт EdoDocument в БД, но DiadokClient возвращает mock token + empty bytes | `edo/service/EdoService.java` | **Сессия 1.16**
309. [P2] [BUG] **UnifiedDocumentsPage navigation — неправильный path**: клик на GENERAL документ → `/documents` (список) вместо `/documents/${id}/edit` | `frontend/src/modules/documents/UnifiedDocumentsPage.tsx` | **Сессия 1.16**
310. [P2] [STUB] **DocumentContainerDetailPage — mock revisions/transmittals**: вкладки используют пустые массивы вместо API | `frontend/src/modules/cde/DocumentContainerDetailPage.tsx` | **Сессия 1.16**
311. [P2] [DATA] **Integration1C encryptedPassword — шифрование NOT IMPLEMENTED**: пароль 1С хранится в открытом виде | `integration1c/domain/Integration1cConfig.java` | **Сессия 1.16**
312. [P2] [DATA] **EdoService.generateUpdXml() — buyer INN hardcoded "0000000000"**: Invoice не содержит buyer INN/KPP → невалидный УПД XML | `edo/service/EdoService.java` | **Сессия 1.16**
313. [P2] [SECURITY] **DataExchange ImportJob/ExportJob — НЕТ organizationId**: entities без tenant isolation | `dataExchange/domain/ImportJob.java`, `dataExchange/domain/ExportJob.java` | **Сессия 1.16**
314. [P2] [API] **Integration1C frontend↔backend path mismatch**: frontend /integration-1c/* vs backend /api/integrations/1c/* — 30+ endpoints | `frontend/src/api/integration1c.ts` vs `integration/web/OneCController.java` | **Сессия 1.16**
315. [P2] [DATA] **JSONB fields inconsistency**: HiddenWorkAct.photoIds, CDE metadata/tags — без @JdbcTypeCode(SqlTypes.JSON) | Multiple PTO/CDE entities | **Сессия 1.16**
316. [P3] [STUB] **ItdValidationPage — hardcoded demo data**: валидация ИД использует встроенный образец АОСР | `frontend/src/modules/pto/ItdValidationPage.tsx` | **Сессия 1.16**
317. [P3] [CODE] **Integration1cMapper — String concatenation XML**: уязвимость к XML injection, нет template engine | `integration1c/service/Integration1cMapper.java` | **Сессия 1.16**
318. [P3] [PERF] **ChekkaService in-memory cache — no eviction**: ConcurrentHashMap без max size → memory leak при 100K+ lookups | `infrastructure/dadata/ChekkaService.java` | **Сессия 1.16**
319. [P3] [DATA] **PTO codes globally unique**: DOC-/WP-/ACT- уникальны через все организации. Collision risk multi-tenant | `pto/domain/PtoDocument.java:code UNIQUE`, `WorkPermit.java:code UNIQUE` | **Сессия 1.16**
320. [P3] [UX] **DrawingViewerPage — no real PDF rendering**: SVG canvas без PDF.js, не показывает реальный документ | `frontend/src/modules/documents/DrawingViewerPage.tsx` | **Сессия 1.16**
321. [P3] [UX] **HiddenWorkAct — нет multi-party signature workflow**: нет последовательного подписания (подрядчик→проектировщик→заказчик) | `frontend/src/modules/pto/HiddenWorkActFormPage.tsx` | **Сессия 1.16**
322. [P3] [ARCH] **Duplicate EDO modules**: russianDoc.EdoService + edo.EdoService — два модуля для одного домена | `modules/russianDoc/`, `modules/edo/` | **Сессия 1.16**
323. [P3] [TEST] **0 frontend тестов** для 37+ страниц documents/cde/pto/dataExchange/integration1c | Все frontend модули | **Сессия 1.16**
324. [P3] [UX] **Pagination size:200 hardcoded** на document/import/export list pages — OOM при тысячах записей | Multiple list pages | **Сессия 1.16**
325. [P3] [UX] **DocumentFormPage file upload — no client-side type check**: accepts any file type | `frontend/src/modules/documents/DocumentFormPage.tsx` | **Сессия 1.16**
326. [P3] [STUB] **Ks6CalendarPage — demo calendar**: client-side без реальных API данных | `frontend/src/modules/pto/Ks6CalendarPage.tsx` | **Сессия 1.16**
327. [P3] [ARCH] **CDE — only 1/7 entities has @Filter**: ArchivePolicy единственный с tenant isolation из 7 CDE entities | CDE module | **Сессия 1.16**

### Portal Module (Сессия 1.17)

258. [P1] [SECURITY] **SQL INJECTION в PortalDataProxyController** — 7 мест строковой конкатенации user input в SQL: status, projectId params конкатенируются через `" AND c.status = '" + status + "'"`. Полная компрометация данных | `PortalDataProxyController.java:97,134,267,268,299,300,421` | **Сессия 1.17**
259. [P1] [SECURITY] **portalUserId передаётся как @RequestParam (client-controlled)** — 8+ endpoints принимают portalUserId из query string вместо JWT. Attacker может подставить UUID жертвы и получить все её данные. Identity spoofing | `PortalKs2DraftController:45`, `PortalProjectController:38`, `PortalDocumentController:41`, `PortalTaskController:45`, `ClientPortalEnhancedController:55` | **Сессия 1.17**
260. [P1] [SECURITY] **IDOR — getById без ownership check в 4 сервисах**: PortalKs2DraftService.getById(), ClientClaimService.getClaim(), PortalTaskService.getById(), ClientPortalService.signDocument() — перебор UUID → доступ к ресурсам любого тенанта | `PortalKs2DraftService.java:54-57`, `ClientClaimService.java:90-95`, `PortalTaskService.java:48-51`, `ClientPortalService.java:152-175` | **Сессия 1.17**
261. [P1] [SECURITY] **PortalAdminController — cross-tenant user management**: GET /users, GET /users/{id}, PATCH /users/{id}/status — все БЕЗ organizationId filter. Admin Org A видит и блокирует пользователей Org B | `PortalAdminController.java:48-91` | **Сессия 1.17**
262. [P1] [SECURITY] **PortalMessage entity — НЕТ organizationId**: Нет @Filter tenantFilter. getInbox/getOutbox/getThread без org check. send() без sender validation → message spoofing + cross-tenant leakage | `PortalMessage.java`, `PortalMessageService.java:17-91` | **Сессия 1.17**
263. [P1] [SECURITY] **PortalProject entity — НЕТ organizationId**: grantAccess() не проверяет что granter и portal user в одной org → cross-org privilege escalation | `PortalProject.java`, `PortalProjectService.java:59-95` | **Сессия 1.17**
264. [P1] [SECURITY] **PortalDocument entity — НЕТ organizationId**: document sharing не ограничен границами организации | `PortalDocument.java`, `PortalDocumentService.java:51-73` | **Сессия 1.17**
265. [P1] [DATA] **ClientClaimService.getClaimsForPortalUser() — cross-tenant leak**: findByReportedByPortalUserIdAndDeletedFalse() без organizationId filter | `ClientClaimService.java:362-366` | **Сессия 1.17**
266. [P1] [SECURITY] **PortalAuthService — blocked user login**: Status check после passwordEncoder.matches() → timing attack + потенциальный JWT для заблокированного аккаунта | `PortalAuthService.java:70-97` | **Сессия 1.17**
267. [P1] [CALC] **SLA calculation error в ClientClaimService**: при triage SLA пересчитывается от now() вместо createdAt → SLA «усыхает» если priority повышена | `ClientClaimService.java:59,134` | **Сессия 1.17**

291. [P2] [ROUTE] **5 portal pages БЕЗ маршрутов**: PortalDailyReportsPage, PortalDefectsPage, PortalPhotoReportsPage, PortalRfiPage, PortalSignaturesPage — есть компоненты, нет routes → 404 | `routes/portfolioRoutes.tsx` | **Сессия 1.17**
292. [P2] [BUG] **PortalProjectListPage навигация на internal route**: `navigate('/projects/${id}')` вместо `/portal/projects/${id}` → portal user попадает на internal page | `PortalProjectListPage.tsx:126` | **Сессия 1.17**
293. [P2] [SECURITY] **PortalDataProxyController getAccessibleProjectIds() cross-org**: для internal users возвращает ВСЕ проекты организации без access check | `PortalDataProxyController.java:46-72` | **Сессия 1.17**
294. [P2] [SECURITY] **PortalKs2DraftService.review() — нет org validation**: Admin Org A может approve/reject КС-2 drafts Org B | `PortalKs2DraftService.java:151-178` | **Сессия 1.17**
295. [P2] [SECURITY] **PortalTaskController.updateStatus() — nullable portalUserId bypass**: ownership check skipped if portalUserId is null | `PortalTaskService.java:78-84` | **Сессия 1.17**
296. [P2] [SECURITY] **PortalMessageService — sender spoofing**: fromPortalUserId/fromInternalUserId из request body без validation что sender = authenticated user | `PortalMessageService.java:27-44` | **Сессия 1.17**
297. [P2] [SECURITY] **PortalAuthController.login — нет rate limiting**: нет account lockout, progressive delay, CAPTCHA | `PortalAuthController.java:38-44` | **Сессия 1.17**
298. [P2] [SECURITY] **ClientClaimController.dashboard — нет @PreAuthorize**: GET /api/portal/claims/dashboard без role check | `ClientClaimController.java:144-150` | **Сессия 1.17**
299. [P2] [UX] **Pagination отсутствует на всех portal pages**: hardcoded size: 5/200, нет UI кнопок prev/next | All portal list pages | **Сессия 1.17**
300. [P2] [PERF] **ClientPortalService — N+1 snapshot queries**: findLatestPublishedByProjectId() вызывается 3 раза подряд | `ClientPortalService.java:337-340,356,361` | **Сессия 1.17**
301. [P2] [CALC] **ClientPortalService financial summary — нет НДС**: dashboard без VAT breakdown, обязательного для КС-2 | `ClientPortalService.java:368-377` | **Сессия 1.17**
302. [P2] [DATA] **PortalSettingsPage/BrandingPage — localStorage only**: нет backend API для persist настроек | `PortalSettingsPage.tsx`, `PortalBrandingPage.tsx` | **Сессия 1.17**
303. [P2] [DATA] **PortalDashboardPage — hardcoded activeUsers: 8**: fallback показывает фейковое число пользователей | `PortalDashboardPage.tsx:47` | **Сессия 1.17**
304. [P2] [BUG] **Portal photo upload не работает**: нет proper FormData + multipart construction | `api/portal.ts:~266` | **Сессия 1.17**
305. [P2] [UX] **PortalDailyReportsPage — нет валидации числовых полей**: parseInt/parseFloat без error handling, нет min/max | `PortalDailyReportsPage.tsx:227,229` | **Сессия 1.17**
306. [P2] [BUG] **PortalPhotoReportsPage — category mismatch**: QUALITY пропущен в CATEGORIES array, но есть в типах | `PortalPhotoReportsPage.tsx:33` | **Сессия 1.17**

291. [P3] [ARCH] **PortalDataProxyController — raw SQL в контроллере** ~450 LOC бизнес-логики без service layer | `PortalDataProxyController.java` | **Сессия 1.17**
292. [P3] [PERF] **Column definitions не мемоизированы** на portal list pages | All portal pages | **Сессия 1.17**
293. [P3] [UX] **PortalMessageListPage — reply to self possible** | `PortalMessageListPage.tsx` | **Сессия 1.17**
294. [P3] [CODE] **PortalDefectsPage — unsafe type cast** Partial<PortalDefect> | `PortalDefectsPage.tsx:234` | **Сессия 1.17**
295. [P3] [UX] **PortalSchedulePage — timeline rendering без i18n** для дат | `PortalSchedulePage.tsx:23` | **Сессия 1.17**
296. [P3] [DATA] **PortalDocumentService — infinite-access documents** expiresAt=null | `PortalDocumentService.java:26-28` | **Сессия 1.17**
297. [P3] [CODE] **PortalKs2DraftService — race condition в status transitions** no pessimistic lock | `PortalKs2DraftService.java:136-138` | **Сессия 1.17**
298. [P3] [UX] **PortalInvoicesPage — missing status filter** в create modal | `PortalInvoicesPage.tsx:69-77` | **Сессия 1.17**
299. [P3] [UX] **PortalSettingsPage — dark mode color input** без dark variant | `PortalSettingsPage.tsx:243` | **Сессия 1.17**
300. [P3] [UX] **PortalAdminPage — no email/phone validation** | `PortalAdminPage.tsx:279,196` | **Сессия 1.17**
301. [P3] [STUB] **PortalAuthService — forgotPassword/resetPassword = placeholder** | `PortalAuthService.java` | **Сессия 1.17**
302. [P3] [UX] **PortalSignaturesPage — нет document preview** перед подписанием | `PortalSignaturesPage.tsx` | **Сессия 1.17**

### BIM Module (Сессия 1.18)

268. [P1] [SECURITY] **11 BIM entities БЕЗ organizationId** — BimModel, BimElement, BimClash, BimVersion, BimViewer, DesignPackage, DesignDrawing, DrawingAnnotation, PhotoProgress, PhotoComparison, PhotoAlbum — cross-tenant data access | `modules/bim/domain/*.java` (V32 migration) | **Сессия 1.18**
269. [P1] [SECURITY] **BimModelService.listModels() — findByDeletedFalse()** возвращает модели ВСЕХ организаций без org filter | `BimModelService.java:34` | **Сессия 1.18**
270. [P1] [SECURITY] **9 BIM сервисов без SecurityUtils** — BimModel, BimElement, BimClash, DesignPackage, DesignDrawing, DrawingAnnotation, PhotoProgress, PhotoComparison, PhotoAlbum — нет tenant validation | `modules/bim/service/*.java` | **Сессия 1.18**
271. [P1] [FAKE] **simulateClashDetection() — FAKE** — генерирует Random clashes, пишет синтетические данные в production DB, не IFC-анализ | `BimClashDetectionService.java:374-438` | **Сессия 1.18**
272. [P1] [BUG] **3 frontend pages вызывают несуществующие backend endpoints** — ConstructionProgress (/bim/construction-progress), PropertySets (/bim/property-sets), BcfTopics (/bim/bcf-topics) → 404 | `api/bim.ts:232,240,248` | **Сессия 1.18**

307. [P2] [SECURITY] **32 GET endpoints без @PreAuthorize** в 11 BIM controllers | `modules/bim/web/*Controller.java` | **Сессия 1.18**
308. [P2] [BUG] **10+ API path/method mismatches** frontend↔backend — clashes/detect≠clash-detection/tests/run, clash-results≠tests/{id}/results, defect-heatmap≠defect-links/heatmap/{id}, approve POST≠PATCH | `api/bim.ts` vs `web/*Controller.java` | **Сессия 1.18**
309. [P2] [MOCK] **DrawingOverlayComparisonPage — 100% mock** — MOCK_DRAWINGS, MOCK_REVISIONS, deterministic canvas, нет API | `DrawingOverlayComparisonPage.tsx:44-198` | **Сессия 1.18**
310. [P2] [MOCK] **DrawingPinsPage — 100% mock** — MOCK_DRAWINGS, MOCK_PINS (6 hardcoded), SVG floor plan, нет API | `DrawingPinsPage.tsx:19-170` | **Сессия 1.18**
311. [P2] [BUG] **BimModelDetailPage — clashSummary hardcoded empty** — `{ total: 0, critical: 0 }`, linkedPackages: [] — никогда не fetched | `BimModelDetailPage.tsx:129-130` | **Сессия 1.18**
312. [P2] [BUG] **uploadModel sends multipart/form-data** — backend CreateBimModelRequest ожидает JSON | `api/bim.ts:108-118` vs `BimModelController.java` | **Сессия 1.18**
313. [P2] [BUG] **Frontend status enums ≠ Backend** — Model (ACTIVE/PROCESSING/REVIEW vs DRAFT/IMPORTED/PROCESSED/LINKED), Clash severity (MAJOR/MINOR/INFO vs LOW/MEDIUM/HIGH), Format (DGN vs SKP) | `api/bim.ts` vs `domain/*.java` | **Сессия 1.18**
314. [P2] [BUG] **Cross-linking endpoints не существуют** — /bim/clashes/linked, /bim/clashes/{id}/linked-items → 404 | `api/bim.ts:192-211` | **Сессия 1.18**
315. [P2] [STUB] **ClashDetectionPage "Run Check"** — кнопка показывает toast, не вызывает bimApi.runClashDetection() | `ClashDetectionPage.tsx:144` | **Сессия 1.18**
316. [P2] [BUG] **DesignPackage reject — нет backend** — frontend POST /design-packages/{id}/reject → 405 | `api/bim.ts:156` vs `DesignPackageController.java` | **Сессия 1.18**
317. [P2] [ARCH] **Двойная clash система** — BimClash (old, no tenant) + BimClashTest/Result (new, with tenant) — дублирование и конфликт | `domain/BimClash.java` + `domain/BimClashTest.java` | **Сессия 1.18**
318. [P2] [SECURITY] **BimVersion, BimViewer entities** — нет org_id, нет @Filter, data leaks | `domain/BimVersion.java`, `domain/BimViewer.java` | **Сессия 1.18**

303. [P3] [STUB] **BcfIssuesPage Import/Export — toast-заглушки** | `BcfIssuesPage.tsx:288,295` | **Сессия 1.18**
304. [P3] [STUB] **PropertySetsPage CSV export — toast-заглушка** | `PropertySetsPage.tsx:103` | **Сессия 1.18**
305. [P3] [STUB] **BimModelDetailPage Edit/NewVersion — toast-заглушки** | `BimModelDetailPage.tsx:174,180` | **Сессия 1.18**
306. [P3] [PERF] **N+1 в getClashSummary()** — 4 count queries per test × N tests | `BimClashDetectionService.java:248-257` | **Сессия 1.18**
307. [P3] [PERF] **importElementMetadata — O(n) saves** — нет batch, save в цикле | `BimClashDetectionService.java:324-341` | **Сессия 1.18**
308. [P3] [TEST] **0 frontend тестов** для BIM модуля (13 pages, 0 tests) | `frontend/src/modules/bim/` | **Сессия 1.18**
309. [P3] [TEST] **Только 3 backend теста** — нет тестов для 8 сервисов (BimClashDetection, BimDefectLink, BimElement, DesignDrawing, DrawingAnnotation, PhotoProgress, PhotoComparison, PhotoAlbum) | `backend/src/test/` | **Сессия 1.18**
310. [P3] [BUG] **BimModel.fileUrl — нет валидации** — принимает произвольные строки, path traversal risk | `BimModelService.java:51` | **Сессия 1.18**
311. [P3] [BUG] **Clash severity mismatch** — frontend CRITICAL/MAJOR/MINOR/INFO ≠ backend LOW/MEDIUM/HIGH/CRITICAL | `types.ts` vs `ClashSeverity.java` | **Сессия 1.18**
312. [P3] [BUG] **No file size limit** для BIM model upload — IFC может быть гигабайты, потенциальный DoS | `BimModelController.java` | **Сессия 1.18**
313. [P3] [BUG] **PhotoProgress — нет геопривязка валидации** — latitude/longitude принимает любые значения | `domain/PhotoProgress.java` | **Сессия 1.18**

### Design Module (Сессия 1.20)

314. [P1] [SECURITY] **3 design entities БЕЗ organizationId** — DesignVersion, DesignReview, DesignSection: нет org_id, нет @Filter. Полная cross-tenant утечка проектной документации | `DesignVersion.java`, `DesignReview.java`, `DesignSection.java`, `V70:135-237` | **Сессия 1.20**
315. [P1] [DATA] **Frontend↔Backend field mismatch** — frontend types ожидают 15+ полей (number, sectionName, authorName, projectName, reviewCount, markupCount, versionCount, leadDesignerName, latestVersion и др.) которых НЕТ в backend DTO. Все list pages показывают undefined, поиск crash на .toLowerCase() | `frontend/modules/design/types.ts` vs `dto/DesignVersionResponse.java` | **Сессия 1.20**
316. [P1] [API] **updateVersionStatus → PATCH /status — endpoint НЕ СУЩЕСТВУЕТ** в backend. Backend имеет только POST submit-for-review/approve/supersede/archive. DesignVersionFormPage update → 405 Method Not Allowed | `frontend/src/api/design.ts:47-49` vs `DesignController.java` | **Сессия 1.20**
317. [P1] [STUB] **DesignReviewBoardPage = 100% mock** — `useState<DrCard[]>([])`, нет API calls, доска всегда пустая. HTML5 DnD (не @dnd-kit) — мобильные сломаны | `frontend/modules/design/DesignReviewBoardPage.tsx:41` | **Сессия 1.20**
318. [P1] [API] **DesignSectionListPage вызывает getSections() БЕЗ projectId** — backend @RequestParam UUID projectId обязателен → 400 Bad Request, страница не загружается | `DesignSectionListPage.tsx:40-43` vs `DesignController.java:200` | **Сессия 1.20**
319. [P2] [DATA] **DesignVersionStatus REJECTED в frontend — НЕТ в backend** — enum, DB CHECK constraint и status machine не имеют REJECTED. Фильтр/метрика "Отклонено" всегда пустые | `types.ts:1` vs `DesignVersionStatus.java` | **Сессия 1.20**
320. [P2] [DATA] **DesignReviewStatus IN_PROGRESS в frontend — НЕТ в backend** — backend enum: PENDING, APPROVED, REJECTED, REVISION_REQUESTED. Таб "В работе" всегда пуст | `types.ts:24` vs `DesignReviewStatus.java` | **Сессия 1.20**
321. [P2] [ARCH] **Duplicate API files** — `src/api/design.ts` (87 LOC, используется pages) и `src/modules/design/api.ts` (188 LOC, более полная). Pages импортируют НЕПРАВИЛЬНУЮ версию с PATCH /status | `frontend/src/api/design.ts` vs `frontend/src/modules/design/api.ts` | **Сессия 1.20**
322. [P2] [STUB] **DesignVersionFormPage sections hardcoded** — sectionOptions = 'sec1'...'sec7' строки вместо UUID из API. Невалидный sectionId при создании | `DesignVersionFormPage.tsx:29-37` | **Сессия 1.20**
323. [P2] [DATA] **DesignVersionFormPage update ТОЛЬКО меняет статус** — мутация игнорирует title, description, version и др. Изменения полей теряются | `DesignVersionFormPage.tsx:106-119` | **Сессия 1.20**
324. [P2] [SECURITY] **8 GET endpoints без @PreAuthorize** — /versions, /versions/{id}, /versions/by-document/{documentId}, /reviews, /versions/{versionId}/reviews, /sections, /sections/root, /sections/{parentId}/children | `DesignController.java:50-219` | **Сессия 1.20**
325. [P2] [UX] **DesignReviewBoardPage — HTML5 DnD** не мигрирован на @dnd-kit (мобильные сломаны). 18-я доска, все 17 остальных мигрированы | `DesignReviewBoardPage.tsx:53-54` | **Сессия 1.20**
326. [P2] [DATA] **Board statuses не совпадают** — DRAFT/UNDER_REVIEW/APPROVED/REVISION_NEEDED ≠ ни DesignVersionStatus, ни DesignReviewStatus enums | `DesignReviewBoardPage.tsx:10` | **Сессия 1.20**
327. [P2] [DATA] **DesignVersionFormPage status enum mismatch** — schema enum 'REVIEW' ≠ backend 'IN_REVIEW'. DB CHECK constraint violation possible | `DesignVersionFormPage.tsx:21` | **Сессия 1.20**
328. [P2] [UX] **No detail pages** — клик по строке в 3 list pages навигирует на /design/versions/{id}, /reviews/{id}, /sections/{id} — routes не зарегистрированы → 404 | `DesignVersionListPage.tsx:177`, `DesignReviewPage.tsx:181`, `DesignSectionListPage.tsx:135` | **Сессия 1.20**
329. [P2] [DATA] **deleteSection не проверяет дочерние элементы** — soft-delete parent, но children остаются с dangling parentId | `DesignService.java:270-279` | **Сессия 1.20**
330. [P3] [ARCH] **CreateDesignVersionRequest для create И update** — @NotNull/@NotBlank конфликтует с partial update null-checks. Нужен отдельный UpdateRequest | `DesignService.java:97-113` | **Сессия 1.20**
331. [P3] [DATA] **DesignVersion.author = String** — свободный текст вместо FK на users. Нет referential integrity | `DesignVersion.java:49` | **Сессия 1.20**
332. [P3] [DATA] **DesignReview.reviewerName денормализация** — при смене ФИО данные навсегда рассинхронизируются | `DesignReview.java:39` | **Сессия 1.20**
333. [P3] [PERF] **Нет пагинации в getReviewsForVersion/getSectionsForProject** — List загружает всё в память | `DesignService.java:149,208` | **Сессия 1.20**
334. [P3] [SECURITY] **Нет routePermissions для design routes** — все роли включая VIEWER видят проектную документацию | `routePermissions.ts` | **Сессия 1.20**
335. [P3] [PERF] **Client-side filtering** — DesignVersionListPage загружает первые 20 записей, фильтрует client-side. При >20 версий фильтры неточные | `DesignVersionListPage.tsx:53-56` | **Сессия 1.20**
336. [P3] [LOGIC] **completeReview не автоматизирует version approval** — при ALL reviews APPROVED версия не переходит в APPROVED автоматически | `DesignService.java:182-201` | **Сессия 1.20**
337. [P3] [TEST] **0 frontend тестов** для design module (5 pages, 0 tests) | `frontend/src/modules/design/` | **Сессия 1.20**
338. [P3] [ARCH] **Дублирование с BIM module** — DesignPackage/DesignDrawing (bim) ≈ DesignVersion/DesignSection (design). Два модуля для одной задачи | `modules/bim/domain/DesignPackage.java` vs `modules/design/domain/DesignVersion.java` | **Сессия 1.20**

### Workflow + Approval (Сессия 1.19)

339. [P1] [SECURITY] **ApprovalStep approve/reject — ZERO ownership check**: findById без org/approver проверки. Любой user любого org может approve/reject любой step | `ApprovalService.java:98-143` | **Сессия 1.19**
340. [P1] [SECURITY] **ApprovalService.getChainById — cross-tenant**: findByIdAndDeletedFalse без org check | `ApprovalService.java:91-95` | **Сессия 1.19**
341. [P1] [SECURITY] **WorkflowDefinition CRUD — cross-tenant**: 6 методов без org check (findById, update, delete, toggle, getSteps, replaceSteps) | `WorkflowDefinitionService.java:50-153` | **Сессия 1.19**
342. [P1] [SECURITY] **AutomationExecution findAll без org filter**: ruleId=null → все executions всех org | `WorkflowDefinitionService.java:158-166` | **Сессия 1.19**
343. [P1] [SECURITY] **submitDecision — нет approver verification**: не проверяет caller = designated approver | `ApprovalInstanceService.java:192-290` | **Сессия 1.19**
344. [P1] [SECURITY] **getHistory — cross-tenant leak**: findByEntityIdAndEntityType без org filter | `ApprovalInstanceService.java:338-350` | **Сессия 1.19**
345. [P2] [ARCH] **2 конкурирующие системы согласования**: approval (Chain) + workflowEngine (Instance) | `modules/approval/` + `modules/workflowEngine/` | **Сессия 1.19**
346. [P2] [BUG] **WorkflowDefinitionService.findAll — фильтры игнорируются**: search, entityType, isActive не используются | `WorkflowDefinitionService.java:34-47` | **Сессия 1.19**
347. [P2] [BUG] **WorkflowDesignerPage edit mode не работает**: readOnly={!isNew}, onChange = undefined | `WorkflowDesignerPage.tsx:242-265` | **Сессия 1.19**
348. [P2] [BUG] **Delete step button — пустой handler** | `WorkflowDesignerPage.tsx:321-327` | **Сессия 1.19**
349. [P2] [BUG] **ApprovalInboxPage — hardcoded size 200, нет пагинации** | `ApprovalInboxPage.tsx:127-128` | **Сессия 1.19**
350. [P2] [BUG] **getPendingForUser — broken pagination**: in-memory filter → неверный totalElements | `ApprovalInstanceService.java:356-374` | **Сессия 1.19**
351. [P2] [PERF] **N+1 в getPendingForUser**: 4 queries per item (81 for 20 items) | `ApprovalInstanceService.java:365-372` | **Сессия 1.19**
352. [P2] [PERF] **N+1 в WorkflowDefinitionService.findAll**: loadAll steps per def for COUNT | `WorkflowDefinitionService.java:41-46` | **Сессия 1.19**
353. [P2] [i18n] **WorkflowDesignerPage hardcoded Russian roles** | `WorkflowDesignerPage.tsx:42-51` | **Сессия 1.19**
354. [P2] [i18n] **WorkflowStepDesigner hardcoded English roles** | `WorkflowStepDesigner.tsx:233-237` | **Сессия 1.19**
355. [P2] [BUG] **ApprovalController.getChains — inconsistent return type**: single vs list | `ApprovalController.java:34-46` | **Сессия 1.19**
356. [P2] [SECURITY] **5 GET endpoints без @PreAuthorize**: WorkflowDefinitionCtrl (3) + ApprovalCtrl (2) | `WorkflowDefinitionController.java`, `ApprovalController.java` | **Сессия 1.19**
357. [P3] [BUG] **ApprovalService cascade — только SPECIFICATION**: hardcoded, не generic | `ApprovalService.java:176-198` | **Сессия 1.19**
358. [P3] [BUG] **escalateOverdue — TODO notification**: ESCALATED статус, уведомления нет | `ApprovalInstanceService.java:473` | **Сессия 1.19**
359. [P3] [BUG] **ApprovalStep.isOverdue — никогда не обновляется**: нет scheduled job | `ApprovalStep.java:79-81` | **Сессия 1.19**
360. [P3] [BUG] **Duplicate workflow API files**: api/workflow.ts vs modules/workflow/api.ts | **Сессия 1.19**
361. [P3] [BUG] **stepsCount not returned**: вычисляется в toResponse но теряется | `WorkflowDefinitionService.java:170-182` | **Сессия 1.19**
362. [P3] [BUG] **SLA deadline ALL steps at creation**: шаги 2+ просрочены до активации | `ApprovalService.java:46-63` | **Сессия 1.19**
363. [P3] [ARCH] **ApprovalInstanceService — god class 620 LOC** | `ApprovalInstanceService.java` | **Сессия 1.19**
364. [P3] [ARCH] **ApprovalInboxPage — god component 868 LOC** | `ApprovalInboxPage.tsx` | **Сессия 1.19**
365. [P3] [CODE] **Hardcoded Russian in ApprovalInstanceService**: 6 error messages | `ApprovalInstanceService.java:132,140,149,199,302,398` | **Сессия 1.19**
366. [P3] [ARCH] **ApprovalService imports SpecificationRepository**: cross-module dep | `ApprovalService.java:13` | **Сессия 1.19**
367. [P3] [ARCH] **ConditionBuilder conditions не evaluated в backend** | `WorkflowStep.java:63` | **Сессия 1.19**
368. [P3] [ARCH] **AutoApprovalRule entity не evaluated**: no scheduler/evaluator | `AutoApprovalRule.java` | **Сессия 1.19**
369. [P3] [TEST] **0 тестов для workflow+approval**: ни frontend, ни backend | **Сессия 1.19**

### Leave + Payroll + SelfEmployed + Recruitment (Сессия 1.22)

370. [P3] [STUB] **LeaveBoardPage — 100% local state**: useState([]), нет API, данные теряются при refresh | `frontend/src/modules/leave/LeaveBoardPage.tsx` | **Сессия 1.22**
371. [P3] [STUB] **ApplicantBoardPage — 100% local state**: useState([]), HTML5 DnD (мобильные сломаны), нет API | `frontend/src/modules/recruitment/ApplicantBoardPage.tsx` | **Сессия 1.22**
372. [P3] [STUB] **SelfEmployed verifyNpd() — STUB**: всегда ACTIVE для любого 12-значного ИНН, нет ФНС API | `SelfEmployedService.java:509` | **Сессия 1.22**
373. [P3] [STUB] **SelfEmployed checkFiscalReceipt() — STUB**: ставит true без реальной ФНС проверки | `SelfEmployedService.java:273` | **Сессия 1.22**
374. [P3] [DATA] **SelfEmployed Contractor INN — global UNIQUE** через все организации | `V79__self_employed_tables.sql` | **Сессия 1.22**
375. [P3] [DATA] **V1171 PII widening inconsistent**: self_employed_workers расширен до TEXT, self_employed_contractors нет | `V1171__self_employed_pii_to_text.sql` | **Сессия 1.22**
376. [P3] [LOGIC] **Recruitment — нет interview overlap detection**: один interviewer на два собеседования одновременно | `RecruitmentService.java:scheduleInterview()` | **Сессия 1.22**
377. [P3] [API] **Payroll frontend↔backend type mismatch**: PIECE_RATE/MIXED vs PIECEWORK/BONUS/OVERTIME, 4 frontend fields не существуют в backend | `payroll/types.ts` vs `PayrollType.java` | **Сессия 1.22**
378. [P3] [API] **Recruitment frontend↔backend status enum mismatch**: SCREENING/INTERVIEW/OFFER vs INITIAL_QUALIFICATION/FIRST_INTERVIEW/SECOND_INTERVIEW | `recruitment/types.ts` vs `ApplicantStatus.java` | **Сессия 1.22**
379. [P3] [API] **Recruitment frontend↔backend API path mismatch**: `/positions` vs `/vacancies` + `/jobs` | `recruitment/api.ts` vs `RecruitmentController.java` | **Сессия 1.22**
380. [P3] [UX] **Leave — missing detail/form pages**: нет create/edit form для requests, allocations, types | `frontend/src/modules/leave/` | **Сессия 1.22**
381. [P3] [UX] **Recruitment — missing job position CRUD pages**: list only, нет detail/form | `frontend/src/modules/recruitment/` | **Сессия 1.22**
382. [P3] [ARCH] **SelfEmployedService — god class 675 LOC**: управляет 5 entity типами | `SelfEmployedService.java` | **Сессия 1.22**
383. [P3] [TEST] **0 тестов для payroll**: НДФЛ bracket boundaries, ОПС порог, overtime, night — НЕ ПОКРЫТЫ | **Сессия 1.22**
384. [P3] [TEST] **0 тестов для selfEmployed**: CompletionAct lifecycle, Registry generation, payment workflow | **Сессия 1.22**

### Sales: CRM + Portfolio + BidManagement (Сессия 1.23)

385. [P1] [SECURITY] **Дублирование BidPackage entity**: 2 JPA класса маппят `bid_packages` — Portfolio-версия БЕЗ @Filter/organizationId, BidManagement-версия С ними | `portfolio/domain/BidPackage.java:32`, `bidManagement/domain/BidPackage.java:32` | **Сессия 1.23**
386. [P1] [SECURITY] **BidInvitation — НЕТ organizationId, НЕТ @Filter**: IDOR через `findByIdAndDeletedFalse(invId)` — чужое приглашение обновляемо | `bidManagement/domain/BidInvitation.java:29`, `BidManagementService.java:151` | **Сессия 1.23**
387. [P1] [SECURITY] **BidEvaluation — НЕТ organizationId, НЕТ @Filter**: нет tenant isolation на entity level | `bidManagement/domain/BidEvaluation.java:27` | **Сессия 1.23**
388. [P1] [SECURITY] **BidManagement listPackages cross-tenant**: projectId != null → загружает ВСЕ пакеты проекта, фильтрует in-memory | `BidManagementService.java:55-61` | **Сессия 1.23**
389. [P2] [SECURITY] **14+ GET endpoints без @PreAuthorize** в CRM/BidManagement/Portfolio — коммерческая информация доступна всем | `CrmController.java`, `BidManagementController.java`, `PortfolioController.java` | **Сессия 1.23**
390. [P2] [STUB] **Opportunity activities = ЗАГЛУШКА**: `Collections.emptyList()` | `PortfolioController.java:99` | **Сессия 1.23**
391. [P2] [STUB] **ContractorRatingsPage — 100% mock**: `deriveRatings()` из hashCode ID | `ContractorRatingsPage.tsx:96-122` | **Сессия 1.23**
392. [P2] [STUB] **PDF export КП = пустой stub** | `CommercialProposalController.java:252-262` | **Сессия 1.23**
393. [P2] [PERF] **N+1 enrichLeadPage()**: loop COUNT per lead (20 leads = 20 queries) | `CrmService.java:567-573` | **Сессия 1.23**
394. [P2] [CODE] **Map<String,Object> вместо DTO** в 4 endpoints — NPE, нет @Valid | `PortfolioController.java:289`, `CommercialProposalController.java:191,242,279` | **Сессия 1.23**
395. [P2] [SECURITY] **TenderSubmission — НЕТ organizationId**: only chain check | `portfolio/domain/TenderSubmission.java:27` | **Сессия 1.23**
396. [P2] [SECURITY] **Portfolio BidPackage — НЕТ organizationId, НЕТ @Filter** | `portfolio/domain/BidPackage.java:32` | **Сессия 1.23**
397. [P3] [LOGIC] **BidPackageStatus — нет валидации переходов**: CLOSED→DRAFT разрешён | `BidManagementService.java:99` | **Сессия 1.23**
398. [P3] [LOGIC] **BidInvitationStatus — нет валидации переходов** | `BidManagementService.java:156-161` | **Сессия 1.23**
399. [P3] [DATA] **Opportunity.organizationId — nullable** | `portfolio/domain/Opportunity.java:39` | **Сессия 1.23**
400. [P3] [SECURITY] **updateInvitation — нет bidPackageId validation** | `BidManagementService.java:151` | **Сессия 1.23**
401. [P3] [VALID] **INN validation — нет контрольного разряда ФНС** | `CounterpartyFormPage.tsx`, backend нет | **Сессия 1.23**
402. [P3] [LOGIC] **Stage bypass через updateLead()**: setStageId без sequential validation | `CrmService.java:143-146` | **Сессия 1.23**
403. [P3] [API] **convertToCounterparty — нет REST endpoint** | `CrmService.java:274-307` | **Сессия 1.23**
404. [P3] [CALC] **assessMarginByAnalog — probability ≠ margin**: GO/NO_GO некорректно | `PortfolioService.java:599-641` | **Сессия 1.23**
405. [P3] [CODE] **createVersion() response — raw entity** вместо enriched | `CommercialProposalController.java:232-234` | **Сессия 1.23**
406. [P3] [UX] **CRM search — только 3 поля**: нет email, phone, source | `CrmLeadRepository.java` | **Сессия 1.23**
407. [P3] [TEST] **0 тестов BidManagementService** (277 LOC, leveling matrix, invitation workflow) | **Сессия 1.23**
408. [P3] [TEST] **0 тестов CounterpartyService** | **Сессия 1.23**

## Closeout + Maintenance Module (Сессия 1.25)

409. [P1] [SECURITY] **Maintenance — ZERO tenant isolation**: 5 entities (MaintenanceRequest, MaintenanceEquipment, PreventiveSchedule, MaintenanceTeam, MaintenanceStage) без organizationId, без @Filter. Все данные всех организаций видны всем. Dashboard агрегирует метрики cross-tenant | `modules/maintenance/domain/*.java`, `MaintenanceService.java` | **Сессия 1.25**
410. [P1] [SECURITY] **MaintenanceService — 0 вызовов SecurityUtils**: 24 метода (findAll, create, update, delete, getDashboard) не проверяют организацию. createRequest() не устанавливает orgId | `MaintenanceService.java:56-486` | **Сессия 1.25**
411. [P1] [SECURITY] **11 maintenance GET endpoints без @PreAuthorize**: requests, equipment, teams, stages, schedules, dashboard — всё доступно любому auth user | `MaintenanceController.java` | **Сессия 1.25**
412. [P1] [API] **6+ closeout frontend API paths НЕ совпадают с backend**: `/closeout/commissioning-items` → NO controller, `/closeout/stroynadzor-documents` → backend `/closeout/stroynadzor-package`, `/closeout/executive-schemas` → NO controller, `/closeout/warranty-records` → NO controller, `/commissioning-templates` → backend `/closeout/commissioning-enhanced/templates`, `/closeout/zos-documents` → backend `/closeout/commissioning-enhanced/zos`. Страницы → 404 | `api/closeout.ts:562-696` | **Сессия 1.25**
413. [P1] [DATA] **computeChecklistMetrics() — ФЕЙКОВЫЕ метрики**: при IN_PROGRESS fabricates completedItems=60%, при FAILED fabricates failedItems=20%. Frontend УГАДЫВАЕТ числа вместо реальных данных | `api/closeout.ts:145-191` | **Сессия 1.25**
414. [P2] [SECURITY] **StroynadzorPackageDocument — нет organizationId, нет @Filter**: дочерняя entity без tenant isolation | `StroynadzorPackageDocument.java` | **Сессия 1.25**
415. [P2] [SECURITY] **AsBuiltTrackerController — 10 endpoints без @PreAuthorize**: POST/PUT/DELETE для requirements и WBS links доступны VIEWER | `AsBuiltTrackerController.java` | **Сессия 1.25**
416. [P2] [i18n] **7 hardcoded русских строк в closeout API mapping**: 'Пользователь', 'Проект не указан', 'Не назначен', 'Контакт не указан', 'Организация не указана' | `api/closeout.ts:117-282` | **Сессия 1.25**
417. [P2] [UX] **MaintenanceBoardPage — 100% local state**: useState<MntCard[]>([]), данные не загружаются с API. Доска всегда пустая | `MaintenanceBoardPage.tsx:39` | **Сессия 1.25**
418. [P2] [UX] **CommissioningBoardPage — HTML5 DnD**: draggable/onDragStart/onDrop не работает на iOS/Android. Не мигрировано на @dnd-kit | `CommissioningBoardPage.tsx:135-168` | **Сессия 1.25**
419. [P2] [UX] **MaintenanceBoardPage — HTML5 DnD + пустая**: аналогичная проблема + нет данных | `MaintenanceBoardPage.tsx:52-54` | **Сессия 1.25**
420. [P2] [API] **Maintenance RequestStatus type mismatch**: frontend types.ts = NEW|IN_PROGRESS|REPAIRED|SCRAP|CANCELLED, api/maintenance.ts = NEW|ASSIGNED|IN_PROGRESS|ON_HOLD|COMPLETED|CANCELLED | `modules/maintenance/types.ts` vs `api/maintenance.ts` | **Сессия 1.25**
421. [P2] [BUG] **MaintenanceRequestFormPage edit mode broken**: updateRequest вызывает createRequest() (не PUT) | `MaintenanceRequestFormPage.tsx` | **Сессия 1.25**
422. [P2] [UX] **Нет detail pages для maintenance**: /maintenance/requests/{id} и /maintenance/equipment/{id} — 404 | `operationsRoutes.tsx` | **Сессия 1.25**
423. [P2] [BUG] **MaintenanceBoardPage card click → list**: onClick → /maintenance/requests (list) вместо /{id} (detail) | `MaintenanceBoardPage.tsx:82` | **Сессия 1.25**
424. [P2] [DATA] **Maintenance equipment form — 6 hardcoded options**: Crane/Excavator/Pump/Compressor/Generator/Welder вместо dynamic list | `MaintenanceRequestFormPage.tsx` | **Сессия 1.25**
425. [P3] [ARCH] **MaintenanceService god-class**: 522 LOC, 5 sub-domains (requests, equipment, teams, stages, schedules) | `MaintenanceService.java` | **Сессия 1.25**
426. [P3] [UX] **CommissioningChecklistPage 7 hardcoded sections**: structural/mep/fire_safety/elevators/landscaping/accessibility/documentation — не настраиваемо | `CommissioningChecklistPage.tsx:48-56` | **Сессия 1.25**
427. [P3] [API] **closeoutApi.getAsBuiltProgress() path mismatch**: frontend `/closeout/as-built/{projectId}/progress` vs backend `/closeout/as-built/progress/{projectId}` | `api/closeout.ts:484-486` | **Сессия 1.25**
428. [P3] [UX] **WarrantyClaimDetailPage — нет workflow buttons**: нельзя сменить статус с detail page | `WarrantyClaimDetailPage.tsx` | **Сессия 1.25**
429. [P3] [PERF] **CommissioningBoardPage size: 300 hardcoded**: нет виртуализации для большого количества карточек | `CommissioningBoardPage.tsx:83` | **Сессия 1.25**
430. [P3] [TEST] **0 тестов StroynadzorPackageService**: самый сложный сервис (BFS, 5-source aggregation, TOC) без тестов | `StroynadzorPackageService.java` | **Сессия 1.25**
431. [P3] [TEST] **0 тестов AsBuiltTrackerService**: quality gate, WBS progress не покрыты | `AsBuiltTrackerService.java` | **Сессия 1.25**
432. [P3] [TEST] **0 frontend тестов** для closeout (22 pages) и maintenance (6 pages) | **Сессия 1.25**
433. [P3] [UX] **HandoverPackageDetailPage — минимальная информация**: нет списка документов, только count | `HandoverPackageDetailPage.tsx` | **Сессия 1.25**
434. [P3] [UX] **WarrantyObligationListPage — нет link to claims**: не показывает связанные рекламации | `WarrantyObligationListPage.tsx` | **Сессия 1.25**
435. [P3] [ARCH] **Duplicate maintenance API layer**: api/maintenance.ts + modules/maintenance/api.ts с разными типами | **Сессия 1.25**

### Сессия 1.26 — legal + mail + messenger + ai + help

436. [P1] [SECURITY] **EmailMessage НЕТ organizationId** — единый mailbox (office@privod-electro.ru) без tenant isolation. Все тенанты видят всю переписку в multi-tenant SaaS | `EmailMessage.java` | **Сессия 1.26**
437. [P1] [SECURITY] **AI IDOR: resolveConversation() без userId check** — `findByIdAndDeletedFalse(conversationId)` без проверки что диалог принадлежит текущему user. Любой auth user может прочитать чужие AI-диалоги | `AiAssistantService.java:255-277` | **Сессия 1.26**

## P2 (legal + mail + messenger + ai + help) — Сессия 1.26

438. [P2] [SECURITY] **7 GET endpoints без @PreAuthorize** в LegalController — дела, решения, замечания, шаблоны, дашборд | `LegalController.java:52,65,99,109,146,184,224` | **Сессия 1.26**
439. [P2] [SECURITY] **10 GET endpoints без @PreAuthorize** в MessagingController — каналы, сообщения, реакции, пользователи | `MessagingController.java:50,63,138,144,150,177,196,202,256,264` | **Сессия 1.26**
440. [P2] [SECURITY] **pinMessage/unpinMessage нет role check** — любой участник канала может pin/unpin | `MessagingService.java:382-413` | **Сессия 1.26**
441. [P2] [SECURITY] Email attachment storage на filesystem без size limit — DoS vector, нет virus scanning | `EmailSyncService.java:41` | **Сессия 1.26**
442. [P2] [PERF] AI `Executors.newCachedThreadPool()` — unbounded thread pool для SSE streaming, DoS при concurrent chats | `AiAssistantService.java:64` | **Сессия 1.26**
443. [P2] [CALC] AI token count=0 при SSE streaming — usage analytics занижены, cost tracking неточный | `AiAssistantService.java:220,230` | **Сессия 1.26**
444. [P2] [ARCH] Backend KB API и frontend static JSON не синхронизированы — два параллельных хранилища статей | архитектурный | **Сессия 1.26**
445. [P2] [DATA] `base-url: http://localhost:3000` в email config — ссылки в production emails ведут на localhost | `application.yml → app.email.base-url` | **Сессия 1.26**

## P3 (legal + mail + messenger + ai + help) — Сессия 1.26

446. [P3] [SECURITY] Legal includeConfidential param без RBAC role check — PROJECT_MANAGER видит конфиденциальные замечания юриста | `LegalController.java:150` | **Сессия 1.26**
447. [P3] [UX] LegalCaseResponse не подтягивает имена lawyer/responsible из User (только UUID) | `LegalCaseResponse.java` | **Сессия 1.26**
448. [P3] [DATA] Нет retry для failed email notifications — QUEUED→FAILED без повторной отправки | `EmailNotificationService.java` | **Сессия 1.26**
449. [P3] [PERF] Messenger messages limit=200 hardcoded — при долгом чате старые сообщения не подгружаются | `MessagingService.java:199` | **Сессия 1.26**
450. [P3] [PERF] getOrganizationUsers() in-memory search с cap 100 users — не масштабируется | `MessagingService.java:640` | **Сессия 1.26**
451. [P3] [DATA] Channel code race condition при concurrent create | `MessagingService.java:138` | **Сессия 1.26**
452. [P3] [STUB] AI photo analysis = 100% frontend mock — `analyzePhotoWithSimulation()` random findings | `frontend/src/api/ai.ts` | **Сессия 1.26**
453. [P3] [STUB] AI risk predictions = 100% frontend mock с hardcoded factors | `frontend/src/api/ai.ts` | **Сессия 1.26**
454. [P3] [CONFIG] AI systemPrompt = "" по умолчанию — AI без контекста о PRIVOD | `AiProperties.java` | **Сессия 1.26**
455. [P3] [UX] HelpCenterPage 21 hardcoded статья — дублирует static KB, не обновляется | `HelpCenterPage.tsx` | **Сессия 1.26**
456. [P3] [UX] KnowledgeBaseCategoryPage :categoryId param mismatch с helpMap slug-ами | `KnowledgeBaseCategoryPage.tsx` | **Сессия 1.26**
457. [P3] [DATA] AiConversation создаётся без organizationId — usage analytics не привязаны к tenant | `AiAssistantService.java:267-274` | **Сессия 1.26**

## Admin + Settings + Subscription + Monitoring Module (Сессия 1.24)

458. [P1] [MONITORING] **HealthCheckService — 5/6 компонентов hardcoded HEALTHY**: Redis, MinIO, WebSocket, API Gateway, Worker — все возвращают HEALTHY без реальной проверки. Оператор не узнает о сбоях | `modules/monitoring/service/HealthCheckService.java:53-58` | **Сессия 1.24**
459. [P1] [DATA] **BackupService — бэкапы СИМУЛИРУЮТСЯ**: status=COMPLETED + sizeBytes=0 мгновенно. pg_dump НЕ запускается. При потере БД — потеря всех данных | `modules/monitoring/service/BackupService.java:45-50` | **Сессия 1.24**
460. [P1] [SECURITY] **PaymentController webhook — HMAC verification OPTIONAL**: если YOOKASSA_WEBHOOK_SECRET не задан, любой может POST /api/payments/webhook/yookassa → бесплатная активация подписки | `modules/subscription/web/PaymentController.java:165-169` + `infrastructure/security/SecurityConfig.java:59` | **Сессия 1.24**
461. [P2] [MONITORING] **AdminDashboardService — systemHealthy hardcoded true**: Dashboard KPI "Система здорова" всегда зелёный независимо от реального состояния | `modules/admin/service/AdminDashboardService.java:67` | **Сессия 1.24**
462. [P2] [SECURITY] **PaymentController refund — нет org-scoping**: ADMIN может refund чужой платёж по paymentId без проверки organizationId | `modules/subscription/web/PaymentController.java:356-379` | **Сессия 1.24**
463. [P2] [DATA] **YooKassaService — NPE при отсутствии конфигурации**: isConfigured()=false → return null → NPE в PaymentController.createPayment() | `modules/subscription/service/YooKassaService.java:54-57` | **Сессия 1.24**
464. [P2] [DATA] **RoskomnadzorPage — localStorage only**: 152-ФЗ compliance checklist НЕ сохраняется на сервере. Смена браузера = потеря данных | `frontend/src/modules/admin/RoskomnadzorPage.tsx` | **Сессия 1.24**
465. [P2] [i18n] **RoskomnadzorPage — hardcoded Russian strings**: "Уведомление в Роскомнадзор", "Справочная информация" и др. не через t() | `frontend/src/modules/admin/RoskomnadzorPage.tsx:116-152` | **Сессия 1.24**
466. [P2] [DATA] **TenantManagementService — storageUsedMb hardcoded 0**: квота хранилища никогда не считается, тенант может загрузить неограниченный объём | `modules/admin/service/TenantManagementService.java:116` | **Сессия 1.24**
467. [P3] [API] **Frontend admin.ts — health check через бизнес-API**: использует /users, /projects, /documents вместо /actuator/health → ложные индикаторы | `frontend/src/api/admin.ts:174-214` | **Сессия 1.24**
468. [P3] [UX] **ProfilePage — avatar upload placeholder**: кнопка "Загрузить аватар" ничего не делает | `frontend/src/modules/settings/ProfilePage.tsx` | **Сессия 1.24**
469. [P3] [SECURITY] **SecuritySettingsPage — critical toggles без re-auth**: отключение 2FA, изменение таймаута сессии без повторной аутентификации | `frontend/src/modules/admin/SecuritySettingsPage.tsx` | **Сессия 1.24**
470. [P3] [LOGIC] **SubscriptionService — Integer.MAX_VALUE для unlimited**: Free plan с maxUsers=null → quota check всегда проходит | `modules/subscription/service/SubscriptionService.java:166-175` | **Сессия 1.24**
471. [P3] [LOGIC] **SubscriptionService — auto-creates FREE trial**: любая org автоматически получает trial без sign-up | `modules/subscription/service/SubscriptionService.java:60-65` | **Сессия 1.24**
472. [P3] [LOGIC] **FeatureFlagService — no tenant scope**: флаги не разделены по tenant → флаг для tenant A также виден tenant B | `modules/settings/service/FeatureFlagService.java:87` | **Сессия 1.24**
473. [P3] [DATA] **NotificationService — потеря уведомлений**: при userId lookup failure — notification dropped без retry/fallback | `modules/notification/service/NotificationService.java:173-178` | **Сессия 1.24**
474. [P3] [DATA] **TenantManagementService.getTenantDetail — NPE на пустых audit logs**: новый тенант без логинов → EmptyResultDataAccessException → crash | `modules/admin/service/TenantManagementService.java:82-92` | **Сессия 1.24**
475. [P3] [TEST] **0 тестов SubscriptionService** (quota check, plan change, trial creation) | **Сессия 1.24**
476. [P3] [TEST] **0 тестов PaymentController** (webhook processing, refund, bank invoice) | **Сессия 1.24**
477. [P3] [TEST] **0 тестов TenantManagementService** (tenant CRUD, plan assignment) | **Сессия 1.24**
478. [P3] [TEST] **0 тестов FeatureFlagService** (rollout %, date scheduling, tenant scope) | **Сессия 1.24**

## P4 — Low (мелочи, косметика)

1. [P4] [CODE] N+1 batch resolution паттерн дублируется в BudgetService, ProjectService, DefectService | Multiple files
2. [P4] [CODE] client.ts — auth/redirect logic повторяется 5 раз (можно извлечь в helper) | `frontend/src/api/client.ts:106-115`
3. [P4] [CODE] DataTable CSV export не вызывает `t()` для заголовков — экспортирует raw keys | `frontend/src/design-system/components/DataTable/index.tsx:258`
4. [P4] [CODE] Swagger UI exposed by default (application-prod.yml отключает, но по умолчанию открыт) | `backend/src/main/resources/application.yml`
5. [P4] [LOGGING] com.privod DEBUG level в base config — verbose для production | `backend/src/main/resources/application.yml`
