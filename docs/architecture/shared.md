# Shared Code & Infrastructure Map

## 1. Frontend Shared Components (`components/`)

| Component | File | Description |
|-----------|------|-------------|
| `ProtectedRoute` | `ProtectedRoute.tsx` | RBAC route guard; checks user role against `routePermissions` before rendering |
| `CanAccess` | `CanAccess.tsx` | Conditional render wrapper; shows children only if user has required roles/permissions |
| `ErrorBoundary` | `ErrorBoundary.tsx` | React class error boundary; catches render errors, shows fallback UI |
| `RouteErrorBoundary` | `RouteErrorBoundary.tsx` | Error boundary variant for React Router error handling |
| `ErrorFallback` | `ErrorFallback.tsx` | Presentational error UI with title, message, and retry button |
| `NotificationDropdown` | `NotificationDropdown.tsx` | TopBar dropdown showing real-time WebSocket notifications |
| `CookieConsent` | `CookieConsent.tsx` | GDPR/152-FZ cookie consent banner, mounted in App.tsx |
| `OfflineBanner` | `OfflineBanner.tsx` | Banner shown when browser goes offline (PWA support) |
| `InstallPrompt` | `InstallPrompt.tsx` | PWA install prompt UI |
| `KanbanColumn` | `KanbanColumn.tsx` | Reusable Kanban board column (memoized) |
| `TaskCard` | `TaskCard.tsx` | Kanban task card with priority, assignee, dates (memoized) |
| `PriorityBadge` | `PriorityBadge.tsx` | Color-coded priority indicator badge (memoized) |
| `AssigneeAvatar` | `AssigneeAvatar.tsx` | User avatar component with initials fallback (memoized) |
| `DropZone` | `DropZone.tsx` | Drag-and-drop file upload zone |
| `BarcodeScanner` | `BarcodeScanner.tsx` | Camera-based barcode scanner for warehouse operations |
| `ImageLightbox` | `ImageLightbox.tsx` | Full-screen image viewer overlay |
| `FeedbackWidget` | `FeedbackWidget.tsx` | In-app user feedback collection widget |
| `SupportTicketWidget` | `SupportTicketWidget.tsx` | Floating support ticket creation widget |
| **Messaging** | | |
| `ChannelList` | `ChannelList.tsx` | Chat channel list sidebar |
| `MessageBubble` | `MessageBubble.tsx` | Chat message bubble with reactions (memoized) |
| `MessageInput` | `MessageInput.tsx` | Rich message input with file attachments, mentions |
| `ThreadPanel` | `ThreadPanel.tsx` | Message thread/reply panel |
| `MentionPopup` | `MentionPopup.tsx` | @mention autocomplete popup |
| `EmojiPicker` | `EmojiPicker.tsx` | Emoji selection grid |
| `ReplyQuote` | `ReplyQuote.tsx` | Quoted reply preview |
| `ForwardModal` | `ForwardModal.tsx` | Message forward to channel/user modal |
| `DateSeparator` | `DateSeparator.tsx` | Date separator between message groups + `shouldShowDateSeparator()` helper |
| `TypingIndicator` | `TypingIndicator.tsx` | "User is typing..." animation |
| `VoiceRecorder` | `VoiceRecorder.tsx` | Audio message recorder |
| `ConflictResolutionModal` | `ConflictResolutionModal.tsx` | Offline sync conflict resolution UI + `ConflictListModal` |
| **Calls** | | |
| `CallDialog` | `CallDialog.tsx` | Voice/video call dialog (ringing, active, ended states) |
| `CallOverlay` | `CallOverlay.tsx` | Minimized call overlay |
| `IncomingCallModal` | `IncomingCallModal.tsx` | Incoming call notification modal |
| **Print Templates** | | |
| `Ks2PrintTemplate` | `PrintTemplates/Ks2PrintTemplate.tsx` | KS-2 construction act PDF/print template |
| `EstimatePrintTemplate` | `PrintTemplates/EstimatePrintTemplate.tsx` | Estimate PDF/print template |
| `CpPrintTemplate` | `PrintTemplates/CpPrintTemplate.tsx` | Commercial proposal PDF/print template |
| `InvoicePrintTemplate` | `PrintTemplates/InvoicePrintTemplate.tsx` | Invoice PDF/print template |
| **AI Chat** | | |
| `AiChatWidget` | `AiChatWidget/AiChatWidget.tsx` | Floating AI assistant chat widget |
| `ChatHeader` | `AiChatWidget/ChatHeader.tsx` | AI chat header bar |
| `ChatInput` | `AiChatWidget/ChatInput.tsx` | AI chat input with tool call support |
| `ChatMessageList` | `AiChatWidget/ChatMessageList.tsx` | AI chat message list |
| `useAiChat` | `AiChatWidget/useAiChat.ts` | AI chat hook (state, streaming, tool execution) |
| `pageContext` | `AiChatWidget/pageContext.ts` | Builds page-aware system prompt for AI from current route |
| `toolDefinitions` | `AiChatWidget/toolDefinitions.ts` | OpenAI-format tool definitions for AI agent (832+ lines) |
| **Assistant** | | |
| `AssistantWidget` | `AssistantWidget/AssistantWidget.tsx` | Help/assistant floating widget |
| `SupportPanel` | `AssistantWidget/SupportPanel.tsx` | Support panel with FAQ and ticket creation |
| **UI** | | |
| `EditableCell` | `ui/EditableCell.tsx` | Inline-editable table cell component |

