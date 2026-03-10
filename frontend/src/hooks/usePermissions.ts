import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getRequiredRoles } from '@/config/routePermissions';
import type { UserRole } from '@/types';

/**
 * Hook that provides role-based permission checks.
 *
 * - ADMIN role always has full access.
 * - If a path has no entry in routePermissions, access is allowed by default.
 * - Uses the user's `roles` array (falling back to singleton `role`).
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const userRoles: string[] = useMemo(() => {
    if (!user) return [];
    // Merge singular role + roles array, deduplicate
    const set = new Set<string>(user.roles ?? []);
    if (user.role) set.add(user.role);
    return Array.from(set);
  }, [user]);

  const isAdmin = useMemo(() => userRoles.includes('ADMIN'), [userRoles]);

  const canAccess = useCallback(
    (path: string): boolean => {
      if (!user) return false;
      // ADMIN bypasses all restrictions
      if (isAdmin) return true;

      const requiredRoles = getRequiredRoles(path);
      // No restriction configured = allow access
      if (!requiredRoles || requiredRoles.length === 0) return true;

      return requiredRoles.some((role) => userRoles.includes(role));
    },
    [user, userRoles, isAdmin],
  );

  const primaryRole: UserRole = (user?.role as UserRole) ?? 'VIEWER';

  return { canAccess, userRoles, primaryRole, isAdmin };
}
