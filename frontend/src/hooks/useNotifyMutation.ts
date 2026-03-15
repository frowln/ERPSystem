import { useMutation, useQueryClient, type QueryKey, type UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

/**
 * Wrapper around useMutation that automatically shows toast notifications
 * on success and error. Use this for all mutations that modify server state.
 *
 * This addresses the audit item M21: "Add feedback on ~300 mutations without onSuccess/onError".
 * New mutations should use this hook instead of raw useMutation.
 *
 * @example
 * const deleteMutation = useNotifyMutation({
 *   mutationFn: (id: string) => apiClient.delete(`/api/items/${id}`),
 *   successMessage: 'Запись удалена',
 *   invalidateKeys: [['items']],
 * });
 */

interface UseNotifyMutationOptions<TData, TVariables, TError = Error> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Toast message on success. Defaults to t('common.operationSuccess') */
  successMessage?: string;
  /** Toast message on error. Defaults to t('errors.serverErrorRetry') */
  errorMessage?: string;
  /** Query keys to invalidate after success */
  invalidateKeys?: QueryKey[];
  /** Additional onSuccess callback */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Additional onError callback */
  onError?: (error: TError, variables: TVariables) => void;
  /** Additional react-query mutation options */
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn' | 'onSuccess' | 'onError'>;
}

export function useNotifyMutation<TData = unknown, TVariables = void, TError = Error>({
  mutationFn,
  successMessage,
  errorMessage,
  invalidateKeys = [],
  onSuccess,
  onError,
  options,
}: UseNotifyMutationOptions<TData, TVariables, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,

    onSuccess: (data, variables) => {
      toast.success(successMessage ?? t('common.operationSuccess'));
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      toast.error(errorMessage ?? t('errors.serverErrorRetry'));
      onError?.(error, variables);
    },

    ...options,
  });
}
