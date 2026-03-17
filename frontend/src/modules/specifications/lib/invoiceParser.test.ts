// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { detectColumns } from './invoiceParser';

describe('invoiceParser', () => {
  describe('detectColumns', () => {
    it('detects Russian header columns', () => {
      const rows = [
        ['№', 'Наименование', 'Ед.изм.', 'Кол-во', 'Цена', 'Сумма'],
        [1, 'Клапан', 'шт', 10, 100, 1000],
      ];
      const { headerRow, mapping } = detectColumns(rows);
      expect(headerRow).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.unit).toBe(2);
      expect(mapping.quantity).toBe(3);
      expect(mapping.unitPrice).toBe(4);
      expect(mapping.totalPrice).toBe(5);
    });

    it('detects English header columns', () => {
      const rows = [
        ['Description', 'Qty', 'Unit', 'Price', 'Amount'],
      ];
      const { headerRow, mapping } = detectColumns(rows);
      expect(headerRow).toBe(0);
      expect(mapping.name).toBe(0);
      expect(mapping.quantity).toBe(1);
      expect(mapping.unit).toBe(2);
      expect(mapping.unitPrice).toBe(3);
      expect(mapping.totalPrice).toBe(4);
    });

    it('detects header in non-first row', () => {
      const rows = [
        ['Счёт-фактура от 01.01.2026'],
        ['ООО "Поставщик"'],
        [],
        ['Наименование', 'Количество', 'Цена за единицу', 'Итого'],
        ['Клапан', 10, 100, 1000],
      ];
      const { headerRow, mapping } = detectColumns(rows);
      expect(headerRow).toBe(3);
      expect(mapping.name).toBe(0);
      expect(mapping.quantity).toBe(1);
      expect(mapping.unitPrice).toBe(2);
      expect(mapping.totalPrice).toBe(3);
    });

    it('returns -1 when no header found', () => {
      const rows = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const { headerRow, mapping } = detectColumns(rows);
      expect(headerRow).toBe(-1);
      expect(mapping.name).toBe(-1);
    });
  });
});
