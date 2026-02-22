import React, { useState, useRef, useEffect, useCallback } from 'react';

interface InlineEditCellProps {
  value: number | null | undefined;
  onSave: (value: number) => void;
  format?: (v: number) => string;
  className?: string;
  disabled?: boolean;
  min?: number;
}

export default function InlineEditCell({
  value,
  onSave,
  format,
  className = '',
  disabled = false,
  min = 0,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    setDraft(value != null ? String(value) : '');
    setEditing(true);
  }, [value, disabled]);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= min) {
      onSave(parsed);
    }
    setEditing(false);
  }, [draft, min, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        setEditing(false);
      }
    },
    [handleSave],
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min={min}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-1.5 py-0.5 text-sm border border-blue-400 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  const display = value != null ? (format ? format(value) : value.toLocaleString('ru-RU')) : '—';

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-neutral-700 px-1.5 py-0.5 rounded transition-colors ${className}`}
      title={disabled ? '' : 'Двойной клик для редактирования'}
    >
      {display}
    </span>
  );
}
