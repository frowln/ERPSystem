// =============================================================================
// PRIVOD NEXT -- LazyImage Component
// Lazy-loaded image with skeleton placeholder, fade-in, and error fallback.
// Uses native loading="lazy" + IntersectionObserver for older browsers.
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { ImageOff } from 'lucide-react';

export interface LazyImageProps {
  /** Image source URL */
  src: string;
  /** Accessible alt text */
  alt: string;
  /** Explicit width (CSS value or number in px) */
  width?: number | string;
  /** Explicit height (CSS value or number in px) */
  height?: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Custom fallback element rendered on error */
  fallback?: React.ReactNode;
  /** Object-fit mode — defaults to 'cover' */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/**
 * Image component with:
 * - `loading="lazy"` for native lazy-loading
 * - IntersectionObserver fallback for browsers without native support
 * - Animated skeleton while loading
 * - Smooth fade-in on load
 * - Broken-image fallback with icon
 * - Dark mode support
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  objectFit = 'cover',
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for deferred rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // If native lazy-loading is supported, trust it and show immediately
    if ('loading' in HTMLImageElement.prototype) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset status when src changes
  useEffect(() => {
    setStatus('loading');
  }, [src]);

  const handleLoad = useCallback(() => setStatus('loaded'), []);
  const handleError = useCallback(() => setStatus('error'), []);

  const sizeStyle: React.CSSProperties = {
    ...(width != null ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height != null ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={sizeStyle}
    >
      {/* Skeleton placeholder */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-inherit" />
      )}

      {/* Error fallback */}
      {status === 'error' && (
        fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
            <ImageOff className="w-6 h-6" />
          </div>
        )
      )}

      {/* Actual image */}
      {inView && src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
          )}
          {...(width != null && typeof width === 'number' ? { width } : {})}
          {...(height != null && typeof height === 'number' ? { height } : {})}
        />
      )}
    </div>
  );
};
