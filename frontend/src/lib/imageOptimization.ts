/**
 * Image optimisation utilities for responsive loading,
 * WebP detection, and lazy-loading below the fold.
 */

// ---------------------------------------------------------------------------
// WebP support detection (cached)
// ---------------------------------------------------------------------------

let _supportsWebP: boolean | null = null;

/**
 * Detect whether the browser supports WebP images.
 * Result is cached after the first call.
 */
export function supportsWebP(): boolean {
  if (_supportsWebP !== null) return _supportsWebP;

  if (typeof document === 'undefined') {
    _supportsWebP = false;
    return false;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  _supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return _supportsWebP;
}

// ---------------------------------------------------------------------------
// Responsive srcSet generation
// ---------------------------------------------------------------------------

/** Standard breakpoint widths for responsive images. */
const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536] as const;

interface SrcSetOptions {
  /** Base URL of the image (without width suffix). */
  baseUrl: string;
  /**
   * Template for building the width-specific URL.
   * Use `{w}` as placeholder for the width value.
   * @default `${baseUrl}?w={w}`
   */
  urlTemplate?: string;
  /** Custom widths to generate. Falls back to DEFAULT_WIDTHS. */
  widths?: readonly number[];
  /** Preferred format (e.g. 'webp'). Appended as `&format=` when set. */
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Generate an HTML `srcSet` string for responsive `<img>` elements.
 *
 * @example
 * const srcSet = generateSrcSet({
 *   baseUrl: '/api/files/abc123/content',
 *   urlTemplate: '/api/files/abc123/content?w={w}',
 *   format: supportsWebP() ? 'webp' : undefined,
 * });
 * // => "/api/files/abc123/content?w=320 320w, ...content?w=1536 1536w"
 */
export function generateSrcSet(options: SrcSetOptions): string {
  const { baseUrl, urlTemplate, widths = DEFAULT_WIDTHS, format } = options;

  return widths
    .map((w) => {
      let url: string;
      if (urlTemplate) {
        url = urlTemplate.replace('{w}', String(w));
      } else {
        const separator = baseUrl.includes('?') ? '&' : '?';
        url = `${baseUrl}${separator}w=${w}`;
      }
      if (format) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}format=${format}`;
      }
      return `${url} ${w}w`;
    })
    .join(', ');
}

// ---------------------------------------------------------------------------
// Default sizes attribute
// ---------------------------------------------------------------------------

/**
 * Sensible default `sizes` attribute for full-width content images
 * in the PRIVOD layout (sidebar offset accounted for).
 */
export const DEFAULT_SIZES =
  '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 60vw';

// ---------------------------------------------------------------------------
// Lazy loading utilities
// ---------------------------------------------------------------------------

/**
 * Props for an optimised `<img>` element.
 * Spread these onto a native `<img>` tag.
 *
 * @example
 * <img {...lazyImageProps('/photo.jpg')} alt="Site photo" />
 */
export function lazyImageProps(
  src: string,
  options?: {
    srcSet?: string;
    sizes?: string;
    /** When true the image loads eagerly (above the fold). */
    eager?: boolean;
  },
): React.ImgHTMLAttributes<HTMLImageElement> {
  return {
    src,
    loading: options?.eager ? 'eager' : 'lazy',
    decoding: 'async',
    ...(options?.srcSet ? { srcSet: options.srcSet } : {}),
    ...(options?.sizes ? { sizes: options.sizes } : { sizes: DEFAULT_SIZES }),
  };
}

// ---------------------------------------------------------------------------
// Intersection Observer lazy loader
// ---------------------------------------------------------------------------

/**
 * Create a callback ref that makes an element visible only when it
 * enters the viewport (using IntersectionObserver).
 *
 * Useful for lazy-loading heavy components (not just images).
 *
 * @example
 * const [ref, isVisible] = useLazyVisible();
 * return <div ref={ref}>{isVisible && <HeavyChart />}</div>;
 */
export function createLazyObserver(
  callback: (isVisible: boolean) => void,
  options?: IntersectionObserverInit,
): (el: HTMLElement | null) => void {
  let observer: IntersectionObserver | null = null;
  let currentEl: HTMLElement | null = null;

  return (el: HTMLElement | null) => {
    // Cleanup previous
    if (observer && currentEl) {
      observer.unobserve(currentEl);
      observer.disconnect();
      observer = null;
    }

    currentEl = el;
    if (!el) return;

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback(true);
          // Once visible, stop observing
          observer?.disconnect();
        }
      },
      { rootMargin: '200px', ...options },
    );

    observer.observe(el);
  };
}
