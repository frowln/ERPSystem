import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  getYear,
  getMonth,
  setMonth,
  setYear,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const getWeekdays = () => [
  t('datePicker.weekdays.mon'), t('datePicker.weekdays.tue'), t('datePicker.weekdays.wed'),
  t('datePicker.weekdays.thu'), t('datePicker.weekdays.fri'), t('datePicker.weekdays.sat'),
  t('datePicker.weekdays.sun'),
];
const getMonths = () => [
  t('datePicker.months.jan'), t('datePicker.months.feb'), t('datePicker.months.mar'),
  t('datePicker.months.apr'), t('datePicker.months.may'), t('datePicker.months.jun'),
  t('datePicker.months.jul'), t('datePicker.months.aug'), t('datePicker.months.sep'),
  t('datePicker.months.oct'), t('datePicker.months.nov'), t('datePicker.months.dec'),
];

export interface DatePickerProps {
  /** Selected date as ISO string YYYY-MM-DD. */
  value?: string;
  /** Called with ISO string YYYY-MM-DD or empty string on clear. */
  onChange?: (value: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Minimum selectable date (ISO string). */
  minDate?: string;
  /** Maximum selectable date (ISO string). */
  maxDate?: string;
  /** Allow clearing the selection. */
  clearable?: boolean;
  /** Disable the component. */
  disabled?: boolean;
  /** Show error ring. */
  hasError?: boolean;
  /** Additional class on root wrapper. */
  className?: string;
  /** ID for FormField integration. */
  id?: string;
  /** ARIA label. */
  'aria-label'?: string;
  /** ARIA described-by. */
  'aria-describedby'?: string;
  /** ARIA invalid. */
  'aria-invalid'?: boolean;
}

function parseIso(s: string | undefined): Date | null {
  if (!s) return null;
  const d = parse(s, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : null;
}

function toIso(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function displayDate(d: Date): string {
  return format(d, 'dd.MM.yyyy', { locale: ru });
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder,
      minDate,
      maxDate,
      clearable = true,
      disabled = false,
      hasError = false,
      className,
      id,
      ...ariaProps
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
      const parsed = parseIso(value);
      return parsed ?? new Date();
    });
    const [focusedDate, setFocusedDate] = useState<Date | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const selectedDate = useMemo(() => parseIso(value), [value]);
    const minD = useMemo(() => parseIso(minDate), [minDate]);
    const maxD = useMemo(() => parseIso(maxDate), [maxDate]);

    // Update viewDate when value changes externally
    useEffect(() => {
      const parsed = parseIso(value);
      if (parsed) setViewDate(parsed);
    }, [value]);

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

    const isDateDisabled = useCallback(
      (d: Date): boolean => {
        if (minD && isBefore(d, minD)) return true;
        if (maxD && isAfter(d, maxD)) return true;
        return false;
      },
      [minD, maxD],
    );

    // Build calendar grid
    const calendarDays = useMemo(() => {
      const monthStart = startOfMonth(viewDate);
      const monthEnd = endOfMonth(viewDate);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      const days: Date[] = [];
      let current = gridStart;
      while (current <= gridEnd) {
        days.push(current);
        current = addDays(current, 1);
      }
      return days;
    }, [viewDate]);

    const open = () => {
      if (disabled) return;
      setIsOpen(true);
      setFocusedDate(selectedDate ?? new Date());
    };

    const close = () => {
      setIsOpen(false);
      setFocusedDate(null);
    };

    const selectDate = (d: Date) => {
      if (isDateDisabled(d)) return;
      onChange?.(toIso(d));
      close();
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    };

    const prevMonth = () => setViewDate((v) => subMonths(v, 1));
    const nextMonth = () => setViewDate((v) => addMonths(v, 1));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          open();
        }
        return;
      }

      const focused = focusedDate ?? selectedDate ?? new Date();

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedDate(addDays(focused, -1));
          if (!isSameMonth(addDays(focused, -1), viewDate)) {
            setViewDate(startOfMonth(addDays(focused, -1)));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedDate(addDays(focused, 1));
          if (!isSameMonth(addDays(focused, 1), viewDate)) {
            setViewDate(startOfMonth(addDays(focused, 1)));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedDate(addDays(focused, -7));
          if (!isSameMonth(addDays(focused, -7), viewDate)) {
            setViewDate(startOfMonth(addDays(focused, -7)));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedDate(addDays(focused, 7));
          if (!isSameMonth(addDays(focused, 7), viewDate)) {
            setViewDate(startOfMonth(addDays(focused, 7)));
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (focused && !isDateDisabled(focused)) {
            selectDate(focused);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    };

    // Year select range
    const currentYear = getYear(viewDate);
    const yearOptions = useMemo(() => {
      const years: number[] = [];
      for (let y = currentYear - 10; y <= currentYear + 10; y++) {
        years.push(y);
      }
      return years;
    }, [currentYear]);

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        {/* Trigger */}
        <div
          role="group"
          className={cn(
            'flex items-center w-full h-9 border rounded-lg transition-colors duration-150 bg-white dark:bg-neutral-800 cursor-pointer',
            hasError
              ? 'border-danger-300 dark:border-danger-600'
              : isOpen
                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
            disabled && 'bg-neutral-50 dark:bg-neutral-900 cursor-not-allowed opacity-60',
          )}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={handleKeyDown}
        >
          <Calendar className="ml-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
          <span
            className={cn(
              'flex-1 px-2 text-sm truncate leading-9',
              selectedDate ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500',
            )}
          >
            {selectedDate ? displayDate(selectedDate) : (placeholder ?? t('datePicker.placeholder'))}
          </span>

          {/* Hidden input for FormField id targeting & form value */}
          <input
            ref={ref}
            id={id}
            type="text"
            readOnly
            tabIndex={0}
            value={value ?? ''}
            className="sr-only"
            onFocus={() => !isOpen && open()}
            onKeyDown={handleKeyDown}
            aria-label={ariaProps['aria-label']}
            aria-describedby={ariaProps['aria-describedby']}
            aria-invalid={ariaProps['aria-invalid']}
          />

          <div className="flex items-center pr-2 gap-0.5 shrink-0">
            {clearable && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                tabIndex={-1}
                className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                aria-label={t('datePicker.clear')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Calendar dropdown */}
        {isOpen && (
          <div
            className="absolute z-50 mt-1 w-72 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3"
            role="dialog"
            aria-label={t('datePicker.calendarLabel')}
          >
            {/* Header: month/year navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                aria-label={t('datePicker.prevMonth')}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={getMonth(viewDate)}
                  onChange={(e) => setViewDate(setMonth(viewDate, Number(e.target.value)))}
                  className="text-sm font-medium bg-transparent text-neutral-900 dark:text-neutral-100 border-none focus:outline-none cursor-pointer"
                >
                  {getMonths().map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
                <select
                  value={getYear(viewDate)}
                  onChange={(e) => setViewDate(setYear(viewDate, Number(e.target.value)))}
                  className="text-sm font-medium bg-transparent text-neutral-900 dark:text-neutral-100 border-none focus:outline-none cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                aria-label={t('datePicker.nextMonth')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {getWeekdays().map((day) => (
                <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div ref={gridRef} className="grid grid-cols-7" role="grid">
              {calendarDays.map((day) => {
                const inMonth = isSameMonth(day, viewDate);
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const today = isToday(day);
                const focused = focusedDate ? isSameDay(day, focusedDate) : false;
                const dateDisabled = isDateDisabled(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    role="gridcell"
                    aria-selected={selected}
                    aria-disabled={dateDisabled}
                    tabIndex={-1}
                    disabled={dateDisabled}
                    onClick={() => selectDate(day)}
                    className={cn(
                      'h-8 w-full text-sm rounded transition-colors',
                      !inMonth && 'text-neutral-300 dark:text-neutral-600',
                      inMonth && !selected && !dateDisabled && 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700',
                      selected && 'bg-primary-600 text-white hover:bg-primary-700',
                      today && !selected && 'font-bold',
                      today && !selected && inMonth && 'text-primary-600 dark:text-primary-400',
                      focused && !selected && 'ring-2 ring-primary-400 ring-inset',
                      dateDisabled && 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => selectDate(new Date())}
                disabled={isDateDisabled(new Date())}
                className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-1 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700/50 disabled:text-neutral-400 disabled:cursor-not-allowed"
              >
                {t('datePicker.today')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';
