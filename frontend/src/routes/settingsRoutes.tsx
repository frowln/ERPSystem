import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Settings & Admin
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'));
const AiSettingsPage = lazy(() => import('@/modules/ai/AiSettingsPage'));
const UsersAdminPage = lazy(() => import('@/modules/settings/UsersAdminPage'));
const PermissionsPage = lazy(() => import('@/modules/settings/PermissionsPage'));
const IntegrationsPage = lazy(() => import('@/modules/settings/IntegrationsPage'));

// KEP (Digital Signature)
const KepCertificateListPage = lazy(() => import('@/modules/kep/KepCertificateListPage'));
const KepCertificateDetailPage = lazy(() => import('@/modules/kep/KepCertificateDetailPage'));
const KepSigningPage = lazy(() => import('@/modules/kep/KepSigningPage'));
const KepVerificationPage = lazy(() => import('@/modules/kep/KepVerificationPage'));
const MchDListPage = lazy(() => import('@/modules/kep/MchDListPage'));

// Notifications
const NotificationsPage = lazy(() => import('@/modules/notifications/NotificationsPage'));

// Email Preferences
const EmailPreferencesPage = lazy(() => import('@/modules/settings/EmailPreferencesPage'));

// API Management
const ApiKeysPage = lazy(() => import('@/modules/apiManagement/ApiKeysPage'));
const WebhooksPage = lazy(() => import('@/modules/apiManagement/WebhooksPage'));

// API Documentation
const ApiDocsPage = lazy(() => import('@/modules/api-docs/ApiDocsPage'));

// Integration Management
const IntegrationsDashboardPage = lazy(() => import('@/modules/integrations/IntegrationsPage'));
const TelegramPage = lazy(() => import('@/modules/integrations/TelegramPage'));
const BimIntegrationPage = lazy(() => import('@/modules/integrations/BimPage'));
const WeatherIntegrationPage = lazy(() => import('@/modules/integrations/WeatherPage'));
const OneCSettingsPage = lazy(() => import('@/modules/integrations/OneCSettingsPage'));
const SbisSettingsPage = lazy(() => import('@/modules/integrations/SbisSettingsPage'));
const EdoSettingsPage = lazy(() => import('@/modules/integrations/EdoSettingsPage'));
const OfflineQueuePage = lazy(() => import('@/modules/settings/OfflineQueuePage'));
const OfflineSyncPage = lazy(() => import('@/modules/settings/OfflineSyncPage'));
const GovRegistriesPage = lazy(() => import('@/modules/integrations/GovRegistriesPage'));
const SmsSettingsPage = lazy(() => import('@/modules/integrations/SmsSettingsPage'));
const WebDavSettingsPage = lazy(() => import('@/modules/integrations/WebDavSettingsPage'));

// 1C Integration Module
const OneCDashboardPage = lazy(() => import('@/modules/integration1c/OneCDashboardPage'));
const Ks2Ks3ExportPage = lazy(() => import('@/modules/integration1c/Ks2Ks3ExportPage'));
const PaymentExportPage = lazy(() => import('@/modules/integration1c/PaymentExportPage'));
const BankStatementImportPage = lazy(() => import('@/modules/integration1c/BankStatementImportPage'));
const ContractorSyncPage = lazy(() => import('@/modules/integration1c/ContractorSyncPage'));

// ISUP (ИСУП Минстроя)
const IsupConfigWizardPage = lazy(() => import('@/modules/isup/IsupConfigWizardPage'));
const IsupTransmissionDashboard = lazy(() => import('@/modules/isup/IsupTransmissionDashboard'));
const IsupProjectMappingPage = lazy(() => import('@/modules/isup/IsupProjectMappingPage'));

// Admin Module
const AdminDashboardPage = lazy(() => import('@/modules/admin/AdminDashboardPage'));
const DepartmentPage = lazy(() => import('@/modules/admin/DepartmentPage'));
const BulkUserImportPage = lazy(() => import('@/modules/admin/BulkUserImportPage'));
const SecuritySettingsPage = lazy(() => import('@/modules/admin/SecuritySettingsPage'));
const LoginAuditPage = lazy(() => import('@/modules/admin/LoginAuditPage'));
const OnlineUsersPage = lazy(() => import('@/modules/admin/OnlineUsersPage'));
const AuditLogPage = lazy(() => import('@/modules/admin/AuditLogPage'));
const PermissionMatrixPage = lazy(() => import('@/modules/admin/PermissionMatrixPage'));
const SystemSettingsPage = lazy(() => import('@/modules/admin/SystemSettingsPage'));
const TenantManagementPage = lazy(() => import('@/modules/admin/TenantManagementPage'));

