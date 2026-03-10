/**
 * Test script: parse real ГРАНД-Смета file and output detailed metrics.
 * Usage: node scripts/test-parser.mjs
 */
import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const FILE_PATH = '/Users/damirkasimov/Downloads/Раздел ПД №12_Том 12.3_ЛСР-02-01-06-ИОС4.1 вентиляция зд.23к - ЛСР по Методике 2020 (РИМ).xlsx';

// ── Inline parser logic (JS version of parseFullLsr.ts) ──

const GRAND_SMETA_MAPPING = {
  numCol: 0, codeCol: 1, nameCol: 2, unitCol: 7,
  qtyPerUnitCol: 8, qtyCoeffCol: 9, qtyTotalCol: 10,
  baseCostCol: 11, indexCol: 12, currentCostCol: 13,
  coefficientsCol: 14, totalCol: 15,
};
const MAX_PRIMARY_COLS = 16;

const parseNum = (s) => {
  const cleaned = String(s).replace(/\s/g, '');
  if (cleaned.includes('.') && cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  return parseFloat(cleaned.replace(',', '.')) || 0;
};
const col = (row, idx) => idx >= 0 ? (row[idx] ?? '') : '';

function detectPositionType(code) {
  const c = code.trim();
  if (/^ГЭСН\s?\d/i.test(c) || /^гэсн\s?\d/i.test(c)) return 'GESN';
  if (/^ГЭСНр\s?\d/i.test(c) || /^гэснр\s?\d/i.test(c)) return 'GESNr';
  if (/^ФСБЦ/i.test(c) || /^фсбц/i.test(c)) return 'FSBC';
  if (/^ТЦ[-\s]/i.test(c) || /^тц[-\s]/i.test(c)) return 'TC';
  if (/^ФЕР\s?\d/i.test(c) || /^фер\s?\d/i.test(c)) return 'FER';
  if (/^ТЕР\s?\d/i.test(c) || /^тер\s?\d/i.test(c)) return 'TER';
  return undefined;
}

function detectResourceType(name, code) {
  const n = name.toLowerCase().trim();
  const c = (code ?? '').trim();
  // ГРАНД-Смета abbreviations
  if (n === 'от(зт)' || n === 'от' || n === 'зт(от)') return 'OT';
  if (n === 'эм' || n.startsWith('отм(зтм)') || n.startsWith('отм(ЗТм)'.toLowerCase())) return 'EM';
  if (n === 'зт' || n === 'зтм' || n === 'зт(м)') return 'ZT';
  if (n === 'м' || n === 'мат') return 'M';
  if (/^нр\s/i.test(n) || (c.startsWith('Пр/') && n.startsWith('нр'))) return 'NR';
  if (/^сп\s/i.test(n) || (c.startsWith('Пр/') && n.startsWith('сп'))) return 'SP';
  if (c === '1') return 'OT';
  if (c === '2') return 'EM';
  if (c === '3') return 'ZT';
  if (c === '4') return 'M';
  // Full-text
  if (n.includes('накладные расходы') || n.includes('нр по')) return 'NR';
  if (n.includes('сметная прибыль') || n.includes('сп по')) return 'SP';
  if (n.includes('затраты труда маш') || n.includes('заработная плата маш')) return 'ZT';
  if (n.includes('затраты труда') || n.includes('заработная плата') || n.includes('оплата труда')) return 'OT';
  if (n.includes('эксплуатация маш') || n.includes('машин и механизм')) return 'EM';
  if (n.includes('материал') || n.includes('материальн')) return 'M';
  return undefined;
}

function isSectionRow(name, code) {
  const trimmed = name.trim();
  if (/^раздел\s+\d/i.test(trimmed)) return true;
  if (/^система\s+\d/i.test(trimmed)) return true;
  if (!code.trim() && /^[А-ЯA-Z\s\-–—.,:;!?()\d]+$/.test(name) && name.length > 15) {
    if (/^итого|^всего|^в т\.ч\.|^ндс|^прямы/i.test(trimmed)) return false;
    return true;
  }
  return false;
}

function isDefiniteSummaryRow(name) {
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

function isPositionEndRow(name) {
  const n = name.trim().toLowerCase();
  return n.startsWith('всего по позиции') ||
    /^итого$/i.test(n) ||
    /^всего$/i.test(n);
}

function isPositionSubTotal(name) {
  const n = name.trim().toLowerCase();
  return n.startsWith('итого прямых') ||
    n.startsWith('фот');
}

function isAmbiguousSummaryRow(name) {
  const n = name.trim().toLowerCase();
  return (n.startsWith('накладные расходы') && !n.includes('нр по')) ||
    (n.startsWith('сметная прибыль') && !n.includes('сп по'));
}

function detectColumns(rows) {
  let headerRow = -1;
  for (let r = 0; r < Math.min(rows.length, 50); r++) {
    const row = rows[r].map(c => c.toLowerCase());
    const ni = row.findIndex(c => c.includes('наименован') || c.includes('название') || c === 'name');
    if (ni < 0) continue;
    // Require another header keyword to avoid metadata rows
    const hasOtherHeader = row.some(c =>
      c.includes('обоснован') || c.includes('шифр') || c.includes('п/п') ||
      (c.includes('ед') && c.includes('изм')) || c.includes('количеств') ||
      c.includes('стоимость') || c.includes('расценк'));
    if (!hasOtherHeader) continue;
    headerRow = r;

    for (let sub = headerRow + 1; sub < Math.min(headerRow + 6, rows.length); sub++) {
      const subRow = rows[sub].map(c => c.trim());
      const nums = subRow.filter(c => /^\d+$/.test(c)).map(Number);
      if (nums.length >= 10 && nums.includes(1) && nums.includes(12)) {
        return { headerRow: sub, mapping: GRAND_SMETA_MAPPING };
      }
    }

    return { headerRow, mapping: GRAND_SMETA_MAPPING };
  }
  return { headerRow: 0, mapping: GRAND_SMETA_MAPPING };
}

function parseSummaryRow(name, total, summary) {
  const n = name.trim().toLowerCase();
  if (n.includes('итого прямых')) summary.directCostsTotal = total;
  else if (n.includes('накладные расходы') || n.includes('итого нр')) summary.overheadTotal = total;
  else if (n.includes('сметная прибыль') || n.includes('итого сп')) summary.profitTotal = total;
  else if (n.startsWith('итого по смете') || (n.startsWith('итого') && !n.includes('раздел') && !n.includes('прямых')))
    if (summary.subtotal === 0) summary.subtotal = total;
  if (n.includes('зимнее удорожание') || n.includes('зимн')) {
    summary.winterSurcharge = total;
    const m = name.match(/(\d+[.,]?\d*)\s*%/); if (m) summary.winterSurchargeRate = parseNum(m[1]);
  }
  if (n.includes('временные здания') || n.includes('временные сооружения')) {
    summary.tempStructures = total;
    const m = name.match(/(\d+[.,]?\d*)\s*%/); if (m) summary.tempStructuresRate = parseNum(m[1]);
  }
  if (n.includes('непредвиденные') || n.startsWith('нпр') || n.includes('резерв')) {
    summary.contingency = total;
    const m = name.match(/(\d+[.,]?\d*)\s*%/); if (m) summary.contingencyRate = parseNum(m[1]);
  }
  if (n.startsWith('ндс')) {
    summary.vatAmount = total;
    const m = name.match(/(\d+)\s*%/); if (m) summary.vatRate = parseNum(m[1]);
  }
  if (n.startsWith('всего по смете') || n.startsWith('всего с ндс') || n.startsWith('всего'))
    summary.grandTotal = total;
}

function parseFullLsrRows(rows, fileName, sheetName) {
  const { headerRow, mapping } = detectColumns(rows);

  const sections = [];
  let currentSection = null;
  let currentPosition = null;
  const flatLines = [];
  let lineCounter = 0;

  const summary = {
    directCostsTotal: 0, overheadTotal: 0, profitTotal: 0,
    subtotal: 0, winterSurcharge: 0, winterSurchargeRate: 0,
    tempStructures: 0, tempStructuresRate: 0,
    contingency: 0, contingencyRate: 0,
    vatRate: 20, vatAmount: 0, grandTotal: 0,
  };

  let stats = { positions: 0, resources: 0, sectionCount: 0 };
  let coefficientRows = 0;
  let equipmentItems = 0;

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    let rawName = col(row, mapping.nameCol);

    // ГРАНД-Смета: section/system headers in col A (merged cells)
    const col0 = col(row, mapping.numCol);
    if (!rawName) {
      if (col0 && col0.length > 2 && isSectionRow(col0, '')) {
        rawName = col0;
      } else {
        continue;
      }
    }

    const code = col(row, mapping.codeCol);
    const rawTotal = parseNum(col(row, mapping.totalCol));

    // Check col0 for section headers
    if (col0 && isSectionRow(col0, '') && !code.trim()) {
      rawName = col0;
    }

    // Check col0 for summary rows
    if (col0 && !rawName.startsWith(col0) && isDefiniteSummaryRow(col0)) {
      rawName = col0;
    }

    // Position-end rows
    if (isPositionEndRow(rawName)) {
      if (currentPosition) {
        if (rawTotal > 0 && currentPosition.totalAmount === 0) currentPosition.totalAmount = rawTotal;
        if (currentSection) currentSection.children.push(currentPosition);
        else sections.push(currentPosition);
        currentPosition = null;
      }
      continue;
    }

    // Per-position sub-totals as resources
    if (isPositionSubTotal(rawName)) {
      if (currentPosition) {
        lineCounter++;
        const subNode = {
          lineNumber: lineCounter, lineType: 'RESOURCE', justification: '',
          name: rawName, unit: '', quantityTotal: 0, baseCost: 0, currentCost: 0,
          totalAmount: rawTotal || 0, children: [], sectionName: currentSection?.name, depth: 2,
        };
        flatLines.push(subNode);
        currentPosition.children.push(subNode);
      }
      continue;
    }

    // Document-level summary
    if (isDefiniteSummaryRow(rawName)) {
      if (currentPosition) {
        if (currentSection) currentSection.children.push(currentPosition);
        else sections.push(currentPosition);
        currentPosition = null;
      }
      parseSummaryRow(rawName, rawTotal, summary);
      continue;
    }

    if (!currentPosition && isAmbiguousSummaryRow(rawName)) {
      parseSummaryRow(rawName, rawTotal, summary);
      continue;
    }

    if (isSectionRow(rawName, code)) {
      if (currentPosition && currentSection) {
        currentSection.children.push(currentPosition);
        currentPosition = null;
      }
      if (currentSection) sections.push(currentSection);

      lineCounter++;
      stats.sectionCount++;
      const sectionNode = {
        lineNumber: lineCounter, lineType: 'SECTION',
        justification: '', name: rawName, unit: '',
        quantityTotal: 0, baseCost: 0, currentCost: 0,
        totalAmount: rawTotal || 0, children: [], sectionName: rawName, depth: 0,
      };
      flatLines.push(sectionNode);
      currentSection = sectionNode;
      currentPosition = null;
      continue;
    }

    const numCell = col(row, mapping.numCol);
    const isEquipment = /\d+\s*[ОO]$/m.test(numCell) || /^ТЦ[_\-]/i.test(code);
    if (isEquipment) equipmentItems++;
    const posType = isEquipment ? 'TC' : detectPositionType(code);
    if (posType) {
      if (currentPosition) {
        if (currentSection) currentSection.children.push(currentPosition);
        else sections.push(currentPosition);
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

      const posNode = {
        lineNumber: lineCounter, lineType: 'POSITION', positionType: posType,
        justification: code, name: rawName, unit: col(row, mapping.unitCol) || '',
        quantityPerUnit: qtyPerUnit || undefined, coefficient: qtyCoeff || undefined,
        quantityTotal: qtyTotal, baseCost,
        indexValue: indexVal || undefined,
        currentCost: currentCost || baseCost * (indexVal || 1),
        coefficients: coeffStr || undefined,
        totalAmount: rawTotal || 0, children: [], sectionName: currentSection?.name, depth: 1,
      };
      flatLines.push(posNode);
      currentPosition = posNode;
      continue;
    }

    if (currentPosition) {
      if (/[ОO]ЗП\s*=|[ЭЕ]М\s*=|МАТ\s*=/i.test(rawName)) {
        const prev = currentPosition.coefficients || '';
        currentPosition.coefficients = prev ? prev + '; ' + rawName.trim() : rawName.trim();
        coefficientRows++;
        continue;
      }

      // Note/description rows without numeric data — store as coefficient text
      const hasAnyNumericData = parseNum(col(row, mapping.qtyTotalCol)) !== 0 ||
        parseNum(col(row, mapping.baseCostCol)) !== 0 ||
        parseNum(col(row, mapping.currentCostCol)) !== 0 || rawTotal !== 0;
      if (!hasAnyNumericData && !code.trim()) {
        const prev = currentPosition.coefficients || '';
        currentPosition.coefficients = prev ? prev + '; ' + rawName.trim() : rawName.trim();
        coefficientRows++;
        continue;
      }

      const resType = detectResourceType(rawName, code);

      if (resType || hasAnyNumericData) {
        const qtyTotal = parseNum(col(row, mapping.qtyTotalCol));
        const baseCost = parseNum(col(row, mapping.baseCostCol));
        const indexVal = parseNum(col(row, mapping.indexCol));
        const currentCost = parseNum(col(row, mapping.currentCostCol));

        lineCounter++;
        if (resType) stats.resources++;
        const resNode = {
          lineNumber: lineCounter, lineType: 'RESOURCE',
          resourceType: resType,
          justification: code, name: rawName, unit: col(row, mapping.unitCol) || '',
          quantityTotal: qtyTotal || 0, baseCost,
          indexValue: indexVal || undefined,
          currentCost: currentCost || baseCost * (indexVal || 1),
          totalAmount: rawTotal || 0, children: [], sectionName: currentSection?.name, depth: 2,
        };
        flatLines.push(resNode);
        currentPosition.children.push(resNode);
        continue;
      }
    }

    // Skip section-level cost breakdown rows (no code, no position number)
    if (!code.trim() && !col0.trim()) continue;

    const qty = parseNum(col(row, mapping.qtyTotalCol)) || 1;
    const baseCost = parseNum(col(row, mapping.baseCostCol));
    const currentCost = parseNum(col(row, mapping.currentCostCol));
    if (baseCost === 0 && currentCost === 0 && rawTotal === 0) continue;

    if (currentPosition) {
      if (currentSection) currentSection.children.push(currentPosition);
      else sections.push(currentPosition);
      currentPosition = null;
    }

    lineCounter++;
    stats.positions++;
    const fallbackNode = {
      lineNumber: lineCounter, lineType: 'POSITION', positionType: 'MANUAL',
      justification: code, name: rawName, unit: col(row, mapping.unitCol) || '',
      quantityTotal: qty, baseCost,
      currentCost: currentCost || baseCost,
      totalAmount: rawTotal || 0, children: [],
      sectionName: currentSection?.name, depth: currentSection ? 1 : 0,
    };
    flatLines.push(fallbackNode);
    if (currentSection) currentSection.children.push(fallbackNode);
    else sections.push(fallbackNode);
  }

  if (currentPosition) {
    if (currentSection) currentSection.children.push(currentPosition);
    else sections.push(currentPosition);
  }
  if (currentSection) sections.push(currentSection);

  if (summary.grandTotal === 0) {
    summary.grandTotal = sections.reduce((s, sec) => {
      if (sec.lineType === 'SECTION') return s + sec.children.reduce((ss, pos) => ss + (pos.totalAmount || 0), 0);
      return s + (sec.totalAmount || 0);
    }, 0);
  }

  return {
    sections, summary, flatLines,
    metadata: { fileName, sheetName, totalRows: rows.length,
      parsedPositions: stats.positions, parsedResources: stats.resources,
      parsedSections: stats.sectionCount },
    columnMapping: mapping,
    extra: { coefficientRows, equipmentItems },
  };
}

// ── Run ──
console.log('Reading file...');
const wb = XLSX.readFile(FILE_PATH);
const sheetName = wb.SheetNames[0];
console.log(`Sheet: ${sheetName}`);
const sheet = wb.Sheets[sheetName];
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
const rows = rawRows.map(r => r.slice(0, MAX_PRIMARY_COLS).map(c => String(c ?? '').trim()));

console.log(`Total rows in sheet: ${rows.length}`);
console.log(`Columns in first data row: ${rawRows[0]?.length || 0}`);
console.log('');

// Show first 40 rows to see headers
console.log('=== HEADER ROWS (0-40) ===');
for (let i = 30; i < Math.min(42, rows.length); i++) {
  const r = rows[i];
  const display = r.map((c, j) => `[${j}]=${c.substring(0, 25)}`).filter(c => !c.endsWith('=')).join(' | ');
  console.log(`Row ${i}: ${display}`);
}
console.log('');

// Detect columns
const { headerRow, mapping } = detectColumns(rows);
console.log(`Header row detected: ${headerRow}`);
console.log(`Mapping:`, JSON.stringify(mapping, null, 2));
console.log('');

// Parse
console.log('Parsing...');
const result = parseFullLsrRows(rows, 'test.xlsx', sheetName);

console.log('=== PARSE RESULTS ===');
console.log(`Sections: ${result.metadata.parsedSections}`);
console.log(`Positions: ${result.metadata.parsedPositions}`);
console.log(`Resources: ${result.metadata.parsedResources}`);
console.log(`Total flat lines: ${result.flatLines.length}`);
console.log(`Coefficient rows captured: ${result.extra.coefficientRows}`);
console.log(`Equipment items: ${result.extra.equipmentItems}`);
console.log('');

console.log('=== SUMMARY (Концовка) ===');
console.log(`Direct costs total: ${result.summary.directCostsTotal.toLocaleString('ru-RU')}`);
console.log(`Overhead total:     ${result.summary.overheadTotal.toLocaleString('ru-RU')}`);
console.log(`Profit total:       ${result.summary.profitTotal.toLocaleString('ru-RU')}`);
console.log(`Subtotal:           ${result.summary.subtotal.toLocaleString('ru-RU')}`);
console.log(`Winter surcharge:   ${result.summary.winterSurcharge.toLocaleString('ru-RU')} (${result.summary.winterSurchargeRate}%)`);
console.log(`Temp structures:    ${result.summary.tempStructures.toLocaleString('ru-RU')} (${result.summary.tempStructuresRate}%)`);
console.log(`Contingency:        ${result.summary.contingency.toLocaleString('ru-RU')} (${result.summary.contingencyRate}%)`);
console.log(`VAT:                ${result.summary.vatAmount.toLocaleString('ru-RU')} (${result.summary.vatRate}%)`);
console.log(`GRAND TOTAL:        ${result.summary.grandTotal.toLocaleString('ru-RU')}`);
console.log('');

console.log('=== SECTIONS ===');
result.sections.forEach((sec, i) => {
  if (sec.lineType === 'SECTION') {
    const posCount = sec.children.filter(c => c.lineType === 'POSITION').length;
    const resCount = sec.children.reduce((s, c) => s + (c.children?.length || 0), 0);
    console.log(`${i + 1}. ${sec.name.substring(0, 80)}`);
    console.log(`   Positions: ${posCount}, Resources: ${resCount}, Total: ${(sec.totalAmount || 0).toLocaleString('ru-RU')}`);
  } else {
    console.log(`${i + 1}. [${sec.lineType}] ${sec.name.substring(0, 80)} = ${sec.totalAmount?.toLocaleString('ru-RU')}`);
  }
});
console.log('');

// Show first 10 positions with details
console.log('=== FIRST 10 POSITIONS (with resources) ===');
let posCount = 0;
for (const line of result.flatLines) {
  if (line.lineType === 'POSITION' && posCount < 10) {
    posCount++;
    console.log(`#${line.lineNumber} [${line.positionType}] ${line.justification}`);
    console.log(`  Name: ${line.name.substring(0, 100)}`);
    console.log(`  Unit: ${line.unit} | Qty: per=${line.quantityPerUnit ?? '-'} coeff=${line.coefficient ?? '-'} total=${line.quantityTotal}`);
    console.log(`  Base: ${line.baseCost} | Index: ${line.indexValue ?? '-'} | Current: ${line.currentCost} | Total: ${line.totalAmount}`);
    if (line.coefficients) console.log(`  Coefficients: ${line.coefficients.substring(0, 120)}`);
    console.log(`  Children: ${line.children.length} resources`);
    for (const res of line.children.slice(0, 3)) {
      console.log(`    -> [${res.resourceType || '?'}] ${res.name.substring(0, 80)} = ${res.totalAmount}`);
    }
    console.log('');
  }
}

// Position type breakdown
const posTypes = {};
result.flatLines.filter(l => l.lineType === 'POSITION').forEach(l => {
  posTypes[l.positionType || 'unknown'] = (posTypes[l.positionType || 'unknown'] || 0) + 1;
});
console.log('=== POSITION TYPES ===');
console.log(JSON.stringify(posTypes, null, 2));

// Resource type breakdown
const resTypes = {};
result.flatLines.filter(l => l.lineType === 'RESOURCE').forEach(l => {
  resTypes[l.resourceType || 'unknown'] = (resTypes[l.resourceType || 'unknown'] || 0) + 1;
});
console.log('=== RESOURCE TYPES ===');
console.log(JSON.stringify(resTypes, null, 2));

// Show last 20 rows to understand summary zone
console.log('');
console.log('=== LAST 30 ROWS OF FILE ===');
for (let i = Math.max(0, rows.length - 30); i < rows.length; i++) {
  const r = rows[i];
  const display = r.map((c, j) => c ? `[${j}]=${c.substring(0, 30)}` : '').filter(Boolean).join(' | ');
  if (display) console.log(`Row ${i}: ${display}`);
}
