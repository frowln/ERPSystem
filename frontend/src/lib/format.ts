import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Format money in Russian style: 1 000 000,00 ₽
 */
export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—';
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' ₽'
  );
}

/**
 * Format money as whole-number currency: 1 000 000 ₽ (no decimals)
 */
export function formatMoneyWhole(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format money compact: 1,5 млн ₽
 */
export function formatMoneyCompact(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} млрд ₽`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.', ',')} млн ₽`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)} тыс ₽`;
  }
  return formatMoney(value);
}

/**
 * Format number with space separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('ru-RU').format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1).replace('.', ',')}%`;
}

/**
 * Format date: 15.01.2026
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, 'dd.MM.yyyy', { locale: ru });
}

/**
 * Format date long: 15 января 2026
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, 'd MMMM yyyy', { locale: ru });
}

/**
 * Format relative time: 3 дня назад
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ru });
}

/**
 * Format date with time: 15.01.2026, 14:30
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, 'dd.MM.yyyy, HH:mm', { locale: ru });
}

/**
 * Format file size: 1,5 МБ, 256 КБ, 2,3 ГБ
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return '—';
  if (bytes === 0) return '0 Б';

  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const base = 1024;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / Math.pow(base, exponent);

  if (exponent === 0) return `${bytes} Б`;
  return `${value.toFixed(1).replace('.', ',')} ${units[exponent]}`;
}
