import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';

// Domain route groups
import { projectRoutes } from './projectRoutes';
import { financeRoutes } from './financeRoutes';
import { hrRoutes } from './hrRoutes';
import { warehouseRoutes } from './warehouseRoutes';
import { qualityRoutes } from './qualityRoutes';
import { documentRoutes } from './documentRoutes';
import { operationsRoutes } from './operationsRoutes';
import { settingsRoutes } from './settingsRoutes';
import { portfolioRoutes } from './portfolioRoutes';

// ---------------------------------------------------------------------------
// Core pages (kept here — shared across domains)
// ---------------------------------------------------------------------------
const LoginPage = lazy(() => import('@/modules/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const AppLayout = lazy(() =>
  import('@/layouts/AppLayout').then((module) => ({ default: module.AppLayout })),
);
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ---------------------------------------------------------------------------
// Page loader
// ---------------------------------------------------------------------------
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('common.loading')}</p>
    </div>
  </div>
);

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route index element={<DashboardPage />} />

          {/* Domain route groups */}
          {projectRoutes()}
          {financeRoutes()}
          {hrRoutes()}
          {warehouseRoutes()}
          {qualityRoutes()}
          {documentRoutes()}
          {operationsRoutes()}
          {settingsRoutes()}
          {portfolioRoutes()}
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
