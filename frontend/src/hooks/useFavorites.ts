import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export interface Favorite {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  createdAt: string;
}

export function useFavorites(entityType?: string) {
  return useQuery({
    queryKey: ['entity-favorites', entityType],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (entityType) params.type = entityType;
      const { data } = await apiClient.get<Favorite[]>('/favorites', { params });
      return data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      entityName,
      isFavorite,
    }: {
      entityType: string;
      entityId: string;
      entityName: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await apiClient.delete(`/favorites/${entityType}/${entityId}`);
      } else {
        await apiClient.post('/favorites', { entityType, entityId, entityName });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-favorites'] });
    },
  });
}

export function useIsFavorite(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['entity-favorites', 'check', entityType, entityId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ isFavorite: boolean }>(
        `/favorites/check/${entityType}/${entityId}`,
      );
      return data.isFavorite;
    },
    enabled: !!entityId,
  });
}
