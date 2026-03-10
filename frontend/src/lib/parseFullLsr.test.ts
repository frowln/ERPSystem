// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseFullLsrRows } from './parseFullLsr';
import type { LsrParseResult } from './parseFullLsr';

// Helper to create a minimal LSR xlsx-like 2D array
function makeLsrRows(): string[][] {
  return [
    // Row 0: header
    ['№ п/п', 'Обоснование', 'Наименование', '', '', '', '', 'Ед.изм.', 'Кол-во на ед.', 'Коэфф.', 'Кол-во всего', 'Стоимость базисная', 'Индекс', 'Стоимость текущая', 'Коэффициенты', 'Всего'],
    // Row 1: section header
    ['', '', 'Раздел 1. СИСТЕМА ВЕНТИЛЯЦИИ П1-П4', '', '', '', '', '', '', '', '', '', '', '', '', '15000000'],
    // Row 2: position (GESN work)
    ['1', 'ГЭСН 20-01-002-02', 'Монтаж воздуховодов из листовой стали', '', '', '', '', '100 м²', '1', '1', '3.54', '12456', '7.42', '92427', '1.0', '327190'],
    // Row 3: resource OT
    ['1', '', 'Затраты труда рабочих-строителей', '', '', '', '', 'чел-ч', '', '', '45.67', '234', '7.42', '1736', '', '6151'],
    // Row 4: resource EM
    ['2', '', 'Эксплуатация машин и механизмов', '', '', '', '', 'маш-ч', '', '', '2.5', '1890', '5.23', '9881', '', '24703'],
    // Row 5: resource M
    ['4', '', 'Материальные ресурсы — Воздуховод d=250мм', '', '', '', '', 'м²', '', '', '354', '890', '6.15', '5474', '', '296250'],
    // Row 6: resource NR
    ['', '', 'Накладные расходы 112% ФОТ', '', '', '', '', '', '', '', '', '', '', '', '', '6890'],
    // Row 7: resource SP
    ['', '', 'Сметная прибыль 65% ФОТ', '', '', '', '', '', '', '', '', '', '', '', '', '3998'],
    // Row 8: position (FSBC material/equipment)
    ['2', 'ФСБЦ-12-345', 'Установка приточная компактная ПВУ-500', '', '', '', '', 'шт', '1', '1', '1', '456000', '7.57', '3451920', '', '3451920'],
    // Row 9: Всего по позиции (closes FSBC position)
    ['', '', 'Всего по позиции', '', '', '', '', '', '', '', '', '', '', '', '', '3451920'],
    // Row 10: section 2
    ['', '', 'Раздел 2. СИСТЕМА ВЕНТИЛЯЦИИ В1-В4', '', '', '', '', '', '', '', '', '', '', '', '', '5000000'],
    // Row 11: position in section 2
    ['3', 'ГЭСН 20-03-001-05', 'Установка вентиляторов осевых', '', '', '', '', 'шт', '1', '1', '4', '8900', '7.42', '66038', '', '264152'],
    // Row 12: Всего по позиции (closes last position)
    ['', '', 'Всего по позиции', '', '', '', '', '', '', '', '', '', '', '', '', '264152'],
    // Row 13: summary — direct costs
    ['', '', 'Итого прямых затрат', '', '', '', '', '', '', '', '', '', '', '', '', '20000000'],
    // Row 12: summary — overhead
    ['', '', 'Накладные расходы', '', '', '', '', '', '', '', '', '', '', '', '', '3500000'],
    // Row 13: summary — profit
    ['', '', 'Сметная прибыль', '', '', '', '', '', '', '', '', '', '', '', '', '2000000'],
    // Row 14: summary — subtotal
    ['', '', 'Итого по смете', '', '', '', '', '', '', '', '', '', '', '', '', '25500000'],
    // Row 15: winter surcharge
    ['', '', 'Зимнее удорожание 1.5%', '', '', '', '', '', '', '', '', '', '', '', '', '382500'],
    // Row 16: temp structures
    ['', '', 'Временные здания и сооружения 1.2%', '', '', '', '', '', '', '', '', '', '', '', '', '306000'],
    // Row 17: contingency
    ['', '', 'Непредвиденные работы и затраты 2%', '', '', '', '', '', '', '', '', '', '', '', '', '510000'],
    // Row 18: VAT
    ['', '', 'НДС 20%', '', '', '', '', '', '', '', '', '', '', '', '', '5339700'],
    // Row 19: grand total
    ['', '', 'Всего по смете', '', '', '', '', '', '', '', '', '', '', '', '', '32038200'],
  ];
}

