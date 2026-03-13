# PRIVOD Platform — Architecture Summary

> Auto-generated: 2026-03-12

---

## General Statistics

| Metric | Count |
|--------|-------|
| **Backend API endpoints** | 2 493 |
| **Backend controllers** | 308 |
| **Backend services** | 352 |
| **JPA entities (models)** | 591 |
| **Flyway migrations** | 304 (V0001–V1126) |
| **Frontend pages (routed)** | ~495 |
| **Frontend redirect aliases** | ~26 |
| **Frontend unrouted pages** | ~18 |
| **Frontend route definition files** | 15 |
| **Frontend API modules** | 120+ |
| **Zustand stores** | 11 |
| **Custom React hooks** | 18 |
| **Design system components** | 33 |
| **Shared UI components** | 51 |
| **Utility/lib files** | 22 |
| **Scheduled backend jobs** | 13 |
| **i18n keys** | ~25 000 per language (ru, en) |
| **Backend modules** | 91 |
| **Frontend domain modules** | 55+ |

---

## Domain Modules

### Core Business

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Проекты | projects | 6 endpoints | ProjectListPage, ProjectDetailPage, ProjectFormPage | Core project management |
| Задачи | task | 53 endpoints, 16 entities | TaskListPage, TaskBoardPage, TaskDetailPage | Tasks, stages, dependencies, Kanban board |
| Контракты | contract | endpoints | ContractListPage, ContractDetailPage | Contract management, amendments |
| Документы | document | endpoints | DocumentListPage, CDE pages | Document management, CDE |
| Календарь | calendar | endpoints | CalendarPage, GanttPage | Project calendar, Gantt charts |

### Finance & Estimates

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Финансы | finance | 94 endpoints, 14 controllers | BudgetListPage, InvoiceListPage, PaymentListPage, FmPage | Budgets, invoices, payments, cash flow |
| Сметы | estimate | 12 entities | EstimateListPage, EstimateDetailPage, LsrImportWizard | Local estimates (LSR), GRAND-Smeta import |
| Спецификации | specification | endpoints | SpecificationListPage, SpecificationDetailPage | Material specifications, pricing |
| Коммерческие предложения | commercialProposal | endpoints | CpWorksTab, CpMaterialsTab | Commercial proposals |
| Управление стоимостью | costManagement | 58 endpoints | CostCodePages | Cost codes, WBS |
| Закрытие | closing | endpoints | KS-2, KS-3 pages | Construction closing documents (КС-2/КС-3) |
| Бухгалтерия | accounting | 17 entities | Accounting pages | Journal entries, reports |
| Ценообразование | pricing | endpoints | PricingDatabaseListPage | Pricing database |

### HR & Safety

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Кадры | hr | 12 entities | EmployeeListPage, TimesheetListPage, CrewPage | Employees, timesheets, crews |
| HR Российский | hrRussian | 16 entities | HR Russian pages | Russian-specific HR (T-2, T-13 forms) |
| Безопасность | safety | 76 endpoints, 19 entities | SafetyIncidentListPage, SafetyTrainingListPage | Incidents, trainings, inspections, briefings |
| Отпуска | leave | endpoints | LeaveListPage, LeaveBoardPage | Leave management |

### Operations & Logistics

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Операции | ops | endpoints | WorkOrderListPage | Work orders |
| Склад | warehouse | 63 endpoints, 12 entities | MaterialListPage, stock pages | Materials, stock movements, locations |
| Закупки | procurementExt | endpoints | PurchaseOrderPages, DispatchPages | Purchase orders, dispatch |
| Автопарк | fleet | 61 endpoints | VehicleListPage, WaybillPages | Vehicles, waybills, maintenance |
| Мониторинг/IoT | monitoring | endpoints | MonitoringDashboardPage | IoT sensors, site monitoring |

### Quality & Compliance

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Качество | quality | 15 entities | QualityInspectionPages, NonConformancePages | Inspections, non-conformances |
| Дефекты | defect | endpoints | DefectListPage | Defect tracking |
| Пунч-листы | punchlist | endpoints | PunchlistPages | Punch list management |
| Нормативка | regulatory | endpoints | PermitListPage, LicensePages | Permits, licenses, compliance |
| ПТО | pto | 18 entities | SubmittalPages, RfiPages | Submittals, RFI |

### Construction-Specific

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| BIM | bim | 79 endpoints, 18 entities | BimViewerPage, BimIssuePages | BIM model viewer, BCF issues |
| Планирование | planning | 64 endpoints, 12 entities | GanttPage, SchedulePages | Scheduling, critical path, baselines |
| Завершение проекта | closeout | 57 endpoints | CloseoutPages | Project closeout workflows |
| Исполнительная документация | russianDoc | 17 entities | ExecDocsPages | AOSR, hidden work acts, journals |
| Управление изменениями | changeManagement | endpoints | ChangeEventListPage, ChangeOrderPages | Change events, change orders |

