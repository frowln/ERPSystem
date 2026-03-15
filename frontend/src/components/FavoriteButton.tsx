import React from 'react';
import { Star } from 'lucide-react';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { cn } from '@/lib/cn';

interface FavoriteButtonProps {
  entityType: string;
  entityId: string;
  entityName: string;
  size?: number;
  className?: string;
}

/**
 * A star-shaped toggle button for adding/removing entities to/from favorites.
 * Uses the /api/favorites backend endpoints.
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  entityType,
  entityId,
  entityName,
  size = 18,
  className,
}) => {
  const { data: isFavorite, isLoading } = useIsFavorite(entityType, entityId);
  const toggleMutation = useToggleFavorite();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (toggleMutation.isPending || isLoading) return;

    toggleMutation.mutate({
      entityType,
      entityId,
      entityName,
      isFavorite: !!isFavorite,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleMutation.isPending || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded p-1 transition-colors',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isFavorite
          ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
          : 'text-neutral-300 hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400',
        className,
      )}
      title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      <Star
        size={size}
        fill={isFavorite ? 'currentColor' : 'none'}
        strokeWidth={isFavorite ? 0 : 1.5}
      />
    </button>
  );
};

export default FavoriteButton;
