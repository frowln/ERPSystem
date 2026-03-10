#!/usr/bin/env node
/**
 * Генерация тестового ПД — ИОС7.1 Электроснабжение
 * ЖК "Речной парк", шифр 2025-СПБ-042
 * Компактный PDF для тестирования второй спецификации
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'ПД_ЖК_Речной_парк_2025-СПБ-042_ИОС7.1.pdf');

const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// ── Fonts ──
const fontFiles = ['/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'];
const boldFiles = ['/System/Library/Fonts/Supplemental/Arial Bold.ttf'];
let F = 'Helvetica', FB = 'Helvetica-Bold';
for (const p of fontFiles) { if (fs.existsSync(p)) { try { doc.registerFont('R', p); F = 'R'; break; } catch {} } }
for (const p of boldFiles) { if (fs.existsSync(p)) { try { doc.registerFont('B', p); FB = 'B'; break; } catch {} } }

// ── Helpers ──
const PW = 595.28, PH = 841.89, ML = 50, CW = PW - 100;
let pn = 0, CY = 50;

function np() {
  doc.addPage({ size: 'A4', margin: 50 }); pn++;
  doc.x = ML; doc.y = 50;
  doc.font(F).fontSize(7);
  doc.text('2025-СПБ-042/ИОС7.1', ML, PH - 35, { width: CW / 2, align: 'left', height: 12 });
  doc.text(`${pn}`, ML + CW / 2, PH - 35, { width: CW / 2, align: 'right', height: 12 });
  doc.x = ML; doc.y = 50;
}
function t(str, x, y, opts = {}) { doc.text(str, x, y, { width: CW, height: opts.height || 14, ...opts }); }

// ── Spec table columns ──
const SC = [
  { label: 'Поз.', w: 28 },
  { label: 'Наименование и техническая характеристика', w: 155 },
  { label: 'Тип, марка', w: 62 },
  { label: 'Код', w: 48 },
  { label: 'Завод-изг.', w: 55 },
  { label: 'Ед.', w: 28 },
  { label: 'Кол.', w: 35 },
  { label: 'Масса,кг', w: 42 },
  { label: 'Прим.', w: 42 },
]; // Total: 495 = page content width
const RH = 16, HH = 28;
const PB = PH - 55;

function specHeader(y) {
  let x = ML;
  doc.font(FB).fontSize(6.5);
  for (const c of SC) {
    doc.rect(x, y, c.w, HH).stroke();
    doc.text(c.label, x + 2, y + 3, { width: c.w - 4, align: 'center', height: HH - 4 });
    x += c.w;
  }
  return y + HH;
}

function specSectionHeader(title) {
  if (CY + RH > PB) { np(); CY = 55; headerDrawn = false; ensureHeader(); }
  const totalW = SC.reduce((s, c) => s + c.w, 0);
  doc.rect(ML, CY, totalW, RH).stroke();
  doc.font(FB).fontSize(8);
  t(title, ML + 4, CY + 3, { width: totalW - 8, height: RH - 4 });
  CY += RH;
}

function specRow(row) {
  if (CY + RH > PB) { np(); CY = 55; headerDrawn = false; ensureHeader(); }
  let x = ML;
  doc.font(F).fontSize(7);
  for (let i = 0; i < SC.length; i++) {
    doc.rect(x, CY, SC[i].w, RH).stroke();
    doc.text(row[i] || '', x + 2, CY + 3, { width: SC[i].w - 4, height: RH - 4 });
    x += SC[i].w;
  }
  CY += RH;
}

// Track whether column header was already drawn on current page
let headerDrawn = false;

function ensureHeader() {
  if (!headerDrawn) {
    CY = specHeader(CY);
    headerDrawn = true;
  }
}

function specSection(title, items) {
  // Need space for header (if not drawn) + section title + at least 1 row
  const needed = (headerDrawn ? 0 : HH) + RH * 2;
  if (CY + needed > PB) { np(); CY = 55; headerDrawn = false; }
  ensureHeader();
  specSectionHeader(title);
  for (const item of items) { specRow(item); }
}

// ═══════════════════════════════
// PAGE 1: TITLE
// ═══════════════════════════════
np();
doc.font(FB).fontSize(16);
t('ООО "ПРИВОД-ИНЖИНИРИНГ"', ML, 90, { align: 'center', height: 22 });
doc.font(F).fontSize(9);
t('ИНН 7801234567 / КПП 780101001', ML, 115, { align: 'center' });

doc.font(FB).fontSize(20);
t('ПРОЕКТНАЯ ДОКУМЕНТАЦИЯ', ML, 220, { align: 'center', height: 28 });
doc.font(FB).fontSize(16);
t('Жилой комплекс "Речной парк"', ML, 260, { align: 'center', height: 22 });
doc.font(F).fontSize(12);
t('Шифр: 2025-СПБ-042', ML, 290, { align: 'center', height: 18 });

doc.font(FB).fontSize(13);
t('Раздел 5. Сведения об инженерном оборудовании', ML, 340, { align: 'center', height: 18 });
t('Подраздел 7. Электроснабжение', ML, 362, { align: 'center', height: 18 });
doc.font(F).fontSize(12);
t('ИОС7.1', ML, 388, { align: 'center', height: 18 });

doc.font(F).fontSize(11);
t('Заказчик: ООО "РИВЕР ДЕВЕЛОПМЕНТ"', ML, 440, { height: 16 });
t('Проектировщик: ООО "ПРИВОД-ИНЖИНИРИНГ"', ML, 460, { height: 16 });
t('Стадия: П (Проектная документация)', ML, 500, { height: 16 });
t('г. Санкт-Петербург, 2025', ML, PH - 90, { align: 'center', height: 18 });

// ═══════════════════════════════
// PAGE 2: СОДЕРЖАНИЕ
// ═══════════════════════════════
np();
doc.font(FB).fontSize(15);
t('СОДЕРЖАНИЕ', ML, 60, { align: 'center', height: 22 });
doc.font(F).fontSize(10);
t('1. Общие данные ................ 3', ML, 100, { height: 16 });
t('2. Спецификация оборудования ... 3', ML, 120, { height: 16 });

// ═══════════════════════════════
// PAGES 3+: SPEC TABLES
// ═══════════════════════════════
np();
doc.font(FB).fontSize(12);
t('Спецификация оборудования, изделий и материалов', ML, 55, { align: 'center', height: 18 });
CY = 82;

specSection('ГЛАВНОЕ РАСПРЕДЕЛИТЕЛЬНОЕ УСТРОЙСТВО (ГРУ)', [
  ['1', 'ВРУ-0,4 кВ панельное 3-секц. Iном=2500А', 'ЩО-70-1-37', 'ВРУ-7101', 'КЭАЗ', 'шт.', '1', '480', ''],
  ['2', 'Автомат. выключатель 3P 2500A 50kA', 'ВА57-39', 'АВ-7102', 'КЭАЗ', 'шт.', '2', '14', 'ввод'],
  ['3', 'Автомат. выключатель 3P 1600A 50kA', 'ВА57-39', 'АВ-7103', 'КЭАЗ', 'шт.', '4', '12', 'фидер'],
  ['4', 'Автомат. выключатель 3P 630A 35kA', 'ВА57-35', 'АВ-7104', 'КЭАЗ', 'шт.', '8', '5.2', ''],
  ['5', 'Трансформатор тока 1500/5A кл.0.5S', 'ТТИ-А', 'ТТ-7105', 'IEK', 'шт.', '6', '2.8', 'учёт'],
  ['6', 'Счётчик электроэнергии 3ф многотариф.', 'Меркурий 234', 'СЧ-7106', 'Инкотекс', 'шт.', '3', '1.2', 'АСКУЭ'],
]);

specSection('ЭТАЖНЫЕ РАСПРЕДЕЛИТЕЛЬНЫЕ ЩИТЫ (ЩЭ)', [
  ['1', 'Щит этажный 4-кв ЩЭ-4 IP31', 'ЩЭ-4-01', 'ЩЭ-7201', 'IEK', 'шт.', '120', '18', ''],
  ['2', 'Автомат. выключатель 1P+N 16A С 6kA', 'АВДТ32', 'АВ-7202', 'IEK', 'шт.', '1920', '0.2', 'розетки'],
  ['3', 'Автомат. выключатель 1P+N 10A С 6kA', 'АВДТ32', 'АВ-7203', 'IEK', 'шт.', '960', '0.2', 'свет'],
  ['4', 'УЗО 2P 40A 30мА тип А', 'ВД1-63', 'УЗО-7204', 'IEK', 'шт.', '480', '0.25', ''],
  ['5', 'Счётчик электроэнергии 1ф', 'Меркурий 201.8', 'СЧ-7205', 'Инкотекс', 'шт.', '480', '0.35', ''],
]);

specSection('КАБЕЛЬНАЯ ПРОДУКЦИЯ (ЭС)', [
  ['1', 'Кабель ВВГнг(А)-LSLTx 5×16', 'ВВГнг-LS', 'КБ-7301', 'Кабэкс', 'м.п.', '3200', '1.05', 'маг.'],
  ['2', 'Кабель ВВГнг(А)-LSLTx 5×10', 'ВВГнг-LS', 'КБ-7302', 'Кабэкс', 'м.п.', '4800', '0.72', 'стояк'],
  ['3', 'Кабель ВВГнг(А)-LSLTx 3×2.5', 'ВВГнг-LS', 'КБ-7303', 'Кабэкс', 'м.п.', '28000', '0.12', 'группы'],
  ['4', 'Кабель ВВГнг(А)-LSLTx 3×1.5', 'ВВГнг-LS', 'КБ-7304', 'Кабэкс', 'м.п.', '18000', '0.08', 'свет'],
  ['5', 'Лоток перфор. 200×50 оцинк.', 'ПЛК-200', 'ЛТ-7305', 'Остек', 'м.п.', '1600', '1.4', ''],
  ['6', 'Лоток перфор. 100×50 оцинк.', 'ПЛК-100', 'ЛТ-7306', 'Остек', 'м.п.', '2400', '0.9', ''],
  ['7', 'Труба гофрир. ПВХ d=20 мм', 'ПВХ-20', 'ТР-7307', 'DKC', 'м.п.', '42000', '0.06', ''],
]);

specSection('АВАРИЙНОЕ И ЭВАКУАЦИОННОЕ ОСВЕЩЕНИЕ (АО)', [
  ['1', 'Светильник аварийный LED 8Вт, 3ч', 'BS-DRAGON-2', 'СВ-7401', 'Белый свет', 'шт.', '120', '0.8', ''],
  ['2', 'Указатель выхода LED "ВЫХОД"', 'BS-NEXUS-10', 'СВ-7402', 'Белый свет', 'шт.', '85', '0.6', ''],
  ['3', 'Светильник эвак. LED 4Вт IP65', 'BS-STAR-2', 'СВ-7403', 'Белый свет', 'шт.', '64', '0.5', ''],
]);

// ═══════════════════════════════
// FINALIZE
// ═══════════════════════════════
doc.end();
stream.on('finish', () => {
  const stats = fs.statSync(outputPath);
  console.log(`✅ PDF: ${outputPath}`);
  console.log(`   Pages: ${pn}, Size: ${(stats.size / 1024).toFixed(1)} KB`);
});