---

## 2. Design System (`design-system/`)

### Tokens (`tokens/`)

| Token File | Purpose |
|------------|---------|
| `colors.ts` | Color palette (primary, neutral, semantic) |
| `typography.ts` | `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` |
| `spacing.ts` | `spacing` scale (0-96) + `borderRadius` scale |
| `shadows.ts` | `shadows` elevation scale (sm, md, lg, xl) |
| `layout.ts` | `layout` constants (sidebar width, topbar height, breakpoints) + `tw` Tailwind class map |
| `zIndex.ts` | `zIndex` token map (dropdown, modal, toast, overlay, max) |
| `index.ts` | Re-exports all tokens |

### Components

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `Button/index.tsx` | Primary button with variants, sizes, loading state |
| `DataTable` | `DataTable/index.tsx` | Full-featured data table: sorting, filtering, pagination, selection, inline edit, card view |
| `DataTablePagination` | `DataTable/DataTablePagination.tsx` | Pagination sub-component |
| `DataTableToolbar` | `DataTable/DataTableToolbar.tsx` | Toolbar with search, filters, view toggle |
| `DataTableCardView` | `DataTable/DataTableCardView.tsx` | Card/grid view mode for DataTable |
| `InlineEditCell` | `DataTable/InlineEditCell.tsx` | Inline cell editing within DataTable |
| `VirtualDataTable` | `VirtualDataTable/index.tsx` | Virtualized table for large datasets (1000+ rows) |
| `FormField` | `FormField/index.tsx` | Form field wrapper with label, error, hint. Exports `Input`, `Textarea`, `Select`, `Checkbox` |
| `MaskedInput` | `FormField/MaskedInput.tsx` | Input with mask (phone, INN, etc.) |
| `ConditionalField` | `FormField/ConditionalField.tsx` | Conditionally visible form field |
| `FieldGroup` | `FormField/FieldGroup.tsx` | Grouped form fields layout |
| `Modal` | `Modal/index.tsx` | Overlay modal dialog with close, title, actions |
| `ConfirmDialog` | `ConfirmDialog/index.tsx` | Confirm/cancel dialog + `provider.tsx` context provider |
| `PageHeader` | `PageHeader/index.tsx` | Page title bar with breadcrumbs, actions, back button |
| `StatusBadge` | `StatusBadge/StatusBadge.tsx` | Color-coded status/type badge |
| `statusConfig` | `StatusBadge/statusConfig.ts` | 80+ status/type/priority color maps and label maps for all entities |
| `MetricCard` | `MetricCard/index.tsx` | KPI metric card with icon, trend, sparkline |
| `Sidebar` | `Sidebar/index.tsx` | Main navigation sidebar with collapsible groups |
| `TopBar` | `TopBar/index.tsx` | Top navigation bar with search, notifications, user menu |
| `Skeleton` | `Skeleton/index.tsx` | Loading skeletons: `Skeleton`, `TableSkeleton`, `MetricCardSkeleton`, `PageSkeleton` |
| `EmptyState` | `EmptyState/index.tsx` | Empty data placeholder with icon and action button |
| `PivotTable` | `PivotTable/index.tsx` | Pivot/cross-tab analysis table |
| `DatePicker` | `DatePicker/index.tsx` | Date input with calendar picker (forwardRef) |
| `FileUpload` | `FileUpload/index.tsx` | File upload with drag-drop, preview, progress |
| `Combobox` | `Combobox/index.tsx` | Searchable select/combobox |
| `DropdownMenu` | `DropdownMenu/index.tsx` | Context/action dropdown menu |
| `CommandPalette` | `CommandPalette/index.tsx` | Cmd+K command palette for quick navigation |
| `ImportWizard` | `ImportWizard/index.tsx` | Multi-step data import wizard (xlsx/csv mapping) |
| `DetailDrawer` | `DetailDrawer/index.tsx` | Side-panel drawer for record details |
| `HoverCard` | `HoverCard/index.tsx` | Hover-triggered info popover |
| `ActivityTimeline` | `ActivityTimeline/index.tsx` | Activity/audit log timeline |
| `ApprovalTimeline` | `ApprovalTimeline/index.tsx` | Document approval workflow timeline |
| `AuditFooter` | `AuditFooter/index.tsx` | Created/updated audit metadata footer |
| `RecordLayout` | `RecordLayout/index.tsx` | Standard record detail page layout |
| `StagePath` | `StagePath/index.tsx` | Visual pipeline/stage progress indicator |
| `HealthScore` | `HealthScore/index.tsx` | Project health RAG score widget |
| `Sparkline` | `Sparkline/index.tsx` | Inline sparkline chart |
| `BatteryWidget` | `BatteryWidget/index.tsx` | Battery/gauge style progress indicator |
| `TimePeriodSelector` | `TimePeriodSelector/index.tsx` | Time period filter (day/week/month/quarter/year) |
| `Fab` | `Fab/index.tsx` | Floating action button |
| `FileAttachmentPanel` | `FileAttachmentPanel/index.tsx` | File attachment list with upload/delete |
| `LazyImage` | `LazyImage/index.tsx` | Lazy-loaded image with blur placeholder |
| `AvatarImage` | `LazyImage/AvatarImage.tsx` | Avatar-specific lazy image variant |
| `BottomNav` | `BottomNav/index.tsx` | Mobile bottom navigation bar |
| `OfflineIndicator` | `OfflineIndicator/index.tsx` | Offline status indicator dot |
| `ShortcutsHelp` | `ShortcutsHelp/index.tsx` | Keyboard shortcuts help overlay |

