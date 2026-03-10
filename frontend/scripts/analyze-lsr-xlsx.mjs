/**
 * Deep analysis of ЛСР (Локальный Сметный Расчёт) xlsx file
 * Format: Методика 2020 (РИМ) — Russian construction estimate
 */
import XLSX from 'xlsx';
import path from 'path';

const FILE_PATH = '/Users/damirkasimov/Downloads/Раздел ПД №12_Том 12.3_ЛСР-02-01-06-ИОС4.1 вентиляция зд.23к - ЛСР по Методике 2020 (РИМ).xlsx';

const workbook = XLSX.readFile(FILE_PATH, { cellStyles: true, cellFormula: true, cellDates: true });

console.log('='.repeat(120));
console.log('FILE:', path.basename(FILE_PATH));
console.log('='.repeat(120));

// 1. SHEET OVERVIEW
console.log('\n\n██ 1. SHEETS OVERVIEW ██');
console.log('Total sheets:', workbook.SheetNames.length);
workbook.SheetNames.forEach((name, i) => {
  const ws = workbook.Sheets[name];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const rows = range.e.r - range.s.r + 1;
  const cols = range.e.c - range.s.c + 1;
  console.log(`  Sheet ${i + 1}: "${name}" — ${rows} rows x ${cols} cols (range: ${ws['!ref']})`);
  
  const merges = ws['!merges'] || [];
  console.log(`    Merged cells: ${merges.length}`);
  if (merges.length > 0) {
    merges.slice(0, 15).forEach(m => {
      console.log(`      ${XLSX.utils.encode_range(m)}`);
    });
    if (merges.length > 15) console.log(`      ... and ${merges.length - 15} more merges`);
  }
});

