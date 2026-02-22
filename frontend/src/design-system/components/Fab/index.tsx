import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface FabProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

/**
 * Floating Action Button — shown only on mobile (md:hidden).
 * Positioned above the BottomNav (bottom-20) with 56px touch target.
 */
export const Fab: React.FC<FabProps> = ({ onClick, icon, label, className }) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full',
        'bg-primary-600 text-white shadow-lg',
        'flex items-center justify-center',
        'hover:bg-primary-700 active:bg-primary-800 active:scale-95',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
        className,
      )}
    >
      {icon ?? <Plus size={24} />}
    </button>
  );
};
