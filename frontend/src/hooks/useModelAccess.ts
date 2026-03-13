import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

type Operation = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';

/**
 * Model access permissions map.
 * Key = model name (e.g. "Project"), value = CRUD flags.
 * Special key "_admin" means the user is an admin with full access.
 */
type PermissionsMap = Record<string, Record<Operation, boolean>>;

async function fetchMyPermissions(): Promise<PermissionsMap> {
  const response = await apiClient.get<PermissionsMap>('/auth/me/permissions');
  return response.data ?? {};
}

/**
 * Hook that provides model-level access checks based on the permission matrix.
 *
 * Usage:
 *   const { canDo, isLoading } = useModelAccess();
 *   canDo('Project', 'canCreate') → true/false
 *
 * Logic:
 * - Not authenticated → false
 * - ADMIN (backend returns _admin key) → always true
 * - Empty permissions (no groups) → true (no restrictions from matrix)
 * - Has groups → check the specific model+operation flag
 * - Model not in map → false (no explicit grant)
 */
export function useModelAccess() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: fetchMyPermissions,
    enabled: isAuthenticated,
    staleTime: 60_000, // cache for 1 min
    gcTime: 5 * 60_000,
  });

  const isAdmin = useMemo(() => {
    if (userRole === 'ADMIN') return true;
    return !!permissions?.['_admin'];
  }, [permissions, userRole]);

  const hasGroups = useMemo(() => {
    if (!permissions) return false;
    return Object.keys(permissions).length > 0 && !permissions['_admin'];
  }, [permissions]);

  const canDo = useCallback(
    (model: string, operation: Operation): boolean => {
      // Not authenticated
      if (!isAuthenticated) return false;
      // Admin always allowed
      if (isAdmin) return true;
      // No groups assigned — no matrix restrictions (fall through to role-based)
      if (!hasGroups) return true;
      // Check specific model permission
      const modelPerms = permissions?.[model];
      if (!modelPerms) return false; // model not in matrix → deny
      return !!modelPerms[operation];
    },
    [isAuthenticated, isAdmin, hasGroups, permissions],
  );

  return { canDo, isAdmin, isLoading, hasGroups };
}