---

## 3. Hooks (`hooks/`)

| Hook | File | Description |
|------|------|-------------|
| `usePermissions` | `usePermissions.ts` | Returns `{ hasRole, hasAnyRole, canAccess }` based on current user role |
| `useModelAccess` | `useModelAccess.ts` | Backend model-level access check hook |
| `useTheme` | `useTheme.ts` | Zustand store: `mode` (light/dark/system), `resolvedTheme`, `setMode` |
| `useMediaQuery` | `useMediaQuery.ts` | Generic media query hook + `useIsMobile()` + `useIsTablet()` |
| `useKeyboardShortcuts` | `useKeyboardShortcuts.ts` | Register keyboard shortcut handlers |
| `useTaskShortcuts` | `useTaskShortcuts.ts` | Task-specific keyboard shortcuts (edit, close, navigate) |
| `useWebSocket` | `useWebSocket.ts` | STOMP WebSocket: `useWebSocket`, `useProjectNotifications`, `useUserNotifications` |
| `useStompClient` | `useStompClient.ts` | Low-level STOMP client hook with connect/disconnect lifecycle |
| `useWebRTC` | `useWebRTC.ts` | WebRTC peer connection hook for voice/video calls |
| `useOptimisticMutation` | `useOptimisticMutation.ts` | TanStack Query wrapper for optimistic UI updates with rollback |
| `useOfflineSync` | `useOfflineSync.ts` | Offline data sync with debounced auto-sync |
| `useOfflineDraft` | `useOfflineDraft.ts` | IndexedDB-backed form draft persistence |
| `useOfflineStatus` | `useOfflineStatus.ts` | Online/offline status detection |
| `useFormDraft` | `useFormDraft.ts` | Form draft auto-save to localStorage |
| `useFeatureFlag` | `useFeatureFlag.ts` | Feature flag check hook |
| `useAnalytics` | `useAnalytics.ts` | Page view and event tracking hook |
| `useReferenceData` | `useReferenceData.ts` | Generic hook for fetching/caching reference data with React Query |
| `useSelectOptions` | `useSelectOptions.ts` | Pre-built select option hooks: `useProjectOptions`, `useContractOptions`, `useEmployeeOptions`, `useUserOptions`, `usePartnerOptions`, etc. |

