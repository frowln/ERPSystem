import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Settings & Admin
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'));
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

export function settingsRoutes() {
  return (
    <>
      {/* Settings & Admin (ADMIN only) */}
      <Route path="settings" element={<ProtectedRoute requiredRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
      <Route path="admin/users" element={<ProtectedRoute requiredRoles={['ADMIN']}><UsersAdminPage /></ProtectedRoute>} />
      <Route path="admin/permissions" element={<ProtectedRoute requiredRoles={['ADMIN']}><PermissionsPage /></ProtectedRoute>} />
      <Route path="admin/integrations" element={<ProtectedRoute requiredRoles={['ADMIN']}><IntegrationsPage /></ProtectedRoute>} />
      <Route path="settings/api-keys" element={<ProtectedRoute requiredRoles={['ADMIN']}><ApiKeysPage /></ProtectedRoute>} />
      <Route path="settings/webhooks" element={<ProtectedRoute requiredRoles={['ADMIN']}><WebhooksPage /></ProtectedRoute>} />

      {/* Notifications */}
      <Route path="notifications" element={<NotificationsPage />} />

      {/* Integration Management */}
      <Route path="integrations" element={<IntegrationsDashboardPage />} />
      <Route path="integrations/telegram" element={<TelegramPage />} />
      <Route path="integrations/1c" element={<OneCSettingsPage />} />
      <Route path="integrations/sbis" element={<SbisSettingsPage />} />
      <Route path="integrations/edo" element={<EdoSettingsPage />} />
      <Route path="integrations/bim" element={<BimIntegrationPage />} />
      <Route path="integrations/weather" element={<WeatherIntegrationPage />} />

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
