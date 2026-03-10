/**
 * Full-hierarchy ЛСР (Локальный Сметный Расчёт) xlsx parser.
 *
 * Parses real ЛСР files per Minstroy 421/pr (Методика РИМ) into a tree:
 *   Section > Position > Resource
 * Also extracts the summary block (konzovka) with surcharges, VAT, and grand total.
 *
 * Supports: ГРАНД-Смета, Smeta.RU, 1С-Смета, generic xlsx ЛСР files.
 */
import * as XLSX from 'xlsx';
import type { LsrLineType, LsrPositionType, LsrResourceType } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface LsrParsedNode {
  lineNumber: number;
  lineType: LsrLineType;
  positionType?: LsrPositionType;
  resourceType?: LsrResourceType;
  justification: string;
  name: string;
  unit: string;
  quantityPerUnit?: number;
  coefficient?: number;
  quantityTotal: number;
  baseCost: number;
  indexValue?: number;
  currentCost: number;
  coefficients?: string;
  totalAmount: number;
  children: LsrParsedNode[];
  sectionName?: string;
  depth: number;
}

export interface LsrParsedSummary {
  directCostsTotal: number;
  overheadTotal: number;
  profitTotal: number;
  subtotal: number;
  winterSurcharge: number;
  winterSurchargeRate: number;
  tempStructures: number;
  tempStructuresRate: number;
  contingency: number;
  contingencyRate: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
}

export interface LsrColumnMapping {
  numCol: number;
  codeCol: number;
  nameCol: number;
  unitCol: number;
  qtyPerUnitCol: number;
  qtyCoeffCol: number;
  qtyTotalCol: number;
  baseCostCol: number;
  indexCol: number;
  currentCostCol: number;
  coefficientsCol: number;
  totalCol: number;
}

export interface LsrParseResult {
  sections: LsrParsedNode[];
  summary: LsrParsedSummary;
  flatLines: LsrParsedNode[];
  metadata: {
    fileName: string;
    sheetName: string;
    totalRows: number;
    parsedPositions: number;
    parsedResources: number;
    parsedSections: number;
  };
  columnMapping: LsrColumnMapping;
}

// ─────────────────────────────────────────────────────────────────────────────
// Known column mappings
// ─────────────────────────────────────────────────────────────────────────────

/** Standard ГРАНД-Смета column layout (16 cols A-P):
 *  A=№  B=Обоснование  C-G=Наименование(merged)  H=Ед.изм.
 *  I=Кол(на ед)  J=Кол(коэфф)  K=Кол(всего)
 *  L=Базис  M=Индекс  N=Текущая  O=Коэфф  P=Всего */
const GRAND_SMETA_MAPPING: LsrColumnMapping = {
  numCol: 0,
  codeCol: 1,
  nameCol: 2,
  unitCol: 7,
  qtyPerUnitCol: 8,
  qtyCoeffCol: 9,
  qtyTotalCol: 10,
  baseCostCol: 11,
  indexCol: 12,
  currentCostCol: 13,
  coefficientsCol: 14,
  totalCol: 15,
};

/** Maximum number of primary data columns in ГРАНД-Смета (A-P = 16).
 *  Columns beyond this are duplicate print area and should be trimmed. */
const MAX_PRIMARY_COLS = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Main parse function
// ─────────────────────────────────────────────────────────────────────────────

export function parseFullLsrFile(file: File): Promise<LsrParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rawRows: string[][] = (XLSX.utils.sheet_to_json(sheet, {
          header: 1, defval: '', raw: false,
        }) as unknown[][]).map((r) => r.map((c) => String(c ?? '').trim()));

        // Trim duplicate print area — ГРАНД-Смета may export 243 cols (A-II)
        const rows = rawRows.map((r) => r.slice(0, MAX_PRIMARY_COLS));

        const result = parseFullLsrRows(rows, file.name, sheetName);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal parsing
// ─────────────────────────────────────────────────────────────────────────────

