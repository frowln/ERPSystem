# Frontend Pages & Routes

> Auto-generated map of all frontend pages and routes.
> Total routed pages: **521** | Unrouted pages: **18** | Redirect aliases: **26**
> Date: 2026-03-12

---

## Module: Auth (public)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /login | modules/auth/LoginPage.tsx | авторизация |
| /register | modules/auth/RegisterPage.tsx | регистрация |
| /forgot-password | modules/auth/ForgotPasswordPage.tsx | форма восстановления |
| /reset-password/:token | modules/auth/ResetPasswordPage.tsx | сброс пароля |

## Module: Landing & Legal (public)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /welcome | modules/landing/LandingPage.tsx | лендинг |
| /terms | modules/legal/TermsPage.tsx | условия использования |
| /privacy | modules/legal/PrivacyPage.tsx | политика конфиденциальности |
| /dpa | modules/legal/DpaPage.tsx | соглашение об обработке ПД |
| /sla | modules/legal/SlaPage.tsx | SLA |
| /status | modules/status/StatusPage.tsx | статус системы |
| /changelog | modules/changelog/ChangelogPage.tsx | журнал изменений |
| /call/:token | pages/GuestCallPage.tsx | гостевой звонок |

## Module: Dashboard

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| / | modules/dashboard/DashboardPage.tsx | главный дашборд |

## Module: Projects

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /projects | modules/projects/ProjectListPage.tsx | список |
| /projects/new | modules/projects/ProjectFormPage.tsx | форма создания |
| /projects/:id | modules/projects/ProjectDetailPage.tsx | детальная |
| /projects/:id/edit | modules/projects/ProjectFormPage.tsx | форма редактирования |
| /projects/:id/risks | modules/projects/RiskRegisterPage.tsx | реестр рисков |
| /projects/:id/meeting | modules/projects/PreConstructionMeetingPage.tsx | предстроительное совещание |
| /projects/:id/constructability | modules/projects/ConstructabilityReviewPage.tsx | обзор конструктивности |
| /projects/:id/constructability/:reviewId | modules/projects/ConstructabilityReviewDetailPage.tsx | детальная ревью |
| /projects/:id/handoff-report | modules/projects/HandoffReportPage.tsx | отчёт передачи |
| /projects/:id/pre-construction | modules/projects/PreConstructionDashboardPage.tsx | дашборд предстроительства |
| /portfolio/health | modules/projects/PortfolioHealthPage.tsx | здоровье портфеля |

## Module: Tasks

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /tasks | pages/TaskBoardPage.tsx | канбан-доска |
| /tasks/list | _(redirect -> /tasks)_ | |
| /tasks/gantt | _(redirect -> /tasks)_ | |
| /tasks/my | _(redirect -> /tasks)_ | |

## Module: Calendar

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /calendar | modules/calendar/CalendarPage.tsx | календарь |
| /calendar/events/new | modules/calendar/CalendarEventFormPage.tsx | форма создания события |
| /calendar/events/:id/edit | modules/calendar/CalendarEventFormPage.tsx | форма редактирования события |

## Module: Documents

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /documents | modules/documents/DocumentListPage.tsx | список |
| /documents/new | modules/documents/DocumentFormPage.tsx | форма создания |
| /documents/:id/edit | modules/documents/DocumentFormPage.tsx | форма редактирования |
| /documents/smart-recognition | modules/documents/SmartDocRecognitionPage.tsx | распознавание документов |
| /documents/drawing-viewer | modules/documents/DrawingViewerPage.tsx | просмотр чертежей |

## Module: Counterparties

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /counterparties | modules/counterparties/CounterpartyListPage.tsx | список |
| /counterparties/new | modules/counterparties/CounterpartyFormPage.tsx | форма создания |
| /counterparties/:id | modules/counterparties/CounterpartyDetailPage.tsx | детальная |
| /counterparties/:id/edit | modules/counterparties/CounterpartyFormPage.tsx | форма редактирования |

## Module: Contracts

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /contracts | modules/contracts/ContractListPage.tsx | список |
| /contracts/board | modules/contracts/ContractBoardPage.tsx | канбан-доска |
| /contracts/new | modules/contracts/ContractFormPage.tsx | форма создания |
| /contracts/:id | modules/contracts/ContractDetailPage.tsx | детальная |
| /contracts/:id/edit | modules/contracts/ContractFormPage.tsx | форма редактирования |

## Module: Estimates (Сметы)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /estimates | modules/estimates/EstimateListPage.tsx | список |
| /estimates/pivot | modules/estimates/EstimatePivotPage.tsx | сводная таблица |
| /estimates/new | modules/estimates/EstimateFormPage.tsx | форма создания |
| /estimates/:id | modules/estimates/EstimateDetailPage.tsx | детальная |
| /estimates/:id/edit | modules/estimates/EstimateFormPage.tsx | форма редактирования |
| /estimates/:id/normative | modules/estimates/EstimateNormativeView.tsx | нормативный вид |
| /estimates/:id/fm-reconciliation | modules/estimates/EstimateFmReconciliation.tsx | сверка с ФМ |
| /estimates/import | modules/estimates/EstimateImportPage.tsx | импорт |
| /estimates/import-lsr | modules/estimates/LsrImportWizard.tsx | импорт ЛСР (визард) |
| /estimates/export | modules/estimates/EstimateExportPage.tsx | экспорт |
| /estimates/volume-calculator | modules/estimates/VolumeCalculatorPage.tsx | калькулятор объёмов |
| /estimates/comparison | modules/estimates/EstimateComparisonPage.tsx | сравнение смет |
| /estimates/minstroy | modules/estimates/MinstroyIndexPage.tsx | индексы Минстроя |
| /estimates/summary | modules/estimates/SummaryEstimatePage.tsx | сводный сметный расчёт |
| /estimates/ocr-scanner | modules/estimates/OcrScannerPage.tsx | OCR-сканер |

## Module: Pricing (Ценообразование)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /estimates/pricing/databases | modules/pricing/PricingDatabaseListPage.tsx | базы ценообразования |
| /estimates/pricing/rates | modules/pricing/PricingRatesPage.tsx | расценки |
| /estimates/pricing/calculate | modules/pricing/PricingCalculatorPage.tsx | калькулятор цен |
| /pricing | modules/subscription/PricingPage.tsx | тарифы подписки |
| /pricing/databases | _(redirect -> /estimates/pricing/databases)_ | |
| /pricing/rates | _(redirect -> /estimates/pricing/rates)_ | |
| /pricing/calculate | _(redirect -> /estimates/pricing/calculate)_ | |

## Module: Specifications (Спецификации)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /specifications | modules/specifications/SpecificationListPage.tsx | список |
| /specifications/new | modules/specifications/SpecificationFormPage.tsx | форма создания |
| /specifications/:id | modules/specifications/SpecificationDetailPage.tsx | детальная |
| /specifications/:id/edit | modules/specifications/SpecificationFormPage.tsx | форма редактирования |
| /specifications/:id/split | modules/specifications/SpecificationSplitView.tsx | разделённый вид |
| /specifications/:id/supply-dashboard | modules/specifications/SpecSupplyDashboard.tsx | дашборд поставок |
| /specifications/:specId/competitive-list/:id | modules/specifications/CompetitiveListPage.tsx | конкурентный лист |
| /specifications/analogs | modules/specifications/MaterialAnalogsPage.tsx | аналоги материалов |
| /specifications/analog-requests | modules/specifications/AnalogRequestsPage.tsx | запросы на аналоги |
| /specifications/competitive-registry | modules/specifications/CompetitiveListRegistryPage.tsx | реестр КЛ |

## Module: RFI (Запросы информации)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /pm/rfis | modules/rfi/RfiListPage.tsx | список |
| /pm/rfis/board | modules/rfi/RfiBoardPage.tsx | канбан-доска |
| /pm/rfis/new | modules/rfi/RfiFormPage.tsx | форма создания |
| /pm/rfis/:id | modules/rfi/RfiDetailPage.tsx | детальная |
| /pm/rfis/:id/edit | modules/rfi/RfiFormPage.tsx | форма редактирования |

## Module: Submittals (Субмиталы)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /pm/submittals | modules/submittals/SubmittalListPage.tsx | список |
| /pm/submittals/new | modules/submittals/SubmittalFormPage.tsx | форма создания |
| /pm/submittals/:id | modules/submittals/SubmittalDetailPage.tsx | детальная |
| /pm/submittals/:id/edit | modules/submittals/SubmittalFormPage.tsx | форма редактирования |

## Module: Issues (Вопросы)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /pm/issues | modules/issues/IssueListPage.tsx | список |
| /pm/issues/new | modules/issues/IssueFormPage.tsx | форма создания |
| /pm/issues/:id | modules/issues/IssueDetailPage.tsx | детальная |
| /pm/issues/:id/edit | modules/issues/IssueFormPage.tsx | форма редактирования |
| /issues | _(redirect -> /pm/issues)_ | |
| /issues/:id | _(redirect -> /pm/issues)_ | |