### CRM & Portal

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| CRM | crm | endpoints | CrmLeadPages, ActivityPages | Leads, contacts, activities |
| Портфель | portfolio | endpoints | PortfolioHealthPage, TendersPage | Portfolio health, bid packages |
| Клиентский портал | portal | 78 endpoints, 11 entities | PortalDashboard, PortalDocuments, PortalTasks | Client-facing portal |
| Поддержка | support | endpoints | SupportDashboardPage, TicketPages | Support ticket system |
| Сообщения | messaging | 16 entities | MessagingPage, ChannelPages | Internal messaging, channels |
| Email | email | endpoints | MailPage, ComposeModal | Email client |

### Analytics & AI

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Аналитика | analytics | 85 endpoints, 17 entities | DashboardPage, ReportPages | Dashboards, KPIs, reports |
| AI | ai | endpoints | AiChatWidget | AI assistant, analysis |

### Integrations

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Интеграции | integration | 81 endpoints, 26 entities | IntegrationPages | External system connectors |
| 1C | integration1c | endpoints | Integration1cPages | 1C accounting sync |
| ИСУП | isup | endpoints | IsupPages | Russian ISUP regulatory system |
| КЭП/ЭЦП | kep | endpoints | KepPages | Digital signatures |
| ЭДО | edo | endpoints | EdoPages | Electronic document exchange |
| Маркетплейс | marketplace | endpoints | MarketplacePage | Plugin marketplace |
| Подписки | subscription | endpoints | PricingPage, SubscriptionPages | SaaS billing, YooKassa |

### Settings & Admin

| Module (RU) | Module (EN) | Backend | Frontend | Description |
|-------------|-------------|---------|----------|-------------|
| Авторизация | auth | endpoints, 11 entities | LoginPage, RegisterPage, ForgotPasswordPage | Auth, RBAC, users |
| Настройки | settings | endpoints | SettingsPages, PermissionsPage, UsersAdminPage | System settings, admin |

---

## Technology Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.4.1 |
| Build | Gradle (Kotlin DSL) |
| Database | PostgreSQL 15+ (port 15432) |
| Migrations | Flyway (304 migrations, V0001–V1126) |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security + JWT (HMAC-SHA) |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| WebSocket | STOMP over SockJS |
| Email | Spring Mail (MailHog for dev) |
| PDF | Custom PdfReportService |
| Mapping | MapStruct + Lombok |
| API Docs | Swagger / OpenAPI 3.0 |
| Audit | Custom AuditService + AuditLog entity |
| Scheduling | Spring @Scheduled (13 cron jobs) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.7 |
| Framework | React 19 |
| Bundler | Vite 6 (port 4000) |
| State | Zustand 5 (11 stores, 4 with localStorage persist) |
| Server data | TanStack React Query |
| Styling | Tailwind CSS (dark mode: `class` strategy) |
| Icons | Lucide React |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| i18n | Custom `t(key)` (~25k keys, ru + en) |
| HTTP | Axios (JWT interceptor, refresh rotation) |
| Routing | React Router 6 (15 route files) |
| Virtualization | @tanstack/react-virtual |
| PDF/Print | Custom print templates |
| PWA | Service Worker + InstallPrompt + OfflineBanner |
| Offline | IndexedDB + sync queue |
| WebSocket | SockJS + STOMP |
| WebRTC | Peer connections for calls |
| Testing | Vitest (unit) + Playwright (E2E) |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Containers | Docker Compose (4 services: postgres, redis, minio, mailhog) |
| Backups | Automated daily PostgreSQL backup (cron + backup-db.sh) |
| Monitoring | Sentry (frontend), RequestLoggingFilter (backend), /api/health |
| CI/CD | Build + typecheck + test gate |
| Multi-tenancy | organizationId-based isolation (TenantFilterInterceptor) |

---

## Architecture Files Index

| File | Lines | Content |
|------|-------|---------|
| `docs/architecture/routes.md` | 4 503 | All 2 493 backend API endpoints grouped by 91 modules |
| `docs/architecture/pages.md` | 1 131 | All ~521 frontend routes + 18 unrouted pages |
| `docs/architecture/models.md` | 11 983 | All 591 JPA entities + 304 Flyway migrations |
| `docs/architecture/services.md` | 7 641 | All 352 backend services with dependencies and methods |
| `docs/architecture/shared.md` | 412 | Shared code: 51 components, 33 design system, 18 hooks, 22 utils, 11 stores |
| `docs/architecture/summary.md` | (this file) | Overview statistics, module list, tech stack |
| **Total** | **~25 670** | |
