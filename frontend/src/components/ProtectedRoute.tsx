import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getRequiredRoles } from '@/config/routePermissions';
import { t } from '@/i18n';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

const ForbiddenFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{t('access.forbidden')}</h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-4">{t('access.noPermission')}</p>
      <a href="/" className="text-primary-600 hover:text-primary-700 font-medium">
        {t('access.backToHome')}
      </a>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallback,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Deep-link preserved via router state={{ from: location }} — LoginPage reads location.state.from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine effective required roles: explicit prop takes priority,
  // otherwise look up from routePermissions config based on current path.
  const effectiveRoles = requiredRoles ?? getRequiredRoles(location.pathname);

  if (effectiveRoles && effectiveRoles.length > 0 && user) {
    const userRole = user.role;
    const userRoles = user.roles ?? [];

    const hasRequiredRole = effectiveRoles.some(
      (role) => userRole === role || userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      return <>{fallback ?? <ForbiddenFallback />}</>;
    }
  }

  return <>{children}</>;
};