## Module: Change Management (Управление изменениями)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /change-management/events | modules/changeManagement/ChangeEventListPage.tsx | список событий |
| /change-management/events/:id | modules/changeManagement/ChangeEventDetailPage.tsx | детальная события |
| /change-management/orders | modules/changeManagement/ChangeOrderListPage.tsx | список ордеров |
| /change-management/orders/board | modules/changeManagement/ChangeOrderBoardPage.tsx | канбан-доска |
| /change-management/orders/new | modules/changeManagement/ChangeOrderFormPage.tsx | форма создания |
| /change-management/orders/:id | modules/changeManagement/ChangeOrderDetailPage.tsx | детальная ордера |
| /change-management/orders/:id/edit | modules/changeManagement/ChangeOrderFormPage.tsx | форма редактирования |
| /change-management/dashboard | modules/changeManagement/ChangeManagementDashboardPage.tsx | дашборд |
| /change-management/events/new | _(redirect -> /change-management/events)_ | |

## Module: Planning (Планирование)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /planning/gantt | modules/planning/GanttChartPage.tsx | диаграмма Ганта |
| /planning/wbs | _(redirect -> /planning/gantt)_ | |
| /planning/baseline | _(redirect -> /planning/gantt)_ | |
| /planning/critical-path | _(redirect -> /planning/gantt)_ | |
| /planning/resources | modules/planning/ResourceAllocationPage.tsx | распределение ресурсов |
| /planning/evm | modules/planning/EvmDashboardPage.tsx | дашборд EVM |
| /planning/resource-planning | modules/planning/ResourcePlanningPage.tsx | планирование ресурсов |
| /planning/resource-board | modules/planning/ResourceAllocationBoardPage.tsx | доска ресурсов |
| /planning/work-volumes | modules/planning/WorkVolumeTrackingPage.tsx | отслеживание объёмов |

## Module: Workflow (Бизнес-процессы)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /workflow/templates | modules/workflow/WorkflowTemplateListPage.tsx | список шаблонов |
| /workflow/instances | modules/workflow/WorkflowInstancePage.tsx | экземпляры процессов |
| /workflow/designer | modules/workflow/WorkflowDesignerPage.tsx | конструктор |
| /workflow/designer/:id | modules/workflow/WorkflowDesignerPage.tsx | редактирование процесса |
| /workflow/approval-inbox | modules/workflow/ApprovalInboxPage.tsx | входящие согласования |
| /workflows | _(redirect -> /workflow/templates)_ | |

## Module: BIM

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /bim/models | modules/bim/BimModelListPage.tsx | список моделей |
| /bim/models/:id | modules/bim/BimModelDetailPage.tsx | детальная модели |
| /bim/design-packages | modules/bim/DesignPackagePage.tsx | пакеты проектирования |
| /bim/clash-detection | modules/bim/ClashDetectionPage.tsx | поиск коллизий |
| /bim/clash-detection/board | modules/bim/ClashBoardPage.tsx | доска коллизий |
| /bim/clash-results | modules/bim/ClashDetectionResultsPage.tsx | результаты коллизий |
| /bim/defect-heatmap | modules/bim/DefectHeatmapPage.tsx | тепловая карта дефектов |
| /bim/construction-progress | modules/bim/ConstructionProgressPage.tsx | прогресс строительства |
| /bim/property-sets | modules/bim/PropertySetsPage.tsx | наборы свойств |
| /bim/bcf-issues | modules/bim/BcfIssuesPage.tsx | BCF-замечания |
| /bim/drawing-overlay | modules/bim/DrawingOverlayComparisonPage.tsx | наложение чертежей |
| /bim/drawing-pins | modules/bim/DrawingPinsPage.tsx | пины на чертежах |

## Module: Design (Проектирование)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /design/versions | modules/design/DesignVersionListPage.tsx | список версий |
| /design/versions/new | modules/design/DesignVersionFormPage.tsx | форма создания версии |
| /design/versions/:id/edit | modules/design/DesignVersionFormPage.tsx | форма редактирования версии |
| /design/reviews | modules/design/DesignReviewPage.tsx | ревью |
| /design/reviews/board | modules/design/DesignReviewBoardPage.tsx | доска ревью |
| /design/sections | modules/design/DesignSectionListPage.tsx | разделы проекта |

## Module: Bid Management (Тендерные пакеты)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /bid-packages | modules/bidManagement/BidPackageListPage.tsx | список |
| /bid-packages/:id | modules/bidManagement/BidPackageDetailPage.tsx | детальная |

## Module: Finance / Budgets (Финансы / Бюджеты)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /finance | _(redirect -> /budgets)_ | |
| /financial-models | modules/finance/FinancialModelsPage.tsx | финансовые модели |
| /budgets | modules/finance/BudgetListPage.tsx | список бюджетов |
| /budgets/new | modules/finance/BudgetFormPage.tsx | форма создания |
| /budgets/:id | modules/finance/BudgetDetailPage.tsx | детальная бюджета |
| /budgets/:id/overview | _(redirect -> /budgets/:id)_ | |
| /budgets/:id/edit | modules/finance/BudgetFormPage.tsx | форма редактирования |
| /budgets/:id/fm | modules/finance/FmPage.tsx | финансовая модель |
| /budgets/:id/dashboard | modules/finance/FmDashboardPage.tsx | дашборд ФМ |

## Module: Commercial Proposals (КП)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /commercial-proposals | modules/commercialProposal/CommercialProposalListPage.tsx | список |
| /commercial-proposals/new | modules/commercialProposal/CommercialProposalCreatePage.tsx | форма создания |
| /commercial-proposals/:id | modules/commercialProposal/CommercialProposalDetailPage.tsx | детальная |

## Module: Invoices (Счета)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /invoices | modules/finance/InvoiceListPage.tsx | список |
| /invoices/new | modules/finance/InvoiceFormPage.tsx | форма создания |
| /invoices/:id | modules/finance/InvoiceDetailPage.tsx | детальная |
| /invoices/:id/edit | modules/finance/InvoiceFormPage.tsx | форма редактирования |

## Module: Payments (Платежи)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /payments | modules/finance/PaymentListPage.tsx | список |
| /payments/new | modules/finance/PaymentFormPage.tsx | форма создания |
| /payments/:id | modules/finance/PaymentDetailPage.tsx | детальная |
| /payments/:id/edit | modules/finance/PaymentFormPage.tsx | форма редактирования |

## Module: Cash Flow (Денежные потоки)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /cash-flow | modules/finance/CashFlowPage.tsx | денежные потоки |
| /cash-flow/charts | modules/finance/CashFlowChartPage.tsx | графики денежных потоков |

## Module: Finance Advanced

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /bank-statement-matching | modules/finance/BankStatementMatchingPage.tsx | сверка банковских выписок |
| /factoring-calculator | modules/finance/FactoringCalculatorPage.tsx | калькулятор факторинга |
| /treasury-calendar | modules/finance/TreasuryCalendarPage.tsx | казначейский календарь |
| /tax-calendar | modules/finance/TaxCalendarPage.tsx | налоговый календарь |
| /bank-export | modules/finance/BankExportPage.tsx | экспорт в банк |
| /execution-chain | modules/finance/ExecutionChainPage.tsx | цепочка исполнения |
| /bdds | modules/finance/BddsPage.tsx | БДДС |
| /cost-codes | modules/finance/CostCodeBrowserPage.tsx | справочник статей затрат |
| /finance/expenses | modules/finance/FinanceExpensesPage.tsx | расходы |
| /finance/s-curve-cashflow | modules/finance/SCurveCashFlowPage.tsx | S-кривая денежного потока |

## Module: Accounting (Бухгалтерия)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /accounting | modules/accounting/AccountingDashboardPage.tsx | дашборд |
| /accounting/dashboard | modules/accounting/AccountingDashboardPage.tsx | дашборд (алиас) |
| /accounting/chart | modules/accounting/ChartOfAccountsPage.tsx | план счетов |
| /accounting/chart-of-accounts | modules/accounting/ChartOfAccountsPage.tsx | план счетов (алиас) |
| /accounting/journals | modules/accounting/FinancialJournalsPage.tsx | финансовые журналы |
| /accounting/journal | modules/accounting/JournalEntriesPage.tsx | проводки |
| /accounting/journal/new | modules/accounting/JournalEntryFormPage.tsx | форма создания проводки |
| /accounting/journal/:id | modules/accounting/JournalEntryDetailPage.tsx | детальная проводки |
| /accounting/journal/:id/edit | modules/accounting/JournalEntryFormPage.tsx | форма редактирования проводки |
| /accounting/assets | modules/accounting/FixedAssetsPage.tsx | основные средства |