const parseNum = (s: string): number => {
  const cleaned = s.replace(/\s/g, '');
  // US format: "75,124,900.79" — commas are thousands separators, dot is decimal
  if (cleaned.includes('.') && cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  // Russian format: "75124900,79" or "1,5" — comma is decimal separator
  return parseFloat(cleaned.replace(',', '.')) || 0;
};

const col = (row: string[], idx: number): string =>
  idx >= 0 ? (row[idx] ?? '') : '';

/** Detect position type from code in column B */
function detectPositionType(code: string): LsrPositionType | undefined {
  const c = code.trim();
  if (/^ГЭСН\s?\d/i.test(c) || /^гэсн\s?\d/i.test(c)) return 'GESN';
  if (/^ГЭСНр\s?\d/i.test(c) || /^гэснр\s?\d/i.test(c)) return 'GESNr';
  if (/^ФСБЦ/i.test(c) || /^фсбц/i.test(c)) return 'FSBC';
  if (/^ТЦ[-\s]/i.test(c) || /^тц[-\s]/i.test(c)) return 'TC';
  if (/^ФЕР\s?\d/i.test(c) || /^фер\s?\d/i.test(c)) return 'FER';
  if (/^ТЕР\s?\d/i.test(c) || /^тер\s?\d/i.test(c)) return 'TER';
  return undefined;
}

/** Detect resource type from name text and/or code column */
function detectResourceType(name: string, code?: string): LsrResourceType | undefined {
  const n = name.toLowerCase().trim();
  const c = (code ?? '').trim();

  // ГРАНД-Смета abbreviations: exact match on short names
  if (n === 'от(зт)' || n === 'от' || n === 'зт(от)') return 'OT';
  if (n === 'эм' || n.startsWith('отм(зтм)') || n.startsWith('отм(ЗТм)'.toLowerCase())) return 'EM';
  if (n === 'зт' || n === 'зтм' || n === 'зт(м)') return 'ZT';
  if (n === 'м' || n === 'мат') return 'M';
  // НР and СП with code starting with "Пр/"
  if (/^нр\s/i.test(n) || c.startsWith('Пр/') && n.toLowerCase().startsWith('нр')) return 'NR';
  if (/^сп\s/i.test(n) || c.startsWith('Пр/') && n.toLowerCase().startsWith('сп')) return 'SP';

  // Code column: single digit = resource type number
  if (c === '1') return 'OT';
  if (c === '2') return 'EM';
  if (c === '3') return 'ZT';
  if (c === '4') return 'M';

  // Full-text detection
  if (n.includes('накладные расходы') || n.includes('нр по')) return 'NR';
  if (n.includes('сметная прибыль') || n.includes('сп по')) return 'SP';
  if (n.includes('затраты труда маш') || n.includes('заработная плата маш')) return 'ZT';
  if (n.includes('затраты труда') || n.includes('заработная плата') || n.includes('оплата труда')) return 'OT';
  if (n.includes('эксплуатация маш') || n.includes('машин и механизм')) return 'EM';
  if (n.includes('материал') || n.includes('материальн')) return 'M';
  return undefined;
}

/** Check if a row is a section header */
function isSectionRow(name: string, code: string): boolean {
  const trimmed = name.trim();
  if (/^раздел\s+\d/i.test(trimmed)) return true;
  // "Система N" sub-section headers (e.g. "Система 1 Приточная...", "Система П1.1 ...")
  if (/^система\s+/i.test(trimmed)) return true;
  // All-caps long header without a normative code
  if (!code.trim() && /^[А-ЯA-Z\s\-–—.,:;!?()\d]+$/.test(name) && name.length > 15) {
    // exclude "Итого" lines
    if (/^итого|^всего|^в т\.ч\.|^ндс|^прямы/i.test(trimmed)) return false;
    return true;
  }
  return false;
}

/** Check if a row is a DOCUMENT-LEVEL summary/total line (not per-position). */
function isDefiniteSummaryRow(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith('итого по разделу') ||
    n.startsWith('итого по смете') ||
    n.startsWith('всего по смете') ||
    n.startsWith('всего с ндс') ||
    n.startsWith('ндс') ||
    n.startsWith('нпр ') ||
    n.startsWith('непредвиденные') ||
    n.startsWith('зимнее удорожание') ||
    n.startsWith('временные здания') ||
    n.startsWith('временные сооружения');
}

/** Check if a row is a per-POSITION summary line that closes the current position.
 *  These lines appear within each position block: Итого прямые → ФОТ → НР → СП → Всего по позиции */
function isPositionEndRow(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith('всего по позиции') ||
    /^итого$/i.test(n) ||
    /^всего$/i.test(n);
}

/** Check if a row is a per-position sub-total that should be treated as a resource */
function isPositionSubTotal(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith('итого прямых') ||
    n.startsWith('фот');
}

/**
 * Check if a row is an ambiguous summary line.
 * "Накладные расходы" and "Сметная прибыль" can be either resource sub-rows
 * (under a position) or standalone summary totals.
 * They are treated as summary when NOT under a position.
 */
function isAmbiguousSummaryRow(name: string): boolean {
  const n = name.trim().toLowerCase();
  return (n.startsWith('накладные расходы') && !n.includes('нр по')) ||
    (n.startsWith('сметная прибыль') && !n.includes('сп по'));
}

/** Detect column mapping from header row */
function detectColumns(rows: string[][]): { headerRow: number; mapping: LsrColumnMapping } {
  let headerRow = -1;

  for (let r = 0; r < Math.min(rows.length, 50); r++) {
    const row = rows[r].map((c) => c.toLowerCase());
    const ni = row.findIndex((c) =>
      c.includes('наименован') || c.includes('название') || c === 'name',
    );
    if (ni < 0) continue;

    // Require at least one more header keyword in the same row to avoid matching
    // metadata rows like "Наименование программного продукта" in ГРАНД-Смета preamble
    const hasOtherHeader = row.some((c) =>
      c.includes('обоснован') || c.includes('шифр') || c.includes('п/п') ||
      c.includes('ед') && c.includes('изм') || c.includes('количеств') ||
      c.includes('стоимость') || c.includes('расценк'),
    );
    if (!hasOtherHeader) continue;

    headerRow = r;

    // ── ГРАНД-Смета detection: look for column-number row below header ──
    // Multi-row headers: row 35 has main labels (merged), row 37 has sub-labels,
    // row 38 has sequential numbers 1-12. If found, use known mapping.
    for (let sub = headerRow + 1; sub < Math.min(headerRow + 6, rows.length); sub++) {
      const subRow = rows[sub].map((c) => c.trim());
      const nums = subRow.filter((c) => /^\d+$/.test(c)).map(Number);
      // ГРАНД-Смета has sequential column numbers 1-12 in a single row
      if (nums.length >= 10 && nums.includes(1) && nums.includes(12)) {
        return { headerRow: sub, mapping: GRAND_SMETA_MAPPING };
      }
    }

    // ── Generic column detection for other formats ──
    const numCol = row.findIndex((c) => c === '№' || c.includes('п/п') || c.includes('номер'));

    const codeCol = row.findIndex((c) =>
      c.includes('обоснован') || c.includes('шифр') || (c.includes('код') && !c.includes('удорож')),
    );

    const unitCol = row.findIndex((c) => (c.includes('ед') && c.includes('изм')) || c === 'unit');

    // Quantity columns — may have up to 3 (per unit, coefficient, total)
    const qtyCols: number[] = [];
    row.forEach((c, i) => {
      if (c.includes('кол') || c === 'qty' || c.includes('количеств')) qtyCols.push(i);
    });

    const qtyPerUnitCol = qtyCols.length >= 3 ? qtyCols[0] : -1;
    const qtyCoeffCol = qtyCols.length >= 3 ? qtyCols[1] : -1;
    const qtyTotalCol = qtyCols.length > 0 ? qtyCols[qtyCols.length - 1] : -1;

    // Base cost (стоимость базисная)
    const baseCostCol = row.findIndex((c) =>
      (c.includes('базис') && c.includes('стоимость')) ||
      (c.includes('стоимость') && c.includes('базис')) ||
      c.includes('базисн'),
    );

    // Index column
    const indexCol = row.findIndex((c) =>
      c.includes('индекс') || c.includes('index'),
    );

    // Current cost (стоимость текущая)
    const currentCostCol = row.findIndex((c) =>
      (c.includes('текущ') && c.includes('стоимость')) ||
      (c.includes('стоимость') && c.includes('текущ')),
    );

    // Coefficients column
    const coefficientsCol = row.findIndex((c) =>
      (c.includes('коэфф') && !c.includes('кол')),
    );

    // Total / Всего — last column
    const totalCol = row.findLastIndex((c) =>
      c.includes('всего') || c.includes('итого') || c.includes('сумм'),
    );

    // Price column — fallback for simpler formats
    const priceCol = row.findIndex((c) =>
      (c.includes('цена') || c.includes('расценк') ||
        (c.includes('стоимость') && !c.includes('сумм') && !c.includes('базис') && !c.includes('текущ'))) &&
      !c.includes('итог'),
    );

    return {
      headerRow,
      mapping: {
        numCol,
        codeCol,
        nameCol: ni,
        unitCol,
        qtyPerUnitCol,
        qtyCoeffCol,
        qtyTotalCol,
        baseCostCol: baseCostCol >= 0 ? baseCostCol : priceCol,
        indexCol,
        currentCostCol,
        coefficientsCol,
        totalCol,
      },
    };
  }

  // Fallback: assume ГРАНД-Смета layout
  return {
    headerRow: 0,
    mapping: GRAND_SMETA_MAPPING,
  };
}

/** Main parsing function */
export function parseFullLsrRows(
  rows: string[][],
  fileName: string,
  sheetName: string,
): LsrParseResult {
  const { headerRow, mapping } = detectColumns(rows);

  const sections: LsrParsedNode[] = [];
  let currentSection: LsrParsedNode | null = null;
  let currentPosition: LsrParsedNode | null = null;
  const flatLines: LsrParsedNode[] = [];
  let lineCounter = 0;

  // Summary accumulation
  const summary: LsrParsedSummary = {
    directCostsTotal: 0,
    overheadTotal: 0,
    profitTotal: 0,
    subtotal: 0,
    winterSurcharge: 0,
    winterSurchargeRate: 0,
    tempStructures: 0,
    tempStructuresRate: 0,
    contingency: 0,
    contingencyRate: 0,
    vatRate: 20,
    vatAmount: 0,
    grandTotal: 0,
  };

  let stats = { positions: 0, resources: 0, sectionCount: 0 };

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    let rawName = col(row, mapping.nameCol);

    // ГРАНД-Смета: section/system headers are in column A (merged cells A-G),
    // NOT in the name column (C). Check col 0 for section markers.
    const col0 = col(row, mapping.numCol);
    if (!rawName) {
      // If name col is empty but col 0 has section/system text, use col 0
      if (col0 && col0.length > 2 && (isSectionRow(col0, '') || isDefiniteSummaryRow(col0) || isAmbiguousSummaryRow(col0) || isPositionEndRow(col0) || isPositionSubTotal(col0))) {
        rawName = col0;
      } else {
        continue;
      }
    }

    const code = col(row, mapping.codeCol);
    const rawTotal = parseNum(col(row, mapping.totalCol));

    // Also check col 0 for section/system headers (ГРАНД-Смета merged cells)
    if (col0 && isSectionRow(col0, '') && !code.trim()) {
      rawName = col0;
    }

    // ГРАНД-Смета: summary rows ("Итого...", "Всего...") may also be in col 0
    if (col0 && !rawName.startsWith(col0) && isDefiniteSummaryRow(col0)) {
      rawName = col0;
    }

    // ── 1. Position-end rows ("Всего по позиции", standalone "Итого"/"Всего") ──
    if (isPositionEndRow(rawName)) {
      if (currentPosition) {
        // Record the total on the position
        if (rawTotal > 0 && currentPosition.totalAmount === 0) {
          currentPosition.totalAmount = rawTotal;
        }
        if (currentSection) currentSection.children.push(currentPosition);
        else sections.push(currentPosition);
        currentPosition = null;
      }
      continue;
    }

    // ── 1b. Per-position sub-totals ("Итого прямых", "ФОТ") — resource when under position ──
    if (isPositionSubTotal(rawName)) {
      if (currentPosition) {
        // Treat as a resource sub-total under the position
        lineCounter++;
        const subNode: LsrParsedNode = {
          lineNumber: lineCounter,
          lineType: 'RESOURCE',
          justification: '',
          name: rawName,
          unit: '',
          quantityTotal: 0,
          baseCost: 0,
          currentCost: 0,
          totalAmount: rawTotal || 0,
          children: [],
          sectionName: currentSection?.name,
          depth: 2,
        };
        flatLines.push(subNode);
        currentPosition.children.push(subNode);
      } else {
        // Document-level sub-total (no open position)
        parseSummaryRow(rawName, rawTotal, summary, row, mapping);
      }
      continue;
    }

    // ── 1c. Document-level summary rows (Итого по разделу/смете, НДС, etc.) ──
    if (isDefiniteSummaryRow(rawName)) {
      // Flush open position before entering summary zone
      if (currentPosition) {
        if (currentSection) currentSection.children.push(currentPosition);
        else sections.push(currentPosition);
        currentPosition = null;
      }
      parseSummaryRow(rawName, rawTotal, summary, row, mapping);
      continue;
    }

    // ── 1d. Ambiguous summary rows (NR/SP) — treated as summary when NOT under a position ──
    if (!currentPosition && isAmbiguousSummaryRow(rawName)) {
      parseSummaryRow(rawName, rawTotal, summary, row, mapping);
      continue;
    }

    // ── 2. Check if section header ──
    if (isSectionRow(rawName, code)) {
      // Save previous position into section
      if (currentPosition && currentSection) {
        currentSection.children.push(currentPosition);
        currentPosition = null;
      }
      // Save previous section
      if (currentSection) sections.push(currentSection);

      lineCounter++;
      stats.sectionCount++;
      const sectionNode: LsrParsedNode = {
        lineNumber: lineCounter,
        lineType: 'SECTION',
        justification: '',
        name: rawName,
        unit: '',
        quantityTotal: 0,
        baseCost: 0,
        currentCost: 0,
        totalAmount: rawTotal || 0,
        children: [],
        sectionName: rawName,
        depth: 0,
      };
      flatLines.push(sectionNode);
      currentSection = sectionNode;
      currentPosition = null;
      continue;
    }

    // ── 3. Check if position (has normative code or equipment marker) ──
    const numCell = col(row, mapping.numCol);
    // Equipment items: "N\rО" or "NО" pattern in col A (e.g. "1\nО", "12О")
    const isEquipment = /\d+\s*[ОO]$/m.test(numCell) || /^ТЦ[_\-]/i.test(code);
    const posType = isEquipment ? 'TC' as LsrPositionType : detectPositionType(code);
    if (posType) {
      // Save previous position into section
      if (currentPosition) {
        if (currentSection) currentSection.children.push(currentPosition);
        else sections.push(currentPosition); // orphan position
      }

      lineCounter++;
      stats.positions++;
      const qtyPerUnit = parseNum(col(row, mapping.qtyPerUnitCol));
      const qtyCoeff = parseNum(col(row, mapping.qtyCoeffCol));
      const qtyTotal = parseNum(col(row, mapping.qtyTotalCol)) || 1;
      const baseCost = parseNum(col(row, mapping.baseCostCol));
      const indexVal = parseNum(col(row, mapping.indexCol));
      const currentCost = parseNum(col(row, mapping.currentCostCol));
      const coeffStr = col(row, mapping.coefficientsCol);

      const posNode: LsrParsedNode = {
        lineNumber: lineCounter,
        lineType: 'POSITION',
        positionType: posType,
        justification: code,
        name: rawName,
        unit: col(row, mapping.unitCol) || '',
        quantityPerUnit: qtyPerUnit || undefined,
        coefficient: qtyCoeff || undefined,
        quantityTotal: qtyTotal,
        baseCost,
        indexValue: indexVal || undefined,
        currentCost: currentCost || baseCost * (indexVal || 1),
        coefficients: coeffStr || undefined,
        totalAmount: rawTotal || 0,
        children: [],
        sectionName: currentSection?.name,
        depth: 1,
      };
      flatLines.push(posNode);
      currentPosition = posNode;
      continue;
    }

    // ── 4. Check if resource sub-row (under a position) ──
    if (currentPosition) {
      // Coefficient rows (e.g. "ОЗП=1,2; ЭМ=1,2; МАТ=1,2") — store on position
      if (/[ОO]ЗП\s*=|[ЭЕ]М\s*=|МАТ\s*=/i.test(rawName)) {
        const prev = currentPosition.coefficients || '';
        currentPosition.coefficients = prev ? prev + '; ' + rawName.trim() : rawName.trim();
        continue;
      }

      // Note/description rows without any numeric data — attach as coefficient text
      const hasAnyNumericData = parseNum(col(row, mapping.qtyTotalCol)) !== 0 ||
        parseNum(col(row, mapping.baseCostCol)) !== 0 ||
        parseNum(col(row, mapping.currentCostCol)) !== 0 || rawTotal !== 0;
      if (!hasAnyNumericData && !code.trim()) {
        // Pure text row (notes, coefficient descriptions) — store on position
        const prev = currentPosition.coefficients || '';
        currentPosition.coefficients = prev ? prev + '; ' + rawName.trim() : rawName.trim();
        continue;
      }

      const resType = detectResourceType(rawName, code);

      if (resType || hasAnyNumericData) {
        // Any row under a position with data is a resource
        const qtyTotal = parseNum(col(row, mapping.qtyTotalCol));
        const baseCost = parseNum(col(row, mapping.baseCostCol));
        const indexVal = parseNum(col(row, mapping.indexCol));
        const currentCost = parseNum(col(row, mapping.currentCostCol));

        lineCounter++;
        if (resType) stats.resources++;
        const resNode: LsrParsedNode = {
          lineNumber: lineCounter,
          lineType: 'RESOURCE',
          resourceType: resType as LsrResourceType | undefined,
          justification: code,
          name: rawName,
          unit: col(row, mapping.unitCol) || '',
          quantityTotal: qtyTotal || 0,
          baseCost,
          indexValue: indexVal || undefined,
          currentCost: currentCost || baseCost * (indexVal || 1),
          totalAmount: rawTotal || 0,
          children: [],
          sectionName: currentSection?.name,
          depth: 2,
        };
        flatLines.push(resNode);
        currentPosition.children.push(resNode);
        continue;
      }
    }

    // ── 5. Fallback: unclassified row with data ──
    // Skip section-level cost breakdown rows (no code, no position number).
    // These are aggregate lines like "Оплата труда рабочих", "Материалы", etc.
    if (!code.trim() && !col0.trim()) continue;

    // Could be a standalone work item without a proper GESN code
    const qty = parseNum(col(row, mapping.qtyTotalCol)) || 1;
    const baseCost = parseNum(col(row, mapping.baseCostCol));
    const currentCost = parseNum(col(row, mapping.currentCostCol));
    if (baseCost === 0 && currentCost === 0 && rawTotal === 0) continue;

    // Save previous position
    if (currentPosition) {
      if (currentSection) currentSection.children.push(currentPosition);
      else sections.push(currentPosition);
      currentPosition = null;
    }

    lineCounter++;
    stats.positions++;
    const fallbackNode: LsrParsedNode = {
      lineNumber: lineCounter,
      lineType: 'POSITION',
      positionType: 'MANUAL',
      justification: code,
      name: rawName,
      unit: col(row, mapping.unitCol) || '',
      quantityTotal: qty,
      baseCost,
      currentCost: currentCost || baseCost,
      totalAmount: rawTotal || 0,
      children: [],
      sectionName: currentSection?.name,
      depth: currentSection ? 1 : 0,
    };
    flatLines.push(fallbackNode);
    if (currentSection) {
      currentSection.children.push(fallbackNode);
    } else {
      sections.push(fallbackNode);
    }
  }

  // Flush last position and section
  if (currentPosition) {
    if (currentSection) currentSection.children.push(currentPosition);
    else sections.push(currentPosition);
  }
  if (currentSection) sections.push(currentSection);

  // If no grand total found, calculate from sections
  if (summary.grandTotal === 0) {
    summary.grandTotal = sections.reduce((s, sec) => {
      if (sec.lineType === 'SECTION') {
        return s + sec.children.reduce((ss, pos) => ss + (pos.totalAmount || 0), 0);
      }
      return s + (sec.totalAmount || 0);
    }, 0);
  }

  return {
    sections,
    summary,
    flatLines,
    metadata: {
      fileName,
      sheetName,
      totalRows: rows.length,
      parsedPositions: stats.positions,
      parsedResources: stats.resources,
      parsedSections: stats.sectionCount,
    },
    columnMapping: mapping,
  };
}

