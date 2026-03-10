import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface SelectOption {
  value: string;
  label: string;
}

export interface InlineEditCellProps {
  value: string | number;
  onSave: (newValue: string | number) => void;
  type?: 'text' | 'number' | 'select';
  options?: SelectOption[];
  editable?: boolean;
  className?: string;
}

type SaveState = 'idle' | 'success' | 'error';

export function InlineEditCell({
  value,
  onSave,
  type = 'text',
  options,
  editable = true,
  className,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value ?? ''));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // Sync draft when value changes externally (while not editing)
  useEffect(() => {
    if (!editing) {
      setDraft(String(value ?? ''));
    }
  }, [value, editing]);

  // Auto-focus and select on edit
  useEffect(() => {
    if (!editing) return;
    if (type === 'select') {
      selectRef.current?.focus();
    } else {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, type]);

  // Clear save state animation
  useEffect(() => {
    if (saveState === 'idle') return;
    const timer = setTimeout(() => setSaveState('idle'), 500);
    return () => clearTimeout(timer);
  }, [saveState]);

  const startEditing = useCallback(() => {
    if (!editable) return;
    setDraft(String(value ?? ''));
    setEditing(true);
  }, [editable, value]);

  const commitSave = useCallback(() => {
    const trimmed = draft.trim();

    // Validate number type
    if (type === 'number') {
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed)) {
        setSaveState('error');
        setEditing(false);
        setDraft(String(value ?? ''));
        return;
      }
      if (parsed !== value) {
        onSave(parsed);
        setSaveState('success');
      }
    } else {
      if (trimmed !== String(value ?? '')) {
        onSave(trimmed);
        setSaveState('success');
      }
    }

    setEditing(false);
  }, [draft, type, value, onSave]);

  const cancelEditing = useCallback(() => {
    setDraft(String(value ?? ''));
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      } else if (e.key === 'Tab') {
        // Let Tab naturally move focus; commit current edit first
        commitSave();
        // Find next editable cell in the row
        const currentCell = cellRef.current?.closest('td');
        if (!currentCell) return;
        const row = currentCell.closest('tr');
        if (!row) return;
        const cells = Array.from(row.querySelectorAll('td'));
        const currentIndex = cells.indexOf(currentCell);
        const direction = e.shiftKey ? -1 : 1;
        for (
          let i = currentIndex + direction;
          i >= 0 && i < cells.length;
          i += direction
        ) {
          const editableDiv = cells[i].querySelector(
            '[data-inline-edit]',
          ) as HTMLElement | null;
          if (editableDiv) {
            e.preventDefault();
            editableDiv.click();
            return;
          }
        }
      }
    },
    [commitSave, cancelEditing],
  );

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newVal = e.target.value;
      setDraft(newVal);
      // Commit immediately on select change
      if (newVal !== String(value ?? '')) {
        onSave(newVal);
        setSaveState('success');
      }
      setEditing(false);
    },
    [value, onSave],
  );

  // ── Edit mode ──
  if (editing) {
    if (type === 'select' && options) {
      return (
        <div ref={cellRef} className={cn('relative', className)}>
          <select
            ref={selectRef}
            value={draft}
            onChange={handleSelectChange}
            onBlur={() => setEditing(false)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm rounded border-2 border-primary-500 bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-400 appearance-auto"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div ref={cellRef} className={cn('relative', className)}>
        <input
          ref={inputRef}
          type={type}
          step={type === 'number' ? 'any' : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm rounded border-2 border-primary-500 bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>
    );
  }

  // ── Display mode ──
  const displayValue =
    type === 'select' && options
      ? options.find((o) => o.value === String(value))?.label ?? String(value ?? '')
      : String(value ?? '');

  return (
    <div
      ref={cellRef}
      data-inline-edit
      role="button"
      tabIndex={editable ? 0 : undefined}
      title={editable ? t('table.editCell') : undefined}
      onClick={startEditing}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'F2') {
                e.preventDefault();
                startEditing();
              }
            }
          : undefined
      }
      className={cn(
        'group/edit relative min-h-[1.5em] rounded px-1 -mx-1 transition-colors duration-200',
        editable && 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800',
        saveState === 'success' && 'animate-save-flash',
        saveState === 'error' && 'ring-2 ring-red-400',
        className,
      )}
    >
      <span className="select-none">{displayValue}</span>
      {editable && (
        <Pencil
          size={12}
          className="absolute top-0.5 right-0.5 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none"
          aria-hidden
        />
      )}
    </div>
  );
}