## Module: Cost Management (Управление стоимостью)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /cost-management/codes | modules/costManagement/CostCodeListPage.tsx | список статей |
| /cost-management/codes/:id | modules/costManagement/CostCodeDetailPage.tsx | детальная статьи |
| /cost-management/budget | modules/costManagement/BudgetOverviewPage.tsx | обзор бюджета |
| /cost-management/commitments | modules/costManagement/CommitmentsPage.tsx | обязательства |
| /cost-management/commitments/new | modules/costManagement/CommitmentFormPage.tsx | форма создания |
| /cost-management/commitments/:id | modules/costManagement/CommitmentDetailPage.tsx | детальная |
| /cost-management/commitments/:id/edit | modules/costManagement/CommitmentFormPage.tsx | форма редактирования |
| /cost-management/forecast | modules/costManagement/ForecastPage.tsx | прогноз |
| /cost-management/cashflow | modules/costManagement/CostCashflowPage.tsx | денежный поток по затратам |
| /cost-management/cashflow-forecast | modules/costManagement/CashFlowForecastPage.tsx | прогноз денежного потока |
| /cost-management/forecasting-hub | modules/costManagement/ForecastingHubPage.tsx | хаб прогнозирования |
| /cost-management/profitability | modules/costManagement/ProfitabilityDashboardPage.tsx | дашборд рентабельности |

## Module: Revenue Recognition (Признание выручки)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /revenue/contracts | modules/revenueRecognition/RevenueContractListPage.tsx | список контрактов |
| /revenue/contracts/:id | modules/revenueRecognition/RevenueContractDetailPage.tsx | детальная контракта |
| /revenue/periods | modules/revenueRecognition/RevenuePeriodsPage.tsx | периоды |
| /revenue/dashboard | modules/revenueRecognition/RevenueDashboardPage.tsx | дашборд |
| /revenue/recognition-periods | modules/revenueRecognition/RecognitionPeriodPage.tsx | периоды признания |
| /revenue/all-contracts | modules/revenueRecognition/RevenueContractsPage.tsx | все контракты |

## Module: Procurement (Закупки)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /procurement | modules/procurement/PurchaseRequestListPage.tsx | список заявок |
| /procurement/board | modules/procurement/PurchaseRequestBoardPage.tsx | канбан-доска заявок |
| /procurement/new | modules/procurement/PurchaseRequestFormPage.tsx | форма создания заявки |
| /procurement/:id | modules/procurement/PurchaseRequestDetailPage.tsx | детальная заявки |
| /procurement/:id/edit | modules/procurement/PurchaseRequestFormPage.tsx | форма редактирования заявки |
| /procurement/purchase-orders | modules/procurement/PurchaseOrderListPage.tsx | список заказов |
| /procurement/purchase-orders/new | modules/procurement/PurchaseOrderFormPage.tsx | форма создания заказа |
| /procurement/purchase-orders/:id | modules/procurement/PurchaseOrderDetailPage.tsx | детальная заказа |
| /procurement/prequalification | modules/procurement/VendorPrequalificationPage.tsx | преквалификация поставщиков |
| /procurement/bid-comparison | modules/procurement/BidComparisonPage.tsx | сравнение предложений |
| /procurement/tenders | modules/procurement/TendersPage.tsx | тендеры |

## Module: Price Coefficients (Ценовые коэффициенты)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /price-coefficients | modules/priceCoefficients/PriceCoefficientListPage.tsx | список |
| /price-coefficients/new | modules/priceCoefficients/PriceCoefficientFormPage.tsx | форма создания |
| /price-coefficients/:id | modules/priceCoefficients/PriceCoefficientDetailPage.tsx | детальная |
| /price-coefficients/:id/edit | modules/priceCoefficients/PriceCoefficientFormPage.tsx | форма редактирования |

## Module: Payroll (Зарплата)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /payroll | modules/payroll/PayrollTemplateListPage.tsx | список шаблонов |
| /payroll/templates/new | modules/payroll/PayrollTemplateFormPage.tsx | форма создания шаблона |
| /payroll/templates/:id/edit | modules/payroll/PayrollTemplateFormPage.tsx | форма редактирования шаблона |
| /payroll/calculate | modules/payroll/PayrollCalculationPage.tsx | расчёт зарплаты |

## Module: Self-Employed (Самозанятые)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /self-employed | modules/selfEmployed/ContractorListPage.tsx | список подрядчиков |
| /self-employed/contractors/new | modules/selfEmployed/ContractorFormPage.tsx | форма создания |
| /self-employed/contractors/:id/edit | modules/selfEmployed/ContractorFormPage.tsx | форма редактирования |
| /self-employed/payments | modules/selfEmployed/PaymentListPage.tsx | платежи |
| /self-employed/registries | modules/selfEmployed/RegistryListPage.tsx | реестры |

## Module: Tax Risk (Налоговые риски)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /tax-risk | modules/taxRisk/TaxRiskListPage.tsx | список |
| /tax-risk/new | modules/taxRisk/TaxRiskFormPage.tsx | форма создания |
| /tax-risk/:id | modules/taxRisk/TaxRiskDetailPage.tsx | детальная |
| /tax-risk/:id/edit | modules/taxRisk/TaxRiskFormPage.tsx | форма редактирования |

## Module: Monte Carlo (Симуляции)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /monte-carlo | modules/monteCarlo/SimulationListPage.tsx | список симуляций |
| /monte-carlo/new | modules/monteCarlo/SimulationFormPage.tsx | форма создания |
| /monte-carlo/:id | modules/monteCarlo/SimulationDetailPage.tsx | детальная |
| /monte-carlo/:id/edit | modules/monteCarlo/SimulationFormPage.tsx | форма редактирования |

## Module: Employees (Сотрудники)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /employees | modules/hr/EmployeeListPage.tsx | список |
| /employees/new | modules/hr/EmployeeFormPage.tsx | форма создания |
| /employees/:id | modules/hr/EmployeeDetailPage.tsx | детальная |
| /employees/:id/edit | modules/hr/EmployeeFormPage.tsx | форма редактирования |

## Module: Crew & Timesheets (Бригады и табели)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /crew | modules/hr/CrewPage.tsx | бригады |
| /timesheets | modules/hr/TimesheetListPage.tsx | список табелей |
| /timesheets/:id | modules/hr/TimesheetDetailPage.tsx | детальная табеля |
| /hr/crew-timesheets | modules/hr/CrewTimeSheetsPage.tsx | табели бригад |
| /hr/crew-time-entries | modules/hr/CrewTimeEntriesPage.tsx | записи рабочего времени |
| /hr/crew-time-calendar | modules/hr/CrewTimeCalendarPage.tsx | календарь бригад |
| /hr/timesheet-pivot | modules/hr/TimesheetPivotPage.tsx | сводная табелей |

## Module: HR Advanced

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /hr/staffing-schedule | modules/hr/StaffingSchedulePage.tsx | штатное расписание |
| /hr/timesheet-t13 | modules/hr/TimesheetT13Page.tsx | табель Т-13 |
| /hr/work-orders | modules/hr/WorkOrderFormPage.tsx | наряд-заказы |
| /hr/qualifications | modules/hr/QualificationsJournalPage.tsx | журнал квалификаций |
| /hr/seniority-leave | modules/hr/SeniorityLeavePage.tsx | стаж и отпуска |
| /hr/certification-matrix | modules/hr/CertificationMatrixPage.tsx | матрица сертификаций |

## Module: HR Russian (Кадры РФ)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /hr-russian/employment-contracts | modules/hrRussian/EmploymentContractListPage.tsx | трудовые договоры |
| /hr-russian/personnel-orders | modules/hrRussian/PersonnelOrderListPage.tsx | кадровые приказы |
| /hr-russian/staffing | modules/hrRussian/StaffingTablePage.tsx | штатное расписание |
| /hr-russian/timesheets | modules/hrRussian/TimeSheetPage.tsx | табель |