---

## 4. Utilities / Libraries (`lib/`)

| File | Exports | Description |
|------|---------|-------------|
| `cn.ts` | `cn(...inputs)` | Tailwind class name merger (clsx + tailwind-merge) |
| `format.ts` | `formatMoney`, `formatNumber`, `formatPercent`, `formatDate`, `formatDateTime`, `formatFileSize`, `formatCountRu` | All number/date/file formatting (Russian locale) |
| `uuid.ts` | `isUuid(value)`, `asUuidOrUndefined(value)` | UUID validation helpers |
| `export.ts` | `exportToCsv(...)` | CSV export from table data |
| `printDocument.ts` | `printDocument(...)`, `formatRuMoney`, `formatRuNumber` | HTML-to-print document generator |
| `logger.ts` | `log` | Structured logger (info/warn/error/debug) with environment-aware behavior |
| `sentry.ts` | `initSentry()` | Sentry error tracking initialization |
| `analytics.ts` | `initAnalytics()`, `trackPageView()`, `trackEvent()`, `trackUser()` | Analytics/telemetry functions |
| `demoMode.ts` | `isDemoMode`, `guardDemoModeAction`, `notifyDemoModeBlockedAction` | Demo mode write-blocking utilities |
| `queryDefaults.ts` | `QUERY_STALE_TIMES`, `referenceQueryOptions`, `formPageQueryOptions`, `queryClientDefaults` | TanStack Query cache timing presets |
| `websocket.ts` | `wsClient` (WebSocketClient) | STOMP over SockJS WebSocket client singleton |
| `offlineDb.ts` | `createOfflineRecord(...)` | IndexedDB wrapper for offline data storage |
| `offlineCache.ts` | `withOfflineFallback(...)` | Offline-first data fetching with IndexedDB cache fallback |
| `syncQueue.ts` | `useSyncQueue` (Zustand store) | Offline mutation sync queue with retry |
| `pushNotifications.ts` | `getPushPermission()` | Push notification registration helpers |
| `notificationSound.ts` | `playNotificationSound()` | Audio notification sound player |
| `imageOptimization.ts` | `supportsWebP()`, `generateSrcSet()`, `lazyImageProps()` | Image optimization with WebP detection, responsive srcset |
| `dadata.ts` | `isDadataConfigured()`, `mapDadataToCounterparty(party)` | DaData.ru API integration for Russian company lookup |
| `parseLsr.ts` | `parseLsrFile(file)` | Simple LSR xlsx parser |
| `parseFullLsr.ts` | `parseFullLsrFile(file)`, `parseFullLsrRows(...)` | Full GRAND-Smeta LSR xlsx parser with hierarchy |
| `monteCarlo.ts` | `runMonteCarloSimulation(...)` | Monte Carlo simulation for project risk/schedule analysis |
| `sCurve.ts` | `computeSCurve()`, `generatePlannedDistribution()` | S-curve cost/progress calculation |

---

## 5. Stores (Zustand) (`stores/`)

