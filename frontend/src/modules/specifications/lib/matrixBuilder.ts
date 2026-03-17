import type { CompetitiveListEntry, SpecItem } from '@/types';
import { getVendorColor, type VendorColor } from './vendorColors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VendorInfo {
  name: string;
  vendorId?: string;
  color: VendorColor;
  totalSelected: number;
  totalCoverage: number;
  grandTotal: number;
}

export interface CellData {
  entry: CompetitiveListEntry;
  isBestPrice: boolean;
  isWinner: boolean;
  isRejected: boolean;
  rejectionType?: string;
}

export interface MatrixRowData {
  item: SpecItem;
  cells: Map<string, CellData>;       // vendorKey → CellData
  bestPrice: number | null;
  winnerVendorKey: string | null;
  coverageDots: { vendorKey: string; covered: boolean }[];
  proposalCount: number;
}

export interface SectionGroup {
  sectionName: string;
  rows: MatrixRowData[];
  collapsed: boolean;
}

export interface MatrixData {
  vendors: VendorInfo[];
  vendorKeys: string[];               // ordered vendor names (keys)
  sections: SectionGroup[];
  flatRows: MatrixRowData[];          // for non-grouped view
  kpi: MatrixKpi;
}

export interface MatrixKpi {
  totalPositions: number;
  totalVendors: number;
  coveragePercent: number;
  coveredCount: number;
  savingsPercent: number;
  totalPlanned: number;
  totalSelected: number;
}

// ---------------------------------------------------------------------------
// Build the comparison matrix from raw data
// ---------------------------------------------------------------------------

export function buildMatrix(
  items: SpecItem[],
  entries: CompetitiveListEntry[],
): MatrixData {
  // 1) Extract unique vendors in order of first appearance
  const vendorMap = new Map<string, VendorInfo>();
  const vendorOrder: string[] = [];

  for (const e of entries) {
    const key = e.vendorName ?? e.supplierName ?? '—';
    if (!vendorMap.has(key)) {
      vendorMap.set(key, {
        name: key,
        vendorId: e.vendorId,
        color: getVendorColor(vendorOrder.length),
        totalSelected: 0,
        totalCoverage: 0,
        grandTotal: 0,
      });
      vendorOrder.push(key);
    }
  }

  // 2) Index entries by specItemId → vendorKey
  const entryIndex = new Map<string, Map<string, CompetitiveListEntry[]>>();
  for (const e of entries) {
    const itemId = e.specItemId ?? '';
    const vendorKey = e.vendorName ?? e.supplierName ?? '—';
    if (!entryIndex.has(itemId)) entryIndex.set(itemId, new Map());
    const vendorEntries = entryIndex.get(itemId)!;
    if (!vendorEntries.has(vendorKey)) vendorEntries.set(vendorKey, []);
    vendorEntries.get(vendorKey)!.push(e);
  }

  // 3) Build rows
  const allRows: MatrixRowData[] = [];
  let totalPlanned = 0;
  let totalSelected = 0;
  let coveredCount = 0;

  for (const item of items) {
    const itemEntries = entryIndex.get(item.id) ?? new Map<string, CompetitiveListEntry[]>();

    // Find best price for this item across all vendors
    let bestPrice: number | null = null;
    const allItemEntries: CompetitiveListEntry[] = [];
    for (const vendorEntries of itemEntries.values()) {
      for (const e of vendorEntries) {
        const rejected = !!e.rejectionType;
        if (!rejected && e.unitPrice > 0) {
          if (bestPrice === null || e.unitPrice < bestPrice) {
            bestPrice = e.unitPrice;
          }
        }
        allItemEntries.push(e);
      }
    }

    // Build cells
    const cells = new Map<string, CellData>();
    let winnerVendorKey: string | null = null;

    for (const vendorKey of vendorOrder) {
      const vendorEntries = itemEntries.get(vendorKey);
      if (!vendorEntries || vendorEntries.length === 0) continue;

      // Take the latest/best entry per vendor per item
      const entry = vendorEntries[vendorEntries.length - 1];
      const isRejected = !!entry.rejectionType;
      const isBest = !isRejected && bestPrice !== null && entry.unitPrice === bestPrice && entry.unitPrice > 0;
      const isWinner = !!(entry.isWinner);

      cells.set(vendorKey, {
        entry,
        isBestPrice: isBest,
        isWinner,
        isRejected,
        rejectionType: entry.rejectionType,
      });

      if (isWinner) {
        winnerVendorKey = vendorKey;
        totalSelected += entry.unitPrice * (entry.quantity ?? item.quantity);
      }

      // Update vendor totals
      const vi = vendorMap.get(vendorKey)!;
      vi.grandTotal += entry.unitPrice * (entry.quantity ?? item.quantity);
      vi.totalCoverage++;
    }

    // Coverage dots
    const coverageDots = vendorOrder.map(vk => ({
      vendorKey: vk,
      covered: cells.has(vk) && !(cells.get(vk)!.isRejected),
    }));

    const hasCoverage = coverageDots.some(d => d.covered);
    if (hasCoverage) coveredCount++;
    totalPlanned += item.plannedAmount ?? 0;

    allRows.push({
      item,
      cells,
      bestPrice,
      winnerVendorKey,
      coverageDots,
      proposalCount: allItemEntries.length,
    });
  }

  // 4) Group by section
  const sectionMap = new Map<string, MatrixRowData[]>();
  for (const row of allRows) {
    const section = row.item.sectionName ?? '';
    if (!sectionMap.has(section)) sectionMap.set(section, []);
    sectionMap.get(section)!.push(row);
  }
  const sections: SectionGroup[] = Array.from(sectionMap.entries()).map(([name, rows]) => ({
    sectionName: name,
    rows,
    collapsed: false,
  }));

  // 5) KPI
  const totalPositions = items.length;
  const totalVendors = vendorOrder.length;
  const coveragePercent = totalPositions > 0 ? Math.round((coveredCount / totalPositions) * 100) : 0;
  const savingsPercent = totalPlanned > 0 && totalSelected > 0
    ? Math.round(((totalPlanned - totalSelected) / totalPlanned) * 100)
    : 0;

  return {
    vendors: vendorOrder.map(k => vendorMap.get(k)!),
    vendorKeys: vendorOrder,
    sections,
    flatRows: allRows,
    kpi: {
      totalPositions,
      totalVendors,
      coveragePercent,
      coveredCount,
      savingsPercent,
      totalPlanned,
      totalSelected,
    },
  };
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

export type CoverageFilter = 'all' | 'covered' | 'uncovered' | 'winner' | 'no-winner';

export function filterRows(
  rows: MatrixRowData[],
  search: string,
  sectionFilter: string,
  coverageFilter: CoverageFilter,
): MatrixRowData[] {
  let result = rows;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r =>
      r.item.name.toLowerCase().includes(q) ||
      (r.item.productCode ?? '').toLowerCase().includes(q) ||
      (r.item.brand ?? '').toLowerCase().includes(q)
    );
  }

  if (sectionFilter) {
    result = result.filter(r => (r.item.sectionName ?? '') === sectionFilter);
  }

  switch (coverageFilter) {
    case 'covered':
      result = result.filter(r => r.coverageDots.some(d => d.covered));
      break;
    case 'uncovered':
      result = result.filter(r => !r.coverageDots.some(d => d.covered));
      break;
    case 'winner':
      result = result.filter(r => r.winnerVendorKey !== null);
      break;
    case 'no-winner':
      result = result.filter(r => r.winnerVendorKey === null);
      break;
  }

  return result;
}