## Module: Safety (Охрана труда)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /safety | modules/safety/SafetyDashboardPage.tsx | дашборд |
| /safety/board | modules/safety/SafetyBoardPage.tsx | канбан-доска |
| /safety/metrics | modules/safety/SafetyMetricsDashboard.tsx | дашборд метрик |
| /safety/incidents | modules/safety/SafetyIncidentListPage.tsx | список инцидентов |
| /safety/incidents/new | modules/safety/SafetyIncidentFormPage.tsx | форма создания инцидента |
| /safety/incidents/:id | modules/safety/SafetyIncidentDetailPage.tsx | детальная инцидента |
| /safety/incidents/:id/edit | modules/safety/SafetyIncidentFormPage.tsx | форма редактирования инцидента |
| /safety/inspections | modules/safety/SafetyInspectionListPage.tsx | список проверок |
| /safety/inspections/new | modules/safety/SafetyInspectionFormPage.tsx | форма создания проверки |
| /safety/inspections/:id | modules/safety/SafetyInspectionDetailPage.tsx | детальная проверки |
| /safety/inspections/:id/edit | modules/safety/SafetyInspectionFormPage.tsx | форма редактирования проверки |
| /safety/training | modules/safety/SafetyTrainingListPage.tsx | список обучений |
| /safety/training/new | modules/safety/SafetyTrainingFormPage.tsx | форма создания обучения |
| /safety/training/:id | modules/safety/SafetyTrainingDetailPage.tsx | детальная обучения |
| /safety/training/:id/edit | modules/safety/SafetyTrainingFormPage.tsx | форма редактирования обучения |
| /safety/training-journal | modules/safety/SafetyTrainingJournalPage.tsx | журнал обучений |
| /safety/briefings | modules/safety/SafetyBriefingListPage.tsx | список инструктажей |
| /safety/briefings/new | modules/safety/SafetyBriefingFormPage.tsx | форма создания инструктажа |
| /safety/briefings/:id | modules/safety/SafetyBriefingDetailPage.tsx | детальная инструктажа |
| /safety/briefings/:id/edit | modules/safety/SafetyBriefingFormPage.tsx | форма редактирования инструктажа |
| /safety/violations | modules/safety/SafetyViolationListPage.tsx | нарушения |
| /safety/ppe | modules/safety/PpeManagementPage.tsx | управление СИЗ |
| /safety/sout | modules/safety/SoutCardPage.tsx | карта СОУТ |
| /safety/accident-acts | modules/safety/AccidentActN1Page.tsx | акт Н-1 |
| /safety/certification-matrix | modules/safety/CertificationMatrixPage.tsx | матрица сертификаций |
| /safety/compliance | modules/safety/SafetyComplianceDashboardPage.tsx | дашборд соответствия |
| /safety/worker-certs | modules/safety/WorkerCertsPage.tsx | сертификаты работников |

## Module: Recruitment (Подбор персонала)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /recruitment/applicants | modules/recruitment/ApplicantListPage.tsx | список кандидатов |
| /recruitment/applicants/new | modules/recruitment/ApplicantFormPage.tsx | форма создания |
| /recruitment/applicants/board | modules/recruitment/ApplicantBoardPage.tsx | канбан-доска |
| /recruitment/applicants/:id | modules/recruitment/ApplicantDetailPage.tsx | детальная |
| /recruitment/applicants/:id/edit | modules/recruitment/ApplicantFormPage.tsx | форма редактирования |
| /recruitment/jobs | modules/recruitment/JobPositionListPage.tsx | вакансии |

## Module: Leave (Отпуска)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /leave/requests | modules/leave/LeaveRequestListPage.tsx | список заявлений |
| /leave/board | modules/leave/LeaveBoardPage.tsx | доска отпусков |
| /leave/allocations | modules/leave/LeaveAllocationPage.tsx | распределение |
| /leave/types | modules/leave/LeaveTypesPage.tsx | виды отпусков |

## Module: Warehouse (Склад)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /warehouse/locations | modules/warehouse/WarehouseLocationsPage.tsx | склады |
| /warehouse/stock | modules/warehouse/StockPage.tsx | остатки |
| /warehouse/materials | modules/warehouse/MaterialListPage.tsx | список материалов |
| /warehouse/materials/new | modules/warehouse/MaterialFormPage.tsx | форма создания |
| /warehouse/materials/:id | modules/warehouse/MaterialDetailPage.tsx | детальная |
| /warehouse/materials/:id/edit | modules/warehouse/MaterialFormPage.tsx | форма редактирования |
| /warehouse/movements | modules/warehouse/MovementListPage.tsx | список перемещений |
| /warehouse/movements/board | modules/warehouse/MovementBoardPage.tsx | доска перемещений |
| /warehouse/movements/new | modules/warehouse/MovementFormPage.tsx | форма создания |
| /warehouse/movements/:id | modules/warehouse/MovementDetailPage.tsx | детальная |
| /warehouse/movements/:id/edit | modules/warehouse/MovementFormPage.tsx | форма редактирования |
| /warehouse/inventory | modules/warehouse/InventoryPage.tsx | инвентаризация |
| /warehouse/stock-limits | modules/warehouse/StockLimitsPage.tsx | лимиты запасов |
| /warehouse/stock-alerts | modules/warehouse/StockAlertsPage.tsx | оповещения по остаткам |
| /warehouse/m29-report | modules/warehouse/M29ReportPage.tsx | отчёт М-29 |
| /warehouse/limit-fence-cards | modules/warehouse/LimitFenceCardsPage.tsx | лимитно-заборные карты |
| /warehouse/warehouse-orders | modules/warehouse/WarehouseOrdersPage.tsx | складские ордера (legacy) |
| /warehouse/address-storage | modules/warehouse/AddressStoragePage.tsx | адресное хранение |
| /warehouse/material-demand | modules/warehouse/MaterialDemandPage.tsx | потребность в материалах |
| /warehouse/barcode-scanner | modules/warehouse/BarcodeScannerPage.tsx | сканер штрих-кодов |
| /warehouse/inter-project-transfer | modules/warehouse/InterProjectTransferPage.tsx | межпроектные перемещения |
| /warehouse/inter-site-transfer | modules/warehouse/InterSiteTransferPage.tsx | межплощадочные перемещения |
| /warehouse/limit-fence-sheets | modules/warehouse/LimitFenceSheetListPage.tsx | лимитно-заборные ведомости |
| /warehouse/limit-fence-sheets/new | modules/warehouse/LimitFenceSheetFormPage.tsx | форма создания |
| /warehouse/limit-fence-sheets/:id | modules/warehouse/LimitFenceSheetDetailPage.tsx | детальная |
| /warehouse/limit-fence-sheets/:id/edit | modules/warehouse/LimitFenceSheetFormPage.tsx | форма редактирования |
| /warehouse/quick-confirm | modules/warehouse/QuickConfirmPage.tsx | быстрое подтверждение |
| /warehouse/quick-receipt | modules/warehouse/QuickReceiptPage.tsx | быстрый приход |
| /warehouse/orders | modules/warehouse/WarehouseOrderListPage.tsx | складские ордера |
| /warehouse/orders/new | modules/warehouse/WarehouseOrderFormPage.tsx | форма создания ордера |
| /warehouse/orders/:id | modules/warehouse/WarehouseOrderDetailPage.tsx | детальная ордера |
| /warehouse/orders/:id/edit | modules/warehouse/WarehouseOrderFormPage.tsx | форма редактирования ордера |

## Module: Quality (Качество)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /quality | modules/quality/QualityListPage.tsx | список проверок |
| /quality/board | modules/quality/QualityBoardPage.tsx | канбан-доска |
| /quality/:id | modules/quality/QualityCheckDetailPage.tsx | детальная проверки |
| /quality/inspections/new | modules/quality/InspectionFormPage.tsx | форма создания |
| /quality/inspections/:id/edit | modules/quality/InspectionFormPage.tsx | форма редактирования |
| /quality/tolerance-rules | modules/quality/ToleranceRulesPage.tsx | допуски |
| /quality/tolerance-checks | modules/quality/ToleranceChecksPage.tsx | проверки допусков |
| /quality/certificates | modules/quality/MaterialCertificatesPage.tsx | сертификаты материалов |
| /quality/material-inspection | modules/quality/MaterialInspectionPage.tsx | входной контроль |
| /quality/checklist-templates | modules/quality/ChecklistTemplatesPage.tsx | шаблоны чек-листов |
| /quality/checklists | modules/quality/QualityChecklistListPage.tsx | чек-листы |
| /quality/checklists/:id | modules/quality/QualityChecklistDetailPage.tsx | детальная чек-листа |
| /quality/defect-register | modules/quality/DefectRegisterPage.tsx | реестр дефектов |
| /quality/defect-pareto | modules/quality/DefectParetoPage.tsx | Парето дефектов |
| /quality/supervision-journal | modules/quality/AuthorSupervisionJournalPage.tsx | журнал авторского надзора |
| /quality/gates | modules/quality/QualityGatesPage.tsx | ворота качества |

