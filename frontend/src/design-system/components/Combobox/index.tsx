import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  /** Static options list (client-side filtering). */
  options?: ComboboxOption[];
  /** Selected value (single select). */
  value?: string;
  /** Called when selection changes. */
  onChange?: (value: string) => void;
  /** Placeholder text shown when nothing is selected. */
  placeholder?: string;
  /** Allow clearing the selection. */
  clearable?: boolean;
  /** Disable the component. */
  disabled?: boolean;
  /** Show error ring. */
  hasError?: boolean;
  /** External loading state (e.g. from React Query). */
  isLoading?: boolean;
  /** Async search handler — replaces client-side filter when provided. */
  onSearch?: (query: string) => void;
  /** Debounce time in ms for onSearch. Default 300. */
  debounceMs?: number;
  /** Max dropdown height in px. Default 256. */
  maxHeight?: number;
  /** Additional class on the root wrapper. */
  className?: string;
  /** ARIA label. */
  'aria-label'?: string;
  /** ARIA described-by. */
  'aria-describedby'?: string;
  /** ARIA invalid. */
  'aria-invalid'?: boolean;
  /** ID for FormField integration. */
  id?: string;
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options = [],
      value,
      onChange,
      placeholder,
      clearable = true,
      disabled = false,
      hasError = false,
      isLoading = false,
      onSearch,
      debounceMs = 300,
      maxHeight = 256,
      className,
      id,
      ...ariaProps
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Merge forwarded ref with internal ref
    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    // Client-side filter
    const filtered = useMemo(() => {
      if (onSearch) return options; // async search — options are already filtered by parent
      if (!query.trim()) return options;
      const q = query.toLowerCase();
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query, onSearch]);

    // Debounced search callback
    useEffect(() => {
      if (!onSearch) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, [query, onSearch, debounceMs]);

    // Selected option label
    const selectedOption = options.find((o) => o.value === value);

    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Scroll active item into view
    useEffect(() => {
      if (activeIndex < 0 || !listRef.current) return;
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const open = () => {
      if (disabled) return;
      setIsOpen(true);
      setActiveIndex(-1);
      // If not already showing search, clear query on open so user can type fresh
      setQuery('');
      // Focus input after state update
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    const close = () => {
      setIsOpen(false);
      setQuery('');
      setActiveIndex(-1);
    };

    const selectOption = (opt: ComboboxOption) => {
      onChange?.(opt.value);
      close();
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      setQuery('');
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            open();
          } else {
            setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (isOpen && activeIndex >= 0 && filtered[activeIndex]) {
            selectOption(filtered[activeIndex]);
          } else if (!isOpen) {
            open();
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          if (isOpen) close();
          break;
      }
    };

    const listboxId = id ? `${id}-listbox` : undefined;

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        {/* Trigger / input area */}
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-owns={listboxId}
          className={cn(
            'flex items-center w-full h-9 border rounded-lg transition-colors duration-150 bg-white dark:bg-neutral-800',
            hasError
              ? 'border-danger-300 dark:border-danger-600'
              : isOpen
                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
            disabled && 'bg-neutral-50 dark:bg-neutral-900 cursor-not-allowed opacity-60',
          )}
          onClick={() => !isOpen && open()}
        >
          {isOpen ? (
            <>
              <Search className="ml-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <input
                ref={setInputRef}
                id={id}
                type="text"
                role="searchbox"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={selectedOption?.label ?? placeholder ?? t('combobox.search')}
                className="flex-1 h-full px-2 text-sm bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                aria-label={ariaProps['aria-label']}
                aria-describedby={ariaProps['aria-describedby']}
                aria-invalid={ariaProps['aria-invalid']}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 && filtered[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined}
              />
            </>
          ) : (
            <>
              <span
                className={cn(
                  'flex-1 px-3 text-sm truncate leading-9',
                  selectedOption ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500',
                )}
              >
                {selectedOption?.label ?? placeholder ?? t('combobox.placeholder')}
              </span>
              {/* Hidden input for FormField id targeting */}
              <input
                ref={setInputRef}
                id={id}
                type="text"
                readOnly
                tabIndex={-1}
                value={value ?? ''}
                className="sr-only"
                onFocus={open}
                onKeyDown={handleKeyDown}
                aria-label={ariaProps['aria-label']}
                aria-describedby={ariaProps['aria-describedby']}
                aria-invalid={ariaProps['aria-invalid']}
              />
            </>
          )}

          {/* Right icons */}
          <div className="flex items-center pr-2 gap-0.5 shrink-0">
            {isLoading && <Loader2 className="h-4 w-4 text-neutral-400 animate-spin" />}
            {clearable && value && !disabled && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                tabIndex={-1}
                className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                aria-label={t('combobox.clear')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-neutral-400 dark:text-neutral-500 transition-transform duration-150',
                isOpen && 'rotate-180',
              )}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-auto"
            style={{ maxHeight }}
          >
            {filtered.length === 0 && !isLoading && (
              <li className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                {t('combobox.noResults')}
              </li>
            )}
            {filtered.length === 0 && isLoading && (
              <li className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('combobox.loading')}
              </li>
            )}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                    isActive && 'bg-primary-50 dark:bg-primary-900/30',
                    isSelected && !isActive && 'bg-neutral-50 dark:bg-neutral-700/50',
                    !isActive && !isSelected && 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="flex-1 truncate text-neutral-900 dark:text-neutral-100">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  },
);
Combobox.displayName = 'Combobox';
