# Backend Services Map

> **Total: 352 @Service classes across 94 modules**
> Generated: 2026-03-12

## Table of Contents

- [accounting](#accounting) (6 services)
- [admin](#admin) (3 services)
- [ai](#ai) (6 services)
- [analytics](#analytics) (10 services)
- [apiManagement](#apimanagement) (6 services)
- [approval](#approval) (1 services)
- [auth](#auth) (6 services)
- [bidManagement](#bidmanagement) (1 services)
- [bidScoring](#bidscoring) (1 services)
- [bim](#bim) (11 services)
- [calendar](#calendar) (4 services)
- [cde](#cde) (5 services)
- [changeManagement](#changemanagement) (4 services)
- [chatter](#chatter) (4 services)
- [closeout](#closeout) (6 services)
- [closing](#closing) (3 services)
- [common](#common) (1 services)
- [compliance](#compliance) (1 services)
- [constructability](#constructability) (1 services)
- [contract](#contract) (3 services)
- [contractExt](#contractext) (6 services)
- [costManagement](#costmanagement) (7 services)
- [crm](#crm) (1 services)
- [dailylog](#dailylog) (2 services)
- [dataExchange](#dataexchange) (3 services)
- [design](#design) (1 services)
- [document](#document) (2 services)
- [email](#email) (4 services)
- [esg](#esg) (1 services)
- [estimate](#estimate) (4 services)
- [feedback](#feedback) (1 services)
- [finance](#finance) (14 services)
- [fleet](#fleet) (8 services)
- [gpsTimesheet](#gpstimesheet) (1 services)
- [hr](#hr) (6 services)
- [hrRussian](#hrrussian) (6 services)
- [immutableAudit](#immutableaudit) (1 services)
- [infrastructure/audit](#infrastructureaudit) (1 services)
- [infrastructure/email](#infrastructureemail) (1 services)
- [infrastructure/report](#infrastructurereport) (1 services)
- [infrastructure/security](#infrastructuresecurity) (3 services)
- [infrastructure/storage](#infrastructurestorage) (1 services)
- [infrastructure/websocket](#infrastructurewebsocket) (1 services)
- [insurance](#insurance) (1 services)
- [integration](#integration) (17 services)
- [iot](#iot) (2 services)
- [isup](#isup) (1 services)
- [journal](#journal) (1 services)
- [kep](#kep) (3 services)
- [leave](#leave) (1 services)
- [legal](#legal) (1 services)
- [m29](#m29) (1 services)
- [maintenance](#maintenance) (1 services)
- [messaging](#messaging) (4 services)
- [mobile](#mobile) (2 services)
- [monitoring](#monitoring) (4 services)
- [monteCarlo](#montecarlo) (2 services)
- [monthlySchedule](#monthlyschedule) (1 services)
- [notification](#notification) (5 services)
- [ops](#ops) (3 services)
- [organization](#organization) (2 services)
- [payroll](#payroll) (1 services)
- [permission](#permission) (7 services)
- [planfact](#planfact) (1 services)
- [planning](#planning) (10 services)
- [pmWorkflow](#pmworkflow) (3 services)
- [portal](#portal) (8 services)
- [portfolio](#portfolio) (1 services)
- [prequalification](#prequalification) (2 services)
- [priceCoefficient](#pricecoefficient) (1 services)
- [procurement](#procurement) (3 services)
- [procurementExt](#procurementext) (2 services)
- [project](#project) (4 services)
- [pto](#pto) (10 services)
- [punchlist](#punchlist) (1 services)
- [quality](#quality) (10 services)
- [recruitment](#recruitment) (1 services)
- [regulatory](#regulatory) (5 services)
- [report](#report) (3 services)
- [revenueRecognition](#revenuerecognition) (4 services)
- [russianDoc](#russiandoc) (5 services)
- [safety](#safety) (13 services)
- [scheduler](#scheduler) (1 services)
- [search](#search) (2 services)
- [selfEmployed](#selfemployed) (1 services)
- [settings](#settings) (8 services)
- [siteAssessment](#siteassessment) (1 services)
- [specification](#specification) (5 services)
- [subscription](#subscription) (4 services)
- [support](#support) (2 services)
- [task](#task) (10 services)
- [taxRisk](#taxrisk) (1 services)
- [warehouse](#warehouse) (8 services)
- [workflowEngine](#workflowengine) (3 services)

---

## Module: accounting

### AccountingService (`modules/accounting/service/AccountingService.java`)

**Dependencies:**
- Repositories: AccountEntryRepository, AccountPeriodRepository, AccountPlanRepository, FinancialJournalRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAccountPlans` | AccountType type, Pageable pageable | `Page<AccountPlanResponse>` |
| `getAccountPlan` | UUID id | `AccountPlanResponse` |
| `listPeriods` | Pageable pageable | `Page<AccountPeriodResponse>` |
| `openPeriod` | int year, int month | `AccountPeriod` |
| `closePeriod` | UUID periodId | `AccountPeriod` |
| `listEntries` | UUID periodId, UUID journalId, Pageable pageable | `Page<AccountEntryResponse>` |
| `getEntry` | UUID id | `AccountEntryResponse` |
| `createEntry` | CreateAccountEntryRequest request | `AccountEntryResponse` |
| `updateEntry` | UUID id, CreateAccountEntryRequest request | `AccountEntryResponse` |
| `deleteEntry` | UUID id | `void` |
| `deleteEntries` | List<UUID> ids | `int` |

---

### CounterpartyService (`modules/accounting/service/CounterpartyService.java`)

**Dependencies:**
- Repositories: CounterpartyRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCounterparties` | String search, Pageable pageable | `Page<CounterpartyResponse>` |
| `getCounterparty` | UUID id | `CounterpartyResponse` |
| `createCounterparty` | CreateCounterpartyRequest request | `CounterpartyResponse` |
| `updateCounterparty` | UUID id, CreateCounterpartyRequest request | `CounterpartyResponse` |
| `deactivateCounterparty` | UUID id | `void` |

---

### EnsService (`modules/accounting/service/EnsService.java`)

**Dependencies:**
- Repositories: EnsAccountRepository, EnsOperationRepository, EnsPaymentRepository, EnsReconciliationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAccounts` | Pageable pageable | `Page<EnsAccountResponse>` |
| `getAccount` | UUID id | `EnsAccountResponse` |
| `createAccount` | String inn | `EnsAccountResponse` |
| `createAccount` | UUID organizationId, String inn, String accountNumber | `EnsAccountResponse` |
| `updateAccount` | UUID id, String inn | `EnsAccountResponse` |
| `toggleActive` | UUID id | `EnsAccountResponse` |
| `syncBalance` | UUID accountId | `EnsAccountResponse` |
| `deleteAccount` | UUID id | `void` |
| `listPayments` | UUID accountId, Pageable pageable | `Page<EnsPaymentResponse>` |
| `createPayment` | CreateEnsPaymentRequest request | `EnsPaymentResponse` |
| `updatePayment` | UUID id, CreateEnsPaymentRequest request | `EnsPaymentResponse` |
| `deletePayment` | UUID id | `void` |
| `confirmPayment` | UUID paymentId | `EnsPaymentResponse` |
| `listOperations` | UUID accountId, Pageable pageable | `Page<EnsOperationResponse>` |
| `getOperation` | UUID id | `EnsOperationResponse` |
| `createOperation` | CreateEnsOperationRequest request | `EnsOperationResponse` |
| `processOperation` | UUID id | `EnsOperationResponse` |
| `cancelOperation` | UUID id | `EnsOperationResponse` |
| `getOperationsByPeriod` | UUID accountId, LocalDate from, LocalDate to | `List<EnsOperationResponse>` |
| `listReconciliations` | UUID accountId, Pageable pageable | `Page<EnsReconciliationResponse>` |
| `createReconciliation` | UUID accountId, UUID periodId, BigDecimal expectedAmount, BigDecimal actualAm... | `EnsReconciliation` |
| `createReconciliationEnhanced` | CreateEnsReconciliationRequest request | `EnsReconciliationResponse` |
| `completeReconciliation` | UUID id, UUID reconciledById | `EnsReconciliationResponse` |

---

### FixedAssetService (`modules/accounting/service/FixedAssetService.java`)

**Dependencies:**
- Repositories: FixedAssetRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAssets` | FixedAssetStatus status, Pageable pageable | `Page<FixedAssetResponse>` |
| `getAsset` | UUID id | `FixedAssetResponse` |
| `createAsset` | CreateFixedAssetRequest request | `FixedAssetResponse` |
| `activateAsset` | UUID id | `FixedAssetResponse` |
| `disposeAsset` | UUID id | `FixedAssetResponse` |
| `updateAsset` | UUID id, CreateFixedAssetRequest request | `FixedAssetResponse` |
| `deleteAsset` | UUID id | `void` |
| `calculateDepreciation` | UUID id | `FixedAssetResponse` |
| `calculateMonthlyDepreciationBatch` |  | `int` |

---

### JournalService (`modules/accounting/service/JournalService.java`)

**Dependencies:**
- Repositories: CounterpartyRepository, FinancialJournalRepository, JournalEntryRepository, JournalLineRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listJournals` | Pageable pageable | `Page<FinancialJournal>` |
| `createJournal` | String code, String name, JournalType type | `FinancialJournal` |
| `activateJournal` | UUID id | `FinancialJournal` |
| `deactivateJournal` | UUID id | `FinancialJournal` |
| `listEntries` | UUID journalId, JournalEntryStatus status, Pageable pageable | `Page<JournalEntry>` |
| `createEntry` | UUID journalId, LocalDate entryDate | `JournalEntry` |
| `postEntry` | UUID entryId | `JournalEntry` |
| `addLine` | UUID entryId, UUID accountId, BigDecimal debit, BigDecimal credit, UUID partn... | `JournalLine` |
| `getEntryLines` | UUID entryId | `List<JournalLine>` |

---

### TaxDeclarationService (`modules/accounting/service/TaxDeclarationService.java`)

**Dependencies:**
- Repositories: AccountPeriodRepository, TaxDeclarationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDeclarations` | DeclarationType type, DeclarationStatus status, Pageable pageable | `Page<TaxDeclarationResponse>` |
| `getDeclaration` | UUID id | `TaxDeclarationResponse` |
| `createDeclaration` | CreateTaxDeclarationRequest request | `TaxDeclarationResponse` |
| `submitDeclaration` | UUID id | `TaxDeclarationResponse` |
| `acceptDeclaration` | UUID id | `TaxDeclarationResponse` |
| `updateDeclaration` | UUID id, CreateTaxDeclarationRequest request | `TaxDeclarationResponse` |
| `deleteDeclaration` | UUID id | `void` |

---

## Module: admin

### AdminDashboardService (`modules/admin/service/AdminDashboardService.java`)

**Dependencies:**
- Repositories: AuditLogRepository, ProjectRepository, UserRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getMetrics` |  | `DashboardMetricsResponse` |

---

### SystemSettingService (`modules/admin/service/SystemSettingService.java`)

**Dependencies:**
- Repositories: SystemSettingRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getAllSettings` |  | `List<SystemSettingResponse>` |
| `getSettingValue` | String key, String defaultValue | `String` |
| `getSettingsByCategory` | String category | `List<SystemSettingResponse>` |
| `updateSetting` | String key, UpdateSettingRequest request | `SystemSettingResponse` |
| `createSetting` | String key, String value, String type, String category, String description | `SystemSettingResponse` |

---

### TenantManagementService (`modules/admin/service/TenantManagementService.java`)

**Dependencies:**
- Repositories: OrganizationRepository, ProjectRepository, SubscriptionPlanRepository, TenantSubscriptionRepository, UserRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAllTenants` | String search, Pageable pageable | `Page<TenantListResponse>` |
| `getTenantDetail` | UUID id | `TenantDetailResponse` |
| `updateTenantStatus` | UUID id, String status | `TenantDetailResponse` |
| `updateTenantPlan` | UUID id, UUID planId | `TenantDetailResponse` |

---

## Module: ai

### AiAssistantEnhancedService (`modules/ai/service/AiAssistantEnhancedService.java`)

**Dependencies:**
- Repositories: AiConversationContextRepository, AiConversationRepository, AiMessageRepository, AiModelConfigRepository, AiPromptTemplateRepository, AiUsageLogRepository
- Services: AiAssistantService, AiContextService, AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `chat` | EnhancedAiChatRequest request, UUID userId | `EnhancedAiChatResponse` |
| `buildSystemPrompt` | UUID conversationId | `String` |
| `getOrCreateConversation` | UUID conversationId, UUID userId, String firstMessage | `AiConversation` |
| `getConversationWithContext` | UUID conversationId | `AiConversationResponse` |
| `addContext` | UUID conversationId, AddContextRequest request | `AiConversationContextResponse` |
| `getContexts` | UUID conversationId | `List<AiConversationContextResponse>` |
| `createModelConfig` | CreateAiModelConfigRequest request | `AiModelConfigResponse` |
| `listModelConfigs` | Pageable pageable | `Page<AiModelConfigResponse>` |
| `getModelConfig` | UUID id | `AiModelConfigResponse` |
| `updateModelConfig` | UUID id, CreateAiModelConfigRequest request | `AiModelConfigResponse` |
| `deleteModelConfig` | UUID id | `void` |
| `getDefaultModelConfig` |  | `AiModelConfigResponse` |
| `createPromptTemplate` | CreatePromptTemplateRequest request | `AiPromptTemplateResponse` |
| `listPromptTemplates` | AiPromptCategory category, Pageable pageable | `Page<AiPromptTemplateResponse>` |
| `getPromptTemplate` | UUID id | `AiPromptTemplateResponse` |
| `updatePromptTemplate` | UUID id, CreatePromptTemplateRequest request | `AiPromptTemplateResponse` |
| `deletePromptTemplate` | UUID id | `void` |
| `getUsageSummary` | LocalDate from, LocalDate to | `AiUsageSummaryResponse` |
| `getUsageLogs` | LocalDate from, LocalDate to, Pageable pageable | `Page<AiUsageLogResponse>` |

---

### AiAssistantService (`modules/ai/service/AiAssistantService.java`)

**Dependencies:**
- Repositories: AiConversationRepository, AiMessageRepository, AiUsageLogRepository
- Services: AiContextService, ObjectMapper, RestTemplate
- Other: AiProperties

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getStatus` |  | `AiStatusResponse` |
| `chat` | AiChatRequest request, UUID userId | `AiChatResponse` |
| `chatStream` | AiChatRequest request, UUID userId | `SseEmitter` |

---

### AiContextService (`modules/ai/service/AiContextService.java`)

**Dependencies:**
- Repositories: ContractRepository, EmployeeRepository, ProjectRepository, ProjectTaskRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `buildContext` | String userMessage, UUID userId | `String` |

---

### AiConversationService (`modules/ai/service/AiConversationService.java`)

**Dependencies:**
- Repositories: AiConversationRepository, AiMessageRepository, AiUsageLogRepository
- Services: AiAssistantService, AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByUser` | UUID userId, ConversationStatus status, Pageable pageable | `Page<AiConversationResponse>` |
| `findById` | UUID id | `AiConversationResponse` |
| `create` | CreateConversationRequest request | `AiConversationResponse` |
| `sendMessage` | UUID conversationId, SendMessageRequest request | `AiMessageResponse` |
| `getMessages` | UUID conversationId | `List<AiMessageResponse>` |
| `archive` | UUID id | `AiConversationResponse` |
| `delete` | UUID id | `void` |

---

### AiDocumentAnalysisService (`modules/ai/service/AiDocumentAnalysisService.java`)

**Dependencies:**
- Repositories: AiDocumentAnalysisRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `create` | CreateDocumentAnalysisRequest request | `AiDocumentAnalysisResponse` |
| `findById` | UUID id | `AiDocumentAnalysisResponse` |
| `findByDocument` | UUID documentId | `List<AiDocumentAnalysisResponse>` |
| `findByStatus` | AnalysisStatus status, Pageable pageable | `Page<AiDocumentAnalysisResponse>` |

---

### DocumentClassificationService (`modules/ai/classification/service/DocumentClassificationService.java`)

**Dependencies:**
- Repositories: DocumentClassificationRepository, DocumentCrossCheckRepository, DocumentRepository, OcrProcessingJobRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listClassifications` | DocumentClassType typeFilter, Pageable pageable | `Page<DocumentClassificationResponse>` |
| `getClassification` | UUID id | `DocumentClassificationResponse` |
| `getClassificationByDocument` | UUID documentId | `DocumentClassificationResponse` |
| `classifyDocument` | UUID documentId | `DocumentClassificationResponse` |
| `extractMetadata` | UUID documentId | `DocumentClassificationResponse` |
| `confirmClassification` | UUID classificationId | `DocumentClassificationResponse` |
| `overrideClassification` | UUID classificationId, DocumentClassType newType | `DocumentClassificationResponse` |
| `crossCheckDocuments` | UUID sourceDocumentId, UUID targetDocumentId | `List<DocumentCrossCheckResponse>` |
| `listCrossChecks` | CrossCheckStatus statusFilter, Pageable pageable | `Page<DocumentCrossCheckResponse>` |
| `getCrossChecksByDocument` | UUID documentId | `List<DocumentCrossCheckResponse>` |
| `enqueueOcrJob` | UUID documentId | `OcrProcessingJobResponse` |
| `listOcrJobs` | Pageable pageable | `Page<OcrProcessingJobResponse>` |
| `getOcrJob` | UUID jobId | `OcrProcessingJobResponse` |
| `getStats` |  | `ClassificationStatsResponse` |
| `processOcrQueue` |  | `void` |

---

## Module: analytics

### AbcXyzService (`modules/analytics/service/AbcXyzService.java`)

**Dependencies:**
- Repositories: AbcXyzAnalysisRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `AbcXyzAnalysisResponse` |
| `findByProject` | UUID projectId, Pageable pageable | `Page<AbcXyzAnalysisResponse>` |
| `findByFilters` | UUID projectId, String entityType, AbcCategory abcCategory, XyzCategory xyzCa... | `Page<AbcXyzAnalysisResponse>` |
| `create` | CreateAbcXyzAnalysisRequest request | `AbcXyzAnalysisResponse` |
| `createBatch` | List<CreateAbcXyzAnalysisRequest> requests | `List<AbcXyzAnalysisResponse>` |
| `delete` | UUID id | `void` |

---

### AnalyticsDataService (`modules/analytics/service/AnalyticsDataService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, ImmutableRecordRepository, InvoiceRepository, MaterialRepository, ProjectRepository, ProjectTaskRepository, SafetyIncidentRepository, SafetyInspectionRepository, SafetyViolationRepository, StockEntryRepository
- Services: PdfReportService
- Other: EntityManager

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getProjectStatusSummary` |  | `ProjectStatusSummary` |
| `getFinancialSummary` | UUID projectId | `FinancialSummary` |
| `getSafetyMetrics` | UUID projectId, LocalDate startDate, LocalDate endDate | `SafetyMetricsSummary` |
| `getTaskProgress` | UUID projectId | `TaskProgressSummary` |
| `getProcurementStatus` | UUID projectId | `ProcurementStatusSummary` |
| `getWarehouseMetrics` |  | `WarehouseMetricsSummary` |
| `getHrMetrics` |  | `HrMetricsSummary` |
| `getProjectTimeline` |  | `List<ProjectTimelineEntry>` |
| `getFinancialBars` |  | `List<FinancialBarResponse>` |
| `getSafetyMetricsList` |  | `List<SafetyMetricResponse>` |
| `getProcurementSpendList` |  | `List<ProcurementSpendResponse>` |
| `getWarehouseStockList` |  | `List<WarehouseStockResponse>` |
| `getKpiItems` |  | `List<KpiItemResponse>` |
| `getAuditLog` | int page, int size | `AuditLogPageResponse` |
| `getProjectBudgetSummaries` |  | `List<ProjectBudgetSummaryResponse>` |
| `getProgressData` |  | `List<ProgressPointResponse>` |
| `getBudgetCategoryBreakdown` |  | `List<BudgetCategoryResponse>` |
| `exportReportData` | String reportType, UUID projectId, String dateFrom, String dateTo, String format | `byte[]` |

---

### AnalyticsReportService (`modules/analytics/service/AnalyticsReportService.java`)

**Dependencies:**
- Repositories: AnalyticsReportRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `AnalyticsReportResponse` |
| `findAll` | Pageable pageable | `Page<AnalyticsReportResponse>` |
| `findByType` | BiReportType reportType, Pageable pageable | `Page<AnalyticsReportResponse>` |
| `findAccessible` | UUID userId, Pageable pageable | `Page<AnalyticsReportResponse>` |
| `create` | CreateAnalyticsReportRequest request | `AnalyticsReportResponse` |
| `update` | UUID id, UpdateAnalyticsReportRequest request | `AnalyticsReportResponse` |
| `runReport` | UUID id | `AnalyticsReportResponse` |
| `delete` | UUID id | `void` |

---

### AnalyticsSavedReportService (`modules/analytics/service/AnalyticsSavedReportService.java`)

**Dependencies:**
- Repositories: ReportExecutionRepository, SavedReportRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `SavedReportResponse` |
| `findAll` | Pageable pageable | `Page<SavedReportResponse>` |
| `findByCreator` | UUID createdById, Pageable pageable | `Page<SavedReportResponse>` |
| `create` | CreateReportRequest request | `SavedReportResponse` |
| `update` | UUID id, UpdateReportRequest request | `SavedReportResponse` |
| `executeReport` | UUID reportId, ExecuteReportRequest request | `ReportExecutionResponse` |
| `scheduleReport` | UUID reportId, String cronExpression, String recipients | `SavedReportResponse` |
| `getExecutionHistory` | UUID reportId, Pageable pageable | `Page<ReportExecutionResponse>` |
| `getScheduledReports` |  | `List<SavedReportResponse>` |
| `delete` | UUID id | `void` |

---

### DashboardAnalyticsService (`modules/analytics/service/DashboardAnalyticsService.java`)

**Dependencies:**
- Repositories: BudgetRepository, DefectRepository, ProjectMilestoneRepository, ProjectRepository, ProjectTaskRepository, SafetyIncidentRepository, SafetyInspectionRepository, SafetyTrainingRepository, SafetyViolationRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getOrganizationDashboard` |  | `OrgDashboardResponse` |
| `getFinancialSummary` |  | `FinancialSummaryResponse` |
| `getTaskAnalytics` |  | `TaskAnalyticsResponse` |
| `getSafetyMetrics` |  | `SafetyMetricsResponse` |

---

### DashboardService (`modules/analytics/service/DashboardService.java`)

**Dependencies:**
- Repositories: DashboardRepository, DashboardWidgetRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `DashboardResponse` |
| `findAll` | Pageable pageable | `Page<DashboardResponse>` |
| `getMyDashboards` | UUID ownerId, Pageable pageable | `Page<DashboardResponse>` |
| `getAccessibleDashboards` | UUID ownerId, Pageable pageable | `Page<DashboardResponse>` |
| `getSystemDashboards` |  | `List<DashboardResponse>` |
| `create` | CreateDashboardRequest request | `DashboardResponse` |
| `update` | UUID id, UpdateDashboardRequest request | `DashboardResponse` |
| `updateLayout` | UUID id, UpdateLayoutRequest request | `DashboardResponse` |
| `cloneDashboard` | UUID sourceId, String newCode, String newName, UUID ownerId | `DashboardResponse` |
| `delete` | UUID id | `void` |
| `getWidgets` | UUID dashboardId | `List<DashboardWidgetResponse>` |
| `addWidget` | UUID dashboardId, CreateWidgetRequest request | `DashboardWidgetResponse` |
| `removeWidget` | UUID dashboardId, UUID widgetId | `void` |

---

### KpiBonusService (`modules/analytics/service/KpiBonusService.java`)

**Dependencies:**
- Repositories: BonusCalculationRepository, KpiAchievementRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAchievements` | UUID employeeId, String period, Pageable pageable | `Page<KpiAchievementResponse>` |
| `getAchievement` | UUID id | `KpiAchievementResponse` |
| `getAchievementsForEmployee` | UUID employeeId, String period | `List<KpiAchievementResponse>` |
| `createAchievement` | CreateKpiAchievementRequest request | `KpiAchievementResponse` |
| `deleteAchievement` | UUID id | `void` |
| `listBonuses` | UUID employeeId, BonusStatus status, Pageable pageable | `Page<BonusCalculationResponse>` |
| `getBonus` | UUID id | `BonusCalculationResponse` |
| `createBonus` | CreateBonusCalculationRequest request | `BonusCalculationResponse` |
| `calculateBonus` | UUID id | `BonusCalculationResponse` |
| `approveBonus` | UUID id, UUID approvedById | `BonusCalculationResponse` |
| `markAsPaid` | UUID id | `BonusCalculationResponse` |

---

### KpiService (`modules/analytics/service/KpiService.java`)

**Dependencies:**
- Repositories: KpiDefinitionRepository, KpiSnapshotRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `KpiDefinitionResponse` |
| `findAll` | KpiCategory category, Pageable pageable | `Page<KpiDefinitionResponse>` |
| `getActiveKpis` |  | `List<KpiDefinitionResponse>` |
| `create` | CreateKpiDefinitionRequest request | `KpiDefinitionResponse` |
| `update` | UUID id, UpdateKpiDefinitionRequest request | `KpiDefinitionResponse` |
| `delete` | UUID id | `void` |
| `takeSnapshot` | UUID kpiId, TakeSnapshotRequest request | `KpiSnapshotResponse` |
| `getKpiHistory` | UUID kpiId, Pageable pageable | `Page<KpiSnapshotResponse>` |
| `getKpiHistoryByDateRange` | UUID kpiId, LocalDate startDate, LocalDate endDate | `List<KpiSnapshotResponse>` |
| `getKpiDashboard` |  | `List<KpiDashboardItem>` |
| `calculateKpi` | UUID kpiId | `BigDecimal` |

---

### PredictiveAnalyticsService (`modules/analytics/service/PredictiveAnalyticsService.java`)

**Dependencies:**
- Repositories: BudgetRepository, ChangeOrderRepository, EvmSnapshotRepository, PredictionModelRepository, ProjectRepository, ProjectRiskPredictionRepository, RiskFactorWeightRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAllModels` | Pageable pageable | `Page<PredictionModelResponse>` |
| `findModelById` | UUID id | `PredictionModelResponse` |
| `createModel` | CreatePredictionModelRequest request | `PredictionModelResponse` |
| `deleteModel` | UUID id | `void` |
| `findAllWeights` | Pageable pageable | `Page<RiskFactorWeightResponse>` |
| `createWeight` | CreateRiskFactorWeightRequest request | `RiskFactorWeightResponse` |
| `updateWeight` | UUID id, UpdateRiskFactorWeightRequest request | `RiskFactorWeightResponse` |
| `deleteWeight` | UUID id | `void` |
| `findPredictions` | UUID projectId, Pageable pageable | `Page<ProjectRiskPredictionResponse>` |
| `findActiveAlerts` |  | `List<ProjectRiskPredictionResponse>` |
| `calculateDelayProbability` | UUID projectId | `ProjectRiskPredictionResponse` |
| `calculateCostOverrunProbability` | UUID projectId | `ProjectRiskPredictionResponse` |
| `getRiskDashboard` |  | `RiskDashboardResponse` |
| `refreshPredictionsForActiveProjects` |  | `void` |

---

### ReportBuilderService (`modules/analytics/service/ReportBuilderService.java`)

**Dependencies:**
- Repositories: AnalyticsReportTemplateRepository, ReportBuilderExecutionRepository
- Services: AuditService, ObjectMapper
- Other: EntityManager

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getTemplates` | Pageable pageable | `Page<ReportTemplateResponse>` |
| `getTemplate` | UUID id | `ReportTemplateResponse` |
| `createTemplate` | CreateReportTemplateRequest request | `ReportTemplateResponse` |
| `updateTemplate` | UUID id, UpdateReportTemplateRequest request | `ReportTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |
| `duplicateTemplate` | UUID id | `ReportTemplateResponse` |
| `executeReport` | UUID templateId, ExecuteReportBuilderRequest request | `ReportBuilderExecutionResponse` |
| `getAvailableDataSources` |  | `List<DataSourceInfo>` |
| `getAvailableFields` | ReportDataSource dataSource | `List<FieldInfo>` |
| `getExecutionHistory` | UUID templateId, Pageable pageable | `Page<ReportBuilderExecutionResponse>` |

---

## Module: apiManagement

### ApiKeyService (`modules/apiManagement/service/ApiKeyService.java`)

**Dependencies:**
- Repositories: ApiKeyRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `ApiKeyResponse` |
| `findByUser` | UUID userId, Pageable pageable | `Page<ApiKeyResponse>` |
| `findActiveKeys` |  | `List<ApiKeyResponse>` |
| `create` | CreateApiKeyRequest request | `ApiKeyCreatedResponse` |
| `deactivate` | UUID id | `ApiKeyResponse` |
| `recordUsage` | UUID id | `ApiKeyResponse` |
| `delete` | UUID id | `void` |

---

### ApiRateLimitService (`modules/apiManagement/service/ApiRateLimitService.java`)

**Dependencies:**
- Repositories: ApiRateLimitRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getRateLimit` | UUID apiKeyId | `ApiRateLimitResponse` |
| `setRateLimit` | UUID apiKeyId, SetRateLimitRequest request | `ApiRateLimitResponse` |
| `isRateLimited` | UUID apiKeyId | `boolean` |

---

### ApiUsageAnalyticsService (`modules/apiManagement/service/ApiUsageAnalyticsService.java`)

**Dependencies:**
- Repositories: ApiUsageLogRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `logRequest` | UUID organizationId, UUID apiKeyId, String endpoint, String method, int statu... | `void` |
| `getUsageStats` | UUID apiKeyId, LocalDate from, LocalDate to | `ApiUsageStatsResponse` |
| `getTopEndpoints` | UUID orgId, int limit | `List<TopEndpointResponse>` |

---

### IntegrationMarketplaceService (`modules/apiManagement/service/IntegrationMarketplaceService.java`)

**Dependencies:**
- Repositories: ConnectorInstallationRepository, IntegrationConnectorRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listConnectors` | ConnectorCategory category | `List<ConnectorResponse>` |
| `getConnector` | String slug | `ConnectorResponse` |
| `installConnector` | UUID connectorId | `ConnectorInstallationResponse` |
| `configureConnector` | UUID installationId, String configJson | `ConnectorInstallationResponse` |
| `uninstallConnector` | UUID installationId | `void` |
| `getInstalledConnectors` |  | `List<ConnectorInstallationResponse>` |
| `getConnectorStatus` | UUID installationId | `ConnectorInstallationResponse` |

---

### WebhookDeliveryService (`modules/apiManagement/service/WebhookDeliveryService.java`)

**Dependencies:**
- Repositories: ApiWebhookDeliveryRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createDelivery` | UUID webhookId, String eventType, String payload | `WebhookDeliveryResponse` |
| `markDelivered` | UUID deliveryId, int statusCode, String responseBody, int durationMs | `WebhookDeliveryResponse` |
| `markFailed` | UUID deliveryId, String errorMessage | `WebhookDeliveryResponse` |
| `retryFailed` |  | `void` |
| `getDeliveries` | UUID webhookId, Pageable pageable | `Page<WebhookDeliveryResponse>` |
| `getDeliveriesByStatus` | WebhookDeliveryStatus status, Pageable pageable | `Page<WebhookDeliveryResponse>` |

---

### WebhookService (`modules/apiManagement/service/WebhookService.java`)

**Dependencies:**
- Repositories: ApiWebhookDeliveryRepository, WebhookConfigRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findConfigById` | UUID id | `WebhookConfigResponse` |
| `findAllConfigs` | Pageable pageable | `Page<WebhookConfigResponse>` |
| `findActiveConfigs` |  | `List<WebhookConfigResponse>` |
| `createConfig` | CreateWebhookConfigRequest request | `WebhookConfigResponse` |
| `updateConfig` | UUID id, UpdateWebhookConfigRequest request | `WebhookConfigResponse` |
| `deleteConfig` | UUID id | `void` |
| `findDeliveries` | UUID configId, Pageable pageable | `Page<WebhookDeliveryResponse>` |
| `createDelivery` | UUID configId, String event, String payload | `WebhookDeliveryResponse` |
| `markDelivered` | UUID deliveryId, int responseCode, String responseBody | `WebhookDeliveryResponse` |
| `markFailed` | UUID deliveryId, int responseCode, String responseBody, Instant nextRetryAt | `WebhookDeliveryResponse` |

---

## Module: approval

### ApprovalService (`modules/approval/service/ApprovalService.java`)

**Dependencies:**
- Repositories: ApprovalChainRepository, ApprovalStepRepository, SpecificationRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createChain` | CreateApprovalChainRequest request | `ApprovalChainResponse` |
| `getChain` | String entityType, UUID entityId | `ApprovalChainResponse` |
| `listChains` |  | `List<ApprovalChainResponse>` |
| `getChainById` | UUID id | `ApprovalChainResponse` |
| `approveStep` | UUID stepId, String comment | `ApprovalStepResponse` |
| `rejectStep` | UUID stepId, String comment | `ApprovalStepResponse` |

---

## Module: auth

### AuthService (`modules/auth/service/AuthService.java`)

**Dependencies:**
- Repositories: LoginAuditLogRepository, RoleRepository, UserRepository
- Services: JwtTokenProvider, SystemSettingService, TwoFactorService, UserDetailsService
- Other: AuthenticationManager, PasswordEncoder

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `login` | LoginRequest request, HttpServletRequest httpRequest | `LoginResponse` |
| `login` | LoginRequest request | `LoginResponse` |
| `register` | RegisterRequest request | `LoginResponse` |
| `refreshToken` | RefreshTokenRequest request | `LoginResponse` |
| `getCurrentUser` |  | `UserResponse` |
| `changePassword` | ChangePasswordRequest request | `void` |
| `verifyTwoFactorLogin` | com.privod.platform.modules.auth.web.dto.TwoFactorLoginRequest request, HttpS... | `LoginResponse` |
| `verifyTwoFactorLogin` | com.privod.platform.modules.auth.web.dto.TwoFactorLoginRequest request | `LoginResponse` |

---

### MfaService (`modules/auth/service/MfaService.java`)

**Dependencies:**
- Repositories: MfaAttemptRepository, MfaConfigRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `enableMfa` | EnableMfaRequest request | `MfaConfigResponse` |
| `disableMfa` | UUID userId, MfaMethod method | `void` |
| `verify` | VerifyMfaRequest request, String ipAddress, String userAgent | `boolean` |
| `getUserMfaConfigs` | UUID userId | `List<MfaConfigResponse>` |
| `hasMfaEnabled` | UUID userId | `boolean` |
| `getRecentFailedAttempts` | UUID userId, int minutes | `long` |

---

### OidcProviderService (`modules/auth/service/OidcProviderService.java`)

**Dependencies:**
- Repositories: OidcProviderRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `create` | CreateOidcProviderRequest request | `OidcProviderResponse` |
| `getActiveProviders` |  | `List<OidcProviderResponse>` |
| `getProvider` | String code | `OidcProviderResponse` |
| `toggleActive` | String code, boolean active | `OidcProviderResponse` |
| `delete` | UUID providerId | `void` |

---

### SecurityPolicyService (`modules/auth/service/SecurityPolicyService.java`)

**Dependencies:**
- Repositories: LoginAttemptRepository, SecurityPolicyRepository, UserSessionRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getActivePolicy` |  | `SecurityPolicyResponse` |
| `createSession` | UUID userId, String sessionToken, String ipAddress, String userAgent, int tim... | `UserSessionResponse` |
| `getActiveSessions` | UUID userId | `List<UserSessionResponse>` |
| `terminateSession` | UUID sessionId | `void` |
| `terminateSessionForUser` | UUID sessionId, UUID userId | `void` |
| `terminateAllSessions` | UUID userId | `int` |
| `recordLoginAttempt` | UUID userId, String email, String ipAddress, String userAgent, boolean succes... | `void` |
| `isAccountLocked` | String email | `boolean` |
| `cleanupExpiredSessions` |  | `int` |

---

### TwoFactorService (`modules/auth/service/TwoFactorService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `generateSecret` |  | `String` |
| `generateQrCodeUri` | String secret, String email | `String` |
| `verifyCode` | String secret, String code | `boolean` |
| `generateRecoveryCodes` |  | `List<String>` |

---

### UserAdminService (`modules/auth/service/UserAdminService.java`)

**Dependencies:**
- Repositories: LoginAttemptRepository, RoleRepository, UserRepository, UserSessionRepository
- Other: PasswordEncoder

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listUsers` | String search, Pageable pageable | `Page<UserResponse>` |
| `getUser` | UUID id | `UserResponse` |
| `createUser` | CreateAdminUserRequest request | `UserResponse` |
| `updateUser` | UUID id, UpdateAdminUserRequest request | `UserResponse` |
| `blockUser` | UUID id | `void` |
| `unblockUser` | UUID id | `void` |
| `resetPassword` | UUID id | `ResetPasswordResponse` |
| `forceLogout` | UUID id | `void` |
| `getUserSessions` | UUID userId | `List<UserSessionResponse>` |
| `getUserActivityLog` | UUID userId | `List<UserActivityLogResponse>` |

---

## Module: bidManagement

### BidManagementService (`modules/bidManagement/service/BidManagementService.java`)

**Dependencies:**
- Repositories: BidEvaluationRepository, BidInvitationRepository, BidPackageRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPackages` | UUID projectId | `List<BidPackageResponse>` |
| `getPackage` | UUID id | `BidPackageResponse` |
| `createPackage` | CreateBidPackageRequest req | `BidPackageResponse` |
| `updatePackage` | UUID id, UpdateBidPackageRequest req | `BidPackageResponse` |
| `deletePackage` | UUID id | `void` |
| `listInvitations` | UUID packageId | `List<BidInvitationResponse>` |
| `createInvitation` | UUID packageId, CreateBidInvitationRequest req | `BidInvitationResponse` |
| `updateInvitation` | UUID packageId, UUID invId, UpdateBidInvitationRequest req | `BidInvitationResponse` |
| `deleteInvitation` | UUID packageId, UUID invId | `void` |
| `listEvaluations` | UUID packageId | `List<BidEvaluationResponse>` |
| `createEvaluation` | UUID packageId, CreateBidEvaluationRequest req | `BidEvaluationResponse` |
| `getLevelingMatrix` | UUID packageId | `LevelingMatrixResponse` |

---

## Module: bidScoring

### BidScoringService (`modules/bidScoring/service/BidScoringService.java`)

**Dependencies:**
- Repositories: BidComparisonRepository, BidCriteriaRepository, BidScoreRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listComparisons` | UUID projectId, ComparisonStatus status, Pageable pageable | `Page<BidComparisonResponse>` |
| `getComparison` | UUID id | `BidComparisonResponse` |
| `createComparison` | CreateBidComparisonRequest request | `BidComparisonResponse` |
| `updateComparison` | UUID id, UpdateBidComparisonRequest request | `BidComparisonResponse` |
| `completeComparison` | UUID id | `BidComparisonResponse` |
| `approveComparison` | UUID id, UUID approvedById | `BidComparisonResponse` |
| `startComparison` | UUID id | `BidComparisonResponse` |
| `deleteComparison` | UUID id | `void` |
| `listCriteria` | UUID bidComparisonId | `List<BidCriteriaResponse>` |
| `createCriteria` | CreateBidCriteriaRequest request | `BidCriteriaResponse` |
| `updateCriteria` | UUID id, UpdateBidCriteriaRequest request | `BidCriteriaResponse` |
| `deleteCriteria` | UUID id | `void` |
| `listScores` | UUID bidComparisonId | `List<BidScoreResponse>` |
| `getVendorScores` | UUID bidComparisonId, UUID vendorId | `List<BidScoreResponse>` |
| `createScore` | CreateBidScoreRequest request | `BidScoreResponse` |
| `updateScore` | UUID id, UpdateBidScoreRequest request | `BidScoreResponse` |
| `deleteScore` | UUID id | `void` |
| `getVendorRanking` | UUID bidComparisonId | `List<VendorTotalScoreResponse>` |
| `determineWinner` | UUID bidComparisonId | `VendorTotalScoreResponse` |

---

## Module: bim

### BimClashDetectionService (`modules/bim/service/BimClashDetectionService.java`)

**Dependencies:**
- Repositories: BimClashResultRepository, BimClashTestRepository, BimElementMetadataRepository, BimModelRepository, BimViewerSessionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createClashTest` | CreateClashTestRequest request | `ClashTestResponse` |
| `getClashTest` | UUID clashTestId | `ClashTestResponse` |
| `listClashTests` | UUID projectId, Pageable pageable | `Page<ClashTestResponse>` |
| `runClashTest` | UUID clashTestId | `ClashTestResponse` |
| `deleteClashTest` | UUID clashTestId | `void` |
| `getClashResults` | UUID clashTestId, ClashResultStatus status, ClashType clashType, Pageable pag... | `Page<ClashResultResponse>` |
| `resolveClash` | UUID clashResultId, String resolutionNotes | `ClashResultResponse` |
| `ignoreClash` | UUID clashResultId, String resolutionNotes | `ClashResultResponse` |
| `assignClash` | UUID clashResultId, UUID userId | `ClashResultResponse` |
| `getClashSummary` | UUID projectId | `ClashSummaryResponse` |
| `startViewerSession` | StartViewerSessionRequest request | `ViewerSessionResponse` |
| `endViewerSession` | UUID sessionId | `ViewerSessionResponse` |
| `importElementMetadata` | UUID modelId, List<ElementMetadataRequest> metadataList | `int` |
| `getElementMetadata` | UUID modelId, Pageable pageable | `Page<BimElementMetadata>` |

---

### BimClashService (`modules/bim/service/BimClashService.java`)

**Dependencies:**
- Repositories: BimClashRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listClashes` | UUID modelId, Pageable pageable | `Page<BimClashResponse>` |
| `getClash` | UUID id | `BimClashResponse` |
| `createClash` | CreateBimClashRequest request | `BimClashResponse` |
| `resolveClash` | UUID id, UUID resolvedById | `BimClashResponse` |
| `approveClash` | UUID id | `BimClashResponse` |
| `deleteClash` | UUID id | `void` |

---

### BimDefectLinkService (`modules/bim/service/BimDefectLinkService.java`)

**Dependencies:**
- Repositories: BimDefectViewRepository, BimModelRepository, DefectBimLinkRepository, DefectRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `linkDefectToElement` | CreateDefectBimLinkRequest request | `DefectBimLinkResponse` |
| `unlinkDefect` | UUID linkId | `void` |
| `updateLink` | UUID linkId, UpdateDefectBimLinkRequest request | `DefectBimLinkResponse` |
| `getLinksForDefect` | UUID defectId | `List<DefectBimLinkResponse>` |
| `getLinksForModel` | UUID modelId, String floorName, String systemName, String elementType, Pageab... | `Page<DefectBimLinkResponse>` |
| `getLinksForProject` | UUID projectId, String floorName, String systemName, String elementType, Page... | `Page<DefectBimLinkResponse>` |
| `getDefectsByFloor` | UUID projectId, String floorName | `List<DefectBimLinkResponse>` |
| `getDefectsBySystem` | UUID projectId, String systemName | `List<DefectBimLinkResponse>` |
| `getDefectHeatmap` | UUID projectId | `DefectHeatmapResponse` |
| `createSavedView` | CreateSavedViewRequest request | `BimDefectViewResponse` |
| `getSavedViews` | UUID projectId | `List<BimDefectViewResponse>` |
| `deleteSavedView` | UUID viewId | `void` |

---

### BimElementService (`modules/bim/service/BimElementService.java`)

**Dependencies:**
- Repositories: BimElementRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listElements` | UUID modelId, Pageable pageable | `Page<BimElementResponse>` |
| `getElement` | UUID id | `BimElementResponse` |
| `createElement` | CreateBimElementRequest request | `BimElementResponse` |
| `updateElement` | UUID id, CreateBimElementRequest request | `BimElementResponse` |
| `deleteElement` | UUID id | `void` |

---

### BimModelService (`modules/bim/service/BimModelService.java`)

**Dependencies:**
- Repositories: BimModelRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listModels` | UUID projectId, Pageable pageable | `Page<BimModelResponse>` |
| `getModel` | UUID id | `BimModelResponse` |
| `createModel` | CreateBimModelRequest request | `BimModelResponse` |
| `updateModel` | UUID id, UpdateBimModelRequest request | `BimModelResponse` |
| `importModel` | UUID id | `BimModelResponse` |
| `processModel` | UUID id | `BimModelResponse` |
| `deleteModel` | UUID id | `void` |

---

### DesignDrawingService (`modules/bim/service/DesignDrawingService.java`)

**Dependencies:**
- Repositories: DesignDrawingRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDrawings` | UUID packageId, Pageable pageable | `Page<DesignDrawingResponse>` |
| `getDrawing` | UUID id | `DesignDrawingResponse` |
| `createDrawing` | CreateDesignDrawingRequest request | `DesignDrawingResponse` |
| `updateDrawing` | UUID id, CreateDesignDrawingRequest request | `DesignDrawingResponse` |
| `setCurrentDrawing` | UUID id | `DesignDrawingResponse` |
| `supersedeDrawing` | UUID id | `DesignDrawingResponse` |
| `deleteDrawing` | UUID id | `void` |

---

### DesignPackageService (`modules/bim/service/DesignPackageService.java`)

**Dependencies:**
- Repositories: DesignPackageRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPackages` | UUID projectId, Pageable pageable | `Page<DesignPackageResponse>` |
| `getPackage` | UUID id | `DesignPackageResponse` |
| `createPackage` | CreateDesignPackageRequest request | `DesignPackageResponse` |
| `updatePackage` | UUID id, UpdateDesignPackageRequest request | `DesignPackageResponse` |
| `submitForReview` | UUID id | `DesignPackageResponse` |
| `approvePackage` | UUID id, UUID approvedById | `DesignPackageResponse` |
| `deletePackage` | UUID id | `void` |

---

### DrawingAnnotationService (`modules/bim/service/DrawingAnnotationService.java`)

**Dependencies:**
- Repositories: DrawingAnnotationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAnnotations` | UUID drawingId, Pageable pageable | `Page<DrawingAnnotationResponse>` |
| `getAnnotation` | UUID id | `DrawingAnnotationResponse` |
| `createAnnotation` | CreateDrawingAnnotationRequest request | `DrawingAnnotationResponse` |
| `updateAnnotation` | UUID id, CreateDrawingAnnotationRequest request | `DrawingAnnotationResponse` |
| `resolveAnnotation` | UUID id, UUID resolvedById | `DrawingAnnotationResponse` |
| `deleteAnnotation` | UUID id | `void` |

---

### PhotoAlbumService (`modules/bim/service/PhotoAlbumService.java`)

**Dependencies:**
- Repositories: PhotoAlbumRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAlbums` | UUID projectId, Pageable pageable | `Page<PhotoAlbumResponse>` |
| `getAlbum` | UUID id | `PhotoAlbumResponse` |
| `createAlbum` | CreatePhotoAlbumRequest request | `PhotoAlbumResponse` |
| `updateAlbum` | UUID id, CreatePhotoAlbumRequest request | `PhotoAlbumResponse` |
| `deleteAlbum` | UUID id | `void` |

---

### PhotoComparisonService (`modules/bim/service/PhotoComparisonService.java`)

**Dependencies:**
- Repositories: PhotoComparisonRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listComparisons` | UUID projectId, Pageable pageable | `Page<PhotoComparisonResponse>` |
| `getComparison` | UUID id | `PhotoComparisonResponse` |
| `createComparison` | CreatePhotoComparisonRequest request | `PhotoComparisonResponse` |
| `updateComparison` | UUID id, CreatePhotoComparisonRequest request | `PhotoComparisonResponse` |
| `deleteComparison` | UUID id | `void` |

---

### PhotoProgressService (`modules/bim/service/PhotoProgressService.java`)

**Dependencies:**
- Repositories: PhotoProgressRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPhotos` | UUID projectId, Pageable pageable | `Page<PhotoProgressResponse>` |
| `getPhoto` | UUID id | `PhotoProgressResponse` |
| `createPhoto` | CreatePhotoProgressRequest request | `PhotoProgressResponse` |
| `updatePhoto` | UUID id, CreatePhotoProgressRequest request | `PhotoProgressResponse` |
| `deletePhoto` | UUID id | `void` |

---

## Module: calendar

### CalendarEventService (`modules/calendar/service/CalendarEventService.java`)

**Dependencies:**
- Repositories: CalendarEventAttendeeRepository, CalendarEventRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listEvents` | Pageable pageable | `Page<CalendarEventResponse>` |
| `getEvent` | UUID id | `CalendarEventResponse` |
| `createEvent` | CreateCalendarEventRequest request | `CalendarEventResponse` |
| `updateEvent` | UUID id, UpdateCalendarEventRequest request | `CalendarEventResponse` |
| `deleteEvent` | UUID id | `void` |
| `getByDateRange` | LocalDate startDate, LocalDate endDate | `List<CalendarEventResponse>` |
| `getByProject` | UUID projectId, Pageable pageable | `Page<CalendarEventResponse>` |
| `getProjectEvents` | UUID projectId, LocalDate startDate, LocalDate endDate | `List<CalendarEventResponse>` |
| `getMyEvents` | UUID userId, Pageable pageable | `Page<CalendarEventResponse>` |
| `getUpcomingEvents` | UUID userId | `List<CalendarEventResponse>` |
| `addAttendee` | UUID eventId, AddAttendeeRequest request | `AttendeeResponse` |
| `removeAttendee` | UUID eventId, UUID userId | `void` |
| `updateAttendeeResponse` | UUID eventId, UUID userId, UpdateAttendeeResponseRequest request | `AttendeeResponse` |
| `getEventAttendees` | UUID eventId | `List<AttendeeResponse>` |
| `generateRecurrences` | UUID eventId, LocalDate rangeStart, LocalDate rangeEnd | `List<CalendarEventResponse>` |

---

### ConstructionScheduleService (`modules/calendar/service/ConstructionScheduleService.java`)

**Dependencies:**
- Repositories: ConstructionScheduleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSchedules` | Pageable pageable | `Page<ConstructionScheduleResponse>` |
| `getSchedule` | UUID id | `ConstructionScheduleResponse` |
| `createSchedule` | CreateScheduleRequest request | `ConstructionScheduleResponse` |
| `updateSchedule` | UUID id, UpdateScheduleRequest request | `ConstructionScheduleResponse` |
| `deleteSchedule` | UUID id | `void` |
| `approve` | UUID id | `ConstructionScheduleResponse` |
| `activate` | UUID id | `ConstructionScheduleResponse` |
| `getProjectSchedules` | UUID projectId | `List<ConstructionScheduleResponse>` |
| `getActiveSchedule` | UUID projectId | `ConstructionScheduleResponse` |

---

### ScheduleItemService (`modules/calendar/service/ScheduleItemService.java`)

**Dependencies:**
- Repositories: ConstructionScheduleRepository, ScheduleItemRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listItems` | UUID scheduleId | `List<ScheduleItemResponse>` |
| `getItem` | UUID itemId | `ScheduleItemResponse` |
| `createItem` | UUID scheduleId, CreateScheduleItemRequest request | `ScheduleItemResponse` |
| `updateItem` | UUID itemId, UpdateScheduleItemRequest request | `ScheduleItemResponse` |
| `deleteItem` | UUID itemId | `void` |
| `updateProgress` | UUID itemId, UpdateProgressRequest request | `ScheduleItemResponse` |
| `reorder` | UUID scheduleId, List<UUID> itemIds | `List<ScheduleItemResponse>` |
| `getScheduleGantt` | UUID scheduleId | `List<GanttItemResponse>` |
| `getCriticalPath` | UUID scheduleId | `List<ScheduleItemResponse>` |

---

### WorkCalendarService (`modules/calendar/service/WorkCalendarService.java`)

**Dependencies:**
- Repositories: WorkCalendarDayRepository, WorkCalendarRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCalendars` | Pageable pageable | `Page<WorkCalendarResponse>` |
| `getCalendar` | UUID id | `WorkCalendarResponse` |
| `createCalendar` | CreateWorkCalendarRequest request | `WorkCalendarResponse` |
| `updateCalendar` | UUID id, CreateWorkCalendarRequest request | `WorkCalendarResponse` |
| `deleteCalendar` | UUID id | `void` |
| `initializeYear` | int year | `WorkCalendarResponse` |
| `addException` | UUID calendarId, AddCalendarExceptionRequest request | `WorkCalendarDayResponse` |
| `getWorkingDays` | UUID calendarId, LocalDate startDate, LocalDate endDate | `WorkingDaysResponse` |
| `isWorkingDay` | UUID calendarId, LocalDate date | `boolean` |
| `getCalendarDays` | UUID calendarId, LocalDate startDate, LocalDate endDate | `List<WorkCalendarDayResponse>` |
| `calculateEndDate` | UUID calendarId, LocalDate startDate, int workingDays | `LocalDate` |

---

## Module: cde

### ArchivePolicyService (`modules/cde/service/ArchivePolicyService.java`)

**Dependencies:**
- Repositories: ArchivePolicyRepository, DocumentAuditEntryRepository, DocumentContainerRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | Pageable pageable | `Page<ArchivePolicyResponse>` |
| `findById` | UUID id | `ArchivePolicyResponse` |
| `create` | CreateArchivePolicyRequest request | `ArchivePolicyResponse` |
| `update` | UUID id, UpdateArchivePolicyRequest request | `ArchivePolicyResponse` |
| `delete` | UUID id | `void` |
| `autoArchiveExpiredDocuments` |  | `int` |

---

### DocumentAuditService (`modules/cde/service/DocumentAuditService.java`)

**Dependencies:**
- Repositories: DocumentAuditEntryRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getAuditTrail` | UUID documentContainerId | `List<DocumentAuditEntryResponse>` |
| `getAuditTrailPaged` | UUID documentContainerId, Pageable pageable | `Page<DocumentAuditEntryResponse>` |

---

### DocumentContainerService (`modules/cde/service/DocumentContainerService.java`)

**Dependencies:**
- Repositories: DocumentAuditEntryRepository, DocumentContainerRepository, DocumentRevisionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String search, DocumentLifecycleState state, Pageable pageable | `Page<DocumentContainerResponse>` |
| `findByProject` | UUID projectId, String search, DocumentLifecycleState state, Pageable pageable | `Page<DocumentContainerResponse>` |
| `findById` | UUID id | `DocumentContainerResponse` |
| `create` | CreateDocumentContainerRequest request | `DocumentContainerResponse` |
| `update` | UUID id, UpdateDocumentContainerRequest request | `DocumentContainerResponse` |
| `changeLifecycleState` | UUID id, ChangeLifecycleStateRequest request | `DocumentContainerResponse` |
| `addRevision` | UUID containerId, CreateRevisionRequest request | `DocumentRevisionResponse` |
| `getRevisions` | UUID containerId | `List<DocumentRevisionResponse>` |
| `delete` | UUID id | `void` |

---

### RevisionSetService (`modules/cde/service/RevisionSetService.java`)

**Dependencies:**
- Repositories: RevisionSetRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByProject` | UUID projectId, Pageable pageable | `Page<RevisionSetResponse>` |
| `findById` | UUID id | `RevisionSetResponse` |
| `create` | CreateRevisionSetRequest request | `RevisionSetResponse` |
| `update` | UUID id, CreateRevisionSetRequest request | `RevisionSetResponse` |
| `delete` | UUID id | `void` |

---

### TransmittalService (`modules/cde/service/TransmittalService.java`)

**Dependencies:**
- Repositories: DocumentAuditEntryRepository, DocumentContainerRepository, DocumentRevisionRepository, TransmittalItemRepository, TransmittalRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByProject` | UUID projectId, TransmittalStatus status, Pageable pageable | `Page<TransmittalResponse>` |
| `findById` | UUID id | `TransmittalResponse` |
| `create` | CreateTransmittalRequest request | `TransmittalResponse` |
| `addItem` | UUID transmittalId, AddTransmittalItemRequest request | `TransmittalItemResponse` |
| `getItems` | UUID transmittalId | `List<TransmittalItemResponse>` |
| `issue` | UUID transmittalId, UUID sentById | `TransmittalResponse` |
| `acknowledge` | UUID transmittalId | `TransmittalResponse` |
| `close` | UUID transmittalId | `TransmittalResponse` |
| `delete` | UUID id | `void` |

---

## Module: changeManagement

### ChangeEventService (`modules/changeManagement/service/ChangeEventService.java`)

**Dependencies:**
- Repositories: ChangeEventRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listChangeEvents` | String search, ChangeEventStatus status, ChangeEventSource source, UUID proje... | `Page<ChangeEventResponse>` |
| `getChangeEvent` | UUID id | `ChangeEventResponse` |
| `createChangeEvent` | CreateChangeEventRequest request | `ChangeEventResponse` |
| `createFromRfi` | CreateChangeEventFromRfiRequest request | `ChangeEventResponse` |
| `updateChangeEvent` | UUID id, UpdateChangeEventRequest request | `ChangeEventResponse` |
| `changeStatus` | UUID id, ChangeEventStatusRequest request | `ChangeEventResponse` |
| `deleteChangeEvent` | UUID id | `void` |

---

### ChangeManagementAnalyticsService (`modules/changeManagement/service/ChangeManagementAnalyticsService.java`)

**Dependencies:**
- Repositories: ChangeEventRepository, ChangeOrderItemRepository, ChangeOrderRepository, WbsNodeRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `ScheduleImpactAnalysis` | UUID projectId, int totalChangeOrders, int changeOrdersOnCriticalPath, int to... | `record` |
| `AffectedWbsNode` | UUID wbsNodeId, String code, String name, boolean isCriticalPath, int totalFl... | `record` |
| `ChangeOrderScheduleImpact` | UUID changeOrderId, String number, String title, String status, int scheduleI... | `record` |
| `BudgetImpactSummary` | UUID projectId, BigDecimal originalContractAmount, BigDecimal totalApprovedAd... | `record` |
| `BudgetImpactByType` | String changeOrderType, int count, BigDecimal totalAmount, BigDecimal percentage | `record` |
| `BudgetImpactMonthly` | String month, BigDecimal additions, BigDecimal deductions, BigDecimal netChan... | `record` |
| `TrendAnalysis` | UUID projectId, List<MonthlyTrend> monthlyTrends, List<SourceBreakdown> bySou... | `record` |
| `MonthlyTrend` | String month, int eventCount, int orderCount, BigDecimal orderAmount, BigDeci... | `record` |
| `SourceBreakdown` | String source, int count, BigDecimal estimatedCost | `record` |
| `TypeBreakdown` | String type, int count, BigDecimal totalAmount | `record` |
| `getScheduleImpact` | UUID projectId | `ScheduleImpactAnalysis` |
| `getBudgetImpact` | UUID projectId | `BudgetImpactSummary` |
| `getTrends` | UUID projectId | `TrendAnalysis` |

---

### ChangeOrderRequestService (`modules/changeManagement/service/ChangeOrderRequestService.java`)

**Dependencies:**
- Repositories: ChangeOrderRequestRepository
- Services: AuditService, ChangeEventService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<ChangeOrderRequestResponse>` |
| `listByChangeEvent` | UUID changeEventId, Pageable pageable | `Page<ChangeOrderRequestResponse>` |
| `getChangeOrderRequest` | UUID id | `ChangeOrderRequestResponse` |
| `createChangeOrderRequest` | CreateChangeOrderRequestRequest request | `ChangeOrderRequestResponse` |
| `updateChangeOrderRequest` | UUID id, UpdateChangeOrderRequestRequest request | `ChangeOrderRequestResponse` |
| `changeStatus` | UUID id, ChangeOrderRequestStatusRequest request | `ChangeOrderRequestResponse` |
| `deleteChangeOrderRequest` | UUID id | `void` |

---

### ChangeOrderService (`modules/changeManagement/service/ChangeOrderService.java`)

**Dependencies:**
- Repositories: ChangeOrderItemRepository, ChangeOrderRepository
- Services: AuditService, ChangeOrderRequestService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<ChangeOrderResponse>` |
| `listByProject` | UUID projectId, Pageable pageable | `Page<ChangeOrderResponse>` |
| `listByContract` | UUID contractId, Pageable pageable | `Page<ChangeOrderResponse>` |
| `getChangeOrder` | UUID id | `ChangeOrderResponse` |
| `createChangeOrder` | CreateChangeOrderRequest request | `ChangeOrderResponse` |
| `updateChangeOrder` | UUID id, UpdateChangeOrderRequest request | `ChangeOrderResponse` |
| `changeStatus` | UUID id, ChangeOrderStatusRequest request | `ChangeOrderResponse` |
| `listItems` | UUID changeOrderId | `List<ChangeOrderItemResponse>` |
| `addItem` | CreateChangeOrderItemRequest request | `ChangeOrderItemResponse` |
| `removeItem` | UUID itemId | `void` |
| `deleteChangeOrder` | UUID id | `void` |
| `calculateRevisedContractAmount` | UUID contractId, BigDecimal originalAmount | `BigDecimal` |

---

## Module: chatter

### ActivityService (`modules/chatter/service/ActivityService.java`)

**Dependencies:**
- Repositories: ActivityRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `create` | CreateActivityRequest request | `ActivityResponse` |
| `getActivities` | String entityType, UUID entityId, Pageable pageable | `Page<ActivityResponse>` |
| `getMyActivities` | UUID userId, ActivityStatus status, Pageable pageable | `Page<ActivityResponse>` |
| `markDone` | UUID activityId, UUID completedById | `ActivityResponse` |
| `cancel` | UUID activityId | `ActivityResponse` |
| `getOverdueActivities` |  | `List<ActivityResponse>` |
| `getPendingCount` | UUID userId | `long` |
| `update` | UUID id, CreateActivityRequest request | `ActivityResponse` |
| `delete` | UUID id | `void` |

---

### CommentService (`modules/chatter/service/CommentService.java`)

**Dependencies:**
- Repositories: CommentRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `create` | CreateCommentRequest request | `CommentResponse` |
| `getComments` | String entityType, UUID entityId, Boolean isInternal, Pageable pageable | `Page<CommentResponse>` |
| `getReplies` | UUID parentCommentId, Pageable pageable | `Page<CommentResponse>` |
| `update` | UUID commentId, String content | `CommentResponse` |
| `delete` | UUID commentId | `void` |
| `getCount` | String entityType, UUID entityId | `long` |

---

### EntityChangeLogService (`modules/chatter/service/EntityChangeLogService.java`)

**Dependencies:**
- Repositories: EntityChangeLogRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `logChange` | LogChangeRequest request | `EntityChangeLogResponse` |
| `logChange` | String entityType, UUID entityId, String fieldName, String oldValue, String n... | `void` |
| `getChangeLogs` | String entityType, UUID entityId, String fieldName, Pageable pageable | `Page<EntityChangeLogResponse>` |

---

### FollowerService (`modules/chatter/service/FollowerService.java`)

**Dependencies:**
- Repositories: FollowerRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `follow` | AddFollowerRequest request | `FollowerResponse` |
| `unfollow` | String entityType, UUID entityId, UUID userId | `void` |
| `getFollowers` | String entityType, UUID entityId | `List<FollowerResponse>` |
| `isFollowing` | String entityType, UUID entityId, UUID userId | `boolean` |

---

## Module: closeout

### AsBuiltTrackerService (`modules/closeout/service/AsBuiltTrackerService.java`)

**Dependencies:**
- Repositories: AsBuiltRequirementRepository, AsBuiltWbsLinkRepository, WbsNodeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getRequirements` | UUID projectId, Pageable pageable | `Page<AsBuiltRequirementResponse>` |
| `getOrgDefaults` |  | `List<AsBuiltRequirementResponse>` |
| `createRequirement` | CreateAsBuiltRequirementRequest request | `AsBuiltRequirementResponse` |
| `deleteRequirement` | UUID id | `void` |
| `getLinksForWbs` | UUID wbsNodeId | `List<AsBuiltWbsLinkResponse>` |
| `linkDocument` | UUID wbsNodeId, UUID projectId, String docCategory, UUID documentContainerId | `AsBuiltWbsLinkResponse` |
| `updateLinkStatus` | UUID linkId, AsBuiltLinkStatus newStatus | `AsBuiltWbsLinkResponse` |
| `unlinkDocument` | UUID linkId | `void` |
| `getProjectProgress` | UUID projectId | `List<AsBuiltWbsProgressResponse>` |
| `checkQualityGate` | UUID wbsNodeId | `boolean` |

---

### CommissioningChecklistService (`modules/closeout/service/CommissioningChecklistService.java`)

**Dependencies:**
- Repositories: CommissioningChecklistRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, ChecklistStatus status, String system, Pageable pageable | `Page<CommissioningChecklistResponse>` |
| `findById` | UUID id | `CommissioningChecklistResponse` |
| `create` | CreateCommissioningChecklistRequest request | `CommissioningChecklistResponse` |
| `update` | UUID id, UpdateCommissioningChecklistRequest request | `CommissioningChecklistResponse` |
| `delete` | UUID id | `void` |

---

### CommissioningEnhancedService (`modules/closeout/service/CommissioningEnhancedService.java`)

**Dependencies:**
- Repositories: CommissioningChecklistTemplateRepository, CommissioningSignOffRepository, ZosDocumentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAllTemplates` | Pageable pageable | `Page<CommissioningTemplateResponse>` |
| `findTemplatesBySystem` | String system | `List<CommissioningTemplateResponse>` |
| `findOrgDefaultTemplates` |  | `List<CommissioningTemplateResponse>` |
| `findTemplateById` | UUID id | `CommissioningTemplateResponse` |
| `createTemplate` | CreateCommissioningTemplateRequest request | `CommissioningTemplateResponse` |
| `updateTemplate` | UUID id, CreateCommissioningTemplateRequest request | `CommissioningTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |
| `findSignOffs` | UUID checklistId | `List<CommissioningSignOffResponse>` |
| `createSignOff` | CreateCommissioningSignOffRequest request | `CommissioningSignOffResponse` |
| `updateSignOffDecision` | UUID signOffId, SignOffDecision decision, String comments | `CommissioningSignOffResponse` |
| `deleteSignOff` | UUID signOffId | `void` |
| `findAllZos` | Pageable pageable | `Page<ZosDocumentResponse>` |
| `findZosByProject` | UUID projectId | `List<ZosDocumentResponse>` |
| `findZosById` | UUID id | `ZosDocumentResponse` |
| `createZos` | CreateZosDocumentRequest request | `ZosDocumentResponse` |
| `updateZos` | UUID id, CreateZosDocumentRequest request | `ZosDocumentResponse` |
| `changeZosStatus` | UUID id, ZosStatus newStatus | `ZosDocumentResponse` |
| `deleteZos` | UUID id | `void` |

---

### HandoverPackageService (`modules/closeout/service/HandoverPackageService.java`)

**Dependencies:**
- Repositories: HandoverPackageRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, HandoverStatus status, Pageable pageable | `Page<HandoverPackageResponse>` |
| `findById` | UUID id | `HandoverPackageResponse` |
| `create` | CreateHandoverPackageRequest request | `HandoverPackageResponse` |
| `update` | UUID id, UpdateHandoverPackageRequest request | `HandoverPackageResponse` |
| `delete` | UUID id | `void` |

---

### WarrantyClaimService (`modules/closeout/service/WarrantyClaimService.java`)

**Dependencies:**
- Repositories: WarrantyClaimRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, WarrantyClaimStatus status, UUID handoverPackageId, Pageable ... | `Page<WarrantyClaimResponse>` |
| `findById` | UUID id | `WarrantyClaimResponse` |
| `create` | CreateWarrantyClaimRequest request | `WarrantyClaimResponse` |
| `update` | UUID id, UpdateWarrantyClaimRequest request | `WarrantyClaimResponse` |
| `delete` | UUID id | `void` |

---

### WarrantyObligationService (`modules/closeout/service/WarrantyObligationService.java`)

**Dependencies:**
- Repositories: WarrantyClaimRepository, WarrantyObligationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | Pageable pageable | `Page<WarrantyObligationResponse>` |
| `findByProject` | UUID projectId | `List<WarrantyObligationResponse>` |
| `findById` | UUID id | `WarrantyObligationResponse` |
| `create` | CreateWarrantyObligationRequest request | `WarrantyObligationResponse` |
| `update` | UUID id, UpdateWarrantyObligationRequest request | `WarrantyObligationResponse` |
| `delete` | UUID id | `void` |
| `getDashboardSummary` |  | `WarrantyDashboardResponse` |
| `WarrantyDashboardResponse` | long totalActive, long totalExpiringSoon, long totalExpired, List<WarrantyObl... | `record` |

---

## Module: closing

### ClosingDocumentService (`modules/closing/service/ClosingDocumentService.java`)

**Dependencies:**
- Repositories: Ks2DocumentRepository, Ks2LineRepository, Ks3DocumentRepository, Ks3Ks2LinkRepository
- Services: AuditService, BudgetItemSyncService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listKs2` | UUID projectId, UUID contractId, ClosingDocumentStatus status, Pageable pageable | `Page<Ks2ListResponse>` |
| `getKs2` | UUID id | `Ks2Response` |
| `createKs2` | CreateKs2Request request | `Ks2Response` |
| `updateKs2` | UUID id, UpdateKs2Request request | `Ks2Response` |
| `getKs2Lines` | UUID ks2Id | `List<Ks2LineResponse>` |
| `addKs2Line` | UUID ks2Id, CreateKs2LineRequest request | `Ks2LineResponse` |
| `updateKs2Line` | UUID lineId, UpdateKs2LineRequest request | `Ks2LineResponse` |
| `removeKs2Line` | UUID lineId | `void` |
| `submitKs2` | UUID id | `Ks2Response` |
| `signKs2` | UUID id | `Ks2Response` |
| `closeKs2` | UUID id | `Ks2Response` |
| `recalculateKs2Totals` | UUID ks2Id | `void` |
| `listKs3` | UUID projectId, UUID contractId, ClosingDocumentStatus status, Pageable pageable | `Page<Ks3ListResponse>` |
| `getKs3` | UUID id | `Ks3Response` |
| `createKs3` | CreateKs3Request request | `Ks3Response` |
| `updateKs3` | UUID id, UpdateKs3Request request | `Ks3Response` |
| `linkKs2ToKs3` | UUID ks3Id, UUID ks2Id | `Ks3Response` |
| `unlinkKs2FromKs3` | UUID ks3Id, UUID ks2Id | `Ks3Response` |
| `autoFillKs2` | UUID ks3Id | `Ks3Response` |
| `submitKs3` | UUID id | `Ks3Response` |
| `signKs3` | UUID id | `Ks3Response` |
| `closeKs3` | UUID id | `Ks3Response` |
| `recalculateKs3Totals` | UUID ks3Id | `void` |
| `getKs6aEntries` | java.util.UUID projectId, Integer year | `List<com.privod.platform.modules.closing.web.dto.Ks6aEntryResponse>` |
| `getCorrectionActs` |  | `List<com.privod.platform.modules.closing.web.dto.CorrectionActResponse>` |
| `createCorrectionAct` | com.privod.platform.modules.closing.web.dto.CreateCorrectionActRequest request | `com.privod.platform.modules.closing.web.dto.CorrectionActResponse` |

---

### Ks2PipelineService (`modules/closing/service/Ks2PipelineService.java`)

**Dependencies:**
- Repositories: ContractRepository, DailyLogEntryRepository, DailyLogRepository, Ks2DocumentRepository, Ks2LineRepository, ProjectRepository, SpecItemRepository
- Services: AuditService, ClosingDocumentService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `collectVolumes` | UUID projectId, YearMonth yearMonth | `List<VolumeEntry>` |
| `generateKs2` | UUID projectId, UUID contractId, YearMonth yearMonth | `Ks2Response` |
| `batchGenerateKs2` | UUID projectId, YearMonth yearMonth | `List<Ks2Response>` |
| `getPipelinePreview` | UUID projectId, UUID contractId, YearMonth yearMonth | `PipelinePreviewResponse` |

---

### KsOneCExportService (`modules/closing/service/KsOneCExportService.java`)

**Dependencies:**
- Repositories: Ks2DocumentRepository, Ks2LineRepository, Ks3DocumentRepository, Ks3Ks2LinkRepository, OneCConfigRepository, OneCMappingRepository
- Services: ObjectMapper, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `exportSignedKs2Async` | UUID ks2Id | `void` |
| `exportSignedKs3Async` | UUID ks3Id | `void` |
| `exportKs2` | UUID ks2Id | `void` |
| `exportKs3` | UUID ks3Id | `void` |
| `syncPostingStatuses` |  | `void` |

---

## Module: common

### FileAttachmentService (`modules/common/service/FileAttachmentService.java`)

**Dependencies:**
- Repositories: FileAttachmentRepository
- Services: StorageService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAttachments` | String entityType, UUID entityId | `List<FileAttachmentResponse>` |
| `createAttachment` | CreateFileAttachmentRequest request | `FileAttachmentResponse` |
| `uploadAttachment` | MultipartFile file, String entityType, UUID entityId, String description | `FileAttachmentResponse` |
| `getDownloadUrl` | UUID attachmentId | `String` |
| `deleteAttachment` | UUID id | `void` |

---

## Module: compliance

### PrivacyComplianceService (`modules/compliance/service/PrivacyComplianceService.java`)

**Dependencies:**
- Repositories: DataConsentRepository, DataSubjectRequestRepository, EmployeeRepository, PiiAccessLogRepository, PrivacyPolicyRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `grantConsent` | CreateDataConsentRequest request | `DataConsentResponse` |
| `revokeConsent` | UUID consentId | `DataConsentResponse` |
| `getUserConsents` | UUID userId | `List<DataConsentResponse>` |
| `listConsents` | Pageable pageable | `Page<DataConsentResponse>` |
| `createSubjectRequest` | CreateDataSubjectRequestRequest request | `DataSubjectRequestResponse` |
| `processSubjectRequest` | UUID requestId, ProcessSubjectRequestRequest request | `DataSubjectRequestResponse` |
| `getOverdueRequests` |  | `List<DataSubjectRequestResponse>` |
| `listSubjectRequests` | SubjectRequestStatus status, Pageable pageable | `Page<DataSubjectRequestResponse>` |
| `getSubjectRequest` | UUID requestId | `DataSubjectRequestResponse` |
| `executeDataDeletion` | UUID userId | `void` |
| `createPrivacyPolicy` | CreatePrivacyPolicyRequest request | `PrivacyPolicyResponse` |
| `getCurrentPolicy` |  | `PrivacyPolicyResponse` |
| `listPolicies` | Pageable pageable | `Page<PrivacyPolicyResponse>` |
| `logPiiAccess` | String entityType, UUID entityId, String fieldName, PiiAccessType accessType | `void` |
| `getPiiAccessLog` | UUID entityId, String entityType, UUID userId, Pageable pageable | `Page<PiiAccessLogResponse>` |
| `getComplianceDashboard` |  | `ComplianceDashboardResponse` |

---

## Module: constructability

### ConstructabilityService (`modules/constructability/service/ConstructabilityService.java`)

**Dependencies:**
- Repositories: ConstructabilityItemRepository, ConstructabilityReviewRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<ConstructabilityReviewResponse>` |
| `getById` | UUID id | `ConstructabilityReviewResponse` |
| `create` | CreateConstructabilityReviewRequest req | `ConstructabilityReviewResponse` |
| `update` | UUID id, UpdateConstructabilityReviewRequest req | `ConstructabilityReviewResponse` |
| `deleteReview` | UUID id | `void` |
| `listItems` | UUID reviewId | `List<ConstructabilityItemResponse>` |
| `addItem` | UUID reviewId, CreateConstructabilityItemRequest req | `ConstructabilityItemResponse` |
| `updateItem` | UUID reviewId, UUID itemId, UpdateConstructabilityItemRequest req | `ConstructabilityItemResponse` |
| `deleteItem` | UUID reviewId, UUID itemId | `void` |

---

## Module: contract

### ContractBudgetItemService (`modules/contract/service/ContractBudgetItemService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, ContractBudgetItemRepository, ContractRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `linkBudgetItems` | UUID contractId, LinkBudgetItemsRequest request | `List<ContractBudgetItemResponse>` |
| `getLinkedItems` | UUID contractId | `List<ContractBudgetItemResponse>` |
| `updateLinkedItem` | UUID contractId, UUID linkId, UpdateContractBudgetItemRequest request | `ContractBudgetItemResponse` |
| `unlinkBudgetItem` | UUID contractId, UUID linkId | `void` |
| `getContractsForBudgetItem` | UUID budgetItemId | `List<ContractBudgetItemResponse>` |
| `getCoverage` | UUID budgetItemId | `BudgetItemCoverageResponse` |

---

### ContractService (`modules/contract/service/ContractService.java`)

**Dependencies:**
- Repositories: ContractApprovalRepository, ContractRepository, ContractTypeRepository, ProjectRepository
- Services: AuditService, BudgetItemSyncService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listContracts` | String search, ContractStatus status, UUID projectId, UUID partnerId, Contrac... | `Page<ContractResponse>` |
| `getContract` | UUID id | `ContractResponse` |
| `createContract` | CreateContractRequest request | `ContractResponse` |
| `updateContract` | UUID id, UpdateContractRequest request | `ContractResponse` |
| `changeStatus` | UUID id, ChangeContractStatusRequest request | `ContractResponse` |
| `submitForApproval` | UUID id | `ContractResponse` |
| `approveContract` | UUID id, ApproveContractRequest request | `ContractResponse` |
| `rejectContract` | UUID id, RejectContractRequest request | `ContractResponse` |
| `signContract` | UUID id | `ContractResponse` |
| `activateContract` | UUID id | `ContractResponse` |
| `closeContract` | UUID id | `ContractResponse` |
| `createVersion` | UUID id, String comment | `ContractResponse` |
| `getDashboardSummary` | UUID projectId | `ContractDashboardResponse` |
| `getApprovals` | UUID contractId | `List<com.privod.platform.modules.contract.web.dto.ContractApprovalResponse>` |

---

### ContractTypeService (`modules/contract/service/ContractTypeService.java`)

**Dependencies:**
- Repositories: ContractTypeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTypes` |  | `List<ContractTypeResponse>` |
| `createType` | CreateContractTypeRequest request | `ContractTypeResponse` |
| `updateType` | UUID id, CreateContractTypeRequest request | `ContractTypeResponse` |

---

## Module: contractExt

### ContractClaimService (`modules/contractExt/service/ContractClaimService.java`)

**Dependencies:**
- Repositories: ContractClaimRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByContract` | UUID contractId, Pageable pageable | `Page<ContractClaimResponse>` |
| `getById` | UUID id | `ContractClaimResponse` |
| `create` | CreateClaimRequest request | `ContractClaimResponse` |
| `changeStatus` | UUID id, ClaimStatus newStatus, String responseText | `ContractClaimResponse` |

---

### ContractExtService (`modules/contractExt/service/ContractExtService.java`)

**Dependencies:**
- Repositories: ContractGuaranteeRepository, ContractInsuranceRepository, ContractMilestoneRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listGuarantees` | UUID contractId, Pageable pageable | `Page<ContractGuaranteeResponse>` |
| `createGuarantee` | UUID contractId, GuaranteeType guaranteeType, BigDecimal amount, String curre... | `ContractGuaranteeResponse` |
| `listMilestones` | UUID contractId, Pageable pageable | `Page<ContractMilestoneResponse>` |
| `createMilestone` | UUID contractId, String name, String description, LocalDate dueDate, String c... | `ContractMilestoneResponse` |
| `completeMilestone` | UUID id, String evidenceUrl | `ContractMilestoneResponse` |
| `listInsurances` | UUID contractId, Pageable pageable | `Page<ContractInsuranceResponse>` |
| `createInsurance` | UUID contractId, String policyNumber, String insuranceType, String insurer, B... | `ContractInsuranceResponse` |

---

### ContractSlaService (`modules/contractExt/service/ContractSlaService.java`)

**Dependencies:**
- Repositories: ContractSlaRepository, SlaViolationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByContract` | UUID contractId, Pageable pageable | `Page<ContractSlaResponse>` |
| `getById` | UUID id | `ContractSlaResponse` |
| `create` | CreateSlaRequest request | `ContractSlaResponse` |
| `deactivate` | UUID id | `ContractSlaResponse` |
| `listViolations` | UUID slaId, Pageable pageable | `Page<SlaViolationResponse>` |
| `createViolation` | CreateSlaViolationRequest request | `SlaViolationResponse` |
| `resolveViolation` | UUID violationId | `SlaViolationResponse` |

---

### ContractSupplementService (`modules/contractExt/service/ContractSupplementService.java`)

**Dependencies:**
- Repositories: ContractSupplementRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByContract` | UUID contractId, Pageable pageable | `Page<ContractSupplementResponse>` |
| `getById` | UUID id | `ContractSupplementResponse` |
| `create` | CreateSupplementRequest request | `ContractSupplementResponse` |
| `approve` | UUID id | `ContractSupplementResponse` |
| `sign` | UUID id | `ContractSupplementResponse` |

---

### ContractToleranceService (`modules/contractExt/service/ContractToleranceService.java`)

**Dependencies:**
- Repositories: ContractToleranceCheckRepository, ToleranceRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<ToleranceResponse>` |
| `listByProject` | UUID projectId, Pageable pageable | `Page<ToleranceResponse>` |
| `getById` | UUID id | `ToleranceResponse` |
| `create` | CreateToleranceRequest request | `ToleranceResponse` |
| `listChecks` | UUID toleranceId, Pageable pageable | `Page<ToleranceCheckResponse>` |
| `createCheck` | CreateToleranceCheckRequest request | `ToleranceCheckResponse` |

---

### LegalCaseService (`modules/contractExt/service/LegalCaseService.java`)

**Dependencies:**
- Repositories: ContractLegalCaseRepository, LegalDocumentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<LegalCaseResponse>` |
| `listByContract` | UUID contractId, Pageable pageable | `Page<LegalCaseResponse>` |
| `getById` | UUID id | `LegalCaseResponse` |
| `create` | CreateLegalCaseRequest request | `LegalCaseResponse` |
| `changeStatus` | UUID id, CaseStatus newStatus | `LegalCaseResponse` |
| `listDocuments` | UUID caseId | `List<LegalDocumentResponse>` |
| `createDocument` | CreateLegalDocumentRequest request | `LegalDocumentResponse` |

---

## Module: costManagement

### BudgetLineService (`modules/costManagement/service/BudgetLineService.java`)

**Dependencies:**
- Repositories: BudgetLineRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<BudgetLineResponse>` |
| `listAllByProject` | UUID projectId | `List<BudgetLineResponse>` |
| `getById` | UUID id | `BudgetLineResponse` |
| `create` | CreateBudgetLineRequest request | `BudgetLineResponse` |
| `update` | UUID id, UpdateBudgetLineRequest request | `BudgetLineResponse` |
| `getTotalOriginalBudget` | UUID projectId | `BigDecimal` |
| `getTotalRevisedBudget` | UUID projectId | `BigDecimal` |
| `getTotalActualCost` | UUID projectId | `BigDecimal` |
| `getTotalVariance` | UUID projectId | `BigDecimal` |
| `delete` | UUID id | `void` |

---

### CashFlowForecastEnhancedService (`modules/costManagement/service/CashFlowForecastEnhancedService.java`)

**Dependencies:**
- Repositories: CashFlowForecastBucketRepository, CashFlowScenarioRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `VarianceSummary` | BigDecimal totalForecastNet, BigDecimal totalActualNet, BigDecimal totalVaria... | `record` |
| `findAllScenarios` | Pageable pageable | `Page<CashFlowScenarioResponse>` |
| `findScenarioById` | UUID id | `CashFlowScenarioResponse` |
| `findScenariosByProject` | UUID projectId | `List<CashFlowScenarioResponse>` |
| `createScenario` | CreateCashFlowScenarioRequest request | `CashFlowScenarioResponse` |
| `updateScenario` | UUID id, CreateCashFlowScenarioRequest request | `CashFlowScenarioResponse` |
| `deleteScenario` | UUID id | `void` |
| `generateForecast` | UUID scenarioId | `List<CashFlowForecastBucketResponse>` |
| `getForecastBuckets` | UUID scenarioId | `List<CashFlowForecastBucketResponse>` |
| `getVarianceSummary` | UUID scenarioId | `VarianceSummary` |

---

### CashFlowProjectionService (`modules/costManagement/service/CashFlowProjectionService.java`)

**Dependencies:**
- Repositories: CashFlowProjectionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<CashFlowProjectionResponse>` |
| `getById` | UUID id | `CashFlowProjectionResponse` |
| `listByDateRange` | UUID projectId, LocalDate startDate, LocalDate endDate | `List<CashFlowProjectionResponse>` |
| `create` | CreateCashFlowProjectionRequest request | `CashFlowProjectionResponse` |
| `update` | UUID id, UpdateCashFlowProjectionRequest request | `CashFlowProjectionResponse` |
| `delete` | UUID id | `void` |

---

### CommitmentService (`modules/costManagement/service/CommitmentService.java`)

**Dependencies:**
- Repositories: CommitmentItemRepository, CommitmentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, CommitmentStatus status, Pageable pageable | `Page<CommitmentResponse>` |
| `getById` | UUID id | `CommitmentResponse` |
| `create` | CreateCommitmentRequest request | `CommitmentResponse` |
| `update` | UUID id, UpdateCommitmentRequest request | `CommitmentResponse` |
| `changeStatus` | UUID id, ChangeCommitmentStatusRequest request | `CommitmentResponse` |
| `addChangeOrder` | UUID id, BigDecimal changeOrderAmount | `CommitmentResponse` |
| `listItems` | UUID commitmentId | `List<CommitmentItemResponse>` |
| `addItem` | UUID commitmentId, CreateCommitmentItemRequest request | `CommitmentItemResponse` |
| `deleteItem` | UUID itemId | `void` |
| `delete` | UUID id | `void` |

---

### CostCodeService (`modules/costManagement/service/CostCodeService.java`)

**Dependencies:**
- Repositories: CostCodeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<CostCodeResponse>` |
| `listAllByProject` | UUID projectId | `List<CostCodeResponse>` |
| `getById` | UUID id | `CostCodeResponse` |
| `getChildren` | UUID parentId | `List<CostCodeResponse>` |
| `create` | CreateCostCodeRequest request | `CostCodeResponse` |
| `update` | UUID id, UpdateCostCodeRequest request | `CostCodeResponse` |
| `delete` | UUID id | `void` |

---

### CostForecastService (`modules/costManagement/service/CostForecastService.java`)

**Dependencies:**
- Repositories: CostForecastRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId, Pageable pageable | `Page<CostForecastResponse>` |
| `getById` | UUID id | `CostForecastResponse` |
| `getLatest` | UUID projectId | `CostForecastResponse` |
| `listByDateRange` | UUID projectId, LocalDate startDate, LocalDate endDate | `List<CostForecastResponse>` |
| `create` | CreateCostForecastRequest request | `CostForecastResponse` |
| `createSnapshot` | UUID projectId, BigDecimal bac, BigDecimal ev, BigDecimal pv, BigDecimal ac, ... | `CostForecastResponse` |
| `update` | UUID id, CreateCostForecastRequest request | `CostForecastResponse` |
| `delete` | UUID id | `void` |

---

### ProfitabilityForecastService (`modules/costManagement/service/ProfitabilityForecastService.java`)

**Dependencies:**
- Repositories: EvmSnapshotRepository, ProfitabilityForecastRepository, ProfitabilitySnapshotRepository, ProjectRepository
- Services: AuditService, ProjectFinancialService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | Pageable pageable | `Page<ProfitabilityForecastResponse>` |
| `findByProject` | UUID projectId | `ProfitabilityForecastResponse` |
| `findByRiskLevel` | ProfitabilityRiskLevel riskLevel, Pageable pageable | `Page<ProfitabilityForecastResponse>` |
| `getSnapshots` | UUID projectId | `List<ProfitabilitySnapshotResponse>` |
| `getPortfolioSummary` |  | `ProfitabilityPortfolioResponse` |
| `recalculate` | UUID projectId | `ProfitabilityForecastResponse` |
| `recalculateAll` |  | `void` |
| `deleteForProject` | UUID projectId | `void` |

---

## Module: crm

### CrmService (`modules/crm/service/CrmService.java`)

**Dependencies:**
- Repositories: CrmActivityRepository, CrmLeadRepository, CrmStageRepository, CrmTeamRepository, ProjectRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listLeads` | String search, LeadStatus status, UUID stageId, UUID assignedToId, Pageable p... | `Page<CrmLeadResponse>` |
| `getLead` | UUID id | `CrmLeadResponse` |
| `createLead` | CreateCrmLeadRequest request | `CrmLeadResponse` |
| `updateLead` | UUID id, UpdateCrmLeadRequest request | `CrmLeadResponse` |
| `moveToStage` | UUID leadId, UUID stageId | `CrmLeadResponse` |
| `convertToProject` | UUID leadId, ConvertToProjectRequest request | `CrmLeadResponse` |
| `markAsWon` | UUID leadId | `CrmLeadResponse` |
| `markAsLost` | UUID leadId, String reason | `CrmLeadResponse` |
| `deleteLead` | UUID id | `void` |
| `listStages` |  | `List<CrmStageResponse>` |
| `createStage` | CreateCrmStageRequest request | `CrmStageResponse` |
| `listTeams` |  | `List<CrmTeamResponse>` |
| `createTeam` | CreateCrmTeamRequest request | `CrmTeamResponse` |
| `getLeadActivities` | UUID leadId | `List<CrmActivityResponse>` |
| `createActivity` | CreateCrmActivityRequest request | `CrmActivityResponse` |
| `completeActivity` | UUID activityId, String result | `CrmActivityResponse` |
| `getPipelineStats` |  | `CrmPipelineResponse` |

---

## Module: dailylog

### DailyLogEntryService (`modules/dailylog/service/DailyLogEntryService.java`)

**Dependencies:**
- Repositories: DailyLogEntryRepository, DailyLogRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listEntries` | UUID dailyLogId, Pageable pageable | `Page<DailyLogEntryResponse>` |
| `listAllEntries` | UUID dailyLogId | `List<DailyLogEntryResponse>` |
| `getEntry` | UUID dailyLogId, UUID entryId | `DailyLogEntryResponse` |
| `createEntry` | UUID dailyLogId, CreateDailyLogEntryRequest request | `DailyLogEntryResponse` |
| `updateEntry` | UUID dailyLogId, UUID entryId, UpdateDailyLogEntryRequest request | `DailyLogEntryResponse` |
| `deleteEntry` | UUID dailyLogId, UUID entryId | `void` |

---

### DailyLogService (`modules/dailylog/service/DailyLogService.java`)

**Dependencies:**
- Repositories: DailyLogPhotoRepository, DailyLogRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listLogs` | UUID projectId, Pageable pageable | `Page<DailyLogResponse>` |
| `getLog` | UUID id | `DailyLogResponse` |
| `getLogByProjectAndDate` | UUID projectId, LocalDate date | `DailyLogResponse` |
| `createLog` | CreateDailyLogRequest request | `DailyLogResponse` |
| `updateLog` | UUID id, UpdateDailyLogRequest request | `DailyLogResponse` |
| `submitLog` | UUID id | `DailyLogResponse` |
| `approveLog` | UUID id | `DailyLogResponse` |
| `getByDateRange` | UUID projectId, LocalDate startDate, LocalDate endDate | `List<DailyLogResponse>` |
| `getProjectTimeline` | UUID projectId | `List<DailyLogResponse>` |
| `deleteLog` | UUID id | `void` |
| `listPhotos` | UUID dailyLogId, Pageable pageable | `Page<DailyLogPhotoResponse>` |
| `addPhoto` | UUID dailyLogId, CreateDailyLogPhotoRequest request | `DailyLogPhotoResponse` |
| `deletePhoto` | UUID dailyLogId, UUID photoId | `void` |

---

## Module: dataExchange

### ExportJobService (`modules/dataExchange/service/ExportJobService.java`)

**Dependencies:**
- Repositories: ExportJobRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String entityType, ExportFormat format, UUID projectId, Pageable pageable | `Page<ExportJobResponse>` |
| `findById` | UUID id | `ExportJobResponse` |
| `create` | CreateExportJobRequest request | `ExportJobResponse` |
| `update` | UUID id, UpdateExportJobRequest request | `ExportJobResponse` |
| `delete` | UUID id | `void` |

---

### ImportJobService (`modules/dataExchange/service/ImportJobService.java`)

**Dependencies:**
- Repositories: ImportJobRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String entityType, ImportStatus status, UUID projectId, Pageable pageable | `Page<ImportJobResponse>` |
| `findById` | UUID id | `ImportJobResponse` |
| `create` | CreateImportJobRequest request | `ImportJobResponse` |
| `update` | UUID id, UpdateImportJobRequest request | `ImportJobResponse` |
| `cancel` | UUID id | `ImportJobResponse` |
| `delete` | UUID id | `void` |

---

### ImportMappingService (`modules/dataExchange/service/ImportMappingService.java`)

**Dependencies:**
- Repositories: ImportMappingRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String entityType, Pageable pageable | `Page<ImportMappingResponse>` |
| `findById` | UUID id | `ImportMappingResponse` |
| `create` | CreateImportMappingRequest request | `ImportMappingResponse` |
| `update` | UUID id, UpdateImportMappingRequest request | `ImportMappingResponse` |
| `delete` | UUID id | `void` |

---

## Module: design

### DesignService (`modules/design/service/DesignService.java`)

**Dependencies:**
- Repositories: DesignReviewRepository, DesignSectionRepository, DesignVersionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listVersions` | UUID projectId, DesignVersionStatus status, Pageable pageable | `Page<DesignVersionResponse>` |
| `getVersion` | UUID id | `DesignVersionResponse` |
| `getVersionsByDocument` | UUID documentId | `List<DesignVersionResponse>` |
| `createVersion` | CreateDesignVersionRequest request | `DesignVersionResponse` |
| `updateVersion` | UUID id, CreateDesignVersionRequest request | `DesignVersionResponse` |
| `transitionVersionStatus` | UUID id, DesignVersionStatus targetStatus | `DesignVersionResponse` |
| `deleteVersion` | UUID id | `void` |
| `getReviewsForVersion` | UUID designVersionId | `List<DesignReviewResponse>` |
| `listReviews` | Pageable pageable | `Page<DesignReviewResponse>` |
| `createReview` | CreateDesignReviewRequest request | `DesignReviewResponse` |
| `completeReview` | UUID id, DesignReviewStatus targetStatus, String comments | `DesignReviewResponse` |
| `getSectionsForProject` | UUID projectId | `List<DesignSectionResponse>` |
| `getRootSectionsForProject` | UUID projectId | `List<DesignSectionResponse>` |
| `getChildSections` | UUID parentId | `List<DesignSectionResponse>` |
| `createSection` | CreateDesignSectionRequest request | `DesignSectionResponse` |
| `updateSection` | UUID id, CreateDesignSectionRequest request | `DesignSectionResponse` |
| `deleteSection` | UUID id | `void` |

---

## Module: document

### DocumentService (`modules/document/service/DocumentService.java`)

**Dependencies:**
- Repositories: ContractRepository, DocumentAccessRepository, DocumentCommentRepository, DocumentRepository, ProjectRepository, UserRepository
- Services: AuditService, StorageService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDocuments` | UUID projectId, DocumentCategory category, DocumentStatus status, String sear... | `Page<DocumentResponse>` |
| `getDocument` | UUID id | `DocumentResponse` |
| `uploadFile` | UUID id, MultipartFile file | `DocumentResponse` |
| `getDownloadUrl` | UUID id | `String` |
| `createDocument` | CreateDocumentRequest request | `DocumentResponse` |
| `updateDocument` | UUID id, UpdateDocumentRequest request | `DocumentResponse` |
| `changeStatus` | UUID id, ChangeDocumentStatusRequest request | `DocumentResponse` |
| `createVersion` | UUID id | `DocumentResponse` |
| `addComment` | UUID documentId, AddDocumentCommentRequest request | `DocumentCommentResponse` |
| `grantAccess` | UUID documentId, GrantAccessRequest request | `DocumentAccessResponse` |
| `revokeAccess` | UUID documentId, UUID userId | `void` |
| `getDocumentHistory` | UUID documentId | `List<DocumentResponse>` |
| `getProjectDocuments` | UUID projectId, DocumentCategory category | `List<DocumentResponse>` |
| `searchDocuments` | String query, UUID projectId, Pageable pageable | `Page<DocumentResponse>` |
| `getExpiringDocuments` | int daysAhead | `List<DocumentResponse>` |

---

### DrawingMarkupService (`modules/document/service/DrawingMarkupService.java`)

**Dependencies:**
- Repositories: DrawingMarkupRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listMarkups` | UUID documentId, Integer pageNumber | `List<DrawingMarkupResponse>` |
| `getMarkup` | UUID documentId, UUID id | `DrawingMarkupResponse` |
| `createMarkup` | UUID documentId, CreateDrawingMarkupRequest request | `DrawingMarkupResponse` |
| `updateMarkup` | UUID documentId, UUID id, UpdateDrawingMarkupRequest request | `DrawingMarkupResponse` |
| `deleteMarkup` | UUID documentId, UUID id | `void` |

---

## Module: email

### EmailComposeService (`modules/email/service/EmailComposeService.java`)

**Dependencies:**
- Repositories: EmailAttachmentRepository, EmailMessageRepository
- Services: ObjectMapper
- Other: EmailImapSmtpConfig

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `sendEmail` | List<String> to, List<String> cc, String subject, String bodyHtml | `EmailMessage` |
| `replyToEmail` | UUID originalId, String bodyHtml, boolean replyAll | `EmailMessage` |
| `forwardEmail` | UUID originalId, List<String> to, List<String> cc, String bodyHtml | `EmailMessage` |

---

### EmailMailboxService (`modules/email/service/EmailMailboxService.java`)

**Dependencies:**
- Repositories: EmailAttachmentRepository, EmailMessageRepository, EmailProjectLinkRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listMessages` | String folder, String search, Pageable pageable | `Page<EmailMessageResponse>` |
| `getMessage` | UUID id | `EmailMessageResponse` |
| `markRead` | UUID id | `void` |
| `markUnread` | UUID id | `void` |
| `star` | UUID id | `void` |
| `unstar` | UUID id | `void` |
| `deleteMessage` | UUID id | `void` |
| `linkProject` | UUID emailId, UUID projectId | `void` |
| `unlinkProject` | UUID emailId, UUID projectId | `void` |
| `getProjectMessages` | UUID projectId | `List<EmailMessageResponse>` |
| `getUnreadCount` |  | `long` |
| `getAttachmentPath` | UUID emailId, UUID attachmentId | `String` |

---

### EmailNotificationService (`modules/email/service/EmailNotificationService.java`)

**Dependencies:**
- Repositories: EmailLogRepository
- Other: JavaMailSender

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `sendTaskAssigned` | User assignee, ProjectTask task | `void` |
| `sendApprovalRequired` | User approver, String entityType, UUID entityId | `void` |
| `sendBudgetAlert` | User manager, Budget budget, String alertType | `void` |
| `sendSafetyAlert` | List<User> recipients, String alertMessage | `void` |
| `sendPasswordReset` | User user, String resetToken | `void` |
| `sendWelcome` | User user | `void` |

---

### EmailSyncService (`modules/email/service/EmailSyncService.java`)

**Dependencies:**
- Repositories: EmailMessageRepository
- Services: ObjectMapper, TransactionTemplate
- Other: EmailImapSmtpConfig, EntityManager

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `scheduledSync` |  | `void` |
| `syncAllFoldersFull` |  | `int` |
| `syncAllFolders` |  | `int` |
| `syncFolder` | String folderName | `int` |

---

## Module: esg

### EsgService (`modules/esg/service/EsgService.java`)

**Dependencies:**
- Repositories: EsgReportRepository, MaterialGwpEntryRepository, MaterialRepository, ProjectCarbonFootprintRepository, ProjectRepository, StockEntryRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listGwpEntries` | EsgMaterialCategory category, Pageable pageable | `Page<MaterialGwpEntryResponse>` |
| `getGwpEntry` | UUID id | `MaterialGwpEntryResponse` |
| `createGwpEntry` | CreateGwpEntryRequest request | `MaterialGwpEntryResponse` |
| `deleteGwpEntry` | UUID id | `void` |
| `calculateProjectFootprint` | CalculateFootprintRequest request | `ProjectCarbonFootprintResponse` |
| `getProjectFootprint` | UUID projectId | `ProjectCarbonFootprintResponse` |
| `listProjectFootprints` | UUID projectId, Pageable pageable | `Page<ProjectCarbonFootprintResponse>` |
| `generateEsgReport` | GenerateEsgReportRequest request | `EsgReportResponse` |
| `getEsgReport` | UUID reportId | `EsgReportResponse` |
| `listEsgReports` | EsgReportType reportType, EsgReportStatus status, Pageable pageable | `Page<EsgReportResponse>` |
| `approveReport` | UUID reportId | `EsgReportResponse` |
| `deleteEsgReport` | UUID reportId | `void` |
| `getPortfolioSummary` |  | `PortfolioEsgSummaryResponse` |

---

## Module: estimate

### EstimateAdvancedService (`modules/estimate/service/EstimateAdvancedService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, ExportHistoryRepository, ImportHistoryRepository, LocalEstimateLineRepository, LocalEstimateRepository, VolumeCalculationRepository
- Services: ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `importEstimate` | MultipartFile file, String format | `ImportHistoryResponse` |
| `getImportHistory` |  | `List<ImportHistoryResponse>` |
| `validateForExport` | UUID estimateId | `ExportValidationResponse` |
| `exportEstimate` | UUID estimateId, ExportConfigRequest config | `byte[]` |
| `getExportHistory` |  | `List<ExportHistoryResponse>` |
| `calculateVolume` | VolumeCalculateRequest request | `VolumeCalculationResponse` |
| `saveCalculation` | VolumeSaveRequest request | `VolumeCalculationResponse` |
| `getSavedCalculations` | UUID projectId | `List<VolumeCalculationResponse>` |
| `getComparison` | UUID estimateId | `EstimateComparisonResponse` |
| `searchNormativeRates` | String query, String source | `List<NormativeRateSearchResponse>` |
| `importLsr` | ImportLsrRequest request | `ImportLsrResponse` |

---

### EstimateService (`modules/estimate/service/EstimateService.java`)

**Dependencies:**
- Repositories: EstimateItemRepository, EstimateRepository, EstimateVersionRepository, SpecItemRepository, SpecificationRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listEstimates` | UUID projectId, UUID specificationId, EstimateStatus status, Pageable pageable | `Page<EstimateListResponse>` |
| `getEstimate` | UUID id | `EstimateResponse` |
| `createEstimate` | CreateEstimateRequest request | `EstimateResponse` |
| `updateEstimate` | UUID id, UpdateEstimateRequest request | `EstimateResponse` |
| `changeStatus` | UUID id, ChangeEstimateStatusRequest request | `EstimateResponse` |
| `approveEstimate` | UUID id | `EstimateResponse` |
| `activateEstimate` | UUID id | `EstimateResponse` |
| `createFromSpecification` | CreateFromSpecRequest request | `EstimateResponse` |
| `addItem` | UUID estimateId, CreateEstimateItemRequest request | `EstimateItemResponse` |
| `updateItem` | UUID itemId, UpdateEstimateItemRequest request | `EstimateItemResponse` |
| `removeItem` | UUID itemId | `void` |
| `getItems` | UUID estimateId | `List<EstimateItemResponse>` |
| `recalculateTotals` | UUID estimateId | `EstimateResponse` |
| `createVersion` | UUID estimateId, CreateVersionRequest request | `void` |
| `getFinancialSummary` | UUID estimateId | `EstimateFinancialSummaryResponse` |
| `getProjectEstimateSummary` | UUID projectId | `EstimateFinancialSummaryResponse` |

---

### LocalEstimateService (`modules/estimate/service/LocalEstimateService.java`)

**Dependencies:**
- Repositories: LocalEstimateLineRepository, LocalEstimateRepository, MinstroyIndexImportRepository, NormativeSectionRepository, PriceIndexRepository, PriceRateRepository, RateResourceItemRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createEstimate` | CreateLocalEstimateRequest request | `LocalEstimateResponse` |
| `getEstimate` | UUID id | `LocalEstimateDetailResponse` |
| `listEstimates` | UUID projectId, LocalEstimateStatus status, Pageable pageable | `Page<LocalEstimateResponse>` |
| `addLine` | UUID estimateId, AddEstimateLineRequest request | `LocalEstimateLineResponse` |
| `removeLine` | UUID estimateId, UUID lineId | `void` |
| `calculateEstimate` | UUID estimateId | `LocalEstimateDetailResponse` |
| `approveEstimate` | UUID estimateId | `LocalEstimateResponse` |
| `deleteEstimate` | UUID id | `void` |
| `importMinstroyIndices` | ImportMinstroyIndicesRequest request | `int` |
| `getMinstroyIndices` | String region, int quarter, int year | `List<MinstroyIndexResponse>` |
| `applyMinstroyIndices` | UUID estimateId, ApplyMinstroyIndicesRequest request | `ApplyMinstroyIndicesResponse` |
| `getNormativeSections` | UUID databaseId, UUID parentId | `List<NormativeSectionResponse>` |
| `getRateResources` | UUID rateId | `List<RateResourceItemResponse>` |

---

### PriceSuggestionService (`modules/estimate/service/PriceSuggestionService.java`)

**Dependencies:**
- Repositories: EstimateItemRepository, ProjectRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getSuggestions` | String name | `PriceSuggestionResponse` |

---

## Module: feedback

### FeedbackService (`modules/feedback/service/FeedbackService.java`)

**Dependencies:**
- Repositories: UserFeedbackRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `submitFeedback` | SubmitFeedbackRequest request | `void` |
| `listFeedback` |  | `List<UserFeedback>` |
| `shouldShowFeedback` |  | `boolean` |
| `getStats` |  | `FeedbackStatsResponse` |

---

## Module: finance

### BankStatementService (`modules/finance/service/BankStatementService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `uploadAndParse` | MultipartFile file | `List<BankTransactionResponse>` |
| `confirmMatch` | UUID transactionId, UUID invoiceId | `BankTransactionResponse` |
| `rejectMatch` | UUID transactionId | `BankTransactionResponse` |

---

### BudgetItemSyncService (`modules/finance/service/BudgetItemSyncService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, ContractBudgetItemRepository, ContractRepository, InvoiceRepository, PaymentRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `onContractStatusChanged` | UUID contractId | `void` |
| `onKs2Signed` | UUID contractId | `void` |
| `onInvoiceCreated` | UUID contractId, BigDecimal amount | `void` |
| `onPaymentRegistered` | UUID contractId, BigDecimal amount | `void` |
| `onInvoiceFinancialStateChanged` | UUID contractId | `void` |
| `onPaymentFinancialStateChanged` | UUID contractId | `void` |
| `onInvoiceContractChanged` | UUID oldContractId, UUID newContractId | `void` |

---

### BudgetService (`modules/finance/service/BudgetService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, BudgetSnapshotRepository, ProjectRepository, SpecItemRepository
- Services: AuditService, BudgetSnapshotService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listBudgets` | UUID projectId, BudgetStatus status, Pageable pageable | `Page<BudgetResponse>` |
| `getBudget` | UUID id | `BudgetResponse` |
| `createBudget` | CreateBudgetRequest request | `BudgetResponse` |
| `updateBudget` | UUID id, UpdateBudgetRequest request | `BudgetResponse` |
| `approveBudget` | UUID id | `BudgetResponse` |
| `activateBudget` | UUID id | `BudgetResponse` |
| `freezeBudget` | UUID id | `BudgetResponse` |
| `closeBudget` | UUID id | `BudgetResponse` |
| `recalculateActuals` | UUID id | `BudgetResponse` |
| `getProjectBudgetSummary` | UUID projectId | `BudgetSummaryResponse` |
| `getBudgetItems` | UUID budgetId | `List<BudgetItemResponse>` |
| `getBudgetItemEntities` | UUID budgetId | `List<BudgetItem>` |
| `linkToWbsNode` | UUID budgetId, UUID itemId, UUID wbsNodeId | `BudgetItemResponse` |
| `addBudgetItem` | UUID budgetId, CreateBudgetItemRequest request | `BudgetItemResponse` |
| `updateBudgetItem` | UUID budgetId, UUID itemId, UpdateBudgetItemRequest request | `BudgetItemResponse` |
| `importFromEstimate` | UUID budgetId, UUID estimateId | `List<BudgetItemResponse>` |
| `deleteBudgetItem` | UUID budgetId, UUID itemId | `void` |
| `getExpenses` | UUID projectId, UUID budgetId, String disciplineMark, String docStatus, Pagea... | `Page<FinanceExpenseItemResponse>` |
| `generateOwnCostLines` | UUID budgetId | `List<BudgetItemResponse>` |
| `calculateROI` | UUID budgetId | `Map<String, Object>` |
| `simulateMarginScenario` | UUID budgetId, BigDecimal targetMarginPercent | `Map<String, Object>` |

---

### BudgetSnapshotService (`modules/finance/service/BudgetSnapshotService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, BudgetSnapshotRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createSnapshot` | UUID budgetId, String name, String notes | `BudgetSnapshotResponse` |
| `createSnapshot` | UUID budgetId, String name, BudgetSnapshot.SnapshotType snapshotType, UUID so... | `BudgetSnapshotResponse` |
| `listSnapshots` | UUID budgetId, Pageable pageable | `Page<BudgetSnapshotResponse>` |
| `compare` | UUID budgetId, UUID snapshotId, UUID targetSnapshotId | `SnapshotComparisonResponse` |
| `compareWithCurrent` | UUID snapshotId | `SnapshotComparisonResponse` |

---

### CashFlowService (`modules/finance/service/CashFlowService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, CashFlowEntryRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listEntries` | UUID projectId, Pageable pageable | `Page<CashFlowEntryResponse>` |
| `getEntry` | UUID id | `CashFlowEntryResponse` |
| `createEntry` | CreateCashFlowEntryRequest request | `CashFlowEntryResponse` |
| `deleteEntry` | UUID id | `void` |
| `getProjectCashFlow` | UUID projectId, LocalDate dateFrom, LocalDate dateTo | `List<CashFlowEntryResponse>` |
| `getCashFlowSummary` | UUID projectId | `CashFlowSummaryResponse` |
| `generateForecast` | UUID projectId, LocalDate startDate, LocalDate endDate, int paymentDelayDays,... | `List<CashFlowEntryResponse>` |

---

### CostCodeService (`modules/finance/service/CostCodeService.java`)

**Dependencies:**
- Repositories: CostCodeRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getAllCostCodes` | UUID parentId | `List<CostCodeResponse>` |
| `getTree` |  | `List<CostCodeResponse>` |
| `getCostCode` | UUID id | `CostCodeResponse` |
| `createCostCode` | CreateCostCodeRequest request | `CostCodeResponse` |
| `updateCostCode` | UUID id, UpdateCostCodeRequest request | `CostCodeResponse` |
| `deleteCostCode` | UUID id | `void` |
| `seedStandard` | String standard | `void` |

---

### FmDashboardService (`modules/finance/service/FmDashboardService.java`)

**Dependencies:**
- Services: BudgetService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getDashboard` | UUID budgetId | `FmDashboardResponse` |

---

### InvoiceMatchingEngine (`modules/finance/service/InvoiceMatchingEngine.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, InvoiceLineRepository, InvoiceRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `matchInvoiceToPositions` | UUID invoiceId, UUID budgetId | `List<InvoiceMatchCandidate>` |
| `validateThreeWayMatch` | UUID invoiceId | `ThreeWayMatchResult` |

---

### InvoiceMatchingService (`modules/finance/service/InvoiceMatchingService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, InvoiceLineRepository, InvoiceRepository, ProjectRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findMatchingInvoiceLines` | UUID budgetItemId, UUID projectId, UUID cpItemId | `List<InvoiceLineResponse>` |

---

### InvoiceService (`modules/finance/service/InvoiceService.java`)

**Dependencies:**
- Repositories: ContractRepository, InvoiceLineRepository, InvoiceRepository, PaymentRepository, ProjectRepository
- Services: AuditService, BudgetItemSyncService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listInvoices` | UUID projectId, InvoiceStatus status, InvoiceType invoiceType, Pageable pageable | `Page<InvoiceResponse>` |
| `getInvoice` | UUID id | `InvoiceResponse` |
| `createInvoice` | CreateInvoiceRequest request | `InvoiceResponse` |
| `updateInvoice` | UUID id, UpdateInvoiceRequest request | `InvoiceResponse` |
| `sendInvoice` | UUID id | `InvoiceResponse` |
| `registerPayment` | UUID id, BigDecimal amount | `InvoiceResponse` |
| `markOverdue` | UUID id | `InvoiceResponse` |
| `cancelInvoice` | UUID id | `InvoiceResponse` |
| `changeStatus` | UUID id, InvoiceStatus targetStatus | `InvoiceResponse` |
| `getProjectInvoiceSummary` | UUID projectId | `InvoiceSummaryResponse` |
| `getInvoiceLines` | UUID invoiceId | `List<InvoiceLineResponse>` |
| `getInvoicePayments` | UUID invoiceId | `List<PaymentResponse>` |
| `addInvoiceLine` | UUID invoiceId, CreateInvoiceLineRequest request | `InvoiceLineResponse` |
| `linkInvoiceLine` | UUID invoiceId, UUID lineId, com.privod.platform.modules.finance.web.dto.Link... | `InvoiceLineResponse` |
| `deleteInvoiceLine` | UUID invoiceId, UUID lineId | `void` |

---

### PaymentService (`modules/finance/service/PaymentService.java`)

**Dependencies:**
- Repositories: ContractRepository, InvoiceRepository, PaymentRepository, ProjectRepository
- Services: AuditService, BudgetItemSyncService
- Other: InvoiceMatchingEngine

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPayments` | UUID projectId, PaymentStatus status, PaymentType paymentType, Pageable pageable | `Page<PaymentResponse>` |
| `getPayment` | UUID id | `PaymentResponse` |
| `createPayment` | CreatePaymentRequest request | `PaymentResponse` |
| `updatePayment` | UUID id, UpdatePaymentRequest request | `PaymentResponse` |
| `approvePayment` | UUID id | `PaymentResponse` |
| `markPaid` | UUID id | `PaymentResponse` |
| `cancelPayment` | UUID id | `PaymentResponse` |
| `getProjectPaymentSummary` | UUID projectId | `PaymentSummaryResponse` |

---

### ProjectSectionService (`modules/finance/service/ProjectSectionService.java`)

**Dependencies:**
- Repositories: ProjectRepository, ProjectSectionRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getSections` | UUID projectId | `List<ProjectSectionResponse>` |
| `updateSections` | UUID projectId, UpdateProjectSectionsRequest request | `List<ProjectSectionResponse>` |
| `addCustomSection` | UUID projectId, CreateCustomSectionRequest request | `ProjectSectionResponse` |
| `deleteCustomSection` | UUID projectId, UUID sectionId | `void` |
| `seedDefaultSections` | UUID projectId | `List<ProjectSectionResponse>` |

---

### ReconciliationActService (`modules/finance/service/ReconciliationActService.java`)

**Dependencies:**
- Repositories: ReconciliationActRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listActs` | ReconciliationActStatus status, UUID counterpartyId, UUID contractId, Pageabl... | `Page<ReconciliationAct>` |
| `getAct` | UUID id | `ReconciliationAct` |
| `createAct` | ReconciliationAct act | `ReconciliationAct` |
| `updateAct` | UUID id, ReconciliationAct updates | `ReconciliationAct` |
| `sendAct` | UUID id | `ReconciliationAct` |
| `confirmAct` | UUID id | `ReconciliationAct` |
| `signAct` | UUID id, boolean signedByUs, boolean signedByCounterparty | `ReconciliationAct` |
| `deleteAct` | UUID id | `void` |

---

### ValueEngineeringService (`modules/finance/service/ValueEngineeringService.java`)

**Dependencies:**
- Repositories: AnalogRequestRepository, MaterialAnalogRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId | `List<VeItemResponse>` |
| `create` | UUID projectId, CreateVeProposalRequest request | `VeItemResponse` |
| `update` | UUID projectId, UUID itemId, UpdateVeItemRequest request | `VeItemResponse` |

---

## Module: fleet

### EquipmentInspectionService (`modules/fleet/service/EquipmentInspectionService.java`)

**Dependencies:**
- Repositories: EquipmentInspectionRepository, UserRepository, VehicleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listInspections` | UUID vehicleId, Pageable pageable | `Page<EquipmentInspectionResponse>` |
| `getInspection` | UUID id | `EquipmentInspectionResponse` |
| `createInspection` | CreateInspectionRequest request | `EquipmentInspectionResponse` |
| `updateInspection` | UUID id, UpdateInspectionRequest request | `EquipmentInspectionResponse` |
| `deleteInspection` | UUID id | `void` |
| `getDailyCheckList` | LocalDate date | `List<EquipmentInspectionResponse>` |
| `getUpcomingInspections` | int daysAhead | `List<EquipmentInspectionResponse>` |

---

### EquipmentUsageLogService (`modules/fleet/service/EquipmentUsageLogService.java`)

**Dependencies:**
- Repositories: EquipmentUsageLogRepository, ProjectRepository, VehicleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | UUID vehicleId, UUID projectId, Pageable pageable | `Page<EquipmentUsageLogResponse>` |
| `getById` | UUID id | `EquipmentUsageLogResponse` |
| `create` | CreateEquipmentUsageLogRequest request | `EquipmentUsageLogResponse` |
| `update` | UUID id, CreateEquipmentUsageLogRequest request | `EquipmentUsageLogResponse` |
| `delete` | UUID id | `void` |
| `getTotalHoursForVehicle` | UUID vehicleId | `BigDecimal` |

---

### FleetMaintenanceService (`modules/fleet/service/FleetMaintenanceService.java`)

**Dependencies:**
- Repositories: MaintenanceRecordRepository, UserRepository, VehicleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listMaintenance` | UUID vehicleId, MaintenanceStatus status, Pageable pageable | `Page<MaintenanceRecordResponse>` |
| `getMaintenance` | UUID id | `MaintenanceRecordResponse` |
| `schedule` | CreateMaintenanceRequest request | `MaintenanceRecordResponse` |
| `updateMaintenance` | UUID id, UpdateMaintenanceRequest request | `MaintenanceRecordResponse` |
| `startMaintenance` | UUID id | `MaintenanceRecordResponse` |
| `completeMaintenance` | UUID id | `MaintenanceRecordResponse` |
| `cancelMaintenance` | UUID id | `MaintenanceRecordResponse` |
| `deleteMaintenance` | UUID id | `void` |
| `getUpcomingMaintenance` | int daysAhead | `List<MaintenanceRecordResponse>` |
| `getMaintenanceHistory` | UUID vehicleId | `List<MaintenanceRecordResponse>` |
| `getMaintenanceCosts` | UUID vehicleId | `MaintenanceCostResponse` |

---

### FleetWaybillService (`modules/fleet/service/FleetWaybillService.java`)

**Dependencies:**
- Repositories: FleetWaybillRepository, ProjectRepository, VehicleRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listWaybills` | UUID vehicleId, WaybillStatus status, String search, Pageable pageable | `Page<FleetWaybillResponse>` |
| `getWaybill` | UUID id | `FleetWaybillResponse` |
| `createWaybill` | CreateFleetWaybillRequest request | `FleetWaybillResponse` |
| `updateWaybill` | UUID id, UpdateFleetWaybillRequest request | `FleetWaybillResponse` |
| `changeStatus` | UUID id, WaybillStatus newStatus | `FleetWaybillResponse` |
| `deleteWaybill` | UUID id | `void` |

---

### FuelService (`modules/fleet/service/FuelService.java`)

**Dependencies:**
- Repositories: FuelRecordRepository, ProjectRepository, UserRepository, VehicleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listFuelRecords` | UUID vehicleId, UUID projectId, Pageable pageable | `Page<FuelRecordResponse>` |
| `getFuelRecord` | UUID id | `FuelRecordResponse` |
| `createFuelRecord` | CreateFuelRecordRequest request | `FuelRecordResponse` |
| `updateFuelRecord` | UUID id, CreateFuelRecordRequest request | `FuelRecordResponse` |
| `deleteFuelRecord` | UUID id | `void` |
| `getVehicleFuelHistory` | UUID vehicleId | `List<FuelRecordResponse>` |
| `getFuelCostsByProject` | UUID projectId | `BigDecimal` |
| `getFuelConsumptionReport` | UUID vehicleId, LocalDate from, LocalDate to | `FuelConsumptionReportResponse` |

---

### MachineHourCalculatorService (`modules/fleet/service/MachineHourCalculatorService.java`)

**Dependencies:**
- Repositories: VehicleRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `calculateRate` | UUID vehicleId, BigDecimal fuelPricePerLiter | `MachineHourRateResponse` |
| `compareOwnVsRent` | UUID vehicleId, BigDecimal fuelPricePerLiter | `OwnVsRentResponse` |

---

### MaintenanceScheduleService (`modules/fleet/service/MaintenanceScheduleService.java`)

**Dependencies:**
- Repositories: MaintenanceScheduleRuleRepository, VehicleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listRules` | UUID vehicleId, Pageable pageable | `Page<ScheduleRuleResponse>` |
| `getRule` | UUID id | `ScheduleRuleResponse` |
| `createRule` | CreateScheduleRuleRequest request | `ScheduleRuleResponse` |
| `updateRule` | UUID id, CreateScheduleRuleRequest request | `ScheduleRuleResponse` |
| `toggleRule` | UUID id, boolean active | `void` |
| `deleteRule` | UUID id | `void` |
| `getDueMaintenanceItems` |  | `List<MaintenanceDueItem>` |
| `getComplianceDashboard` |  | `ComplianceDashboardResponse` |

---

### VehicleService (`modules/fleet/service/VehicleService.java`)

**Dependencies:**
- Repositories: ProjectRepository, UserRepository, VehicleAssignmentRepository, VehicleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listVehicles` | String search, VehicleStatus status, VehicleType vehicleType, Pageable pageable | `Page<VehicleResponse>` |
| `getVehicle` | UUID id | `VehicleResponse` |
| `createVehicle` | CreateVehicleRequest request | `VehicleResponse` |
| `updateVehicle` | UUID id, UpdateVehicleRequest request | `VehicleResponse` |
| `deleteVehicle` | UUID id | `void` |
| `assignToProject` | UUID vehicleId, AssignVehicleRequest request | `VehicleAssignmentResponse` |
| `returnFromProject` | UUID vehicleId | `VehicleAssignmentResponse` |
| `getAvailableVehicles` |  | `List<VehicleResponse>` |
| `getVehiclesByProject` | UUID projectId | `List<VehicleResponse>` |
| `getExpiringInsurance` | int daysAhead | `List<VehicleResponse>` |
| `getExpiringTechInspection` | int daysAhead | `List<VehicleResponse>` |
| `calculateDepreciation` | UUID vehicleId | `BigDecimal` |
| `getVehicleAssignments` | UUID vehicleId, Pageable pageable | `Page<VehicleAssignmentResponse>` |

---

## Module: gpsTimesheet

### GpsTimesheetService (`modules/gpsTimesheet/service/GpsTimesheetService.java`)

**Dependencies:**
- Repositories: GpsCheckEventRepository, GpsTimesheetEntryRepository, GpsTimesheetSummaryRepository, SiteGeofenceRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listGeofences` | UUID projectId, Pageable pageable | `Page<SiteGeofenceResponse>` |
| `getGeofence` | UUID id | `SiteGeofenceResponse` |
| `createGeofence` | CreateSiteGeofenceRequest request | `SiteGeofenceResponse` |
| `updateGeofence` | UUID id, UpdateSiteGeofenceRequest request | `SiteGeofenceResponse` |
| `deleteGeofence` | UUID id | `void` |
| `checkIn` | GpsCheckInRequest request | `GpsCheckEventResponse` |
| `checkOut` | GpsCheckOutRequest request | `GpsCheckEventResponse` |
| `isWithinGeofence` | double lat, double lng, SiteGeofence fence | `boolean` |
| `listEntries` | UUID employeeId, UUID projectId, LocalDate from, LocalDate to, Pageable pageable | `Page<GpsTimesheetEntryResponse>` |
| `listUnverifiedEntries` | Pageable pageable | `Page<GpsTimesheetEntryResponse>` |
| `verifyEntry` | UUID entryId | `GpsTimesheetEntryResponse` |
| `getEmployeeTimesheet` | UUID employeeId, LocalDate from, LocalDate to | `List<GpsTimesheetEntryResponse>` |
| `listSummaries` | UUID employeeId, Integer year, Integer month, Pageable pageable | `Page<GpsTimesheetSummaryResponse>` |
| `generateMonthlySummary` | int year, int month | `void` |
| `getTimesheetDashboard` |  | `TimesheetDashboardResponse` |

---

## Module: hr

### CertificationDashboardService (`modules/hr/service/CertificationDashboardService.java`)

**Dependencies:**
- Repositories: EmployeeCertificateRepository, EmployeeRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getDashboard` |  | `CertificationDashboardResponse` |
| `recalculateStatuses` |  | `int` |

---

### CrewService (`modules/hr/service/CrewService.java`)

**Dependencies:**
- Repositories: CrewAssignmentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `PageResponse<CrewAssignmentResponse>` |
| `assignToProject` | CreateCrewAssignmentRequest request | `CrewAssignmentResponse` |
| `removeFromProject` | UUID employeeId, UUID projectId | `CrewAssignmentResponse` |
| `getProjectCrew` | UUID projectId | `List<CrewAssignmentResponse>` |
| `getEmployeeProjects` | UUID employeeId | `List<CrewAssignmentResponse>` |

---

### CrewTimeService (`modules/hr/service/CrewTimeService.java`)

**Dependencies:**
- Repositories: CrewTimeEntryRepository, CrewTimeSheetRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listEntries` | UUID crewId, UUID employeeId, Pageable pageable | `Page<CrewTimeEntryResponse>` |
| `getEntry` | UUID id | `CrewTimeEntryResponse` |
| `createEntry` | CreateCrewTimeEntryRequest request | `CrewTimeEntryResponse` |
| `deleteEntry` | UUID id | `void` |
| `listSheets` | UUID crewId, UUID projectId, Pageable pageable | `Page<CrewTimeSheetResponse>` |
| `getSheet` | UUID id | `CrewTimeSheetResponse` |
| `createSheet` | CreateCrewTimeSheetRequest request | `CrewTimeSheetResponse` |
| `recalculateSheet` | UUID id | `CrewTimeSheetResponse` |
| `submitSheet` | UUID id | `CrewTimeSheetResponse` |
| `approveSheet` | UUID id, UUID approvedById | `CrewTimeSheetResponse` |
| `rejectSheet` | UUID id | `CrewTimeSheetResponse` |

---

### EmployeeService (`modules/hr/service/EmployeeService.java`)

**Dependencies:**
- Repositories: EmployeeCertificateRepository, EmployeeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listEmployees` | String search, EmployeeStatus status, UUID organizationId, Pageable pageable | `Page<EmployeeResponse>` |
| `getEmployee` | UUID id | `EmployeeResponse` |
| `createEmployee` | CreateEmployeeRequest request | `EmployeeResponse` |
| `updateEmployee` | UUID id, UpdateEmployeeRequest request | `EmployeeResponse` |
| `deleteEmployee` | UUID id | `void` |
| `getByProject` | UUID projectId | `List<EmployeeResponse>` |
| `getEmployeeCertificates` | UUID employeeId | `List<CertificateResponse>` |
| `addCertificate` | UUID employeeId, CreateCertificateRequest request | `CertificateResponse` |
| `deleteCertificate` | UUID certificateId | `void` |
| `getExpiredCertificates` |  | `List<CertificateResponse>` |
| `getExpiringCertificates` | int daysAhead | `List<CertificateResponse>` |

---

### HrExtendedService (`modules/hr/service/HrExtendedService.java`)

**Dependencies:**
- Repositories: EmployeeRepository, HrWorkOrderRepository, QualificationRecordRepository, StaffingPositionRepository, StaffingVacancyRepository, TimesheetT13CellRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getStaffingSchedule` | String department, String vacancyStatus | `List<StaffingPositionResponse>` |
| `createVacancy` | CreateStaffingVacancyRequest request | `StaffingPositionResponse` |
| `getTimesheetT13` | UUID projectId, int month, int year | `List<TimesheetT13RowResponse>` |
| `updateTimesheetT13Cell` | UUID projectId, int month, int year, UpdateTimesheetT13CellRequest request | `void` |
| `getWorkOrders` | String type, String status | `List<HrWorkOrderResponse>` |
| `createWorkOrder` | CreateHrWorkOrderRequest request | `HrWorkOrderResponse` |
| `getQualifications` | String qualificationType, String status | `List<QualificationRecordResponse>` |
| `createQualification` | CreateQualificationRecordRequest request | `QualificationRecordResponse` |
| `getSeniorityReport` |  | `List<SeniorityRecordResponse>` |

---

### TimesheetService (`modules/hr/service/TimesheetService.java`)

**Dependencies:**
- Repositories: EmployeeRepository, ProjectRepository, TimesheetRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<TimesheetResponse>` |
| `listByEmployee` | UUID employeeId, Pageable pageable | `Page<TimesheetResponse>` |
| `listByProject` | UUID projectId, Pageable pageable | `Page<TimesheetResponse>` |
| `getTimesheet` | UUID id | `TimesheetResponse` |
| `createTimesheet` | CreateTimesheetRequest request | `TimesheetResponse` |
| `updateTimesheet` | UUID id, UpdateTimesheetRequest request | `TimesheetResponse` |
| `submitTimesheet` | UUID id | `TimesheetResponse` |
| `approveTimesheet` | UUID id, UUID approvedById | `TimesheetResponse` |
| `rejectTimesheet` | UUID id | `TimesheetResponse` |
| `getWeeklySummary` | UUID employeeId, LocalDate weekStart | `TimesheetSummaryResponse` |
| `getMonthlySummary` | UUID projectId, YearMonth month | `TimesheetSummaryResponse` |
| `deleteTimesheet` | UUID id | `void` |
| `getEmployeeHours` | UUID employeeId, LocalDate startDate, LocalDate endDate | `BigDecimal` |

---

## Module: hrRussian

### BusinessTripService (`modules/hrRussian/service/BusinessTripService.java`)

**Dependencies:**
- Repositories: BusinessTripRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listBusinessTrips` | Pageable pageable | `Page<BusinessTripResponse>` |
| `getByEmployee` | UUID employeeId | `List<BusinessTripResponse>` |
| `getBusinessTrip` | UUID id | `BusinessTripResponse` |
| `createBusinessTrip` | CreateBusinessTripRequest request | `BusinessTripResponse` |
| `approveTrip` | UUID id | `BusinessTripResponse` |
| `completeTrip` | UUID id | `BusinessTripResponse` |
| `getActiveTrips` |  | `List<BusinessTripResponse>` |

---

### EmploymentContractService (`modules/hrRussian/service/EmploymentContractService.java`)

**Dependencies:**
- Repositories: EmploymentContractRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listContracts` | ContractStatus status, Pageable pageable | `Page<EmploymentContractResponse>` |
| `getByEmployee` | UUID employeeId | `List<EmploymentContractResponse>` |
| `getContract` | UUID id | `EmploymentContractResponse` |
| `createContract` | CreateEmploymentContractRequest request | `EmploymentContractResponse` |
| `terminateContract` | UUID id | `EmploymentContractResponse` |
| `deleteContract` | UUID id | `void` |

---

### EmploymentOrderService (`modules/hrRussian/service/EmploymentOrderService.java`)

**Dependencies:**
- Repositories: EmploymentOrderRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getByEmployee` | UUID employeeId | `List<EmploymentOrderResponse>` |
| `listOrders` | OrderType orderType, Pageable pageable | `Page<EmploymentOrderResponse>` |
| `createOrder` | CreateEmploymentOrderRequest request | `EmploymentOrderResponse` |
| `deleteOrder` | UUID id | `void` |

---

### SickLeaveService (`modules/hrRussian/service/SickLeaveService.java`)

**Dependencies:**
- Repositories: SickLeaveRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSickLeaves` | Pageable pageable | `Page<SickLeaveResponse>` |
| `getByEmployee` | UUID employeeId | `List<SickLeaveResponse>` |
| `getSickLeave` | UUID id | `SickLeaveResponse` |
| `createSickLeave` | CreateSickLeaveRequest request | `SickLeaveResponse` |
| `closeSickLeave` | UUID id | `SickLeaveResponse` |
| `getOpenSickLeaves` |  | `List<SickLeaveResponse>` |

---

### StaffingTableService (`modules/hrRussian/service/StaffingTableService.java`)

**Dependencies:**
- Repositories: StaffingTableRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listActivePositions` | Pageable pageable | `Page<StaffingTableResponse>` |
| `getVacantPositions` |  | `List<StaffingTableResponse>` |
| `createPosition` | CreateStaffingTableRequest request | `StaffingTableResponse` |
| `deletePosition` | UUID id | `void` |

---

### VacationService (`modules/hrRussian/service/VacationService.java`)

**Dependencies:**
- Repositories: VacationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listVacations` | Pageable pageable | `Page<VacationResponse>` |
| `getByEmployee` | UUID employeeId | `List<VacationResponse>` |
| `getVacation` | UUID id | `VacationResponse` |
| `createVacation` | CreateVacationRequest request | `VacationResponse` |
| `approveVacation` | UUID id | `VacationResponse` |
| `cancelVacation` | UUID id | `VacationResponse` |
| `deleteVacation` | UUID id | `void` |

---

## Module: immutableAudit

### ImmutableRecordService (`modules/immutableAudit/service/ImmutableRecordService.java`)

**Dependencies:**
- Repositories: ImmutableRecordRepository, RecordSupersessionRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String entityType, UUID entityId, Pageable pageable | `Page<ImmutableRecordResponse>` |
| `findById` | UUID id | `ImmutableRecordResponse` |
| `create` | CreateImmutableRecordRequest request | `ImmutableRecordResponse` |
| `recordEntity` | String entityType, UUID entityId, String contentSnapshot, UUID recordedById | `ImmutableRecordResponse` |
| `supersede` | SupersedeRecordRequest request | `ImmutableRecordResponse` |
| `verifyChain` | String entityType, UUID entityId | `ChainVerificationResponse` |
| `getSupersessions` | UUID recordId | `List<RecordSupersessionResponse>` |

---

## Module: infrastructure/audit

### AuditService (`infrastructure/audit/AuditService.java`)

**Dependencies:**
- Repositories: AuditLogRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `logAction` | String entityType, UUID entityId, AuditAction action, String field, String ol... | `void` |
| `logCreate` | String entityType, UUID entityId | `void` |
| `logUpdate` | String entityType, UUID entityId, String field, String oldValue, String newValue | `void` |
| `logDelete` | String entityType, UUID entityId | `void` |
| `logStatusChange` | String entityType, UUID entityId, String oldStatus, String newStatus | `void` |
| `getEntityHistory` | String entityType, UUID entityId | `List<AuditLog>` |

---

## Module: infrastructure/email

### EmailService (`infrastructure/email/EmailService.java`)

**Dependencies:**
- Other: JavaMailSender, TemplateEngine

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `sendEmail` | String to, String subject, String templateName, Map<String, Object> variables | `void` |
| `sendEmailAsync` | String to, String subject, String templateName, Map<String, Object> variables | `void` |
| `sendBulkEmail` | Iterable<String> recipients, String subject, String templateName, Map<String,... | `void` |

---

## Module: infrastructure/report

### PdfReportService (`infrastructure/report/PdfReportService.java`)

**Dependencies:**
- Other: TemplateEngine

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `generateReport` | String templateName, Map<String, Object> data | `byte[]` |
| `generateKs2Report` | UUID ks2Id | `byte[]` |
| `generateKs3Report` | UUID ks3Id | `byte[]` |
| `generateProjectSummary` | UUID projectId | `byte[]` |
| `generateSafetyReport` | UUID inspectionId | `byte[]` |
| `generateDailyLogReport` | UUID dailyLogId | `byte[]` |

---

## Module: infrastructure/security

### FieldEncryptionService (`infrastructure/security/FieldEncryptionService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `encrypt` | String plaintext | `String` |
| `decrypt` | String ciphertext | `String` |

---

### SsrfProtectionService (`infrastructure/security/SsrfProtectionService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `validateUrl` | String url | `void` |

---

### UserDetailsServiceImpl (`infrastructure/security/UserDetailsServiceImpl.java`)

**Dependencies:**
- Repositories: UserRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `loadUserByUsername` | String email | `UserDetails` |

---

## Module: infrastructure/storage

### FileValidationService (`infrastructure/storage/FileValidationService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `validate` | MultipartFile file, String context | `void` |
| `validate` | MultipartFile file | `void` |

---

## Module: infrastructure/websocket

### RedisWebSocketBroadcast (`infrastructure/websocket/RedisWebSocketBroadcast.java`)

**Dependencies:**
- Services: ObjectMapper, SimpMessagingTemplate, StringRedisTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `publish` | String destination, Object payload | `void` |
| `onMessage` | String jsonMessage | `void` |

---

## Module: insurance

### InsuranceCertificateService (`modules/insurance/service/InsuranceCertificateService.java`)

**Dependencies:**
- Repositories: InsuranceCertificateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | Pageable pageable | `Page<InsuranceCertificateResponse>` |
| `getById` | UUID id | `InsuranceCertificateResponse` |
| `getExpiring` | int days | `List<InsuranceCertificateResponse>` |
| `getByVendor` | UUID vendorId | `List<InsuranceCertificateResponse>` |
| `create` | CreateInsuranceCertificateRequest req | `InsuranceCertificateResponse` |
| `update` | UUID id, UpdateInsuranceCertificateRequest req | `InsuranceCertificateResponse` |
| `softDelete` | UUID id | `void` |

---

## Module: integration

### BankIntegrationService (`modules/integration/service/BankIntegrationService.java`)

**Dependencies:**
- Services: IntegrationEndpointService, SyncService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `syncBankStatements` | BankStatementRequest request | `SyncJobResponse` |
| `createPaymentOrder` | CreatePaymentOrderRequest request | `SyncJobResponse` |
| `checkPaymentStatus` | UUID syncJobId | `SyncJobResponse` |
| `reconcilePayments` | UUID endpointId | `SyncJobResponse` |

---

### EdoIntegrationService (`modules/integration/service/EdoIntegrationService.java`)

**Dependencies:**
- Repositories: ExternalDocumentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `sendDocument` | SendEdoDocumentRequest request | `ExternalDocumentResponse` |
| `signDocument` | UUID id | `ExternalDocumentResponse` |
| `getInboxDocuments` | EdoProvider provider, Pageable pageable | `Page<ExternalDocumentResponse>` |
| `getDocumentStatus` | UUID id | `ExternalDocumentResponse` |
| `downloadDocument` | UUID id | `String` |
| `rejectDocument` | UUID id, RejectDocumentRequest request | `ExternalDocumentResponse` |
| `getEdoStatus` |  | `com.privod.platform.modules.integration.web.EdoController.EdoStatusResponse` |

---

### EdoKs2ExportService (`modules/integration/service/EdoKs2ExportService.java`)

**Dependencies:**
- Repositories: ContractRepository, Ks2DocumentRepository, Ks3DocumentRepository, SbisDocumentRepository, SbisPartnerMappingRepository
- Services: AuditService, ObjectMapper, SbisService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `EdoSendResult` | UUID sbisDocumentId, String status, String message | `record` |
| `EdoStatusResult` | String status, Instant deliveredAt, Instant signedAt, String message | `record` |
| `sendKs2ToEdo` | UUID ks2Id | `EdoSendResult` |
| `sendKs3ToEdo` | UUID ks3Id | `EdoSendResult` |
| `checkDeliveryStatus` | UUID sbisDocId | `EdoStatusResult` |
| `receiveInboundDocument` | Map<String, Object> payload | `SbisDocument` |

---

### GovRegistryService (`modules/integration/govregistries/service/GovRegistryService.java`)

**Dependencies:**
- Repositories: RegistryCheckResultRepository, RegistryConfigRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listConfigs` |  | `List<RegistryConfigResponse>` |
| `updateConfig` | RegistryType type, UpdateRegistryConfigRequest request | `RegistryConfigResponse` |
| `checkCounterparty` | String inn | `CounterpartyCheckSummary` |
| `checkEgrul` | String inn | `CheckResultResponse` |
| `checkFns` | String inn | `CheckResultResponse` |
| `checkRnpo` | String inn | `CheckResultResponse` |
| `checkBankruptcy` | String inn | `CheckResultResponse` |
| `checkSmp` | String inn | `CheckResultResponse` |
| `getCheckHistory` | UUID counterpartyId, Pageable pageable | `Page<CheckResultResponse>` |
| `getCheckResult` | UUID id | `CheckResultResponse` |
| `recheckCounterparty` | UUID counterpartyId | `CounterpartyCheckSummary` |
| `schedulePeriodicChecks` |  | `void` |

---

### IntegrationEndpointService (`modules/integration/service/IntegrationEndpointService.java`)

**Dependencies:**
- Repositories: IntegrationEndpointRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | Pageable pageable | `Page<IntegrationEndpointResponse>` |
| `findById` | UUID id | `IntegrationEndpointResponse` |
| `findByProvider` | IntegrationProvider provider | `List<IntegrationEndpointResponse>` |
| `create` | CreateIntegrationEndpointRequest request | `IntegrationEndpointResponse` |
| `update` | UUID id, UpdateIntegrationEndpointRequest request | `IntegrationEndpointResponse` |
| `delete` | UUID id | `void` |
| `testConnection` | UUID id | `ConnectionTestResponse` |
| `healthCheck` | UUID id | `ConnectionTestResponse` |

---

### IntegrationWebhookService (`modules/integration/service/IntegrationWebhookService.java`)

**Dependencies:**
- Repositories: IntegrationWebhookDeliveryRepository, WebhookEndpointRepository
- Services: AuditService, ObjectMapper, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `register` | CreateWebhookEndpointRequest request | `WebhookEndpointResponse` |
| `updateWebhook` | UUID id, UpdateWebhookEndpointRequest request | `WebhookEndpointResponse` |
| `unregister` | UUID id | `void` |
| `findAll` | Pageable pageable | `Page<WebhookEndpointResponse>` |
| `findById` | UUID id | `WebhookEndpointResponse` |
| `triggerEvent` | String eventType, String payload | `void` |
| `deliverWebhook` | UUID endpointId, String eventType, Object payloadObj | `WebhookDeliveryResponse` |
| `retryFailedDeliveries` |  | `void` |
| `retryDelivery` | UUID deliveryId | `WebhookDeliveryResponse` |
| `getDeliveryLog` | UUID webhookId, Pageable pageable | `Page<WebhookDeliveryResponse>` |
| `processIncomingWebhook` | String code, String eventType, String payload, String signature | `boolean` |

---

### OneCDataExchangeService (`modules/integration/service/OneCDataExchangeService.java`)

**Dependencies:**
- Repositories: OneCConfigRepository, OneCMappingRepository
- Services: ObjectMapper, OneCIntegrationService, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `importCounterparties` | UUID configId | `ExchangeResult` |
| `importMaterials` | UUID configId | `ExchangeResult` |
| `importEmployees` | UUID configId | `ExchangeResult` |
| `importInvoices` | UUID configId | `ExchangeResult` |
| `importPayments` | UUID configId | `ExchangeResult` |
| `exportEntity` | UUID configId, String entityType, UUID privodId, Map<String, Object> data | `ExchangeResult` |
| `fullSync` | UUID configId | `Map<String, ExchangeResult>` |
| `incrementalSync` | UUID configId, String entityType | `ExchangeResult` |
| `addProcessed` |  | `void` |
| `addError` | String error | `void` |
| `hasErrors` |  | `boolean` |
| `toString` |  | `String` |

---

### OneCIntegrationService (`modules/integration/service/OneCIntegrationService.java`)

**Dependencies:**
- Repositories: OneCConfigRepository, OneCExchangeLogRepository, OneCMappingRepository
- Services: AuditService, IntegrationEndpointService, RestTemplate, SyncService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listConfigs` | Pageable pageable | `Page<OneCConfigResponse>` |
| `getConfig` | UUID id | `OneCConfigResponse` |
| `createConfig` | CreateOneCConfigRequest request | `OneCConfigResponse` |
| `updateConfig` | UUID id, CreateOneCConfigRequest request | `OneCConfigResponse` |
| `deleteConfig` | UUID id | `void` |
| `toggleActive` | UUID id | `OneCConfigResponse` |
| `listExchangeLogs` | UUID configId, Pageable pageable | `Page<OneCExchangeLogResponse>` |
| `startExchange` | UUID configId, OneCExchangeType exchangeType, SyncDirection direction | `OneCExchangeLogResponse` |
| `completeExchange` | UUID exchangeLogId, int recordsProcessed, int recordsFailed, String errorMessage | `OneCExchangeLogResponse` |
| `listMappings` | String entityType, Pageable pageable | `Page<OneCMappingResponse>` |
| `getMappingByPrivodId` | UUID privodId, String entityType | `OneCMappingResponse` |
| `createMapping` | String entityType, UUID privodId, String oneCId, String oneCCode | `OneCMappingResponse` |
| `updateMappingStatus` | UUID id, OneCMappingSyncStatus status, String conflictData | `OneCMappingResponse` |
| `testConnection` | UUID configId | `ConnectionTestResponse` |
| `getActiveConfigStatus` |  | `OneCConfigResponse` |
| `syncInvoices` | OneCEntitySyncRequest request | `SyncJobResponse` |
| `syncPayments` | OneCEntitySyncRequest request | `SyncJobResponse` |
| `syncEmployees` | OneCEntitySyncRequest request | `SyncJobResponse` |
| `syncMaterials` | OneCEntitySyncRequest request | `SyncJobResponse` |
| `importContractors` | OneCEntitySyncRequest request | `SyncJobResponse` |
| `exportDocuments` | OneCEntitySyncRequest request | `SyncJobResponse` |

---

### PricingService (`modules/integration/pricing/service/PricingService.java`)

**Dependencies:**
- Repositories: PriceIndexRepository, PriceRateRepository, PricingDatabaseRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDatabases` | Pageable pageable | `Page<PricingDatabaseResponse>` |
| `getDatabase` | UUID id | `PricingDatabaseResponse` |
| `createDatabase` | CreatePricingDatabaseRequest request | `PricingDatabaseResponse` |
| `deleteDatabase` | UUID id | `void` |
| `searchRates` | String query, UUID databaseId, Pageable pageable | `Page<PriceRateResponse>` |
| `getRateById` | UUID id | `PriceRateResponse` |
| `getRateByCode` | String code | `PriceRateResponse` |
| `calculateCurrentPrice` | UUID rateId, BigDecimal quantity, String region | `PriceCalculationResponse` |
| `getIndices` | String region, String workType, Pageable pageable | `Page<PriceIndexResponse>` |
| `createIndex` | CreatePriceIndexRequest request | `PriceIndexResponse` |
| `importQuarterlyIndices` | ImportQuarterlyPriceIndicesRequest request | `QuarterlyIndexImportResponse` |
| `importRatesFromCsv` | UUID databaseId, InputStream inputStream | `int` |
| `importRatesWithReport` | UUID databaseId, InputStream inputStream | `PricingImportReportResponse` |
| `exportRatesToExcel` | UUID databaseId | `byte[]` |

---

### SbisService (`modules/integration/service/SbisService.java`)

**Dependencies:**
- Repositories: SbisConfigRepository, SbisDocumentRepository, SbisPartnerMappingRepository
- Services: AuditService, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listConfigs` | Pageable pageable | `Page<SbisConfigResponse>` |
| `getConfig` | UUID id | `SbisConfigResponse` |
| `createConfig` | CreateSbisConfigRequest request | `SbisConfigResponse` |
| `updateConfig` | UUID id, CreateSbisConfigRequest request | `SbisConfigResponse` |
| `deleteConfig` | UUID id | `void` |
| `toggleActive` | UUID id | `SbisConfigResponse` |
| `listDocuments` | Pageable pageable | `Page<SbisDocumentResponse>` |
| `getDocument` | UUID id | `SbisDocumentResponse` |
| `createDocument` | CreateSbisDocumentRequest request | `SbisDocumentResponse` |
| `sendDocument` | UUID id | `SbisDocumentResponse` |
| `acceptDocument` | UUID id | `SbisDocumentResponse` |
| `rejectDocument` | UUID id, String errorMessage | `SbisDocumentResponse` |
| `deleteDocument` | UUID id | `void` |
| `listPartnerMappings` | Pageable pageable | `Page<SbisPartnerMappingResponse>` |
| `createPartnerMapping` | UUID partnerId, String partnerName, String sbisContractorId, String sbisContr... | `SbisPartnerMappingResponse` |
| `deletePartnerMapping` | UUID id | `void` |
| `testConnection` | UUID configId | `ConnectionTestResponse` |
| `syncDocuments` |  | `void` |

---

### SmsService (`modules/integration/sms/service/SmsService.java`)

**Dependencies:**
- Repositories: SmsConfigRepository, SmsMessageRepository
- Services: AuditService, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getConfig` |  | `SmsConfigResponse` |
| `updateConfig` | UpdateSmsConfigRequest request | `SmsConfigResponse` |
| `sendSms` | SendSmsRequest request | `SmsMessageResponse` |
| `sendWhatsApp` | String phoneNumber, String text | `SmsMessageResponse` |
| `sendVerificationCode` | String phoneNumber | `SmsMessageResponse` |
| `broadcast` | BroadcastSmsRequest request | `List<SmsMessageResponse>` |
| `listMessages` | Pageable pageable | `Page<SmsMessageResponse>` |
| `getDeliveryStatus` | UUID messageId | `SmsMessageResponse` |

---

### SyncMappingService (`modules/integration/service/SyncMappingService.java`)

**Dependencies:**
- Repositories: SyncMappingRepository
- Services: AuditService, IntegrationEndpointService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID endpointId, Pageable pageable | `Page<SyncMappingResponse>` |
| `findById` | UUID id | `SyncMappingResponse` |
| `getFieldMapping` | UUID endpointId, String localEntityType | `List<SyncMappingResponse>` |
| `create` | CreateSyncMappingRequest request | `SyncMappingResponse` |
| `update` | UUID id, UpdateSyncMappingRequest request | `SyncMappingResponse` |
| `delete` | UUID id | `void` |
| `applyTransformation` | String value, String transformExpression | `String` |

---

### SyncService (`modules/integration/service/SyncService.java`)

**Dependencies:**
- Repositories: SyncJobRepository
- Services: AuditService, IntegrationEndpointService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `startSync` | StartSyncRequest request | `SyncJobResponse` |
| `cancelSync` | UUID id | `SyncJobResponse` |
| `getSyncHistory` | UUID endpointId, Pageable pageable | `Page<SyncJobResponse>` |
| `getLastSync` | UUID endpointId, String entityType | `SyncJobResponse` |
| `findById` | UUID id | `SyncJobResponse` |
| `retryFailed` | UUID id | `SyncJobResponse` |
| `completeSync` | UUID id, int processedCount, int errorCount, String errorLog | `SyncJobResponse` |

---

### TelegramBotService (`modules/integration/telegram/service/TelegramBotService.java`)

**Dependencies:**
- Repositories: TelegramConfigRepository, TelegramMessageRepository, TelegramSubscriptionRepository
- Services: RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `sendMessage` | String chatId, String text | `TelegramMessageResponse` |
| `sendNotification` | UUID userId, String title, String body | `TelegramMessageResponse` |
| `broadcastToProject` | UUID projectId, String messageText, List<UUID> projectMemberUserIds | `List<TelegramMessageResponse>` |
| `sendSafetyAlert` | UUID incidentId, String messageText | `List<TelegramMessageResponse>` |
| `processCommand` | String chatId, String command | `TelegramMessageResponse` |
| `retryPendingMessages` |  | `int` |

---

### TelegramWebhookService (`modules/integration/telegram/service/TelegramWebhookService.java`)

**Dependencies:**
- Repositories: TelegramLinkCodeRepository, TelegramSubscriptionRepository
- Services: TelegramBotService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `processUpdate` | TelegramUpdate update | `void` |
| `handleCommand` | String chatId, String command, String args | `TelegramMessageResponse` |
| `registerChat` | String chatId, UUID userId | `TelegramSubscriptionResponse` |

---

### WeatherService (`modules/integration/weather/service/WeatherService.java`)

**Dependencies:**
- Repositories: WeatherConfigRepository, WeatherDataRepository
- Services: AuditService, ObjectMapper, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getConfig` |  | `WeatherConfigResponse` |
| `updateConfig` | UpdateWeatherConfigRequest request | `WeatherConfigResponse` |
| `fetchCurrentWeather` | double latitude, double longitude | `WeatherDataResponse` |
| `fetchWeatherForProject` | UUID projectId | `WeatherDataResponse` |
| `getLatestWeather` | UUID projectId | `WeatherDataResponse` |
| `getForecast` | UUID projectId, int days | `List<WeatherDataResponse>` |
| `assessSafety` | UUID projectId | `WeatherSafetyResponse` |
| `assessWorkSafety` | WeatherData data | `boolean` |

---

### WebDavService (`modules/integration/webdav/service/WebDavService.java`)

**Dependencies:**
- Repositories: WebDavConfigRepository, WebDavFileRepository
- Services: AuditService, RestTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getConfig` |  | `WebDavConfigResponse` |
| `updateConfig` | UpdateWebDavConfigRequest request | `WebDavConfigResponse` |
| `uploadFile` | UUID documentId, InputStream inputStream | `WebDavFileResponse` |
| `downloadFile` | String remotePath | `WebDavFileResponse` |
| `syncDocument` | UUID documentId | `WebDavFileResponse` |
| `syncAllDocuments` |  | `SyncResultResponse` |
| `listRemoteFiles` | String path | `List<WebDavFileResponse>` |
| `deleteRemoteFile` | String remotePath | `void` |
| `listSyncedFiles` | Pageable pageable | `Page<WebDavFileResponse>` |
| `getFileStatus` | UUID fileId | `WebDavFileResponse` |
| `testConnection` |  | `boolean` |

---

## Module: iot

### IoTDeviceService (`modules/iot/service/IoTDeviceService.java`)

**Dependencies:**
- Repositories: IoTAlertRepository, IoTAlertRuleRepository, IoTDeviceRepository, IoTSensorDataRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAllDevices` | UUID projectId, DeviceStatus status, Pageable pageable | `Page<IoTDeviceResponse>` |
| `findDeviceById` | UUID id | `IoTDeviceResponse` |
| `createDevice` | CreateDeviceRequest request | `IoTDeviceResponse` |
| `updateDevice` | UUID id, CreateDeviceRequest request | `IoTDeviceResponse` |
| `deleteDevice` | UUID id | `void` |
| `ingestData` | IngestSensorDataRequest request | `IoTSensorDataResponse` |
| `findSensorData` | UUID deviceId, Pageable pageable | `Page<IoTSensorDataResponse>` |
| `findAlerts` | UUID deviceId, AlertStatus status, Pageable pageable | `Page<IoTAlertResponse>` |
| `acknowledgeAlert` | UUID alertId, UUID userId | `IoTAlertResponse` |
| `resolveAlert` | UUID alertId | `IoTAlertResponse` |

---

### IotService (`modules/iot/service/IotService.java`)

**Dependencies:**
- Repositories: GeofenceAlertRepository, GeofenceZoneRepository, IotEquipmentDeviceRepository, IotTelemetryPointRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDevices` | String search, Pageable pageable | `Page<IotEquipmentDeviceResponse>` |
| `getDevice` | UUID id | `IotEquipmentDeviceResponse` |
| `createDevice` | CreateIotDeviceRequest request | `IotEquipmentDeviceResponse` |
| `updateDevice` | UUID id, CreateIotDeviceRequest request | `IotEquipmentDeviceResponse` |
| `deleteDevice` | UUID id | `void` |
| `ingestTelemetry` | List<IngestTelemetryRequest> requests | `List<IotTelemetryPointResponse>` |
| `getDeviceCurrentLocation` | UUID deviceId | `IotTelemetryPointResponse` |
| `getDeviceTelemetry` | UUID deviceId, Instant from, Instant to, Pageable pageable | `Page<IotTelemetryPointResponse>` |
| `listZones` | Pageable pageable | `Page<GeofenceZoneResponse>` |
| `getZone` | UUID id | `GeofenceZoneResponse` |
| `createZone` | CreateGeofenceZoneRequest request | `GeofenceZoneResponse` |
| `updateZone` | UUID id, CreateGeofenceZoneRequest request | `GeofenceZoneResponse` |
| `deleteZone` | UUID id | `void` |
| `listAlerts` | UUID deviceId, GeofenceAlertType alertType, Boolean unacknowledgedOnly, Pagea... | `Page<GeofenceAlertResponse>` |
| `acknowledgeAlert` | UUID alertId | `GeofenceAlertResponse` |
| `getDashboard` |  | `IotDashboardResponse` |

---

## Module: isup

### IsupIntegrationService (`modules/isup/service/IsupIntegrationService.java`)

**Dependencies:**
- Repositories: IsupConfigurationRepository, IsupProjectMappingRepository, IsupTransmissionRepository, IsupVerificationRecordRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listConfigs` | Pageable pageable | `Page<IsupConfigurationResponse>` |
| `getConfig` | UUID id | `IsupConfigurationResponse` |
| `createConfig` | CreateIsupConfigRequest request | `IsupConfigurationResponse` |
| `updateConfig` | UUID id, CreateIsupConfigRequest request | `IsupConfigurationResponse` |
| `deleteConfig` | UUID id | `void` |
| `toggleConfig` | UUID id | `IsupConfigurationResponse` |
| `listMappings` | Pageable pageable | `Page<IsupProjectMappingResponse>` |
| `getMapping` | UUID id | `IsupProjectMappingResponse` |
| `createMapping` | CreateProjectMappingRequest request | `IsupProjectMappingResponse` |
| `updateMapping` | UUID id, CreateProjectMappingRequest request | `IsupProjectMappingResponse` |
| `deleteMapping` | UUID id | `void` |
| `toggleMappingSync` | UUID id | `IsupProjectMappingResponse` |
| `transmitProgress` | UUID projectMappingId | `IsupTransmissionResponse` |
| `transmitDocuments` | UUID projectMappingId, List<UUID> documentIds | `IsupTransmissionResponse` |
| `transmitPhotos` | UUID projectMappingId | `IsupTransmissionResponse` |
| `processTransmission` | UUID transmissionId | `IsupTransmissionResponse` |
| `receiveVerification` | ReceiveVerificationRequest request | `IsupVerificationRecordResponse` |
| `retryTransmission` | UUID transmissionId | `IsupTransmissionResponse` |
| `listTransmissions` | IsupTransmissionStatus status, IsupTransmissionType type, UUID projectMapping... | `Page<IsupTransmissionResponse>` |
| `getTransmission` | UUID id | `IsupTransmissionResponse` |
| `listVerifications` | Pageable pageable | `Page<IsupVerificationRecordResponse>` |
| `getDashboard` |  | `IsupDashboardResponse` |
| `retryFailedTransmissions` |  | `void` |

---

## Module: journal

### GeneralJournalService (`modules/journal/service/GeneralJournalService.java`)

**Dependencies:**
- Repositories: GeneralJournalEntryRepository, GeneralJournalRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, JournalStatus status, Pageable pageable | `Page<JournalResponse>` |
| `findById` | UUID id | `JournalResponse` |
| `create` | CreateJournalRequest request | `JournalResponse` |
| `update` | UUID id, CreateJournalRequest request | `JournalResponse` |
| `closeJournal` | UUID id | `JournalResponse` |
| `delete` | UUID id | `void` |
| `findEntries` | UUID journalId, Pageable pageable | `Page<JournalEntryResponse>` |
| `addEntry` | CreateJournalEntryRequest request | `JournalEntryResponse` |
| `deleteEntry` | UUID entryId | `void` |

---

## Module: kep

### BouncyCastleCryptoProvider (`modules/kep/service/BouncyCastleCryptoProvider.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `init` |  | `void` |
| `sign` | byte[] data, byte[] certificateBytes, byte[] privateKeyHint | `byte[]` |
| `verify` | byte[] data, byte[] signatureBytes | `boolean` |
| `parseCertificate` | byte[] certificateBytes | `CertificateInfo` |
| `checkOcsp` | byte[] certificateBytes | `OcspResult` |
| `timestamp` | byte[] signatureBytes, String tsaUrl | `byte[]` |

---

### KepService (`modules/kep/service/KepService.java`)

**Dependencies:**
- Repositories: KepCertificateRepository, KepSignatureRepository, KepSigningRequestRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCertificates` | String search, UUID ownerId, Pageable pageable | `Page<KepCertificateResponse>` |
| `getCertificate` | UUID id | `KepCertificateResponse` |
| `getActiveCertificates` | UUID ownerId | `List<KepCertificateResponse>` |
| `createCertificate` | CreateKepCertificateRequest request | `KepCertificateResponse` |
| `updateCertificate` | UUID id, CreateKepCertificateRequest request | `KepCertificateResponse` |
| `deleteCertificate` | UUID id | `void` |
| `revokeCertificate` | UUID id | `KepCertificateResponse` |
| `signDocument` | SignDocumentRequest request | `KepSignatureResponse` |
| `verifySignature` | UUID signatureId | `VerifySignatureResponse` |
| `getDocumentSignatures` | String documentModel, UUID documentId | `List<KepSignatureResponse>` |
| `createSigningRequest` | CreateSigningRequestRequest request | `KepSigningRequestResponse` |
| `listSigningRequests` | UUID signerId, KepSigningStatus status, Pageable pageable | `Page<KepSigningRequestResponse>` |
| `completeSigningRequest` | UUID requestId, UUID signatureId | `KepSigningRequestResponse` |
| `rejectSigningRequest` | UUID requestId, String reason | `KepSigningRequestResponse` |
| `deleteSigningRequest` | UUID id | `void` |

---

### MchDService (`modules/kep/service/MchDService.java`)

**Dependencies:**
- Repositories: MchDRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `MchDResponse` | UUID id, String number, String principalInn, String principalName, String rep... | `record` |
| `fromEntity` | MchDDocument entity | `MchDResponse` |
| `CreateMchDRequest` | МЧД обязателен" | `record` |
| `UpdateMchDRequest` | String scope, Instant validTo, String notes | `record` |
| `list` | Pageable pageable | `Page<MchDResponse>` |
| `getById` | UUID id | `MchDResponse` |
| `create` | CreateMchDRequest request | `MchDResponse` |
| `update` | UUID id, UpdateMchDRequest request | `MchDResponse` |
| `revoke` | UUID id | `void` |
| `delete` | UUID id | `void` |
| `expireOverdue` |  | `void` |

---

## Module: leave

### LeaveService (`modules/leave/service/LeaveService.java`)

**Dependencies:**
- Repositories: LeaveAllocationRepository, LeaveRequestRepository, LeaveTypeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listLeaveTypes` | boolean activeOnly | `List<LeaveTypeResponse>` |
| `getLeaveType` | UUID id | `LeaveTypeResponse` |
| `createLeaveType` | CreateLeaveTypeRequest request | `LeaveTypeResponse` |
| `deleteLeaveType` | UUID id | `void` |
| `listLeaveRequests` | UUID employeeId, LeaveRequestStatus status, UUID approverId, Pageable pageable | `Page<LeaveRequestResponse>` |
| `getLeaveRequest` | UUID id | `LeaveRequestResponse` |
| `createLeaveRequest` | CreateLeaveRequestRequest request | `LeaveRequestResponse` |
| `submitLeaveRequest` | UUID id | `LeaveRequestResponse` |
| `approveLeaveRequest` | UUID id, UUID approverId | `LeaveRequestResponse` |
| `refuseLeaveRequest` | UUID id, UUID approverId, String refusalReason | `LeaveRequestResponse` |
| `cancelLeaveRequest` | UUID id | `LeaveRequestResponse` |
| `listAllocations` | UUID employeeId, int year, Pageable pageable | `Page<LeaveAllocationResponse>` |
| `getAllocation` | UUID id | `LeaveAllocationResponse` |
| `getEmployeeAllocations` | UUID employeeId, int year | `List<LeaveAllocationResponse>` |
| `createAllocation` | CreateLeaveAllocationRequest request | `LeaveAllocationResponse` |
| `approveAllocation` | UUID id | `LeaveAllocationResponse` |
| `refuseAllocation` | UUID id | `LeaveAllocationResponse` |

---

## Module: legal

### LegalService (`modules/legal/service/LegalService.java`)

**Dependencies:**
- Repositories: ContractLegalTemplateRepository, ContractRepository, LegalCaseRepository, LegalDecisionRepository, LegalRemarkRepository, ProjectRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCases` | String search, CaseStatus status, UUID projectId, UUID lawyerId, Pageable pag... | `Page<LegalCaseResponse>` |
| `getCase` | UUID id | `LegalCaseResponse` |
| `createCase` | CreateLegalCaseRequest request | `LegalCaseResponse` |
| `updateCase` | UUID id, UpdateLegalCaseRequest request | `LegalCaseResponse` |
| `deleteCase` | UUID id | `void` |
| `getDashboard` |  | `LegalDashboardResponse` |
| `getUpcomingHearings` | int days | `List<LegalCaseResponse>` |
| `getCaseDecisions` | UUID caseId | `List<LegalDecisionResponse>` |
| `createDecision` | CreateLegalDecisionRequest request | `LegalDecisionResponse` |
| `updateDecision` | UUID id, CreateLegalDecisionRequest request | `LegalDecisionResponse` |
| `deleteDecision` | UUID id | `void` |
| `getCaseRemarks` | UUID caseId, boolean includeConfidential | `List<LegalRemarkResponse>` |
| `createRemark` | CreateLegalRemarkRequest request | `LegalRemarkResponse` |
| `updateRemark` | UUID id, CreateLegalRemarkRequest request | `LegalRemarkResponse` |
| `deleteRemark` | UUID id | `void` |
| `listTemplates` | String search, LegalTemplateType type, Pageable pageable | `Page<ContractLegalTemplateResponse>` |
| `createTemplate` | CreateLegalTemplateRequest request | `ContractLegalTemplateResponse` |
| `updateTemplate` | UUID id, CreateLegalTemplateRequest request | `ContractLegalTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |

---

## Module: m29

### M29Service (`modules/m29/service/M29Service.java`)

**Dependencies:**
- Repositories: M29DocumentRepository, M29LineRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listM29` | UUID projectId, M29Status status, Pageable pageable | `Page<M29ListResponse>` |
| `getM29` | UUID id | `M29Response` |
| `createM29` | CreateM29Request request | `M29Response` |
| `updateM29` | UUID id, UpdateM29Request request | `M29Response` |
| `addLine` | UUID m29Id, CreateM29LineRequest request | `M29LineResponse` |
| `updateLine` | UUID lineId, UpdateM29LineRequest request | `M29LineResponse` |
| `removeLine` | UUID lineId | `void` |
| `confirmM29` | UUID id | `M29Response` |
| `verifyM29` | UUID id | `M29Response` |
| `approveM29` | UUID id | `M29Response` |
| `postM29` | UUID id | `M29Response` |

---

## Module: maintenance

### MaintenanceService (`modules/maintenance/service/MaintenanceService.java`)

**Dependencies:**
- Repositories: MaintenanceEquipmentRepository, MaintenanceRequestRepository, MaintenanceStageRepository, MaintenanceTeamRepository, PreventiveScheduleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAllRequests` | String search, RequestStatus status, UUID equipmentId, UUID teamId, Pageable ... | `Page<MaintenanceRequestResponse>` |
| `findRequestById` | UUID id | `MaintenanceRequestResponse` |
| `createRequest` | CreateMaintenanceRequest dto | `MaintenanceRequestResponse` |
| `updateRequestStatus` | UUID id, RequestStatus newStatus | `MaintenanceRequestResponse` |
| `updateRequestStage` | UUID requestId, UUID stageId | `MaintenanceRequestResponse` |
| `deleteRequest` | UUID id | `void` |
| `findAllEquipment` | String search, EquipmentStatus status, Pageable pageable | `Page<MaintenanceEquipmentResponse>` |
| `findEquipmentById` | UUID id | `MaintenanceEquipmentResponse` |
| `createEquipment` | CreateEquipmentRequest dto | `MaintenanceEquipmentResponse` |
| `updateEquipment` | UUID id, CreateEquipmentRequest dto | `MaintenanceEquipmentResponse` |
| `deleteEquipment` | UUID id | `void` |
| `findAllTeams` | String search, Pageable pageable | `Page<MaintenanceTeam>` |
| `findTeamById` | UUID id | `MaintenanceTeam` |
| `createTeam` | MaintenanceTeam team | `MaintenanceTeam` |
| `updateTeam` | UUID id, MaintenanceTeam updates | `MaintenanceTeam` |
| `deleteTeam` | UUID id | `void` |
| `findAllStages` |  | `List<MaintenanceStage>` |
| `findAllSchedules` | UUID equipmentId, Pageable pageable | `Page<PreventiveScheduleResponse>` |
| `findScheduleById` | UUID id | `PreventiveScheduleResponse` |
| `createSchedule` | PreventiveSchedule schedule | `PreventiveScheduleResponse` |
| `deleteSchedule` | UUID id | `void` |
| `processPreventiveSchedules` |  | `int` |
| `findOverdueRequests` |  | `List<MaintenanceRequestResponse>` |
| `findUpcomingPreventive` |  | `List<PreventiveScheduleResponse>` |
| `getDashboard` |  | `MaintenanceDashboardData` |

---

## Module: messaging

### CallSessionService (`modules/messaging/service/CallSessionService.java`)

**Dependencies:**
- Repositories: CallParticipantRepository, CallSessionRepository, UserRepository
- Services: AuditService, SimpMessagingTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createCall` | CreateCallRequest request | `CallSessionResponse` |
| `listCalls` | UUID projectId, UUID channelId | `List<CallSessionResponse>` |
| `joinCall` | UUID callId, JoinCallRequest request | `CallSessionResponse` |
| `leaveCall` | UUID callId, LeaveCallRequest request | `CallSessionResponse` |
| `endCall` | UUID callId, EndCallRequest request | `CallSessionResponse` |
| `listActiveCalls` |  | `List<CallSessionResponse>` |
| `generateInviteLink` | UUID callId | `CallSessionResponse` |
| `joinByInviteToken` | String token, String guestName | `CallSessionResponse` |
| `getByInviteToken` | String token | `CallSessionResponse` |

---

### MailActivityService (`modules/messaging/service/MailActivityService.java`)

**Dependencies:**
- Repositories: MailActivityRepository, MailActivityTypeRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `scheduleActivity` | ScheduleActivityRequest request | `MailActivityResponse` |
| `completeActivity` | UUID activityId | `MailActivityResponse` |
| `cancelActivity` | UUID activityId | `MailActivityResponse` |
| `getActivitiesForRecord` | String modelName, UUID recordId | `List<MailActivityResponse>` |
| `getMyActivities` |  | `List<MailActivityResponse>` |
| `getMyPendingActivities` |  | `List<MailActivityResponse>` |
| `findOverdueActivities` |  | `List<MailActivityResponse>` |
| `countPendingActivities` |  | `long` |
| `countOverdueActivities` |  | `long` |
| `getActivityTypes` |  | `List<MailActivityTypeResponse>` |

---

### MailFollowerService (`modules/messaging/service/MailFollowerService.java`)

**Dependencies:**
- Repositories: MailFollowerRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `followRecord` | FollowRecordRequest request | `MailFollowerResponse` |
| `addFollower` | String modelName, UUID recordId, UUID userId, String subtypeIds | `MailFollowerResponse` |
| `unfollowRecord` | String modelName, UUID recordId | `void` |
| `removeFollower` | String modelName, UUID recordId, UUID userId | `void` |
| `getFollowers` | String modelName, UUID recordId | `List<MailFollowerResponse>` |
| `getMyFollowedRecords` |  | `List<MailFollowerResponse>` |
| `isFollowing` | String modelName, UUID recordId | `boolean` |
| `getFollowerCount` | String modelName, UUID recordId | `long` |

---

### MailTemplateService (`modules/messaging/service/MailTemplateService.java`)

**Dependencies:**
- Repositories: MailTemplateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createTemplate` | CreateMailTemplateRequest request | `MailTemplateResponse` |
| `updateTemplate` | UUID templateId, CreateMailTemplateRequest request | `MailTemplateResponse` |
| `deleteTemplate` | UUID templateId | `void` |
| `toggleActive` | UUID templateId | `MailTemplateResponse` |
| `getTemplate` | UUID templateId | `MailTemplateResponse` |
| `getAllTemplates` |  | `List<MailTemplateResponse>` |
| `getTemplatesByModel` | String modelName | `List<MailTemplateResponse>` |
| `renderTemplate` | RenderTemplateRequest request | `RenderedTemplateResponse` |

---

## Module: mobile

### MobileDeviceService (`modules/mobile/service/MobileDeviceService.java`)

**Dependencies:**
- Repositories: MobileDeviceRepository, OfflineActionRepository, PhotoCaptureRepository, PushNotificationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `registerDevice` | RegisterDeviceRequest request | `MobileDeviceResponse` |
| `findDevicesByUser` | UUID userId | `List<MobileDeviceResponse>` |
| `deactivateDevice` | UUID deviceId | `void` |
| `sendPushNotification` | UUID userId, String title, String body, Map<String, Object> data | `void` |
| `submitOfflineAction` | SubmitOfflineActionsRequest request | `OfflineActionResponse` |
| `syncOfflineAction` | UUID actionId | `OfflineActionResponse` |
| `findPendingActions` | UUID userId | `List<OfflineActionResponse>` |
| `createPhoto` | CreatePhotoCaptureRequest request | `PhotoCaptureResponse` |
| `findPhotoById` | UUID id | `PhotoCaptureResponse` |
| `findPhotosByProject` | UUID projectId, Pageable pageable | `Page<PhotoCaptureResponse>` |
| `deletePhoto` | UUID id | `void` |

---

### MobileForemanService (`modules/mobile/service/MobileForemanService.java`)

**Dependencies:**
- Repositories: FieldReportRepository, OfflineActionRepository, PhotoCaptureRepository, ProjectRepository, ProjectTaskRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listFieldReports` | String status, UUID projectId, String search, LocalDate dateFrom, LocalDate d... | `Page<FieldReportResponse>` |
| `getFieldReport` | UUID id | `FieldReportResponse` |
| `createFieldReport` | CreateFieldReportRequest request | `FieldReportResponse` |
| `updateFieldReport` | UUID id, UpdateFieldReportRequest request | `FieldReportResponse` |
| `submitFieldReport` | UUID id | `FieldReportResponse` |
| `uploadPhotoForReport` | UUID reportId, String photoUrl, String caption | `FieldReportPhotoResponse` |
| `getPhotosForReport` | UUID reportId | `List<FieldReportPhotoResponse>` |
| `getSyncStatus` |  | `SyncStatusResponse` |
| `triggerSync` |  | `void` |
| `getMobileTasks` | Pageable pageable | `Page<MobileTaskResponse>` |
| `completeTask` | UUID taskId | `MobileTaskResponse` |

---

## Module: monitoring

### BackupService (`modules/monitoring/service/BackupService.java`)

**Dependencies:**
- Repositories: BackupRecordRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `startBackup` | StartBackupRequest request | `BackupRecordResponse` |
| `getStatus` | UUID backupId | `BackupRecordResponse` |
| `getHistory` | Pageable pageable | `Page<BackupRecordResponse>` |
| `getLatest` |  | `BackupRecordResponse` |

---

### HealthCheckService (`modules/monitoring/service/HealthCheckService.java`)

**Dependencies:**
- Repositories: SystemHealthCheckRepository
- Other: DataSource

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `checkAll` |  | `List<HealthCheckResponse>` |
| `checkComponent` | HealthComponent component | `HealthCheckResponse` |
| `getLatestStatus` |  | `List<HealthCheckResponse>` |
| `getHealthHistory` | HealthComponent component, Pageable pageable | `Page<HealthCheckResponse>` |

---

### SystemEventService (`modules/monitoring/service/SystemEventService.java`)

**Dependencies:**
- Repositories: SystemEventRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `logEvent` | LogEventRequest request | `SystemEventResponse` |
| `getEvents` | SystemEventType eventType, EventSeverity severity, String source, Instant fro... | `Page<SystemEventResponse>` |
| `getRecentErrors` |  | `List<SystemEventResponse>` |

---

### SystemMetricService (`modules/monitoring/service/SystemMetricService.java`)

**Dependencies:**
- Repositories: SystemMetricRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `record` | RecordMetricRequest request | `SystemMetricResponse` |
| `getMetrics` | String name, Instant from, Instant to | `List<SystemMetricResponse>` |
| `getDashboardMetrics` |  | `DashboardMetricsResponse` |

---

## Module: monteCarlo

### MonteCarloEnhancedService (`modules/monteCarlo/service/MonteCarloEnhancedService.java`)

**Dependencies:**
- Repositories: EvmSnapshotRepository, MonteCarloEacResultRepository, MonteCarloSimulationRepository, MonteCarloTaskRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `runSimulation` | UUID simulationId, int iterations | `MonteCarloEacResultResponse` |
| `getLatestResult` | UUID projectId | `MonteCarloEacResultResponse` |
| `getResultHistory` | UUID projectId, Pageable pageable | `Page<MonteCarloEacResultResponse>` |

---

### MonteCarloService (`modules/monteCarlo/service/MonteCarloService.java`)

**Dependencies:**
- Repositories: MonteCarloResultRepository, MonteCarloSimulationRepository, MonteCarloTaskRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSimulations` | SimulationStatus status, Pageable pageable | `Page<MonteCarloSimulationResponse>` |
| `getSimulation` | UUID id | `MonteCarloSimulationResponse` |
| `createSimulation` | CreateMonteCarloSimulationRequest request | `MonteCarloSimulationResponse` |
| `updateSimulation` | UUID id, UpdateMonteCarloSimulationRequest request | `MonteCarloSimulationResponse` |
| `deleteSimulation` | UUID id | `void` |
| `listTasks` | UUID simulationId | `List<MonteCarloTaskResponse>` |
| `addTask` | UUID simulationId, CreateMonteCarloTaskRequest request | `MonteCarloTaskResponse` |
| `updateTask` | UUID simulationId, UUID taskId, UpdateMonteCarloTaskRequest request | `MonteCarloTaskResponse` |
| `deleteTask` | UUID simulationId, UUID taskId | `void` |
| `runSimulation` | UUID simulationId | `MonteCarloSimulationResponse` |
| `getResults` | UUID simulationId | `List<MonteCarloResultResponse>` |

---

## Module: monthlySchedule

### MonthlyScheduleService (`modules/monthlySchedule/service/MonthlyScheduleService.java`)

**Dependencies:**
- Repositories: MonthlyScheduleLineRepository, MonthlyScheduleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, MonthlyScheduleStatus status, Integer year, Pageable pageable | `Page<MonthlyScheduleResponse>` |
| `findById` | UUID id | `MonthlyScheduleResponse` |
| `create` | CreateMonthlyScheduleRequest request | `MonthlyScheduleResponse` |
| `submit` | UUID id | `MonthlyScheduleResponse` |
| `approve` | UUID id, UUID approvedById | `MonthlyScheduleResponse` |
| `delete` | UUID id | `void` |
| `findLines` | UUID scheduleId, Pageable pageable | `Page<MonthlyScheduleLineResponse>` |
| `addLine` | CreateMonthlyScheduleLineRequest request | `MonthlyScheduleLineResponse` |
| `deleteLine` | UUID lineId | `void` |

---

## Module: notification

### BroadcastNotificationService (`modules/notification/service/BroadcastNotificationService.java`)

**Dependencies:**
- Repositories: BroadcastNotificationRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getActiveBroadcasts` | UUID organizationId | `List<BroadcastResponse>` |
| `create` | CreateBroadcastRequest request, UUID organizationId, UUID userId | `BroadcastResponse` |
| `deactivate` | UUID broadcastId, UUID organizationId | `void` |

---

### NotificationBatchService (`modules/notification/service/NotificationBatchService.java`)

**Dependencies:**
- Repositories: NotificationBatchRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listBatches` | Pageable pageable | `Page<NotificationBatchResponse>` |
| `getBatch` | UUID id | `NotificationBatchResponse` |
| `createBatch` | CreateBatchRequest request | `NotificationBatchResponse` |
| `sendBatch` | UUID id | `NotificationBatchResponse` |
| `updateBatch` | UUID id, CreateBatchRequest request | `NotificationBatchResponse` |
| `deleteBatch` | UUID id | `void` |
| `getStatus` | UUID id | `NotificationBatchResponse` |

---

### NotificationPreferenceService (`modules/notification/service/NotificationPreferenceService.java`)

**Dependencies:**
- Repositories: NotificationPreferenceRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getPreferences` | UUID userId, UUID organizationId | `List<NotificationPreferenceResponse>` |
| `updatePreference` | UUID userId, UUID organizationId, NotificationChannel channel, NotificationCa... | `NotificationPreferenceResponse` |
| `isEnabled` | UUID userId, UUID organizationId, NotificationChannel channel, NotificationCa... | `boolean` |

---

### NotificationService (`modules/notification/service/NotificationService.java`)

**Dependencies:**
- Repositories: NotificationRepository, UserRepository
- Services: WebSocketNotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `send` | SendNotificationRequest request | `NotificationResponse` |
| `send` | UUID userId, String title, String message, NotificationType type, String sour... | `NotificationResponse` |
| `getMyNotifications` | UUID userId, Boolean isRead, Pageable pageable | `Page<NotificationResponse>` |
| `getUnreadCount` | UUID userId | `UnreadCountResponse` |
| `markRead` | UUID notificationId | `NotificationResponse` |
| `markReadForUser` | UUID notificationId, UUID userId | `NotificationResponse` |
| `markAllRead` | UUID userId | `int` |
| `deleteNotification` | UUID notificationId | `void` |
| `deleteNotificationForUser` | UUID notificationId, UUID userId | `void` |
| `deleteOld` | int daysOld | `int` |
| `deleteExpired` |  | `int` |

---

### WebSocketNotificationService (`modules/notification/service/WebSocketNotificationService.java`)

**Dependencies:**
- Services: SimpMessagingTemplate

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `sendToUser` | String username, WebSocketMessage notification | `void` |
| `sendToUser` | UUID userId, String username, WebSocketMessage notification | `void` |
| `sendToProject` | UUID projectId, WebSocketMessage event | `void` |
| `sendToProject` | String projectId, WebSocketMessage event | `void` |
| `sendToAll` | WebSocketMessage event | `void` |
| `notifyNewRfi` | UUID projectId, String rfiId, String rfiSubject, String createdBy | `void` |
| `notifyStatusChange` | UUID projectId, String entityType, String entityId, String entityTitle, Strin... | `void` |
| `notifyNewComment` | UUID projectId, String entityType, String entityId, String entityTitle, Strin... | `void` |
| `notifyDocumentUpload` | UUID projectId, String documentId, String documentName, String uploadedBy | `void` |
| `notifySafetyAlert` | UUID projectId, String inspectionId, String title, String severity | `void` |
| `sendEventToUser` | String userId, NotificationEvent event | `void` |
| `sendEventToProject` | UUID projectId, NotificationEvent event | `void` |
| `broadcastEvent` | NotificationEvent event | `void` |

---

## Module: ops

### DefectService (`modules/ops/service/DefectService.java`)

**Dependencies:**
- Repositories: CounterpartyRepository, DefectRepository, ProjectRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDefects` | UUID projectId, UUID contractorId, String severity, String status, String sea... | `Page<DefectResponse>` |
| `getDefect` | UUID id | `DefectResponse` |
| `createDefect` | CreateDefectRequest request | `DefectResponse` |
| `updateDefect` | UUID id, UpdateDefectRequest request | `DefectResponse` |
| `transitionStatus` | UUID id, DefectStatus newStatus, String fixDescription | `DefectResponse` |
| `deleteDefect` | UUID id | `void` |
| `getDashboard` |  | `DefectDashboardResponse` |

---

### DispatchService (`modules/ops/service/DispatchService.java`)

**Dependencies:**
- Repositories: DispatchOrderRepository, DispatchRouteRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listOrders` | UUID projectId, DispatchStatus status, Pageable pageable | `Page<DispatchOrderResponse>` |
| `getOrder` | UUID id | `DispatchOrderResponse` |
| `createOrder` | CreateDispatchOrderRequest request | `DispatchOrderResponse` |
| `updateOrder` | UUID id, CreateDispatchOrderRequest request | `DispatchOrderResponse` |
| `transitionStatus` | UUID id, DispatchStatus targetStatus | `DispatchOrderResponse` |
| `deleteOrder` | UUID id | `void` |
| `listRoutes` | Pageable pageable | `Page<DispatchRoute>` |
| `getActiveRoutes` |  | `List<DispatchRoute>` |
| `getRoute` | UUID id | `DispatchRoute` |
| `createRoute` | DispatchRoute route | `DispatchRoute` |
| `updateRoute` | UUID id, DispatchRoute updates | `DispatchRoute` |
| `deleteRoute` | UUID id | `void` |

---

### OpsService (`modules/ops/service/OpsService.java`)

**Dependencies:**
- Repositories: DailyReportRepository, DefectRepository, FieldInstructionRepository, ShiftHandoverRepository, WeatherRecordRepository, WorkOrderRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listWorkOrders` | UUID projectId, WorkOrderStatus status, WorkOrderPriority priority, UUID fore... | `Page<WorkOrderResponse>` |
| `getWorkOrder` | UUID id | `WorkOrderResponse` |
| `createWorkOrder` | CreateWorkOrderRequest request | `WorkOrderResponse` |
| `updateWorkOrder` | UUID id, UpdateWorkOrderRequest request | `WorkOrderResponse` |
| `transitionWorkOrderStatus` | UUID id, WorkOrderStatus targetStatus | `WorkOrderResponse` |
| `deleteWorkOrder` | UUID id | `void` |
| `getDailyReportsForWorkOrder` | UUID workOrderId | `List<DailyReportResponse>` |
| `createDailyReport` | CreateDailyReportRequest request | `DailyReportResponse` |
| `updateDailyReport` | UUID id, CreateDailyReportRequest request | `DailyReportResponse` |
| `deleteDailyReport` | UUID id | `void` |
| `getDefect` | UUID id | `DefectResponse` |
| `createDefect` | CreateDefectRequest request | `DefectResponse` |
| `transitionDefectStatus` | UUID id, DefectStatus targetStatus | `DefectResponse` |
| `updateDefect` | UUID id, CreateDefectRequest request | `DefectResponse` |
| `deleteDefect` | UUID id | `void` |

---

## Module: organization

### OrganizationService (`modules/organization/service/OrganizationService.java`)

**Dependencies:**
- Repositories: OrganizationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String search, Pageable pageable | `Page<OrganizationResponse>` |
| `findById` | UUID id | `OrganizationResponse` |
| `create` | CreateOrganizationRequest request | `OrganizationResponse` |
| `update` | UUID id, UpdateOrganizationRequest request | `OrganizationResponse` |
| `delete` | UUID id | `void` |

---

### PartnerEnrichmentService (`modules/organization/service/PartnerEnrichmentService.java`)

**Dependencies:**
- Repositories: PartnerEnrichmentLogRepository, PartnerEnrichmentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findById` | UUID id | `PartnerEnrichmentResponse` |
| `findByPartnerId` | UUID partnerId | `Optional<PartnerEnrichmentResponse>` |
| `findByInn` | String inn | `Optional<PartnerEnrichmentResponse>` |
| `findByFilters` | PartnerLegalStatus status, EnrichmentSource source, Pageable pageable | `Page<PartnerEnrichmentResponse>` |
| `findLowReliabilityPartners` | int threshold | `List<PartnerEnrichmentResponse>` |
| `create` | CreatePartnerEnrichmentRequest request | `PartnerEnrichmentResponse` |
| `update` | UUID id, UpdatePartnerEnrichmentRequest request | `PartnerEnrichmentResponse` |
| `delete` | UUID id | `void` |
| `findLogsByPartner` | UUID partnerId, Pageable pageable | `Page<PartnerEnrichmentLogResponse>` |
| `logEnrichmentAction` | UUID partnerId, String source, EnrichmentLogStatus status, String responseDat... | `PartnerEnrichmentLogResponse` |

---

## Module: payroll

### PayrollService (`modules/payroll/service/PayrollService.java`)

**Dependencies:**
- Repositories: PayrollCalculationRepository, PayrollTemplateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTemplates` | PayrollType type, Boolean isActive, Pageable pageable | `Page<PayrollTemplateResponse>` |
| `getTemplate` | UUID id | `PayrollTemplateResponse` |
| `createTemplate` | CreatePayrollTemplateRequest request | `PayrollTemplateResponse` |
| `updateTemplate` | UUID id, UpdatePayrollTemplateRequest request | `PayrollTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |
| `listCalculations` | UUID employeeId, PayrollCalculationStatus status, Pageable pageable | `Page<PayrollCalculationResponse>` |
| `getCalculation` | UUID id | `PayrollCalculationResponse` |
| `calculatePayroll` | PayrollCalculateRequest request | `PayrollCalculationResponse` |
| `bulkCalculate` | BulkPayrollCalculateRequest request | `List<PayrollCalculationResponse>` |
| `approveCalculation` | UUID id | `PayrollCalculationResponse` |

---

## Module: permission

### FieldAccessService (`modules/permission/service/FieldAccessService.java`)

**Dependencies:**
- Repositories: FieldAccessRepository, UserGroupRepository
- Services: PermissionAuditService, PermissionGroupService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `setFieldAccess` | SetFieldAccessRequest request | `FieldAccessResponse` |
| `checkFieldAccess` | UUID userId, String modelName, String fieldName, boolean write | `boolean` |
| `getByModelAndField` | String modelName, String fieldName | `List<FieldAccessResponse>` |
| `getByModelAndGroup` | String modelName, UUID groupId | `List<FieldAccessResponse>` |
| `getByGroup` | UUID groupId | `List<FieldAccessResponse>` |
| `deleteFieldAccess` | UUID id | `void` |

---

### ModelAccessService (`modules/permission/service/ModelAccessService.java`)

**Dependencies:**
- Repositories: ModelAccessRepository, UserGroupRepository
- Services: PermissionAuditService, PermissionGroupService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `setAccess` | SetModelAccessRequest request | `ModelAccessResponse` |
| `getAccess` | String modelName, UUID groupId | `ModelAccessResponse` |
| `getAccessByModel` | String modelName | `List<ModelAccessResponse>` |
| `getAccessByGroup` | UUID groupId | `List<ModelAccessResponse>` |
| `checkAccess` | UUID userId, String modelName, AccessOperation operation | `boolean` |
| `getAllModelNames` |  | `List<String>` |
| `deleteAccess` | UUID id | `void` |

---

### PermissionAuditService (`modules/permission/service/PermissionAuditService.java`)

**Dependencies:**
- Repositories: AuditPermissionChangeRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `logAction` | PermissionAuditAction action, UUID targetUserId, UUID groupId, String details | `void` |
| `logGrant` | UUID targetUserId, UUID groupId | `void` |
| `logRevoke` | UUID targetUserId, UUID groupId | `void` |
| `logGroupCreate` | UUID groupId, String details | `void` |
| `logGroupUpdate` | UUID groupId, String details | `void` |
| `logGroupDelete` | UUID groupId | `void` |
| `logModelAccessChange` | UUID groupId, String details | `void` |
| `logBulkAssign` | UUID groupId, String details | `void` |

---

### PermissionCheckService (`modules/permission/service/PermissionCheckService.java`)

**Dependencies:**
- Repositories: RecordRuleRepository, UserGroupRepository
- Services: FieldAccessService, ModelAccessService, RecordRuleService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `hasModelAccess` | UUID userId, String modelName, AccessOperation operation | `boolean` |
| `hasFieldAccess` | UUID userId, String modelName, String fieldName | `boolean` |
| `hasFieldAccess` | UUID userId, String modelName, String fieldName, boolean write | `boolean` |
| `getPermissionSummary` | UUID userId, String modelName | `Map<String, Object>` |
| `evictCachesForUser` | UUID userId | `void` |
| `evictAllCaches` |  | `void` |

---

### PermissionGroupService (`modules/permission/service/PermissionGroupService.java`)

**Dependencies:**
- Repositories: PermissionGroupRepository
- Services: PermissionAuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | Pageable pageable | `Page<PermissionGroupResponse>` |
| `findAllActive` |  | `List<PermissionGroupResponse>` |
| `findById` | UUID id | `PermissionGroupResponse` |
| `findByCategory` | String category | `List<PermissionGroupResponse>` |
| `findChildren` | UUID parentGroupId | `List<PermissionGroupResponse>` |
| `getGroupHierarchy` | UUID groupId | `List<PermissionGroupResponse>` |
| `create` | CreatePermissionGroupRequest request | `PermissionGroupResponse` |
| `update` | UUID id, UpdatePermissionGroupRequest request | `PermissionGroupResponse` |
| `delete` | UUID id | `void` |
| `search` | String query | `List<PermissionGroupResponse>` |

---

### RecordRuleService (`modules/permission/service/RecordRuleService.java`)

**Dependencies:**
- Repositories: RecordRuleRepository, UserGroupRepository
- Services: ObjectMapper, PermissionAuditService, PermissionGroupService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `create` | CreateRecordRuleRequest request | `RecordRuleResponse` |
| `update` | UUID id, UpdateRecordRuleRequest request | `RecordRuleResponse` |
| `findById` | UUID id | `RecordRuleResponse` |
| `findByModel` | String modelName | `List<RecordRuleResponse>` |
| `findByGroup` | UUID groupId | `List<RecordRuleResponse>` |
| `getApplicableRules` | UUID userId, String modelName | `List<RecordRuleResponse>` |
| `evaluateRule` | RecordRule rule, String currentUserId, String currentUserOrganization | `Map<String, Object>` |
| `delete` | UUID id | `void` |

---

### UserGroupService (`modules/permission/service/UserGroupService.java`)

**Dependencies:**
- Repositories: UserGroupRepository
- Services: PermissionAuditService, PermissionGroupService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<UserGroupResponse>` |
| `assignGroup` | AssignGroupRequest request | `UserGroupResponse` |
| `removeGroup` | UUID userId, UUID groupId | `void` |
| `getUserGroups` | UUID userId | `List<PermissionGroupResponse>` |
| `getGroupUserIds` | UUID groupId | `List<UUID>` |
| `getGroupUsers` | UUID groupId | `List<UserGroupResponse>` |
| `bulkAssign` | BulkAssignGroupRequest request | `List<UserGroupResponse>` |
| `bulkRevoke` | BulkAssignGroupRequest request | `void` |
| `getGroupMemberCount` | UUID groupId | `long` |

---

## Module: planfact

### PlanFactService (`modules/planfact/service/PlanFactService.java`)

**Dependencies:**
- Repositories: PlanFactLineRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getProjectPlanFact` | UUID projectId | `List<PlanFactLineResponse>` |
| `generatePlanFactLines` | UUID projectId | `List<PlanFactLineResponse>` |
| `updateLine` | UUID lineId, UpdatePlanFactLineRequest request | `PlanFactLineResponse` |
| `getProjectSummary` | UUID projectId | `PlanFactSummaryResponse` |

---

## Module: planning

### EvmAnalyticsService (`modules/planning/service/EvmAnalyticsService.java`)

**Dependencies:**
- Repositories: EvmSnapshotRepository, WbsNodeRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `EvmTrendPoint` | String snapshotDate, BigDecimal pv, BigDecimal ev, BigDecimal ac, BigDecimal ... | `record` |
| `EacMethodsResponse` | BigDecimal bac, BigDecimal eacCpi, BigDecimal eacSpiCpi, BigDecimal eacBottom... | `record` |
| `WbsEvmRow` | UUID wbsId, String code, String name, Integer level, BigDecimal bac, BigDecim... | `record` |
| `ConfidenceBandPoint` | String period, BigDecimal pv, BigDecimal ev, BigDecimal ac, BigDecimal optimi... | `record` |
| `getEvmTrend` | UUID projectId | `List<EvmTrendPoint>` |
| `getEacMethods` | UUID projectId | `EacMethodsResponse` |
| `getWbsEvmBreakdown` | UUID projectId | `List<WbsEvmRow>` |
| `getConfidenceBands` | UUID projectId | `List<ConfidenceBandPoint>` |

---

### EvmSnapshotService (`modules/planning/service/EvmSnapshotService.java`)

**Dependencies:**
- Repositories: EvmSnapshotRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByProject` | UUID projectId, Pageable pageable | `Page<EvmSnapshotResponse>` |
| `findById` | UUID id | `EvmSnapshotResponse` |
| `findLatest` | UUID projectId | `Optional<EvmSnapshotResponse>` |
| `findByDateRange` | UUID projectId, LocalDate from, LocalDate to | `List<EvmSnapshotResponse>` |
| `create` | CreateEvmSnapshotRequest request | `EvmSnapshotResponse` |
| `delete` | UUID id | `void` |

---

### MobilizationService (`modules/planning/service/MobilizationService.java`)

**Dependencies:**
- Repositories: MobilizationLineRepository, MobilizationScheduleRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId | `List<MobilizationSchedule>` |
| `getLines` | UUID scheduleId | `List<MobilizationLine>` |
| `generate` | UUID projectId | `MobilizationSchedule` |
| `addLine` | UUID scheduleId, MobilizationLine line | `MobilizationLine` |

---

### MultiProjectAllocationService (`modules/planning/service/MultiProjectAllocationService.java`)

**Dependencies:**
- Repositories: EmployeeCertificateRepository, EmployeeRepository, MultiProjectAllocationRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getAllocations` | Pageable pageable | `Page<MultiProjectAllocationResponse>` |
| `getAllocationsByDateRange` | LocalDate startDate, LocalDate endDate, List<UUID> projectIds, MultiProjectRe... | `List<MultiProjectAllocationResponse>` |
| `create` | CreateMultiProjectAllocationRequest request | `MultiProjectAllocationResponse` |
| `update` | UUID id, UpdateMultiProjectAllocationRequest request | `MultiProjectAllocationResponse` |
| `delete` | UUID id | `void` |
| `detectConflicts` | LocalDate startDate, LocalDate endDate | `List<AllocationConflictResponse>` |
| `getResourceSuggestions` | UUID projectId, LocalDate startDate, LocalDate endDate, List<String> skills | `List<ResourceSuggestionResponse>` |

---

### ResourceAllocationService (`modules/planning/service/ResourceAllocationService.java`)

**Dependencies:**
- Repositories: ResourceAllocationRepository, WbsNodeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByWbsNode` | UUID wbsNodeId, Pageable pageable | `Page<ResourceAllocationResponse>` |
| `findAllByWbsNode` | UUID wbsNodeId | `List<ResourceAllocationResponse>` |
| `findById` | UUID id | `ResourceAllocationResponse` |
| `create` | CreateResourceAllocationRequest request | `ResourceAllocationResponse` |
| `delete` | UUID id | `void` |

---

### ScheduleBaselineService (`modules/planning/service/ScheduleBaselineService.java`)

**Dependencies:**
- Repositories: ScheduleBaselineRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByProject` | UUID projectId, Pageable pageable | `Page<ScheduleBaselineResponse>` |
| `findById` | UUID id | `ScheduleBaselineResponse` |
| `create` | CreateScheduleBaselineRequest request | `ScheduleBaselineResponse` |
| `delete` | UUID id | `void` |

---

### SkillsMatchingService (`modules/planning/service/SkillsMatchingService.java`)

**Dependencies:**
- Repositories: AllocationScenarioRepository, EmployeeRepository, EmployeeSkillRepository, MultiProjectAllocationRepository, ProjectSkillRequirementRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `addEmployeeSkill` | CreateEmployeeSkillRequest request | `EmployeeSkillResponse` |
| `getEmployeeSkills` | UUID employeeId | `List<EmployeeSkillResponse>` |
| `removeEmployeeSkill` | UUID skillId | `void` |
| `addProjectRequirement` | CreateProjectSkillRequirementRequest request | `ProjectSkillRequirementResponse` |
| `getProjectRequirements` | UUID projectId | `List<ProjectSkillRequirementResponse>` |
| `removeProjectRequirement` | UUID requirementId | `void` |
| `suggestCandidates` | UUID projectId, int maxResults | `List<CandidateSuggestionResponse>` |
| `checkCertificationCompliance` | UUID employeeId, UUID projectId | `CertComplianceCheckResponse` |
| `runWhatIfScenario` | WhatIfScenarioRequest request | `WhatIfScenarioResponse` |
| `listScenarios` | Pageable pageable | `Page<AllocationScenarioResponse>` |

---

### WbsDependencyService (`modules/planning/service/WbsDependencyService.java`)

**Dependencies:**
- Repositories: WbsDependencyRepository, WbsNodeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByNodeId` | UUID nodeId | `List<WbsDependencyResponse>` |
| `findByProjectId` | UUID projectId | `List<WbsDependencyResponse>` |
| `findPredecessors` | UUID nodeId | `List<WbsDependencyResponse>` |
| `findSuccessors` | UUID nodeId | `List<WbsDependencyResponse>` |
| `create` | CreateWbsDependencyRequest request | `WbsDependencyResponse` |
| `delete` | UUID id | `void` |

---

### WbsNodeService (`modules/planning/service/WbsNodeService.java`)

**Dependencies:**
- Repositories: WbsDependencyRepository, WbsNodeRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByProject` | UUID projectId, Pageable pageable | `Page<WbsNodeResponse>` |
| `findById` | UUID id | `WbsNodeResponse` |
| `findTree` | UUID projectId | `List<WbsNodeResponse>` |
| `findChildren` | UUID parentId | `List<WbsNodeResponse>` |
| `findCriticalPath` | UUID projectId | `List<WbsNodeResponse>` |
| `create` | CreateWbsNodeRequest request | `WbsNodeResponse` |
| `update` | UUID id, UpdateWbsNodeRequest request | `WbsNodeResponse` |
| `delete` | UUID id | `void` |
| `recalculateCpm` | UUID projectId | `void` |
| `calculateForwardPass` | UUID projectId | `void` |
| `calculateBackwardPass` | UUID projectId | `void` |

---

### WorkVolumeService (`modules/planning/service/WorkVolumeService.java`)

**Dependencies:**
- Repositories: ProjectRepository, WbsNodeRepository, WorkVolumeEntryRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findByProject` | UUID projectId, Pageable pageable | `Page<WorkVolumeEntryResponse>` |
| `findByWbsNode` | UUID wbsNodeId, Pageable pageable | `Page<WorkVolumeEntryResponse>` |
| `findById` | UUID id | `WorkVolumeEntryResponse` |
| `findByProjectAndDate` | UUID projectId, LocalDate date | `List<WorkVolumeEntryResponse>` |
| `create` | CreateWorkVolumeEntryRequest request | `WorkVolumeEntryResponse` |
| `update` | UUID id, CreateWorkVolumeEntryRequest request | `WorkVolumeEntryResponse` |
| `delete` | UUID id | `void` |
| `getVolumeSummary` | UUID projectId, LocalDate date | `List<WorkVolumeSummaryResponse>` |

---

## Module: pmWorkflow

### IssueService (`modules/pmWorkflow/service/IssueService.java`)

**Dependencies:**
- Repositories: IssueCommentRepository, IssueRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listIssues` | UUID projectId, IssueStatus status, Pageable pageable | `Page<IssueResponseDto>` |
| `getIssue` | UUID id | `IssueResponseDto` |
| `createIssue` | CreateIssueRequest request | `IssueResponseDto` |
| `updateIssue` | UUID id, UpdateIssueRequest request | `IssueResponseDto` |
| `changeStatus` | UUID id, ChangeIssueStatusRequest request | `IssueResponseDto` |
| `deleteIssue` | UUID id | `void` |
| `listComments` | UUID issueId, Pageable pageable | `Page<IssueCommentResponseDto>` |
| `addComment` | CreateIssueCommentRequest request | `IssueCommentResponseDto` |
| `findOverdueIssues` | UUID projectId | `List<IssueResponseDto>` |

---

### PmSubmittalService (`modules/pmWorkflow/service/PmSubmittalService.java`)

**Dependencies:**
- Repositories: PmSubmittalRepository, SubmittalPackageRepository, SubmittalReviewRepository
- Services: AuditService
- Other: PtoCodeGenerator

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSubmittals` | UUID projectId, SubmittalStatus status, Pageable pageable | `Page<SubmittalResponseDto>` |
| `getSubmittal` | UUID id | `SubmittalResponseDto` |
| `createSubmittal` | CreateSubmittalRequest request | `SubmittalResponseDto` |
| `updateSubmittal` | UUID id, UpdateSubmittalRequest request | `SubmittalResponseDto` |
| `changeStatus` | UUID id, ChangeSubmittalStatusRequest request | `SubmittalResponseDto` |
| `deleteSubmittal` | UUID id | `void` |
| `findByBallInCourt` | UUID userId | `List<SubmittalResponseDto>` |
| `findOverdueSubmittals` | UUID projectId | `List<SubmittalResponseDto>` |
| `listPackages` | UUID projectId, Pageable pageable | `Page<SubmittalPackageResponseDto>` |
| `createPackage` | CreateSubmittalPackageRequest request | `SubmittalPackageResponseDto` |
| `deletePackage` | UUID id | `void` |
| `listReviews` | UUID submittalId, Pageable pageable | `Page<SubmittalReviewResponseDto>` |
| `addReview` | CreateSubmittalReviewRequest request | `SubmittalReviewResponseDto` |

---

### RfiService (`modules/pmWorkflow/service/RfiService.java`)

**Dependencies:**
- Repositories: RfiRepository, RfiResponseRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listRfis` | UUID projectId, RfiStatus status, Pageable pageable | `Page<RfiResponseDto>` |
| `getRfi` | UUID id | `RfiResponseDto` |
| `createRfi` | CreateRfiRequest request | `RfiResponseDto` |
| `updateRfi` | UUID id, UpdateRfiRequest request | `RfiResponseDto` |
| `changeStatus` | UUID id, ChangeRfiStatusRequest request | `RfiResponseDto` |
| `deleteRfi` | UUID id | `void` |
| `addResponse` | CreateRfiResponseRequest request | `RfiResponseEntryDto` |
| `listResponses` | UUID rfiId, Pageable pageable | `Page<RfiResponseEntryDto>` |
| `findOverdueRfis` | UUID projectId | `List<RfiResponseDto>` |

---

## Module: portal

### ClientClaimService (`modules/portal/service/ClientClaimService.java`)

**Dependencies:**
- Repositories: ClientClaimActivityRepository, ClientClaimRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createClaim` | CreateClientClaimRequest request | `ClientClaimResponse` |
| `getClaim` | UUID id | `ClientClaimDetailResponse` |
| `listClaims` | UUID projectId, ClaimStatus status, ClaimPriority priority, Pageable pageable | `Page<ClientClaimResponse>` |
| `triageClaim` | UUID id, TriageClaimRequest request | `ClientClaimResponse` |
| `assignClaim` | UUID id, AssignClaimRequest request | `ClientClaimResponse` |
| `startWork` | UUID id | `ClientClaimResponse` |
| `submitResolution` | UUID id, ResolveClaimRequest request | `ClientClaimResponse` |
| `acceptResolution` | UUID id, ClaimFeedbackRequest request | `ClientClaimResponse` |
| `rejectClaim` | UUID id, String reason | `ClientClaimResponse` |
| `addComment` | UUID id, AddClaimCommentRequest request | `void` |
| `checkSlaBreaches` |  | `void` |
| `getDashboard` | UUID projectId | `ClaimsDashboardResponse` |
| `getClaimsForPortalUser` | UUID portalUserId | `List<ClientClaimResponse>` |

---

### ClientPortalService (`modules/portal/service/ClientPortalService.java`)

**Dependencies:**
- Repositories: ClientDocumentSignatureRepository, ClientMilestoneRepository, ClientProgressSnapshotRepository, InvoiceRepository, PaymentRepository, PortalProjectRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createProgressSnapshot` | CreateProgressSnapshotRequest request | `ProgressSnapshotResponse` |
| `publishSnapshot` | UUID id | `ProgressSnapshotResponse` |
| `getPublishedSnapshots` | UUID projectId, Pageable pageable | `Page<ProgressSnapshotResponse>` |
| `getAllSnapshots` | UUID projectId, Pageable pageable | `Page<ProgressSnapshotResponse>` |
| `requestSignature` | CreateDocumentSignatureRequest request | `DocumentSignatureResponse` |
| `signDocument` | UUID signatureId, SignDocumentRequest request | `DocumentSignatureResponse` |
| `rejectDocument` | UUID signatureId, RejectDocumentRequest request | `DocumentSignatureResponse` |
| `getSignaturesForPortalUser` | UUID portalUserId, Pageable pageable | `Page<DocumentSignatureResponse>` |
| `getAllSignatures` | Pageable pageable | `Page<DocumentSignatureResponse>` |
| `getSignaturesByProject` | UUID projectId, Pageable pageable | `Page<DocumentSignatureResponse>` |
| `checkExpiredSignatures` |  | `void` |
| `createMilestone` | CreateMilestoneRequest request | `ClientMilestoneResponse` |
| `updateMilestone` | UUID id, UpdateMilestoneRequest request | `ClientMilestoneResponse` |
| `getVisibleMilestones` | UUID projectId, Pageable pageable | `Page<ClientMilestoneResponse>` |
| `getAllMilestones` | UUID projectId, Pageable pageable | `Page<ClientMilestoneResponse>` |
| `getClientDashboard` | UUID portalUserId, UUID projectId | `ClientDashboardResponse` |

---

### PortalAuthService (`modules/portal/service/PortalAuthService.java`)

**Dependencies:**
- Repositories: PortalUserRepository
- Services: JwtTokenProvider
- Other: PasswordEncoder

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `register` | PortalRegisterRequest request | `PortalLoginResponse` |
| `login` | PortalLoginRequest request | `PortalLoginResponse` |
| `forgotPassword` | ForgotPasswordRequest request | `void` |
| `resetPassword` | ResetPasswordRequest request | `void` |

---

### PortalDocumentService (`modules/portal/service/PortalDocumentService.java`)

**Dependencies:**
- Repositories: PortalDocumentRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getSharedDocuments` | UUID portalUserId, Pageable pageable | `Page<PortalDocumentResponse>` |
| `download` | UUID portalUserId, UUID documentId | `PortalDocumentResponse` |
| `shareDocument` | ShareDocumentRequest request | `PortalDocumentResponse` |

---

### PortalKs2DraftService (`modules/portal/service/PortalKs2DraftService.java`)

**Dependencies:**
- Repositories: PortalKs2DraftRepository, PortalUserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getMyDrafts` | UUID portalUserId, Pageable pageable | `Page<PortalKs2DraftResponse>` |
| `getAllDrafts` | Pageable pageable | `Page<PortalKs2DraftResponse>` |
| `getDraftsForReview` | Pageable pageable | `Page<PortalKs2DraftResponse>` |
| `getById` | UUID id | `PortalKs2DraftResponse` |
| `create` | CreatePortalKs2DraftRequest request, UUID portalUserId | `PortalKs2DraftResponse` |
| `update` | UUID id, UpdatePortalKs2DraftRequest request, UUID portalUserId | `PortalKs2DraftResponse` |
| `submit` | UUID id, UUID portalUserId | `PortalKs2DraftResponse` |
| `review` | UUID id, ReviewPortalKs2DraftRequest request | `PortalKs2DraftResponse` |
| `delete` | UUID id, UUID portalUserId | `void` |

---

### PortalMessageService (`modules/portal/service/PortalMessageService.java`)

**Dependencies:**
- Repositories: PortalMessageRepository, PortalUserRepository, ProjectRepository, UserRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `send` | UUID fromPortalUserId, UUID fromInternalUserId, SendPortalMessageRequest request | `PortalMessageResponse` |
| `getInbox` | UUID portalUserId, UUID internalUserId, Pageable pageable | `Page<PortalMessageResponse>` |
| `getOutbox` | UUID portalUserId, UUID internalUserId, Pageable pageable | `Page<PortalMessageResponse>` |
| `markRead` | UUID messageId | `PortalMessageResponse` |
| `getThread` | UUID parentMessageId | `List<PortalMessageResponse>` |

---

### PortalProjectService (`modules/portal/service/PortalProjectService.java`)

**Dependencies:**
- Repositories: PortalDocumentRepository, PortalProjectRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getMyProjects` | UUID portalUserId, Pageable pageable | `Page<PortalProjectResponse>` |
| `getProjectDetails` | UUID portalUserId, UUID projectId | `PortalProjectResponse` |
| `getProjectDocuments` | UUID portalUserId, UUID projectId | `List<PortalDocumentResponse>` |
| `getProjectDetails` | UUID projectId | `PortalProjectResponse` |
| `getProjectDocuments` | UUID projectId | `List<PortalDocumentResponse>` |
| `grantAccess` | GrantPortalProjectAccessRequest request | `PortalProjectResponse` |
| `revokeAccess` | UUID portalUserId, UUID projectId | `void` |

---

### PortalTaskService (`modules/portal/service/PortalTaskService.java`)

**Dependencies:**
- Repositories: PortalTaskRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getMyTasks` | UUID portalUserId, PortalTaskStatus status, Pageable pageable | `Page<PortalTaskResponse>` |
| `getAllTasks` | Pageable pageable | `Page<PortalTaskResponse>` |
| `getProjectTasks` | UUID projectId, Pageable pageable | `Page<PortalTaskResponse>` |
| `getById` | UUID id | `PortalTaskResponse` |
| `create` | CreatePortalTaskRequest request | `PortalTaskResponse` |
| `updateStatus` | UUID id, UpdatePortalTaskStatusRequest request, UUID portalUserId | `PortalTaskResponse` |
| `delete` | UUID id | `void` |

---

## Module: portfolio

### PortfolioService (`modules/portfolio/service/PortfolioService.java`)

**Dependencies:**
- Repositories: BidPackageRepository, OpportunityRepository, PrequalificationRepository, TenderSubmissionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listOpportunities` | String search, OpportunityStage stage, ClientType clientType, UUID organizati... | `Page<OpportunityResponse>` |
| `getOpportunity` | UUID id | `OpportunityResponse` |
| `createOpportunity` | CreateOpportunityRequest request | `OpportunityResponse` |
| `updateOpportunity` | UUID id, UpdateOpportunityRequest request | `OpportunityResponse` |
| `changeStage` | UUID id, ChangeOpportunityStageRequest request | `OpportunityResponse` |
| `deleteOpportunity` | UUID id | `void` |
| `getDashboard` | UUID organizationId | `PortfolioDashboardResponse` |
| `listBidPackages` | UUID opportunityId, BidStatus status, Pageable pageable | `Page<BidPackageResponse>` |
| `getBidPackage` | UUID id | `BidPackageResponse` |
| `createBidPackage` | CreateBidPackageRequest request | `BidPackageResponse` |
| `updateBidPackage` | UUID id, UpdateBidPackageRequest request | `BidPackageResponse` |
| `deleteBidPackage` | UUID id | `void` |
| `listPrequalifications` | UUID organizationId, PrequalificationStatus status, Pageable pageable | `Page<PrequalificationResponse>` |
| `getPrequalification` | UUID id | `PrequalificationResponse` |
| `createPrequalification` | CreatePrequalificationRequest request | `PrequalificationResponse` |
| `updatePrequalification` | UUID id, UpdatePrequalificationRequest request | `PrequalificationResponse` |
| `deletePrequalification` | UUID id | `void` |
| `listTenderSubmissions` | UUID bidPackageId, Pageable pageable | `Page<TenderSubmissionResponse>` |
| `getTenderSubmission` | UUID id | `TenderSubmissionResponse` |
| `createTenderSubmission` | CreateTenderSubmissionRequest request | `TenderSubmissionResponse` |
| `deleteTenderSubmission` | UUID id | `void` |
| `updateGoNoGoChecklist` | UUID id, String checklistJson, Integer score | `OpportunityResponse` |
| `assessMarginByAnalog` | UUID id | `Map<String, Object>` |

---

## Module: prequalification

### PrequalificationService (`modules/prequalification/service/PrequalificationService.java`)

**Dependencies:**
- Repositories: ContractorPrequalificationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | Pageable pageable | `Page<PrequalificationResponse>` |
| `getById` | UUID id | `PrequalificationResponse` |
| `create` | CreatePrequalificationRequest req | `PrequalificationResponse` |
| `evaluate` | UUID id | `PrequalificationResponse` |

---

### SroVerificationService (`modules/prequalification/service/SroVerificationService.java`)

**Dependencies:**
- Repositories: SroVerificationCacheRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `verify` | String inn | `SroVerificationResponse` |
| `getHistory` |  | `List<SroVerificationResponse>` |
| `getHistoryByInn` | String inn | `List<SroVerificationResponse>` |
| `forceRefresh` | String inn | `SroVerificationResponse` |

---

## Module: priceCoefficient

### PriceCoefficientService (`modules/priceCoefficient/service/PriceCoefficientService.java`)

**Dependencies:**
- Repositories: PriceCoefficientRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCoefficients` | Pageable pageable | `Page<PriceCoefficientResponse>` |
| `getCoefficient` | UUID id | `PriceCoefficientResponse` |
| `createCoefficient` | PriceCoefficientRequest request | `PriceCoefficientResponse` |
| `updateCoefficient` | UUID id, PriceCoefficientRequest request | `PriceCoefficientResponse` |
| `activateCoefficient` | UUID id | `PriceCoefficientResponse` |
| `expireCoefficient` | UUID id | `PriceCoefficientResponse` |
| `deleteCoefficient` | UUID id | `void` |
| `findByContractId` | UUID contractId | `List<PriceCoefficientResponse>` |
| `findActiveByProjectId` | UUID projectId | `List<PriceCoefficientResponse>` |
| `calculateAdjustedPrice` | CalculatePriceRequest request | `CalculatePriceResponse` |

---

## Module: procurement

### ProcurementDirectoryService (`modules/procurement/service/ProcurementDirectoryService.java`)

**Dependencies:**
- Repositories: CounterpartyRepository, MaterialRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSuppliers` |  | `List<ProcurementSupplierOptionResponse>` |
| `sendPriceRequests` | SendPriceRequestsRequest request | `void` |

---

### ProcurementService (`modules/procurement/service/ProcurementService.java`)

**Dependencies:**
- Repositories: ContractRepository, ProjectRepository, PurchaseRequestItemRepository, PurchaseRequestRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listRequests` | UUID projectId, List<PurchaseRequestStatus> statuses, PurchaseRequestPriority... | `Page<PurchaseRequestListResponse>` |
| `getRequestCounters` | UUID projectId, PurchaseRequestPriority priority, String search, UUID request... | `PurchaseRequestCountersResponse` |
| `getRequest` | UUID id | `PurchaseRequestResponse` |
| `createFromSpecItems` | UUID projectId, UUID specId, List<UUID> specItemIds | `PurchaseRequestResponse` |
| `createRequest` | CreatePurchaseRequestRequest request | `PurchaseRequestResponse` |
| `updateRequest` | UUID id, UpdatePurchaseRequestRequest request | `PurchaseRequestResponse` |
| `addItem` | UUID requestId, CreatePurchaseRequestItemRequest request | `PurchaseRequestItemResponse` |
| `updateItem` | UUID itemId, UpdatePurchaseRequestItemRequest request | `PurchaseRequestItemResponse` |
| `removeItem` | UUID itemId | `void` |
| `submitRequest` | UUID id | `PurchaseRequestResponse` |
| `approveRequest` | UUID id | `PurchaseRequestResponse` |
| `rejectRequest` | UUID id, String reason | `PurchaseRequestResponse` |
| `assignRequest` | UUID id, UUID assignedToId | `PurchaseRequestResponse` |
| `markOrdered` | UUID id | `PurchaseRequestResponse` |
| `markDelivered` | UUID id | `PurchaseRequestResponse` |
| `closeRequest` | UUID id | `PurchaseRequestResponse` |
| `cancelRequest` | UUID id | `PurchaseRequestResponse` |
| `recalculateTotals` | UUID requestId | `void` |
| `getDashboardSummary` | UUID projectId | `PurchaseRequestDashboardResponse` |

---

### PurchaseOrderService (`modules/procurement/service/PurchaseOrderService.java`)

**Dependencies:**
- Repositories: ProjectRepository, PurchaseOrderItemRepository, PurchaseOrderRepository, PurchaseRequestItemRepository, PurchaseRequestRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createFromPurchaseRequest` | UUID purchaseRequestId | `PurchaseOrderResponse` |
| `create` | CreatePurchaseOrderRequest request | `PurchaseOrderResponse` |
| `update` | UUID poId, UpdatePurchaseOrderRequest request | `PurchaseOrderResponse` |
| `approve` | UUID poId | `PurchaseOrderResponse` |
| `markSent` | UUID poId | `PurchaseOrderResponse` |
| `recordDelivery` | UUID poId, RecordDeliveryRequest request | `PurchaseOrderResponse` |
| `cancel` | UUID poId | `PurchaseOrderResponse` |
| `getById` | UUID poId | `PurchaseOrderResponse` |
| `getByProject` | UUID projectId | `List<PurchaseOrderResponse>` |
| `getByPurchaseRequest` | UUID purchaseRequestId | `PurchaseOrderResponse` |

---

## Module: procurementExt

### ProcurementExtService (`modules/procurementExt/service/ProcurementExtService.java`)

**Dependencies:**
- Repositories: DeliveryItemRepository, DeliveryRepository, DispatchItemRepository, MaterialReservationRepository, ProcurementDispatchOrderRepository, SupplierRatingRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDeliveries` | DeliveryStatus status, UUID routeId, Pageable pageable | `Page<DeliveryResponse>` |
| `getDelivery` | UUID id | `DeliveryResponse` |
| `createDelivery` | CreateDeliveryRequest request | `DeliveryResponse` |
| `updateDelivery` | UUID id, CreateDeliveryRequest request | `DeliveryResponse` |
| `deleteDelivery` | UUID id | `void` |
| `addDeliveryItem` | UUID deliveryId, CreateDeliveryItemRequest request | `DeliveryItemResponse` |
| `transitionDeliveryStatus` | UUID id, DeliveryStatus targetStatus | `DeliveryResponse` |
| `getDispatchOrder` | UUID id | `DispatchOrderResponse` |
| `createDispatchOrder` | CreateDispatchOrderRequest request | `DispatchOrderResponse` |
| `updateDispatchOrder` | UUID id, CreateDispatchOrderRequest request | `DispatchOrderResponse` |
| `deleteDispatchOrder` | UUID id | `void` |
| `transitionDispatchStatus` | UUID id, DispatchStatus targetStatus | `DispatchOrderResponse` |
| `releaseReservation` | UUID reservationId | `void` |
| `expireOverdueReservations` |  | `void` |
| `getRatingsForSupplier` | UUID supplierId | `List<SupplierRatingResponse>` |
| `createRating` | CreateSupplierRatingRequest request | `SupplierRatingResponse` |
| `updateRating` | UUID id, CreateSupplierRatingRequest request | `SupplierRatingResponse` |
| `deleteRating` | UUID id | `void` |

---

### PurchaseOrderService (`modules/procurementExt/service/PurchaseOrderService.java`)

**Dependencies:**
- Repositories: PurchaseOrderItemRepository, PurchaseOrderRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listOrders` | PurchaseOrderStatus status, UUID projectId, UUID supplierId, UUID purchaseReq... | `Page<PurchaseOrder>` |
| `getOrder` | UUID id | `PurchaseOrder` |
| `getOrderItems` | UUID orderId | `List<PurchaseOrderItem>` |
| `createOrder` | PurchaseOrder order | `PurchaseOrder` |
| `createOrderWithItems` | PurchaseOrder order, List<PurchaseOrderItem> items | `PurchaseOrder` |
| `updateOrder` | UUID id, PurchaseOrder updates | `PurchaseOrder` |
| `addItem` | UUID orderId, PurchaseOrderItem item | `PurchaseOrderItem` |
| `updateItem` | UUID orderId, UUID itemId, PurchaseOrderItem updates | `PurchaseOrderItem` |
| `deleteItem` | UUID orderId, UUID itemId | `void` |
| `sendOrder` | UUID id | `PurchaseOrder` |
| `confirmOrder` | UUID id | `PurchaseOrder` |
| `registerDelivery` | UUID id, UUID itemId, BigDecimal deliveredQty | `PurchaseOrder` |
| `cancelOrder` | UUID id | `PurchaseOrder` |
| `closeOrder` | UUID id | `PurchaseOrder` |
| `invoiceOrder` | UUID id | `PurchaseOrder` |
| `bulkTransitionOrders` | PurchaseOrderBulkTransitionAction action, List<UUID> orderIds | `PurchaseOrderBulkTransitionResponse` |
| `deleteOrder` | UUID id | `void` |

---

## Module: project

### ProjectCollaboratorService (`modules/project/service/ProjectCollaboratorService.java`)

**Dependencies:**
- Repositories: ProjectCollaboratorRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getProjectCollaborators` | UUID projectId | `List<ProjectCollaboratorResponse>` |
| `getPartnerProjects` | UUID partnerId | `List<ProjectCollaboratorResponse>` |
| `addCollaborator` | UUID projectId, CreateProjectCollaboratorRequest request | `ProjectCollaboratorResponse` |
| `acceptInvitation` | UUID collaboratorId | `ProjectCollaboratorResponse` |
| `removeCollaborator` | UUID collaboratorId | `void` |

---

### ProjectFinancialService (`modules/project/service/ProjectFinancialService.java`)

**Dependencies:**
- Repositories: BudgetRepository, CommitmentRepository, ContractRepository, CostCodeRepository, EstimateRepository, InvoiceRepository, PaymentRepository, ProjectRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getFinancials` | UUID projectId | `ProjectFinancialSummary` |
| `getDashboardTotals` | List<UUID> projectIds | `DashboardFinancialTotals` |
| `DashboardFinancialTotals` | BigDecimal totalContractAmount, BigDecimal totalPlannedBudget, BigDecimal tot... | `record` |

---

### ProjectMilestoneService (`modules/project/service/ProjectMilestoneService.java`)

**Dependencies:**
- Repositories: ProjectMilestoneRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listMilestones` | UUID projectId | `List<MilestoneResponse>` |
| `createMilestone` | UUID projectId, CreateMilestoneRequest request | `MilestoneResponse` |
| `updateMilestone` | UUID id, UpdateMilestoneRequest request | `MilestoneResponse` |
| `deleteMilestone` | UUID id | `void` |

---

### ProjectService (`modules/project/service/ProjectService.java`)

**Dependencies:**
- Repositories: ProjectMemberRepository, ProjectRepository, ProjectTaskRepository, UserRepository
- Services: AuditService, ProjectFinancialService, WebSocketNotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String search, ProjectStatus status, ProjectType type, ProjectPriority priori... | `Page<ProjectResponse>` |
| `findById` | UUID id | `ProjectResponse` |
| `create` | CreateProjectRequest request | `ProjectResponse` |
| `update` | UUID id, UpdateProjectRequest request | `ProjectResponse` |
| `updateStatus` | UUID id, ChangeStatusRequest request | `ProjectResponse` |
| `getMembers` | UUID projectId | `List<ProjectMemberResponse>` |
| `addMember` | UUID projectId, AddProjectMemberRequest request | `ProjectMemberResponse` |
| `removeMember` | UUID projectId, UUID memberId | `void` |
| `getDashboard` |  | `ProjectDashboardResponse` |
| `delete` | UUID id | `void` |

---

## Module: pto

### ActOsvidetelstvovanieService (`modules/pto/service/ActOsvidetelstvovanieService.java`)

**Dependencies:**
- Repositories: ActOsvidetelstvovanieRepository
- Services: AuditService
- Other: PtoCodeGenerator

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listActs` | UUID projectId, Pageable pageable | `Page<ActOsvidetelstvovanieResponse>` |
| `getAct` | UUID id | `ActOsvidetelstvovanieResponse` |
| `createAct` | CreateActOsvidetelstvovanieRequest request | `ActOsvidetelstvovanieResponse` |
| `changeStatus` | UUID id, ActOsvidetelstvovanieStatus newStatus | `ActOsvidetelstvovanieResponse` |

---

### HiddenWorkActService (`modules/pto/service/HiddenWorkActService.java`)

**Dependencies:**
- Repositories: HiddenWorkActRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, HiddenWorkActStatus status, Pageable pageable | `Page<HiddenWorkActResponse>` |
| `findById` | UUID id | `HiddenWorkActResponse` |
| `create` | CreateHiddenWorkActRequest request | `HiddenWorkActResponse` |
| `updateStatus` | UUID id, HiddenWorkActStatus newStatus | `HiddenWorkActResponse` |
| `delete` | UUID id | `void` |

---

### Ks11AcceptanceActService (`modules/pto/service/Ks11AcceptanceActService.java`)

**Dependencies:**
- Repositories: Ks11AcceptanceActRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, Ks11Status status, Pageable pageable | `Page<Ks11AcceptanceActResponse>` |
| `findById` | UUID id | `Ks11AcceptanceActResponse` |
| `create` | CreateKs11AcceptanceActRequest request | `Ks11AcceptanceActResponse` |
| `updateStatus` | UUID id, Ks11Status newStatus | `Ks11AcceptanceActResponse` |
| `delete` | UUID id | `void` |

---

### Ks6JournalService (`modules/pto/service/Ks6JournalService.java`)

**Dependencies:**
- Repositories: Ks6JournalRepository, Ks6aRecordRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | UUID projectId, Ks6JournalStatus status, Pageable pageable | `Page<Ks6JournalResponse>` |
| `findById` | UUID id | `Ks6JournalResponse` |
| `create` | CreateKs6JournalRequest request | `Ks6JournalResponse` |
| `activate` | UUID id | `Ks6JournalResponse` |
| `close` | UUID id | `Ks6JournalResponse` |
| `delete` | UUID id | `void` |
| `findRecords` | UUID ks6JournalId, Pageable pageable | `Page<Ks6aRecordResponse>` |
| `addRecord` | CreateKs6aRecordRequest request | `Ks6aRecordResponse` |
| `deleteRecord` | UUID recordId | `void` |

---

### LabTestService (`modules/pto/service/LabTestService.java`)

**Dependencies:**
- Repositories: LabTestRepository
- Services: AuditService
- Other: PtoCodeGenerator

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listLabTests` | UUID projectId, Pageable pageable | `Page<LabTestResponse>` |
| `getLabTest` | UUID id | `LabTestResponse` |
| `createLabTest` | CreateLabTestRequest request | `LabTestResponse` |
| `deleteLabTest` | UUID id | `void` |

---

### PtoDashboardService (`modules/pto/service/PtoDashboardService.java`)

**Dependencies:**
- Repositories: ActOsvidetelstvovanieRepository, LabTestRepository, PtoDocumentRepository, PtoMaterialCertificateRepository, QualityPlanRepository, SubmittalRepository, WorkPermitRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getDashboard` | UUID projectId | `PtoDashboardResponse` |

---

### PtoDocumentService (`modules/pto/service/PtoDocumentService.java`)

**Dependencies:**
- Repositories: PtoDocumentRepository, PtoDocumentVersionRepository
- Services: AuditService
- Other: PtoCodeGenerator

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDocuments` | UUID projectId, PtoDocumentStatus status, Pageable pageable | `Page<PtoDocumentResponse>` |
| `getDocument` | UUID id | `PtoDocumentResponse` |
| `createDocument` | CreatePtoDocumentRequest request | `PtoDocumentResponse` |
| `updateDocument` | UUID id, UpdatePtoDocumentRequest request | `PtoDocumentResponse` |
| `changeStatus` | UUID id, ChangePtoStatusRequest request | `PtoDocumentResponse` |
| `deleteDocument` | UUID id | `void` |

---

### PtoMaterialCertificateService (`modules/pto/service/PtoMaterialCertificateService.java`)

**Dependencies:**
- Repositories: PtoMaterialCertificateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCertificates` | UUID materialId, Pageable pageable | `Page<MaterialCertificateResponse>` |
| `getCertificate` | UUID id | `MaterialCertificateResponse` |
| `createCertificate` | CreateMaterialCertificateRequest request | `MaterialCertificateResponse` |
| `invalidateCertificate` | UUID id | `MaterialCertificateResponse` |
| `deleteCertificate` | UUID id | `void` |

---

### SubmittalService (`modules/pto/service/SubmittalService.java`)

**Dependencies:**
- Repositories: SubmittalCommentRepository, SubmittalRepository
- Services: AuditService
- Other: PtoCodeGenerator

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSubmittals` | UUID projectId, SubmittalStatus status, Pageable pageable | `Page<SubmittalResponse>` |
| `getSubmittal` | UUID id | `SubmittalResponse` |
| `createSubmittal` | CreateSubmittalRequest request | `SubmittalResponse` |
| `changeStatus` | UUID id, ChangeSubmittalStatusRequest request | `SubmittalResponse` |
| `addComment` | UUID submittalId, CreateSubmittalCommentRequest request | `SubmittalCommentResponse` |
| `getComments` | UUID submittalId | `List<SubmittalCommentResponse>` |
| `deleteSubmittal` | UUID id | `void` |

---

### WorkPermitService (`modules/pto/service/WorkPermitService.java`)

**Dependencies:**
- Repositories: WorkPermitRepository
- Services: AuditService
- Other: PtoCodeGenerator

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listWorkPermits` | UUID projectId, WorkPermitStatus status, Pageable pageable | `Page<WorkPermitResponse>` |
| `getWorkPermit` | UUID id | `WorkPermitResponse` |
| `createWorkPermit` | CreateWorkPermitRequest request | `WorkPermitResponse` |
| `changeStatus` | UUID id, WorkPermitStatus newStatus | `WorkPermitResponse` |
| `deleteWorkPermit` | UUID id | `void` |

---

## Module: punchlist

### PunchListService (`modules/punchlist/service/PunchListService.java`)

**Dependencies:**
- Repositories: ProjectRepository, PunchItemCommentRepository, PunchItemRepository, PunchListRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPunchLists` | UUID projectId, Pageable pageable | `Page<PunchListResponse>` |
| `getPunchList` | UUID id | `PunchListResponse` |
| `createPunchList` | CreatePunchListRequest request | `PunchListResponse` |
| `updatePunchList` | UUID id, CreatePunchListRequest request | `PunchListResponse` |
| `deletePunchList` | UUID id | `void` |
| `completePunchList` | UUID id | `PunchListResponse` |
| `getPunchListItems` | UUID punchListId | `List<PunchItemResponse>` |
| `addItem` | UUID punchListId, CreatePunchItemRequest request | `PunchItemResponse` |
| `fixItem` | UUID itemId | `PunchItemResponse` |
| `verifyItem` | UUID itemId, UUID verifiedById | `PunchItemResponse` |
| `closeItem` | UUID itemId | `PunchItemResponse` |
| `deleteItem` | UUID itemId | `void` |
| `getItemComments` | UUID itemId | `List<PunchItemCommentResponse>` |
| `addComment` | UUID itemId, CreatePunchItemCommentRequest request | `PunchItemCommentResponse` |

---

## Module: quality

### ChecklistTemplateService (`modules/quality/service/ChecklistTemplateService.java`)

**Dependencies:**
- Repositories: ChecklistTemplateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | Pageable pageable | `Page<ChecklistTemplateResponse>` |
| `create` | CreateChecklistTemplateRequest request | `ChecklistTemplateResponse` |
| `update` | UUID id, UpdateChecklistTemplateRequest request | `ChecklistTemplateResponse` |

---

### MaterialCertificateService (`modules/quality/service/MaterialCertificateService.java`)

**Dependencies:**
- Repositories: CertificateLineRepository, MaterialCertificateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCertificates` | UUID materialId, MaterialCertificateStatus status, Pageable pageable | `Page<MaterialCertificateResponse>` |
| `getCertificate` | UUID id | `MaterialCertificateResponse` |
| `createCertificate` | CreateMaterialCertificateRequest request | `MaterialCertificateResponse` |
| `updateCertificate` | UUID id, UpdateMaterialCertificateRequest request | `MaterialCertificateResponse` |
| `verifyCertificate` | UUID id, UUID verifiedById | `MaterialCertificateResponse` |
| `getExpiredCertificates` |  | `List<MaterialCertificateResponse>` |
| `getExpiringCertificates` | int daysAhead | `List<MaterialCertificateResponse>` |
| `deleteCertificate` | UUID id | `void` |
| `getLines` | UUID certificateId | `List<CertificateLineResponse>` |
| `addLine` | UUID certificateId, CreateCertificateLineRequest request | `CertificateLineResponse` |
| `removeLine` | UUID lineId | `void` |

---

### MaterialInspectionService (`modules/quality/service/MaterialInspectionService.java`)

**Dependencies:**
- Repositories: MaterialInspectionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | UUID projectId, Pageable pageable | `Page<MaterialInspectionResponse>` |
| `create` | CreateMaterialInspectionRequest request | `MaterialInspectionResponse` |

---

### NonConformanceService (`modules/quality/service/NonConformanceService.java`)

**Dependencies:**
- Repositories: NonConformanceRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listNonConformances` | UUID projectId, Pageable pageable | `Page<NonConformanceResponse>` |
| `getNonConformance` | UUID id | `NonConformanceResponse` |
| `createNonConformance` | CreateNonConformanceRequest request | `NonConformanceResponse` |
| `updateNonConformance` | UUID id, UpdateNonConformanceRequest request | `NonConformanceResponse` |
| `closeNonConformance` | UUID id | `NonConformanceResponse` |
| `deleteNonConformance` | UUID id | `void` |

---

### QualityCertificateService (`modules/quality/service/QualityCertificateService.java`)

**Dependencies:**
- Repositories: QualityCertificateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCertificates` | UUID supplierId, UUID materialId, Pageable pageable | `Page<QualityCertificateResponse>` |
| `getCertificate` | UUID id | `QualityCertificateResponse` |
| `createCertificate` | CreateQualityCertificateRequest request | `QualityCertificateResponse` |
| `updateCertificate` | UUID id, UpdateQualityCertificateRequest request | `QualityCertificateResponse` |
| `verifyCertificate` | UUID id, UUID verifiedById | `QualityCertificateResponse` |
| `getExpiredCertificates` |  | `List<QualityCertificateResponse>` |
| `getExpiringCertificates` | int daysAhead | `List<QualityCertificateResponse>` |
| `deleteCertificate` | UUID id | `void` |

---

### QualityCheckService (`modules/quality/service/QualityCheckService.java`)

**Dependencies:**
- Repositories: QualityCheckRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listChecks` | UUID projectId, Pageable pageable | `Page<QualityCheckResponse>` |
| `getCheck` | UUID id | `QualityCheckResponse` |
| `createCheck` | CreateQualityCheckRequest request | `QualityCheckResponse` |
| `updateCheck` | UUID id, UpdateQualityCheckRequest request | `QualityCheckResponse` |
| `startCheck` | UUID id | `QualityCheckResponse` |
| `completeCheck` | UUID id, CheckResult result, String findings, String recommendations | `QualityCheckResponse` |
| `deleteCheck` | UUID id | `void` |

---

### QualityChecklistService (`modules/quality/service/QualityChecklistService.java`)

**Dependencies:**
- Repositories: ChecklistExecutionItemRepository, QualityChecklistRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listChecklists` | UUID projectId, Pageable pageable | `Page<QualityChecklistResponse>` |
| `getChecklist` | UUID id | `QualityChecklistResponse` |
| `getChecklistItems` | UUID checklistId | `List<ChecklistExecutionItemResponse>` |
| `createChecklist` | CreateQualityChecklistRequest request | `QualityChecklistResponse` |
| `updateChecklistItem` | UUID checklistId, UUID itemId, UpdateChecklistItemRequest request | `ChecklistExecutionItemResponse` |
| `completeChecklist` | UUID id | `QualityChecklistResponse` |
| `deleteChecklist` | UUID id | `void` |

---

### QualityGateService (`modules/quality/service/QualityGateService.java`)

**Dependencies:**
- Repositories: DocumentRepository, ProjectRepository, QualityCheckRepository, QualityGateRepository, QualityGateTemplateRepository, WbsNodeRepository, WorkVolumeEntryRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getGatesForProject` | UUID projectId | `List<QualityGateResponse>` |
| `getGateDetail` | UUID gateId | `QualityGateResponse` |
| `createGate` | CreateQualityGateRequest request | `QualityGateResponse` |
| `updateGate` | UUID id, UpdateQualityGateRequest request | `QualityGateResponse` |
| `deleteGate` | UUID id | `void` |
| `evaluateGate` | UUID gateId | `QualityGateResponse` |
| `evaluateAllForProject` | UUID projectId | `List<QualityGateResponse>` |
| `listTemplates` |  | `List<QualityGateTemplateResponse>` |
| `applyTemplate` | ApplyTemplateRequest request | `List<QualityGateResponse>` |
| `checkProgression` | UUID wbsNodeId | `ProgressionCheckResponse` |

---

### SupervisionEntryService (`modules/quality/service/SupervisionEntryService.java`)

**Dependencies:**
- Repositories: SupervisionEntryRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | UUID projectId, Pageable pageable | `Page<SupervisionEntryResponse>` |
| `create` | CreateSupervisionEntryRequest request | `SupervisionEntryResponse` |

---

### ToleranceService (`modules/quality/service/ToleranceService.java`)

**Dependencies:**
- Repositories: ToleranceCheckRepository, ToleranceRuleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listRules` | ToleranceCategory category, Pageable pageable | `Page<ToleranceRuleResponse>` |
| `getRule` | UUID id | `ToleranceRuleResponse` |
| `createRule` | CreateToleranceRuleRequest request | `ToleranceRuleResponse` |
| `updateRule` | UUID id, UpdateToleranceRuleRequest request | `ToleranceRuleResponse` |
| `deleteRule` | UUID id | `void` |
| `listChecks` | UUID projectId, UUID toleranceRuleId, Pageable pageable | `Page<ToleranceCheckResponse>` |
| `performCheck` | CreateToleranceCheckRequest request | `ToleranceCheckResponse` |
| `getFailedChecks` | UUID projectId | `List<ToleranceCheckResponse>` |
| `markForRecheck` | UUID checkId | `ToleranceCheckResponse` |

---

## Module: recruitment

### RecruitmentService (`modules/recruitment/service/RecruitmentService.java`)

**Dependencies:**
- Repositories: ApplicantRepository, InterviewRepository, JobPositionRepository, RecruitmentStageRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listApplicants` | String search, ApplicantStatus status, UUID jobPositionId, Pageable pageable | `Page<ApplicantResponse>` |
| `getApplicant` | UUID id | `ApplicantResponse` |
| `createApplicant` | CreateApplicantRequest request | `ApplicantResponse` |
| `updateApplicantStage` | UUID id, UUID stageId | `ApplicantResponse` |
| `updateApplicantStatus` | UUID id, ApplicantStatus newStatus | `ApplicantResponse` |
| `deleteApplicant` | UUID id | `void` |
| `listJobPositions` | String search, JobPositionStatus status, UUID departmentId, Pageable pageable | `Page<JobPositionResponse>` |
| `getJobPosition` | UUID id | `JobPositionResponse` |
| `createJobPosition` | CreateJobPositionRequest request | `JobPositionResponse` |
| `updateJobPositionStatus` | UUID id, JobPositionStatus newStatus | `JobPositionResponse` |
| `deleteJobPosition` | UUID id | `void` |
| `listStages` |  | `List<RecruitmentStage>` |
| `listInterviews` | UUID applicantId, UUID interviewerId, Pageable pageable | `Page<InterviewResponse>` |
| `getInterview` | UUID id | `InterviewResponse` |
| `scheduleInterview` | ScheduleInterviewRequest request | `InterviewResponse` |
| `updateInterviewResult` | UUID id, com.privod.platform.modules.recruitment.domain.InterviewResult resul... | `InterviewResponse` |
| `deleteInterview` | UUID id | `void` |

---

## Module: regulatory

### ConstructionPermitService (`modules/regulatory/service/ConstructionPermitService.java`)

**Dependencies:**
- Repositories: ConstructionPermitRepository, ProjectRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPermits` | UUID projectId, Pageable pageable | `Page<ConstructionPermitResponse>` |
| `getPermit` | UUID id | `ConstructionPermitResponse` |
| `createPermit` | CreateConstructionPermitRequest request | `ConstructionPermitResponse` |
| `updatePermit` | UUID id, CreateConstructionPermitRequest request | `ConstructionPermitResponse` |
| `deletePermit` | UUID id | `void` |
| `suspendPermit` | UUID id | `ConstructionPermitResponse` |
| `revokePermit` | UUID id | `ConstructionPermitResponse` |

---

### PrescriptionService (`modules/regulatory/service/PrescriptionService.java`)

**Dependencies:**
- Repositories: PrescriptionRepository, ProjectRepository
- Services: NotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPrescriptions` | UUID projectId, PrescriptionStatus status, RegulatoryBodyType bodyType, Strin... | `Page<PrescriptionResponse>` |
| `getPrescription` | UUID id | `PrescriptionResponse` |
| `createPrescription` | CreatePrescriptionRequest request | `PrescriptionResponse` |
| `updatePrescription` | UUID id, UpdatePrescriptionRequest request | `PrescriptionResponse` |
| `changeStatus` | UUID id, PrescriptionStatus newStatus | `PrescriptionResponse` |
| `fileAppeal` | UUID id | `PrescriptionResponse` |
| `deletePrescription` | UUID id | `void` |
| `getDashboard` |  | `PrescriptionDashboardResponse` |

---

### RegulatoryInspectionService (`modules/regulatory/service/RegulatoryInspectionService.java`)

**Dependencies:**
- Repositories: PrescriptionRepository, ProjectRepository, RegulatoryInspectionRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listInspections` | UUID projectId, Pageable pageable | `Page<RegulatoryInspectionResponse>` |
| `getInspection` | UUID id | `RegulatoryInspectionResponse` |
| `createInspection` | CreateRegulatoryInspectionRequest request | `RegulatoryInspectionResponse` |
| `updateInspection` | UUID id, CreateRegulatoryInspectionRequest request | `RegulatoryInspectionResponse` |
| `deleteInspection` | UUID id | `void` |
| `getInspectionPrescriptions` | UUID inspectionId | `List<PrescriptionResponse>` |
| `addPrescription` | UUID inspectionId, CreatePrescriptionRequest request | `PrescriptionResponse` |
| `completePrescription` | UUID id, String evidenceUrl | `PrescriptionResponse` |
| `getOverduePrescriptions` |  | `List<PrescriptionResponse>` |

---

### RegulatoryReportService (`modules/regulatory/service/RegulatoryReportService.java`)

**Dependencies:**
- Repositories: ProjectRepository, RegulatoryReportRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listReports` | UUID projectId, Pageable pageable | `Page<RegulatoryReportResponse>` |
| `getReport` | UUID id | `RegulatoryReportResponse` |
| `createReport` | CreateRegulatoryReportRequest request | `RegulatoryReportResponse` |
| `updateReport` | UUID id, UpdateRegulatoryReportRequest request | `RegulatoryReportResponse` |
| `submitReport` | UUID id, UUID submittedById | `RegulatoryReportResponse` |
| `acceptReport` | UUID id | `RegulatoryReportResponse` |
| `rejectReport` | UUID id, String reason | `RegulatoryReportResponse` |
| `deleteReport` | UUID id | `void` |

---

### ReportingCalendarService (`modules/regulatory/service/ReportingCalendarService.java`)

**Dependencies:**
- Repositories: ReportingDeadlineRepository, ReportingSubmissionRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findDeadlineById` | UUID id | `ReportingDeadlineResponse` |
| `findAllDeadlines` | Pageable pageable | `Page<ReportingDeadlineResponse>` |
| `findDeadlinesByFilters` | DeadlineStatus status, String reportType, String regulatoryBody, LocalDate fr... | `Page<ReportingDeadlineResponse>` |
| `findUpcomingDeadlines` | int daysAhead | `List<ReportingDeadlineResponse>` |
| `findOverdueDeadlines` |  | `List<ReportingDeadlineResponse>` |
| `createDeadline` | CreateReportingDeadlineRequest request | `ReportingDeadlineResponse` |
| `updateDeadline` | UUID id, UpdateReportingDeadlineRequest request | `ReportingDeadlineResponse` |
| `markAsSubmitted` | UUID id, UUID submittedById | `ReportingDeadlineResponse` |
| `deleteDeadline` | UUID id | `void` |
| `findSubmissionById` | UUID id | `ReportingSubmissionResponse` |
| `findSubmissionsByDeadline` | UUID deadlineId, Pageable pageable | `Page<ReportingSubmissionResponse>` |
| `createSubmission` | CreateReportingSubmissionRequest request | `ReportingSubmissionResponse` |

---

## Module: report

### DocumentExportService (`modules/report/service/DocumentExportService.java`)

**Dependencies:**
- Repositories: EstimateItemRepository, EstimateRepository, InvoiceRepository, Ks2DocumentRepository, Ks2LineRepository, ProjectRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getKs2ExportData` | UUID ks2Id | `Ks2ExportResponse` |
| `getEstimateExportData` | UUID estimateId | `EstimateExportResponse` |
| `getInvoiceExportData` | UUID invoiceId | `InvoiceExportResponse` |

---

### PdfGenerationService (`modules/report/service/PdfGenerationService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `generatePdf` | ReportTemplate template, Map<String, Object> parameters | `byte[]` |
| `renderHtml` | ReportTemplate template, Map<String, Object> parameters | `String` |

---

### ReportService (`modules/report/service/ReportService.java`)

**Dependencies:**
- Repositories: GeneratedReportRepository, PrintFormRepository, ReportTemplateRepository
- Services: PdfGenerationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createTemplate` | CreateReportTemplateRequest request | `ReportTemplateResponse` |
| `getTemplates` | String reportType, Pageable pageable | `Page<ReportTemplateResponse>` |
| `getTemplate` | String code | `ReportTemplateResponse` |
| `updateTemplate` | String code, CreateReportTemplateRequest request | `ReportTemplateResponse` |
| `deleteTemplate` | String code | `void` |
| `generateReport` | GenerateReportRequest request | `GeneratedReportResponse` |
| `getGeneratedReports` | String entityType, UUID entityId, Pageable pageable | `Page<GeneratedReportResponse>` |
| `getPrintForms` | String entityType | `List<PrintFormResponse>` |

---

## Module: revenueRecognition

### CompletionPercentageService (`modules/revenueRecognition/service/CompletionPercentageService.java`)

**Dependencies:**
- Repositories: CompletionPercentageRepository
- Services: AuditService, RevenueContractService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByContract` | UUID revenueContractId, Pageable pageable | `Page<CompletionPercentageResponse>` |
| `getById` | UUID id | `CompletionPercentageResponse` |
| `getLatest` | UUID revenueContractId | `CompletionPercentageResponse` |
| `create` | CreateCompletionPercentageRequest request | `CompletionPercentageResponse` |
| `delete` | UUID id | `void` |

---

### RevenueAdjustmentService (`modules/revenueRecognition/service/RevenueAdjustmentService.java`)

**Dependencies:**
- Repositories: RevenueAdjustmentRepository
- Services: AuditService, RevenueRecognitionPeriodService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByPeriod` | UUID periodId, Pageable pageable | `Page<RevenueAdjustmentResponse>` |
| `getById` | UUID id | `RevenueAdjustmentResponse` |
| `create` | CreateRevenueAdjustmentRequest request | `RevenueAdjustmentResponse` |
| `approve` | UUID id, UUID approvedById | `RevenueAdjustmentResponse` |
| `delete` | UUID id | `void` |

---

### RevenueContractService (`modules/revenueRecognition/service/RevenueContractService.java`)

**Dependencies:**
- Repositories: RevenueContractRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listContracts` | UUID organizationId, UUID projectId, RecognitionMethod method, RecognitionSta... | `Page<RevenueContractResponse>` |
| `getContract` | UUID id | `RevenueContractResponse` |
| `createContract` | CreateRevenueContractRequest request | `RevenueContractResponse` |
| `updateContract` | UUID id, UpdateRevenueContractRequest request | `RevenueContractResponse` |
| `deleteContract` | UUID id | `void` |

---

### RevenueRecognitionPeriodService (`modules/revenueRecognition/service/RevenueRecognitionPeriodService.java`)

**Dependencies:**
- Repositories: RevenueRecognitionPeriodRepository
- Services: AuditService, RevenueContractService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listPeriods` | UUID revenueContractId, Pageable pageable | `Page<RevenueRecognitionPeriodResponse>` |
| `getPeriod` | UUID id | `RevenueRecognitionPeriodResponse` |
| `createPeriod` | CreateRecognitionPeriodRequest request | `RevenueRecognitionPeriodResponse` |
| `calculatePeriod` | UUID periodId, CalculatePeriodRequest request | `RevenueRecognitionPeriodResponse` |
| `changeStatus` | UUID periodId, ChangePeriodStatusRequest request | `RevenueRecognitionPeriodResponse` |
| `deletePeriod` | UUID id | `void` |

---

## Module: russianDoc

### EdoDocumentService (`modules/russianDoc/service/EdoDocumentService.java`)

**Dependencies:**
- Repositories: EdoDocumentRepository, EdoExchangeLogRepository, EdoSignatureRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listDocuments` | Pageable pageable | `Page<EdoDocumentResponse>` |
| `getDocument` | UUID id | `EdoDocumentResponse` |
| `createDocument` | CreateEdoDocumentRequest request | `EdoDocumentResponse` |
| `updateDocument` | UUID id, CreateEdoDocumentRequest request | `EdoDocumentResponse` |
| `deleteDocument` | UUID id | `void` |
| `signBySender` | UUID id, UUID signerId | `EdoDocumentResponse` |
| `sendDocument` | UUID id | `EdoDocumentResponse` |
| `markDelivered` | UUID id | `EdoDocumentResponse` |
| `signByReceiver` | UUID id, UUID signerId | `EdoDocumentResponse` |
| `rejectDocument` | UUID id, String reason | `EdoDocumentResponse` |
| `cancelDocument` | UUID id | `EdoDocumentResponse` |
| `getSignatures` | UUID edoDocumentId | `List<EdoSignatureResponse>` |
| `addSignature` | CreateEdoSignatureRequest request | `EdoSignatureResponse` |
| `getDocumentHistory` | UUID edoDocumentId | `List<EdoExchangeLogResponse>` |

---

### EdoService (`modules/russianDoc/service/EdoService.java`)

**Dependencies:**
- Repositories: EdoGeneratedDocumentRepository, EdoTemplateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTemplates` | Pageable pageable | `Page<EdoTemplateResponse>` |
| `getTemplate` | UUID id | `EdoTemplateResponse` |
| `createTemplate` | CreateEdoTemplateRequest request | `EdoTemplateResponse` |
| `updateTemplate` | UUID id, CreateEdoTemplateRequest request | `EdoTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |
| `getActiveTemplates` | String documentType | `List<EdoTemplateResponse>` |
| `listGeneratedDocuments` | Pageable pageable | `Page<EdoGeneratedDocumentResponse>` |
| `generateDocument` | GenerateEdoDocumentRequest request | `EdoGeneratedDocumentResponse` |
| `getDocumentsBySource` | String sourceType, UUID sourceId | `List<EdoGeneratedDocumentResponse>` |

---

### OcrEstimateService (`modules/russianDoc/service/OcrEstimateService.java`)

**Dependencies:**
- Repositories: OcrEstimateResultRepository, OcrTaskRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `processEstimate` | UUID taskId | `List<OcrEstimateResultResponse>` |
| `getEstimateResults` | UUID taskId | `List<OcrEstimateResultResponse>` |
| `acceptResults` | AcceptOcrResultRequest request | `List<OcrEstimateResultResponse>` |
| `rejectResult` | UUID resultId | `void` |

---

### OcrService (`modules/russianDoc/service/OcrService.java`)

**Dependencies:**
- Repositories: OcrTaskRepository, OcrTemplateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTasks` | UUID projectId, Pageable pageable | `Page<OcrTaskResponse>` |
| `getTask` | UUID id | `OcrTaskResponse` |
| `createTask` | CreateOcrTaskRequest request | `OcrTaskResponse` |
| `startProcessing` | UUID id | `OcrTaskResponse` |
| `completeTask` | UUID id, String recognizedText, String recognizedFields, Double confidence | `OcrTaskResponse` |
| `failTask` | UUID id, String errorMessage | `OcrTaskResponse` |
| `deleteTask` | UUID id | `void` |
| `getPendingTasks` |  | `List<OcrTaskResponse>` |
| `listTemplates` | Pageable pageable | `Page<OcrTemplate>` |
| `getActiveTemplates` |  | `List<OcrTemplate>` |

---

### RussianDocService (`modules/russianDoc/service/RussianDocService.java`)

**Dependencies:**
- Repositories: ActRepository, InventoryActRepository, PowerOfAttorneyRepository, SchetFakturaRepository, Torg12Repository, UpdRepository, WaybillRepository, WriteOffActRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listUpd` | UUID projectId, Pageable pageable | `Page<UpdResponse>` |
| `getUpd` | UUID id | `UpdResponse` |
| `createUpd` | CreateUpdRequest request | `UpdResponse` |
| `updateUpd` | UUID id, CreateUpdRequest request | `UpdResponse` |
| `deleteUpd` | UUID id | `void` |
| `changeUpdStatus` | UUID id, ChangeRussianDocStatusRequest request | `UpdResponse` |
| `listTorg12` | UUID projectId, Pageable pageable | `Page<Torg12>` |
| `getTorg12` | UUID id | `Torg12` |
| `listSchetFaktura` | UUID projectId, Pageable pageable | `Page<SchetFaktura>` |
| `getSchetFaktura` | UUID id | `SchetFaktura` |
| `listActs` | UUID projectId, Pageable pageable | `Page<Act>` |
| `getAct` | UUID id | `Act` |
| `listPowerOfAttorneys` | UUID projectId, Pageable pageable | `Page<PowerOfAttorney>` |
| `getPowerOfAttorney` | UUID id | `PowerOfAttorney` |
| `listWaybills` | UUID projectId, Pageable pageable | `Page<Waybill>` |
| `getWaybill` | UUID id | `Waybill` |
| `listInventoryActs` | UUID projectId, Pageable pageable | `Page<InventoryAct>` |
| `getInventoryAct` | UUID id | `InventoryAct` |
| `listWriteOffActs` | UUID projectId, Pageable pageable | `Page<WriteOffAct>` |
| `getWriteOffAct` | UUID id | `WriteOffAct` |

---

## Module: safety

### SafetyAccidentActService (`modules/safety/service/SafetyAccidentActService.java`)

**Dependencies:**
- Repositories: AccidentActRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listActs` | UUID projectId, Pageable pageable | `Page<AccidentActResponse>` |
| `getAct` | UUID id | `AccidentActResponse` |
| `createAct` | CreateAccidentActRequest request | `AccidentActResponse` |
| `updateStatus` | UUID id, UpdateAccidentActStatusRequest request | `AccidentActResponse` |

---

### SafetyBriefingService (`modules/safety/service/SafetyBriefingService.java`)

**Dependencies:**
- Repositories: SafetyBriefingRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listBriefings` | UUID projectId, String briefingType, String status, String search, Pageable p... | `Page<SafetyBriefingResponse>` |
| `getBriefing` | UUID id | `SafetyBriefingResponse` |
| `createBriefing` | CreateSafetyBriefingRequest request | `SafetyBriefingResponse` |
| `updateBriefing` | UUID id, UpdateSafetyBriefingRequest request | `SafetyBriefingResponse` |
| `signBriefing` | UUID id, UUID employeeId | `SafetyBriefingResponse` |
| `completeBriefing` | UUID id | `SafetyBriefingResponse` |
| `deleteBriefing` | UUID id | `void` |

---

### SafetyCertificateService (`modules/safety/service/SafetyCertificateService.java`)

**Dependencies:**
- Repositories: SafetyCertificateRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<SafetyCertificateResponse>` |
| `getWorkerCerts` | UUID employeeId | `List<SafetyCertificateResponse>` |
| `getExpiringCerts` | int daysAhead | `List<SafetyCertificateResponse>` |
| `createCertificate` | CreateSafetyCertificateRequest request | `SafetyCertificateResponse` |
| `updateCertificate` | UUID id, CreateSafetyCertificateRequest request | `SafetyCertificateResponse` |

---

### SafetyComplianceService (`modules/safety/service/SafetyComplianceService.java`)

**Dependencies:**
- Repositories: EmployeeRepository, SafetyAccessBlockRepository, SafetyBriefingRuleRepository, SafetyCertificateRepository, SafetyTrainingRepository, SafetyViolationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `autoScheduleBriefings` |  | `AutoScheduleResponse` |
| `checkCertificateCompliance` | UUID employeeId | `CertificateComplianceResponse` |
| `checkAccessCompliance` | UUID employeeId | `AccessComplianceResponse` |
| `getComplianceDashboard` |  | `ComplianceDashboardResponse` |
| `getPrescriptionTracker` |  | `PrescriptionTrackerResponse` |
| `getActiveAccessBlocks` | Pageable pageable | `Page<AccessBlockResponse>` |
| `resolveAccessBlock` | UUID employeeId | `AccessBlockResponse` |

---

### SafetyIncidentService (`modules/safety/service/SafetyIncidentService.java`)

**Dependencies:**
- Repositories: ProjectRepository, SafetyIncidentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listIncidents` | UUID projectId, Pageable pageable | `Page<IncidentResponse>` |
| `getIncident` | UUID id | `IncidentResponse` |
| `createIncident` | CreateIncidentRequest request | `IncidentResponse` |
| `updateIncident` | UUID id, UpdateIncidentRequest request | `IncidentResponse` |
| `investigate` | UUID id, UUID investigatorId, String investigatorName | `IncidentResponse` |
| `addCorrectiveAction` | UUID id, String rootCause, String correctiveAction | `IncidentResponse` |
| `resolveIncident` | UUID id | `IncidentResponse` |
| `closeIncident` | UUID id | `IncidentResponse` |
| `deleteIncident` | UUID id | `void` |
| `getProjectIncidents` | UUID projectId, Pageable pageable | `Page<IncidentResponse>` |
| `getDashboard` | UUID projectId | `IncidentDashboardResponse` |

---

### SafetyInspectionService (`modules/safety/service/SafetyInspectionService.java`)

**Dependencies:**
- Repositories: ProjectRepository, SafetyIncidentRepository, SafetyInspectionRepository, SafetyViolationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listInspections` | UUID projectId, Pageable pageable | `Page<InspectionResponse>` |
| `getInspection` | UUID id | `InspectionResponse` |
| `createInspection` | CreateInspectionRequest request | `InspectionResponse` |
| `updateInspection` | UUID id, UpdateInspectionRequest request | `InspectionResponse` |
| `startInspection` | UUID id | `InspectionResponse` |
| `completeInspection` | UUID id | `InspectionResponse` |
| `cancelInspection` | UUID id | `InspectionResponse` |
| `deleteInspection` | UUID id | `void` |
| `getInspectionViolations` | UUID inspectionId | `List<ViolationResponse>` |
| `addViolationToInspection` | UUID inspectionId, CreateViolationRequest request | `ViolationResponse` |

---

### SafetyMetricsService (`modules/safety/service/SafetyMetricsService.java`)

**Dependencies:**
- Repositories: SafetyIncidentRepository, SafetyInspectionRepository, SafetyTrainingRepository, SafetyViolationRepository, TrainingRecordRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getMetrics` | String period | `SafetyMetricsResponse` |

---

### SafetyPpeService (`modules/safety/service/SafetyPpeService.java`)

**Dependencies:**
- Repositories: PpeIssueRepository, PpeItemRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listInventory` | Pageable pageable | `Page<PpeItemResponse>` |
| `listIssues` | UUID employeeId, Pageable pageable | `Page<PpeIssueResponse>` |
| `issuePpe` | CreatePpeIssueRequest request | `PpeIssueResponse` |
| `returnPpe` | UUID issueId, ReturnPpeRequest request | `PpeIssueResponse` |

---

### SafetyRiskScoringService (`modules/safety/service/SafetyRiskScoringService.java`)

**Dependencies:**
- Repositories: ContractRepository, EmployeeRepository, ProjectRepository, SafetyCertificateRepository, SafetyIncidentRepository, SafetyRiskFactorRepository, SafetyRiskReportRepository, SafetyRiskScoreRepository, SafetyViolationRepository
- Services: AuditService, ObjectMapper

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `calculateProjectRiskScore` | UUID projectId | `SafetyRiskScoreResponse` |
| `getProjectRiskScore` | UUID projectId | `SafetyRiskScoreResponse` |
| `getPortfolioRiskMap` |  | `PortfolioRiskMapResponse` |
| `calculateAllProjects` |  | `void` |
| `getProjectFactors` | UUID projectId | `List<SafetyRiskFactorResponse>` |
| `scheduledWeeklyReport` |  | `void` |
| `generateWeeklyReport` |  | `WeeklyRiskReportResponse` |
| `getWeeklyReports` | Pageable pageable | `Page<WeeklyRiskReportResponse>` |

---

### SafetySoutService (`modules/safety/service/SafetySoutService.java`)

**Dependencies:**
- Repositories: SoutCardRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listCards` | UUID projectId, Pageable pageable | `Page<SoutCardResponse>` |
| `getCard` | UUID id | `SoutCardResponse` |

---

### SafetyTrainingRecordService (`modules/safety/service/SafetyTrainingRecordService.java`)

**Dependencies:**
- Repositories: TrainingRecordRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listRecords` | UUID employeeId, Pageable pageable | `Page<TrainingRecordResponse>` |
| `createRecord` | CreateTrainingRecordRequest request | `TrainingRecordResponse` |

---

### SafetyTrainingService (`modules/safety/service/SafetyTrainingService.java`)

**Dependencies:**
- Repositories: SafetyTrainingRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTrainings` | UUID projectId, String trainingType, String status, String search, Pageable p... | `Page<SafetyTrainingResponse>` |
| `getTraining` | UUID id | `SafetyTrainingResponse` |
| `createTraining` | CreateSafetyTrainingRequest request | `SafetyTrainingResponse` |
| `updateTraining` | UUID id, UpdateSafetyTrainingRequest request | `SafetyTrainingResponse` |
| `completeTraining` | UUID id, String signatureData | `SafetyTrainingResponse` |
| `cancelTraining` | UUID id | `SafetyTrainingResponse` |
| `deleteTraining` | UUID id | `void` |
| `autoSchedulePeriodicTrainings` |  | `int` |

---

### SafetyViolationService (`modules/safety/service/SafetyViolationService.java`)

**Dependencies:**
- Repositories: SafetyIncidentRepository, SafetyInspectionRepository, SafetyViolationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<ViolationResponse>` |
| `getViolation` | UUID id | `ViolationResponse` |
| `createViolation` | CreateViolationRequest request | `ViolationResponse` |
| `updateViolation` | UUID id, CreateViolationRequest request | `ViolationResponse` |
| `deleteViolation` | UUID id | `void` |
| `resolveViolation` | UUID id, ResolveViolationRequest request | `ViolationResponse` |
| `getOverdueViolations` |  | `List<ViolationResponse>` |
| `listByStatus` | ViolationStatus status, Pageable pageable | `Page<ViolationResponse>` |
| `getDashboard` |  | `ViolationDashboardResponse` |

---

## Module: scheduler

### SchedulerService (`modules/scheduler/service/SchedulerService.java`)

**Dependencies:**
- Repositories: JobExecutionRepository, ScheduledJobRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `register` | CreateScheduledJobRequest request | `ScheduledJobResponse` |
| `listJobs` | Pageable pageable | `Page<ScheduledJobResponse>` |
| `getJob` | String code | `ScheduledJobResponse` |
| `enable` | String code | `ScheduledJobResponse` |
| `disable` | String code | `ScheduledJobResponse` |
| `triggerManualRun` | String code | `JobExecutionResponse` |
| `getExecutions` | String code, Pageable pageable | `Page<JobExecutionResponse>` |

---

## Module: search

### SearchIndexService (`modules/search/service/SearchIndexService.java`)

**Dependencies:**
- Repositories: SearchIndexRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `indexEntity` | IndexEntityRequest request | `SearchIndexResponse` |
| `removeEntity` | SearchEntityType entityType, UUID entityId | `void` |
| `rebuildIndex` | SearchEntityType entityType | `void` |
| `rebuildAll` |  | `void` |
| `getStatus` |  | `SearchIndexStatusResponse` |

---

### SearchService (`modules/search/service/SearchService.java`)

**Dependencies:**
- Repositories: SearchHistoryRepository, SearchIndexRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `search` | SearchRequest request, UUID userId, Pageable pageable | `Page<SearchIndexResponse>` |
| `getAutocompleteSuggestions` | String prefix, UUID organizationId | `List<String>` |
| `getRecentSearches` | UUID userId | `List<SearchHistoryResponse>` |
| `getPopularSearches` | UUID organizationId | `List<PopularSearchResponse>` |

---

## Module: selfEmployed

### SelfEmployedService (`modules/selfEmployed/service/SelfEmployedService.java`)

**Dependencies:**
- Repositories: SelfEmployedContractorRepository, SelfEmployedPaymentRepository, SelfEmployedRegistryRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listContractors` | String search, ContractorStatus status, Pageable pageable | `Page<ContractorResponse>` |
| `getContractor` | UUID id | `ContractorResponse` |
| `createContractor` | CreateContractorRequest request | `ContractorResponse` |
| `updateContractor` | UUID id, UpdateContractorRequest request | `ContractorResponse` |
| `deleteContractor` | UUID id | `void` |
| `listPayments` | UUID contractorId, UUID projectId, SelfEmployedPaymentStatus status, Pageable... | `Page<SelfEmployedPaymentResponse>` |
| `getPayment` | UUID id | `SelfEmployedPaymentResponse` |
| `createPayment` | CreateSelfEmployedPaymentRequest request | `SelfEmployedPaymentResponse` |
| `updatePayment` | UUID id, UpdateSelfEmployedPaymentRequest request | `SelfEmployedPaymentResponse` |
| `deletePayment` | UUID id | `void` |
| `checkFiscalReceipt` | UUID paymentId | `SelfEmployedPaymentResponse` |
| `listRegistries` | UUID projectId, RegistryStatus status, Pageable pageable | `Page<RegistryResponse>` |
| `getRegistry` | UUID id | `RegistryResponse` |
| `createRegistry` | CreateRegistryRequest request | `RegistryResponse` |
| `deleteRegistry` | UUID id | `void` |
| `generateRegistry` | GenerateRegistryRequest request | `RegistryResponse` |
| `exportRegistry` | UUID registryId | `List<SelfEmployedPaymentResponse>` |

---

## Module: settings

### AuditSettingService (`modules/settings/service/AuditSettingService.java`)

**Dependencies:**
- Repositories: AuditSettingRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` |  | `List<AuditSettingResponse>` |
| `getByModelName` | String modelName | `AuditSettingResponse` |
| `getById` | UUID id | `AuditSettingResponse` |
| `createSetting` | CreateAuditSettingRequest request | `AuditSettingResponse` |
| `updateSetting` | UUID id, UpdateAuditSettingRequest request | `AuditSettingResponse` |
| `deleteSetting` | UUID id | `void` |
| `isTrackingEnabled` | String modelName, String action | `boolean` |

---

### EmailTemplateService (`modules/settings/service/EmailTemplateService.java`)

**Dependencies:**
- Repositories: EmailTemplateRepository
- Services: AuditService
- Other: JavaMailSender

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTemplates` | String search, Pageable pageable | `Page<EmailTemplateResponse>` |
| `getByCode` | String code | `EmailTemplateResponse` |
| `getById` | UUID id | `EmailTemplateResponse` |
| `getByCategory` | EmailTemplateCategory category | `List<EmailTemplateResponse>` |
| `createTemplate` | CreateEmailTemplateRequest request | `EmailTemplateResponse` |
| `updateTemplate` | UUID id, UpdateEmailTemplateRequest request | `EmailTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |
| `renderTemplate` | String code, Map<String, String> variables | `RenderedTemplateResponse` |
| `sendEmail` | String code, String recipientEmail, Map<String, String> variables | `void` |

---

### FeatureFlagService (`modules/settings/service/FeatureFlagService.java`)

**Dependencies:**
- Repositories: FeatureFlagRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `isEnabled` | String key | `boolean` |
| `getAll` |  | `List<FeatureFlagResponse>` |
| `setEnabled` | String key, boolean enabled | `FeatureFlagResponse` |

---

### IntegrationConfigService (`modules/settings/service/IntegrationConfigService.java`)

**Dependencies:**
- Repositories: IntegrationConfigRepository
- Services: AuditService, SettingEncryptionService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` |  | `List<IntegrationConfigResponse>` |
| `getByCode` | String code | `IntegrationConfigResponse` |
| `getById` | UUID id | `IntegrationConfigResponse` |
| `createConfig` | CreateIntegrationConfigRequest request | `IntegrationConfigResponse` |
| `updateConfig` | UUID id, UpdateIntegrationConfigRequest request | `IntegrationConfigResponse` |
| `deleteConfig` | UUID id | `void` |
| `testConnection` | String code | `Map<String, Object>` |
| `startSync` | String code | `IntegrationConfigResponse` |
| `getStatus` | String code | `Map<String, Object>` |

---

### NotificationSettingService (`modules/settings/service/NotificationSettingService.java`)

**Dependencies:**
- Repositories: NotificationSettingRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getUserSettings` | UUID userId | `List<NotificationSettingResponse>` |
| `getUserSettingsByType` | UUID userId, NotificationType type | `List<NotificationSettingResponse>` |
| `updateSetting` | UUID userId, UpdateNotificationSettingRequest request | `NotificationSettingResponse` |
| `bulkUpdate` | UUID userId, BulkNotificationSettingRequest request | `List<NotificationSettingResponse>` |
| `getDefaults` |  | `List<NotificationSettingResponse>` |
| `isNotificationEnabled` | UUID userId, NotificationType notificationType, EventType eventType | `boolean` |

---

### NumberSequenceService (`modules/settings/service/NumberSequenceService.java`)

**Dependencies:**
- Repositories: NumberSequenceRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` |  | `List<NumberSequenceResponse>` |
| `getByCode` | String code | `NumberSequenceResponse` |
| `getById` | UUID id | `NumberSequenceResponse` |
| `getNextNumber` | String code | `String` |
| `updateSequence` | UUID id, UpdateNumberSequenceRequest request | `NumberSequenceResponse` |

---

### SettingEncryptionService (`modules/settings/service/SettingEncryptionService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `encrypt` | String plainText | `String` |
| `decrypt` | String encryptedText | `String` |

---

### SystemSettingService (`modules/settings/service/SystemSettingService.java`)

**Dependencies:**
- Repositories: SystemSettingRepository
- Services: AuditService, SettingEncryptionService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getAll` |  | `List<SystemSettingResponse>` |
| `getByCategory` | SettingCategory category | `List<SystemSettingResponse>` |
| `getByKey` | String key | `SystemSettingResponse` |
| `getValue` | String key | `String` |
| `getValue` | String key, String defaultValue | `String` |
| `updateSetting` | String key, UpdateSystemSettingRequest request | `SystemSettingResponse` |
| `getById` | UUID id | `SystemSettingResponse` |

---

## Module: siteAssessment

### SiteAssessmentService (`modules/siteAssessment/service/SiteAssessmentService.java`)

**Dependencies:**
- Repositories: SiteAssessmentRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | UUID projectId, Pageable pageable | `Page<SiteAssessmentResponse>` |
| `getById` | UUID id | `SiteAssessmentResponse` |
| `create` | CreateSiteAssessmentRequest req | `SiteAssessmentResponse` |
| `complete` | UUID id | `SiteAssessmentResponse` |

---

## Module: specification

### CompetitiveListService (`modules/specification/service/CompetitiveListService.java`)

**Dependencies:**
- Repositories: BudgetItemRepository, BudgetRepository, CommercialProposalItemRepository, CommercialProposalRepository, CompetitiveListEntryRepository, CompetitiveListRepository, SpecItemRepository, SpecificationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `list` | UUID projectId, Pageable pageable | `Page<CompetitiveListResponse>` |
| `getById` | UUID id | `CompetitiveListResponse` |
| `createFromPurchaseRequest` | UUID purchaseRequestId | `CompetitiveListResponse` |
| `create` | CreateCompetitiveListRequest request | `CompetitiveListResponse` |
| `update` | UUID id, String name, String notes | `CompetitiveListResponse` |
| `changeStatus` | UUID id, ChangeCompetitiveListStatusRequest request | `CompetitiveListResponse` |
| `getEntries` | UUID listId | `List<CompetitiveListEntryResponse>` |
| `addEntry` | UUID listId, CreateCompetitiveListEntryRequest request | `CompetitiveListEntryResponse` |
| `updateEntry` | UUID listId, UUID entryId, CreateCompetitiveListEntryRequest request | `CompetitiveListEntryResponse` |
| `deleteEntry` | UUID listId, UUID entryId | `void` |
| `selectWinner` | UUID listId, UUID entryId, String selectionReason | `CompetitiveListEntryResponse` |
| `getSummary` | UUID listId | `Map<UUID, CompetitiveListEntryResponse>` |
| `applyToCp` | UUID listId, UUID cpId | `void` |
| `autoRankEntries` | UUID listId | `List<CompetitiveListEntryResponse>` |
| `autoSelectBestPrices` | UUID listId | `CompetitiveListResponse` |

---

### MaterialAnalogService (`modules/specification/service/MaterialAnalogService.java`)

**Dependencies:**
- Repositories: AnalogRequestRepository, MaterialAnalogRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAnalogs` | UUID originalMaterialId, Pageable pageable | `Page<MaterialAnalogResponse>` |
| `getAnalog` | UUID id | `MaterialAnalogResponse` |
| `getActiveAnalogsForMaterial` | UUID materialId | `List<MaterialAnalogResponse>` |
| `createAnalog` | CreateMaterialAnalogRequest request | `MaterialAnalogResponse` |
| `updateAnalog` | UUID id, UpdateMaterialAnalogRequest request | `MaterialAnalogResponse` |
| `approveAnalog` | UUID id, UUID approvedById | `MaterialAnalogResponse` |
| `deleteAnalog` | UUID id | `void` |
| `listRequests` | UUID projectId, AnalogRequestStatus status, Pageable pageable | `Page<AnalogRequestResponse>` |
| `getRequest` | UUID id | `AnalogRequestResponse` |
| `createRequest` | CreateAnalogRequestRequest request | `AnalogRequestResponse` |
| `reviewRequest` | UUID id, ReviewAnalogRequestRequest request | `AnalogRequestResponse` |
| `getPendingRequests` |  | `List<AnalogRequestResponse>` |

---

### ProcurementScheduleService (`modules/specification/service/ProcurementScheduleService.java`)

**Dependencies:**
- Repositories: ProcurementScheduleRepository, SpecItemRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listByProject` | UUID projectId | `List<ProcurementSchedule>` |
| `generate` | UUID projectId, UUID specificationId, LocalDate projectStartDate | `List<ProcurementSchedule>` |
| `updateStatus` | UUID id, String status | `ProcurementSchedule` |

---

### SpecificationPdfParserService (`modules/specification/service/SpecificationPdfParserService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `parsePdf` | InputStream pdfStream | `List<ParsedSpecItemDto>` |

---

### SpecificationService (`modules/specification/service/SpecificationService.java`)

**Dependencies:**
- Repositories: CompetitiveListRepository, ProjectRepository, SpecItemRepository, SpecificationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSpecifications` | UUID projectId, SpecificationStatus status, Pageable pageable | `Page<SpecificationListResponse>` |
| `getSpecification` | UUID id | `SpecificationResponse` |
| `createSpecification` | CreateSpecificationRequest request | `SpecificationResponse` |
| `updateSpecification` | UUID id, UpdateSpecificationRequest request | `SpecificationResponse` |
| `changeStatus` | UUID id, ChangeSpecStatusRequest request | `SpecificationResponse` |
| `submitForReview` | UUID id | `SpecificationResponse` |
| `approveSpecification` | UUID id | `SpecificationResponse` |
| `activateSpecification` | UUID id | `SpecificationResponse` |
| `createVersion` | UUID id | `SpecificationResponse` |
| `addItem` | UUID specId, CreateSpecItemRequest request | `SpecItemResponse` |
| `updateItem` | UUID itemId, UpdateSpecItemRequest request | `SpecItemResponse` |
| `deleteSpecification` | UUID id | `void` |
| `removeItem` | UUID itemId | `void` |
| `getItems` | UUID specId | `List<SpecItemResponse>` |
| `getItemsSummary` | UUID specId | `SpecificationSummaryResponse` |
| `getSupplySummary` | UUID specId | `SpecificationSummaryResponse` |
| `recalculateSupplyStatus` | UUID specId | `void` |

---

## Module: subscription

### InvoicePdfService (`modules/subscription/service/InvoicePdfService.java`)

**Dependencies:**
- Services: PdfReportService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `generateInvoicePdf` | BillingRecord record, String organizationName | `byte[]` |

---

### QuotaEnforcementService (`modules/subscription/service/QuotaEnforcementService.java`)

**Dependencies:**
- Repositories: ProjectRepository, SubscriptionPlanRepository, TenantSubscriptionRepository, UserRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `checkUserQuota` | UUID organizationId | `void` |
| `checkProjectQuota` | UUID organizationId | `void` |
| `checkStorageQuota` | UUID organizationId, long currentStorageGb | `void` |

---

### SubscriptionService (`modules/subscription/service/SubscriptionService.java`)

**Dependencies:**
- Repositories: BillingRecordRepository, ProjectRepository, SubscriptionPlanRepository, TenantSubscriptionRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getPlans` |  | `List<SubscriptionPlanResponse>` |
| `getCurrentSubscription` | UUID organizationId | `TenantSubscriptionResponse` |
| `changePlan` | UUID organizationId, UUID planId | `TenantSubscriptionResponse` |
| `checkFeatureAccess` | UUID organizationId, String featureKey | `boolean` |
| `checkQuota` | UUID organizationId, String quotaType | `QuotaResponse` |
| `getUsage` | UUID organizationId | `UsageResponse` |
| `getBillingHistory` | UUID organizationId, Pageable pageable | `Page<BillingRecordResponse>` |

---

### YooKassaService (`modules/subscription/service/YooKassaService.java`)

**Dependencies:**
- None

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `isConfigured` |  | `boolean` |
| `createPayment` | BigDecimal amount, String currency, String description, String idempotencyKey... | `PaymentResult` |
| `getPaymentStatus` | String paymentId | `String` |
| `PaymentResult` | String paymentId, String confirmationUrl, String status | `record` |

---

## Module: support

### KnowledgeBaseService (`modules/support/service/KnowledgeBaseService.java`)

**Dependencies:**
- Repositories: FaqRepository, KnowledgeBaseRepository, TicketCategoryRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listActiveCategories` |  | `List<TicketCategoryResponse>` |
| `createCategory` | CreateTicketCategoryRequest request | `TicketCategoryResponse` |
| `updateCategory` | UUID id, CreateTicketCategoryRequest request | `TicketCategoryResponse` |
| `deleteCategory` | UUID id | `void` |
| `listPublishedArticles` | Pageable pageable | `Page<KnowledgeBaseResponse>` |
| `getArticle` | UUID id | `KnowledgeBaseResponse` |
| `createArticle` | CreateKnowledgeBaseRequest request | `KnowledgeBaseResponse` |
| `updateArticle` | UUID id, CreateKnowledgeBaseRequest request | `KnowledgeBaseResponse` |
| `deleteArticle` | UUID id | `void` |
| `publishArticle` | UUID id | `KnowledgeBaseResponse` |
| `listActiveFaqs` |  | `List<FaqResponse>` |
| `listFaqsByCategory` | UUID categoryId | `List<FaqResponse>` |
| `updateFaq` | UUID id, CreateFaqRequest request | `FaqResponse` |
| `deleteFaq` | UUID id | `void` |
| `createFaq` | CreateFaqRequest request | `FaqResponse` |

---

### SupportTicketService (`modules/support/service/SupportTicketService.java`)

**Dependencies:**
- Repositories: SupportTicketRepository, TicketCommentRepository, UserRepository
- Services: AuditService, NotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTickets` | TicketStatus status, Pageable pageable | `Page<SupportTicketResponse>` |
| `getTicket` | UUID id | `SupportTicketResponse` |
| `createTicket` | CreateSupportTicketRequest request | `SupportTicketResponse` |
| `updateTicket` | UUID id, UpdateSupportTicketRequest request | `SupportTicketResponse` |
| `assignTicket` | UUID id, UUID assigneeId | `SupportTicketResponse` |
| `startProgress` | UUID id | `SupportTicketResponse` |
| `resolveTicket` | UUID id | `SupportTicketResponse` |
| `closeTicket` | UUID id | `SupportTicketResponse` |
| `deleteTicket` | UUID id | `void` |
| `getTicketComments` | UUID ticketId | `List<TicketCommentResponse>` |
| `addComment` | UUID ticketId, CreateTicketCommentRequest request | `TicketCommentResponse` |
| `getDashboard` |  | `TicketDashboardResponse` |
| `getMyTickets` | Pageable pageable | `Page<SupportTicketResponse>` |
| `getAssignedTickets` | Pageable pageable | `Page<SupportTicketResponse>` |

---

## Module: task

### MilestoneService (`modules/task/service/MilestoneService.java`)

**Dependencies:**
- Repositories: MilestoneRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<MilestoneResponse>` |
| `getMilestone` | UUID id | `MilestoneResponse` |
| `createMilestone` | CreateMilestoneRequest request | `MilestoneResponse` |
| `updateMilestone` | UUID id, UpdateMilestoneRequest request | `MilestoneResponse` |
| `completeMilestone` | UUID id | `MilestoneResponse` |
| `getProjectMilestones` | UUID projectId | `List<MilestoneResponse>` |

---

### TaskApprovalService (`modules/task/service/TaskApprovalService.java`)

**Dependencies:**
- Repositories: TaskApprovalRepository
- Services: AuditService, NotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getTaskApprovals` | UUID taskId | `List<TaskApprovalResponse>` |
| `getPendingApprovals` | UUID approverId | `List<TaskApprovalResponse>` |
| `requestApproval` | UUID taskId, CreateTaskApprovalRequest request | `TaskApprovalResponse` |
| `processApproval` | UUID approvalId, ProcessApprovalRequest request | `TaskApprovalResponse` |
| `isFullyApproved` | UUID taskId | `boolean` |
| `deleteApproval` | UUID approvalId | `void` |

---

### TaskChecklistService (`modules/task/service/TaskChecklistService.java`)

**Dependencies:**
- Repositories: TaskChecklistRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getChecklistItems` | UUID taskId | `List<TaskChecklistResponse>` |
| `addChecklistItem` | UUID taskId, CreateChecklistItemRequest request | `TaskChecklistResponse` |
| `toggleChecklistItem` | UUID itemId, UUID completedById | `TaskChecklistResponse` |
| `deleteChecklistItem` | UUID itemId | `void` |
| `getCompletedCount` | UUID taskId | `long` |
| `getTotalCount` | UUID taskId | `long` |

---

### TaskDependencyService (`modules/task/service/TaskDependencyService.java`)

**Dependencies:**
- Repositories: ProjectTaskRepository, TaskDependencyRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createDependency` | UUID organizationId, CreateTaskDependencyRequest request | `TaskDependencyResponse` |
| `deleteDependency` | UUID organizationId, UUID dependencyId | `void` |
| `getDependencies` | UUID organizationId, UUID taskId | `List<TaskDependencyResponse>` |
| `getProjectDependencies` | UUID organizationId, UUID projectId | `List<TaskDependencyResponse>` |
| `getCriticalPath` | UUID organizationId, UUID projectId | `List<CriticalPathEntry>` |
| `CriticalPathEntry` | UUID taskId, String taskCode, String taskTitle, LocalDate plannedStart, Local... | `record` |

---

### TaskLabelService (`modules/task/service/TaskLabelService.java`)

**Dependencies:**
- Repositories: TaskLabelAssignmentRepository, TaskLabelRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `createLabel` | String name, String color, String icon, UUID organizationId | `TaskLabelResponse` |
| `updateLabel` | UUID id, String name, String color, String icon | `TaskLabelResponse` |
| `deleteLabel` | UUID id | `void` |
| `getLabels` | UUID organizationId | `List<TaskLabelResponse>` |
| `assignLabel` | UUID taskId, UUID labelId | `void` |
| `removeLabel` | UUID taskId, UUID labelId | `void` |
| `getTaskLabels` | UUID taskId | `List<TaskLabelResponse>` |

---

### TaskParticipantService (`modules/task/service/TaskParticipantService.java`)

**Dependencies:**
- Repositories: ProjectTaskRepository, TaskParticipantRepository
- Services: NotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getParticipants` | UUID taskId | `List<TaskParticipantResponse>` |
| `addParticipant` | UUID taskId, AddParticipantRequest request, UUID addedById, String addedByName | `TaskParticipantResponse` |
| `removeParticipant` | UUID taskId, UUID userId, ParticipantRole role | `void` |
| `delegateTask` | UUID taskId, UUID fromUserId, UUID toUserId, String toUserName, String comment | `void` |
| `hasAccess` | UUID taskId, UUID userId, ProjectTask task | `boolean` |
| `getAccessibleTaskIds` | UUID userId | `Set<UUID>` |
| `initializeParticipants` | ProjectTask task, UUID creatorId, String creatorName | `void` |

---

### TaskService (`modules/task/service/TaskService.java`)

**Dependencies:**
- Repositories: ProjectRepository, ProjectTaskRepository, TaskCommentRepository, TaskDependencyRepository, TaskParticipantRepository
- Services: AuditService, NotificationService, TaskParticipantService, WebSocketNotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listTasks` | UUID projectId, TaskStatus status, TaskPriority priority, UUID assigneeId, UU... | `Page<TaskResponse>` |
| `getTask` | UUID id | `TaskResponse` |
| `createTask` | CreateTaskRequest request | `TaskResponse` |
| `updateTask` | UUID id, UpdateTaskRequest request | `TaskResponse` |
| `changeStatus` | UUID id, ChangeTaskStatusRequest request | `TaskResponse` |
| `assignTask` | UUID id, AssignTaskRequest request | `TaskResponse` |
| `updateProgress` | UUID id, Integer progress | `TaskResponse` |
| `addComment` | UUID taskId, AddCommentRequest request | `TaskCommentResponse` |
| `getSubtasks` | UUID parentTaskId | `List<TaskResponse>` |
| `getProjectWBS` | UUID projectId | `List<TaskResponse>` |
| `addDependency` | UUID taskId, UUID dependsOnTaskId, DependencyType type | `TaskDependencyResponse` |
| `removeDependency` | UUID taskId, UUID dependsOnTaskId | `void` |
| `getGanttData` | UUID projectId | `List<GanttTaskResponse>` |
| `getProjectTaskSummary` | UUID projectId | `TaskSummaryResponse` |
| `getMyTasks` | UUID userId | `MyTasksResponse` |
| `getOverdueTasks` | UUID projectId | `List<TaskResponse>` |

---

### TaskStageService (`modules/task/service/TaskStageService.java`)

**Dependencies:**
- Repositories: TaskStageRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getStages` | UUID projectId | `List<TaskStageResponse>` |
| `createStage` | UUID projectId, String name, String color, String icon, String description, b... | `TaskStageResponse` |
| `updateStage` | UUID id, String name, String color, String icon, String description, Boolean ... | `TaskStageResponse` |
| `deleteStage` | UUID id | `void` |
| `reorderStages` | UUID projectId, List<UUID> stageIds | `void` |

---

### TaskTemplateService (`modules/task/service/TaskTemplateService.java`)

**Dependencies:**
- Repositories: TaskTemplateRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `getTemplate` | UUID id | `TaskTemplateResponse` |
| `listTemplates` | boolean activeOnly, Pageable pageable | `Page<TaskTemplateResponse>` |
| `listTemplatesByCategory` | String category | `List<TaskTemplateResponse>` |
| `createTemplate` | CreateTaskTemplateRequest request | `TaskTemplateResponse` |
| `updateTemplate` | UUID id, UpdateTaskTemplateRequest request | `TaskTemplateResponse` |
| `deleteTemplate` | UUID id | `void` |

---

### TaskTimeTrackingService (`modules/task/service/TaskTimeTrackingService.java`)

**Dependencies:**
- Repositories: TaskTimeEntryRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `startTimer` | UUID taskId, UUID userId, String userName | `TaskTimeEntryResponse` |
| `stopTimer` | UUID taskId, UUID userId | `TaskTimeEntryResponse` |
| `addManualEntry` | UUID taskId, UUID userId, String userName, Instant startedAt, Instant stopped... | `TaskTimeEntryResponse` |
| `getTaskTimeEntries` | UUID taskId | `List<TaskTimeEntryResponse>` |
| `getUserTimeEntries` | UUID userId | `List<TaskTimeEntryResponse>` |
| `getTotalDuration` | UUID taskId | `long` |
| `deleteEntry` | UUID entryId | `void` |

---

## Module: taxRisk

### TaxRiskService (`modules/taxRisk/service/TaxRiskService.java`)

**Dependencies:**
- Repositories: TaxRiskAssessmentRepository, TaxRiskFactorRepository, TaxRiskMitigationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAssessments` | AssessmentStatus status, RiskLevel riskLevel, Pageable pageable | `Page<TaxRiskAssessmentResponse>` |
| `getAssessment` | UUID id | `TaxRiskAssessmentResponse` |
| `createAssessment` | CreateTaxRiskAssessmentRequest request | `TaxRiskAssessmentResponse` |
| `updateAssessment` | UUID id, UpdateTaxRiskAssessmentRequest request | `TaxRiskAssessmentResponse` |
| `deleteAssessment` | UUID id | `void` |
| `getByProject` | UUID projectId | `List<TaxRiskAssessmentResponse>` |
| `getByOrganization` | UUID organizationId | `List<TaxRiskAssessmentResponse>` |
| `listFactors` | UUID assessmentId | `List<TaxRiskFactorResponse>` |
| `addFactor` | UUID assessmentId, CreateTaxRiskFactorRequest request | `TaxRiskFactorResponse` |
| `updateFactor` | UUID assessmentId, UUID factorId, UpdateTaxRiskFactorRequest request | `TaxRiskFactorResponse` |
| `deleteFactor` | UUID assessmentId, UUID factorId | `void` |
| `listMitigations` | UUID assessmentId | `List<TaxRiskMitigationResponse>` |
| `addMitigation` | UUID assessmentId, CreateTaxRiskMitigationRequest request | `TaxRiskMitigationResponse` |
| `updateMitigation` | UUID assessmentId, UUID mitigationId, UpdateTaxRiskMitigationRequest request | `TaxRiskMitigationResponse` |
| `deleteMitigation` | UUID assessmentId, UUID mitigationId | `void` |
| `calculateOverallScore` | UUID assessmentId | `TaxRiskAssessmentResponse` |

---

## Module: warehouse

### InventoryCheckService (`modules/warehouse/service/InventoryCheckService.java`)

**Dependencies:**
- Repositories: InventoryCheckLineRepository, InventoryCheckRepository, ProjectRepository, StockEntryRepository, StockMovementLineRepository, StockMovementRepository, UserRepository, WarehouseLocationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listChecks` | InventoryCheckStatus status, UUID locationId, Pageable pageable | `Page<InventoryCheckResponse>` |
| `getCheck` | UUID id | `InventoryCheckResponse` |
| `getCheckLines` | UUID checkId | `List<InventoryCheckLineResponse>` |
| `createCheck` | CreateInventoryCheckRequest request | `InventoryCheckResponse` |
| `startCheck` | UUID id | `InventoryCheckResponse` |
| `updateCheckLine` | UUID checkId, UpdateInventoryCheckLineRequest request | `InventoryCheckLineResponse` |
| `completeCheck` | UUID id | `InventoryCheckResponse` |
| `cancelCheck` | UUID id | `InventoryCheckResponse` |

---

### LimitFenceSheetService (`modules/warehouse/service/LimitFenceSheetService.java`)

**Dependencies:**
- Repositories: LimitFenceSheetRepository, ProjectRepository, UserRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listSheets` | LimitFenceSheetStatus status, UUID projectId, UUID materialId, Pageable pageable | `Page<LimitFenceSheet>` |
| `getSheet` | UUID id | `LimitFenceSheet` |
| `getRemainingLimit` | UUID projectId, UUID materialId | `BigDecimal` |
| `createSheet` | LimitFenceSheet sheet | `LimitFenceSheet` |
| `updateSheet` | UUID id, LimitFenceSheet updates | `LimitFenceSheet` |
| `issueBySheet` | UUID id, BigDecimal quantity | `LimitFenceSheet` |
| `returnBySheet` | UUID id, BigDecimal quantity | `LimitFenceSheet` |
| `closeSheet` | UUID id | `LimitFenceSheet` |
| `deleteSheet` | UUID id | `void` |
| `findExpiredSheets` |  | `List<LimitFenceSheet>` |

---

### MaterialService (`modules/warehouse/service/MaterialService.java`)

**Dependencies:**
- Repositories: MaterialRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listMaterials` | String search, MaterialCategory category, Pageable pageable | `Page<MaterialResponse>` |
| `getMaterial` | UUID id | `MaterialResponse` |
| `createMaterial` | CreateMaterialRequest request | `MaterialResponse` |
| `updateMaterial` | UUID id, UpdateMaterialRequest request | `MaterialResponse` |
| `deleteMaterial` | UUID id | `void` |

---

### StockLimitService (`modules/warehouse/service/StockLimitService.java`)

**Dependencies:**
- Repositories: MaterialRepository, StockEntryRepository, StockLimitAlertRepository, StockLimitRepository, WarehouseLocationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listLimits` | UUID materialId, UUID warehouseLocationId, Pageable pageable | `Page<StockLimitResponse>` |
| `getLimit` | UUID id | `StockLimitResponse` |
| `createLimit` | CreateStockLimitRequest request | `StockLimitResponse` |
| `updateLimit` | UUID id, UpdateStockLimitRequest request | `StockLimitResponse` |
| `deleteLimit` | UUID id | `void` |
| `checkLimits` |  | `List<StockLimitAlertResponse>` |
| `getActiveAlerts` | Pageable pageable | `Page<StockLimitAlertResponse>` |
| `listAlerts` | StockAlertSeverity severity, Boolean resolved, Pageable pageable | `Page<StockLimitAlertResponse>` |
| `acknowledgeAlert` | UUID alertId | `StockLimitAlertResponse` |
| `resolveAlert` | UUID alertId | `StockLimitAlertResponse` |
| `acknowledgeAlert` | UUID alertId, UUID acknowledgedById | `StockLimitAlertResponse` |

---

### StockMovementService (`modules/warehouse/service/StockMovementService.java`)

**Dependencies:**
- Repositories: MaterialRepository, ProjectRepository, PurchaseRequestRepository, StockEntryRepository, StockMovementLineRepository, StockMovementRepository, UserRepository, WarehouseLocationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listMovements` | StockMovementStatus status, StockMovementType movementType, UUID projectId, P... | `Page<StockMovementResponse>` |
| `getMovement` | UUID id | `StockMovementResponse` |
| `getMovementLines` | UUID movementId | `List<StockMovementLineResponse>` |
| `createMovement` | CreateStockMovementRequest request | `StockMovementResponse` |
| `updateMovement` | UUID id, UpdateStockMovementRequest request | `StockMovementResponse` |
| `addLine` | UUID movementId, CreateStockMovementLineRequest request | `StockMovementLineResponse` |
| `confirmMovement` | UUID id | `StockMovementResponse` |
| `executeMovement` | UUID id | `StockMovementResponse` |
| `cancelMovement` | UUID id | `StockMovementResponse` |
| `getMovementHistory` | UUID locationId, LocalDate dateFrom, LocalDate dateTo, Pageable pageable | `Page<StockMovementResponse>` |
| `createReceiptFromPurchase` | UUID purchaseRequestId, UUID destinationLocationId, UUID responsibleId, Strin... | `StockMovementResponse` |
| `deleteMovement` | UUID id | `void` |

---

### StockService (`modules/warehouse/service/StockService.java`)

**Dependencies:**
- Repositories: MaterialRepository, ProjectRepository, StockEntryRepository, WarehouseLocationRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listAll` | Pageable pageable | `Page<StockEntryResponse>` |
| `getStockByLocation` | UUID locationId, Pageable pageable | `Page<StockEntryResponse>` |
| `getStockByMaterial` | UUID materialId, Pageable pageable | `Page<StockEntryResponse>` |
| `getMaterialAvailability` | UUID materialId | `MaterialAvailabilityResponse` |
| `getLowStockAlerts` |  | `List<LowStockAlertResponse>` |
| `getProjectStock` | UUID projectId, Pageable pageable | `Page<StockEntryResponse>` |

---

### WarehouseLocationService (`modules/warehouse/service/WarehouseLocationService.java`)

**Dependencies:**
- Repositories: ProjectRepository, UserRepository, WarehouseLocationRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listLocations` | String search, WarehouseLocationType locationType, UUID projectId, Pageable p... | `Page<WarehouseLocationResponse>` |
| `getLocation` | UUID id | `WarehouseLocationResponse` |
| `getChildren` | UUID parentId | `List<WarehouseLocationResponse>` |
| `createLocation` | CreateWarehouseLocationRequest request | `WarehouseLocationResponse` |
| `updateLocation` | UUID id, UpdateWarehouseLocationRequest request | `WarehouseLocationResponse` |
| `deleteLocation` | UUID id | `void` |

---

### WarehouseOrderService (`modules/warehouse/service/WarehouseOrderService.java`)

**Dependencies:**
- Repositories: ContractRepository, PurchaseOrderRepository, UserRepository, WarehouseOrderItemRepository, WarehouseOrderRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `listOrders` | WarehouseOrderStatus status, WarehouseOrderType orderType, UUID warehouseId, ... | `Page<WarehouseOrder>` |
| `getOrder` | UUID id | `WarehouseOrder` |
| `getOrderItems` | UUID orderId | `List<WarehouseOrderItem>` |
| `createOrder` | WarehouseOrder order | `WarehouseOrder` |
| `updateOrder` | UUID id, WarehouseOrder updates | `WarehouseOrder` |
| `addItem` | UUID orderId, WarehouseOrderItem item | `WarehouseOrderItem` |
| `confirmOrder` | UUID id | `WarehouseOrder` |
| `cancelOrder` | UUID id | `WarehouseOrder` |
| `deleteOrder` | UUID id | `void` |

---

## Module: workflowEngine

### ApprovalInstanceService (`modules/workflowEngine/service/ApprovalInstanceService.java`)

**Dependencies:**
- Repositories: ApprovalDecisionRepository, ApprovalInstanceRepository, WorkflowDefinitionRepository, WorkflowStepRepository
- Services: AuditService, NotificationService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `ApprovalInstanceResponse` | UUID id, UUID entityId, String entityType, String entityNumber, UUID workflow... | `record` |
| `ApprovalDecisionResponse` | UUID id, UUID approvalInstanceId, UUID workflowStepId, String stepName, int s... | `record` |
| `StartApprovalRequest` | UUID entityId, String entityType, String entityNumber, String notes | `record` |
| `SubmitDecisionRequest` | String decision, String comments | `record` |
| `DelegateRequest` | UUID delegateToId, String comments | `record` |
| `BatchDecisionRequest` | List<UUID> instanceIds, String decision, String comments | `record` |
| `BatchDecisionResult` | UUID instanceId, boolean success, String error | `record` |
| `BatchDecisionResponse` | int total, int succeeded, int failed, List<BatchDecisionResult> results | `record` |
| `startApproval` | StartApprovalRequest request | `ApprovalInstanceResponse` |
| `submitDecision` | UUID instanceId, SubmitDecisionRequest request | `ApprovalInstanceResponse` |
| `delegate` | UUID instanceId, UUID delegateToId, String comments | `ApprovalInstanceResponse` |
| `getHistory` | UUID entityId, String entityType | `List<ApprovalDecisionResponse>` |
| `getPendingForUser` | Pageable pageable | `Page<ApprovalInstanceResponse>` |
| `getInstance` | UUID instanceId | `ApprovalInstanceResponse` |
| `cancel` | UUID instanceId | `ApprovalInstanceResponse` |
| `batchDecision` | BatchDecisionRequest request | `BatchDecisionResponse` |
| `escalateOverdue` |  | `void` |

---

### AutoApprovalRuleService (`modules/workflowEngine/service/AutoApprovalRuleService.java`)

**Dependencies:**
- Repositories: AutoApprovalRuleRepository
- Services: AuditService

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String search, ApprovalEntityType entityType, Boolean isActive, UUID organiza... | `Page<AutoApprovalRuleResponse>` |
| `findById` | UUID id | `AutoApprovalRuleResponse` |
| `create` | CreateAutoApprovalRuleRequest request | `AutoApprovalRuleResponse` |
| `update` | UUID id, UpdateAutoApprovalRuleRequest request | `AutoApprovalRuleResponse` |
| `delete` | UUID id | `void` |
| `toggleActive` | UUID id | `AutoApprovalRuleResponse` |

---

### WorkflowDefinitionService (`modules/workflowEngine/service/WorkflowDefinitionService.java`)

**Dependencies:**
- Repositories: AutomationExecutionRepository, WorkflowDefinitionRepository, WorkflowStepRepository

**Methods:**

| Method | Params | Returns |
|--------|--------|---------|
| `findAll` | String search, String entityType, Boolean isActive, Pageable pageable | `Page<WorkflowDefinitionResponse>` |
| `findById` | UUID id | `WorkflowDefinitionResponse` |
| `create` | CreateWorkflowDefinitionRequest request | `WorkflowDefinitionResponse` |
| `update` | UUID id, UpdateWorkflowDefinitionRequest request | `WorkflowDefinitionResponse` |
| `delete` | UUID id | `void` |
| `toggleActive` | UUID id | `WorkflowDefinitionResponse` |
| `getSteps` | UUID workflowDefinitionId | `List<WorkflowStepResponse>` |
| `replaceSteps` | UUID workflowDefinitionId, List<CreateWorkflowStepRequest> requests | `List<WorkflowStepResponse>` |
| `getExecutions` | UUID ruleId, Pageable pageable | `Page<AutomationExecutionResponse>` |

---