| Store | File | State Shape | Persistence |
|-------|------|-------------|-------------|
| `useAuthStore` | `authStore.ts` | `{ user, token, refreshToken, isAuthenticated, redirectAfterLogin }` | localStorage `privod-auth` |
| `useSidebarStore` | `sidebarStore.ts` | `{ collapsed, mobileOpen }` | localStorage (manual) |
| `useNotificationStore` | `notificationStore.ts` | `{ unreadCount, recentNotifications[] }` | None (volatile) |
| `useMessagingStore` | `messagingStore.ts` | `{ channels[], messages{}, unreadCounts{}, activeChannelId, searchQuery }` | None (volatile) |
| `useUnreadStore` | `unreadStore.ts` | `{ messagingUnread }` | None (volatile) |
| `useDashboardStore` | `dashboardStore.ts` | `{ activeWidgets[] }` | localStorage `privod-dashboard-widgets` |
| `useFavoritesStore` | `favoritesStore.ts` | `{ favorites[], recents[] }` (max 30/20) | localStorage `privod-favorites` |
| `useTaskBoardStore` | `taskBoardStore.ts` | `{ viewMode, columns[], sortBy, filters, searchQuery, selectedTaskIds }` | None (volatile) |
| `useOnboardingStore` | `onboardingStore.ts` | `{ dismissed, steps[] }` | localStorage `privod-onboarding` |
| `useOfflineQueue` | `offlineQueue.ts` | `{ queue[], isOnline, pendingSync }` | localStorage `privod-offline-queue` |
| `usePortalSettingsStore` | `portalSettingsStore.ts` | `{ branding, visibility, notifications }` | localStorage (persist) |

---

## 6. Config Files (`config/`)

| File | Purpose |
|------|---------|
| `navigation.ts` | Sidebar navigation: 16 groups, 142 items. Each has `key`, `label` (i18n), `icon` (Lucide), `href`, optional `roles` |
| `routePermissions.ts` | RBAC route permission matrix: `routePermissions: Record<string, UserRole[]>` mapping URL patterns to allowed roles |

---

## 7. API Layer (`api/`)

### Core

| File | Description |
|------|-------------|
| `client.ts` | Axios instance (baseURL `/api`, 30s timeout). JWT interceptor, 401 refresh rotation, demo mode blocking |

### Domain API Modules (120+ files)

