import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldGroupProps {
  /** Section title */
  title: string;
  /** Optional description shown below the title */
  description?: string;
  /** Whether the group is open by default (default: true) */
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FieldGroup: React.FC<FieldGroupProps> = ({
  title,
  description,
  defaultOpen = true,
  children,
  className,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (open) {
      setHeight(el.scrollHeight);
      const timer = setTimeout(() => setHeight('auto'), 200);
      return () => clearTimeout(timer);
    } else {
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [open]);

  return (
    <div className={cn('', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 w-full text-left py-2 group',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded',
        )}
        aria-expanded={open}
      >
        <ChevronDown
          size={16}
          className={cn(
            'text-neutral-400 dark:text-neutral-500 transition-transform duration-200',
            !open && '-rotate-90',
          )}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
            {title}
          </span>
          {description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-200 ease-in-out"
        style={{ height: height === 'auto' ? undefined : height }}
        aria-hidden={!open}
      >
        <div className="pl-4 border-l-2 border-primary-100 dark:border-primary-900/40 mt-2 pb-1">
          {children}
        </div>
      </div>
    </div>
  );
};

FieldGroup.displayName = 'FieldGroup';
