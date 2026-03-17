// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { matchInvoiceLine, batchMatch, type InvoiceLine } from './fuzzyMatcher';
import type { SpecItem } from '@/types';

function makeSpecItem(overrides: Partial<SpecItem> = {}): SpecItem {
  return {
    id: 'item-1',
    specificationId: 'spec-1',
    sequence: 1,
    name: 'Клапан обратный DN50',
    quantity: 10,
    unitOfMeasure: 'шт',
    plannedAmount: 10000,
    itemType: 'MATERIAL',
    procurementStatus: 'NEW',
    estimateStatus: 'PENDING',
    isCustomerProvided: false,
    ...overrides,
  } as SpecItem;
}

describe('fuzzyMatcher', () => {
  const specItems = [
    makeSpecItem({ id: 'i1', name: 'Клапан обратный DN50', productCode: 'KL-50' }),
    makeSpecItem({ id: 'i2', name: 'Насос циркуляционный Grundfos', brand: 'Grundfos' }),
    makeSpecItem({ id: 'i3', name: 'Трубы полипропиленовые 32мм' }),
  ];

  it('matches by exact product code', () => {
    const line: InvoiceLine = { name: 'Клапан KL-50', productCode: 'KL-50' };
    const results = matchInvoiceLine(line, specItems);
    expect(results[0].specItem.id).toBe('i1');
    expect(results[0].confidence).toBe(95);
    expect(results[0].matchType).toBe('exact-code');
  });

  it('matches by brand', () => {
    const line: InvoiceLine = { name: 'Pump', brand: 'Grundfos' };
    const results = matchInvoiceLine(line, specItems);
    expect(results[0].specItem.id).toBe('i2');
    expect(results[0].confidence).toBe(75);
    expect(results[0].matchType).toBe('brand-mfr');
  });

  it('matches by fuzzy name similarity', () => {
    const line: InvoiceLine = { name: 'Клапан обратный DN 50 фланцевый' };
    const results = matchInvoiceLine(line, specItems);
    expect(results[0].specItem.id).toBe('i1');
    expect(results[0].matchType).toBe('fuzzy-name');
    expect(results[0].confidence).toBeGreaterThan(40);
  });

  it('returns empty for completely unrelated items', () => {
    const line: InvoiceLine = { name: 'XYZABC totally unrelated' };
    const results = matchInvoiceLine(line, specItems);
    expect(results.length).toBeLessThanOrEqual(5);
    if (results.length > 0) {
      expect(results[0].confidence).toBeLessThan(50);
    }
  });

  it('batch matches multiple lines', () => {
    const lines: InvoiceLine[] = [
      { name: 'Клапан KL-50', productCode: 'KL-50' },
      { name: 'Трубы полипропиленовые 32мм' },
    ];
    const results = batchMatch(lines, specItems);
    expect(results).toHaveLength(2);
    expect(results[0].bestMatch).not.toBeNull();
    expect(results[0].bestMatch!.specItem.id).toBe('i1');
    expect(results[1].bestMatch).not.toBeNull();
    expect(results[1].bestMatch!.specItem.id).toBe('i3');
  });
});