| File | Endpoints (prefix `/api/`) |
|------|---------------------------|
| `auth.ts` | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password` |
| `projects.ts` | `/projects` CRUD, search, status updates |
| `tasks.ts` | `/tasks` CRUD + board views, favorites, dependencies, stages |
| `finance.ts` | `/budgets` CRUD, `/budgets/{id}/items`, `/budgets/{id}/summary` |
| `estimates.ts` | `/estimates` CRUD, `/estimates/{id}/lines`, LSR import |
| `contracts.ts` | `/contracts` CRUD, amendments |
| `documents.ts` | `/documents` CRUD, versions, download |
| `specifications.ts` | `/specifications` CRUD, items, push-to-FM |
| `closing.ts` | `/ks2`, `/ks3` closing document CRUD |
| `procurement.ts` | `/purchase-requests`, `/purchase-orders` CRUD |
| `warehouse.ts` | `/materials`, `/stock-movements`, `/warehouse-locations` |
| `hr.ts` | `/employees`, `/timesheets`, `/departments`, `/crews` |
| `safety.ts` | `/safety-incidents`, `/safety-trainings`, `/safety-inspections` |
| `quality.ts` | `/quality/non-conformances`, `/quality/inspections` |
| `portal.ts` | `/portal/*` client portal endpoints |
| `analytics.ts` | `/analytics/*` dashboard analytics |
| `notifications.ts` | `/notifications` CRUD, mark-read |
| `messaging.ts` | `/messaging/channels`, `/messaging/messages` |
| `email.ts` | `/email/messages`, `/email/send` |
| `fleet.ts` | `/fleet/vehicles`, `/fleet/waybills`, `/fleet/maintenance` |
| `regulatory.ts` | `/regulatory/permits`, `/regulatory/licenses` |
| `calendar.ts` | `/calendar/events`, planning views |
| `pricing.ts` | `/pricing-database` CRUD |
| `settings.ts` | `/settings/*` system settings |
| `admin.ts` | `/admin/users`, `/admin/organizations`, `/admin/roles` |
| `permissions.ts` | `/permissions/matrix`, role assignments |
| `dashboard.ts` | `/dashboard/summary`, `/dashboard/kpi` |
| `support.ts` | `/support/tickets` CRUD |
| `ai.ts` | `/ai/chat`, `/ai/analyze` |
| `bim.ts` | `/bim/models`, `/bim/issues` |
| `portfolio.ts` | `/portfolio/*` bid packages, portfolio health |
| `changeManagement.ts` | `/change-events`, `/change-orders` |
| `crm.ts` | `/crm/*` leads, contacts, activities |
| `integration1c.ts` | `/integration/1c/*` 1C accounting sync |
| `isup.ts` | `/isup/*` Russian ISUP regulatory system |
| `kep.ts` | `/kep/*` digital signature (KEP/EDS) |
| `edo.ts` | `/edo/*` electronic document exchange |
| `marketplace.ts` | `/marketplace/*` plugin marketplace |
| `subscription.ts` | `/subscription/*` SaaS billing |

*(+ ~50 more domain API files for costManagement, bidManagement, closeout, rfi, punchlist, defects, dailylog, submittals, risks, milestones, planning, monitoring, integrations, insurance, dispatch, reportBuilder, iot, mobile, accounting, leave, search, etc.)*

---

## 8. i18n (`i18n/`)

| File | Purpose |
|------|---------|
| `index.ts` | `t(key, params?)` translation function, `useLocale()` hook, `setLocale()`, supports `'ru' \| 'en'` |
| `ru.ts` | Russian translations (~25k lines), primary language |
| `en.ts` | English translations (~25k lines), structurally identical to `ru.ts` |

---

## 9. Backend Infrastructure (`infrastructure/`)

### Security

| Class | File | Purpose |
|-------|------|---------|
| `SecurityConfig` | `security/SecurityConfig.java` | Spring Security filter chain: JWT + API key + rate limit, CORS, BCrypt |
| `JwtTokenProvider` | `security/JwtTokenProvider.java` | JWT generation, validation, claim extraction |
| `JwtAuthenticationFilter` | `security/JwtAuthenticationFilter.java` | OncePerRequestFilter: JWT from Authorization header |
| `RateLimitFilter` | `security/RateLimitFilter.java` | Request rate limiting filter |
| `SecurityUtils` | `security/SecurityUtils.java` | `getCurrentUserId()`, `getCurrentOrganizationId()`, `hasRole()` |
| `FieldEncryptionService` | `security/FieldEncryptionService.java` | AES encryption for sensitive fields |
| `SsrfProtectionService` | `security/SsrfProtectionService.java` | SSRF protection for external URLs |
| `CheckModelAccess` | `security/CheckModelAccess.java` | Annotation for model-level access control |
| `ModelAccessAspect` | `security/ModelAccessAspect.java` | AOP aspect enforcing `@CheckModelAccess` |

### Persistence

| Class | File | Purpose |
|-------|------|---------|
| `BaseEntity` | `persistence/BaseEntity.java` | UUID `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `version`, `deleted` |
| `TenantFilterInterceptor` | `persistence/TenantFilterInterceptor.java` | Multi-tenant data isolation |

### Web

| Class | File | Purpose |
|-------|------|---------|
| `ApiResponse<T>` | `web/ApiResponse.java` | Standard response: `{ success, data, error, timestamp, requestId }` |
| `PageResponse<T>` | `web/PageResponse.java` | Paginated response: `{ content[], page, size, totalElements, totalPages }` |
| `GlobalExceptionHandler` | `web/GlobalExceptionHandler.java` | @RestControllerAdvice: all exception types |
| `RequestLoggingFilter` | `web/RequestLoggingFilter.java` | HTTP request/response logging |
| `HealthCheckController` | `web/HealthCheckController.java` | `/api/health` endpoint |

### Config

| Class | File | Purpose |
|-------|------|---------|
| `JpaConfig` | `config/JpaConfig.java` | JPA auditing configuration |
| `CorsProperties` | `config/CorsProperties.java` | CORS configuration |
| `WebConfig` | `config/WebConfig.java` | Web MVC configuration |
| `CacheConfig` | `config/CacheConfig.java` | Redis cache configuration |
| `OpenApiConfig` | `config/OpenApiConfig.java` | Swagger/OpenAPI docs |
| `DataInitializer` | `config/DataInitializer.java` | Seed data on startup |

### WebSocket

| Class | File | Purpose |
|-------|------|---------|
| `WebSocketConfig` | `websocket/WebSocketConfig.java` | STOMP over SockJS configuration |
| `WebSocketAuthInterceptor` | `websocket/WebSocketAuthInterceptor.java` | JWT auth for WebSocket |
| `RedisWebSocketBroadcast` | `websocket/RedisWebSocketBroadcast.java` | Redis pub/sub for multi-instance broadcast |

### Storage

| Class | File | Purpose |
|-------|------|---------|
| `StorageService` | `storage/StorageService.java` | File storage interface |
| `S3StorageService` | `storage/S3StorageService.java` | MinIO/S3 implementation |
| `FileValidationService` | `storage/FileValidationService.java` | File type/size validation |

### Scheduled Jobs

| Class | File | Purpose |
|-------|------|---------|
| `ScheduledJobsConfig` | `scheduler/ScheduledJobsConfig.java` | Cron schedule configuration |
| `ContractAlertJob` | `scheduler/jobs/ContractAlertJob.java` | Contract expiration alerts |
| `TaskDeadlineReminderJob` | `scheduler/jobs/TaskDeadlineReminderJob.java` | Task deadline reminders |
| `TaskOverdueCheckJob` | `scheduler/jobs/TaskOverdueCheckJob.java` | Overdue task detection |
| `SafetyInspectionReminderJob` | `scheduler/jobs/SafetyInspectionReminderJob.java` | Safety inspection reminders |
| `CertificateExpirationJob` | `scheduler/jobs/CertificateExpirationJob.java` | Certificate expiration alerts |
| `StockLevelAlertJob` | `scheduler/jobs/StockLevelAlertJob.java` | Low stock level alerts |
| `PaymentSlaCheckJob` | `scheduler/jobs/PaymentSlaCheckJob.java` | Payment SLA violation checks |
| `FleetMaintenanceJob` | `scheduler/jobs/FleetMaintenanceJob.java` | Fleet maintenance schedule alerts |
| `AnalyticsAggregationJob` | `scheduler/jobs/AnalyticsAggregationJob.java` | Daily analytics aggregation |
| `DailyLogReminderJob` | `scheduler/jobs/DailyLogReminderJob.java` | Daily log completion reminders |
| `SupportSlaCheckJob` | `scheduler/jobs/SupportSlaCheckJob.java` | Support ticket SLA checks |
| `RateLimitCleanupJob` | `scheduler/jobs/RateLimitCleanupJob.java` | Rate limit counter cleanup |

### Audit

| Class | File | Purpose |
|-------|------|---------|
| `AuditService` | `audit/AuditService.java` | Audit log recording service |
| `AuditLog` | `audit/AuditLog.java` | Audit log JPA entity |
| `AuditLogRepository` | `audit/AuditLogRepository.java` | Audit log repository |

### Email & Reports

| Class | File | Purpose |
|-------|------|---------|
| `EmailService` | `email/EmailService.java` | Email sending (templates, attachments) |
| `PdfReportService` | `report/PdfReportService.java` | PDF generation service |
| `PdfReportController` | `report/PdfReportController.java` | `/api/pdf-reports` REST controller |

---

## 10. Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `dev-setup.sh` | Development environment setup (Docker, env vars) |
| `demo-setup.sh` | Demo environment setup |
| `init-db.sh` | Database initialization |
| `backup-db.sh` | Automated PostgreSQL backup |
| `setup-backup-cron.sh` | Install daily backup cron job |
| `reset_and_seed.mjs` | Full DB reset + seed (1 complete project) |
| `seed_demo_all_modules.mjs` | Comprehensive demo seeder: 23 modules, 135+ records |
| `seed_full_finmodel_demo.mjs` | Full financial model demo data |
| `seed_prj00009_full_demo.sql` | SQL seed for specific demo project |
| `seed_email_demo.sql` | Email module demo data |
| `seed_messaging_demo.sql` | Messaging module demo data |
| `seed_portal_demo.sql` | Client portal demo data |
| `cleanup_orphans.mjs` | Database orphan record cleanup |
| `generate-test-lsr.mjs` | Generate test LSR xlsx files |
| `parse_lsr_xlsx.mjs` | CLI LSR xlsx parser (standalone) |

---

## Summary Statistics

| Area | Count |
|------|-------|
| Shared components | 51 files |
| Design system components | 33 components |
| Design system tokens | 6 token files |
| Custom hooks | 18 hooks |
| Utility/lib files | 22 files |
| Zustand stores | 11 stores |
| Config files | 2 files |
| API modules | 120+ files |
| i18n files | 3 files (~50k lines total) |
| Route definition files | 15 files |
| Backend infrastructure classes | 68 Java classes |
| Scheduled jobs | 13 jobs |
| Scripts | 15 scripts |
| **Total shared code files** | **~370+** |