## Module: Punchlist (Замечания)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /punchlist/items | modules/punchlist/PunchlistItemsPage.tsx | список замечаний |
| /punchlist/items/new | modules/punchlist/PunchListItemFormPage.tsx | форма создания |
| /punchlist/items/:id | modules/punchlist/PunchlistItemDetailPage.tsx | детальная замечания |
| /punchlist/items/:id/edit | modules/punchlist/PunchListItemFormPage.tsx | форма редактирования |
| /punchlist/board | modules/punchlist/PunchlistBoardPage.tsx | канбан-доска |
| /punchlist/dashboard | modules/punchlist/PunchlistDashboardPage.tsx | дашборд |
| /punchlist/list | modules/punchlist/PunchListPage.tsx | список (альтернативный) |
| /punchlist/:id | modules/punchlist/PunchItemDetailPage.tsx | детальная (альтернативный) |
| /punchlist/new | _(redirect -> /punchlist/items)_ | |

## Module: Defects (Дефекты)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /defects | modules/defects/DefectListPage.tsx | список |
| /defects/dashboard | modules/defects/DefectDashboardPage.tsx | дашборд |
| /defects/new | modules/defects/DefectFormPage.tsx | форма создания |
| /defects/:id | modules/defects/DefectDetailPage.tsx | детальная |
| /defects/:id/edit | modules/defects/DefectFormPage.tsx | форма редактирования |
| /defects/on-plan | modules/defects/DefectOnPlanPage.tsx | дефекты на плане |

## Module: Regulatory (Надзор и разрешения)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /regulatory/permits | modules/regulatory/PermitsPage.tsx | разрешения |
| /regulatory/permits/board | modules/regulatory/PermitBoardPage.tsx | доска разрешений |
| /regulatory/permits/:id | modules/regulatory/PermitDetailPage.tsx | детальная разрешения |
| /regulatory/licenses | modules/regulatory/LicensesPage.tsx | лицензии |
| /regulatory/inspections | modules/regulatory/InspectionsPage.tsx | проверки |
| /regulatory/dashboard | modules/regulatory/RegulatoryDashboardPage.tsx | дашборд |
| /regulatory/reporting-calendar | modules/regulatory/ReportingCalendarPage.tsx | календарь отчётности |
| /regulatory/prescriptions-journal | modules/regulatory/PrescriptionsJournalPage.tsx | журнал предписаний |
| /regulatory/prescription-responses | modules/regulatory/PrescriptionResponsePage.tsx | ответы на предписания |
| /regulatory/sro-licenses | modules/regulatory/SroLicenseRegistryPage.tsx | реестр СРО |
| /regulatory/inspection-prep | modules/regulatory/InspectionPrepPage.tsx | подготовка к проверке |
| /regulatory/inspection-history | modules/regulatory/InspectionHistoryPage.tsx | история проверок |
| /regulatory/compliance | modules/regulatory/ComplianceDashboardPage.tsx | дашборд соответствия |
| /regulatory/inspection-list | modules/regulatory/InspectionListPage.tsx | список проверок |
| /regulatory/license-list | modules/regulatory/LicenseListPage.tsx | список лицензий |
| /regulatory/permit-list | modules/regulatory/PermitListPage.tsx | список разрешений |
| /regulatory/prescriptions | modules/regulatory/PrescriptionListPage.tsx | список предписаний |
| /regulatory/prescriptions/new | modules/regulatory/PrescriptionFormPage.tsx | форма создания |
| /regulatory/prescriptions/:id | modules/regulatory/PrescriptionDetailPage.tsx | детальная |
| /regulatory/prescriptions/:id/edit | modules/regulatory/PrescriptionFormPage.tsx | форма редактирования |
| /regulatory/permits/new | _(redirect -> /regulatory/permits)_ | |
| /regulatory/licenses/new | _(redirect -> /regulatory/licenses)_ | |
| /regulatory/inspections/new | _(redirect -> /regulatory/inspections)_ | |

## Module: CDE (Common Data Environment)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /cde/documents | modules/cde/DocumentContainerListPage.tsx | список контейнеров |
| /cde/documents/:id | modules/cde/DocumentContainerDetailPage.tsx | детальная |
| /cde/transmittals | modules/cde/TransmittalListPage.tsx | список трансмиттлов |
| /cde/transmittals/:id | modules/cde/TransmittalDetailPage.tsx | детальная |
| /cde/archive-policies | modules/cde/ArchivePolicyListPage.tsx | политики архивации |
| /cde/revision-sets | modules/cde/RevisionSetListPage.tsx | наборы ревизий |
| /cde/revision-sets/:id | modules/cde/RevisionSetDetailPage.tsx | детальная набора |

## Module: Russian Docs (Российская документация)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /russian-docs | _(redirect -> /russian-docs/list)_ | |
| /russian-docs/list | modules/russianDocs/RussianDocListPage.tsx | список |
| /russian-docs/all | modules/russianDocs/DocumentListPage.tsx | все документы |
| /russian-docs/create | modules/russianDocs/DocumentCreatePage.tsx | создание документа |
| /russian-docs/:id | modules/russianDocs/DocumentDetailPage.tsx | детальная |
| /russian-docs/ks2 | modules/russianDocs/Ks2GeneratorPage.tsx | генератор КС-2 |
| /russian-docs/ks3 | modules/russianDocs/Ks3GeneratorPage.tsx | генератор КС-3 |
| /russian-docs/form-ks2 | modules/russianDocs/FormKs2Page.tsx | форма КС-2 |
| /russian-docs/form-ks3 | modules/russianDocs/FormKs3Page.tsx | форма КС-3 |
| /russian-docs/sbis | modules/russianDocs/SbisDocumentsPage.tsx | СБИС документы |
| /russian-docs/edo | modules/russianDocs/EdoDocumentsPage.tsx | ЭДО документы |

## Module: Data Exchange (Обмен данными)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /data-exchange/import | modules/dataExchange/ImportJobListPage.tsx | импорт |
| /data-exchange/export | modules/dataExchange/ExportJobListPage.tsx | экспорт |
| /data-exchange/mapping | modules/dataExchange/MappingConfigPage.tsx | маппинг |
| /data-exchange/1c-config | modules/dataExchange/OneCConfigPage.tsx | настройка 1С |
| /data-exchange/1c-logs | modules/dataExchange/OneCExchangeLogPage.tsx | логи обмена с 1С |

## Module: PTO (Производственно-технический отдел)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /pto/documents | modules/pto/PtoDocumentListPage.tsx | список документов |
| /pto/documents/board | modules/pto/PtoDocumentBoardPage.tsx | доска документов |
| /pto/documents/new | modules/pto/PtoDocumentFormPage.tsx | форма создания |
| /pto/documents/:id | modules/pto/PtoDocumentDetailPage.tsx | детальная |
| /pto/documents/:id/edit | modules/pto/PtoDocumentFormPage.tsx | форма редактирования |
| /pto/work-permits | modules/pto/WorkPermitListPage.tsx | допуски к работам |
| /pto/work-permits/:id | modules/pto/WorkPermitDetailPage.tsx | детальная допуска |
| /pto/lab-tests | modules/pto/LabTestListPage.tsx | лабораторные испытания |
| /pto/ks6-calendar | modules/pto/Ks6CalendarPage.tsx | календарь КС-6 |
| /pto/hidden-work-acts | modules/pto/HiddenWorkActListPage.tsx | акты скрытых работ |
| /pto/hidden-work-acts/new | modules/pto/HiddenWorkActFormPage.tsx | форма создания |
| /pto/hidden-work-acts/:id | modules/pto/HiddenWorkActDetailPage.tsx | детальная |
| /pto/hidden-work-acts/:id/edit | modules/pto/HiddenWorkActFormPage.tsx | форма редактирования |
| /pto/itd-validation | modules/pto/ItdValidationPage.tsx | валидация ИТД |

## Module: Closing Documents (Закрывающие документы)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /ks2 | modules/closing/Ks2ListPage.tsx | список КС-2 |
| /ks2/new | modules/closing/Ks2FormPage.tsx | форма создания КС-2 |
| /ks2/:id | modules/closing/Ks2DetailPage.tsx | детальная КС-2 |
| /ks2/approvals | modules/closing/Ks2ApprovalWorkflowPage.tsx | согласование КС-2 |
| /ks2/volume-check | modules/closing/Ks2VolumeCheckPage.tsx | проверка объёмов КС-2 |
| /ks2/pipeline | modules/closing/Ks2PipelinePage.tsx | пайплайн КС-2 |
| /ks3 | modules/closing/Ks3ListPage.tsx | список КС-3 |
| /ks3/new | modules/closing/Ks3FormPage.tsx | форма создания КС-3 |
| /ks3/:id | modules/closing/Ks3DetailPage.tsx | детальная КС-3 |
| /ks6a | modules/closing/Ks6aJournalPage.tsx | журнал КС-6а |
| /correction-acts | modules/closing/CorrectionActsPage.tsx | корректировочные акты |
| /ks-print | modules/closing/KsPrintFormsPage.tsx | печатные формы КС |
| /m29 | modules/russianDocs/M29ListPage.tsx | формы М-29 |

