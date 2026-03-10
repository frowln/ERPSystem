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
import { closeoutRoutes } from './closeoutRoutes';
import { execDocsRoutes } from './execDocsRoutes';
import { marketplaceRoutes } from './marketplaceRoutes';
import { defectsRoutes } from './defectsRoutes';
import { emailRoutes } from './emailRoutes';

// ---------------------------------------------------------------------------
// Core pages (kept here — shared across domains)
// ---------------------------------------------------------------------------
const LoginPage = lazy(() => import('@/modules/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/modules/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/modules/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/modules/auth/ResetPasswordPage'));
const LandingPage = lazy(() => import('@/modules/landing/LandingPage'));
const TermsPage = lazy(() => import('@/modules/legal/TermsPage'));
const PrivacyPage = lazy(() => import('@/modules/legal/PrivacyPage'));
const DpaPage = lazy(() => import('@/modules/legal/DpaPage'));
const SlaPage = lazy(() => import('@/modules/legal/SlaPage'));
const StatusPage = lazy(() => import('@/modules/status/StatusPage'));
const ChangelogPage = lazy(() => import('@/modules/changelog/ChangelogPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const GuestCallPage = lazy(() => import('@/pages/GuestCallPage'));
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
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/dpa" element={<DpaPage />} />
        <Route path="/sla" element={<SlaPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/call/:token" element={<GuestCallPage />} />

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
          {closeoutRoutes()}
          {execDocsRoutes()}
          {marketplaceRoutes()}
          {defectsRoutes()}
          {emailRoutes()}

          {/* Prevent blank content area on unknown authenticated routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