/** Parse a summary row and accumulate into the summary object */
function parseSummaryRow(
  name: string,
  total: number,
  summary: LsrParsedSummary,
  row: string[],
  mapping: LsrColumnMapping,
): void {
  const n = name.trim().toLowerCase();

  if (n.includes('итого прямых')) {
    summary.directCostsTotal = total;
  } else if (n.includes('накладные расходы') || n.includes('итого нр')) {
    summary.overheadTotal = total;
  } else if (n.includes('сметная прибыль') || n.includes('итого сп')) {
    summary.profitTotal = total;
  } else if (n.startsWith('итого по смете') || (n.startsWith('итого') && !n.includes('раздел') && !n.includes('прямых'))) {
    if (summary.subtotal === 0) summary.subtotal = total;
  } else if (n.includes('зимнее удорожание') || n.includes('зимн')) {
    summary.winterSurcharge = total;
    const rateMatch = name.match(/(\d+[.,]?\d*)\s*%/);
    if (rateMatch) summary.winterSurchargeRate = parseNum(rateMatch[1]);
  } else if (n.includes('временные здания') || n.includes('временные сооружения') || n.includes('врем. здания')) {
    summary.tempStructures = total;
    const rateMatch = name.match(/(\d+[.,]?\d*)\s*%/);
    if (rateMatch) summary.tempStructuresRate = parseNum(rateMatch[1]);
  } else if (n.includes('непредвиденные') || n.startsWith('нпр') || n.includes('резерв')) {
    summary.contingency = total;
    const rateMatch = name.match(/(\d+[.,]?\d*)\s*%/);
    if (rateMatch) summary.contingencyRate = parseNum(rateMatch[1]);
  } else if (n.startsWith('ндс')) {
    summary.vatAmount = total;
    const rateMatch = name.match(/(\d+)\s*%/);
    if (rateMatch) summary.vatRate = parseNum(rateMatch[1]);
  } else if (n.startsWith('всего по смете') || n.startsWith('всего с ндс') || n.startsWith('всего')) {
    summary.grandTotal = total;
  }
}