## Module: Daily Log (Журнал работ)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /daily-log | modules/dailylog/DailyLogPage.tsx | журнал |
| /daily-log/board | modules/dailylog/DailyLogBoardPage.tsx | доска |
| /daily-logs/new | modules/dailylog/DailyLogFormPage.tsx | форма создания |
| /daily-logs/:id/edit | modules/dailylog/DailyLogFormPage.tsx | форма редактирования |

## Module: Operations (Операции)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /operations/daily-logs | modules/operations/OperationsDailyLogsPage.tsx | журналы работ |
| /operations/daily-logs/new | modules/operations/DailyLogCreatePage.tsx | форма создания |
| /operations/daily-logs/:id | modules/operations/DailyLogDetailPage.tsx | детальная |
| /operations/work-orders | modules/operations/WorkOrdersPage.tsx | наряд-заказы |
| /operations/work-orders/board | modules/operations/WorkOrderBoardPage.tsx | доска наряд-заказов |
| /operations/work-orders/:id | modules/operations/WorkOrderDetailPage.tsx | детальная |
| /operations/work-orders/new | _(redirect -> /operations/work-orders)_ | |
| /operations/dashboard | modules/operations/OperationsDashboardPage.tsx | дашборд операций |
| /operations/dispatch-calendar | modules/operations/DispatchCalendarPage.tsx | календарь диспетчеризации |
| /operations/daily-log-list | modules/operations/DailyLogListPage.tsx | список журналов |
| /operations/work-order-list | modules/operations/WorkOrderListPage.tsx | список наряд-заказов |

## Module: Fleet (Автопарк)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /fleet | modules/fleet/FleetListPage.tsx | список транспорта |
| /fleet/new | modules/fleet/FleetVehicleFormPage.tsx | форма создания |
| /fleet/:id | modules/fleet/FleetDetailPage.tsx | детальная |
| /fleet/:id/edit | modules/fleet/FleetVehicleFormPage.tsx | форма редактирования |
| /fleet/maintenance | modules/fleet/MaintenancePage.tsx | техобслуживание |
| /fleet/maintenance/board | modules/fleet/FleetMaintenanceBoardPage.tsx | доска ТО |
| /fleet/fuel | modules/fleet/FuelPage.tsx | топливо |
| /fleet/waybills-esm | modules/fleet/WaybillsPage.tsx | путевые листы (ЕСМ) |
| /fleet/waybills | modules/fleet/WaybillListPage.tsx | список путевых листов |
| /fleet/waybills/new | modules/fleet/WaybillFormPage.tsx | форма создания |
| /fleet/waybills/:id | modules/fleet/WaybillDetailPage.tsx | детальная |
| /fleet/waybills/:id/edit | modules/fleet/WaybillFormPage.tsx | форма редактирования |
| /fleet/fuel-accounting | modules/fleet/FuelAccountingPage.tsx | учёт топлива |
| /fleet/maint-repair | modules/fleet/MaintenanceToRepairPage.tsx | ТО и ремонт |
| /fleet/gps-tracking | modules/fleet/GpsTrackingPage.tsx | GPS-трекинг |
| /fleet/driver-rating | modules/fleet/DriverRatingPage.tsx | рейтинг водителей |
| /fleet/maintenance-schedule | modules/fleet/MaintenanceSchedulePage.tsx | расписание ТО |
| /fleet/usage-logs | modules/fleet/UsageLogListPage.tsx | журнал использования |
| /fleet/usage-logs/new | modules/fleet/UsageLogFormPage.tsx | форма создания |
| /fleet/usage-logs/:id | modules/fleet/UsageLogDetailPage.tsx | детальная |
| /fleet/usage-logs/:id/edit | modules/fleet/UsageLogFormPage.tsx | форма редактирования |

## Module: IoT

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /iot/devices | modules/iot/DevicesPage.tsx | устройства |
| /iot/devices/:id | modules/iot/DeviceDetailPage.tsx | детальная устройства |
| /iot/sensors | modules/iot/SensorsPage.tsx | датчики |
| /iot/alerts | modules/iot/AlertsPage.tsx | оповещения |
| /iot/device-list | modules/iot/DeviceListPage.tsx | список устройств |

## Module: Maintenance (Обслуживание оборудования)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /maintenance/requests | modules/maintenance/MaintenanceRequestListPage.tsx | список заявок |
| /maintenance/requests/new | modules/maintenance/MaintenanceRequestFormPage.tsx | форма создания |
| /maintenance/requests/:id/edit | modules/maintenance/MaintenanceRequestFormPage.tsx | форма редактирования |
| /maintenance/board | modules/maintenance/MaintenanceBoardPage.tsx | канбан-доска |
| /maintenance/equipment | modules/maintenance/EquipmentListPage.tsx | оборудование |
| /maintenance/dashboard | modules/maintenance/MaintenanceDashboardPage.tsx | дашборд |

## Module: Dispatch (Диспетчеризация)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /dispatch/orders | modules/dispatch/DispatchOrderListPage.tsx | список заявок |
| /dispatch/orders/new | modules/dispatch/DispatchOrderFormPage.tsx | форма создания |
| /dispatch/orders/:id/edit | modules/dispatch/DispatchOrderFormPage.tsx | форма редактирования |
| /dispatch/routes | modules/dispatch/DispatchRouteListPage.tsx | маршруты |
| /dispatch/routes/new | modules/dispatch/DispatchRouteFormPage.tsx | форма создания |
| /dispatch/routes/:id/edit | modules/dispatch/DispatchRouteFormPage.tsx | форма редактирования |

## Module: Mobile (Мобильный)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /mobile/reports | modules/mobile/MobileReportsPage.tsx | отчёты |
| /mobile/reports/new | modules/mobile/MobileReportNewPage.tsx | новый отчёт |
| /mobile/reports/:id | modules/mobile/MobileReportDetailPage.tsx | детальная |
| /mobile/photos | modules/mobile/MobilePhotosPage.tsx | фотоотчёты |
| /mobile/dashboard | modules/mobile/MobileDashboardPage.tsx | дашборд |

## Module: Support (Поддержка)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /support/tickets | modules/support/SupportTicketsPage.tsx | список тикетов |
| /support/tickets/board | modules/support/TicketBoardPage.tsx | канбан-доска |
| /support/tickets/:id | modules/support/SupportTicketDetailPage.tsx | детальная тикета |
| /support/dashboard | modules/support/SupportDashboardPage.tsx | дашборд |

## Module: Closeout (Завершение проекта)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /closeout/dashboard | modules/closeout/CloseoutDashboardPage.tsx | дашборд |
| /closeout/commissioning | modules/closeout/CommissioningListPage.tsx | список ввода в эксплуатацию |
| /closeout/commissioning/board | modules/closeout/CommissioningBoardPage.tsx | доска |
| /closeout/commissioning/:id | modules/closeout/CommissioningDetailPage.tsx | детальная |
| /closeout/commissioning-templates | modules/closeout/CommissioningTemplateListPage.tsx | шаблоны |
| /closeout/commissioning-checklist | modules/closeout/CommissioningChecklistPage.tsx | чек-лист |
| /closeout/commissioning-page | modules/closeout/CommissioningPage.tsx | ввод в эксплуатацию |
| /closeout/handover | modules/closeout/HandoverPackageListPage.tsx | пакеты передачи |
| /closeout/handover/:id | modules/closeout/HandoverPackageDetailPage.tsx | детальная пакета |
| /closeout/handover-page | modules/closeout/HandoverPage.tsx | передача |
| /closeout/warranty | modules/closeout/WarrantyClaimListPage.tsx | гарантийные претензии |
| /closeout/warranty/:id | modules/closeout/WarrantyClaimDetailPage.tsx | детальная претензии |
| /closeout/warranty-obligations | modules/closeout/WarrantyObligationListPage.tsx | гарантийные обязательства |
| /closeout/warranty-page | modules/closeout/WarrantyPage.tsx | гарантия |
| /closeout/warranty-tracking | modules/closeout/WarrantyTrackingPage.tsx | отслеживание гарантий |
| /closeout/as-built | modules/closeout/AsBuiltTrackerPage.tsx | исполнительная документация |
| /closeout/zos | modules/closeout/ZosDocumentListPage.tsx | акты ЗОС |
| /closeout/zos-form | modules/closeout/ZosFormPage.tsx | форма ЗОС |
| /closeout/stroynadzor | modules/closeout/StroyNadzorPackagePage.tsx | пакет стройнадзора |
| /closeout/executive-schemas | modules/closeout/ExecutiveSchemasPage.tsx | исполнительные схемы |

