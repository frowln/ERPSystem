import XLSX from 'xlsx';

const filePath = '/Users/damirkasimov/Downloads/Раздел ПД №12_Том 12.3_ЛСР-02-01-06-ИОС4.1 вентиляция зд.23к - ЛСР по Методике 2020 (РИМ).xlsx';

console.log('=== PARSING GOST LSR ===');
console.log('File:', filePath);
console.log('');

const workbook = XLSX.readFile(filePath, { cellStyles: true, cellDates: true });

// 1. Overview of all sheets
console.log('=== SHEETS OVERVIEW ===');
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;
  console.log('Sheet: "' + sheetName + '" — Rows: ' + totalRows + ', Cols: ' + totalCols + ', Range: ' + sheet['!ref']);
  
  const merges = sheet['!merges'] || [];
  console.log('  Merges: ' + merges.length);
  if (merges.length > 0) {
    const show = Math.min(merges.length, 40);
    for (let i = 0; i < show; i++) {
      console.log('    ' + XLSX.utils.encode_range(merges[i]));
    }
    if (merges.length > 40) console.log('    ... and ' + (merges.length - 40) + ' more');
  }
  console.log('');
}

// 2. Detailed row-by-row for each sheet
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;
  
  console.log('\n' + '='.repeat(80));
  console.log('=== SHEET: "' + sheetName + '" — ' + totalRows + ' rows x ' + totalCols + ' cols ===');
  console.log('='.repeat(80) + '\n');
  
  // Build merge map
  const mergeMap = new Map();
  const merges = sheet['!merges'] || [];
  for (const m of merges) {
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (r !== m.s.r || c !== m.s.c) {
          mergeMap.set(r + ':' + c, { 
            masterRow: m.s.r, 
            masterCol: m.s.c,
            rangeStr: XLSX.utils.encode_range(m)
          });
        }
      }
    }
  }
  
  // Print first 300 rows
  const maxRows = Math.min(range.e.r, range.s.r + 299);
  
  for (let r = range.s.r; r <= maxRows; r++) {
    const rowNum = r + 1;
    let rowCells = [];
    
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const colLetter = XLSX.utils.encode_col(c);
      
      if (cell) {
        const mergeInfo = mergeMap.get(r + ':' + c);
        let val = cell.v !== undefined ? cell.v : '';
        let type = cell.t || '?';
        let formatted = cell.w || '';
        let extra = mergeInfo ? ' (merged from ' + XLSX.utils.encode_cell({r:mergeInfo.masterRow, c:mergeInfo.masterCol}) + ')' : '';
        rowCells.push('  [' + colLetter + rowNum + '] t=' + type + ' v="' + val + '" w="' + formatted + '"' + extra);
      } else {
        const mergeInfo = mergeMap.get(r + ':' + c);
        if (mergeInfo) {
          rowCells.push('  [' + colLetter + rowNum + '] <merged, master=' + XLSX.utils.encode_cell({r:mergeInfo.masterRow, c:mergeInfo.masterCol}) + ' range=' + mergeInfo.rangeStr + '>');
        }
      }
    }
    
    if (rowCells.length > 0) {
      console.log('--- ROW ' + rowNum + ' ---');
      for (const cellStr of rowCells) {
        console.log(cellStr);
      }
    }
  }
  
  // If more rows, print last 30
  if (range.e.r > maxRows) {
    console.log('\n... ' + (range.e.r - maxRows) + ' more rows not shown (rows ' + (maxRows + 2) + ' to ' + (range.e.r + 1) + ') ...');
    
    console.log('\n=== LAST 30 ROWS ===');
    const startLast = Math.max(maxRows + 1, range.e.r - 29);
    for (let r = startLast; r <= range.e.r; r++) {
      const rowNum = r + 1;
      let rowCells = [];
      
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        const colLetter = XLSX.utils.encode_col(c);
        
        if (cell) {
          let val = cell.v !== undefined ? cell.v : '';
          let type = cell.t || '?';
          let formatted = cell.w || '';
          rowCells.push('  [' + colLetter + rowNum + '] t=' + type + ' v="' + val + '" w="' + formatted + '"');
        }
      }
      
      if (rowCells.length > 0) {
        console.log('--- ROW ' + rowNum + ' ---');
        for (const cellStr of rowCells) {
          console.log(cellStr);
        }
      }
    }
  }
}

// 3. JSON view first 25 rows
console.log('\n\n=== JSON VIEW (first 25 rows of first sheet) ===');
const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(mainSheet, { header: 1, defval: '', raw: true });
for (let i = 0; i < Math.min(25, jsonData.length); i++) {
  console.log('Row ' + (i + 1) + ': ' + JSON.stringify(jsonData[i]));
}

console.log('\n=== DONE ===');