// Settings: Automation, EDO, Notifications, Profile
const AutomationBuilderPage = lazy(() => import('@/modules/settings/automation/AutomationBuilderPage'));
const EdoConfigPage = lazy(() => import('@/modules/settings/EdoConfigPage'));
const NotificationPreferencesPage = lazy(() => import('@/modules/settings/NotificationPreferencesPage'));
const ProfilePage = lazy(() => import('@/modules/settings/ProfilePage'));

// Integration API Keys (distinct from apiManagement ApiKeysPage)
const IntegrationApiKeysPage = lazy(() => import('@/modules/integrations/ApiKeysPage'));

// Onboarding
const SetupWizardPage = lazy(() => import('@/modules/onboarding/SetupWizardPage'));

// 1C Integration: Nomenclature & Pricing
const NomenclatureSyncPage = lazy(() => import('@/modules/integration1c/NomenclatureSyncPage'));
const PricingDatabasePage = lazy(() => import('@/modules/integration1c/PricingDatabasePage'));

// Help Center
const HelpCenterPage = lazy(() => import('@/modules/help/HelpCenterPage'));

// Insurance
const InsuranceCertificateListPage = lazy(() => import('@/modules/prequalification/InsuranceCertificateListPage'));
const InsuranceCertificateFormPage = lazy(() => import('@/modules/prequalification/InsuranceCertificateFormPage'));

// Subscription
const SubscriptionDashboardPage = lazy(() => import('@/modules/subscription/SubscriptionDashboardPage'));
const PricingPage = lazy(() => import('@/modules/subscription/PricingPage'));
const FeatureGatePage = lazy(() => import('@/modules/subscription/FeatureGatePage'));
const PaymentResultPage = lazy(() => import('@/modules/subscription/PaymentResultPage'));

