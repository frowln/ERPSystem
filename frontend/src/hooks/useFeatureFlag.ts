import { useQuery } from '@tanstack/react-query';
import { featureFlagApi } from '@/api/featureFlags';

/**
 * Hook to check whether a feature flag is enabled.
 * Uses React Query to cache the result with a 5-minute stale time.
 * Returns `false` while the flag is loading or if the query fails.
 *
 * @param key - The feature flag key (e.g. 'ai_assistant', 'bim_viewer')
 * @returns boolean indicating whether the feature is enabled
 */
export function useFeatureFlag(key: string): boolean {
  const { data } = useQuery({
    queryKey: ['feature-flag', key],
    queryFn: () => featureFlagApi.check(key),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return data?.enabled ?? false;
}
