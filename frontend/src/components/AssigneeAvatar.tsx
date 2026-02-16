import React from 'react';
import { cn } from '@/lib/cn';

interface AssigneeAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  online?: boolean;
  className?: string;
}

const sizeStyles: Record<string, { avatar: string; text: string; font: string; indicator: string }> = {
  xs: { avatar: 'w-5 h-5', text: 'text-[9px]', font: 'font-medium', indicator: 'w-1.5 h-1.5 -bottom-0 -right-0' },
  sm: { avatar: 'w-6 h-6', text: 'text-[10px]', font: 'font-medium', indicator: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  md: { avatar: 'w-8 h-8', text: 'text-xs', font: 'font-semibold', indicator: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
  lg: { avatar: 'w-10 h-10', text: 'text-sm', font: 'font-semibold', indicator: 'w-3 h-3 -bottom-0.5 -right-0.5' },
};

const bgColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export const AssigneeAvatar: React.FC<AssigneeAvatarProps> = React.memo(({
  name,
  avatarUrl,
  size = 'sm',
  showName = false,
  online,
  className,
}) => {
  const s = sizeStyles[size];

  if (!name) {
    return (
      <div
        className={cn(
          'rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center',
          s.avatar,
          className,
        )}
      >
        <span className={cn(s.text, 'text-neutral-400')}>?</span>
      </div>
    );
  }

  const initials = getInitials(name);
  const color = hashColor(name);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className={cn('rounded-full object-cover', s.avatar)}
          />
        ) : (
          <div
            className={cn(
              'rounded-full flex items-center justify-center text-white',
              s.avatar,
              color,
            )}
          >
            <span className={cn(s.text, s.font)}>{initials}</span>
          </div>
        )}
        {online !== undefined && (
          <span
            className={cn(
              'absolute border-2 border-white dark:border-neutral-900 rounded-full',
              s.indicator,
              online ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600',
            )}
          />
        )}
      </div>
      {showName && (
        <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{name}</span>
      )}
    </div>
  );
});
AssigneeAvatar.displayName = 'AssigneeAvatar';