## Module: Exec Docs (Исполнительная документация)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /exec-docs/aosr | modules/execDocs/AosrPage.tsx | акты АОСР |
| /exec-docs/ks6 | modules/execDocs/Ks6JournalPage.tsx | журнал КС-6 |
| /exec-docs/incoming-control | modules/execDocs/IncomingControlJournalPage.tsx | журнал входного контроля |
| /exec-docs/welding | modules/execDocs/WeldingJournalPage.tsx | сварочный журнал |
| /exec-docs/special-journals | modules/execDocs/SpecialJournalsPage.tsx | спец. журналы |

## Module: Marketplace

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /marketplace | modules/marketplace/MarketplaceListPage.tsx | каталог |
| /marketplace/installed | modules/marketplace/MarketplaceInstalledPage.tsx | установленные |
| /marketplace/:pluginId | modules/marketplace/MarketplaceDetailPage.tsx | детальная |

## Module: Email (Почта)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /mail | modules/email/MailPage.tsx | почтовый клиент |

## Module: Portfolio & CRM

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /portfolio/opportunities | modules/portfolio/OpportunitiesPage.tsx | возможности |
| /portfolio/opportunities/new | modules/portfolio/OpportunityFormPage.tsx | форма создания |
| /portfolio/opportunities/:id | modules/portfolio/OpportunityDetailPage.tsx | детальная |
| /portfolio/opportunities/:id/edit | modules/portfolio/OpportunityFormPage.tsx | форма редактирования |
| /portfolio/tenders | modules/portfolio/TendersPage.tsx | тендеры |
| /portfolio/tenders/new | modules/portfolio/BidFormPage.tsx | форма создания заявки |
| /portfolio/tenders/:id | modules/portfolio/BidDetailPage.tsx | детальная заявки |
| /portfolio/tenders/:id/edit | modules/portfolio/BidFormPage.tsx | форма редактирования заявки |
| /portfolio/bid-comparison | modules/portfolio/BidComparisonPage.tsx | сравнение заявок |
| /crm | _(redirect -> /crm/dashboard)_ | |
| /crm/leads | modules/crm/CrmLeadListPage.tsx | список лидов |
| /crm/leads/new | modules/crm/CrmLeadFormPage.tsx | форма создания лида |
| /crm/leads/:id | modules/crm/CrmLeadDetailPage.tsx | детальная лида |
| /crm/leads/:id/edit | modules/crm/CrmLeadFormPage.tsx | форма редактирования |
| /crm/dashboard | modules/crm/CrmDashboardPage.tsx | CRM дашборд |

## Module: Site Assessment & Prequalification

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /site-assessments | modules/siteAssessment/SiteAssessmentListPage.tsx | список оценок |
| /site-assessments/new | modules/siteAssessment/SiteAssessmentFormPage.tsx | форма создания |
| /site-assessments/:id | modules/siteAssessment/SiteAssessmentDetailPage.tsx | детальная |
| /site-assessments/:id/edit | modules/siteAssessment/SiteAssessmentFormPage.tsx | форма редактирования |
| /prequalifications | modules/prequalification/PrequalificationListPage.tsx | список преквалификаций |
| /prequalifications/new | modules/prequalification/PrequalificationFormPage.tsx | форма создания |
| /prequalifications/:id | modules/prequalification/PrequalificationDetailPage.tsx | детальная |
| /prequalifications/:id/edit | modules/prequalification/PrequalificationFormPage.tsx | форма редактирования |
| /insurance-certificates | modules/prequalification/InsuranceCertificateListPage.tsx | страховые сертификаты |
| /insurance-certificates/new | modules/prequalification/InsuranceCertificateFormPage.tsx | форма создания |
| /insurance-certificates/:id/edit | modules/prequalification/InsuranceCertificateFormPage.tsx | форма редактирования |

## Module: Legal (Юридический)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /legal/cases | modules/legal/LegalCaseListPage.tsx | список дел |
| /legal/cases/:id | modules/legal/LegalCaseDetailPage.tsx | детальная дела |
| /legal/templates | modules/legal/LegalTemplateListPage.tsx | шаблоны документов |

## Module: KEP (ЭЦП)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /kep/certificates | modules/kep/KepCertificateListPage.tsx | список сертификатов |
| /kep/certificates/:id | modules/kep/KepCertificateDetailPage.tsx | детальная сертификата |
| /kep/signing-requests | modules/kep/KepSigningRequestListPage.tsx | запросы на подпись |
| /kep/signing | modules/kep/KepSigningPage.tsx | подписание |
| /kep/verification | modules/kep/KepVerificationPage.tsx | проверка подписи |
| /kep/mchd | modules/kep/MchDListPage.tsx | МЧД |
| /settings/kep/certificates | modules/kep/KepCertificateListPage.tsx | сертификаты (настройки) |
| /settings/kep/certificates/:id | modules/kep/KepCertificateDetailPage.tsx | детальная (настройки) |
| /settings/kep/sign | modules/kep/KepSigningPage.tsx | подписание (настройки) |
| /settings/kep/verify | modules/kep/KepVerificationPage.tsx | проверка (настройки) |
| /settings/kep/mchd | modules/kep/MchDListPage.tsx | МЧД (настройки) |

## Module: Analytics & Reporting

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /analytics | modules/analytics/AnalyticsDashboardPage.tsx | дашборд аналитики |
| /analytics/kpi-achievements | modules/analytics/KpiAchievementsPage.tsx | достижения KPI |
| /analytics/bonus-calculations | modules/analytics/BonusCalculationsPage.tsx | расчёт бонусов |
| /analytics/audit-pivot | modules/analytics/AuditPivotPage.tsx | сводная аудита |
| /analytics/project-charts | modules/analytics/ProjectAnalyticsChartPage.tsx | графики проектов |
| /analytics/predictive | modules/analytics/PredictiveAnalyticsPage.tsx | предиктивная аналитика |
| /analytics/executive-kpi | modules/analytics/ExecutiveKpiDashboardPage.tsx | KPI руководства |
| /analytics/report-builder | modules/analytics/ReportBuilderPage.tsx | конструктор отчётов |
| /reports | modules/analytics/ReportsPage.tsx | отчёты |
| /kpi | modules/analytics/KpiPage.tsx | KPI |
| /monitoring | modules/monitoring/MonitoringDashboardPage.tsx | мониторинг |

## Module: Messaging & Calls

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /messaging | pages/MessagingPage.tsx | мессенджер |
| /messaging/favorites | pages/FavoritesPage.tsx | избранное |
| /messaging/calls | pages/CallsPage.tsx | звонки |

## Module: Portal (Портал заказчика)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /portal | modules/portal/PortalDashboardPage.tsx | дашборд |
| /portal/projects | modules/portal/PortalProjectListPage.tsx | проекты |
| /portal/documents | modules/portal/PortalDocumentListPage.tsx | документы |
| /portal/messages | modules/portal/PortalMessageListPage.tsx | сообщения |
| /portal/admin | modules/portal/PortalAdminPage.tsx | администрирование |
| /portal/contracts | modules/portal/PortalContractsPage.tsx | контракты |
| /portal/cp-approval | modules/portal/PortalCpApprovalPage.tsx | согласование КП |
| /portal/invoices | modules/portal/PortalInvoicesPage.tsx | счета |
| /portal/ks2-drafts | modules/portal/PortalKs2DraftsPage.tsx | черновики КС-2 |
| /portal/schedule | modules/portal/PortalSchedulePage.tsx | расписание |
| /portal/settings | modules/portal/PortalSettingsPage.tsx | настройки |
| /portal/tasks | modules/portal/PortalTaskListPage.tsx | задачи |
| /portal/defects | modules/portal/PortalDefectsPage.tsx | дефекты |
| /portal/signatures | modules/portal/PortalSignaturesPage.tsx | подписи |
| /portal/photos | modules/portal/PortalPhotoReportsPage.tsx | фотоотчёты |
| /portal/daily-reports | modules/portal/PortalDailyReportsPage.tsx | ежедневные отчёты |
| /portal/rfis | modules/portal/PortalRfiPage.tsx | запросы информации |

## Module: AI

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /ai-assistant | modules/ai/AiAssistantPage.tsx | AI-ассистент |
| /ai/photo-analysis | modules/ai/AiPhotoAnalysisPage.tsx | AI-анализ фото |
| /ai/risk-dashboard | modules/ai/AiRiskDashboardPage.tsx | AI-дашборд рисков |

## Module: Search

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /search | modules/search/GlobalSearchPage.tsx | глобальный поиск |

## Module: Approvals

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /approvals/config | modules/approval/ApprovalConfigPage.tsx | настройка согласований |

## Module: Notifications

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /notifications | modules/notifications/NotificationsPage.tsx | уведомления |
| /notifications/inbox | modules/notifications/InboxPage.tsx | входящие |

