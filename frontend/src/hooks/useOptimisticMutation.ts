import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

/**
 * Generic hook that wraps useMutation with optimistic cache updates.
 *
 * On mutate: immediately update the query cache with the optimistic value.
 * On error: rollback to previous state and optionally show an error toast.
 * On success/settled: invalidate to get fresh data from the server.
 *
 * @template TData - The type of the data stored in the query cache
 * @template TVariables - The variables passed to the mutation function
 * @template TResult - The return type of the mutation function
 */
interface UseOptimisticMutationOptions<TData, TVariables, TResult = unknown> {
  /** The query key(s) to optimistically update and invalidate */
  queryKey: QueryKey;
  /** Additional query keys to invalidate on settled (not optimistically updated) */
  relatedQueryKeys?: QueryKey[];
  /** The mutation function */
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /**
   * Function that produces the optimistic cache update.
   * Receives the current cache data and the mutation variables.
   * Return the new cache data.
   */
  updater: (currentData: TData | undefined, variables: TVariables) => TData | undefined;
  /** Optional error message key for toast. Defaults to 'errors.serverErrorRetry' */
  errorMessage?: string;
  /** Callback after successful mutation */
  onSuccess?: (result: TResult, variables: TVariables) => void;
  /** Callback on error (in addition to rollback and toast) */
  onError?: (error: unknown, variables: TVariables) => void;
}

export function useOptimisticMutation<TData, TVariables, TResult = unknown>({
  queryKey,
  relatedQueryKeys = [],
  mutationFn,
  updater,
  errorMessage,
  onSuccess,
  onError,
}: UseOptimisticMutationOptions<TData, TVariables, TResult>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,

    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update the cache
      const nextData = updater(previousData, variables);
      if (nextData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, nextData);
      }

      return { previousData };
    },

    onError: (error: unknown, variables: TVariables, context: { previousData?: TData } | undefined) => {
      // Rollback to previous cache state
      if (context?.previousData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, context.previousData);
      }
      toast.error(errorMessage ?? t('errors.serverErrorRetry'));
      onError?.(error, variables);
    },

    onSuccess: (result: TResult, variables: TVariables) => {
      onSuccess?.(result, variables);
    },

    onSettled: () => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey });
      for (const key of relatedQueryKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
