// =============================================================================
// PRIVOD NEXT -- AvatarImage Component
// Specialized avatar with initials fallback, circular shape, and lazy loading.
// =============================================================================

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, { px: number; text: string }> = {
  sm: { px: 24, text: 'text-[10px]' },
  md: { px: 32, text: 'text-xs' },
  lg: { px: 40, text: 'text-sm' },
  xl: { px: 48, text: 'text-base' },
};

/**
 * Deterministic background color based on a name string.
 * Produces a consistent hue so the same person always gets the same color.
 */
function initialsColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

/**
 * Extract up to 2 initials from a full name.
 * "Иванов Пётр" -> "ИП", "John" -> "J"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export interface AvatarImageProps {
  /** Image URL (can be undefined/null for initials-only display) */
  src?: string | null;
  /** Full name — used for initials fallback and alt text */
  name: string;
  /** Size preset */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Circular avatar image with:
 * - Lazy loading via `loading="lazy"`
 * - Initials fallback when no image or on error
 * - Deterministic background color per name
 * - sm/md/lg/xl size presets
 * - Dark mode support
 */
export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const [showImage, setShowImage] = useState(!!src);
  const { px, text } = SIZE_MAP[size];

  const handleError = useCallback(() => setShowImage(false), []);

  // Reset when src changes
  React.useEffect(() => {
    setShowImage(!!src);
  }, [src]);

  const initials = getInitials(name);
  const bgColor = initialsColor(name);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-medium text-white select-none',
        text,
        className,
      )}
      style={{
        width: px,
        height: px,
        minWidth: px,
        backgroundColor: showImage ? undefined : bgColor,
      }}
      title={name}
    >
      {showImage && src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={handleError}
          className="w-full h-full object-cover"
          width={px}
          height={px}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
};