describe('parseFullLsr', () => {
  let result: LsrParseResult;

  it('parses sample LSR data into structured result', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    expect(result).toBeDefined();
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.flatLines.length).toBeGreaterThan(0);
  });

  it('detects sections correctly', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    expect(result.metadata.parsedSections).toBe(2);
    const sectionNodes = result.sections.filter(s => s.lineType === 'SECTION');
    expect(sectionNodes.length).toBe(2);
    expect(sectionNodes[0].name).toContain('СИСТЕМА ВЕНТИЛЯЦИИ П1-П4');
    expect(sectionNodes[1].name).toContain('СИСТЕМА ВЕНТИЛЯЦИИ В1-В4');
  });

  it('detects positions with correct types', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    const positions = result.flatLines.filter(l => l.lineType === 'POSITION');
    expect(positions.length).toBe(3);

    // First position — GESN work
    expect(positions[0].positionType).toBe('GESN');
    expect(positions[0].justification).toBe('ГЭСН 20-01-002-02');
    expect(positions[0].quantityTotal).toBe(3.54);

    // Second position — FSBC material/equipment
    expect(positions[1].positionType).toBe('FSBC');
    expect(positions[1].justification).toBe('ФСБЦ-12-345');

    // Third position — another GESN
    expect(positions[2].positionType).toBe('GESN');
  });

  it('nests resources under positions', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    const section1 = result.sections.find(s => s.name?.includes('П1-П4'));
    expect(section1).toBeDefined();

    // Section 1 should have 2 positions (GESN + FSBC)
    const positionsInSec1 = section1!.children.filter(c => c.lineType === 'POSITION');
    expect(positionsInSec1.length).toBe(2);

    // First position should have resources (OT, EM, M, NR, SP)
    const gesnPosition = positionsInSec1[0];
    expect(gesnPosition.children.length).toBeGreaterThanOrEqual(4);

    const resourceTypes = gesnPosition.children
      .filter(c => c.resourceType)
      .map(c => c.resourceType);
    expect(resourceTypes).toContain('OT');
    expect(resourceTypes).toContain('EM');
    expect(resourceTypes).toContain('M');
    expect(resourceTypes).toContain('NR');
    expect(resourceTypes).toContain('SP');
  });

  it('parses summary (konzovka) correctly', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    expect(result.summary.directCostsTotal).toBe(20000000);
    expect(result.summary.overheadTotal).toBe(3500000);
    expect(result.summary.profitTotal).toBe(2000000);
    expect(result.summary.subtotal).toBe(25500000);
    expect(result.summary.winterSurcharge).toBe(382500);
    expect(result.summary.winterSurchargeRate).toBe(1.5);
    expect(result.summary.tempStructures).toBe(306000);
    expect(result.summary.tempStructuresRate).toBe(1.2);
    expect(result.summary.contingency).toBe(510000);
    expect(result.summary.contingencyRate).toBe(2);
    expect(result.summary.vatRate).toBe(20);
    expect(result.summary.vatAmount).toBe(5339700);
    expect(result.summary.grandTotal).toBe(32038200);
  });

  it('assigns correct depth to nodes', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    const sectionLines = result.flatLines.filter(l => l.lineType === 'SECTION');
    const positionLines = result.flatLines.filter(l => l.lineType === 'POSITION');
    const resourceLines = result.flatLines.filter(l => l.lineType === 'RESOURCE');

    sectionLines.forEach(l => expect(l.depth).toBe(0));
    positionLines.forEach(l => expect(l.depth).toBe(1));
    resourceLines.forEach(l => expect(l.depth).toBe(2));
  });

  it('provides correct metadata', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test-lsr.xlsx', 'Лист1');

    expect(result.metadata.fileName).toBe('test-lsr.xlsx');
    expect(result.metadata.sheetName).toBe('Лист1');
    expect(result.metadata.totalRows).toBe(rows.length);
    expect(result.metadata.parsedSections).toBe(2);
    expect(result.metadata.parsedPositions).toBe(3);
    expect(result.metadata.parsedResources).toBeGreaterThanOrEqual(4);
  });

  it('detects column mapping from header', () => {
    const rows = makeLsrRows();
    result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    expect(result.columnMapping.nameCol).toBe(2);
    expect(result.columnMapping.codeCol).toBe(1);
    expect(result.columnMapping.unitCol).toBe(7);
    expect(result.columnMapping.totalCol).toBe(15);
  });

  it('handles empty/minimal data gracefully', () => {
    const rows = [
      ['№', 'Код', 'Наименование', 'Ед.изм.', 'Кол-во', 'Цена', 'Сумма'],
    ];
    const result = parseFullLsrRows(rows, 'empty.xlsx', 'Sheet1');
    expect(result.sections).toHaveLength(0);
    expect(result.flatLines).toHaveLength(0);
    expect(result.summary.grandTotal).toBe(0);
  });

  it('detects ГРАНД-Смета format via column-number row', () => {
    // Simulate ГРАНД-Смета multi-row headers (rows 35-38 in real file)
    const rows: string[][] = [];
    // Pad with empty rows to simulate real file header area
    for (let i = 0; i < 5; i++) rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    // Row 5: main header with merged cells (only "Наименование" visible)
    rows.push(['№ п/п', 'Обоснование', 'Наименование работ и затрат', '', '', 'Сметная стоимость', '', '', '', '', '', '', '', '', '', '']);
    // Row 6: sub-headers
    rows.push(['', '', '', '', '', '', '', 'Ед.изм.', 'на единицу', 'коэфф.', 'всего', 'базис', 'индекс', 'текущая', 'коэфф.', 'всего']);
    // Row 7: column numbers (1-12) — ГРАНД-Смета signature
    rows.push(['', '', '', '', '', '', '', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    // Row 8: section header
    rows.push(['', '', 'Раздел 1. Вентиляция', '', '', '', '', '', '', '', '', '', '', '', '', '5000000']);
    // Row 9: position
    rows.push(['1', 'ГЭСН 20-01-002-02', 'Монтаж воздуховодов', '', '', '', '', '100 м²', '1', '1', '3.54', '12456', '7.42', '92427', '', '327190']);
    // Row 10: summary
    rows.push(['', '', 'Всего по смете', '', '', '', '', '', '', '', '', '', '', '', '', '5000000']);

    const result = parseFullLsrRows(rows, 'grand-smeta.xlsx', 'Sheet1');

    // Should detect ГРАНД-Смета mapping (headerRow at column-number row)
    expect(result.columnMapping.numCol).toBe(0);
    expect(result.columnMapping.codeCol).toBe(1);
    expect(result.columnMapping.nameCol).toBe(2);
    expect(result.columnMapping.unitCol).toBe(7);
    expect(result.columnMapping.totalCol).toBe(15);
    expect(result.metadata.parsedSections).toBe(1);
    expect(result.metadata.parsedPositions).toBeGreaterThanOrEqual(1);
  });

  it('detects "Система" as section header', () => {
    const rows = [
      ['№', 'Обоснование', 'Наименование', '', '', '', '', 'Ед.изм.', '', '', 'Кол-во', 'Стоимость базисная', 'Индекс', 'Стоимость текущая', '', 'Всего'],
      ['', '', 'Раздел 1. Вентиляция', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', 'Система 1 Приточная вентиляция П1-П4', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['1', 'ГЭСН 20-01-002-02', 'Монтаж воздуховодов', '', '', '', '', '100 м²', '', '', '3.54', '12456', '7.42', '92427', '', '327190'],
      ['', '', 'Всего по смете', '', '', '', '', '', '', '', '', '', '', '', '', '327190'],
    ];
    const result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    // Раздел + Система = 2 sections
    expect(result.metadata.parsedSections).toBe(2);
    const sections = result.flatLines.filter(l => l.lineType === 'SECTION');
    expect(sections[1].name).toContain('Система 1');
  });

  it('stores coefficient rows on position', () => {
    const rows = [
      ['№', 'Обоснование', 'Наименование', '', '', '', '', 'Ед.изм.', '', '', 'Кол-во', 'Стоимость базисная', 'Индекс', 'Стоимость текущая', '', 'Всего'],
      ['1', 'ГЭСН 20-01-002-02', 'Монтаж воздуховодов', '', '', '', '', '100 м²', '', '', '3.54', '12456', '7.42', '92427', '', '327190'],
      ['', '', 'ОЗП=1,2; ЭМ=1,2; МАТ=1,0', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['1', '', 'Затраты труда рабочих-строителей', '', '', '', '', 'чел-ч', '', '', '45.67', '234', '7.42', '1736', '', '6151'],
      ['', '', 'Всего по смете', '', '', '', '', '', '', '', '', '', '', '', '', '327190'],
    ];
    const result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    const position = result.flatLines.find(l => l.lineType === 'POSITION');
    expect(position).toBeDefined();
    expect(position!.coefficients).toContain('ОЗП=1,2');
    expect(position!.coefficients).toContain('ЭМ=1,2');
  });

  it('detects equipment items (NО pattern)', () => {
    const rows = [
      ['№', 'Обоснование', 'Наименование', '', '', '', '', 'Ед.изм.', '', '', 'Кол-во', 'Стоимость базисная', 'Индекс', 'Стоимость текущая', '', 'Всего'],
      ['1', 'ГЭСН 20-01-002-02', 'Монтаж воздуховодов', '', '', '', '', '100 м²', '', '', '3.54', '12456', '7.42', '92427', '', '327190'],
      ['1О', 'ТЦ_70-0201-0020', 'Вентилятор канальный ВК-250', '', '', '', '', 'шт', '', '', '2', '45000', '7.57', '340650', '', '681300'],
      ['', '', 'Всего по смете', '', '', '', '', '', '', '', '', '', '', '', '', '1008490'],
    ];
    const result = parseFullLsrRows(rows, 'test.xlsx', 'Sheet1');

    const positions = result.flatLines.filter(l => l.lineType === 'POSITION');
    expect(positions.length).toBe(2);
    // Equipment item should be detected as TC
    const equipPos = positions.find(p => p.name.includes('Вентилятор'));
    expect(equipPos).toBeDefined();
    expect(equipPos!.positionType).toBe('TC');
  });

  it('handles file without sections (flat positions)', () => {
    const rows = [
      ['№', 'Обоснование', 'Наименование', '', '', '', '', 'Ед.изм.', '', '', 'Кол-во', 'Стоимость базисная', 'Индекс', 'Стоимость текущая', '', 'Всего'],
      ['1', 'ГЭСН 11-01-001-01', 'Разработка грунта', '', '', '', '', 'м³', '', '', '100', '500', '7.0', '3500', '', '350000'],
      ['', '', 'Всего по позиции', '', '', '', '', '', '', '', '', '', '', '', '', '350000'],
      ['2', 'ФСБЦ-01-002', 'Бетон В25', '', '', '', '', 'м³', '', '', '50', '3000', '6.5', '19500', '', '975000'],
      ['', '', 'Всего по позиции', '', '', '', '', '', '', '', '', '', '', '', '', '975000'],
      ['', '', 'Итого прямых затрат', '', '', '', '', '', '', '', '', '', '', '', '', '1325000'],
      ['', '', 'Всего по смете', '', '', '', '', '', '', '', '', '', '', '', '', '1325000'],
    ];
    const result = parseFullLsrRows(rows, 'flat.xlsx', 'Sheet1');

    // No sections — positions should be at root level
    expect(result.metadata.parsedSections).toBe(0);
    expect(result.metadata.parsedPositions).toBe(2);
    expect(result.sections.length).toBe(2); // 2 orphan positions
    expect(result.summary.directCostsTotal).toBe(1325000);
    expect(result.summary.grandTotal).toBe(1325000);
  });
});