## Module: Settings & Admin

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /settings | modules/settings/SettingsPage.tsx | настройки |
| /settings/ai | modules/ai/AiSettingsPage.tsx | настройки AI |
| /settings/profile | modules/settings/ProfilePage.tsx | профиль |
| /settings/email-preferences | modules/settings/EmailPreferencesPage.tsx | настройки email |
| /settings/notification-preferences | modules/settings/NotificationPreferencesPage.tsx | настройки уведомлений |
| /settings/api-keys | modules/apiManagement/ApiKeysPage.tsx | API ключи |
| /settings/webhooks | modules/apiManagement/WebhooksPage.tsx | вебхуки |
| /settings/api-docs | modules/api-docs/ApiDocsPage.tsx | документация API |
| /settings/offline-queue | modules/settings/OfflineQueuePage.tsx | offline-очередь |
| /settings/offline-sync | modules/settings/OfflineSyncPage.tsx | offline-синхронизация |
| /settings/automation | modules/settings/automation/AutomationBuilderPage.tsx | конструктор автоматизации |
| /settings/edo | modules/settings/EdoConfigPage.tsx | настройки ЭДО |
| /admin/users | modules/settings/UsersAdminPage.tsx | пользователи |
| /admin/users/import | modules/admin/BulkUserImportPage.tsx | массовый импорт |
| /admin/permissions | modules/settings/PermissionsPage.tsx | разрешения |
| /admin/integrations | modules/settings/IntegrationsPage.tsx | интеграции |
| /admin/dashboard | modules/admin/AdminDashboardPage.tsx | дашборд администратора |
| /admin/departments | modules/admin/DepartmentPage.tsx | отделы |
| /admin/security | modules/admin/SecuritySettingsPage.tsx | безопасность |
| /admin/login-audit | modules/admin/LoginAuditPage.tsx | аудит входов |
| /admin/online-users | modules/admin/OnlineUsersPage.tsx | онлайн-пользователи |
| /admin/audit-logs | modules/admin/AuditLogPage.tsx | журнал аудита |
| /admin/settings | modules/settings/SettingsPage.tsx | настройки (алиас) |
| /admin/permission-matrix | modules/admin/PermissionMatrixPage.tsx | матрица разрешений |
| /admin/system-settings | modules/admin/SystemSettingsPage.tsx | системные настройки |
| /admin/tenants | modules/admin/TenantManagementPage.tsx | управление арендаторами |

## Module: Subscription (Подписка)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /settings/subscription | modules/subscription/SubscriptionDashboardPage.tsx | управление подпиской |
| /settings/subscription/result | modules/subscription/PaymentResultPage.tsx | результат оплаты |
| /feature-gate | modules/subscription/FeatureGatePage.tsx | ограничение функции |

## Module: 1C Integration

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /settings/1c | modules/integration1c/OneCDashboardPage.tsx | дашборд 1С |
| /settings/1c/ks-export | modules/integration1c/Ks2Ks3ExportPage.tsx | экспорт КС-2/КС-3 |
| /settings/1c/payment-export | modules/integration1c/PaymentExportPage.tsx | экспорт платежей |
| /settings/1c/bank-import | modules/integration1c/BankStatementImportPage.tsx | импорт выписок |
| /settings/1c/sync | modules/integration1c/ContractorSyncPage.tsx | синхронизация контрагентов |
| /settings/1c/nomenclature | modules/integration1c/NomenclatureSyncPage.tsx | синхронизация номенклатуры |
| /settings/1c/pricing-db | modules/integration1c/PricingDatabasePage.tsx | база ценообразования |

## Module: ISUP (ИСУП Минстроя)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /settings/isup | modules/isup/IsupConfigWizardPage.tsx | настройка ИСУП |
| /settings/isup/transmissions | modules/isup/IsupTransmissionDashboard.tsx | дашборд передачи |
| /settings/isup/mappings | modules/isup/IsupProjectMappingPage.tsx | маппинг проектов |

## Module: Integrations (Интеграции)

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /integrations | modules/integrations/IntegrationsPage.tsx | дашборд интеграций |
| /integrations/telegram | modules/integrations/TelegramPage.tsx | Telegram |
| /integrations/1c | modules/integrations/OneCSettingsPage.tsx | настройки 1С |
| /integrations/sbis | modules/integrations/SbisSettingsPage.tsx | СБИС |
| /integrations/edo | modules/integrations/EdoSettingsPage.tsx | ЭДО |
| /integrations/bim | modules/integrations/BimPage.tsx | BIM |
| /integrations/weather | modules/integrations/WeatherPage.tsx | погода |
| /integrations/gov-registries | modules/integrations/GovRegistriesPage.tsx | государственные реестры |
| /integrations/sms | modules/integrations/SmsSettingsPage.tsx | SMS |
| /integrations/webdav | modules/integrations/WebDavSettingsPage.tsx | WebDAV |
| /integrations/api-keys | modules/integrations/ApiKeysPage.tsx | API ключи интеграций |

## Module: Onboarding

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /onboarding/setup | modules/onboarding/SetupWizardPage.tsx | мастер настройки |

## Module: Help Center

| URL Path | Component File | Page Type |
|----------|---------------|-----------|
| /help | modules/help/HelpCenterPage.tsx | справочный центр |

## Module: Finance Legacy Redirects

| URL Path | Target | Type |
|----------|--------|------|
| /finance/budgets | /budgets | redirect |
| /finance/budgets/new | /budgets/new | redirect |
| /finance/budgets/:id | /budgets/:id | redirect |
| /finance/budgets/:id/edit | renders BudgetFormPage | legacy alias |
| /finance/budgets/:id/fm | renders FmPage | legacy alias |
| /finance/commercial-proposals | /commercial-proposals | redirect |
| /finance/commercial-proposals/new | /commercial-proposals/new | redirect |
| /finance/commercial-proposals/:id | renders CommercialProposalDetailPage | legacy alias |
| /finance/contracts | /contracts | redirect |
| /finance/estimates | /estimates | redirect |
| /finance/specifications | /specifications | redirect |
| /finance/invoices | /invoices | redirect |
| /finance/invoices/new | /invoices/new | redirect |
| /finance/invoices/:id | renders InvoiceDetailPage | legacy alias |
| /finance/payments | /payments | redirect |
| /finance/payments/new | /payments/new | redirect |
| /finance/payments/:id | renders PaymentDetailPage | legacy alias |

---

## Unrouted Pages (files that exist but have NO route defined)

These pages exist as `.tsx` files in `modules/` or `pages/` but are NOT referenced in any route file.

| Component File | Module | Probable Page Type |
|---------------|--------|-------------------|
| modules/planning/CriticalPathPage.tsx | planning | критический путь |
| modules/planning/ScheduleBaselinePage.tsx | planning | базовый план |
| modules/planning/WbsTreePage.tsx | planning | дерево WBS |
| modules/tasks/MyTasksPage.tsx | tasks | мои задачи |
| modules/support/TicketDetailPage.tsx | support | детальная тикета (дубль) |
| modules/support/TicketListPage.tsx | support | список тикетов (дубль) |
| modules/dataExchange/DataExportPage.tsx | dataExchange | экспорт (дубль; ExportJobListPage is routed) |
| modules/dataExchange/DataImportPage.tsx | dataExchange | импорт (дубль; ImportJobListPage is routed) |
| modules/dataExchange/DataMappingPage.tsx | dataExchange | маппинг (дубль; MappingConfigPage is routed) |
| modules/dataExchange/OneCExchangeLogPage.tsx | dataExchange | логи (файл есть, но лениво импортируется другой) |
| modules/revenueRecognition/RecognitionPeriodPage.tsx | revenueRecognition | периоды признания (дубль) |
| modules/revenueRecognition/RevenueContractsPage.tsx | revenueRecognition | контракты (дубль) |
| pages/GanttPage.tsx | pages | диаграмма Ганта (legacy) |
| pages/TaskListPage.tsx | pages | список задач (legacy) |
| pages/TaskDetailPanel.tsx | pages | панель задачи (компонент, не страница) |
| modules/selfEmployed/RegistryListPage.tsx | selfEmployed | реестры самозанятых (дубль) |
| modules/selfEmployed/PaymentListPage.tsx | selfEmployed | платежи самозанятых (дубль) |
| modules/safety/SafetyTrainingFormPage.tsx | safety | форма обучения (дубль; SafetyTrainingFormPage routed in hrRoutes) |

> Note: Some "unrouted" files are actually duplicates -- the route file lazily imports a different file from the same module (e.g., `ImportJobListPage` vs `DataImportPage`). The route still works; the extra file is dead code or an older version.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total unique URL paths (non-redirect) | ~495 |
| Redirect aliases | ~26 |
| Total route entries | ~521 |
| Unique component files referenced | ~430 |
| Page files in modules/ | ~480 |
| Pages in pages/ (top-level) | 9 |
| Unrouted page files | ~18 |
| Domain modules | 55+ |
