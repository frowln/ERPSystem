#!/usr/bin/env node
/**
 * Verify that test ЛСР xlsx file parses correctly.
 */
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'dummy.js'));
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simulate the parser logic from parseFullLsr.ts
const filePath = join(__dirname, '..', 'frontend', 'public', 'test-lsr-electro.xlsx');
const data = readFileSync(filePath);
const wb = XLSX.read(data, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
const rows = rawRows.map(r => r.map(c => String(c ?? '').trim()).slice(0, 16));

// Find header row
let headerRow = -1;
for (let r = 0; r < Math.min(rows.length, 50); r++) {
  const row = rows[r].map(c => c.toLowerCase());
  const ni = row.findIndex(c => c.includes('наименован'));
  if (ni < 0) continue;
  const hasOther = row.some(c =>
    c.includes('обоснован') || c.includes('п/п') ||
    (c.includes('ед') && c.includes('изм')) || c.includes('количеств') ||
    c.includes('стоимость')
  );
  if (!hasOther) continue;
  headerRow = r;
  break;
}

console.log(`Header row found at: ${headerRow} (0-indexed)`);
console.log(`Header content: ${rows[headerRow].join(' | ')}`);

// Check for column number row
for (let sub = headerRow + 1; sub < headerRow + 6 && sub < rows.length; sub++) {
  const subRow = rows[sub].map(c => c.trim());
  const nums = subRow.filter(c => /^\d+$/.test(c)).map(Number);
  if (nums.length >= 10 && nums.includes(1) && nums.includes(12)) {
    console.log(`Column number row at: ${sub} → GRAND_SMETA_MAPPING detected`);
    headerRow = sub;
    break;
  }
}

// Count data rows
let sections = 0, positions = 0, resources = 0, summaryLines = 0;
for (let r = headerRow + 1; r < rows.length; r++) {
  const name = rows[r][2] || rows[r][0];
  if (!name) continue;
  const code = rows[r][1];
  const n = name.trim().toLowerCase();

  if (/^раздел\s+\d/i.test(name.trim())) { sections++; continue; }
  if (n.startsWith('итого') || n.startsWith('всего') || n.startsWith('ндс') || n.startsWith('накладные') || n.startsWith('сметная прибыль') || n.startsWith('непредвиденные') || n.startsWith('зимнее') || n.startsWith('временные')) { summaryLines++; continue; }
  if (/^ГЭСН/i.test(code) || /^ФСБЦ/i.test(code) || /^ТЦ[-_]/i.test(code)) { positions++; continue; }
  if (code === '1' || code === '2' || code === '3' || code === '4') { resources++; continue; }
  if (/^[НН]Р по/i.test(name.trim()) || /^СП по/i.test(name.trim())) { resources++; continue; }
}

console.log(`\nParsed structure:`);
console.log(`  Sections: ${sections}`);
console.log(`  Positions: ${positions}`);
console.log(`  Resources: ${resources}`);
console.log(`  Summary lines: ${summaryLines}`);
console.log(`  Total data rows: ${rows.length - headerRow - 1}`);

// Print all data rows for debug
console.log(`\n── Data rows after header ──`);
for (let r = headerRow + 1; r < rows.length; r++) {
  const row = rows[r];
  const num = row[0], code = row[1], name = row[2], total = row[15];
  if (!name && !num) continue;
  console.log(`  [${r}] ${num ? 'NUM=' + num : ''} ${code ? 'CODE=' + code : ''} NAME="${(name || num).substring(0, 60)}" TOTAL=${total || '-'}`);
}
