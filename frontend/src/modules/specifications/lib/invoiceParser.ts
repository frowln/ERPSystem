import * as XLSX from 'xlsx';
import type { InvoiceLine } from './fuzzyMatcher';

export interface ParsedInvoice {
  vendorName: string;
  lines: InvoiceLine[];
  errors: string[];
}

export interface ColumnMapping {
  name: number;
  productCode?: number;
  brand?: number;
  quantity?: number;
  unit?: number;
  unitPrice?: number;
  totalPrice?: number;
}

const HEADER_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  name: [/наименование/i, /название/i, /товар/i, /описание/i, /позиция/i, /name/i, /product/i, /description/i],
  productCode: [/код/i, /артикул/i, /арт\./i, /code/i, /sku/i, /article/i],
  brand: [/марка/i, /бренд/i, /тип/i, /brand/i],
  quantity: [/кол[-.]*во/i, /количество/i, /qty/i, /quantity/i],
  unit: [/ед\.?\s*изм/i, /единица/i, /unit/i],
  unitPrice: [/цена/i, /за ед/i, /unit\s*price/i, /price/i],
  totalPrice: [/сумма/i, /итого/i, /стоимость/i, /total/i, /amount/i],
};

/**
 * Parse an xlsx/xls/csv file buffer into invoice lines.
 */
export function parseInvoiceFile(
  buffer: ArrayBuffer,
  vendorName: string,
): ParsedInvoice {
  const errors: string[] = [];
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { vendorName, lines: [], errors: ['Пустой файл'] };

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return { vendorName, lines: [], errors: ['Файл содержит менее 2 строк'] };

  // Auto-detect header row and column mapping
  const { headerRow, mapping } = detectColumns(rows);
  if (headerRow < 0 || mapping.name < 0) {
    errors.push('Не удалось определить колонку "Наименование"');
    return { vendorName, lines: [], errors };
  }

  const lines: InvoiceLine[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = cellStr(row, mapping.name);
    if (!name || name.length < 2) continue;

    // Skip totals / summary rows
    if (/^(итого|всего|total|подитог|subtotal)/i.test(name.trim())) continue;

    const line: InvoiceLine = {
      name,
      productCode: mapping.productCode != null ? cellStr(row, mapping.productCode) : undefined,
      brand: mapping.brand != null ? cellStr(row, mapping.brand) : undefined,
      quantity: mapping.quantity != null ? cellNum(row, mapping.quantity) : undefined,
      unit: mapping.unit != null ? cellStr(row, mapping.unit) : undefined,
      unitPrice: mapping.unitPrice != null ? cellNum(row, mapping.unitPrice) : undefined,
      totalPrice: mapping.totalPrice != null ? cellNum(row, mapping.totalPrice) : undefined,
    };

    // Calculate total if only unit price and quantity
    if (!line.totalPrice && line.unitPrice && line.quantity) {
      line.totalPrice = line.unitPrice * line.quantity;
    }

    lines.push(line);
  }

  return { vendorName, lines, errors };
}

/**
 * Detect header row and column mapping from raw rows.
 */
export function detectColumns(rows: any[][]): { headerRow: number; mapping: ColumnMapping } {
  // Scan first 15 rows to find header
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r];
    if (!row) continue;

    let nameCol = -1;
    const mapping: ColumnMapping = { name: -1 };

    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] ?? '').trim();
      if (!val) continue;

      for (const [field, patterns] of Object.entries(HEADER_PATTERNS)) {
        if (patterns.some(p => p.test(val))) {
          if (field === 'name') {
            nameCol = c;
            mapping.name = c;
          } else {
            (mapping as any)[field] = c;
          }
          break;
        }
      }
    }

    if (nameCol >= 0) {
      return { headerRow: r, mapping };
    }
  }

  return { headerRow: -1, mapping: { name: -1 } };
}

function cellStr(row: any[], col: number): string {
  return String(row[col] ?? '').replace(/\r/g, '').trim();
}

function cellNum(row: any[], col: number): number | undefined {
  const val = row[col];
  if (val == null || val === '') return undefined;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}
