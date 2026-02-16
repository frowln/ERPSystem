import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  formatFileSize,
  formatMoney,
  formatMoneyCompact,
  formatMoneyWhole,
  formatNumber,
  formatPercent,
} from './format';

describe('format utils', () => {
  it('formats money with ruble suffix', () => {
    const formatted = formatMoney(1000).replace(/\u00A0/g, ' ');
    expect(formatted).toBe('1 000,00 ₽');
  });

  it('returns em dash for empty money value', () => {
    expect(formatMoney(null)).toBe('—');
  });

  it('formats compact money for millions', () => {
    expect(formatMoneyCompact(1_500_000)).toBe('1,5 млн ₽');
  });

  it('formats date and handles invalid value', () => {
    expect(formatDate('2026-02-15')).toBe('15.02.2026');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats percent with single fractional digit', () => {
    expect(formatPercent(12.34)).toBe('12,3%');
  });

  it('formats file size by units', () => {
    expect(formatFileSize(0)).toBe('0 Б');
    expect(formatFileSize(1536)).toBe('1,5 КБ');
    expect(formatFileSize(-1)).toBe('—');
  });

  it('formats compact money for billions', () => {
    expect(formatMoneyCompact(2_500_000_000)).toBe('2,5 млрд ₽');
  });

  it('formats compact money for thousands', () => {
    expect(formatMoneyCompact(5_000)).toBe('5 тыс ₽');
  });

  it('formats compact money for small values', () => {
    const result = formatMoneyCompact(500);
    expect(result).toContain('500');
    expect(result).toContain('₽');
  });

  it('formatMoneyCompact returns em dash for null', () => {
    expect(formatMoneyCompact(null)).toBe('—');
  });

  it('formatMoneyWhole formats whole number currency', () => {
    const result = formatMoneyWhole(1234567);
    expect(result).not.toBe('—');
  });

  it('formatMoneyWhole returns em dash for null', () => {
    expect(formatMoneyWhole(null)).toBe('—');
  });

  it('formatNumber formats with space separators', () => {
    const formatted = formatNumber(1234567).replace(/\u00A0/g, ' ');
    expect(formatted).toBe('1 234 567');
  });

  it('formatNumber returns em dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('formatPercent returns em dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('formatDate returns em dash for empty string', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('formatDateLong formats in long Russian date', () => {
    const result = formatDateLong('2026-01-15');
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });

  it('formatDateLong returns em dash for invalid', () => {
    expect(formatDateLong(null)).toBe('—');
    expect(formatDateLong('bad-date')).toBe('—');
  });

  it('formatDateTime includes time', () => {
    const result = formatDateTime('2026-01-15T14:30:00Z');
    expect(result).toContain('15.01.2026');
  });

  it('formatDateTime returns em dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('formatFileSize handles megabytes', () => {
    const result = formatFileSize(1_048_576);
    expect(result).toBe('1,0 МБ');
  });

  it('formatFileSize handles null', () => {
    expect(formatFileSize(null)).toBe('—');
  });
});