export function settingsRoutes() {
  return (
    <>
      {/* Settings & Admin (ADMIN only) */}
      <Route path="settings" element={<ProtectedRoute requiredRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
      <Route path="settings/ai" element={<ProtectedRoute requiredRoles={['ADMIN']}><AiSettingsPage /></ProtectedRoute>} />
      <Route path="admin/users" element={<ProtectedRoute requiredRoles={['ADMIN']}><UsersAdminPage /></ProtectedRoute>} />
      <Route path="admin/permissions" element={<ProtectedRoute requiredRoles={['ADMIN']}><PermissionsPage /></ProtectedRoute>} />
      <Route path="admin/integrations" element={<ProtectedRoute requiredRoles={['ADMIN']}><IntegrationsPage /></ProtectedRoute>} />
      <Route path="settings/api-keys" element={<ProtectedRoute requiredRoles={['ADMIN']}><ApiKeysPage /></ProtectedRoute>} />
      <Route path="settings/webhooks" element={<ProtectedRoute requiredRoles={['ADMIN']}><WebhooksPage /></ProtectedRoute>} />
      <Route path="settings/api-docs" element={<ProtectedRoute requiredRoles={['ADMIN']}><ApiDocsPage /></ProtectedRoute>} />
      <Route path="settings/offline-queue" element={<ProtectedRoute requiredRoles={['ADMIN']}><OfflineQueuePage /></ProtectedRoute>} />
      <Route path="settings/offline-sync" element={<ProtectedRoute requiredRoles={['ADMIN']}><OfflineSyncPage /></ProtectedRoute>} />
      <Route path="settings/subscription" element={<ProtectedRoute requiredRoles={['ADMIN']}><SubscriptionDashboardPage /></ProtectedRoute>} />
      <Route path="settings/subscription/result" element={<ProtectedRoute requiredRoles={['ADMIN']}><PaymentResultPage /></ProtectedRoute>} />

      {/* Admin Module (ADMIN only) */}
      <Route path="admin/dashboard" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="admin/users/import" element={<ProtectedRoute requiredRoles={['ADMIN']}><BulkUserImportPage /></ProtectedRoute>} />
      <Route path="admin/departments" element={<ProtectedRoute requiredRoles={['ADMIN']}><DepartmentPage /></ProtectedRoute>} />
      <Route path="admin/security" element={<ProtectedRoute requiredRoles={['ADMIN']}><SecuritySettingsPage /></ProtectedRoute>} />
      <Route path="admin/login-audit" element={<ProtectedRoute requiredRoles={['ADMIN']}><LoginAuditPage /></ProtectedRoute>} />
      <Route path="admin/online-users" element={<ProtectedRoute requiredRoles={['ADMIN']}><OnlineUsersPage /></ProtectedRoute>} />
      <Route path="admin/audit-logs" element={<ProtectedRoute requiredRoles={['ADMIN']}><AuditLogPage /></ProtectedRoute>} />
      <Route path="admin/settings" element={<ProtectedRoute requiredRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />

      {/* Insurance Certificates */}
      <Route path="insurance-certificates" element={<ProtectedRoute><InsuranceCertificateListPage /></ProtectedRoute>} />
      <Route path="insurance-certificates/new" element={<ProtectedRoute><InsuranceCertificateFormPage /></ProtectedRoute>} />
      <Route path="insurance-certificates/:id/edit" element={<ProtectedRoute><InsuranceCertificateFormPage /></ProtectedRoute>} />

      {/* Pricing & Feature Gate (authenticated, any role) */}
      <Route path="pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
      <Route path="pricing/databases" element={<Navigate to="/estimates/pricing/databases" replace />} />
      <Route path="pricing/rates" element={<Navigate to="/estimates/pricing/rates" replace />} />
      <Route path="pricing/calculate" element={<Navigate to="/estimates/pricing/calculate" replace />} />
      <Route path="feature-gate" element={<ProtectedRoute><FeatureGatePage /></ProtectedRoute>} />

      {/* 1C Integration Module (ADMIN only) */}
      <Route path="settings/1c" element={<ProtectedRoute requiredRoles={['ADMIN']}><OneCDashboardPage /></ProtectedRoute>} />
      <Route path="settings/1c/ks-export" element={<ProtectedRoute requiredRoles={['ADMIN']}><Ks2Ks3ExportPage /></ProtectedRoute>} />
      <Route path="settings/1c/payment-export" element={<ProtectedRoute requiredRoles={['ADMIN']}><PaymentExportPage /></ProtectedRoute>} />
      <Route path="settings/1c/bank-import" element={<ProtectedRoute requiredRoles={['ADMIN']}><BankStatementImportPage /></ProtectedRoute>} />
      <Route path="settings/1c/sync" element={<ProtectedRoute requiredRoles={['ADMIN']}><ContractorSyncPage /></ProtectedRoute>} />

      {/* ISUP (ИСУП Минстроя) */}
      <Route path="settings/isup" element={<ProtectedRoute requiredRoles={['ADMIN']}><IsupConfigWizardPage /></ProtectedRoute>} />
      <Route path="settings/isup/transmissions" element={<ProtectedRoute requiredRoles={['ADMIN']}><IsupTransmissionDashboard /></ProtectedRoute>} />
      <Route path="settings/isup/mappings" element={<ProtectedRoute requiredRoles={['ADMIN']}><IsupProjectMappingPage /></ProtectedRoute>} />

      {/* KEP (Digital Signature) */}
      <Route path="settings/kep/certificates" element={<ProtectedRoute requiredRoles={['ADMIN']}><KepCertificateListPage /></ProtectedRoute>} />
      <Route path="settings/kep/certificates/:id" element={<ProtectedRoute requiredRoles={['ADMIN']}><KepCertificateDetailPage /></ProtectedRoute>} />
      <Route path="settings/kep/sign" element={<ProtectedRoute requiredRoles={['ADMIN']}><KepSigningPage /></ProtectedRoute>} />
      <Route path="settings/kep/verify" element={<ProtectedRoute requiredRoles={['ADMIN']}><KepVerificationPage /></ProtectedRoute>} />
      <Route path="settings/kep/mchd" element={<ProtectedRoute requiredRoles={['ADMIN']}><MchDListPage /></ProtectedRoute>} />

      {/* Notifications (authenticated) */}
      <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* Email Preferences (authenticated) */}
      <Route path="settings/email-preferences" element={<ProtectedRoute><EmailPreferencesPage /></ProtectedRoute>} />

      {/* Integration Management (authenticated) */}
      <Route path="integrations" element={<ProtectedRoute><IntegrationsDashboardPage /></ProtectedRoute>} />
      <Route path="integrations/telegram" element={<ProtectedRoute><TelegramPage /></ProtectedRoute>} />
      <Route path="integrations/1c" element={<ProtectedRoute><OneCSettingsPage /></ProtectedRoute>} />
      <Route path="integrations/sbis" element={<ProtectedRoute><SbisSettingsPage /></ProtectedRoute>} />
      <Route path="integrations/edo" element={<ProtectedRoute><EdoSettingsPage /></ProtectedRoute>} />
      <Route path="integrations/bim" element={<ProtectedRoute><BimIntegrationPage /></ProtectedRoute>} />
      <Route path="integrations/weather" element={<ProtectedRoute><WeatherIntegrationPage /></ProtectedRoute>} />
      <Route path="integrations/gov-registries" element={<ProtectedRoute><GovRegistriesPage /></ProtectedRoute>} />
      <Route path="integrations/sms" element={<ProtectedRoute><SmsSettingsPage /></ProtectedRoute>} />
      <Route path="integrations/webdav" element={<ProtectedRoute><WebDavSettingsPage /></ProtectedRoute>} />

      {/* Admin: Permission Matrix, System Settings, Tenants (ADMIN only) */}
      <Route path="admin/permission-matrix" element={<ProtectedRoute requiredRoles={['ADMIN']}><PermissionMatrixPage /></ProtectedRoute>} />
      <Route path="admin/system-settings" element={<ProtectedRoute requiredRoles={['ADMIN']}><SystemSettingsPage /></ProtectedRoute>} />
      <Route path="admin/tenants" element={<ProtectedRoute requiredRoles={['ADMIN']}><TenantManagementPage /></ProtectedRoute>} />

      {/* Settings: Automation, EDO (ADMIN only) */}
      <Route path="settings/automation" element={<ProtectedRoute requiredRoles={['ADMIN']}><AutomationBuilderPage /></ProtectedRoute>} />
      <Route path="settings/edo" element={<ProtectedRoute requiredRoles={['ADMIN']}><EdoConfigPage /></ProtectedRoute>} />

      {/* Settings: Notification Preferences, Profile (authenticated) */}
      <Route path="settings/notification-preferences" element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>} />
      <Route path="settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Integration API Keys (authenticated) */}
      <Route path="integrations/api-keys" element={<ProtectedRoute><IntegrationApiKeysPage /></ProtectedRoute>} />

      {/* Onboarding (authenticated) */}
      <Route path="onboarding/setup" element={<ProtectedRoute><SetupWizardPage /></ProtectedRoute>} />

      {/* 1C Integration: Nomenclature & Pricing (ADMIN only) */}
      <Route path="settings/1c/nomenclature" element={<ProtectedRoute requiredRoles={['ADMIN']}><NomenclatureSyncPage /></ProtectedRoute>} />
      <Route path="settings/1c/pricing-db" element={<ProtectedRoute requiredRoles={['ADMIN']}><PricingDatabasePage /></ProtectedRoute>} />

      {/* Help Center (authenticated) */}
      <Route path="help" element={<ProtectedRoute><HelpCenterPage /></ProtectedRoute>} />

      {/* Route aliases */}
      <Route path="russian-docs" element={<Navigate to="/russian-docs/list" replace />} />
      <Route path="issues" element={<Navigate to="/pm/issues" replace />} />
      <Route path="issues/:id" element={<Navigate to="/pm/issues" replace />} />
      <Route path="change-management/events/new" element={<Navigate to="/change-management/events" replace />} />
      <Route path="portfolio/tenders/new" element={<Navigate to="/portfolio/tenders" replace />} />
      <Route path="regulatory/permits/new" element={<Navigate to="/regulatory/permits" replace />} />
      <Route path="regulatory/licenses/new" element={<Navigate to="/regulatory/licenses" replace />} />
      <Route path="regulatory/inspections/new" element={<Navigate to="/regulatory/inspections" replace />} />
      <Route path="operations/work-orders/new" element={<Navigate to="/operations/work-orders" replace />} />
    </>
  );
}
