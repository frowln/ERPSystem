# Backend API Routes

> Auto-generated map of all REST API endpoints in the PRIVOD Platform backend.
>
> - **Total modules:** 91
> - **Total controllers:** 308
> - **Total endpoints:** 2493
> - **Generated:** 2026-03-12

---

## Table of Contents

- [accounting](#accounting) (5 controllers, 45 endpoints)
- [admin](#admin) (7 controllers, 25 endpoints)
- [ai](#ai) (2 controllers, 30 endpoints)
- [analytics](#analytics) (7 controllers, 85 endpoints)
- [apiManagement](#apimanagement) (4 controllers, 19 endpoints)
- [approval](#approval) (1 controllers, 5 endpoints)
- [auth](#auth) (6 controllers, 38 endpoints)
- [bidManagement](#bidmanagement) (1 controllers, 12 endpoints)
- [bidScoring](#bidscoring) (1 controllers, 20 endpoints)
- [bim](#bim) (11 controllers, 79 endpoints)
- [calendar](#calendar) (4 controllers, 43 endpoints)
- [cde](#cde) (4 controllers, 29 endpoints)
- [changeManagement](#changemanagement) (4 controllers, 28 endpoints)
- [chatter](#chatter) (4 controllers, 20 endpoints)
- [closeout](#closeout) (7 controllers, 57 endpoints)
- [closing](#closing) (5 controllers, 28 endpoints)
- [commercialProposal](#commercialproposal) (1 controllers, 21 endpoints)
- [common](#common) (1 controllers, 5 endpoints)
- [compliance](#compliance) (1 controllers, 15 endpoints)
- [constructability](#constructability) (1 controllers, 9 endpoints)
- [contract](#contract) (3 controllers, 24 endpoints)
- [contractExt](#contractext) (6 controllers, 34 endpoints)
- [costManagement](#costmanagement) (7 controllers, 58 endpoints)
- [crm](#crm) (1 controllers, 18 endpoints)
- [dailylog](#dailylog) (1 controllers, 18 endpoints)
- [design](#design) (1 controllers, 22 endpoints)
- [document](#document) (3 controllers, 20 endpoints)
- [email](#email) (1 controllers, 17 endpoints)
- [esg](#esg) (1 controllers, 13 endpoints)
- [estimate](#estimate) (5 controllers, 40 endpoints)
- [feedback](#feedback) (1 controllers, 4 endpoints)
- [finance](#finance) (14 controllers, 94 endpoints)
- [fleet](#fleet) (7 controllers, 61 endpoints)
- [gpsTimesheet](#gpstimesheet) (1 controllers, 14 endpoints)
- [hr](#hr) (6 controllers, 39 endpoints)
- [hrRussian](#hrrussian) (7 controllers, 38 endpoints)
- [immutableAudit](#immutableaudit) (1 controllers, 6 endpoints)
- [infrastructure/health](#infrastructurehealth) (1 controllers, 2 endpoints)
- [infrastructure/report](#infrastructurereport) (1 controllers, 5 endpoints)
- [infrastructure/web](#infrastructureweb) (1 controllers, 4 endpoints)
- [insurance](#insurance) (1 controllers, 6 endpoints)
- [integration](#integration) (9 controllers, 81 endpoints)
- [iot](#iot) (2 controllers, 26 endpoints)
- [isup](#isup) (1 controllers, 22 endpoints)
- [journal](#journal) (1 controllers, 9 endpoints)
- [kep](#kep) (2 controllers, 21 endpoints)
- [leave](#leave) (1 controllers, 18 endpoints)
- [legal](#legal) (1 controllers, 19 endpoints)
- [m29](#m29) (1 controllers, 11 endpoints)
- [maintenance](#maintenance) (1 controllers, 25 endpoints)
- [messaging](#messaging) (2 controllers, 32 endpoints)
- [mobile](#mobile) (2 controllers, 21 endpoints)
- [monitoring](#monitoring) (4 controllers, 14 endpoints)
- [monteCarlo](#montecarlo) (1 controllers, 11 endpoints)
- [monthlySchedule](#monthlyschedule) (1 controllers, 9 endpoints)
- [notification](#notification) (4 controllers, 20 endpoints)
- [ops](#ops) (3 controllers, 40 endpoints)
- [organization](#organization) (1 controllers, 5 endpoints)
- [payroll](#payroll) (1 controllers, 11 endpoints)
- [permission](#permission) (5 controllers, 39 endpoints)
- [planfact](#planfact) (1 controllers, 4 endpoints)
- [planning](#planning) (10 controllers, 64 endpoints)
- [pmWorkflow](#pmworkflow) (3 controllers, 31 endpoints)
- [portal](#portal) (10 controllers, 78 endpoints)
- [portfolio](#portfolio) (1 controllers, 25 endpoints)
- [prequalification](#prequalification) (2 controllers, 8 endpoints)
- [priceCoefficient](#pricecoefficient) (1 controllers, 10 endpoints)
- [procurement](#procurement) (3 controllers, 29 endpoints)
- [procurementExt](#procurementext) (3 controllers, 40 endpoints)
- [project](#project) (2 controllers, 15 endpoints)
- [pto](#pto) (7 controllers, 51 endpoints)
- [punchlist](#punchlist) (1 controllers, 14 endpoints)
- [quality](#quality) (9 controllers, 47 endpoints)
- [recruitment](#recruitment) (1 controllers, 18 endpoints)
- [regulatory](#regulatory) (4 controllers, 32 endpoints)
- [report](#report) (2 controllers, 11 endpoints)
- [revenueRecognition](#revenuerecognition) (4 controllers, 21 endpoints)
- [russianDoc](#russiandoc) (3 controllers, 22 endpoints)
- [safety](#safety) (12 controllers, 76 endpoints)
- [scheduler](#scheduler) (1 controllers, 7 endpoints)
- [search](#search) (2 controllers, 8 endpoints)
- [selfEmployed](#selfemployed) (1 controllers, 17 endpoints)
- [settings](#settings) (7 controllers, 41 endpoints)
- [siteAssessment](#siteassessment) (1 controllers, 4 endpoints)
- [specification](#specification) (4 controllers, 44 endpoints)
- [subscription](#subscription) (2 controllers, 9 endpoints)
- [support](#support) (2 controllers, 28 endpoints)
- [task](#task) (7 controllers, 53 endpoints)
- [taxRisk](#taxrisk) (1 controllers, 16 endpoints)
- [warehouse](#warehouse) (8 controllers, 63 endpoints)
- [workflowEngine](#workflowengine) (3 controllers, 23 endpoints)

---

## Module: accounting

### AccountingController (`modules/accounting/web/AccountingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/accounting/accounts` | listAccounts |
| GET | `/api/accounting/accounts/{id}` | getAccount |
| GET | `/api/accounting/journals` | listJournals |
| POST | `/api/accounting/journals` | createJournal |
| POST | `/api/accounting/journals/{id}/activate` | activateJournal |
| POST | `/api/accounting/journals/{id}/deactivate` | deactivateJournal |
| GET | `/api/accounting/periods` | listPeriods |
| POST | `/api/accounting/periods` | openPeriod |
| POST | `/api/accounting/periods/{id}/close` | closePeriod |
| GET | `/api/accounting/entries` | listEntries |
| GET | `/api/accounting/entries/{id}` | getEntry |
| POST | `/api/accounting/entries` | createEntry |
| PUT | `/api/accounting/entries/{id}` | updateEntry |
| DELETE | `/api/accounting/entries/{id}` | deleteEntry |
| POST | `/api/accounting/entries/bulk-delete` | bulkDeleteEntries |

### CounterpartyController (`modules/accounting/web/CounterpartyController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/counterparties` | list |
| GET | `/api/counterparties/{id}` | getById |
| POST | `/api/counterparties` | create |
| PUT | `/api/counterparties/{id}` | update |
| DELETE | `/api/counterparties/{id}` | deactivate |

### EnsController (`modules/accounting/web/EnsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ens/accounts` | listAccounts |
| GET | `/api/ens/accounts/{id}` | getAccount |
| POST | `/api/ens/accounts` | createAccount |
| PUT | `/api/ens/accounts/{id}` | updateAccount |
| DELETE | `/api/ens/accounts/{id}` | deleteAccount |
| POST | `/api/ens/accounts/{id}/sync` | syncBalance |
| GET | `/api/ens/payments` | listPayments |
| POST | `/api/ens/payments` | createPayment |
| PUT | `/api/ens/payments/{id}` | updatePayment |
| DELETE | `/api/ens/payments/{id}` | deletePayment |
| POST | `/api/ens/payments/{id}/confirm` | confirmPayment |

### FixedAssetController (`modules/accounting/web/FixedAssetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fixed-assets` | list |
| GET | `/api/fixed-assets/{id}` | getById |
| POST | `/api/fixed-assets` | create |
| POST | `/api/fixed-assets/{id}/activate` | activate |
| POST | `/api/fixed-assets/{id}/dispose` | dispose |
| PUT | `/api/fixed-assets/{id}` | update |
| DELETE | `/api/fixed-assets/{id}` | delete |

### TaxDeclarationController (`modules/accounting/web/TaxDeclarationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/tax-declarations` | list |
| GET | `/api/tax-declarations/{id}` | getById |
| POST | `/api/tax-declarations` | create |
| POST | `/api/tax-declarations/{id}/submit` | submit |
| POST | `/api/tax-declarations/{id}/accept` | accept |
| PUT | `/api/tax-declarations/{id}` | update |
| DELETE | `/api/tax-declarations/{id}` | delete |

---

## Module: admin

### AdminDashboardController (`modules/admin/web/AdminDashboardController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/dashboard/metrics` | getMetrics |

### AuditLogController (`modules/admin/web/AuditLogController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/audit-logs` | getLogs |
| GET | `/api/admin/audit-logs/entity/{entityType}/{entityId}` | getEntityHistory |
| GET | `/api/admin/audit-logs/user/{userId}` | getUserLogs |

### DepartmentController (`modules/admin/web/DepartmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/departments` | list |
| POST | `/api/admin/departments` | create |
| PUT | `/api/admin/departments/{id}` | update |
| DELETE | `/api/admin/departments/{id}` | delete |

### IpWhitelistController (`modules/admin/web/IpWhitelistController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/ip-whitelist` | list |
| POST | `/api/admin/ip-whitelist` | create |
| DELETE | `/api/admin/ip-whitelist/{id}` | delete |

### LoginAuditController (`modules/admin/web/LoginAuditController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/login-audit` | getLoginAudit |
| GET | `/api/admin/login-audit/stats` | getLoginStats |
| GET | `/api/admin/sessions/online` | getOnlineUsers |
| GET | `/api/admin/sessions/user/{userId}` | getUserSessions |
| DELETE | `/api/admin/sessions/user/{userId}` | terminateUserSessions |

### SystemSettingController (`modules/admin/web/SystemSettingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/system-settings` | getAllSettings |
| GET | `/api/admin/system-settings/grouped` | getGrouped |
| GET | `/api/admin/system-settings/category/{category}` | getByCategory |
| PUT | `/api/admin/system-settings/{key}` | updateSetting |
| POST | `/api/admin/system-settings` | createSetting |

### TenantManagementController (`modules/admin/web/TenantManagementController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/tenants` | listTenants |
| GET | `/api/admin/tenants/{id}` | getTenantDetail |
| PUT | `/api/admin/tenants/{id}/status` | updateStatus |
| PUT | `/api/admin/tenants/{id}/plan` | updatePlan |

---

## Module: ai

### AiAssistantEnhancedController (`modules/ai/web/AiAssistantEnhancedController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/ai/assistant/chat` | chat |
| POST | `/api/ai/assistant/conversations/{id}/context` | addContext |
| GET | `/api/ai/assistant/conversations/{id}` | getConversation |
| GET | `/api/ai/assistant/conversations/{id}/contexts` | getContexts |
| POST | `/api/ai/assistant/model-configs` | createModelConfig |
| GET | `/api/ai/assistant/model-configs` | listModelConfigs |
| GET | `/api/ai/assistant/model-configs/{id}` | getModelConfig |
| GET | `/api/ai/assistant/model-configs/default` | getDefaultModelConfig |
| PUT | `/api/ai/assistant/model-configs/{id}` | updateModelConfig |
| DELETE | `/api/ai/assistant/model-configs/{id}` | deleteModelConfig |
| POST | `/api/ai/assistant/prompt-templates` | createPromptTemplate |
| GET | `/api/ai/assistant/prompt-templates` | listPromptTemplates |
| GET | `/api/ai/assistant/prompt-templates/{id}` | getPromptTemplate |
| PUT | `/api/ai/assistant/prompt-templates/{id}` | updatePromptTemplate |
| DELETE | `/api/ai/assistant/prompt-templates/{id}` | deletePromptTemplate |
| GET | `/api/ai/assistant/usage` | getUsageSummary |
| GET | `/api/ai/assistant/usage/logs` | getUsageLogs |

### AiController (`modules/ai/web/AiController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/ai/chat` | chat |
| POST | `/api/ai/chat/stream` | chatStream |
| GET | `/api/ai/status` | getStatus |
| GET | `/api/ai/conversations` | listConversations |
| GET | `/api/ai/conversations/{id}` | getConversation |
| POST | `/api/ai/conversations` | createConversation |
| POST | `/api/ai/conversations/{id}/messages` | sendMessage |
| GET | `/api/ai/conversations/{id}/messages` | getMessages |
| PATCH | `/api/ai/conversations/{id}/archive` | archiveConversation |
| DELETE | `/api/ai/conversations/{id}` | deleteConversation |
| POST | `/api/ai/document-analyses` | createDocumentAnalysis |
| GET | `/api/ai/document-analyses/{id}` | getDocumentAnalysis |
| GET | `/api/ai/document-analyses` | listDocumentAnalyses |

---

## Module: analytics

### AnalyticsController (`modules/analytics/web/AnalyticsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/analytics/project-status` | getProjectStatusSummary |
| GET | `/api/analytics/financial-summary` | getFinancialSummary |
| GET | `/api/analytics/safety-metrics` | getSafetyMetrics |
| GET | `/api/analytics/task-progress` | getTaskProgress |
| GET | `/api/analytics/procurement-status` | getProcurementStatus |
| GET | `/api/analytics/warehouse-metrics` | getWarehouseMetrics |
| GET | `/api/analytics/hr-metrics` | getHrMetrics |
| GET | `/api/analytics/timeline` | getProjectTimeline |
| GET | `/api/analytics/dashboard` | getOrgDashboard |
| GET | `/api/analytics/dashboard/financial` | getDashboardFinancialSummary |
| GET | `/api/analytics/dashboard/tasks` | getDashboardTaskStats |
| GET | `/api/analytics/dashboard/safety` | getDashboardSafetyMetrics |
| GET | `/api/analytics/financial` | getFinancialBars |
| GET | `/api/analytics/safety` | getSafetyMetricsList |
| GET | `/api/analytics/procurement-spend` | getProcurementSpend |
| GET | `/api/analytics/warehouse-stock` | getWarehouseStock |
| GET | `/api/analytics/kpis` | getKpis |
| GET | `/api/analytics/audit-log` | getAuditLog |
| GET | `/api/analytics/project-budgets` | getProjectBudgets |
| GET | `/api/analytics/progress` | getProgress |
| GET | `/api/analytics/budget-categories` | getBudgetCategories |
| GET | `/api/analytics/export/{reportType}` | exportReport |

### AnalyticsReportController (`modules/analytics/web/AnalyticsReportController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/analytics/reports` | list |
| GET | `/api/analytics/reports/{id}` | getById |
| GET | `/api/analytics/reports/my` | getMyReports |
| GET | `/api/analytics/reports/scheduled` | getScheduledReports |
| POST | `/api/analytics/reports` | create |
| PUT | `/api/analytics/reports/{id}` | update |
| POST | `/api/analytics/reports/{id}/execute` | execute |
| POST | `/api/analytics/reports/{id}/schedule` | schedule |
| GET | `/api/analytics/reports/{id}/executions` | getExecutionHistory |
| DELETE | `/api/analytics/reports/{id}` | delete |

### DashboardController (`modules/analytics/web/DashboardController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/dashboards` | list |
| GET | `/api/dashboards/{id}` | getById |
| GET | `/api/dashboards/my` | getMyDashboards |
| GET | `/api/dashboards/system` | getSystemDashboards |
| POST | `/api/dashboards` | create |
| PUT | `/api/dashboards/{id}` | update |
| PUT | `/api/dashboards/{id}/layout` | updateLayout |
| POST | `/api/dashboards/{id}/clone` | clone |
| DELETE | `/api/dashboards/{id}` | delete |
| GET | `/api/dashboards/{id}/widgets` | getWidgets |
| POST | `/api/dashboards/{id}/widgets` | addWidget |
| DELETE | `/api/dashboards/{id}/widgets/{widgetId}` | removeWidget |

### ExecutiveKpiController (`modules/analytics/web/ExecutiveKpiController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/analytics/executive/dashboard` | getDashboard |
| GET | `/api/analytics/executive/portfolio-summary` | getPortfolioSummary |
| GET | `/api/analytics/executive/project-health` | getProjectHealth |
| GET | `/api/analytics/executive/cash-position` | getCashPosition |
| GET | `/api/analytics/executive/safety-metrics` | getSafetyMetrics |
| GET | `/api/analytics/executive/resource-utilization` | getResourceUtilization |
| GET | `/api/analytics/executive/project/{projectId}/drilldown` | getProjectDrillDown |

### KpiController (`modules/analytics/web/KpiController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/kpis` | list |
| GET | `/api/kpis/{id}` | getById |
| GET | `/api/kpis/active` | getActiveKpis |
| POST | `/api/kpis` | create |
| PUT | `/api/kpis/{id}` | update |
| DELETE | `/api/kpis/{id}` | delete |
| POST | `/api/kpis/{id}/snapshots` | takeSnapshot |
| GET | `/api/kpis/{id}/snapshots` | getKpiHistory |
| GET | `/api/kpis/{id}/snapshots/range` | getKpiHistoryByDateRange |
| GET | `/api/kpis/{id}/calculate` | calculateKpi |
| GET | `/api/kpis/dashboard` | getKpiDashboard |

### PredictiveAnalyticsController (`modules/analytics/web/PredictiveAnalyticsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/analytics/predictions/dashboard` | getRiskDashboard |
| GET | `/api/analytics/predictions` | getPredictions |
| GET | `/api/analytics/predictions/alerts` | getActiveAlerts |
| POST | `/api/analytics/predictions/delay/{projectId}` | calculateDelayProbability |
| POST | `/api/analytics/predictions/cost-overrun/{projectId}` | calculateCostOverrunProbability |
| GET | `/api/analytics/predictions/models` | getModels |
| GET | `/api/analytics/predictions/models/{id}` | getModelById |
| POST | `/api/analytics/predictions/models` | createModel |
| DELETE | `/api/analytics/predictions/models/{id}` | deleteModel |
| GET | `/api/analytics/predictions/weights` | getWeights |
| POST | `/api/analytics/predictions/weights` | createWeight |
| PUT | `/api/analytics/predictions/weights/{id}` | updateWeight |
| DELETE | `/api/analytics/predictions/weights/{id}` | deleteWeight |

### ReportBuilderController (`modules/analytics/web/ReportBuilderController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/analytics/report-builder/templates` | listTemplates |
| GET | `/api/analytics/report-builder/templates/{id}` | getTemplate |
| POST | `/api/analytics/report-builder/templates` | createTemplate |
| PUT | `/api/analytics/report-builder/templates/{id}` | updateTemplate |
| DELETE | `/api/analytics/report-builder/templates/{id}` | deleteTemplate |
| POST | `/api/analytics/report-builder/templates/{id}/duplicate` | duplicateTemplate |
| POST | `/api/analytics/report-builder/templates/{id}/execute` | executeReport |
| GET | `/api/analytics/report-builder/templates/{id}/history` | getExecutionHistory |
| GET | `/api/analytics/report-builder/data-sources` | getDataSources |
| GET | `/api/analytics/report-builder/data-sources/{source}/fields` | getFieldsForDataSource |

---

## Module: apiManagement

### ApiKeyController (`modules/apiManagement/web/ApiKeyController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/api-keys` | listActive |
| GET | `/api/api-keys/by-user` | listByUser |
| GET | `/api/api-keys/{id}` | getById |
| POST | `/api/api-keys` | create |
| PATCH | `/api/api-keys/{id}/deactivate` | deactivate |
| DELETE | `/api/api-keys/{id}` | delete |

### ApiRateLimitController (`modules/apiManagement/web/ApiRateLimitController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/api-management/rate-limits/{apiKeyId}` | getRateLimit |
| PUT | `/api/api-management/rate-limits/{apiKeyId}` | setRateLimit |
| GET | `/api/api-management/rate-limits/{apiKeyId}/check` | checkRateLimited |

### IntegrationMarketplaceController (`modules/apiManagement/web/IntegrationMarketplaceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/marketplace/connectors` | listConnectors |
| GET | `/api/marketplace/connectors/{slug}` | getConnector |
| POST | `/api/marketplace/connectors/{connectorId}/install` | installConnector |
| PUT | `/api/marketplace/installations/{id}/configure` | configureConnector |
| DELETE | `/api/marketplace/installations/{id}` | uninstallConnector |
| GET | `/api/marketplace/installations` | getInstalledConnectors |
| GET | `/api/marketplace/installations/{id}` | getConnectorStatus |

### WebhookDeliveryController (`modules/apiManagement/web/WebhookDeliveryController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/api-management/webhook-deliveries/by-webhook/{webhookId}` | getDeliveries |
| GET | `/api/api-management/webhook-deliveries/by-status` | getDeliveriesByStatus |
| POST | `/api/api-management/webhook-deliveries/{deliveryId}/retry` | retryDelivery |

---

## Module: approval

### ApprovalController (`modules/approval/web/ApprovalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/approvals` | getChains |
| GET | `/api/approvals/{id}` | getChainById |
| POST | `/api/approvals` | createChain |
| POST | `/api/approvals/steps/{stepId}/approve` | approveStep |
| POST | `/api/approvals/steps/{stepId}/reject` | rejectStep |

---

## Module: auth

### AuthController (`modules/auth/web/AuthController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/auth/login` | login |
| POST | `/api/auth/login/2fa` | verifyTwoFactor |
| POST | `/api/auth/register` | register |
| POST | `/api/auth/refresh` | refreshToken |
| GET | `/api/auth/me` | getCurrentUser |
| POST | `/api/auth/change-password` | changePassword |
| GET | `/api/auth/me/permissions` | getMyPermissions |

### MfaController (`modules/auth/web/MfaController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/auth/mfa/enable` | enable |
| DELETE | `/api/auth/mfa/disable` | disable |
| POST | `/api/auth/mfa/verify` | verify |
| GET | `/api/auth/mfa/configs` | getConfigs |
| GET | `/api/auth/mfa/status` | status |

### OidcProviderController (`modules/auth/web/OidcProviderController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/auth/oidc/providers` | create |
| GET | `/api/auth/oidc/providers` | listActive |
| GET | `/api/auth/oidc/providers/{code}` | getProvider |
| PATCH | `/api/auth/oidc/providers/{code}/toggle` | toggle |
| DELETE | `/api/auth/oidc/providers/{id}` | delete |

### SecurityPolicyController (`modules/auth/web/SecurityPolicyController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/auth/security/policy` | getActivePolicy |
| GET | `/api/auth/security/sessions` | activeSessions |
| DELETE | `/api/auth/security/sessions/{id}` | terminateSession |
| DELETE | `/api/auth/security/sessions` | terminateAllSessions |
| GET | `/api/auth/security/account-locked` | isAccountLocked |
| DELETE | `/api/auth/security/sessions/expired` | cleanupExpired |

### TwoFactorController (`modules/auth/web/TwoFactorController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/auth/2fa/setup` | setup |
| POST | `/api/auth/2fa/verify-setup` | verifySetup |
| POST | `/api/auth/2fa/disable` | disable |
| POST | `/api/auth/2fa/verify` | verify |

### UserAdminController (`modules/auth/web/UserAdminController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/users` | list |
| GET | `/api/admin/users/roles` | listRoles |
| GET | `/api/admin/users/{id}` | getById |
| POST | `/api/admin/users` | create |
| PUT | `/api/admin/users/{id}` | update |
| POST | `/api/admin/users/{id}/block` | block |
| POST | `/api/admin/users/{id}/unblock` | unblock |
| POST | `/api/admin/users/{id}/reset-password` | resetPassword |
| POST | `/api/admin/users/{id}/force-logout` | forceLogout |
| GET | `/api/admin/users/{id}/sessions` | getSessions |
| GET | `/api/admin/users/{id}/activity` | getActivityLog |

---

## Module: bidManagement

### BidManagementController (`modules/bidManagement/web/BidManagementController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bid-packages` | listPackages |
| GET | `/api/bid-packages/{id}` | getPackage |
| POST | `/api/bid-packages` | createPackage |
| PUT | `/api/bid-packages/{id}` | updatePackage |
| DELETE | `/api/bid-packages/{id}` | deletePackage |
| GET | `/api/bid-packages/{id}/invitations` | listInvitations |
| POST | `/api/bid-packages/{id}/invitations` | createInvitation |
| PUT | `/api/bid-packages/{id}/invitations/{invId}` | updateInvitation |
| DELETE | `/api/bid-packages/{id}/invitations/{invId}` | deleteInvitation |
| GET | `/api/bid-packages/{id}/evaluations` | listEvaluations |
| POST | `/api/bid-packages/{id}/evaluations` | createEvaluation |
| GET | `/api/bid-packages/{id}/leveling-matrix` | getLevelingMatrix |

---

## Module: bidScoring

### BidScoringController (`modules/bidScoring/web/BidScoringController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bid-scoring` | list |
| GET | `/api/bid-scoring/comparisons` | listComparisons |
| GET | `/api/bid-scoring/comparisons/{id}` | getComparison |
| POST | `/api/bid-scoring/comparisons` | createComparison |
| PUT | `/api/bid-scoring/comparisons/{id}` | updateComparison |
| POST | `/api/bid-scoring/comparisons/{id}/start` | startComparison |
| POST | `/api/bid-scoring/comparisons/{id}/complete` | completeComparison |
| POST | `/api/bid-scoring/comparisons/{id}/approve` | approveComparison |
| DELETE | `/api/bid-scoring/comparisons/{id}` | deleteComparison |
| GET | `/api/bid-scoring/comparisons/{comparisonId}/criteria` | listCriteria |
| POST | `/api/bid-scoring/criteria` | createCriteria |
| PUT | `/api/bid-scoring/criteria/{id}` | updateCriteria |
| DELETE | `/api/bid-scoring/criteria/{id}` | deleteCriteria |
| GET | `/api/bid-scoring/comparisons/{comparisonId}/scores` | listScores |
| GET | `/api/bid-scoring/comparisons/{comparisonId}/scores/vendor/{vendorId}` | getVendorScores |
| POST | `/api/bid-scoring/scores` | createScore |
| PUT | `/api/bid-scoring/scores/{id}` | updateScore |
| DELETE | `/api/bid-scoring/scores/{id}` | deleteScore |
| GET | `/api/bid-scoring/comparisons/{comparisonId}/ranking` | getVendorRanking |
| GET | `/api/bid-scoring/comparisons/{comparisonId}/winner` | determineWinner |

---

## Module: bim

### BimClashController (`modules/bim/web/BimClashController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/clashes` | list |
| GET | `/api/bim/clashes/{id}` | getById |
| POST | `/api/bim/clashes` | create |
| PATCH | `/api/bim/clashes/{id}/resolve` | resolve |
| PATCH | `/api/bim/clashes/{id}/approve` | approve |
| DELETE | `/api/bim/clashes/{id}` | delete |

### BimClashDetectionController (`modules/bim/web/BimClashDetectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/bim/clash-detection/tests` | createClashTest |
| GET | `/api/bim/clash-detection/tests` | listClashTests |
| GET | `/api/bim/clash-detection/tests/{id}` | getClashTest |
| POST | `/api/bim/clash-detection/tests/{id}/run` | runClashTest |
| DELETE | `/api/bim/clash-detection/tests/{id}` | deleteClashTest |
| GET | `/api/bim/clash-detection/tests/{testId}/results` | getClashResults |
| PATCH | `/api/bim/clash-detection/results/{id}/resolve` | resolveClash |
| PATCH | `/api/bim/clash-detection/results/{id}/ignore` | ignoreClash |
| PATCH | `/api/bim/clash-detection/results/{id}/assign` | assignClash |
| GET | `/api/bim/clash-detection/summary` | getClashSummary |
| POST | `/api/bim/clash-detection/viewer-sessions` | startViewerSession |
| PATCH | `/api/bim/clash-detection/viewer-sessions/{id}/end` | endViewerSession |
| POST | `/api/bim/clash-detection/models/{modelId}/metadata` | importElementMetadata |
| GET | `/api/bim/clash-detection/models/{modelId}/metadata` | getElementMetadata |

### BimDefectLinkController (`modules/bim/web/BimDefectLinkController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/bim/defect-links` | linkDefect |
| PUT | `/api/bim/defect-links/{linkId}` | updateLink |
| DELETE | `/api/bim/defect-links/{linkId}` | unlinkDefect |
| GET | `/api/bim/defect-links/by-defect/{defectId}` | getLinksForDefect |
| GET | `/api/bim/defect-links/by-model/{modelId}` | getLinksForModel |
| GET | `/api/bim/defect-links/by-project/{projectId}` | getLinksForProject |
| GET | `/api/bim/defect-links/by-floor/{projectId}` | getDefectsByFloor |
| GET | `/api/bim/defect-links/by-system/{projectId}` | getDefectsBySystem |
| GET | `/api/bim/defect-links/heatmap/{projectId}` | getDefectHeatmap |
| POST | `/api/bim/defect-links/views` | createSavedView |
| GET | `/api/bim/defect-links/views/{projectId}` | getSavedViews |
| DELETE | `/api/bim/defect-links/views/{viewId}` | deleteSavedView |

### BimElementController (`modules/bim/web/BimElementController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/elements` | list |
| GET | `/api/bim/elements/{id}` | getById |
| POST | `/api/bim/elements` | create |
| PUT | `/api/bim/elements/{id}` | update |
| DELETE | `/api/bim/elements/{id}` | delete |

### BimModelController (`modules/bim/web/BimModelController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/models` | list |
| GET | `/api/bim/models/{id}` | getById |
| POST | `/api/bim/models` | create |
| PUT | `/api/bim/models/{id}` | update |
| PATCH | `/api/bim/models/{id}/import` | importModel |
| PATCH | `/api/bim/models/{id}/process` | processModel |
| DELETE | `/api/bim/models/{id}` | delete |

### DesignDrawingController (`modules/bim/web/DesignDrawingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/drawings` | list |
| GET | `/api/bim/drawings/{id}` | getById |
| POST | `/api/bim/drawings` | create |
| PUT | `/api/bim/drawings/{id}` | update |
| PATCH | `/api/bim/drawings/{id}/set-current` | setCurrent |
| PATCH | `/api/bim/drawings/{id}/supersede` | supersede |
| DELETE | `/api/bim/drawings/{id}` | delete |

### DesignPackageController (`modules/bim/web/DesignPackageController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/design-packages` | list |
| GET | `/api/bim/design-packages/{id}` | getById |
| POST | `/api/bim/design-packages` | create |
| PUT | `/api/bim/design-packages/{id}` | update |
| PATCH | `/api/bim/design-packages/{id}/submit-review` | submitForReview |
| PATCH | `/api/bim/design-packages/{id}/approve` | approve |
| DELETE | `/api/bim/design-packages/{id}` | delete |

### DrawingAnnotationController (`modules/bim/web/DrawingAnnotationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/annotations` | list |
| GET | `/api/bim/annotations/{id}` | getById |
| POST | `/api/bim/annotations` | create |
| PUT | `/api/bim/annotations/{id}` | update |
| PATCH | `/api/bim/annotations/{id}/resolve` | resolve |
| DELETE | `/api/bim/annotations/{id}` | delete |

### PhotoAlbumController (`modules/bim/web/PhotoAlbumController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/albums` | list |
| GET | `/api/bim/albums/{id}` | getById |
| POST | `/api/bim/albums` | create |
| PUT | `/api/bim/albums/{id}` | update |
| DELETE | `/api/bim/albums/{id}` | delete |

### PhotoComparisonController (`modules/bim/web/PhotoComparisonController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/photo-comparisons` | list |
| GET | `/api/bim/photo-comparisons/{id}` | getById |
| POST | `/api/bim/photo-comparisons` | create |
| PUT | `/api/bim/photo-comparisons/{id}` | update |
| DELETE | `/api/bim/photo-comparisons/{id}` | delete |

### PhotoProgressController (`modules/bim/web/PhotoProgressController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/bim/photos` | list |
| GET | `/api/bim/photos/{id}` | getById |
| POST | `/api/bim/photos` | create |
| PUT | `/api/bim/photos/{id}` | update |
| DELETE | `/api/bim/photos/{id}` | delete |

---

## Module: calendar

### CalendarEventController (`modules/calendar/web/CalendarEventController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/calendar/events` | list |
| GET | `/api/calendar/events/{id}` | getById |
| POST | `/api/calendar/events` | create |
| PUT | `/api/calendar/events/{id}` | update |
| DELETE | `/api/calendar/events/{id}` | delete |
| GET | `/api/calendar/events/date-range` | getByDateRange |
| GET | `/api/calendar/events/project/{projectId}` | getByProject |
| GET | `/api/calendar/events/project/{projectId}/date-range` | getProjectEvents |
| GET | `/api/calendar/events/my-events` | getMyEvents |
| GET | `/api/calendar/events/upcoming` | getUpcoming |
| GET | `/api/calendar/events/{id}/recurrences` | getRecurrences |
| GET | `/api/calendar/events/{eventId}/attendees` | getAttendees |
| POST | `/api/calendar/events/{eventId}/attendees` | addAttendee |
| DELETE | `/api/calendar/events/{eventId}/attendees/{userId}` | removeAttendee |
| PATCH | `/api/calendar/events/{eventId}/attendees/{userId}/response` | updateAttendeeResponse |

### ConstructionScheduleController (`modules/calendar/web/ConstructionScheduleController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/calendar/schedules` | list |
| GET | `/api/calendar/schedules/{id}` | getById |
| POST | `/api/calendar/schedules` | create |
| PUT | `/api/calendar/schedules/{id}` | update |
| DELETE | `/api/calendar/schedules/{id}` | delete |
| PATCH | `/api/calendar/schedules/{id}/approve` | approve |
| PATCH | `/api/calendar/schedules/{id}/activate` | activate |
| GET | `/api/calendar/schedules/project/{projectId}` | getProjectSchedules |
| GET | `/api/calendar/schedules/project/{projectId}/active` | getActiveSchedule |

### ScheduleItemController (`modules/calendar/web/ScheduleItemController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/calendar/schedules/{scheduleId}/items` | list |
| GET | `/api/calendar/schedules/{scheduleId}/items/{itemId}` | getById |
| POST | `/api/calendar/schedules/{scheduleId}/items` | create |
| PUT | `/api/calendar/schedules/{scheduleId}/items/{itemId}` | update |
| DELETE | `/api/calendar/schedules/{scheduleId}/items/{itemId}` | delete |
| PATCH | `/api/calendar/schedules/{scheduleId}/items/{itemId}/progress` | updateProgress |
| PUT | `/api/calendar/schedules/{scheduleId}/items/reorder` | reorder |
| GET | `/api/calendar/schedules/{scheduleId}/items/gantt` | getGantt |
| GET | `/api/calendar/schedules/{scheduleId}/items/critical-path` | getCriticalPath |

### WorkCalendarController (`modules/calendar/web/WorkCalendarController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/calendar/work-calendar` | list |
| GET | `/api/calendar/work-calendar/{id}` | getById |
| POST | `/api/calendar/work-calendar` | create |
| PUT | `/api/calendar/work-calendar/{id}` | update |
| DELETE | `/api/calendar/work-calendar/{id}` | delete |
| POST | `/api/calendar/work-calendar/initialize-year/{year}` | initializeYear |
| POST | `/api/calendar/work-calendar/{calendarId}/exceptions` | addException |
| GET | `/api/calendar/work-calendar/{calendarId}/working-days` | getWorkingDays |
| GET | `/api/calendar/work-calendar/{calendarId}/is-working-day` | isWorkingDay |
| GET | `/api/calendar/work-calendar/{calendarId}/days` | getCalendarDays |

---

## Module: cde

### ArchivePolicyController (`modules/cde/web/ArchivePolicyController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cde/archive-policies` | list |
| GET | `/api/cde/archive-policies/{id}` | getById |
| POST | `/api/cde/archive-policies` | create |
| PUT | `/api/cde/archive-policies/{id}` | update |
| DELETE | `/api/cde/archive-policies/{id}` | delete |
| POST | `/api/cde/archive-policies/run-now` | runNow |

### DocumentContainerController (`modules/cde/web/DocumentContainerController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cde/documents` | list |
| GET | `/api/cde/documents/{id}` | getById |
| POST | `/api/cde/documents` | create |
| PUT | `/api/cde/documents/{id}` | update |
| PATCH | `/api/cde/documents/{id}/state` | changeState |
| POST | `/api/cde/documents/{id}/revisions` | addRevision |
| GET | `/api/cde/documents/{id}/revisions` | getRevisions |
| GET | `/api/cde/documents/{id}/audit` | getAuditTrail |
| DELETE | `/api/cde/documents/{id}` | delete |

### RevisionSetController (`modules/cde/web/RevisionSetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cde/revision-sets` | list |
| GET | `/api/cde/revision-sets/{id}` | getById |
| POST | `/api/cde/revision-sets` | create |
| PUT | `/api/cde/revision-sets/{id}` | update |
| DELETE | `/api/cde/revision-sets/{id}` | delete |

### TransmittalController (`modules/cde/web/TransmittalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cde/transmittals` | list |
| GET | `/api/cde/transmittals/{id}` | getById |
| POST | `/api/cde/transmittals` | create |
| POST | `/api/cde/transmittals/{id}/items` | addItem |
| GET | `/api/cde/transmittals/{id}/items` | getItems |
| PATCH | `/api/cde/transmittals/{id}/issue` | issue |
| PATCH | `/api/cde/transmittals/{id}/acknowledge` | acknowledge |
| PATCH | `/api/cde/transmittals/{id}/close` | close |
| DELETE | `/api/cde/transmittals/{id}` | delete |

---

## Module: changeManagement

### ChangeEventController (`modules/changeManagement/web/ChangeEventController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/change-events` | list |
| GET | `/api/change-events/{id}` | getById |
| POST | `/api/change-events` | create |
| POST | `/api/change-events/from-rfi` | createFromRfi |
| PUT | `/api/change-events/{id}` | update |
| PATCH | `/api/change-events/{id}/status` | changeStatus |
| DELETE | `/api/change-events/{id}` | delete |

### ChangeManagementAnalyticsController (`modules/changeManagement/web/ChangeManagementAnalyticsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/change-management/analytics/schedule-impact` | getScheduleImpact |
| GET | `/api/change-management/analytics/budget-impact` | getBudgetImpact |
| GET | `/api/change-management/analytics/trends` | getTrends |

### ChangeOrderController (`modules/changeManagement/web/ChangeOrderController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/change-orders` | list |
| GET | `/api/change-orders/by-contract/{contractId}` | listByContract |
| GET | `/api/change-orders/{id}` | getById |
| POST | `/api/change-orders` | create |
| PUT | `/api/change-orders/{id}` | update |
| PATCH | `/api/change-orders/{id}/status` | changeStatus |
| DELETE | `/api/change-orders/{id}` | delete |
| GET | `/api/change-orders/{id}/items` | listItems |
| POST | `/api/change-orders/{id}/items` | addItem |
| DELETE | `/api/change-orders/items/{itemId}` | removeItem |
| GET | `/api/change-orders/revised-amount` | getRevisedContractAmount |

### ChangeOrderRequestController (`modules/changeManagement/web/ChangeOrderRequestController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/change-order-requests` | listByProject |
| GET | `/api/change-order-requests/by-event/{changeEventId}` | listByChangeEvent |
| GET | `/api/change-order-requests/{id}` | getById |
| POST | `/api/change-order-requests` | create |
| PUT | `/api/change-order-requests/{id}` | update |
| PATCH | `/api/change-order-requests/{id}/status` | changeStatus |
| DELETE | `/api/change-order-requests/{id}` | delete |

---

## Module: chatter

### ActivityController (`modules/chatter/web/ActivityController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/chatter/activities` | create |
| GET | `/api/chatter/activities` | list |
| GET | `/api/chatter/activities/my` | myActivities |
| PATCH | `/api/chatter/activities/{id}/done` | markDone |
| PATCH | `/api/chatter/activities/{id}/cancel` | cancel |
| GET | `/api/chatter/activities/overdue` | overdue |
| GET | `/api/chatter/activities/pending-count` | pendingCount |
| PUT | `/api/chatter/activities/{id}` | update |
| DELETE | `/api/chatter/activities/{id}` | delete |

### CommentController (`modules/chatter/web/CommentController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/chatter/comments` | create |
| GET | `/api/chatter/comments` | list |
| GET | `/api/chatter/comments/{id}/replies` | listReplies |
| PATCH | `/api/chatter/comments/{id}` | update |
| DELETE | `/api/chatter/comments/{id}` | delete |

### EntityChangeLogController (`modules/chatter/web/EntityChangeLogController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/chatter/changelog` | logChange |
| GET | `/api/chatter/changelog` | list |

### FollowerController (`modules/chatter/web/FollowerController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/chatter/followers` | follow |
| DELETE | `/api/chatter/followers` | unfollow |
| GET | `/api/chatter/followers` | list |
| GET | `/api/chatter/followers/is-following` | isFollowing |

---

## Module: closeout

### AsBuiltTrackerController (`modules/closeout/web/AsBuiltTrackerController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/closeout/as-built/requirements` | getRequirements |
| GET | `/api/closeout/as-built/requirements/defaults` | getOrgDefaults |
| POST | `/api/closeout/as-built/requirements` | createRequirement |
| DELETE | `/api/closeout/as-built/requirements/{id}` | deleteRequirement |
| GET | `/api/closeout/as-built/wbs/{wbsNodeId}/links` | getLinksForWbs |
| POST | `/api/closeout/as-built/wbs/{wbsNodeId}/link` | linkDocument |
| PUT | `/api/closeout/as-built/links/{linkId}/status` | updateLinkStatus |
| DELETE | `/api/closeout/as-built/links/{linkId}` | unlinkDocument |
| GET | `/api/closeout/as-built/progress/{projectId}` | getProjectProgress |
| GET | `/api/closeout/as-built/quality-gate/{wbsNodeId}` | checkQualityGate |

### CommissioningChecklistController (`modules/closeout/web/CommissioningChecklistController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/commissioning-checklists` | list |
| GET | `/api/commissioning-checklists/{id}` | getById |
| POST | `/api/commissioning-checklists` | create |
| PUT | `/api/commissioning-checklists/{id}` | update |
| DELETE | `/api/commissioning-checklists/{id}` | delete |

### CommissioningEnhancedController (`modules/closeout/web/CommissioningEnhancedController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/closeout/commissioning-enhanced/templates` | listTemplates |
| GET | `/api/closeout/commissioning-enhanced/templates/{id}` | getTemplate |
| GET | `/api/closeout/commissioning-enhanced/templates/system/{system}` | getTemplatesBySystem |
| GET | `/api/closeout/commissioning-enhanced/templates/defaults` | getDefaultTemplates |
| POST | `/api/closeout/commissioning-enhanced/templates` | createTemplate |
| PUT | `/api/closeout/commissioning-enhanced/templates/{id}` | updateTemplate |
| DELETE | `/api/closeout/commissioning-enhanced/templates/{id}` | deleteTemplate |
| GET | `/api/closeout/commissioning-enhanced/sign-offs/{checklistId}` | getSignOffs |
| POST | `/api/closeout/commissioning-enhanced/sign-offs` | createSignOff |
| PUT | `/api/closeout/commissioning-enhanced/sign-offs/{id}/decision` | updateSignOff |
| DELETE | `/api/closeout/commissioning-enhanced/sign-offs/{id}` | deleteSignOff |
| GET | `/api/closeout/commissioning-enhanced/zos` | listZos |
| GET | `/api/closeout/commissioning-enhanced/zos/{id}` | getZos |
| GET | `/api/closeout/commissioning-enhanced/zos/project/{projectId}` | getZosByProject |
| POST | `/api/closeout/commissioning-enhanced/zos` | createZos |
| PUT | `/api/closeout/commissioning-enhanced/zos/{id}` | updateZos |
| PUT | `/api/closeout/commissioning-enhanced/zos/{id}/status` | changeZosStatus |
| DELETE | `/api/closeout/commissioning-enhanced/zos/{id}` | deleteZos |

### HandoverPackageController (`modules/closeout/web/HandoverPackageController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/handover-packages` | list |
| GET | `/api/handover-packages/{id}` | getById |
| POST | `/api/handover-packages` | create |
| PUT | `/api/handover-packages/{id}` | update |
| DELETE | `/api/handover-packages/{id}` | delete |

### StroynadzorPackageController (`modules/closeout/web/StroynadzorPackageController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/closeout/stroynadzor-package` | createPackage |
| POST | `/api/closeout/stroynadzor-package/{id}/generate` | generatePackage |
| GET | `/api/closeout/stroynadzor-package/{id}` | getPackageDetail |
| GET | `/api/closeout/stroynadzor-package/{id}/completeness` | getCompletenessReport |
| GET | `/api/closeout/stroynadzor-package` | listPackages |
| PATCH | `/api/closeout/stroynadzor-package/{id}/send` | markAsSent |
| DELETE | `/api/closeout/stroynadzor-package/{id}` | deletePackage |

### WarrantyClaimController (`modules/closeout/web/WarrantyClaimController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warranty-claims` | list |
| GET | `/api/warranty-claims/{id}` | getById |
| POST | `/api/warranty-claims` | create |
| PUT | `/api/warranty-claims/{id}` | update |
| DELETE | `/api/warranty-claims/{id}` | delete |

### WarrantyObligationController (`modules/closeout/web/WarrantyObligationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/closeout/warranty-obligations` | list |
| GET | `/api/closeout/warranty-obligations/{id}` | getById |
| GET | `/api/closeout/warranty-obligations/project/{projectId}` | getByProject |
| POST | `/api/closeout/warranty-obligations` | create |
| PUT | `/api/closeout/warranty-obligations/{id}` | update |
| DELETE | `/api/closeout/warranty-obligations/{id}` | delete |
| GET | `/api/closeout/warranty-obligations/dashboard` | dashboard |

---

## Module: closing

### CorrectionActController (`modules/closing/web/CorrectionActController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/correction-acts` | list |
| POST | `/api/correction-acts` | create |

### Ks2Controller (`modules/closing/web/Ks2Controller.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ks2` | list |
| GET | `/api/ks2/{id}` | getById |
| POST | `/api/ks2` | create |
| PUT | `/api/ks2/{id}` | update |
| GET | `/api/ks2/{id}/lines` | getLines |
| POST | `/api/ks2/{id}/lines` | addLine |
| PUT | `/api/ks2/lines/{lineId}` | updateLine |
| DELETE | `/api/ks2/lines/{lineId}` | removeLine |
| POST | `/api/ks2/{id}/submit` | submit |
| POST | `/api/ks2/{id}/sign` | sign |
| POST | `/api/ks2/{id}/close` | close |

### Ks2PipelineController (`modules/closing/web/Ks2PipelineController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/ks2-pipeline/generate` | generate |
| POST | `/api/ks2-pipeline/batch-generate` | batchGenerate |
| GET | `/api/ks2-pipeline/preview` | preview |
| GET | `/api/ks2-pipeline/volumes` | volumes |

### Ks3Controller (`modules/closing/web/Ks3Controller.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ks3` | list |
| GET | `/api/ks3/{id}` | getById |
| POST | `/api/ks3` | create |
| PUT | `/api/ks3/{id}` | update |
| POST | `/api/ks3/{id}/link-ks2` | linkKs2 |
| DELETE | `/api/ks3/{id}/link-ks2/{ks2Id}` | unlinkKs2 |
| POST | `/api/ks3/{id}/auto-fill` | autoFill |
| POST | `/api/ks3/{id}/submit` | submit |
| POST | `/api/ks3/{id}/sign` | sign |
| POST | `/api/ks3/{id}/close` | close |

### Ks6aController (`modules/closing/web/Ks6aController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ks6a` | getEntries |

---

## Module: commercialProposal

### CommercialProposalController (`modules/commercialProposal/web/CommercialProposalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/commercial-proposals` | list |
| GET | `/api/commercial-proposals/{id}` | getById |
| GET | `/api/commercial-proposals/matching-invoice-lines` | findMatchingInvoiceLines |
| POST | `/api/commercial-proposals` | create |
| DELETE | `/api/commercial-proposals/{id}` | delete |
| POST | `/api/commercial-proposals/{id}/status` | changeStatus |
| GET | `/api/commercial-proposals/{id}/items` | getItems |
| GET | `/api/commercial-proposals/{id}/items/materials` | getMaterials |
| GET | `/api/commercial-proposals/{id}/items/works` | getWorks |
| PUT | `/api/commercial-proposals/{id}/items/{itemId}` | updateItem |
| POST | `/api/commercial-proposals/{id}/items/{itemId}/select-invoice` | selectInvoice |
| POST | `/api/commercial-proposals/{id}/items/{itemId}/link-estimate` | linkEstimate |
| POST | `/api/commercial-proposals/{id}/items/{itemId}/approve` | approveItem |
| POST | `/api/commercial-proposals/{id}/items/{itemId}/reject` | rejectItem |
| POST | `/api/commercial-proposals/{id}/confirm-all` | confirmAll |
| POST | `/api/commercial-proposals/{id}/items/{itemId}/select-cl-entry` | selectClEntry |
| POST | `/api/commercial-proposals/{id}/push-to-fm` | pushToFm |
| POST | `/api/commercial-proposals/{id}/version` | createVersion |
| PUT | `/api/commercial-proposals/{id}/company-details` | updateCompanyDetails |
| GET | `/api/commercial-proposals/{id}/export-pdf` | exportPdf |
| POST | `/api/commercial-proposals/{id}/apply-bid/{bidComparisonId}` | applyBidWinner |

---

## Module: common

### FileAttachmentController (`modules/common/web/FileAttachmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/attachments` | list |
| POST | `/api/attachments` | create |
| POST | `/api/attachments/upload` | upload |
| GET | `/api/attachments/{id}/download-url` | getDownloadUrl |
| DELETE | `/api/attachments/{id}` | delete |

---

## Module: compliance

### PrivacyComplianceController (`modules/compliance/web/PrivacyComplianceController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/compliance/privacy/consents` | grantConsent |
| PATCH | `/api/compliance/privacy/consents/{id}/revoke` | revokeConsent |
| GET | `/api/compliance/privacy/consents` | listConsents |
| GET | `/api/compliance/privacy/consents/user/{userId}` | getUserConsents |
| POST | `/api/compliance/privacy/subject-requests` | createSubjectRequest |
| GET | `/api/compliance/privacy/subject-requests` | listSubjectRequests |
| GET | `/api/compliance/privacy/subject-requests/{id}` | getSubjectRequest |
| PATCH | `/api/compliance/privacy/subject-requests/{id}/process` | processSubjectRequest |
| GET | `/api/compliance/privacy/subject-requests/overdue` | getOverdueRequests |
| POST | `/api/compliance/privacy/data-deletion/{userId}` | executeDataDeletion |
| POST | `/api/compliance/privacy/policies` | createPolicy |
| GET | `/api/compliance/privacy/policies/current` | getCurrentPolicy |
| GET | `/api/compliance/privacy/policies` | listPolicies |
| GET | `/api/compliance/privacy/pii-access-log` | getPiiAccessLog |
| GET | `/api/compliance/privacy/dashboard` | getDashboard |

---

## Module: constructability

### ConstructabilityController (`modules/constructability/web/ConstructabilityController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/constructability-reviews` | list |
| GET | `/api/constructability-reviews/{id}` | getById |
| POST | `/api/constructability-reviews` | create |
| PUT | `/api/constructability-reviews/{id}` | update |
| DELETE | `/api/constructability-reviews/{id}` | delete |
| GET | `/api/constructability-reviews/{id}/items` | listItems |
| POST | `/api/constructability-reviews/{id}/items` | addItem |
| PUT | `/api/constructability-reviews/{id}/items/{itemId}` | updateItem |
| DELETE | `/api/constructability-reviews/{id}/items/{itemId}` | deleteItem |

---

## Module: contract

### ContractBudgetItemController (`modules/contract/web/ContractBudgetItemController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/contracts/{contractId}/budget-items` | link |
| GET | `/api/contracts/{contractId}/budget-items` | getLinked |
| DELETE | `/api/contracts/{contractId}/budget-items/{linkId}` | unlink |
| PUT | `/api/contracts/{contractId}/budget-items/{linkId}` | updateLinkedItem |
| GET | `/api/budget-items/{budgetItemId}/contracts` | getContracts |
| GET | `/api/budget-items/{budgetItemId}/coverage` | getCoverage |

### ContractController (`modules/contract/web/ContractController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/contracts` | list |
| GET | `/api/contracts/{id}` | getById |
| POST | `/api/contracts` | create |
| PUT | `/api/contracts/{id}` | update |
| PATCH | `/api/contracts/{id}/status` | changeStatus |
| POST | `/api/contracts/{id}/submit-approval` | submitForApproval |
| POST | `/api/contracts/{id}/approve` | approve |
| POST | `/api/contracts/{id}/reject` | reject |
| POST | `/api/contracts/{id}/sign` | sign |
| POST | `/api/contracts/{id}/activate` | activate |
| POST | `/api/contracts/{id}/close` | close |
| POST | `/api/contracts/{id}/version` | createVersion |
| GET | `/api/contracts/{id}/approvals` | getApprovals |
| GET | `/api/contracts/dashboard/summary` | getDashboardSummary |
| GET | `/api/contracts/types` | listTypes |

### ContractTypeController (`modules/contract/web/ContractTypeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/contract-types` | list |
| POST | `/api/contract-types` | create |
| PUT | `/api/contract-types/{id}` | update |

---

## Module: contractExt

### ContractClaimController (`modules/contractExt/web/ContractClaimController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/contract-claims` | list |
| GET | `/api/contract-claims/{id}` | getById |
| POST | `/api/contract-claims` | create |
| PATCH | `/api/contract-claims/{id}/status` | changeStatus |

### ContractExtController (`modules/contractExt/web/ContractExtController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/contracts/{contractId}/guarantees` | listGuarantees |
| POST | `/api/contracts/{contractId}/guarantees` | createGuarantee |
| GET | `/api/contracts/{contractId}/milestones` | listMilestones |
| POST | `/api/contracts/{contractId}/milestones` | createMilestone |
| POST | `/api/contracts/{contractId}/milestones/{milestoneId}/complete` | completeMilestone |
| GET | `/api/contracts/{contractId}/insurances` | listInsurances |
| POST | `/api/contracts/{contractId}/insurances` | createInsurance |

### ContractSlaController (`modules/contractExt/web/ContractSlaController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/contract-slas` | list |
| GET | `/api/contract-slas/{id}` | getById |
| POST | `/api/contract-slas` | create |
| POST | `/api/contract-slas/{id}/deactivate` | deactivate |
| GET | `/api/contract-slas/{slaId}/violations` | listViolations |
| POST | `/api/contract-slas/violations` | createViolation |
| POST | `/api/contract-slas/violations/{id}/resolve` | resolveViolation |

### ContractSupplementController (`modules/contractExt/web/ContractSupplementController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/contract-supplements` | list |
| GET | `/api/contract-supplements/{id}` | getById |
| POST | `/api/contract-supplements` | create |
| POST | `/api/contract-supplements/{id}/approve` | approve |
| POST | `/api/contract-supplements/{id}/sign` | sign |

### LegalCaseController (`modules/contractExt/web/LegalCaseController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/legal-cases` | list |
| GET | `/api/legal-cases/{id}` | getById |
| POST | `/api/legal-cases` | create |
| PATCH | `/api/legal-cases/{id}/status` | changeStatus |
| GET | `/api/legal-cases/{caseId}/documents` | listDocuments |
| POST | `/api/legal-cases/{caseId}/documents` | createDocument |

### ToleranceController (`modules/contractExt/web/ToleranceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/tolerances` | list |
| GET | `/api/tolerances/{id}` | getById |
| POST | `/api/tolerances` | create |
| GET | `/api/tolerances/{toleranceId}/checks` | listChecks |
| POST | `/api/tolerances/checks` | createCheck |

---

## Module: costManagement

### BudgetLineController (`modules/costManagement/web/BudgetLineController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/budget-lines` | list |
| GET | `/api/budget-lines/all` | listAll |
| GET | `/api/budget-lines/{id}` | getById |
| GET | `/api/budget-lines/summary/original-budget` | getTotalOriginalBudget |
| GET | `/api/budget-lines/summary/revised-budget` | getTotalRevisedBudget |
| GET | `/api/budget-lines/summary/actual-cost` | getTotalActualCost |
| GET | `/api/budget-lines/summary/variance` | getTotalVariance |
| POST | `/api/budget-lines` | create |
| PUT | `/api/budget-lines/{id}` | update |
| DELETE | `/api/budget-lines/{id}` | delete |

### CashFlowForecastController (`modules/costManagement/web/CashFlowForecastController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cost-management/cash-flow-forecast/scenarios` | listScenarios |
| GET | `/api/cost-management/cash-flow-forecast/scenarios/{id}` | getScenario |
| GET | `/api/cost-management/cash-flow-forecast/scenarios/project/{projectId}` | getScenariosByProject |
| POST | `/api/cost-management/cash-flow-forecast/scenarios` | createScenario |
| PUT | `/api/cost-management/cash-flow-forecast/scenarios/{id}` | updateScenario |
| DELETE | `/api/cost-management/cash-flow-forecast/scenarios/{id}` | deleteScenario |
| POST | `/api/cost-management/cash-flow-forecast/scenarios/{id}/generate` | generateForecast |
| GET | `/api/cost-management/cash-flow-forecast/scenarios/{id}/buckets` | getForecastBuckets |
| GET | `/api/cost-management/cash-flow-forecast/scenarios/{id}/variance` | getVarianceSummary |

### CashFlowProjectionController (`modules/costManagement/web/CashFlowProjectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cash-flow-projections` | list |
| GET | `/api/cash-flow-projections/{id}` | getById |
| GET | `/api/cash-flow-projections/date-range` | listByDateRange |
| POST | `/api/cash-flow-projections` | create |
| PUT | `/api/cash-flow-projections/{id}` | update |
| DELETE | `/api/cash-flow-projections/{id}` | delete |

### CommitmentController (`modules/costManagement/web/CommitmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/commitments` | list |
| GET | `/api/commitments/{id}` | getById |
| POST | `/api/commitments` | create |
| PUT | `/api/commitments/{id}` | update |
| PATCH | `/api/commitments/{id}/status` | changeStatus |
| POST | `/api/commitments/{id}/change-orders` | addChangeOrder |
| GET | `/api/commitments/{id}/items` | listItems |
| POST | `/api/commitments/{id}/items` | addItem |
| DELETE | `/api/commitments/items/{itemId}` | deleteItem |
| DELETE | `/api/commitments/{id}` | delete |

### CostCodeController (`modules/costManagement/web/CostCodeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cost-codes` | list |
| GET | `/api/cost-codes/all` | listAll |
| GET | `/api/cost-codes/{id}` | getById |
| GET | `/api/cost-codes/{id}/children` | getChildren |
| POST | `/api/cost-codes` | create |
| PUT | `/api/cost-codes/{id}` | update |
| DELETE | `/api/cost-codes/{id}` | delete |

### CostForecastController (`modules/costManagement/web/CostForecastController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cost-forecasts` | list |
| GET | `/api/cost-forecasts/{id}` | getById |
| GET | `/api/cost-forecasts/latest` | getLatest |
| GET | `/api/cost-forecasts/date-range` | listByDateRange |
| POST | `/api/cost-forecasts` | create |
| POST | `/api/cost-forecasts/snapshot` | createSnapshot |
| PUT | `/api/cost-forecasts/{id}` | update |
| DELETE | `/api/cost-forecasts/{id}` | delete |

### ProfitabilityForecastController (`modules/costManagement/web/ProfitabilityForecastController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cost-management/profitability` | list |
| GET | `/api/cost-management/profitability/project/{projectId}` | getByProject |
| GET | `/api/cost-management/profitability/risk/{riskLevel}` | getByRiskLevel |
| POST | `/api/cost-management/profitability/recalculate/{projectId}` | recalculate |
| POST | `/api/cost-management/profitability/recalculate-all` | recalculateAll |
| GET | `/api/cost-management/profitability/portfolio` | getPortfolioSummary |
| GET | `/api/cost-management/profitability/snapshots/{projectId}` | getSnapshots |
| DELETE | `/api/cost-management/profitability/project/{projectId}` | deleteForProject |

---

## Module: crm

### CrmController (`modules/crm/web/CrmController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/crm/opportunities` | listOpportunities |
| GET | `/api/v1/crm/leads` | listLeads |
| GET | `/api/v1/crm/leads/{id}` | getLead |
| POST | `/api/v1/crm/leads` | createLead |
| PUT | `/api/v1/crm/leads/{id}` | updateLead |
| PATCH | `/api/v1/crm/leads/{id}/stage/{stageId}` | moveToStage |
| POST | `/api/v1/crm/leads/{id}/won` | markAsWon |
| POST | `/api/v1/crm/leads/{id}/lost` | markAsLost |
| POST | `/api/v1/crm/leads/{id}/convert` | convertToProject |
| DELETE | `/api/v1/crm/leads/{id}` | deleteLead |
| GET | `/api/v1/crm/stages` | listStages |
| POST | `/api/v1/crm/stages` | createStage |
| GET | `/api/v1/crm/teams` | listTeams |
| POST | `/api/v1/crm/teams` | createTeam |
| GET | `/api/v1/crm/leads/{leadId}/activities` | getLeadActivities |
| POST | `/api/v1/crm/activities` | createActivity |
| POST | `/api/v1/crm/activities/{id}/complete` | completeActivity |
| GET | `/api/v1/crm/pipeline` | getPipelineStats |

---

## Module: dailylog

### DailyLogController (`modules/dailylog/web/DailyLogController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/daily-logs` | list |
| GET | `/api/daily-logs/{id}` | getById |
| GET | `/api/daily-logs/by-date` | getByDate |
| GET | `/api/daily-logs/date-range` | getByDateRange |
| GET | `/api/daily-logs/timeline/{projectId}` | getTimeline |
| POST | `/api/daily-logs` | create |
| PUT | `/api/daily-logs/{id}` | update |
| PATCH | `/api/daily-logs/{id}/submit` | submit |
| PATCH | `/api/daily-logs/{id}/approve` | approve |
| DELETE | `/api/daily-logs/{id}` | delete |
| GET | `/api/daily-logs/{id}/entries` | listEntries |
| GET | `/api/daily-logs/{id}/entries/{entryId}` | getEntry |
| POST | `/api/daily-logs/{id}/entries` | createEntry |
| PUT | `/api/daily-logs/{id}/entries/{entryId}` | updateEntry |
| DELETE | `/api/daily-logs/{id}/entries/{entryId}` | deleteEntry |
| GET | `/api/daily-logs/{id}/photos` | listPhotos |
| POST | `/api/daily-logs/{id}/photos` | addPhoto |
| DELETE | `/api/daily-logs/{id}/photos/{photoId}` | deletePhoto |

---

## Module: design

### DesignController (`modules/design/web/DesignController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/design/versions` | listVersions |
| GET | `/api/v1/design/versions/{id}` | getVersion |
| GET | `/api/v1/design/versions/by-document/{documentId}` | getVersionsByDocument |
| POST | `/api/v1/design/versions` | createVersion |
| PUT | `/api/v1/design/versions/{id}` | updateVersion |
| POST | `/api/v1/design/versions/{id}/submit-for-review` | submitForReview |
| POST | `/api/v1/design/versions/{id}/approve` | approveVersion |
| POST | `/api/v1/design/versions/{id}/supersede` | supersedeVersion |
| POST | `/api/v1/design/versions/{id}/archive` | archiveVersion |
| DELETE | `/api/v1/design/versions/{id}` | deleteVersion |
| GET | `/api/v1/design/reviews` | listReviews |
| GET | `/api/v1/design/versions/{versionId}/reviews` | getReviewsForVersion |
| POST | `/api/v1/design/reviews` | createReview |
| POST | `/api/v1/design/reviews/{id}/approve` | approveReview |
| POST | `/api/v1/design/reviews/{id}/reject` | rejectReview |
| POST | `/api/v1/design/reviews/{id}/request-revision` | requestRevision |
| GET | `/api/v1/design/sections` | getSections |
| GET | `/api/v1/design/sections/root` | getRootSections |
| GET | `/api/v1/design/sections/{parentId}/children` | getChildSections |
| POST | `/api/v1/design/sections` | createSection |
| PUT | `/api/v1/design/sections/{id}` | updateSection |
| DELETE | `/api/v1/design/sections/{id}` | deleteSection |

---

## Module: document

### DocumentController (`modules/document/web/DocumentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/documents` | list |
| GET | `/api/documents/{id}` | getById |
| POST | `/api/documents/{id}/upload` | uploadFile |
| GET | `/api/documents/{id}/download-url` | getDownloadUrl |
| POST | `/api/documents` | create |
| PUT | `/api/documents/{id}` | update |
| PATCH | `/api/documents/{id}/status` | changeStatus |
| POST | `/api/documents/{id}/version` | createVersion |
| POST | `/api/documents/{id}/comments` | addComment |
| POST | `/api/documents/{id}/access` | grantAccess |
| DELETE | `/api/documents/{id}/access/{userId}` | revokeAccess |
| GET | `/api/documents/{id}/history` | getHistory |
| GET | `/api/documents/search` | search |
| GET | `/api/documents/expiring` | getExpiringDocuments |

### DrawingMarkupController (`modules/document/web/DrawingMarkupController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/documents/{documentId}/markups` | list |
| GET | `/api/documents/{documentId}/markups/{id}` | getById |
| POST | `/api/documents/{documentId}/markups` | create |
| PUT | `/api/documents/{documentId}/markups/{id}` | update |
| DELETE | `/api/documents/{documentId}/markups/{id}` | delete |

### ProjectDocumentController (`modules/document/web/ProjectDocumentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/projects/{projectId}/documents` | getProjectDocuments |

---

## Module: email

### EmailController (`modules/email/web/EmailController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/email/messages` | listMessages |
| GET | `/api/v1/email/messages/{id}` | getMessage |
| POST | `/api/v1/email/messages/{id}/read` | markRead |
| POST | `/api/v1/email/messages/{id}/unread` | markUnread |
| POST | `/api/v1/email/messages/{id}/star` | star |
| POST | `/api/v1/email/messages/{id}/unstar` | unstar |
| DELETE | `/api/v1/email/messages/{id}` | deleteMessage |
| POST | `/api/v1/email/send` | sendEmail |
| POST | `/api/v1/email/reply/{id}` | replyEmail |
| POST | `/api/v1/email/forward/{id}` | forwardEmail |
| GET | `/api/v1/email/messages/{emailId}/attachments/{attId}/download` | downloadAttachment |
| POST | `/api/v1/email/messages/{id}/link-project` | linkProject |
| DELETE | `/api/v1/email/messages/{id}/unlink-project/{projectId}` | unlinkProject |
| GET | `/api/v1/email/projects/{projectId}/messages` | getProjectMessages |
| GET | `/api/v1/email/unread-count` | getUnreadCount |
| POST | `/api/v1/email/sync` | syncNow |
| POST | `/api/v1/email/sync-full` | syncFull |

---

## Module: esg

### EsgController (`modules/esg/web/EsgController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/esg/gwp` | listGwpEntries |
| GET | `/api/esg/gwp/{id}` | getGwpEntry |
| POST | `/api/esg/gwp` | createGwpEntry |
| DELETE | `/api/esg/gwp/{id}` | deleteGwpEntry |
| POST | `/api/esg/footprint/calculate` | calculateFootprint |
| GET | `/api/esg/footprint/project/{projectId}` | getProjectFootprint |
| GET | `/api/esg/footprint` | listFootprints |
| POST | `/api/esg/reports/generate` | generateReport |
| GET | `/api/esg/reports/{id}` | getReport |
| GET | `/api/esg/reports` | listReports |
| PATCH | `/api/esg/reports/{id}/approve` | approveReport |
| DELETE | `/api/esg/reports/{id}` | deleteReport |
| GET | `/api/esg/portfolio/summary` | getPortfolioSummary |

---

## Module: estimate

### EstimateAdvancedController (`modules/estimate/web/EstimateAdvancedController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/estimates/import` | importEstimate |
| GET | `/api/estimates/import/history` | getImportHistory |
| GET | `/api/estimates/{id}/export/validate` | validateForExport |
| POST | `/api/estimates/{id}/export` | exportEstimate |
| GET | `/api/estimates/export/history` | getExportHistory |
| POST | `/api/estimates/volume/calculate` | calculateVolume |
| POST | `/api/estimates/volume/save` | saveCalculation |
| GET | `/api/estimates/volume/calculations` | getSavedCalculations |
| GET | `/api/estimates/{id}/comparison` | getComparison |
| GET | `/api/estimates/normative-rates/search` | searchNormativeRates |
| POST | `/api/estimates/local/import-lsr` | importLsr |

### EstimateController (`modules/estimate/web/EstimateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/estimates` | list |
| GET | `/api/estimates/{id}` | getById |
| POST | `/api/estimates` | create |
| PUT | `/api/estimates/{id}` | update |
| PATCH | `/api/estimates/{id}/status` | changeStatus |
| POST | `/api/estimates/from-specification` | createFromSpecification |
| GET | `/api/estimates/{id}/items` | getItems |
| POST | `/api/estimates/{id}/items` | addItem |
| PUT | `/api/estimates/items/{itemId}` | updateItem |
| DELETE | `/api/estimates/items/{itemId}` | removeItem |
| POST | `/api/estimates/{id}/recalculate` | recalculate |
| POST | `/api/estimates/{id}/version` | createVersion |
| GET | `/api/estimates/{id}/financial-summary` | getFinancialSummary |
| GET | `/api/estimates/project/{projectId}/summary` | getProjectSummary |

### LocalEstimateController (`modules/estimate/web/LocalEstimateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/estimates/local` | listEstimates |
| GET | `/api/estimates/local/{id}` | getEstimate |
| POST | `/api/estimates/local` | createEstimate |
| POST | `/api/estimates/local/{id}/lines` | addLine |
| DELETE | `/api/estimates/local/{id}/lines/{lineId}` | removeLine |
| POST | `/api/estimates/local/{id}/calculate` | calculateEstimate |
| POST | `/api/estimates/local/{id}/approve` | approveEstimate |
| DELETE | `/api/estimates/local/{id}` | deleteEstimate |
| POST | `/api/estimates/local/import-indices` | importMinstroyIndices |
| GET | `/api/estimates/local/minstroy/indices` | getMinstroyIndices |
| POST | `/api/estimates/local/{id}/minstroy/apply` | applyMinstroyIndices |

### NormativeDataController (`modules/estimate/web/NormativeDataController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/estimates/normative/sections` | getSections |
| GET | `/api/estimates/normative/rates/{rateId}/resources` | getRateResources |
| GET | `/api/estimates/normative/rates/search` | searchRates |

### PriceSuggestionController (`modules/estimate/web/PriceSuggestionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/estimates/price-suggestion` | getPriceSuggestion |

---

## Module: feedback

### FeedbackController (`modules/feedback/web/FeedbackController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/feedback` | list |
| POST | `/api/feedback` | submit |
| GET | `/api/feedback/should-show` | shouldShow |
| GET | `/api/feedback/stats` | getStats |

---

## Module: finance

### BankStatementController (`modules/finance/web/BankStatementController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/bank-statements/upload` | upload |
| POST | `/api/bank-statements/transactions/{transactionId}/confirm` | confirmMatch |
| POST | `/api/bank-statements/transactions/{transactionId}/reject` | rejectMatch |

### BudgetController (`modules/finance/web/BudgetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/budgets` | list |
| GET | `/api/budgets/{id}` | getById |
| POST | `/api/budgets` | create |
| PUT | `/api/budgets/{id}` | update |
| POST | `/api/budgets/{id}/approve` | approve |
| POST | `/api/budgets/{id}/activate` | activate |
| POST | `/api/budgets/{id}/freeze` | freeze |
| POST | `/api/budgets/{id}/close` | close |
| POST | `/api/budgets/{id}/recalculate` | recalculate |
| GET | `/api/budgets/summary` | getSummary |
| GET | `/api/budgets/{budgetId}/items` | getItems |
| POST | `/api/budgets/{budgetId}/items/{itemId}/link-wbs` | linkToWbsNode |
| POST | `/api/budgets/{budgetId}/items` | addItem |
| POST | `/api/budgets/{budgetId}/items/import-estimate` | importFromEstimate |
| PUT | `/api/budgets/{budgetId}/items/{itemId}` | updateItem |
| DELETE | `/api/budgets/{budgetId}/items/{itemId}` | deleteItem |
| POST | `/api/budgets/{id}/generate-own-costs` | generateOwnCosts |
| GET | `/api/budgets/{id}/roi` | calculateROI |
| POST | `/api/budgets/{id}/margin-scenario` | simulateMarginScenario |

### BudgetSnapshotController (`modules/finance/web/BudgetSnapshotController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/budgets/{budgetId}/snapshots` | create |
| GET | `/api/budgets/{budgetId}/snapshots` | list |
| GET | `/api/budgets/{budgetId}/snapshots/{snapshotId}/compare` | compare |

### CashFlowController (`modules/finance/web/CashFlowController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/cash-flow` | list |
| GET | `/api/cash-flow/{id}` | getById |
| POST | `/api/cash-flow` | create |
| DELETE | `/api/cash-flow/{id}` | delete |
| GET | `/api/cash-flow/project/{projectId}` | getProjectCashFlow |
| GET | `/api/cash-flow/summary` | getSummary |
| POST | `/api/cash-flow/generate` | generateForecast |

### CostCodeController (`modules/finance/web/CostCodeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/finance/cost-codes` | list |
| GET | `/api/finance/cost-codes/tree` | tree |
| GET | `/api/finance/cost-codes/{id}` | getById |
| POST | `/api/finance/cost-codes` | create |
| PUT | `/api/finance/cost-codes/{id}` | update |
| DELETE | `/api/finance/cost-codes/{id}` | delete |
| POST | `/api/finance/cost-codes/seed/{standard}` | seed |

### FinanceAdvancedController (`modules/finance/web/FinanceAdvancedController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/factoring/calculate` | calculateFactoring |
| GET | `/api/treasury/payments` | getTreasuryPayments |
| PUT | `/api/treasury/payments/{id}/priority` | updatePaymentPriority |
| POST | `/api/bank-export/generate` | generateBankExport |
| GET | `/api/bank-export/history` | getBankExportHistory |
| POST | `/api/finance/payment-calendar/preview` | previewPaymentCalendar |
| POST | `/api/finance/payment-calendar/generate` | generatePaymentCalendar |
| GET | `/api/finance/execution-chain/{projectId}` | getExecutionChain |
| GET | `/api/tax/deadlines` | getTaxDeadlines |
| PUT | `/api/tax/deadlines/{taxId}/notification` | toggleTaxNotification |

### FinanceExpensesController (`modules/finance/web/FinanceExpensesController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/finance/expenses` | getExpenses |

### FmDashboardController (`modules/finance/web/FmDashboardController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/budgets/{budgetId}/dashboard` | getDashboard |

### InvoiceController (`modules/finance/web/InvoiceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/invoices` | list |
| GET | `/api/invoices/{id}` | getById |
| POST | `/api/invoices` | create |
| PUT | `/api/invoices/{id}` | update |
| POST | `/api/invoices/{id}/send` | send |
| POST | `/api/invoices/{id}/status` | changeStatus |
| POST | `/api/invoices/{id}/register-payment` | registerPayment |
| POST | `/api/invoices/{id}/mark-overdue` | markOverdue |
| POST | `/api/invoices/{id}/cancel` | cancel |
| GET | `/api/invoices/summary` | getSummary |
| GET | `/api/invoices/{invoiceId}/lines` | getLines |
| GET | `/api/invoices/{invoiceId}/payments` | getPayments |
| POST | `/api/invoices/{invoiceId}/lines` | addLine |
| POST | `/api/invoices/{invoiceId}/lines/{lineId}/link` | linkLine |
| GET | `/api/invoices/{id}/three-way-match` | threeWayMatch |
| GET | `/api/invoices/{id}/matches` | getMatches |
| DELETE | `/api/invoices/{invoiceId}/lines/{lineId}` | deleteLine |

### InvoiceMatchingController (`modules/finance/web/InvoiceMatchingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/invoices/{invoiceId}/match` | matchToPositions |
| GET | `/api/invoices/{invoiceId}/three-way-match` | threeWayMatch |

### PaymentController (`modules/finance/web/PaymentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/payments` | list |
| GET | `/api/payments/{id}` | getById |
| POST | `/api/payments` | create |
| PUT | `/api/payments/{id}` | update |
| POST | `/api/payments/{id}/approve` | approve |
| POST | `/api/payments/{id}/mark-paid` | markPaid |
| POST | `/api/payments/{id}/cancel` | cancel |
| GET | `/api/payments/summary` | getSummary |

### ProjectSectionController (`modules/finance/web/ProjectSectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/projects/{projectId}/sections` | list |
| PUT | `/api/projects/{projectId}/sections` | update |
| POST | `/api/projects/{projectId}/sections/custom` | addCustom |
| DELETE | `/api/projects/{projectId}/sections/{sectionId}` | delete |
| POST | `/api/projects/{projectId}/sections/seed` | seed |

### ReconciliationActController (`modules/finance/web/ReconciliationActController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/finance/reconciliation-acts` | list |
| GET | `/api/finance/reconciliation-acts/{id}` | getById |
| POST | `/api/finance/reconciliation-acts` | create |
| PUT | `/api/finance/reconciliation-acts/{id}` | update |
| POST | `/api/finance/reconciliation-acts/{id}/send` | send |
| POST | `/api/finance/reconciliation-acts/{id}/confirm` | confirm |
| POST | `/api/finance/reconciliation-acts/{id}/sign` | sign |
| DELETE | `/api/finance/reconciliation-acts/{id}` | delete |

### ValueEngineeringController (`modules/finance/web/ValueEngineeringController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/projects/{projectId}/value-engineering` | list |
| POST | `/api/projects/{projectId}/value-engineering` | create |
| PUT | `/api/projects/{projectId}/value-engineering/{itemId}` | update |

---

## Module: fleet

### EquipmentInspectionController (`modules/fleet/web/EquipmentInspectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/inspections` | list |
| GET | `/api/fleet/inspections/{id}` | getById |
| POST | `/api/fleet/inspections` | create |
| PUT | `/api/fleet/inspections/{id}` | update |
| DELETE | `/api/fleet/inspections/{id}` | delete |
| GET | `/api/fleet/inspections/daily-check` | getDailyCheckList |
| GET | `/api/fleet/inspections/upcoming` | getUpcoming |

### EquipmentUsageLogController (`modules/fleet/web/EquipmentUsageLogController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/usage-logs` | list |
| GET | `/api/fleet/usage-logs/{id}` | getById |
| POST | `/api/fleet/usage-logs` | create |
| PUT | `/api/fleet/usage-logs/{id}` | update |
| DELETE | `/api/fleet/usage-logs/{id}` | delete |
| GET | `/api/fleet/usage-logs/total-hours/{vehicleId}` | getTotalHours |
| GET | `/api/fleet/usage-logs/machine-hour-rate/{vehicleId}` | calculateMachineHourRate |
| GET | `/api/fleet/usage-logs/own-vs-rent/{vehicleId}` | compareOwnVsRent |

### FleetMaintenanceController (`modules/fleet/web/FleetMaintenanceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/maintenance` | list |
| GET | `/api/fleet/maintenance/{id}` | getById |
| POST | `/api/fleet/maintenance` | schedule |
| PUT | `/api/fleet/maintenance/{id}` | update |
| POST | `/api/fleet/maintenance/{id}/start` | start |
| POST | `/api/fleet/maintenance/{id}/complete` | complete |
| POST | `/api/fleet/maintenance/{id}/cancel` | cancel |
| DELETE | `/api/fleet/maintenance/{id}` | delete |
| GET | `/api/fleet/maintenance/upcoming` | getUpcoming |
| GET | `/api/fleet/maintenance/history/{vehicleId}` | getHistory |
| GET | `/api/fleet/maintenance/costs/{vehicleId}` | getCosts |

### FleetWaybillController (`modules/fleet/web/FleetWaybillController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/waybills` | list |
| GET | `/api/fleet/waybills/{id}` | getById |
| POST | `/api/fleet/waybills` | create |
| PUT | `/api/fleet/waybills/{id}` | update |
| PATCH | `/api/fleet/waybills/{id}/status` | changeStatus |
| DELETE | `/api/fleet/waybills/{id}` | delete |

### FuelController (`modules/fleet/web/FuelController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/fuel` | list |
| GET | `/api/fleet/fuel/{id}` | getById |
| POST | `/api/fleet/fuel` | create |
| PUT | `/api/fleet/fuel/{id}` | update |
| DELETE | `/api/fleet/fuel/{id}` | delete |
| GET | `/api/fleet/fuel/history/{vehicleId}` | getVehicleFuelHistory |
| GET | `/api/fleet/fuel/costs/by-project/{projectId}` | getFuelCostsByProject |
| GET | `/api/fleet/fuel/consumption-report/{vehicleId}` | getConsumptionReport |

### MaintenanceScheduleController (`modules/fleet/web/MaintenanceScheduleController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/maintenance-schedule/rules` | listRules |
| GET | `/api/fleet/maintenance-schedule/rules/{id}` | getRule |
| POST | `/api/fleet/maintenance-schedule/rules` | createRule |
| PUT | `/api/fleet/maintenance-schedule/rules/{id}` | updateRule |
| PATCH | `/api/fleet/maintenance-schedule/rules/{id}/toggle` | toggleRule |
| DELETE | `/api/fleet/maintenance-schedule/rules/{id}` | deleteRule |
| GET | `/api/fleet/maintenance-schedule/due` | getDueItems |
| GET | `/api/fleet/maintenance-schedule/compliance` | getComplianceDashboard |

### VehicleController (`modules/fleet/web/VehicleController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/fleet/vehicles` | list |
| GET | `/api/fleet/vehicles/{id}` | getById |
| POST | `/api/fleet/vehicles` | create |
| PUT | `/api/fleet/vehicles/{id}` | update |
| DELETE | `/api/fleet/vehicles/{id}` | delete |
| POST | `/api/fleet/vehicles/{id}/assign` | assignToProject |
| POST | `/api/fleet/vehicles/{id}/return` | returnFromProject |
| GET | `/api/fleet/vehicles/available` | getAvailable |
| GET | `/api/fleet/vehicles/by-project/{projectId}` | getByProject |
| GET | `/api/fleet/vehicles/expiring-insurance` | getExpiringInsurance |
| GET | `/api/fleet/vehicles/expiring-tech-inspection` | getExpiringTechInspection |
| GET | `/api/fleet/vehicles/{id}/depreciation` | calculateDepreciation |
| GET | `/api/fleet/vehicles/{id}/assignments` | getAssignments |

---

## Module: gpsTimesheet

### GpsTimesheetController (`modules/gpsTimesheet/web/GpsTimesheetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/gps-timesheets/geofences` | listGeofences |
| GET | `/api/gps-timesheets/geofences/{id}` | getGeofence |
| POST | `/api/gps-timesheets/geofences` | createGeofence |
| PUT | `/api/gps-timesheets/geofences/{id}` | updateGeofence |
| DELETE | `/api/gps-timesheets/geofences/{id}` | deleteGeofence |
| POST | `/api/gps-timesheets/check-in` | checkIn |
| POST | `/api/gps-timesheets/check-out` | checkOut |
| GET | `/api/gps-timesheets/entries` | listEntries |
| GET | `/api/gps-timesheets/entries/unverified` | listUnverified |
| PATCH | `/api/gps-timesheets/entries/{id}/verify` | verifyEntry |
| GET | `/api/gps-timesheets/entries/employee/{employeeId}` | getEmployeeTimesheet |
| GET | `/api/gps-timesheets/summaries` | listSummaries |
| POST | `/api/gps-timesheets/summaries/generate` | generateSummaries |
| GET | `/api/gps-timesheets/dashboard` | getDashboard |

---

## Module: hr

### CertificationDashboardController (`modules/hr/web/CertificationDashboardController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/certifications/dashboard` | getDashboard |

### CrewController (`modules/hr/web/CrewController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/crew` | listAll |
| POST | `/api/crew` | assign |
| DELETE | `/api/crew/employee/{employeeId}/project/{projectId}` | remove |
| GET | `/api/crew/project/{projectId}` | getProjectCrew |
| GET | `/api/crew/employee/{employeeId}` | getEmployeeProjects |

### CrewTeamsController (`modules/hr/web/CrewTeamsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/crews` | listCrews |

### EmployeeController (`modules/hr/web/EmployeeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/employees` | list |
| GET | `/api/employees/{id}` | getById |
| POST | `/api/employees` | create |
| PUT | `/api/employees/{id}` | update |
| DELETE | `/api/employees/{id}` | delete |
| GET | `/api/employees/by-project/{projectId}` | getByProject |
| GET | `/api/employees/{employeeId}/certificates` | getCertificates |
| POST | `/api/employees/{employeeId}/certificates` | addCertificate |
| DELETE | `/api/employees/certificates/{certificateId}` | deleteCertificate |
| GET | `/api/employees/certificates/expired` | getExpiredCertificates |
| GET | `/api/employees/certificates/expiring` | getExpiringCertificates |

### HrExtendedController (`modules/hr/web/HrExtendedController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr/staffing-schedule` | getStaffingSchedule |
| POST | `/api/hr/staffing-schedule/vacancies` | createVacancy |
| GET | `/api/hr/timesheet-t13` | getTimesheetT13 |
| PUT | `/api/hr/timesheet-t13/cell` | updateTimesheetT13Cell |
| GET | `/api/hr/work-orders` | getWorkOrders |
| POST | `/api/hr/work-orders` | createWorkOrder |
| GET | `/api/hr/qualifications` | getQualifications |
| POST | `/api/hr/qualifications` | createQualification |
| GET | `/api/hr/seniority-report` | getSeniorityReport |

### TimesheetController (`modules/hr/web/TimesheetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/timesheets` | list |
| GET | `/api/timesheets/employee/{employeeId}` | listByEmployee |
| GET | `/api/timesheets/project/{projectId}` | listByProject |
| GET | `/api/timesheets/{id}` | getById |
| POST | `/api/timesheets` | create |
| PUT | `/api/timesheets/{id}` | update |
| PATCH | `/api/timesheets/{id}/submit` | submit |
| PATCH | `/api/timesheets/{id}/approve` | approve |
| PATCH | `/api/timesheets/{id}/reject` | reject |
| DELETE | `/api/timesheets/{id}` | delete |
| GET | `/api/timesheets/summary/weekly` | getWeeklySummary |
| GET | `/api/timesheets/summary/monthly` | getMonthlySummary |

---

## Module: hrRussian

### BusinessTripController (`modules/hrRussian/web/BusinessTripController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/business-trips` | list |
| GET | `/api/hr-russian/business-trips/employee/{employeeId}` | getByEmployee |
| GET | `/api/hr-russian/business-trips/{id}` | getById |
| POST | `/api/hr-russian/business-trips` | create |
| PUT | `/api/hr-russian/business-trips/{id}/approve` | approve |
| PUT | `/api/hr-russian/business-trips/{id}/complete` | complete |
| GET | `/api/hr-russian/business-trips/active` | getActiveTrips |

### EmploymentContractController (`modules/hrRussian/web/EmploymentContractController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/contracts` | list |
| GET | `/api/hr-russian/contracts/employee/{employeeId}` | getByEmployee |
| GET | `/api/hr-russian/contracts/{id}` | getById |
| POST | `/api/hr-russian/contracts` | create |
| PUT | `/api/hr-russian/contracts/{id}/terminate` | terminate |
| DELETE | `/api/hr-russian/contracts/{id}` | delete |

### EmploymentOrderController (`modules/hrRussian/web/EmploymentOrderController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/orders/employee/{employeeId}` | getByEmployee |
| GET | `/api/hr-russian/orders` | list |
| POST | `/api/hr-russian/orders` | create |
| DELETE | `/api/hr-russian/orders/{id}` | delete |

### HrRussianTimesheetController (`modules/hrRussian/web/HrRussianTimesheetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/timesheets` | list |
| GET | `/api/hr-russian/timesheets/{id}` | getById |
| POST | `/api/hr-russian/timesheets/{id}/submit` | submit |
| POST | `/api/hr-russian/timesheets/{id}/approve` | approve |

### SickLeaveController (`modules/hrRussian/web/SickLeaveController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/sick-leaves` | list |
| GET | `/api/hr-russian/sick-leaves/employee/{employeeId}` | getByEmployee |
| GET | `/api/hr-russian/sick-leaves/{id}` | getById |
| POST | `/api/hr-russian/sick-leaves` | create |
| PUT | `/api/hr-russian/sick-leaves/{id}/close` | close |
| GET | `/api/hr-russian/sick-leaves/open` | getOpenSickLeaves |

### StaffingTableController (`modules/hrRussian/web/StaffingTableController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/staffing-table` | list |
| GET | `/api/hr-russian/staffing-table/vacancies` | getVacancies |
| POST | `/api/hr-russian/staffing-table` | create |
| DELETE | `/api/hr-russian/staffing-table/{id}` | delete |

### VacationController (`modules/hrRussian/web/VacationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hr-russian/vacations` | list |
| GET | `/api/hr-russian/vacations/employee/{employeeId}` | getByEmployee |
| GET | `/api/hr-russian/vacations/{id}` | getById |
| POST | `/api/hr-russian/vacations` | create |
| PUT | `/api/hr-russian/vacations/{id}/approve` | approve |
| PUT | `/api/hr-russian/vacations/{id}/cancel` | cancel |
| DELETE | `/api/hr-russian/vacations/{id}` | delete |

---

## Module: immutableAudit

### ImmutableRecordController (`modules/immutableAudit/web/ImmutableRecordController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/immutable-records` | list |
| GET | `/api/immutable-records/{id}` | getById |
| POST | `/api/immutable-records` | create |
| POST | `/api/immutable-records/supersede` | supersede |
| GET | `/api/immutable-records/verify` | verifyChain |
| GET | `/api/immutable-records/{id}/supersessions` | getSupersessions |

---

## Module: infrastructure/health

### SystemStatusController (`infrastructure/health/SystemStatusController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/system/status` | getSystemStatus |
| GET | `/api/system/ping` | ping |

---

## Module: infrastructure/report

### PdfReportController (`infrastructure/report/PdfReportController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pdf-reports/ks2/{id}/pdf` | downloadKs2Report |
| GET | `/api/pdf-reports/ks3/{id}/pdf` | downloadKs3Report |
| GET | `/api/pdf-reports/project/{id}/summary` | downloadProjectSummary |
| GET | `/api/pdf-reports/safety/{id}/pdf` | downloadSafetyReport |
| GET | `/api/pdf-reports/daily-log/{id}/pdf` | downloadDailyLogReport |

---

## Module: infrastructure/web

### HealthCheckController (`infrastructure/web/HealthCheckController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/health` | health |
| GET | `/api/health/ready` | readiness |
| GET | `/api/health/live` | liveness |
| GET | `/api/health/status` | getStatus |

---

## Module: insurance

### InsuranceCertificateController (`modules/insurance/web/InsuranceCertificateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/insurance-certificates` | list |
| GET | `/api/insurance-certificates/expiring` | getExpiring |
| GET | `/api/insurance-certificates/{id}` | getById |
| POST | `/api/insurance-certificates` | create |
| PUT | `/api/insurance-certificates/{id}` | update |
| DELETE | `/api/insurance-certificates/{id}` | delete |

---

## Module: integration

### BankController (`modules/integration/web/BankController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/integrations/bank/statements/sync` | syncStatements |
| POST | `/api/integrations/bank/payments/create` | createPaymentOrder |
| GET | `/api/integrations/bank/payments/{syncJobId}/status` | checkPaymentStatus |
| POST | `/api/integrations/bank/reconcile/{endpointId}` | reconcilePayments |

### EdoController (`modules/integration/web/EdoController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/integrations/edo/inbox` | getInbox |
| POST | `/api/integrations/edo/send` | sendDocument |
| POST | `/api/integrations/edo/{id}/sign` | signDocument |
| POST | `/api/integrations/edo/{id}/reject` | rejectDocument |
| GET | `/api/integrations/edo/{id}/status` | getDocumentStatus |
| GET | `/api/integrations/edo/{id}/download` | downloadDocument |
| GET | `/api/integrations/edo/status` | getEdoStatus |

### EdoKs2ExportController (`modules/integration/web/EdoKs2ExportController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/integrations/edo-export/ks2/{ks2Id}/send` | sendKs2ToEdo |
| POST | `/api/integrations/edo-export/ks3/{ks3Id}/send` | sendKs3ToEdo |
| GET | `/api/integrations/edo-export/status/{sbisDocId}` | checkDeliveryStatus |
| POST | `/api/integrations/edo-export/inbound` | receiveInbound |

### IntegrationController (`modules/integration/web/IntegrationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/integrations/endpoints` | list |
| GET | `/api/admin/integrations/endpoints/{id}` | getById |
| GET | `/api/admin/integrations/endpoints/by-provider` | getByProvider |
| POST | `/api/admin/integrations/endpoints` | create |
| PUT | `/api/admin/integrations/endpoints/{id}` | update |
| DELETE | `/api/admin/integrations/endpoints/{id}` | delete |
| POST | `/api/admin/integrations/endpoints/{id}/test` | testConnection |
| POST | `/api/admin/integrations/endpoints/{id}/health` | healthCheck |

### IntegrationSettingsController (`modules/integration/web/IntegrationSettingsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/integrations/settings` | getAllSettings |

### OneCController (`modules/integration/web/OneCController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/integrations/1c/configs` | listConfigs |
| GET | `/api/integrations/1c/configs/{id}` | getConfig |
| POST | `/api/integrations/1c/configs` | createConfig |
| PUT | `/api/integrations/1c/configs/{id}` | updateConfig |
| DELETE | `/api/integrations/1c/configs/{id}` | deleteConfig |
| POST | `/api/integrations/1c/configs/{id}/toggle` | toggleConfig |
| POST | `/api/integrations/1c/configs/{id}/test-connection` | testConnection |
| POST | `/api/integrations/1c/configs/{id}/sync` | triggerSync |
| GET | `/api/integrations/1c/status` | getStatus |
| GET | `/api/integrations/1c/exchange-logs` | listExchangeLogs |
| GET | `/api/integrations/1c/mappings` | listMappings |
| POST | `/api/integrations/1c/invoices/sync` | syncInvoices |
| POST | `/api/integrations/1c/payments/sync` | syncPayments |
| POST | `/api/integrations/1c/employees/sync` | syncEmployees |
| POST | `/api/integrations/1c/materials/sync` | syncMaterials |
| POST | `/api/integrations/1c/contractors/import` | importContractors |
| POST | `/api/integrations/1c/documents/export` | exportDocuments |
| POST | `/api/integrations/1c/configs/{id}/full-exchange` | fullExchange |
| POST | `/api/integrations/1c/configs/{id}/import/{entityType}` | importEntity |
| POST | `/api/integrations/1c/configs/{id}/export/{entityType}` | exportEntity |
| POST | `/api/integrations/1c/configs/{id}/incremental/{entityType}` | incrementalSync |

### SbisController (`modules/integration/web/SbisController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/integrations/sbis/configs` | listConfigs |
| GET | `/api/integrations/sbis/configs/{id}` | getConfig |
| POST | `/api/integrations/sbis/configs` | createConfig |
| PUT | `/api/integrations/sbis/configs/{id}` | updateConfig |
| DELETE | `/api/integrations/sbis/configs/{id}` | deleteConfig |
| POST | `/api/integrations/sbis/configs/{id}/toggle` | toggleConfig |
| POST | `/api/integrations/sbis/configs/{id}/test` | testConnection |
| POST | `/api/integrations/sbis/sync` | syncDocuments |
| GET | `/api/integrations/sbis/documents` | listDocuments |
| GET | `/api/integrations/sbis/documents/{id}` | getDocument |
| POST | `/api/integrations/sbis/documents` | createDocument |
| POST | `/api/integrations/sbis/documents/{id}/send` | sendDocument |
| POST | `/api/integrations/sbis/documents/{id}/accept` | acceptDocument |
| POST | `/api/integrations/sbis/documents/{id}/reject` | rejectDocument |
| DELETE | `/api/integrations/sbis/documents/{id}` | deleteDocument |
| GET | `/api/integrations/sbis/partner-mappings` | listPartnerMappings |
| DELETE | `/api/integrations/sbis/partner-mappings/{id}` | deletePartnerMapping |

### SyncController (`modules/integration/web/SyncController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/admin/integrations/sync/start` | startSync |
| POST | `/api/admin/integrations/sync/{id}/cancel` | cancelSync |
| POST | `/api/admin/integrations/sync/{id}/retry` | retrySync |
| GET | `/api/admin/integrations/sync/{id}` | getById |
| GET | `/api/admin/integrations/sync/history` | history |
| GET | `/api/admin/integrations/sync/last` | getLastSync |
| GET | `/api/admin/integrations/sync/mappings` | listMappings |
| GET | `/api/admin/integrations/sync/mappings/{id}` | getMappingById |
| GET | `/api/admin/integrations/sync/mappings/fields` | getFieldMappings |
| POST | `/api/admin/integrations/sync/mappings` | createMapping |
| PUT | `/api/admin/integrations/sync/mappings/{id}` | updateMapping |
| DELETE | `/api/admin/integrations/sync/mappings/{id}` | deleteMapping |

### WebhookController (`modules/integration/web/WebhookController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/webhooks` | list |
| GET | `/api/admin/webhooks/{id}` | getById |
| POST | `/api/admin/webhooks` | register |
| PUT | `/api/admin/webhooks/{id}` | update |
| DELETE | `/api/admin/webhooks/{id}` | unregister |
| GET | `/api/admin/webhooks/deliveries` | deliveries |
| POST | `/api/admin/webhooks/deliveries/{deliveryId}/retry` | retryDelivery |

---

## Module: iot

### IoTController (`modules/iot/web/IoTController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/iot/devices` | listDevices |
| GET | `/api/iot/devices/{id}` | getDevice |
| POST | `/api/iot/devices` | createDevice |
| PUT | `/api/iot/devices/{id}` | updateDevice |
| DELETE | `/api/iot/devices/{id}` | deleteDevice |
| POST | `/api/iot/data` | ingestData |
| GET | `/api/iot/devices/{deviceId}/data` | getSensorData |
| GET | `/api/iot/alerts` | listAlerts |
| PATCH | `/api/iot/alerts/{id}/acknowledge` | acknowledgeAlert |
| PATCH | `/api/iot/alerts/{id}/resolve` | resolveAlert |

### IotEquipmentController (`modules/iot/web/IotEquipmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/iot/equipment/devices` | listDevices |
| GET | `/api/iot/equipment/devices/{id}` | getDevice |
| POST | `/api/iot/equipment/devices` | createDevice |
| PUT | `/api/iot/equipment/devices/{id}` | updateDevice |
| DELETE | `/api/iot/equipment/devices/{id}` | deleteDevice |
| POST | `/api/iot/equipment/telemetry/ingest` | ingestTelemetry |
| GET | `/api/iot/equipment/devices/{id}/location` | getDeviceLocation |
| GET | `/api/iot/equipment/devices/{id}/telemetry` | getDeviceTelemetry |
| GET | `/api/iot/equipment/zones` | listZones |
| GET | `/api/iot/equipment/zones/{id}` | getZone |
| POST | `/api/iot/equipment/zones` | createZone |
| PUT | `/api/iot/equipment/zones/{id}` | updateZone |
| DELETE | `/api/iot/equipment/zones/{id}` | deleteZone |
| GET | `/api/iot/equipment/alerts` | listAlerts |
| PATCH | `/api/iot/equipment/alerts/{id}/acknowledge` | acknowledgeAlert |
| GET | `/api/iot/equipment/dashboard` | getDashboard |

---

## Module: isup

### IsupController (`modules/isup/web/IsupController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/integrations/isup/config` | listConfigs |
| GET | `/api/integrations/isup/config/{id}` | getConfig |
| POST | `/api/integrations/isup/config` | createConfig |
| PUT | `/api/integrations/isup/config/{id}` | updateConfig |
| DELETE | `/api/integrations/isup/config/{id}` | deleteConfig |
| POST | `/api/integrations/isup/config/{id}/toggle` | toggleConfig |
| GET | `/api/integrations/isup/mappings` | listMappings |
| GET | `/api/integrations/isup/mappings/{id}` | getMapping |
| POST | `/api/integrations/isup/mappings` | createMapping |
| PUT | `/api/integrations/isup/mappings/{id}` | updateMapping |
| DELETE | `/api/integrations/isup/mappings/{id}` | deleteMapping |
| POST | `/api/integrations/isup/mappings/{id}/toggle-sync` | toggleMappingSync |
| POST | `/api/integrations/isup/transmit/progress/{mappingId}` | transmitProgress |
| POST | `/api/integrations/isup/transmit/documents/{mappingId}` | transmitDocuments |
| POST | `/api/integrations/isup/transmit/photos/{mappingId}` | transmitPhotos |
| GET | `/api/integrations/isup/transmissions` | listTransmissions |
| GET | `/api/integrations/isup/transmissions/{id}` | getTransmission |
| POST | `/api/integrations/isup/transmissions/{id}/process` | processTransmission |
| POST | `/api/integrations/isup/transmissions/{id}/retry` | retryTransmission |
| POST | `/api/integrations/isup/verifications` | receiveVerification |
| GET | `/api/integrations/isup/verifications` | listVerifications |
| GET | `/api/integrations/isup/dashboard` | getDashboard |

---

## Module: journal

### GeneralJournalController (`modules/journal/web/GeneralJournalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/journals` | list |
| GET | `/api/journals/{id}` | getById |
| POST | `/api/journals` | create |
| PUT | `/api/journals/{id}` | update |
| PATCH | `/api/journals/{id}/close` | close |
| DELETE | `/api/journals/{id}` | delete |
| GET | `/api/journals/{journalId}/entries` | listEntries |
| POST | `/api/journals/{journalId}/entries` | addEntry |
| DELETE | `/api/journals/entries/{entryId}` | deleteEntry |

---

## Module: kep

### KepController (`modules/kep/web/KepController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/kep/certificates` | listCertificates |
| GET | `/api/v1/kep/certificates/{id}` | getCertificate |
| GET | `/api/v1/kep/certificates/active` | getActiveCertificates |
| POST | `/api/v1/kep/certificates` | createCertificate |
| PUT | `/api/v1/kep/certificates/{id}` | updateCertificate |
| DELETE | `/api/v1/kep/certificates/{id}` | deleteCertificate |
| POST | `/api/v1/kep/certificates/{id}/revoke` | revokeCertificate |
| POST | `/api/v1/kep/sign` | signDocument |
| GET | `/api/v1/kep/signatures/verify/{signatureId}` | verifySignature |
| GET | `/api/v1/kep/signatures/document` | getDocumentSignatures |
| GET | `/api/v1/kep/signing-requests` | listSigningRequests |
| POST | `/api/v1/kep/signing-requests` | createSigningRequest |
| POST | `/api/v1/kep/signing-requests/{id}/complete` | completeSigningRequest |
| POST | `/api/v1/kep/signing-requests/{id}/reject` | rejectSigningRequest |
| DELETE | `/api/v1/kep/signing-requests/{id}` | deleteSigningRequest |

### MchDController (`modules/kep/web/MchDController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/kep/mchd` | list |
| GET | `/api/kep/mchd/{id}` | getById |
| POST | `/api/kep/mchd` | create |
| PUT | `/api/kep/mchd/{id}` | update |
| POST | `/api/kep/mchd/{id}/revoke` | revoke |
| DELETE | `/api/kep/mchd/{id}` | delete |

---

## Module: leave

### LeaveController (`modules/leave/web/LeaveController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/leave/types` | listLeaveTypes |
| GET | `/api/v1/leave/types/{id}` | getLeaveType |
| POST | `/api/v1/leave/types` | createLeaveType |
| DELETE | `/api/v1/leave/types/{id}` | deleteLeaveType |
| GET | `/api/v1/leave/requests` | listLeaveRequests |
| GET | `/api/v1/leave/requests/{id}` | getLeaveRequest |
| POST | `/api/v1/leave/requests` | createLeaveRequest |
| PUT | `/api/v1/leave/requests/{id}/submit` | submitLeaveRequest |
| PUT | `/api/v1/leave/requests/{id}/approve` | approveLeaveRequest |
| PUT | `/api/v1/leave/requests/{id}/refuse` | refuseLeaveRequest |
| PUT | `/api/v1/leave/requests/{id}/cancel` | cancelLeaveRequest |
| GET | `/api/v1/leave/balances` | listBalances |
| GET | `/api/v1/leave/allocations` | listAllocations |
| GET | `/api/v1/leave/allocations/{id}` | getAllocation |
| GET | `/api/v1/leave/allocations/employee/{employeeId}` | getEmployeeAllocations |
| POST | `/api/v1/leave/allocations` | createAllocation |
| PUT | `/api/v1/leave/allocations/{id}/approve` | approveAllocation |
| PUT | `/api/v1/leave/allocations/{id}/refuse` | refuseAllocation |

---

## Module: legal

### LegalController (`modules/legal/web/LegalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/legal/cases` | listCases |
| GET | `/api/v1/legal/cases/{id}` | getCase |
| POST | `/api/v1/legal/cases` | createCase |
| PUT | `/api/v1/legal/cases/{id}` | updateCase |
| DELETE | `/api/v1/legal/cases/{id}` | deleteCase |
| GET | `/api/v1/legal/cases/upcoming-hearings` | getUpcomingHearings |
| GET | `/api/v1/legal/cases/{caseId}/decisions` | getCaseDecisions |
| POST | `/api/v1/legal/decisions` | createDecision |
| PUT | `/api/v1/legal/decisions/{id}` | updateDecision |
| DELETE | `/api/v1/legal/decisions/{id}` | deleteDecision |
| GET | `/api/v1/legal/cases/{caseId}/remarks` | getCaseRemarks |
| POST | `/api/v1/legal/remarks` | createRemark |
| PUT | `/api/v1/legal/remarks/{id}` | updateRemark |
| DELETE | `/api/v1/legal/remarks/{id}` | deleteRemark |
| GET | `/api/v1/legal/templates` | listTemplates |
| POST | `/api/v1/legal/templates` | createTemplate |
| PUT | `/api/v1/legal/templates/{id}` | updateTemplate |
| DELETE | `/api/v1/legal/templates/{id}` | deleteTemplate |
| GET | `/api/v1/legal/dashboard` | getDashboard |

---

## Module: m29

### M29Controller (`modules/m29/web/M29Controller.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/m29` | list |
| GET | `/api/m29/{id}` | getById |
| POST | `/api/m29` | create |
| PUT | `/api/m29/{id}` | update |
| POST | `/api/m29/{id}/lines` | addLine |
| PUT | `/api/m29/lines/{lineId}` | updateLine |
| DELETE | `/api/m29/lines/{lineId}` | removeLine |
| POST | `/api/m29/{id}/confirm` | confirm |
| POST | `/api/m29/{id}/verify` | verify |
| POST | `/api/m29/{id}/approve` | approve |
| POST | `/api/m29/{id}/post` | post |

---

## Module: maintenance

### MaintenanceController (`modules/maintenance/web/MaintenanceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/maintenance/requests` | listRequests |
| GET | `/api/v1/maintenance/requests/{id}` | getRequest |
| POST | `/api/v1/maintenance/requests` | createRequest |
| PATCH | `/api/v1/maintenance/requests/{id}/status` | updateRequestStatus |
| PATCH | `/api/v1/maintenance/requests/{id}/stage` | updateRequestStage |
| DELETE | `/api/v1/maintenance/requests/{id}` | deleteRequest |
| GET | `/api/v1/maintenance/requests/overdue` | getOverdueRequests |
| GET | `/api/v1/maintenance/equipment` | listEquipment |
| GET | `/api/v1/maintenance/equipment/{id}` | getEquipment |
| POST | `/api/v1/maintenance/equipment` | createEquipment |
| PUT | `/api/v1/maintenance/equipment/{id}` | updateEquipment |
| DELETE | `/api/v1/maintenance/equipment/{id}` | deleteEquipment |
| GET | `/api/v1/maintenance/teams` | listTeams |
| GET | `/api/v1/maintenance/teams/{id}` | getTeam |
| POST | `/api/v1/maintenance/teams` | createTeam |
| PUT | `/api/v1/maintenance/teams/{id}` | updateTeam |
| DELETE | `/api/v1/maintenance/teams/{id}` | deleteTeam |
| GET | `/api/v1/maintenance/stages` | listStages |
| GET | `/api/v1/maintenance/schedules` | listSchedules |
| GET | `/api/v1/maintenance/schedules/{id}` | getSchedule |
| POST | `/api/v1/maintenance/schedules` | createSchedule |
| DELETE | `/api/v1/maintenance/schedules/{id}` | deleteSchedule |
| POST | `/api/v1/maintenance/schedules/process` | processSchedules |
| GET | `/api/v1/maintenance/schedules/upcoming` | getUpcomingPreventive |
| GET | `/api/v1/maintenance/dashboard` | getDashboard |

---

## Module: messaging

### CallSessionController (`modules/messaging/web/CallSessionController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/communication/calls` | createCall |
| GET | `/api/communication/calls` | listCalls |
| GET | `/api/communication/calls/active` | listActive |
| POST | `/api/communication/calls/{id}/join` | joinCall |
| POST | `/api/communication/calls/{id}/leave` | leaveCall |
| POST | `/api/communication/calls/{id}/end` | endCall |
| POST | `/api/communication/calls/{id}/invite-link` | generateInviteLink |
| GET | `/api/communication/calls/by-token/{token}` | getByToken |
| POST | `/api/communication/calls/join-by-link/{token}` | joinByLink |

### MessagingController (`modules/messaging/web/MessagingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/messaging/channels` | getChannels |
| POST | `/api/messaging/channels` | createChannel |
| GET | `/api/messaging/channels/{channelId}/messages` | getChannelMessages |
| POST | `/api/messaging/channels/{channelId}/messages` | sendMessage |
| PATCH | `/api/messaging/messages/{messageId}` | editMessage |
| POST | `/api/messaging/messages/{messageId}/reactions` | addReaction |
| DELETE | `/api/messaging/messages/{messageId}/reactions/{emoji}` | removeReaction |
| POST | `/api/messaging/messages/{messageId}/pin` | pinMessage |
| POST | `/api/messaging/messages/{messageId}/favorite` | addFavorite |
| DELETE | `/api/messaging/messages/{messageId}/favorite` | removeFavorite |
| GET | `/api/messaging/favorites` | getMyFavorites |
| GET | `/api/messaging/search` | searchMessages |
| GET | `/api/messaging/users/{userId}/status` | getUserStatus |
| DELETE | `/api/messaging/messages/{messageId}` | deleteMessage |
| DELETE | `/api/messaging/messages/{messageId}/pin` | unpinMessage |
| GET | `/api/messaging/channels/{channelId}/members` | getChannelMembers |
| POST | `/api/messaging/channels/{channelId}/members` | addMember |
| GET | `/api/messaging/channels/{channelId}/pinned` | getPinnedMessages |
| GET | `/api/messaging/messages/{parentMessageId}/replies` | getThreadReplies |
| PATCH | `/api/messaging/favorites/{messageId}/note` | updateFavoriteNote |
| PATCH | `/api/messaging/me/status` | setMyStatus |
| GET | `/api/messaging/users` | getOrganizationUsers |
| GET | `/api/messaging/messages/{messageId}/reactions` | getMessageReactions |

---

## Module: mobile

### MobileController (`modules/mobile/web/MobileController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/mobile/devices` | registerDevice |
| GET | `/api/mobile/devices` | listDevices |
| PATCH | `/api/mobile/devices/{id}/deactivate` | deactivateDevice |
| POST | `/api/mobile/offline-actions` | submitOfflineAction |
| GET | `/api/mobile/offline-actions/pending` | getPendingActions |
| PATCH | `/api/mobile/offline-actions/{id}/sync` | syncAction |
| POST | `/api/mobile/photos` | createPhoto |
| GET | `/api/mobile/photos/{id}` | getPhoto |
| GET | `/api/mobile/photos` | listPhotos |
| DELETE | `/api/mobile/photos/{id}` | deletePhoto |

### MobileForemanController (`modules/mobile/web/MobileForemanController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/mobile/field-reports` | listFieldReports |
| GET | `/api/mobile/field-reports/{id}` | getFieldReport |
| POST | `/api/mobile/field-reports` | createFieldReport |
| PUT | `/api/mobile/field-reports/{id}` | updateFieldReport |
| PATCH | `/api/mobile/field-reports/{id}/submit` | submitFieldReport |
| POST | `/api/mobile/field-reports/{reportId}/photos` | uploadPhoto |
| GET | `/api/mobile/field-reports/{reportId}/photos` | getPhotosForReport |
| GET | `/api/mobile/sync/status` | getSyncStatus |
| POST | `/api/mobile/sync/trigger` | triggerSync |
| GET | `/api/mobile/tasks` | getMobileTasks |
| PATCH | `/api/mobile/tasks/{id}/complete` | completeTask |

---

## Module: monitoring

### BackupController (`modules/monitoring/web/BackupController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/admin/backups/start` | startBackup |
| GET | `/api/admin/backups/status/{id}` | getStatus |
| GET | `/api/admin/backups/latest` | getLatest |
| GET | `/api/admin/backups/history` | getHistory |

### HealthController (`modules/monitoring/web/HealthController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/health/status` | getLatestStatus |
| POST | `/api/admin/health/check-all` | checkAll |
| POST | `/api/admin/health/check/{component}` | checkComponent |
| GET | `/api/admin/health/history/{component}` | getHistory |

### MetricsController (`modules/monitoring/web/MetricsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/metrics/dashboard` | getDashboard |
| GET | `/api/admin/metrics/by-name` | getByName |
| POST | `/api/admin/metrics` | record |

### SystemEventController (`modules/monitoring/web/SystemEventController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/events` | list |
| GET | `/api/admin/events/recent-errors` | getRecentErrors |
| POST | `/api/admin/events` | logEvent |

---

## Module: monteCarlo

### MonteCarloController (`modules/monteCarlo/web/MonteCarloController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/monte-carlo/simulations` | listSimulations |
| GET | `/api/monte-carlo/simulations/{id}` | getSimulation |
| POST | `/api/monte-carlo/simulations` | createSimulation |
| PUT | `/api/monte-carlo/simulations/{id}` | updateSimulation |
| DELETE | `/api/monte-carlo/simulations/{id}` | deleteSimulation |
| GET | `/api/monte-carlo/simulations/{id}/tasks` | listTasks |
| POST | `/api/monte-carlo/simulations/{id}/tasks` | addTask |
| PUT | `/api/monte-carlo/simulations/{id}/tasks/{taskId}` | updateTask |
| DELETE | `/api/monte-carlo/simulations/{id}/tasks/{taskId}` | deleteTask |
| POST | `/api/monte-carlo/simulations/{id}/run` | runSimulation |
| GET | `/api/monte-carlo/simulations/{id}/results` | getResults |

---

## Module: monthlySchedule

### MonthlyScheduleController (`modules/monthlySchedule/web/MonthlyScheduleController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/monthly-schedules` | list |
| GET | `/api/monthly-schedules/{id}` | getById |
| POST | `/api/monthly-schedules` | create |
| PATCH | `/api/monthly-schedules/{id}/submit` | submit |
| PATCH | `/api/monthly-schedules/{id}/approve` | approve |
| DELETE | `/api/monthly-schedules/{id}` | delete |
| GET | `/api/monthly-schedules/{scheduleId}/lines` | listLines |
| POST | `/api/monthly-schedules/{scheduleId}/lines` | addLine |
| DELETE | `/api/monthly-schedules/lines/{lineId}` | deleteLine |

---

## Module: notification

### BroadcastNotificationController (`modules/notification/web/BroadcastNotificationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/broadcasts` | list |
| POST | `/api/broadcasts` | create |
| DELETE | `/api/broadcasts/{id}` | deactivate |

### NotificationBatchController (`modules/notification/web/NotificationBatchController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/notification-batches` | list |
| GET | `/api/admin/notification-batches/{id}` | getById |
| POST | `/api/admin/notification-batches` | create |
| POST | `/api/admin/notification-batches/{id}/send` | send |
| GET | `/api/admin/notification-batches/{id}/status` | getStatus |
| PUT | `/api/admin/notification-batches/{id}` | update |
| DELETE | `/api/admin/notification-batches/{id}` | delete |

### NotificationController (`modules/notification/web/NotificationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/notifications` | list |
| GET | `/api/notifications/unread-count` | getUnreadCount |
| POST | `/api/notifications` | send |
| PATCH | `/api/notifications/{id}/read` | markRead |
| PATCH | `/api/notifications/mark-all-read` | markAllRead |
| DELETE | `/api/notifications/{id}` | delete |
| DELETE | `/api/notifications/old` | deleteOld |
| DELETE | `/api/notifications/expired` | deleteExpired |

### NotificationPreferenceController (`modules/notification/web/NotificationPreferenceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/notification-preferences` | getPreferences |
| PUT | `/api/notification-preferences` | updatePreference |

---

## Module: ops

### DefectController (`modules/ops/web/DefectController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/defects` | list |
| GET | `/api/defects/dashboard` | dashboard |
| GET | `/api/defects/{id}` | getById |
| POST | `/api/defects` | create |
| PUT | `/api/defects/{id}` | update |
| PATCH | `/api/defects/{id}/transition` | transition |
| DELETE | `/api/defects/{id}` | delete |

### DispatchController (`modules/ops/web/DispatchController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/dispatch/orders` | listOrders |
| GET | `/api/dispatch/orders/{id}` | getOrder |
| POST | `/api/dispatch/orders` | createOrder |
| PUT | `/api/dispatch/orders/{id}` | updateOrder |
| PATCH | `/api/dispatch/orders/{id}/status` | updateStatus |
| DELETE | `/api/dispatch/orders/{id}` | deleteOrder |
| GET | `/api/dispatch/routes` | listRoutes |
| GET | `/api/dispatch/routes/{id}` | getRoute |
| POST | `/api/dispatch/routes` | createRoute |
| PUT | `/api/dispatch/routes/{id}` | updateRoute |
| DELETE | `/api/dispatch/routes/{id}` | deleteRoute |

### WorkOrderController (`modules/ops/web/WorkOrderController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ops/work-orders` | listWorkOrders |
| GET | `/api/ops/work-orders/{id}` | getWorkOrder |
| POST | `/api/ops/work-orders` | createWorkOrder |
| PUT | `/api/ops/work-orders/{id}` | updateWorkOrder |
| POST | `/api/ops/work-orders/{id}/plan` | planWorkOrder |
| POST | `/api/ops/work-orders/{id}/start` | startWorkOrder |
| POST | `/api/ops/work-orders/{id}/hold` | holdWorkOrder |
| POST | `/api/ops/work-orders/{id}/complete` | completeWorkOrder |
| POST | `/api/ops/work-orders/{id}/cancel` | cancelWorkOrder |
| DELETE | `/api/ops/work-orders/{id}` | deleteWorkOrder |
| GET | `/api/ops/work-orders/{workOrderId}/daily-reports` | getDailyReports |
| POST | `/api/ops/daily-reports` | createDailyReport |
| PUT | `/api/ops/daily-reports/{id}` | updateDailyReport |
| DELETE | `/api/ops/daily-reports/{id}` | deleteDailyReport |
| GET | `/api/ops/defects/{id}` | getDefect |
| POST | `/api/ops/defects` | createDefect |
| POST | `/api/ops/defects/{id}/start` | startDefect |
| POST | `/api/ops/defects/{id}/fix` | fixDefect |
| POST | `/api/ops/defects/{id}/verify` | verifyDefect |
| POST | `/api/ops/defects/{id}/close` | closeDefect |
| PUT | `/api/ops/defects/{id}` | updateDefect |
| DELETE | `/api/ops/defects/{id}` | deleteDefect |

---

## Module: organization

### OrganizationController (`modules/organization/web/OrganizationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/organizations` | list |
| GET | `/api/organizations/{id}` | getById |
| POST | `/api/organizations` | create |
| PUT | `/api/organizations/{id}` | update |
| DELETE | `/api/organizations/{id}` | delete |

---

## Module: payroll

### PayrollController (`modules/payroll/web/PayrollController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/payroll` | list |
| GET | `/api/payroll/templates` | listTemplates |
| GET | `/api/payroll/templates/{id}` | getTemplate |
| POST | `/api/payroll/templates` | createTemplate |
| PUT | `/api/payroll/templates/{id}` | updateTemplate |
| DELETE | `/api/payroll/templates/{id}` | deleteTemplate |
| GET | `/api/payroll/calculations` | listCalculations |
| GET | `/api/payroll/calculations/{id}` | getCalculation |
| POST | `/api/payroll/calculate` | calculate |
| POST | `/api/payroll/bulk-calculate` | bulkCalculate |
| POST | `/api/payroll/{id}/approve` | approve |

---

## Module: permission

### FieldAccessController (`modules/permission/web/FieldAccessController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/admin/field-access` | setAccess |
| GET | `/api/admin/field-access/model/{modelName}/field/{fieldName}` | getByModelAndField |
| GET | `/api/admin/field-access/model/{modelName}/group/{groupId}` | getByModelAndGroup |
| GET | `/api/admin/field-access/group/{groupId}` | getByGroup |
| GET | `/api/admin/field-access/check` | checkAccess |
| DELETE | `/api/admin/field-access/{id}` | delete |

### ModelAccessController (`modules/permission/web/ModelAccessController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/admin/model-access` | setAccess |
| GET | `/api/admin/model-access/model/{modelName}` | getByModel |
| GET | `/api/admin/model-access/group/{groupId}` | getByGroup |
| GET | `/api/admin/model-access/model/{modelName}/group/{groupId}` | getAccess |
| GET | `/api/admin/model-access/check` | checkAccess |
| GET | `/api/admin/model-access/models` | getAllModels |
| DELETE | `/api/admin/model-access/{id}` | delete |

### PermissionGroupController (`modules/permission/web/PermissionGroupController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/permission-groups` | list |
| GET | `/api/admin/permission-groups/active` | listActive |
| GET | `/api/admin/permission-groups/{id}` | getById |
| GET | `/api/admin/permission-groups/category/{category}` | getByCategory |
| GET | `/api/admin/permission-groups/{id}/children` | getChildren |
| GET | `/api/admin/permission-groups/{id}/hierarchy` | getHierarchy |
| GET | `/api/admin/permission-groups/search` | search |
| POST | `/api/admin/permission-groups` | create |
| PUT | `/api/admin/permission-groups/{id}` | update |
| DELETE | `/api/admin/permission-groups/{id}` | delete |

### RecordRuleController (`modules/permission/web/RecordRuleController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/admin/record-rules` | create |
| PUT | `/api/admin/record-rules/{id}` | update |
| GET | `/api/admin/record-rules/{id}` | getById |
| GET | `/api/admin/record-rules/model/{modelName}` | getByModel |
| GET | `/api/admin/record-rules/group/{groupId}` | getByGroup |
| GET | `/api/admin/record-rules/applicable` | getApplicable |
| DELETE | `/api/admin/record-rules/{id}` | delete |

### UserGroupController (`modules/permission/web/UserGroupController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/user-groups` | list |
| POST | `/api/admin/user-groups` | assignGroup |
| DELETE | `/api/admin/user-groups/user/{userId}/group/{groupId}` | removeGroup |
| GET | `/api/admin/user-groups/user/{userId}` | getUserGroups |
| GET | `/api/admin/user-groups/group/{groupId}/users` | getGroupUsers |
| GET | `/api/admin/user-groups/group/{groupId}/count` | getGroupMemberCount |
| POST | `/api/admin/user-groups/bulk-assign` | bulkAssign |
| POST | `/api/admin/user-groups/bulk-revoke` | bulkRevoke |
| GET | `/api/admin/user-groups/user/{userId}/permissions/{modelName}` | getUserModelPermissions |

---

## Module: planfact

### PlanFactController (`modules/planfact/web/PlanFactController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/plan-fact/project/{projectId}` | getProjectPlanFact |
| POST | `/api/plan-fact/project/{projectId}/generate` | generateLines |
| PUT | `/api/plan-fact/{lineId}` | updateLine |
| GET | `/api/plan-fact/project/{projectId}/summary` | getProjectSummary |

---

## Module: planning

### EvmAnalyticsController (`modules/planning/web/EvmAnalyticsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/evm-analytics/trend` | getTrend |
| GET | `/api/evm-analytics/eac-methods` | getEacMethods |
| GET | `/api/evm-analytics/wbs-breakdown` | getWbsBreakdown |
| GET | `/api/evm-analytics/confidence-bands` | getConfidenceBands |

### EvmSnapshotController (`modules/planning/web/EvmSnapshotController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/evm-snapshots` | list |
| GET | `/api/evm-snapshots/{id}` | getById |
| GET | `/api/evm-snapshots/latest` | getLatest |
| GET | `/api/evm-snapshots/indicators` | getIndicators |
| GET | `/api/evm-snapshots/range` | getByDateRange |
| POST | `/api/evm-snapshots` | create |
| DELETE | `/api/evm-snapshots/{id}` | delete |

### MobilizationController (`modules/planning/web/MobilizationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/mobilization-schedules` | list |
| GET | `/api/mobilization-schedules/{id}/lines` | getLines |
| POST | `/api/mobilization-schedules/generate` | generate |
| POST | `/api/mobilization-schedules/{id}/lines` | addLine |

### MultiProjectAllocationController (`modules/planning/web/MultiProjectAllocationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/planning/multi-project-allocation` | list |
| GET | `/api/planning/multi-project-allocation/paged` | listPaged |
| POST | `/api/planning/multi-project-allocation` | create |
| PUT | `/api/planning/multi-project-allocation/{id}` | update |
| DELETE | `/api/planning/multi-project-allocation/{id}` | delete |
| GET | `/api/planning/multi-project-allocation/conflicts` | detectConflicts |
| GET | `/api/planning/multi-project-allocation/suggestions` | getSuggestions |

### ResourceAllocationController (`modules/planning/web/ResourceAllocationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/resource-allocations` | list |
| GET | `/api/resource-allocations/all` | listAll |
| GET | `/api/resource-allocations/{id}` | getById |
| POST | `/api/resource-allocations` | create |
| DELETE | `/api/resource-allocations/{id}` | delete |

### ScheduleBaselineController (`modules/planning/web/ScheduleBaselineController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/schedule-baselines` | list |
| GET | `/api/schedule-baselines/{id}` | getById |
| POST | `/api/schedule-baselines` | create |
| DELETE | `/api/schedule-baselines/{id}` | delete |

### SkillsMatchingController (`modules/planning/web/SkillsMatchingController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/planning/skills-matching/skills` | addSkill |
| GET | `/api/planning/skills-matching/skills/{employeeId}` | getSkills |
| DELETE | `/api/planning/skills-matching/skills/{skillId}` | removeSkill |
| POST | `/api/planning/skills-matching/requirements` | addRequirement |
| GET | `/api/planning/skills-matching/requirements/{projectId}` | getRequirements |
| DELETE | `/api/planning/skills-matching/requirements/{requirementId}` | removeRequirement |
| GET | `/api/planning/skills-matching/suggest/{projectId}` | suggestCandidates |
| GET | `/api/planning/skills-matching/compliance/{employeeId}/{projectId}` | checkCompliance |
| POST | `/api/planning/skills-matching/scenarios` | runScenario |
| GET | `/api/planning/skills-matching/scenarios` | listScenarios |

### WbsDependencyController (`modules/planning/web/WbsDependencyController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/wbs-dependencies` | findByNode |
| GET | `/api/wbs-dependencies/project` | findByProject |
| GET | `/api/wbs-dependencies/{nodeId}/predecessors` | getPredecessors |
| GET | `/api/wbs-dependencies/{nodeId}/successors` | getSuccessors |
| POST | `/api/wbs-dependencies` | create |
| DELETE | `/api/wbs-dependencies/{id}` | delete |

### WbsNodeController (`modules/planning/web/WbsNodeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/wbs-nodes` | list |
| GET | `/api/wbs-nodes/{id}` | getById |
| GET | `/api/wbs-nodes/tree` | getTree |
| GET | `/api/wbs-nodes/{parentId}/children` | getChildren |
| GET | `/api/wbs-nodes/critical-path` | getCriticalPath |
| POST | `/api/wbs-nodes` | create |
| PUT | `/api/wbs-nodes/{id}` | update |
| DELETE | `/api/wbs-nodes/{id}` | delete |
| POST | `/api/wbs-nodes/cpm/forward-pass` | forwardPass |
| POST | `/api/wbs-nodes/cpm/backward-pass` | backwardPass |

### WorkVolumeController (`modules/planning/web/WorkVolumeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/work-volumes` | list |
| GET | `/api/work-volumes/{id}` | getById |
| GET | `/api/work-volumes/by-date` | getByDate |
| GET | `/api/work-volumes/summary` | getSummary |
| POST | `/api/work-volumes` | create |
| PUT | `/api/work-volumes/{id}` | update |
| DELETE | `/api/work-volumes/{id}` | delete |

---

## Module: pmWorkflow

### IssueController (`modules/pmWorkflow/web/IssueController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pm/issues` | list |
| GET | `/api/pm/issues/{id}` | getById |
| POST | `/api/pm/issues` | create |
| PUT | `/api/pm/issues/{id}` | update |
| PATCH | `/api/pm/issues/{id}/status` | changeStatus |
| DELETE | `/api/pm/issues/{id}` | delete |
| GET | `/api/pm/issues/{issueId}/comments` | listComments |
| POST | `/api/pm/issues/{issueId}/comments` | addComment |
| GET | `/api/pm/issues/overdue` | findOverdue |

### PmSubmittalController (`modules/pmWorkflow/web/PmSubmittalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pm/submittals` | list |
| GET | `/api/pm/submittals/{id}` | getById |
| POST | `/api/pm/submittals` | create |
| PUT | `/api/pm/submittals/{id}` | update |
| PATCH | `/api/pm/submittals/{id}/status` | changeStatus |
| DELETE | `/api/pm/submittals/{id}` | delete |
| GET | `/api/pm/submittals/ball-in-court/{userId}` | findByBallInCourt |
| GET | `/api/pm/submittals/overdue` | findOverdue |
| GET | `/api/pm/submittals/packages` | listPackages |
| POST | `/api/pm/submittals/packages` | createPackage |
| DELETE | `/api/pm/submittals/packages/{id}` | deletePackage |
| GET | `/api/pm/submittals/{submittalId}/reviews` | listReviews |
| POST | `/api/pm/submittals/{submittalId}/reviews` | addReview |

### RfiController (`modules/pmWorkflow/web/RfiController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pm/rfis` | list |
| GET | `/api/pm/rfis/{id}` | getById |
| POST | `/api/pm/rfis` | create |
| PUT | `/api/pm/rfis/{id}` | update |
| PATCH | `/api/pm/rfis/{id}/status` | changeStatus |
| DELETE | `/api/pm/rfis/{id}` | delete |
| GET | `/api/pm/rfis/{rfiId}/responses` | listResponses |
| POST | `/api/pm/rfis/{rfiId}/responses` | addResponse |
| GET | `/api/pm/rfis/overdue` | findOverdue |

---

## Module: portal

### ClientClaimController (`modules/portal/web/ClientClaimController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/portal/claims` | create |
| GET | `/api/portal/claims/{id}` | getById |
| GET | `/api/portal/claims` | list |
| PUT | `/api/portal/claims/{id}/triage` | triage |
| PUT | `/api/portal/claims/{id}/assign` | assign |
| PUT | `/api/portal/claims/{id}/start-work` | startWork |
| PUT | `/api/portal/claims/{id}/resolve` | resolve |
| PUT | `/api/portal/claims/{id}/feedback` | feedback |
| PUT | `/api/portal/claims/{id}/reject` | reject |
| POST | `/api/portal/claims/{id}/comments` | addComment |
| GET | `/api/portal/claims/dashboard` | dashboard |
| GET | `/api/portal/claims/my-claims` | myClaims |

### ClientPortalEnhancedController (`modules/portal/web/ClientPortalEnhancedController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portal/client/dashboard` | getDashboard |
| GET | `/api/portal/client/progress` | getProgressSnapshots |
| POST | `/api/portal/client/progress` | createProgressSnapshot |
| PATCH | `/api/portal/client/progress/{id}/publish` | publishSnapshot |
| GET | `/api/portal/client/signatures` | getPendingSignatures |
| POST | `/api/portal/client/signatures` | requestSignature |
| PATCH | `/api/portal/client/signatures/{id}/sign` | signDocument |
| PATCH | `/api/portal/client/signatures/{id}/reject` | rejectDocument |
| GET | `/api/portal/client/milestones` | getMilestones |
| POST | `/api/portal/client/milestones` | createMilestone |
| PUT | `/api/portal/client/milestones/{id}` | updateMilestone |

### PortalAdminController (`modules/portal/web/PortalAdminController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/portal/users` | listUsers |
| GET | `/api/admin/portal/users/{id}` | getUser |
| PATCH | `/api/admin/portal/users/{id}/status` | updateStatus |
| POST | `/api/admin/portal/access` | grantAccess |
| DELETE | `/api/admin/portal/access/{portalUserId}/{projectId}` | revokeAccess |

### PortalAuthController (`modules/portal/web/PortalAuthController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/portal/auth/register` | register |
| POST | `/api/portal/auth/login` | login |
| POST | `/api/portal/auth/forgot-password` | forgotPassword |
| POST | `/api/portal/auth/reset-password` | resetPassword |

### PortalDataProxyController (`modules/portal/web/PortalDataProxyController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portal/contracts` | getContracts |
| GET | `/api/portal/invoices` | getInvoices |
| POST | `/api/portal/invoices` | createInvoice |
| POST | `/api/portal/invoices/{id}/submit` | submitInvoice |
| DELETE | `/api/portal/invoices/{id}` | deleteInvoice |
| GET | `/api/portal/schedule` | getSchedule |
| GET | `/api/portal/rfis` | getRfis |
| GET | `/api/portal/rfis/{id}` | getRfi |
| POST | `/api/portal/rfis` | createRfi |
| GET | `/api/portal/rfis/{rfiId}/responses` | getRfiResponses |
| POST | `/api/portal/rfis/{rfiId}/responses` | addRfiResponse |
| GET | `/api/portal/photos` | getPhotos |
| POST | `/api/portal/photos` | uploadPhoto |
| DELETE | `/api/portal/photos/{id}` | deletePhoto |
| GET | `/api/portal/daily-reports` | getDailyReports |
| POST | `/api/portal/daily-reports` | createDailyReport |
| POST | `/api/portal/daily-reports/{id}/submit` | submitDailyReport |
| POST | `/api/portal/daily-reports/{id}/review` | reviewDailyReport |
| DELETE | `/api/portal/daily-reports/{id}` | deleteDailyReport |
| GET | `/api/portal/proposals/{id}` | getProposal |
| POST | `/api/portal/proposals/{id}/decision` | decideProposal |

### PortalDocumentController (`modules/portal/web/PortalDocumentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portal/documents` | listDocuments |
| POST | `/api/portal/documents/{documentId}/download` | downloadDocument |
| POST | `/api/portal/documents/share` | shareDocument |

### PortalKs2DraftController (`modules/portal/web/PortalKs2DraftController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portal/ks2-drafts` | getMyDrafts |
| GET | `/api/portal/ks2-drafts/review` | getDraftsForReview |
| GET | `/api/portal/ks2-drafts/{id}` | getById |
| POST | `/api/portal/ks2-drafts` | create |
| PUT | `/api/portal/ks2-drafts/{id}` | update |
| POST | `/api/portal/ks2-drafts/{id}/submit` | submit |
| POST | `/api/portal/ks2-drafts/{id}/review` | review |
| DELETE | `/api/portal/ks2-drafts/{id}` | delete |

### PortalMessageController (`modules/portal/web/PortalMessageController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/portal/messages` | send |
| GET | `/api/portal/messages/inbox` | getInbox |
| GET | `/api/portal/messages/outbox` | getOutbox |
| PATCH | `/api/portal/messages/{id}/read` | markRead |
| GET | `/api/portal/messages/{id}/thread` | getThread |

### PortalProjectController (`modules/portal/web/PortalProjectController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portal/projects` | listProjects |
| GET | `/api/portal/projects/{projectId}` | getProjectDetails |
| GET | `/api/portal/projects/{projectId}/documents` | getProjectDocuments |

### PortalTaskController (`modules/portal/web/PortalTaskController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portal/tasks` | getMyTasks |
| GET | `/api/portal/tasks/project/{projectId}` | getProjectTasks |
| GET | `/api/portal/tasks/{id}` | getById |
| POST | `/api/portal/tasks` | create |
| PATCH | `/api/portal/tasks/{id}/status` | updateStatus |
| DELETE | `/api/portal/tasks/{id}` | delete |

---

## Module: portfolio

### PortfolioController (`modules/portfolio/web/PortfolioController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/portfolio` | list |
| GET | `/api/portfolio/opportunities` | listOpportunities |
| GET | `/api/portfolio/opportunities/{id}` | getOpportunity |
| GET | `/api/portfolio/opportunities/{id}/activities` | getOpportunityActivities |
| POST | `/api/portfolio/opportunities` | createOpportunity |
| PUT | `/api/portfolio/opportunities/{id}` | updateOpportunity |
| PATCH | `/api/portfolio/opportunities/{id}/stage` | changeStage |
| DELETE | `/api/portfolio/opportunities/{id}` | deleteOpportunity |
| GET | `/api/portfolio/dashboard` | getDashboard |
| GET | `/api/portfolio/bid-packages` | listBidPackages |
| GET | `/api/portfolio/bid-packages/{id}` | getBidPackage |
| POST | `/api/portfolio/bid-packages` | createBidPackage |
| PUT | `/api/portfolio/bid-packages/{id}` | updateBidPackage |
| DELETE | `/api/portfolio/bid-packages/{id}` | deleteBidPackage |
| GET | `/api/portfolio/prequalifications` | listPrequalifications |
| GET | `/api/portfolio/prequalifications/{id}` | getPrequalification |
| POST | `/api/portfolio/prequalifications` | createPrequalification |
| PUT | `/api/portfolio/prequalifications/{id}` | updatePrequalification |
| DELETE | `/api/portfolio/prequalifications/{id}` | deletePrequalification |
| GET | `/api/portfolio/tender-submissions` | listTenderSubmissions |
| GET | `/api/portfolio/tender-submissions/{id}` | getTenderSubmission |
| POST | `/api/portfolio/tender-submissions` | createTenderSubmission |
| DELETE | `/api/portfolio/tender-submissions/{id}` | deleteTenderSubmission |
| PATCH | `/api/portfolio/opportunities/{id}/checklist` | updateGoNoGoChecklist |
| GET | `/api/portfolio/opportunities/{id}/analog-assessment` | getAnalogAssessment |

---

## Module: prequalification

### PrequalificationController (`modules/prequalification/web/PrequalificationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/prequalifications` | list |
| GET | `/api/prequalifications/{id}` | getById |
| POST | `/api/prequalifications` | create |
| POST | `/api/prequalifications/{id}/evaluate` | evaluate |

### SroVerificationController (`modules/prequalification/web/SroVerificationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/sro/verify/{inn}` | verify |
| POST | `/api/sro/verify/{inn}/refresh` | forceRefresh |
| GET | `/api/sro/history` | getHistory |
| GET | `/api/sro/history/{inn}` | getHistoryByInn |

---

## Module: priceCoefficient

### PriceCoefficientController (`modules/priceCoefficient/web/PriceCoefficientController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/price-coefficients` | list |
| GET | `/api/price-coefficients/{id}` | getById |
| POST | `/api/price-coefficients` | create |
| PUT | `/api/price-coefficients/{id}` | update |
| POST | `/api/price-coefficients/{id}/activate` | activate |
| POST | `/api/price-coefficients/{id}/expire` | expire |
| DELETE | `/api/price-coefficients/{id}` | delete |
| GET | `/api/price-coefficients/by-contract/{contractId}` | getByContract |
| GET | `/api/price-coefficients/by-project/{projectId}/active` | getActiveByProject |
| POST | `/api/price-coefficients/calculate` | calculatePrice |

---

## Module: procurement

### ProcurementDirectoryController (`modules/procurement/web/ProcurementDirectoryController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/procurement/suppliers` | suppliers |
| POST | `/api/procurement/price-requests` | sendPriceRequests |

### PurchaseOrderController (`modules/procurement/web/PurchaseOrderController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/purchase-orders` | create |
| POST | `/api/purchase-orders/from-request/{purchaseRequestId}` | createFromRequest |
| PUT | `/api/purchase-orders/{id}` | update |
| POST | `/api/purchase-orders/{id}/approve` | approve |
| POST | `/api/purchase-orders/{id}/send` | markSent |
| POST | `/api/purchase-orders/{id}/deliver` | recordDelivery |
| POST | `/api/purchase-orders/{id}/cancel` | cancel |
| GET | `/api/purchase-orders/{id}` | getById |
| GET | `/api/purchase-orders/by-project/{projectId}` | getByProject |
| GET | `/api/purchase-orders/by-request/{purchaseRequestId}` | getByPurchaseRequest |

### PurchaseRequestController (`modules/procurement/web/PurchaseRequestController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/purchase-requests` | list |
| GET | `/api/purchase-requests/counters` | counters |
| GET | `/api/purchase-requests/{id}` | getById |
| POST | `/api/purchase-requests` | create |
| PUT | `/api/purchase-requests/{id}` | update |
| POST | `/api/purchase-requests/{id}/items` | addItem |
| PUT | `/api/purchase-requests/items/{itemId}` | updateItem |
| DELETE | `/api/purchase-requests/items/{itemId}` | removeItem |
| POST | `/api/purchase-requests/{id}/submit` | submit |
| POST | `/api/purchase-requests/{id}/approve` | approve |
| POST | `/api/purchase-requests/{id}/reject` | reject |
| POST | `/api/purchase-requests/{id}/assign` | assign |
| POST | `/api/purchase-requests/{id}/ordered` | markOrdered |
| POST | `/api/purchase-requests/{id}/delivered` | markDelivered |
| POST | `/api/purchase-requests/{id}/close` | close |
| POST | `/api/purchase-requests/{id}/cancel` | cancel |
| GET | `/api/purchase-requests` | getDashboard |

---

## Module: procurementExt

### DeliveryController (`modules/procurementExt/web/DeliveryController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/deliveries` | list |
| GET | `/api/deliveries/{id}` | getById |
| POST | `/api/deliveries` | create |
| PUT | `/api/deliveries/{id}` | update |
| DELETE | `/api/deliveries/{id}` | delete |
| POST | `/api/deliveries/{id}/items` | addItem |
| POST | `/api/deliveries/{id}/loading` | startLoading |
| POST | `/api/deliveries/{id}/depart` | depart |
| POST | `/api/deliveries/{id}/deliver` | deliver |
| POST | `/api/deliveries/{id}/cancel` | cancel |

### DispatchController (`modules/procurementExt/web/DispatchController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/procurement-ext/dispatch-orders/{id}` | getDispatchOrder |
| POST | `/api/procurement-ext/dispatch-orders` | createDispatchOrder |
| PUT | `/api/procurement-ext/dispatch-orders/{id}` | updateDispatchOrder |
| DELETE | `/api/procurement-ext/dispatch-orders/{id}` | deleteDispatchOrder |
| POST | `/api/procurement-ext/dispatch-orders/{id}/dispatch` | dispatch |
| POST | `/api/procurement-ext/dispatch-orders/{id}/in-transit` | markInTransit |
| POST | `/api/procurement-ext/dispatch-orders/{id}/deliver` | deliverDispatch |
| POST | `/api/procurement-ext/dispatch-orders/{id}/cancel` | cancelDispatch |
| GET | `/api/procurement-ext/supplier-ratings/{supplierId}` | getSupplierRatings |
| POST | `/api/procurement-ext/supplier-ratings` | createRating |
| PUT | `/api/procurement-ext/supplier-ratings/{id}` | updateRating |
| DELETE | `/api/procurement-ext/supplier-ratings/{id}` | deleteRating |
| POST | `/api/procurement-ext/reservations/{id}/release` | releaseReservation |

### PurchaseOrderController (`modules/procurementExt/web/PurchaseOrderController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/procurement/purchase-orders` | list |
| GET | `/api/procurement/purchase-orders/{id}` | getById |
| GET | `/api/procurement/purchase-orders/{id}/items` | getItems |
| POST | `/api/procurement/purchase-orders` | create |
| POST | `/api/procurement/purchase-orders/with-items` | createWithItems |
| PUT | `/api/procurement/purchase-orders/{id}` | update |
| POST | `/api/procurement/purchase-orders/{id}/items` | addItem |
| PUT | `/api/procurement/purchase-orders/{id}/items/{itemId}` | updateItem |
| DELETE | `/api/procurement/purchase-orders/{id}/items/{itemId}` | deleteItem |
| POST | `/api/procurement/purchase-orders/{id}/send` | send |
| POST | `/api/procurement/purchase-orders/{id}/confirm` | confirm |
| POST | `/api/procurement/purchase-orders/{id}/delivery` | registerDelivery |
| POST | `/api/procurement/purchase-orders/{id}/cancel` | cancel |
| POST | `/api/procurement/purchase-orders/{id}/close` | close |
| POST | `/api/procurement/purchase-orders/{id}/invoice` | invoice |
| POST | `/api/procurement/purchase-orders/bulk-transition` | bulkTransition |
| DELETE | `/api/procurement/purchase-orders/{id}` | delete |

---

## Module: project

### ProjectController (`modules/project/web/ProjectController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/projects` | list |
| GET | `/api/projects/{id}` | getById |
| POST | `/api/projects` | create |
| PUT | `/api/projects/{id}` | update |
| PATCH | `/api/projects/{id}/status` | updateStatus |
| DELETE | `/api/projects/{id}` | delete |
| GET | `/api/projects/{id}/members` | getMembers |
| POST | `/api/projects/{id}/members` | addMember |
| DELETE | `/api/projects/{id}/members/{memberId}` | removeMember |
| GET | `/api/projects/{id}/financials` | getFinancials |
| GET | `/api/projects/dashboard/summary` | getDashboard |

### ProjectMilestoneController (`modules/project/web/ProjectMilestoneController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/projects/{projectId}/milestones` | list |
| POST | `/api/projects/{projectId}/milestones` | create |
| PUT | `/api/projects/{projectId}/milestones/{id}` | update |
| DELETE | `/api/projects/{projectId}/milestones/{id}` | delete |

---

## Module: pto

### HiddenWorkActController (`modules/pto/web/HiddenWorkActController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/hidden-work-acts` | list |
| GET | `/api/hidden-work-acts/{id}` | getById |
| POST | `/api/hidden-work-acts` | create |
| PATCH | `/api/hidden-work-acts/{id}/status` | updateStatus |
| DELETE | `/api/hidden-work-acts/{id}` | delete |

### Ks11AcceptanceActController (`modules/pto/web/Ks11AcceptanceActController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ks11-acceptance-acts` | list |
| GET | `/api/ks11-acceptance-acts/{id}` | getById |
| POST | `/api/ks11-acceptance-acts` | create |
| PATCH | `/api/ks11-acceptance-acts/{id}/status` | updateStatus |
| DELETE | `/api/ks11-acceptance-acts/{id}` | delete |

### Ks6JournalController (`modules/pto/web/Ks6JournalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ks6-journals` | list |
| GET | `/api/ks6-journals/{id}` | getById |
| POST | `/api/ks6-journals` | create |
| PATCH | `/api/ks6-journals/{id}/activate` | activate |
| PATCH | `/api/ks6-journals/{id}/close` | close |
| DELETE | `/api/ks6-journals/{id}` | delete |
| GET | `/api/ks6-journals/{ks6JournalId}/records` | listRecords |
| POST | `/api/ks6-journals/{ks6JournalId}/records` | addRecord |
| DELETE | `/api/ks6-journals/records/{recordId}` | deleteRecord |

### PtoDocumentController (`modules/pto/web/PtoDocumentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pto/documents` | list |
| GET | `/api/pto/documents/{id}` | getById |
| POST | `/api/pto/documents` | create |
| PUT | `/api/pto/documents/{id}` | update |
| PATCH | `/api/pto/documents/{id}/status` | changeStatus |
| DELETE | `/api/pto/documents/{id}` | delete |

### PtoGeneralController (`modules/pto/web/PtoGeneralController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pto/dashboard/{projectId}` | getDashboard |
| GET | `/api/pto/acts` | listActs |
| GET | `/api/pto/acts/{id}` | getAct |
| POST | `/api/pto/acts` | createAct |
| PATCH | `/api/pto/acts/{id}/status` | changeActStatus |
| GET | `/api/pto/lab-tests` | listLabTests |
| GET | `/api/pto/lab-tests/{id}` | getLabTest |
| POST | `/api/pto/lab-tests` | createLabTest |
| DELETE | `/api/pto/lab-tests/{id}` | deleteLabTest |
| GET | `/api/pto/certificates` | listCertificates |
| GET | `/api/pto/certificates/{id}` | getCertificate |
| POST | `/api/pto/certificates` | createCertificate |
| PATCH | `/api/pto/certificates/{id}/invalidate` | invalidateCertificate |
| DELETE | `/api/pto/certificates/{id}` | deleteCertificate |

### SubmittalController (`modules/pto/web/SubmittalController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pto/submittals` | list |
| GET | `/api/pto/submittals/{id}` | getById |
| POST | `/api/pto/submittals` | create |
| PATCH | `/api/pto/submittals/{id}/status` | changeStatus |
| GET | `/api/pto/submittals/{id}/comments` | getComments |
| POST | `/api/pto/submittals/{id}/comments` | addComment |
| DELETE | `/api/pto/submittals/{id}` | delete |

### WorkPermitController (`modules/pto/web/WorkPermitController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/pto/work-permits` | list |
| GET | `/api/pto/work-permits/{id}` | getById |
| POST | `/api/pto/work-permits` | create |
| PATCH | `/api/pto/work-permits/{id}/status` | changeStatus |
| DELETE | `/api/pto/work-permits/{id}` | delete |

---

## Module: punchlist

### PunchListController (`modules/punchlist/web/PunchListController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/punchlist` | list |
| GET | `/api/punchlist/{id}` | getById |
| POST | `/api/punchlist` | create |
| PUT | `/api/punchlist/{id}` | update |
| DELETE | `/api/punchlist/{id}` | delete |
| PATCH | `/api/punchlist/{id}/complete` | complete |
| GET | `/api/punchlist/{punchListId}/items` | getItems |
| POST | `/api/punchlist/{punchListId}/items` | addItem |
| PATCH | `/api/punchlist/items/{itemId}/fix` | fixItem |
| PATCH | `/api/punchlist/items/{itemId}/verify` | verifyItem |
| PATCH | `/api/punchlist/items/{itemId}/close` | closeItem |
| DELETE | `/api/punchlist/items/{itemId}` | deleteItem |
| GET | `/api/punchlist/items/{itemId}/comments` | getComments |
| POST | `/api/punchlist/items/{itemId}/comments` | addComment |

---

## Module: quality

### ChecklistTemplateController (`modules/quality/web/ChecklistTemplateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/checklist-templates` | list |
| POST | `/api/quality/checklist-templates` | create |
| PUT | `/api/quality/checklist-templates/{id}` | update |

### DefectRegisterController (`modules/quality/web/DefectRegisterController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/defect-register` | listDefectRegister |
| GET | `/api/quality/defect-statistics` | getDefectStatistics |

### MaterialInspectionController (`modules/quality/web/MaterialInspectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/material-inspections` | list |
| POST | `/api/quality/material-inspections` | create |

### NonConformanceController (`modules/quality/web/NonConformanceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/non-conformances` | list |
| GET | `/api/quality/non-conformances/{id}` | getById |
| POST | `/api/quality/non-conformances` | create |
| PUT | `/api/quality/non-conformances/{id}` | update |
| PATCH | `/api/quality/non-conformances/{id}/close` | close |
| DELETE | `/api/quality/non-conformances/{id}` | delete |

### QualityCertificateController (`modules/quality/web/QualityCertificateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/certificates` | list |
| GET | `/api/quality/certificates/{id}` | getById |
| POST | `/api/quality/certificates` | create |
| PUT | `/api/quality/certificates/{id}` | update |
| PATCH | `/api/quality/certificates/{id}/verify` | verify |
| GET | `/api/quality/certificates/expired` | getExpired |
| GET | `/api/quality/certificates/expiring` | getExpiring |
| DELETE | `/api/quality/certificates/{id}` | delete |

### QualityCheckController (`modules/quality/web/QualityCheckController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/checks` | list |
| GET | `/api/quality/checks/{id}` | getById |
| POST | `/api/quality/checks` | create |
| PUT | `/api/quality/checks/{id}` | update |
| PATCH | `/api/quality/checks/{id}/start` | start |
| PATCH | `/api/quality/checks/{id}/complete` | complete |
| DELETE | `/api/quality/checks/{id}` | delete |

### QualityChecklistController (`modules/quality/web/QualityChecklistController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/checklists` | list |
| GET | `/api/quality/checklists/{id}` | getById |
| GET | `/api/quality/checklists/{id}/items` | getItems |
| POST | `/api/quality/checklists` | create |
| PUT | `/api/quality/checklists/{checklistId}/items/{itemId}` | updateItem |
| PATCH | `/api/quality/checklists/{id}/complete` | complete |
| DELETE | `/api/quality/checklists/{id}` | delete |

### QualityGateController (`modules/quality/web/QualityGateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/gates/project/{projectId}` | listByProject |
| GET | `/api/quality/gates/{id}` | getById |
| POST | `/api/quality/gates/evaluate/{id}` | evaluate |
| POST | `/api/quality/gates/evaluate/project/{projectId}` | evaluateAllForProject |
| POST | `/api/quality/gates/apply-template` | applyTemplate |
| POST | `/api/quality/gates` | create |
| PUT | `/api/quality/gates/{id}` | update |
| DELETE | `/api/quality/gates/{id}` | delete |
| GET | `/api/quality/gates/check-progression/{wbsNodeId}` | checkProgression |
| GET | `/api/quality/gates/templates` | listTemplates |

### SupervisionEntryController (`modules/quality/web/SupervisionEntryController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/quality/supervision-entries` | list |
| POST | `/api/quality/supervision-entries` | create |

---

## Module: recruitment

### RecruitmentController (`modules/recruitment/web/RecruitmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/v1/recruitment/applicants` | listApplicants |
| GET | `/api/v1/recruitment/applicants/{id}` | getApplicant |
| POST | `/api/v1/recruitment/applicants` | createApplicant |
| PUT | `/api/v1/recruitment/applicants/{id}/stage` | updateApplicantStage |
| PUT | `/api/v1/recruitment/applicants/{id}/status` | updateApplicantStatus |
| DELETE | `/api/v1/recruitment/applicants/{id}` | deleteApplicant |
| GET | `/api/v1/recruitment/vacancies` | listVacancies |
| GET | `/api/v1/recruitment/jobs` | listJobPositions |
| GET | `/api/v1/recruitment/jobs/{id}` | getJobPosition |
| POST | `/api/v1/recruitment/jobs` | createJobPosition |
| PUT | `/api/v1/recruitment/jobs/{id}/status` | updateJobPositionStatus |
| DELETE | `/api/v1/recruitment/jobs/{id}` | deleteJobPosition |
| GET | `/api/v1/recruitment/stages` | listStages |
| GET | `/api/v1/recruitment/interviews` | listInterviews |
| GET | `/api/v1/recruitment/interviews/{id}` | getInterview |
| POST | `/api/v1/recruitment/interviews` | scheduleInterview |
| PUT | `/api/v1/recruitment/interviews/{id}/result` | updateInterviewResult |
| DELETE | `/api/v1/recruitment/interviews/{id}` | deleteInterview |

---

## Module: regulatory

### ConstructionPermitController (`modules/regulatory/web/ConstructionPermitController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/regulatory/permits` | list |
| GET | `/api/regulatory/permits/{id}` | getById |
| POST | `/api/regulatory/permits` | create |
| PUT | `/api/regulatory/permits/{id}` | update |
| DELETE | `/api/regulatory/permits/{id}` | delete |
| PATCH | `/api/regulatory/permits/{id}/suspend` | suspend |
| PATCH | `/api/regulatory/permits/{id}/revoke` | revoke |

### PrescriptionController (`modules/regulatory/web/PrescriptionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/regulatory/prescriptions` | list |
| GET | `/api/regulatory/prescriptions/{id}` | getById |
| POST | `/api/regulatory/prescriptions` | create |
| PUT | `/api/regulatory/prescriptions/{id}` | update |
| PATCH | `/api/regulatory/prescriptions/{id}/status` | changeStatus |
| PATCH | `/api/regulatory/prescriptions/{id}/appeal` | fileAppeal |
| DELETE | `/api/regulatory/prescriptions/{id}` | delete |
| GET | `/api/regulatory/prescriptions/dashboard` | getDashboard |

### RegulatoryInspectionController (`modules/regulatory/web/RegulatoryInspectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/regulatory/inspections` | list |
| GET | `/api/regulatory/inspections/{id}` | getById |
| POST | `/api/regulatory/inspections` | create |
| PUT | `/api/regulatory/inspections/{id}` | update |
| DELETE | `/api/regulatory/inspections/{id}` | delete |
| GET | `/api/regulatory/inspections/{inspectionId}/prescriptions` | getPrescriptions |
| POST | `/api/regulatory/inspections/{inspectionId}/prescriptions` | addPrescription |
| PATCH | `/api/regulatory/inspections/prescriptions/{id}/complete` | completePrescription |
| GET | `/api/regulatory/inspections/prescriptions/overdue` | getOverdue |

### RegulatoryReportController (`modules/regulatory/web/RegulatoryReportController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/regulatory/reports` | list |
| GET | `/api/regulatory/reports/{id}` | getById |
| POST | `/api/regulatory/reports` | create |
| PUT | `/api/regulatory/reports/{id}` | update |
| PATCH | `/api/regulatory/reports/{id}/submit` | submit |
| PATCH | `/api/regulatory/reports/{id}/accept` | accept |
| PATCH | `/api/regulatory/reports/{id}/reject` | reject |
| DELETE | `/api/regulatory/reports/{id}` | delete |

---

## Module: report

### ExportController (`modules/report/web/ExportController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/export/ks2/{id}/data` | getKs2ExportData |
| GET | `/api/export/estimate/{id}/data` | getEstimateExportData |
| GET | `/api/export/invoice/{id}/data` | getInvoiceExportData |

### ReportTemplateController (`modules/report/web/ReportTemplateController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/report-templates/templates` | createTemplate |
| GET | `/api/report-templates/templates` | listTemplates |
| GET | `/api/report-templates/templates/{code}` | getTemplate |
| PUT | `/api/report-templates/templates/{code}` | updateTemplate |
| DELETE | `/api/report-templates/templates/{code}` | deleteTemplate |
| POST | `/api/report-templates/generate` | generate |
| GET | `/api/report-templates/generated` | listGenerated |
| GET | `/api/report-templates/print-forms` | listPrintForms |

---

## Module: revenueRecognition

### CompletionPercentageController (`modules/revenueRecognition/web/CompletionPercentageController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/completion-percentages` | list |
| GET | `/api/completion-percentages/{id}` | getById |
| GET | `/api/completion-percentages/latest` | getLatest |
| POST | `/api/completion-percentages` | create |
| DELETE | `/api/completion-percentages/{id}` | delete |

### RevenueAdjustmentController (`modules/revenueRecognition/web/RevenueAdjustmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/revenue-adjustments` | list |
| GET | `/api/revenue-adjustments/{id}` | getById |
| POST | `/api/revenue-adjustments` | create |
| POST | `/api/revenue-adjustments/{id}/approve` | approve |
| DELETE | `/api/revenue-adjustments/{id}` | delete |

### RevenueContractController (`modules/revenueRecognition/web/RevenueContractController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/revenue-contracts` | list |
| GET | `/api/revenue-contracts/{id}` | getById |
| POST | `/api/revenue-contracts` | create |
| PUT | `/api/revenue-contracts/{id}` | update |
| DELETE | `/api/revenue-contracts/{id}` | delete |

### RevenueRecognitionPeriodController (`modules/revenueRecognition/web/RevenueRecognitionPeriodController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/revenue-recognition-periods` | list |
| GET | `/api/revenue-recognition-periods/{id}` | getById |
| POST | `/api/revenue-recognition-periods` | create |
| POST | `/api/revenue-recognition-periods/{id}/calculate` | calculate |
| PATCH | `/api/revenue-recognition-periods/{id}/status` | changeStatus |
| DELETE | `/api/revenue-recognition-periods/{id}` | delete |

---

## Module: russianDoc

### EdoDocumentController (`modules/russianDoc/web/EdoDocumentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/edo-documents/templates` | listTemplates |
| GET | `/api/edo-documents/templates/{id}` | getTemplate |
| GET | `/api/edo-documents/templates/active` | getActiveTemplates |
| POST | `/api/edo-documents/templates` | createTemplate |
| PUT | `/api/edo-documents/templates/{id}` | updateTemplate |
| DELETE | `/api/edo-documents/templates/{id}` | deleteTemplate |
| GET | `/api/edo-documents/generated` | listGenerated |
| POST | `/api/edo-documents/generate` | generateDocument |
| GET | `/api/edo-documents/generated/by-source` | getBySource |

### OcrController (`modules/russianDoc/web/OcrController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/ocr/tasks` | listTasks |
| GET | `/api/ocr/tasks/{id}` | getTask |
| POST | `/api/ocr/tasks` | createTask |
| PATCH | `/api/ocr/tasks/{id}/start` | startProcessing |
| GET | `/api/ocr/tasks/pending` | getPendingTasks |
| DELETE | `/api/ocr/tasks/{id}` | deleteTask |

### RussianDocController (`modules/russianDoc/web/RussianDocController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/russian-docs` | list |
| GET | `/api/russian-docs/upd` | listUpd |
| GET | `/api/russian-docs/upd/{id}` | getUpd |
| POST | `/api/russian-docs/upd` | createUpd |
| PUT | `/api/russian-docs/upd/{id}` | updateUpd |
| DELETE | `/api/russian-docs/upd/{id}` | deleteUpd |
| PATCH | `/api/russian-docs/upd/{id}/status` | changeUpdStatus |

---

## Module: safety

### SafetyAccidentActController (`modules/safety/web/SafetyAccidentActController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/accident-acts` | list |
| GET | `/api/safety/accident-acts/{id}` | getById |
| POST | `/api/safety/accident-acts` | create |
| PATCH | `/api/safety/accident-acts/{id}/status` | updateStatus |

### SafetyBriefingController (`modules/safety/web/SafetyBriefingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/briefings` | list |
| GET | `/api/safety/briefings/{id}` | get |
| POST | `/api/safety/briefings` | create |
| PUT | `/api/safety/briefings/{id}` | update |
| PATCH | `/api/safety/briefings/{id}/sign` | sign |
| PATCH | `/api/safety/briefings/{id}/complete` | complete |
| DELETE | `/api/safety/briefings/{id}` | delete |

### SafetyCertificateController (`modules/safety/web/SafetyCertificateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/certificates` | listAll |
| GET | `/api/safety/certificates/worker/{employeeId}` | getWorkerCerts |
| GET | `/api/safety/certificates/expiring` | getExpiring |
| POST | `/api/safety/certificates` | create |
| PUT | `/api/safety/certificates/{id}` | update |

### SafetyComplianceController (`modules/safety/web/SafetyComplianceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/compliance/dashboard` | getDashboard |
| POST | `/api/safety/compliance/auto-schedule` | autoSchedule |
| GET | `/api/safety/compliance/certificate-check/{employeeId}` | checkCertificateCompliance |
| GET | `/api/safety/compliance/access-check/{employeeId}` | checkAccessCompliance |
| GET | `/api/safety/compliance/access-blocks` | getAccessBlocks |
| POST | `/api/safety/compliance/access-blocks/{employeeId}/resolve` | resolveAccessBlock |
| GET | `/api/safety/compliance/prescriptions` | getPrescriptions |

### SafetyIncidentController (`modules/safety/web/SafetyIncidentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/incidents` | list |
| GET | `/api/safety/incidents/{id}` | getById |
| POST | `/api/safety/incidents` | create |
| PUT | `/api/safety/incidents/{id}` | update |
| PATCH | `/api/safety/incidents/{id}/investigate` | investigate |
| PATCH | `/api/safety/incidents/{id}/corrective-action` | addCorrectiveAction |
| PATCH | `/api/safety/incidents/{id}/resolve` | resolve |
| PATCH | `/api/safety/incidents/{id}/close` | close |
| DELETE | `/api/safety/incidents/{id}` | delete |
| GET | `/api/safety/incidents/project/{projectId}` | getByProject |
| GET | `/api/safety/incidents/dashboard` | getDashboard |

### SafetyInspectionController (`modules/safety/web/SafetyInspectionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/inspections` | list |
| GET | `/api/safety/inspections/{id}` | getById |
| POST | `/api/safety/inspections` | create |
| PUT | `/api/safety/inspections/{id}` | update |
| PATCH | `/api/safety/inspections/{id}/start` | start |
| PATCH | `/api/safety/inspections/{id}/complete` | complete |
| PATCH | `/api/safety/inspections/{id}/cancel` | cancel |
| DELETE | `/api/safety/inspections/{id}` | delete |
| GET | `/api/safety/inspections/{inspectionId}/violations` | getViolations |
| POST | `/api/safety/inspections/{inspectionId}/violations` | addViolation |

### SafetyMetricsController (`modules/safety/web/SafetyMetricsController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/metrics` | getMetrics |
| GET | `/api/safety/training-records` | listTrainingRecords |
| POST | `/api/safety/training-records` | createTrainingRecord |

### SafetyPpeController (`modules/safety/web/SafetyPpeController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/ppe/inventory` | listInventory |
| GET | `/api/safety/ppe/issues` | listIssues |
| POST | `/api/safety/ppe/issues` | issuePpe |
| PATCH | `/api/safety/ppe/issues/{id}/return` | returnPpe |

### SafetyRiskScoringController (`modules/safety/web/SafetyRiskScoringController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/risk-scoring/{projectId}` | getProjectRiskScore |
| POST | `/api/safety/risk-scoring/{projectId}/calculate` | calculateProjectRiskScore |
| GET | `/api/safety/risk-scoring/portfolio` | getPortfolioRiskMap |
| GET | `/api/safety/risk-scoring/{projectId}/factors` | getProjectFactors |
| POST | `/api/safety/risk-scoring/calculate-all` | calculateAllProjects |
| GET | `/api/safety/risk-scoring/reports` | getWeeklyReports |
| POST | `/api/safety/risk-scoring/reports/generate` | generateWeeklyReport |

### SafetySoutController (`modules/safety/web/SafetySoutController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/sout` | list |
| GET | `/api/safety/sout/{id}` | getById |

### SafetyTrainingController (`modules/safety/web/SafetyTrainingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/trainings` | list |
| GET | `/api/safety/trainings/{id}` | getById |
| POST | `/api/safety/trainings` | create |
| PUT | `/api/safety/trainings/{id}` | update |
| PATCH | `/api/safety/trainings/{id}/complete` | complete |
| PATCH | `/api/safety/trainings/{id}/cancel` | cancel |
| DELETE | `/api/safety/trainings/{id}` | delete |

### SafetyViolationController (`modules/safety/web/SafetyViolationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/safety/violations` | list |
| GET | `/api/safety/violations/{id}` | getById |
| POST | `/api/safety/violations` | create |
| PUT | `/api/safety/violations/{id}` | update |
| DELETE | `/api/safety/violations/{id}` | delete |
| PATCH | `/api/safety/violations/{id}/resolve` | resolve |
| GET | `/api/safety/violations/overdue` | getOverdue |
| GET | `/api/safety/violations/by-status` | listByStatus |
| GET | `/api/safety/violations/dashboard` | getDashboard |

---

## Module: scheduler

### SchedulerController (`modules/scheduler/web/SchedulerController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/scheduler/jobs` | register |
| GET | `/api/scheduler/jobs` | listJobs |
| GET | `/api/scheduler/jobs/{code}` | getJob |
| PATCH | `/api/scheduler/jobs/{code}/enable` | enable |
| PATCH | `/api/scheduler/jobs/{code}/disable` | disable |
| POST | `/api/scheduler/jobs/{code}/run` | triggerRun |
| GET | `/api/scheduler/jobs/{code}/executions` | listExecutions |

---

## Module: search

### SearchAdminController (`modules/search/web/SearchAdminController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/admin/search/index` | indexEntity |
| DELETE | `/api/admin/search/index/{entityType}/{entityId}` | removeEntity |
| POST | `/api/admin/search/rebuild-index` | rebuildIndex |
| GET | `/api/admin/search/status` | getStatus |

### SearchController (`modules/search/web/SearchController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/search` | search |
| GET | `/api/search/autocomplete` | autocomplete |
| GET | `/api/search/recent` | recentSearches |
| GET | `/api/search/popular` | popularSearches |

---

## Module: selfEmployed

### SelfEmployedController (`modules/selfEmployed/web/SelfEmployedController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/self-employed/contractors` | listContractors |
| GET | `/api/self-employed/contractors/{id}` | getContractor |
| POST | `/api/self-employed/contractors` | createContractor |
| PUT | `/api/self-employed/contractors/{id}` | updateContractor |
| DELETE | `/api/self-employed/contractors/{id}` | deleteContractor |
| GET | `/api/self-employed/payments` | listPayments |
| GET | `/api/self-employed/payments/{id}` | getPayment |
| POST | `/api/self-employed/payments` | createPayment |
| PUT | `/api/self-employed/payments/{id}` | updatePayment |
| DELETE | `/api/self-employed/payments/{id}` | deletePayment |
| POST | `/api/self-employed/payments/{id}/check-receipt` | checkReceipt |
| GET | `/api/self-employed/registries` | listRegistries |
| GET | `/api/self-employed/registries/{id}` | getRegistry |
| POST | `/api/self-employed/registries` | createRegistry |
| DELETE | `/api/self-employed/registries/{id}` | deleteRegistry |
| POST | `/api/self-employed/registries/generate` | generateRegistry |
| GET | `/api/self-employed/registries/{id}/export` | exportRegistry |

---

## Module: settings

### AuditSettingController (`modules/settings/web/AuditSettingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/audit-settings` | listAll |
| GET | `/api/admin/audit-settings/{id}` | getById |
| GET | `/api/admin/audit-settings/model/{modelName}` | getByModelName |
| POST | `/api/admin/audit-settings` | create |
| PUT | `/api/admin/audit-settings/{id}` | update |
| DELETE | `/api/admin/audit-settings/{id}` | delete |

### EmailTemplateController (`modules/settings/web/EmailTemplateController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/email-templates` | list |
| GET | `/api/admin/email-templates/{id}` | getById |
| GET | `/api/admin/email-templates/code/{code}` | getByCode |
| POST | `/api/admin/email-templates` | create |
| PUT | `/api/admin/email-templates/{id}` | update |
| DELETE | `/api/admin/email-templates/{id}` | delete |
| POST | `/api/admin/email-templates/render` | render |
| POST | `/api/admin/email-templates/send` | send |

### FeatureFlagController (`modules/settings/web/FeatureFlagController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/feature-flags` | getAll |
| GET | `/api/feature-flags/check` | checkFlag |
| PUT | `/api/feature-flags/{key}` | update |

### IntegrationConfigController (`modules/settings/web/IntegrationConfigController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/integrations` | listAll |
| GET | `/api/admin/integrations/{id}` | getById |
| GET | `/api/admin/integrations/code/{code}` | getByCode |
| POST | `/api/admin/integrations` | create |
| PUT | `/api/admin/integrations/{id}` | update |
| DELETE | `/api/admin/integrations/{id}` | delete |
| POST | `/api/admin/integrations/code/{code}/test` | testConnection |
| POST | `/api/admin/integrations/code/{code}/sync` | startSync |
| GET | `/api/admin/integrations/code/{code}/status` | getStatus |

### NotificationSettingController (`modules/settings/web/NotificationSettingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/settings/notifications` | getMySettings |
| GET | `/api/settings/notifications/type/{notificationType}` | getByType |
| GET | `/api/settings/notifications/defaults` | getDefaults |
| PUT | `/api/settings/notifications` | updateSetting |
| POST | `/api/settings/notifications/bulk` | bulkUpdate |

### NumberSequenceController (`modules/settings/web/NumberSequenceController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/sequences` | listAll |
| GET | `/api/admin/sequences/{id}` | getById |
| GET | `/api/admin/sequences/code/{code}` | getByCode |
| PUT | `/api/admin/sequences/{id}` | update |
| POST | `/api/admin/sequences/code/{code}/next` | getNextValue |

### SystemSettingController (`modules/settings/web/SystemSettingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/admin/settings` | getAll |
| GET | `/api/admin/settings/category/{category}` | getByCategory |
| GET | `/api/admin/settings/key/{key}` | getByKey |
| GET | `/api/admin/settings/{id}` | getById |
| PUT | `/api/admin/settings/key/{key}` | update |

---

## Module: siteAssessment

### SiteAssessmentController (`modules/siteAssessment/web/SiteAssessmentController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/site-assessments` | list |
| GET | `/api/site-assessments/{id}` | getById |
| POST | `/api/site-assessments` | create |
| POST | `/api/site-assessments/{id}/complete` | complete |

---

## Module: specification

### CompetitiveListController (`modules/specification/web/CompetitiveListController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/competitive-lists` | list |
| GET | `/api/competitive-lists/{id}` | getById |
| POST | `/api/competitive-lists/from-purchase-request` | createFromPurchaseRequest |
| POST | `/api/competitive-lists` | create |
| PUT | `/api/competitive-lists/{id}` | update |
| POST | `/api/competitive-lists/{id}/status` | changeStatus |
| GET | `/api/competitive-lists/{id}/entries` | getEntries |
| POST | `/api/competitive-lists/{id}/entries` | addEntry |
| PUT | `/api/competitive-lists/{id}/entries/{entryId}` | updateEntry |
| DELETE | `/api/competitive-lists/{id}/entries/{entryId}` | deleteEntry |
| POST | `/api/competitive-lists/{id}/entries/{entryId}/select` | selectWinner |
| GET | `/api/competitive-lists/{id}/summary` | getSummary |
| POST | `/api/competitive-lists/{id}/auto-rank` | autoRank |
| POST | `/api/competitive-lists/{id}/auto-select-best` | autoSelectBest |
| POST | `/api/competitive-lists/{id}/apply-to-cp/{cpId}` | applyToCp |

### MaterialAnalogController (`modules/specification/web/MaterialAnalogController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/specifications/analogs` | listAnalogs |
| GET | `/api/specifications/analogs/{id}` | getAnalog |
| POST | `/api/specifications/analogs` | createAnalog |
| PUT | `/api/specifications/analogs/{id}` | updateAnalog |
| PATCH | `/api/specifications/analogs/{id}/approve` | approveAnalog |
| DELETE | `/api/specifications/analogs/{id}` | deleteAnalog |
| GET | `/api/specifications/analog-requests` | listRequests |
| GET | `/api/specifications/analog-requests/{id}` | getRequest |
| POST | `/api/specifications/analog-requests` | createRequest |
| PATCH | `/api/specifications/analog-requests/{id}/approve` | approveRequest |
| PATCH | `/api/specifications/analog-requests/{id}/reject` | rejectRequest |

### ProcurementScheduleController (`modules/specification/web/ProcurementScheduleController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/procurement-schedules` | list |
| POST | `/api/procurement-schedules/generate` | generate |
| PUT | `/api/procurement-schedules/{id}/status` | updateStatus |

### SpecificationController (`modules/specification/web/SpecificationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/specifications` | list |
| GET | `/api/specifications/{id}` | getById |
| POST | `/api/specifications` | create |
| PUT | `/api/specifications/{id}` | update |
| DELETE | `/api/specifications/{id}` | delete |
| PATCH | `/api/specifications/{id}/status` | changeStatus |
| POST | `/api/specifications/{id}/version` | createVersion |
| GET | `/api/specifications/{id}/items` | getItems |
| POST | `/api/specifications/{id}/items` | addItem |
| PUT | `/api/specifications/items/{itemId}` | updateItem |
| DELETE | `/api/specifications/items/{itemId}` | removeItem |
| GET | `/api/specifications/{id}/summary` | getSummary |
| POST | `/api/specifications/preview-pdf` | previewPdf |
| POST | `/api/specifications/{id}/parse-pdf` | parsePdf |
| POST | `/api/specifications/{id}/import-pdf-items` | importPdfItems |

---

## Module: subscription

### PaymentController (`modules/subscription/web/PaymentController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/payments/create` | createPayment |
| POST | `/api/payments/webhook/yookassa` | handleYooKassaWebhook |

### SubscriptionController (`modules/subscription/web/SubscriptionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/subscriptions/plans` | listPlans |
| GET | `/api/subscriptions/current` | getCurrentSubscription |
| POST | `/api/subscriptions/change` | changePlan |
| GET | `/api/subscriptions/usage` | getUsage |
| GET | `/api/subscriptions/check-feature` | checkFeature |
| GET | `/api/subscriptions/check-quota` | checkQuota |
| GET | `/api/subscriptions/billing-history` | getBillingHistory |

---

## Module: support

### KnowledgeBaseController (`modules/support/web/KnowledgeBaseController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/support/kb/categories` | listCategories |
| POST | `/api/support/kb/categories` | createCategory |
| PUT | `/api/support/kb/categories/{id}` | updateCategory |
| DELETE | `/api/support/kb/categories/{id}` | deleteCategory |
| GET | `/api/support/kb/articles` | listArticles |
| GET | `/api/support/kb/articles/{id}` | getArticle |
| POST | `/api/support/kb/articles` | createArticle |
| PUT | `/api/support/kb/articles/{id}` | updateArticle |
| DELETE | `/api/support/kb/articles/{id}` | deleteArticle |
| PATCH | `/api/support/kb/articles/{id}/publish` | publishArticle |
| GET | `/api/support/kb/faqs` | listFaqs |
| POST | `/api/support/kb/faqs` | createFaq |
| PUT | `/api/support/kb/faqs/{id}` | updateFaq |
| DELETE | `/api/support/kb/faqs/{id}` | deleteFaq |

### SupportTicketController (`modules/support/web/SupportTicketController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/support/tickets` | list |
| GET | `/api/support/tickets/{id}` | getById |
| POST | `/api/support/tickets` | create |
| PUT | `/api/support/tickets/{id}` | update |
| PATCH | `/api/support/tickets/{id}/assign` | assign |
| PATCH | `/api/support/tickets/{id}/start` | start |
| PATCH | `/api/support/tickets/{id}/resolve` | resolve |
| PATCH | `/api/support/tickets/{id}/close` | close |
| DELETE | `/api/support/tickets/{id}` | delete |
| GET | `/api/support/tickets/{ticketId}/comments` | getComments |
| POST | `/api/support/tickets/{ticketId}/comments` | addComment |
| GET | `/api/support/tickets/dashboard` | getDashboard |
| GET | `/api/support/tickets/my` | getMyTickets |
| GET | `/api/support/tickets/assigned` | getAssigned |

---

## Module: task

### MilestoneController (`modules/task/web/MilestoneController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/milestones` | list |
| GET | `/api/milestones/{id}` | getById |
| POST | `/api/milestones` | create |
| PUT | `/api/milestones/{id}` | update |
| POST | `/api/milestones/{id}/complete` | complete |
| GET | `/api/milestones/project/{projectId}` | getProjectMilestones |

### TaskChecklistController (`modules/task/web/TaskChecklistController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/tasks/{taskId}/checklist` | getChecklist |
| POST | `/api/tasks/{taskId}/checklist` | addItem |
| POST | `/api/tasks/{taskId}/checklist/{itemId}/toggle` | toggleItem |
| DELETE | `/api/tasks/{taskId}/checklist/{itemId}` | deleteItem |

### TaskController (`modules/task/web/TaskController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/tasks` | list |
| GET | `/api/tasks/my` | getMyTasks |
| GET | `/api/tasks/{id}` | getById |
| POST | `/api/tasks` | create |
| PUT | `/api/tasks/{id}` | update |
| PATCH | `/api/tasks/{id}/status` | changeStatus |
| PATCH | `/api/tasks/{id}/assign` | assign |
| PATCH | `/api/tasks/{id}/progress` | updateProgress |
| POST | `/api/tasks/{id}/comments` | addComment |
| GET | `/api/tasks/{id}/subtasks` | getSubtasks |
| GET | `/api/tasks/project/{projectId}/wbs` | getProjectWBS |
| POST | `/api/tasks/{id}/dependencies` | addDependency |
| DELETE | `/api/tasks/{id}/dependencies/{dependsOnTaskId}` | removeDependency |
| GET | `/api/tasks/project/{projectId}/gantt` | getGanttData |
| GET | `/api/tasks/project/{projectId}/summary` | getProjectTaskSummary |
| GET | `/api/tasks/project/{projectId}/overdue` | getOverdueTasks |
| GET | `/api/tasks/{id}/participants` | getParticipants |
| POST | `/api/tasks/{id}/participants` | addParticipant |
| DELETE | `/api/tasks/{id}/participants/{userId}` | removeParticipant |
| POST | `/api/tasks/{id}/delegate` | delegateTask |

### TaskDependencyController (`modules/task/web/TaskDependencyController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/tasks/dependencies` | create |
| DELETE | `/api/tasks/dependencies/{id}` | delete |
| GET | `/api/tasks/{taskId}/dependencies` | getForTask |
| GET | `/api/projects/{projectId}/task-dependencies` | getForProject |
| GET | `/api/projects/{projectId}/critical-path` | getCriticalPath |

### TaskLabelController (`modules/task/web/TaskLabelController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/task-labels` | getLabels |
| POST | `/api/task-labels` | createLabel |
| PUT | `/api/task-labels/{id}` | updateLabel |
| DELETE | `/api/task-labels/{id}` | deleteLabel |
| POST | `/api/task-labels/tasks/{taskId}/labels/{labelId}` | assignLabel |
| DELETE | `/api/task-labels/tasks/{taskId}/labels/{labelId}` | removeLabel |
| GET | `/api/task-labels/tasks/{taskId}` | getTaskLabels |

### TaskStageController (`modules/task/web/TaskStageController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/task-stages` | getStages |
| POST | `/api/task-stages` | create |
| PUT | `/api/task-stages/{id}` | update |
| DELETE | `/api/task-stages/{id}` | delete |
| POST | `/api/task-stages/reorder` | reorder |

### TaskTimeTrackingController (`modules/task/web/TaskTimeTrackingController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/tasks/{taskId}/time-entries` | getTimeEntries |
| POST | `/api/tasks/{taskId}/time-entries/timer/start` | startTimer |
| POST | `/api/tasks/{taskId}/time-entries/timer/stop` | stopTimer |
| POST | `/api/tasks/{taskId}/time-entries` | addManualEntry |
| DELETE | `/api/tasks/{taskId}/time-entries/{entryId}` | deleteEntry |
| GET | `/api/tasks/{taskId}/time-entries/total` | getTotalDuration |

---

## Module: taxRisk

### TaxRiskController (`modules/taxRisk/web/TaxRiskController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/tax-risk/assessments` | listAssessments |
| GET | `/api/tax-risk/assessments/{id}` | getAssessment |
| POST | `/api/tax-risk/assessments` | createAssessment |
| PUT | `/api/tax-risk/assessments/{id}` | updateAssessment |
| DELETE | `/api/tax-risk/assessments/{id}` | deleteAssessment |
| GET | `/api/tax-risk/assessments/by-project/{projectId}` | getByProject |
| GET | `/api/tax-risk/assessments/by-organization/{organizationId}` | getByOrganization |
| GET | `/api/tax-risk/assessments/{id}/factors` | listFactors |
| POST | `/api/tax-risk/assessments/{id}/factors` | addFactor |
| PUT | `/api/tax-risk/assessments/{id}/factors/{factorId}` | updateFactor |
| DELETE | `/api/tax-risk/assessments/{id}/factors/{factorId}` | deleteFactor |
| GET | `/api/tax-risk/assessments/{id}/mitigations` | listMitigations |
| POST | `/api/tax-risk/assessments/{id}/mitigations` | addMitigation |
| PUT | `/api/tax-risk/assessments/{id}/mitigations/{mitigationId}` | updateMitigation |
| DELETE | `/api/tax-risk/assessments/{id}/mitigations/{mitigationId}` | deleteMitigation |
| POST | `/api/tax-risk/assessments/{id}/calculate-score` | calculateScore |

---

## Module: warehouse

### InventoryCheckController (`modules/warehouse/web/InventoryCheckController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/inventory-checks` | list |
| GET | `/api/warehouse/inventory-checks/{id}` | getById |
| GET | `/api/warehouse/inventory-checks/{id}/lines` | getLines |
| POST | `/api/warehouse/inventory-checks` | create |
| POST | `/api/warehouse/inventory-checks/{id}/start` | start |
| PUT | `/api/warehouse/inventory-checks/{checkId}/lines` | updateLine |
| POST | `/api/warehouse/inventory-checks/{id}/complete` | complete |
| POST | `/api/warehouse/inventory-checks/{id}/cancel` | cancel |

### LimitFenceSheetController (`modules/warehouse/web/LimitFenceSheetController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/limit-fence-sheets` | list |
| GET | `/api/warehouse/limit-fence-sheets/{id}` | getById |
| GET | `/api/warehouse/limit-fence-sheets/remaining-limit` | getRemainingLimit |
| POST | `/api/warehouse/limit-fence-sheets` | create |
| PUT | `/api/warehouse/limit-fence-sheets/{id}` | update |
| POST | `/api/warehouse/limit-fence-sheets/{id}/issue` | issue |
| POST | `/api/warehouse/limit-fence-sheets/{id}/return` | returnMaterial |
| POST | `/api/warehouse/limit-fence-sheets/{id}/close` | close |
| DELETE | `/api/warehouse/limit-fence-sheets/{id}` | delete |

### MaterialController (`modules/warehouse/web/MaterialController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/materials` | list |
| GET | `/api/warehouse/materials/{id}` | getById |
| POST | `/api/warehouse/materials` | create |
| PUT | `/api/warehouse/materials/{id}` | update |
| DELETE | `/api/warehouse/materials/{id}` | delete |

### StockController (`modules/warehouse/web/StockController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/stock` | listAll |
| GET | `/api/warehouse/stock/location/{locationId}` | getStockByLocation |
| GET | `/api/warehouse/stock/material/{materialId}` | getStockByMaterial |
| GET | `/api/warehouse/stock/material/{materialId}/availability` | getMaterialAvailability |
| GET | `/api/warehouse/stock/alerts/low-stock` | getLowStockAlerts |
| GET | `/api/warehouse/stock/project/{projectId}` | getProjectStock |

### StockLimitController (`modules/warehouse/web/StockLimitController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/stock-limits` | listLimits |
| GET | `/api/warehouse/stock-limits/{id}` | getLimit |
| POST | `/api/warehouse/stock-limits` | createLimit |
| PUT | `/api/warehouse/stock-limits/{id}` | updateLimit |
| DELETE | `/api/warehouse/stock-limits/{id}` | deleteLimit |
| GET | `/api/warehouse/stock-limits/alerts` | listAlerts |
| POST | `/api/warehouse/stock-limits/alerts/{id}/acknowledge` | acknowledgeAlert |
| POST | `/api/warehouse/stock-limits/alerts/{id}/resolve` | resolveAlert |

### StockMovementController (`modules/warehouse/web/StockMovementController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/movements` | list |
| GET | `/api/warehouse/movements/{id}` | getById |
| GET | `/api/warehouse/movements/{id}/lines` | getLines |
| POST | `/api/warehouse/movements` | create |
| PUT | `/api/warehouse/movements/{id}` | update |
| POST | `/api/warehouse/movements/{id}/lines` | addLine |
| POST | `/api/warehouse/movements/{id}/confirm` | confirm |
| POST | `/api/warehouse/movements/{id}/execute` | execute |
| POST | `/api/warehouse/movements/{id}/cancel` | cancel |
| DELETE | `/api/warehouse/movements/{id}` | delete |
| GET | `/api/warehouse/movements/history` | getHistory |
| POST | `/api/warehouse/movements/receipt-from-purchase` | createReceiptFromPurchase |

### WarehouseLocationController (`modules/warehouse/web/WarehouseLocationController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/locations` | list |
| GET | `/api/warehouse/locations/{id}` | getById |
| GET | `/api/warehouse/locations/{id}/children` | getChildren |
| POST | `/api/warehouse/locations` | create |
| PUT | `/api/warehouse/locations/{id}` | update |
| DELETE | `/api/warehouse/locations/{id}` | delete |

### WarehouseOrderController (`modules/warehouse/web/WarehouseOrderController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/warehouse/orders` | list |
| GET | `/api/warehouse/orders/{id}` | getById |
| GET | `/api/warehouse/orders/{id}/items` | getItems |
| POST | `/api/warehouse/orders` | create |
| PUT | `/api/warehouse/orders/{id}` | update |
| POST | `/api/warehouse/orders/{id}/items` | addItem |
| POST | `/api/warehouse/orders/{id}/confirm` | confirm |
| POST | `/api/warehouse/orders/{id}/cancel` | cancel |
| DELETE | `/api/warehouse/orders/{id}` | delete |

---

## Module: workflowEngine

### ApprovalInstanceController (`modules/workflowEngine/web/ApprovalInstanceController.java`)

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/approval-instances` | startApproval |
| GET | `/api/approval-instances/inbox` | getInbox |
| GET | `/api/approval-instances/{id}` | getInstance |
| POST | `/api/approval-instances/{id}/decision` | submitDecision |
| POST | `/api/approval-instances/batch-decision` | batchDecision |
| POST | `/api/approval-instances/{id}/delegate` | delegate |
| POST | `/api/approval-instances/{id}/cancel` | cancel |
| GET | `/api/approval-instances/entity/{entityType}/{entityId}/history` | getHistory |

### AutoApprovalRuleController (`modules/workflowEngine/web/AutoApprovalRuleController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/approval-rules` | list |
| GET | `/api/approval-rules/{id}` | getById |
| POST | `/api/approval-rules` | create |
| PUT | `/api/approval-rules/{id}` | update |
| PATCH | `/api/approval-rules/{id}/toggle` | toggleActive |
| DELETE | `/api/approval-rules/{id}` | delete |

### WorkflowDefinitionController (`modules/workflowEngine/web/WorkflowDefinitionController.java`)

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/workflow-definitions` | list |
| GET | `/api/workflow-definitions/{id}` | getById |
| POST | `/api/workflow-definitions` | create |
| PUT | `/api/workflow-definitions/{id}` | update |
| PATCH | `/api/workflow-definitions/{id}/toggle` | toggleActive |
| DELETE | `/api/workflow-definitions/{id}` | delete |
| GET | `/api/workflow-definitions/{id}/steps` | getSteps |
| PUT | `/api/workflow-definitions/{id}/steps` | replaceSteps |
| GET | `/api/workflow-definitions/executions` | getExecutions |

---
