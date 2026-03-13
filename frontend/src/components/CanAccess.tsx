import React from 'react';
import { useModelAccess } from '@/hooks/useModelAccess';

type Operation = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';

interface CanAccessProps {
  /** Model name matching backend model_access_rules.model_name (e.g. "Project") */
  model: string;
  /** Operation to check */
  operation: Operation;
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** Optional fallback when access is denied (default: render nothing) */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on the user's model access permissions.
 *
 * Usage:
 *   <CanAccess model="Project" operation="canCreate">
 *     <Button>Создать проект</Button>
 *   </CanAccess>
 */
export const CanAccess: React.FC<CanAccessProps> = ({
  model,
  operation,
  children,
  fallback = null,
}) => {
  const { canDo } = useModelAccess();
  return canDo(model, operation) ? <>{children}</> : <>{fallback}</>;
};
