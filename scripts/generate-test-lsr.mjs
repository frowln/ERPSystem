#!/usr/bin/env node
/**
 * Generate test ЛСР (Локальный Сметный Расчёт) xlsx file in ГРАНД-Смета format.
 * Contains:
 * - 3 work positions (ГЭСН codes) with resource sub-rows
 * - 3 material/equipment positions (ФСБЦ/ТЦ codes) matching our spec items
 * - Summary block with overhead, profit, VAT, grand total
 *
 * The file will be parseable by our parseFullLsr.ts parser.
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'dummy.js'));
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Column indices (ГРАНД-Смета: A-P = 16 columns) ───
// A=0 №  B=1 Обоснование  C=2 Наименование(merged C-G)  D-G=3-6 (merged)
// H=7 Ед.изм.  I=8 Кол(на ед)  J=9 Кол(коэфф)  K=10 Кол(всего)
// L=11 Базис  M=12 Индекс  N=13 Текущая  O=14 Коэфф  P=15 Всего

function makeRow(num, code, name, unit, qtyPU, qtyCoeff, qtyTotal, base, index, current, coefficients, total) {
  return [
    num ?? '', code ?? '', name ?? '', '', '', '', '', unit ?? '',
    qtyPU ?? '', qtyCoeff ?? '', qtyTotal ?? '',
    base ?? '', index ?? '', current ?? '', coefficients ?? '', total ?? ''
  ];
}

function sectionRow(name) {
  // Section header: name in col C (index 2), rest empty
  const r = Array(16).fill('');
  r[2] = name;
  return r;
}

function sectionRowA(name) {
  // Section header in col A (merged A-G) for ГРАНД-Смета
  const r = Array(16).fill('');
  r[0] = name;
  return r;
}

function summaryRow(name, total) {
  const r = Array(16).fill('');
  r[0] = name;
  r[15] = total;
  return r;
}

const rows = [];

// ── Preamble (rows 1-35 in real files, we'll do minimal) ──
rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']); // row 1
rows.push(['', '', 'ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЁТ № 01-01', '', '', '', '', '', '', '', '', '', '', '', '', '']); // row 2
rows.push(['', '', 'на устройство электроснабжения здания 23к', '', '', '', '', '', '', '', '', '', '', '', '', '']); // row 3
rows.push(Array(16).fill('')); // row 4
rows.push(['', '', '(наименование работ и затрат, наименование объекта)', '', '', '', '', '', '', '', '', '', '', '', '', '']); // row 5

// Fill rows 6-33 with empty
for (let i = 0; i < 28; i++) {
  rows.push(Array(16).fill(''));
}

// ── Header rows (row 34-38) ──
// Row 34: Main header
rows.push([
  '№ п/п', 'Обоснование', 'Наименование', '', '', '', '', 'Ед. изм.',
  'Количество', '', '', 'Стоимость единицы, руб.', '', '', 'Коэффициенты', 'Всего с учётом индекса, руб.'
]);

// Row 35: Sub-header
rows.push([
  '', '', '', '', '', '', '', '',
  'на единицу', 'коэфф.', 'всего', 'в базисном уровне цен', 'Индекс', 'в текущем уровне цен', '', ''
]);

// Row 36: Column numbers 1-12 (triggers GRAND_SMETA_MAPPING detection)
rows.push(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '', '', '', '']);

// ── Section 1 ──
rows.push(sectionRowA('Раздел 1. Электроснабжение'));

// ═══════════════════════════════════════════════════════════════════════════
// POSITION 1: Прокладка кабелей (работа)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(makeRow(
  '1', 'ГЭСН08-02-402-01',
  'Прокладка кабелей марки ВВГнг-LS сечением до 6 мм2 в трубах и на лотках',
  '100 м', '', '', '4,5',
  '12450', '7,22', '89889', '', '404500,50'
));

// Resource: ОТ (labor)
rows.push(makeRow(
  '', '1',
  'ОТ', 'чел.-ч', '', '', '38,7',
  '342,50', '8,48', '2904,40', '', '112400,28'
));

// Resource: ЭМ (machinery)
rows.push(makeRow(
  '', '2',
  'ЭМ', 'маш.-ч', '', '', '12,15',
  '456,00', '6,12', '2790,72', '', '33907,25'
));

// Resource: М (materials — NOT matching our spec, this is incidental material)
rows.push(makeRow(
  '', '4',
  'М', '', '', '', '',
  '', '', '', '', '258193,00'
));

// Sub-total
rows.push(makeRow('', '', 'Итого прямых', '', '', '', '', '', '', '', '', '404500,50'));

// Resource: НР (overhead)
rows.push(makeRow(
  '', '', 'НР по ГЭСН08-02-402-01 = 95% ФОТ',
  '', '', '', '', '', '', '', '', '106780,27'
));

// Resource: СП (profit)
rows.push(makeRow(
  '', '', 'СП по ГЭСН08-02-402-01 = 65% ФОТ',
  '', '', '', '', '', '', '', '', '73060,18'
));

// Position total
rows.push(makeRow('', '', 'Всего по позиции 1', '', '', '', '', '', '', '', '', '584340,95'));

// ═══════════════════════════════════════════════════════════════════════════
// POSITION 2: Монтаж автоматических выключателей (работа)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(makeRow(
  '2', 'ГЭСН08-02-495-01',
  'Установка автоматических выключателей однополюсных и трёхполюсных в щитах',
  'шт.', '', '', '36',
  '245', '7,22', '1768,90', '', '63680,40'
));

// Resource: ОТ
rows.push(makeRow('', '1', 'ОТ', 'чел.-ч', '', '', '18,0', '342,50', '8,48', '2904,40', '', '52279,20'));

// Resource: ЭМ
rows.push(makeRow('', '2', 'ЭМ', 'маш.-ч', '', '', '1,8', '456,00', '6,12', '2790,72', '', '5023,30'));

// Resource: М
rows.push(makeRow('', '4', 'М', '', '', '', '', '', '', '', '', '6377,90'));

// Sub-total
rows.push(makeRow('', '', 'Итого прямых', '', '', '', '', '', '', '', '', '63680,40'));

// НР
rows.push(makeRow('', '', 'НР по ГЭСН08-02-495-01 = 95% ФОТ', '', '', '', '', '', '', '', '', '49665,24'));

// СП
rows.push(makeRow('', '', 'СП по ГЭСН08-02-495-01 = 65% ФОТ', '', '', '', '', '', '', '', '', '33981,48'));

// Position total
rows.push(makeRow('', '', 'Всего по позиции 2', '', '', '', '', '', '', '', '', '147327,12'));

// ═══════════════════════════════════════════════════════════════════════════
// POSITION 3: Монтаж электрощита (работа)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(makeRow(
  '3', 'ГЭСН08-02-380-02',
  'Установка и монтаж щитов распределительных навесных до 36 модулей',
  'шт.', '', '', '2',
  '8430', '7,22', '60864,60', '', '121729,20'
));

// Resource: ОТ
rows.push(makeRow('', '1', 'ОТ', 'чел.-ч', '', '', '24,0', '342,50', '8,48', '2904,40', '', '69705,60'));

// Resource: ЭМ
rows.push(makeRow('', '2', 'ЭМ', 'маш.-ч', '', '', '6,0', '456,00', '6,12', '2790,72', '', '16744,32'));

// Resource: М
rows.push(makeRow('', '4', 'М', '', '', '', '', '', '', '', '', '35279,28'));

// Sub-total
rows.push(makeRow('', '', 'Итого прямых', '', '', '', '', '', '', '', '', '121729,20'));

// НР
rows.push(makeRow('', '', 'НР по ГЭСН08-02-380-02 = 95% ФОТ', '', '', '', '', '', '', '', '', '66220,28'));

// СП
rows.push(makeRow('', '', 'СП по ГЭСН08-02-380-02 = 65% ФОТ', '', '', '', '', '', '', '', '', '45308,64'));

// Position total
rows.push(makeRow('', '', 'Всего по позиции 3', '', '', '', '', '', '', '', '', '233258,12'));

// ═══════════════════════════════════════════════════════════════════════════
// POSITION 4: Кабель ВВГнг-LS 3×2,5 (оборудование / материал из спеки)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(makeRow(
  '4\nО', 'ФСБЦ-28-01-003-01',
  'Кабель ВВГнг-LS 3x2.5',
  'м.п.', '', '', '500',
  '85,00', '5,35', '454,75', '', '227375,00'
));

// Position total
rows.push(makeRow('', '', 'Всего по позиции 4', '', '', '', '', '', '', '', '', '227375,00'));

// ═══════════════════════════════════════════════════════════════════════════
// POSITION 5: Автомат ABB S203 C25 (оборудование из спеки)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(makeRow(
  '5\nО', 'ФСБЦ-29-01-010-01',
  'Автомат ABB S203 C25 3P',
  'шт', '', '', '24',
  '2850,00', '4,12', '11742,00', '', '281808,00'
));

// Position total
rows.push(makeRow('', '', 'Всего по позиции 5', '', '', '', '', '', '', '', '', '281808,00'));

// ═══════════════════════════════════════════════════════════════════════════
// POSITION 6: Щит ЩР-11-73 (оборудование из спеки)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(makeRow(
  '6\nО', 'ТЦ-34-01-002-01',
  'Щит распределительный ЩР-12',
  'шт', '', '', '4',
  '34500,00', '3,85', '132825,00', '', '531300,00'
));

// Position total
rows.push(makeRow('', '', 'Всего по позиции 6', '', '', '', '', '', '', '', '', '531300,00'));

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY BLOCK (концовка)
// ═══════════════════════════════════════════════════════════════════════════

rows.push(Array(16).fill('')); // separator

// Section total
const sectionDirectTotal = 404500.50 + 63680.40 + 121729.20 + 227375.00 + 281808.00 + 531300.00;
rows.push(summaryRow('Итого по разделу 1', sectionDirectTotal));

rows.push(Array(16).fill('')); // separator

// Document summary
const directCostsTotal = sectionDirectTotal;
const overheadTotal = 106780.27 + 49665.24 + 66220.28;
const profitTotal = 73060.18 + 33981.48 + 45308.64;
const subtotal = directCostsTotal + overheadTotal + profitTotal;

rows.push(summaryRow('Итого прямых затрат', directCostsTotal));
rows.push(summaryRow('Накладные расходы', overheadTotal));
rows.push(summaryRow('Сметная прибыль', profitTotal));
rows.push(summaryRow('Итого по смете', subtotal));

// Surcharges
const winterRate = 1.5;
const winterAmount = subtotal * winterRate / 100;
rows.push(summaryRow(`Зимнее удорожание ${winterRate}%`, Math.round(winterAmount * 100) / 100));

const tempRate = 1.8;
const tempAmount = subtotal * tempRate / 100;
rows.push(summaryRow(`Временные здания и сооружения ${tempRate}%`, Math.round(tempAmount * 100) / 100));

const contingencyRate = 2.0;
const totalBeforeContingency = subtotal + winterAmount + tempAmount;
const contingencyAmount = totalBeforeContingency * contingencyRate / 100;
rows.push(summaryRow(`Непредвиденные расходы ${contingencyRate}%`, Math.round(contingencyAmount * 100) / 100));

const totalBeforeVat = totalBeforeContingency + contingencyAmount;
const vatRate = 20;
const vatAmount = totalBeforeVat * vatRate / 100;
rows.push(summaryRow(`НДС ${vatRate}%`, Math.round(vatAmount * 100) / 100));

const grandTotal = totalBeforeVat + vatAmount;
rows.push(summaryRow('Всего по смете', Math.round(grandTotal * 100) / 100));

// ── Build workbook ──
const ws = XLSX.utils.aoa_to_sheet(rows);

// Set column widths
ws['!cols'] = [
  { wch: 8 },   // A: №
  { wch: 22 },  // B: Обоснование
  { wch: 55 },  // C: Наименование
  { wch: 3 },   // D: merged
  { wch: 3 },   // E: merged
  { wch: 3 },   // F: merged
  { wch: 3 },   // G: merged
  { wch: 10 },  // H: Ед.изм.
  { wch: 10 },  // I: Кол на ед
  { wch: 8 },   // J: Коэфф
  { wch: 10 },  // K: Кол всего
  { wch: 14 },  // L: Базис
  { wch: 8 },   // M: Индекс
  { wch: 14 },  // N: Текущая
  { wch: 12 },  // O: Коэфф
  { wch: 16 },  // P: Всего
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'ЛСР-01-01');

const outputPath = join(__dirname, '..', 'frontend', 'public', 'test-lsr-electro.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Generated test ЛСР file:', outputPath);
console.log(`   Sections: 1`);
console.log(`   Work positions (ГЭСН): 3`);
console.log(`   Equipment positions (ФСБЦ/ТЦ): 3`);
console.log(`   Direct costs total: ${sectionDirectTotal.toLocaleString('ru-RU')} ₽`);
console.log(`   Overhead (НР): ${overheadTotal.toLocaleString('ru-RU')} ₽`);
console.log(`   Profit (СП): ${profitTotal.toLocaleString('ru-RU')} ₽`);
console.log(`   Grand total with VAT: ${Math.round(grandTotal).toLocaleString('ru-RU')} ₽`);
