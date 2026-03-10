import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 200; // rough estimate
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight;

    setPos({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: align === 'right' ? rect.right : rect.left,
    });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, updatePosition]);

  const menu = open && pos ? createPortal(
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[9999] min-w-[200px] py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg',
      )}
      style={{
        top: pos.top,
        ...(align === 'right'
          ? { right: window.innerWidth - pos.left }
          : { left: pos.left }),
      }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          disabled={item.disabled || item.loading}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            item.variant === 'danger'
              ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20'
              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          )}
          onClick={() => {
            item.onClick();
            setOpen(false);
          }}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={triggerRef} className={cn('relative', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {menu}
    </div>
  );
};
