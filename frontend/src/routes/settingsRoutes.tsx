import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Settings & Admin
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'));
const AiSettingsPage = lazy(() => import('@/modules/ai/AiSettingsPage'));
const UsersAdminPage = lazy(() => import('@/modules/settings/UsersAdminPage'));
const PermissionsPage = lazy(() => import('@/modules/settings/PermissionsPage'));
const IntegrationsPage = lazy(() => import('@/modules/settings/IntegrationsPage'));

// Notifications
const NotificationsPage = lazy(() => import('@/modules/notifications/NotificationsPage'));

// API Management
const ApiKeysPage = lazy(() => import('@/modules/apiManagement/ApiKeysPage'));
const WebhooksPage = lazy(() => import('@/modules/apiManagement/WebhooksPage'));

// Integration Management
const IntegrationsDashboardPage = lazy(() => import('@/modules/integrations/IntegrationsPage'));
const TelegramPage = lazy(() => import('@/modules/integrations/TelegramPage'));
const BimIntegrationPage = lazy(() => import('@/modules/integrations/BimPage'));
const WeatherIntegrationPage = lazy(() => import('@/modules/integrations/WeatherPage'));
const OneCSettingsPage = lazy(() => import('@/modules/integrations/OneCSettingsPage'));
const SbisSettingsPage = lazy(() => import('@/modules/integrations/SbisSettingsPage'));
const EdoSettingsPage = lazy(() => import('@/modules/integrations/EdoSettingsPage'));
const OfflineQueuePage = lazy(() => import('@/modules/settings/OfflineQueuePage'));
const GovRegistriesPage = lazy(() => import('@/modules/integrations/GovRegistriesPage'));
const SmsSettingsPage = lazy(() => import('@/modules/integrations/SmsSettingsPage'));
const WebDavSettingsPage = lazy(() => import('@/modules/integrations/WebDavSettingsPage'));

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
      <Route path="settings/offline-queue" element={<ProtectedRoute requiredRoles={['ADMIN']}><OfflineQueuePage /></ProtectedRoute>} />

      {/* Notifications (authenticated) */}
      <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

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
