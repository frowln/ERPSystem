// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildMatrix, filterRows } from './matrixBuilder';
import type { SpecItem, CompetitiveListEntry } from '@/types';

function makeItem(overrides: Partial<SpecItem> = {}): SpecItem {
  return {
    id: 'item-1',
    specificationId: 'spec-1',
    sequence: 1,
    name: 'Test Item',
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

function makeEntry(overrides: Partial<CompetitiveListEntry> = {}): CompetitiveListEntry {
  return {
    id: 'entry-1',
    competitiveListId: 'cl-1',
    specItemId: 'item-1',
    supplierName: 'Vendor A',
    vendorName: 'Vendor A',
    unitPrice: 100,
    quantity: 10,
    totalPrice: 1000,
    ...overrides,
  } as CompetitiveListEntry;
}

describe('matrixBuilder', () => {
  it('builds matrix with vendors and rows', () => {
    const items = [makeItem()];
    const entries = [
      makeEntry({ id: 'e1', vendorName: 'Vendor A', unitPrice: 100 }),
      makeEntry({ id: 'e2', vendorName: 'Vendor B', unitPrice: 90 }),
    ];

    const matrix = buildMatrix(items, entries);

    expect(matrix.vendorKeys).toEqual(['Vendor A', 'Vendor B']);
    expect(matrix.vendors).toHaveLength(2);
    expect(matrix.flatRows).toHaveLength(1);
    expect(matrix.kpi.totalPositions).toBe(1);
    expect(matrix.kpi.totalVendors).toBe(2);
  });

  it('identifies best price', () => {
    const items = [makeItem()];
    const entries = [
      makeEntry({ id: 'e1', vendorName: 'Vendor A', unitPrice: 150 }),
      makeEntry({ id: 'e2', vendorName: 'Vendor B', unitPrice: 80 }),
    ];

    const matrix = buildMatrix(items, entries);
    const row = matrix.flatRows[0];

    expect(row.bestPrice).toBe(80);
    expect(row.cells.get('Vendor B')?.isBestPrice).toBe(true);
    expect(row.cells.get('Vendor A')?.isBestPrice).toBe(false);
  });

  it('tracks winner vendor', () => {
    const items = [makeItem()];
    const entries = [
      makeEntry({ id: 'e1', vendorName: 'Vendor A', unitPrice: 100, isWinner: true }),
      makeEntry({ id: 'e2', vendorName: 'Vendor B', unitPrice: 90 }),
    ];

    const matrix = buildMatrix(items, entries);
    expect(matrix.flatRows[0].winnerVendorKey).toBe('Vendor A');
  });

  it('groups by section', () => {
    const items = [
      makeItem({ id: 'i1', sectionName: 'OV', name: 'Item 1' }),
      makeItem({ id: 'i2', sectionName: 'OV', name: 'Item 2' }),
      makeItem({ id: 'i3', sectionName: 'VK', name: 'Item 3' }),
    ];
    const entries = [
      makeEntry({ id: 'e1', specItemId: 'i1', vendorName: 'V', unitPrice: 100 }),
    ];

    const matrix = buildMatrix(items, entries);
    expect(matrix.sections).toHaveLength(2);
    expect(matrix.sections[0].sectionName).toBe('OV');
    expect(matrix.sections[0].rows).toHaveLength(2);
    expect(matrix.sections[1].sectionName).toBe('VK');
    expect(matrix.sections[1].rows).toHaveLength(1);
  });

  it('computes coverage KPI', () => {
    const items = [
      makeItem({ id: 'i1', name: 'Covered' }),
      makeItem({ id: 'i2', name: 'Not covered' }),
    ];
    const entries = [
      makeEntry({ id: 'e1', specItemId: 'i1', vendorName: 'V', unitPrice: 100 }),
    ];

    const matrix = buildMatrix(items, entries);
    expect(matrix.kpi.coveredCount).toBe(1);
    expect(matrix.kpi.coveragePercent).toBe(50);
  });

  it('builds coverage dots per row', () => {
    const items = [makeItem()];
    const entries = [
      makeEntry({ id: 'e1', vendorName: 'A', unitPrice: 100 }),
      makeEntry({ id: 'e2', vendorName: 'B', unitPrice: 90 }),
    ];

    const matrix = buildMatrix(items, entries);
    const dots = matrix.flatRows[0].coverageDots;
    expect(dots).toHaveLength(2);
    expect(dots[0].covered).toBe(true);
    expect(dots[1].covered).toBe(true);
  });
});

describe('filterRows', () => {
  const items = [
    makeItem({ id: 'i1', name: 'Клапан обратный', sectionName: 'OV' }),
    makeItem({ id: 'i2', name: 'Насос циркуляционный', sectionName: 'VK' }),
  ];
  const entries = [
    makeEntry({ id: 'e1', specItemId: 'i1', vendorName: 'V', unitPrice: 100, isWinner: true }),
  ];

  it('filters by search', () => {
    const matrix = buildMatrix(items, entries);
    const result = filterRows(matrix.flatRows, 'клапан', '', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].item.name).toBe('Клапан обратный');
  });

  it('filters by section', () => {
    const matrix = buildMatrix(items, entries);
    const result = filterRows(matrix.flatRows, '', 'VK', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].item.sectionName).toBe('VK');
  });

  it('filters by coverage', () => {
    const matrix = buildMatrix(items, entries);
    const covered = filterRows(matrix.flatRows, '', '', 'covered');
    expect(covered).toHaveLength(1);

    const uncovered = filterRows(matrix.flatRows, '', '', 'uncovered');
    expect(uncovered).toHaveLength(1);
  });

  it('filters by winner', () => {
    const matrix = buildMatrix(items, entries);
    const withWinner = filterRows(matrix.flatRows, '', '', 'winner');
    expect(withWinner).toHaveLength(1);

    const noWinner = filterRows(matrix.flatRows, '', '', 'no-winner');
    expect(noWinner).toHaveLength(1);
  });
});