// 2. ANALYZE EACH SHEET
workbook.SheetNames.forEach((sheetName, sheetIdx) => {
  const ws = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  console.log('\n\n' + '#'.repeat(120));
  console.log(`## SHEET ${sheetIdx + 1}: "${sheetName}" ##`);
  console.log('#'.repeat(120));
  
  // 2a. RAW CELL DUMP — first 80 rows
  console.log('\n-- RAW CELL DATA (first 80 rows) --');
  const maxAnalyzeRow = Math.min(range.e.r, 79);
  
  for (let r = range.s.r; r <= maxAnalyzeRow; r++) {
    const rowData = [];
    let hasData = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        hasData = true;
        let val = cell.v;
        if (typeof val === 'string') val = val.replace(/\n/g, '\\n').substring(0, 80);
        rowData.push(`${XLSX.utils.encode_col(c)}=${val}`);
      }
    }
    if (hasData) {
      console.log(`  Row ${r + 1}: ${rowData.join(' | ')}`);
    }
  }
  
  // 2b. Find header row
  console.log('\n-- SEARCHING FOR HEADER ROW --');
  const headerKeywords = ['п/п', 'наименование', 'обоснование', 'ед.', 'изм', 'количество', 'стоимость', 'всего', 'единиц', 'работ'];
  
  let headerRow = -1;
  let headerRowScore = 0;
  
  for (let r = range.s.r; r <= Math.min(range.e.r, 30); r++) {
    let score = 0;
    const rowTexts = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'string') {
        const lower = cell.v.toLowerCase().replace(/\n/g, ' ');
        rowTexts.push(`${XLSX.utils.encode_col(c)}: "${cell.v.replace(/\n/g, '\\n').substring(0, 60)}"`);
        for (const kw of headerKeywords) {
          if (lower.includes(kw)) score++;
        }
      }
    }
    if (score > 0) {
      console.log(`  Row ${r + 1} (score=${score}): ${rowTexts.join(' | ')}`);
    }
    if (score > headerRowScore) {
      headerRowScore = score;
      headerRow = r;
    }
  }
  
  if (headerRow >= 0) {
    console.log(`\n  >>> Best header row candidate: Row ${headerRow + 1} (score=${headerRowScore})`);
    
    console.log('\n-- HEADER AREA (header row +/- 3) --');
    for (let r = Math.max(0, headerRow - 3); r <= Math.min(range.e.r, headerRow + 3); r++) {
      const cells = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (cell) {
          cells.push(`${XLSX.utils.encode_col(c)}(${c}): "${String(cell.v).replace(/\n/g, '\\n').substring(0, 60)}"`);
        }
      }
      const marker = r === headerRow ? ' <<<' : '';
      console.log(`  Row ${r + 1}${marker}: ${cells.join(' | ')}`);
    }
  }
  
  // 2c. COLUMN-BY-COLUMN
  console.log('\n-- COLUMN-BY-COLUMN ANALYSIS --');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const values = [];
    const types = new Set();
    let nonEmpty = 0;
    
    for (let r = range.s.r; r <= range.e.r; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        nonEmpty++;
        types.add(cell.t);
        if (values.length < 8) {
          values.push({ row: r + 1, val: String(cell.v).substring(0, 100), type: cell.t });
        }
      }
    }
    
    if (nonEmpty > 0) {
      console.log(`  Column ${colLetter} (col ${c}): ${nonEmpty} non-empty cells, types: [${[...types].join(',')}]`);
      values.forEach(v => {
        console.log(`    Row ${v.row}: (${v.type}) ${v.val}`);
      });
    }
  }
  
  // 2d. ROW CLASSIFICATION
  console.log('\n-- ROW CLASSIFICATION (first 120 data rows after header) --');
  const dataStart = headerRow >= 0 ? headerRow + 1 : 5;
  const dataEnd = Math.min(range.e.r, dataStart + 119);
  
  const rowTypes = { section: [], work: [], material: [], equipment: [], machine: [], overhead: [], profit: [], total: [], unknown: [] };
  
  for (let r = dataStart; r <= dataEnd; r++) {
    const rowCells = {};
    let fullText = '';
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        rowCells[c] = cell;
        if (typeof cell.v === 'string') fullText += ' ' + cell.v.toLowerCase();
      }
    }
    
    const lower = fullText.trim();
    if (!lower && Object.keys(rowCells).length === 0) continue;
    
    let type = 'unknown';
    if (lower.includes('раздел') || lower.includes('подраздел')) {
      type = 'section';
    } else if (lower.includes('итого') || lower.includes('всего по') || lower.match(/^[\s]*всего/)) {
      type = 'total';
    } else if (lower.includes('накладные расходы') || lower.includes('нр (') || lower.includes('нр,')) {
      type = 'overhead';
    } else if (lower.includes('сметная прибыль') || lower.includes('сп (') || lower.includes('сп,')) {
      type = 'profit';
    } else if (lower.includes('материал') || lower.includes('мат.ресурс')) {
      type = 'material';
    } else if (lower.includes('машин') || lower.includes('эксп.маш') || lower.includes('эмм')) {
      type = 'machine';
    } else if (lower.includes('оборудов')) {
      type = 'equipment';
    } else if (lower.includes('фер') || lower.includes('фссц') || lower.includes('фсн') || lower.includes('монтаж') || lower.includes('прокладка') || lower.includes('установка') || lower.includes('разборка') || lower.includes('демонтаж')) {
      type = 'work';
    }
    
    const colA = rowCells[0] ? String(rowCells[0].v).substring(0, 10) : '';
    const colB = rowCells[1] ? String(rowCells[1].v).substring(0, 15) : '';
    const colC = rowCells[2] ? String(rowCells[2].v).substring(0, 90) : '';
    const numCols = Object.entries(rowCells)
      .filter(([k, v]) => v.t === 'n')
      .map(([k, v]) => `${XLSX.utils.encode_col(Number(k))}=${v.v}`)
      .join(', ');
    
    const label = `[${type.toUpperCase().padEnd(10)}]`;
    console.log(`  Row ${String(r + 1).padStart(4)}: ${label} ${colA.padEnd(10)} ${colB.padEnd(15)} ${colC.padEnd(90)} | nums: ${numCols}`);
    
    rowTypes[type].push(r + 1);
  }
  
  console.log('\n-- ROW TYPE SUMMARY --');
  Object.entries(rowTypes).forEach(([type, rows]) => {
    if (rows.length > 0) {
      console.log(`  ${type}: ${rows.length} rows (e.g. rows ${rows.slice(0, 10).join(', ')})`);
    }
  });
  
  // 2e. NUMERIC COLUMNS (pricing)
  console.log('\n-- NUMERIC COLUMNS (pricing structure) --');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const nums = [];
    for (let r = dataStart; r <= dataEnd; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && cell.t === 'n') {
        nums.push({ row: r + 1, val: cell.v });
      }
    }
    if (nums.length >= 3) {
      const colLetter = XLSX.utils.encode_col(c);
      let header = '';
      for (let hr = Math.max(0, headerRow - 3); hr <= headerRow + 1; hr++) {
        const addr = XLSX.utils.encode_cell({ r: hr, c });
        const cell = ws[addr];
        if (cell && typeof cell.v === 'string') {
          header += cell.v.replace(/\n/g, ' ') + ' | ';
        }
      }
      const sample = nums.slice(0, 8).map(n => n.val).join(', ');
      const max = Math.max(...nums.map(n => n.val));
      const min = Math.min(...nums.map(n => n.val));
      console.log(`  Col ${colLetter} (${c}): header="${header.trim()}" | ${nums.length} numbers | range: ${min}..${max}`);
      console.log(`    Samples: ${sample}`);
    }
  }
  
  // 2f. FULL DATA DUMP first 50 rows
  console.log('\n-- FULL DATA DUMP (first 50 rows after header, all columns) --');
  for (let r = dataStart; r <= Math.min(range.e.r, dataStart + 49); r++) {
    const row = {};
    let hasData = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        hasData = true;
        const colLetter = XLSX.utils.encode_col(c);
        row[colLetter] = cell.t === 'n' ? cell.v : String(cell.v).replace(/\n/g, '\\n').substring(0, 120);
      }
    }
    if (hasData) {
      console.log(`  R${r + 1}: ${JSON.stringify(row)}`);
    }
  }
  
  // 2g. Formulas
  console.log('\n-- FORMULAS (first 20) --');
  let formulaCount = 0;
  for (let r = range.s.r; r <= range.e.r && formulaCount < 20; r++) {
    for (let c = range.s.c; c <= range.e.c && formulaCount < 20; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && cell.f) {
        console.log(`  ${addr} (Row ${r + 1}, Col ${XLSX.utils.encode_col(c)}): =${cell.f} -> ${cell.v}`);
        formulaCount++;
      }
    }
  }
  if (formulaCount === 0) console.log('  No formulas found');
  
  // 2h. Row outlines
  if (ws['!rows']) {
    console.log('\n-- ROW OUTLINES/GROUPING --');
    let groupedCount = 0;
    ws['!rows'].forEach((rowInfo, idx) => {
      if (rowInfo && (rowInfo.level || rowInfo.hidden || rowInfo.outlineLevel)) {
        if (groupedCount < 30) {
          console.log(`  Row ${idx + 1}: level=${rowInfo.level || rowInfo.outlineLevel || 0}, hidden=${!!rowInfo.hidden}`);
        }
        groupedCount++;
      }
    });
    if (groupedCount > 30) console.log(`  ... ${groupedCount - 30} more grouped rows`);
    if (groupedCount === 0) console.log('  No row grouping found');
  }
  
  // 2i. Column widths
  if (ws['!cols']) {
    console.log('\n-- COLUMN WIDTHS --');
    ws['!cols'].forEach((col, idx) => {
      if (col) {
        console.log(`  Col ${XLSX.utils.encode_col(idx)} (${idx}): width=${col.wch || col.wpx || col.width || '?'}`);
      }
    });
  }
  
  // 2j. LAST 20 ROWS (for totals/summaries at end)
  console.log('\n-- LAST 30 ROWS (totals section) --');
  const lastStart = Math.max(dataStart, range.e.r - 29);
  for (let r = lastStart; r <= range.e.r; r++) {
    const rowData = [];
    let hasData = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        hasData = true;
        let val = cell.v;
        if (typeof val === 'string') val = val.replace(/\n/g, '\\n').substring(0, 80);
        rowData.push(`${XLSX.utils.encode_col(c)}=${val}`);
      }
    }
    if (hasData) {
      console.log(`  Row ${r + 1}: ${rowData.join(' | ')}`);
    }
  }
});

console.log('\n\nDONE.');
