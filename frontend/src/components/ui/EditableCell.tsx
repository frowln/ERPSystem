import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface EditableCellProps {
  value: string | number | null | undefined;
  type: 'text' | 'number';
  onSave: (value: string | number) => void;
  format?: (v: number) => string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  step?: number;
}

/**
 * Reusable inline edit cell.
 * Click → input auto-focused → Enter / blur saves → Escape cancels.
 * Used in LsrTreeTable (estimate lines) & SpecificationDetailPage (spec items).
 */
export function EditableCell({
  value,
  type,
  onSave,
  format,
  className = '',
  disabled = false,
  placeholder = '—',
  min,
  step,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      setDraft(value != null ? String(value) : '');
      setEditing(true);
    },
    [value, disabled],
  );

  const handleSave = useCallback(() => {
    setEditing(false);
    if (type === 'number') {
      const cleaned = draft.replace(',', '.').trim();
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) return;
      if (min != null && parsed < min) return;
      if (parsed !== Number(value ?? 0)) {
        onSave(parsed);
      }
    } else {
      const trimmed = draft.trim();
      if (trimmed !== String(value ?? '')) {
        onSave(trimmed);
      }
    }
  }, [draft, type, min, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        setEditing(false);
      }
    },
    [handleSave],
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        step={step ?? (type === 'number' ? 0.01 : undefined)}
        min={min}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className="w-full px-1.5 py-0.5 text-sm border border-blue-400 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  let display: string;
  if (value == null || value === '' || (type === 'number' && Number(value) === 0)) {
    display = placeholder;
  } else if (type === 'number' && format) {
    display = format(Number(value));
  } else {
    display = String(value);
  }

  const isPlaceholder = display === placeholder;

  return (
    <span
      onClick={startEdit}
      className={cn(
        'block w-full truncate',
        !disabled && 'cursor-pointer hover:bg-blue-50 dark:hover:bg-neutral-700 px-1 py-0.5 rounded transition-colors',
        isPlaceholder && 'text-neutral-400 dark:text-neutral-500',
        className,
      )}
      title={!isPlaceholder && value ? String(value) : (!disabled ? t('common.clickToEdit') : undefined)}
    >
      {display}
    </span>
  );
}

export default EditableCell;
