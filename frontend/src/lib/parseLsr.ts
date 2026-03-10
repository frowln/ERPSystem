/**
 * ЛСР (Локальный Сметный Расчёт) xlsx parser.
 *
 * Reads a standard ЛСР xlsx file and extracts work/equipment items
 * with their codes, quantities, units, and prices.
 */
import * as XLSX from 'xlsx';

export interface LsrParsedItem {
  sequence: number;
  productCode: string;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType: 'WORK' | 'MATERIAL' | 'EQUIPMENT';
}

export function parseLsrFile(file: File): Promise<LsrParsedItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = (XLSX.utils.sheet_to_json(sheet, {
          header: 1, defval: '', raw: false,
        }) as unknown[][]).map((r) => r.map((c) => String(c ?? '').trim()));

        const items = parseLsrRows(rows);
        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseLsrRows(rows: string[][]): LsrParsedItem[] {
  // ── Find header row ──
  let hRow = -1;
  let numCol = -1, codeCol = -1, nameCol = -1, unitCol = -1;
  let qtyCol = -1, priceCol = -1, totalCol = -1;

  for (let r = 0; r < Math.min(rows.length, 50); r++) {
    const row = rows[r].map((c) => c.toLowerCase());
    const ni = row.findIndex((c) =>
      c.includes('наименован') || c.includes('название') || c === 'name',
    );
    if (ni < 0) continue;

    // Require at least one more header keyword to avoid matching
    // metadata rows like "Наименование программного продукта"
    const hasOtherHeader = row.some((c) =>
      c.includes('обоснован') || c.includes('шифр') || c.includes('п/п') ||
      (c.includes('ед') && c.includes('изм')) || c.includes('количеств') ||
      c.includes('стоимость') || c.includes('расценк'),
    );
    if (!hasOtherHeader) continue;

    hRow = r;
    nameCol = ni;

    // № п/п
    numCol = row.findIndex((c) => c === '№' || c.includes('п/п') || c.includes('номер'));

    // Обоснование / код / шифр (ГЭСН)
    codeCol = row.findIndex((c) =>
      c.includes('обоснован') || c.includes('шифр') || c.includes('код') || c.includes('гэсн'),
    );

    // Ед.изм.
    unitCol = row.findIndex((c) => (c.includes('ед') && c.includes('изм')) || c === 'unit');

    // Количество — берём последний столбец с "кол"/"количеств"
    const qtyCols: number[] = [];
    row.forEach((c, i) => {
      if (c.includes('кол') || c === 'qty' || c.includes('количеств')) qtyCols.push(i);
    });
    qtyCol = qtyCols.length > 0 ? qtyCols[qtyCols.length - 1] : -1;

    // Цена — ищем "цена" или "стоимость" (не "итог"/"сумм")
    priceCol = row.findIndex((c) =>
      (c.includes('цена') || c.includes('расценк') || (c.includes('стоимость') && !c.includes('сумм')))
      && !c.includes('сумм') && !c.includes('итог'),
    );

    // Сумма — последний столбец с "сумм"/"итог"/"всего"
    totalCol = row.findLastIndex((c) => c.includes('сумм') || c.includes('итог') || c.includes('всего'));

    // ГРАНД-Смета: multi-row header — look for column-number row (1,2,3...12) below
    for (let sub = hRow + 1; sub < Math.min(hRow + 6, rows.length); sub++) {
      const subRow = rows[sub].map((c) => c.trim());
      const nums = subRow.filter((c) => /^\d+$/.test(c)).map(Number);
      if (nums.length >= 10 && nums.includes(1) && nums.includes(12)) {
        // Use standard ГРАНД-Смета column mapping
        hRow = sub;
        numCol = 0; codeCol = 1; nameCol = 2; unitCol = 7;
        qtyCol = 10; priceCol = 13; totalCol = 15;
        break;
      }
    }
    break;
  }

  // Fallback: standard ГРАНД-Смета column order
  // №|Шифр|Наименование|Ед.изм.|Кол-во|ЦенаЕд|Сумма
  if (hRow < 0 || nameCol < 0) {
    hRow = 0;
    numCol = 0; codeCol = 1; nameCol = 2; unitCol = 3;
    qtyCol = 4; priceCol = 5; totalCol = 6;
  }

  const col = (row: string[], idx: number) => (idx >= 0 ? row[idx] ?? '' : '');
  const parseNum = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;

  const items: LsrParsedItem[] = [];
  let seqCounter = 0;

  for (let r = hRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const rawName = col(row, nameCol);
    if (!rawName || rawName.length < 3) continue;

    // Skip section headers (all caps, long strings)
    if (/^[А-ЯA-Z\s\-–—.,:;!?()]+$/.test(rawName) && rawName.length > 40) continue;
    // Skip "Итого" / summary rows
    if (/^итого/i.test(rawName.trim()) || /^всего/i.test(rawName.trim())) continue;

    const code = col(row, codeCol);
    const qty = parseNum(col(row, qtyCol)) || 1;
    const price = parseNum(col(row, priceCol));
    const sum = parseNum(col(row, totalCol));

    // Derive unit price if not directly available
    const unitPrice = price > 0 ? price : (sum > 0 && qty > 0 ? sum / qty : 0);
    if (unitPrice === 0 && sum === 0) continue; // skip empty rows

    const amount = sum > 0 ? sum : unitPrice * qty;

    // Determine sequence from file or auto
    const seqRaw = col(row, numCol);
    const seqNum = parseNum(seqRaw);
    seqCounter++;
    const sequence = seqNum > 0 ? seqNum : seqCounter;

    // Determine item type
    // Equipment: sequence suffix "О" (e.g. "3О") or code ends with "О"
    const isEquipment = /\d+\s*[ОоOo]$/i.test(seqRaw) ||
      /[ОоOo]\s*$/.test(code) ||
      rawName.toLowerCase().includes('оборудован');

    const itemType: LsrParsedItem['itemType'] = isEquipment ? 'EQUIPMENT' : 'WORK';

    items.push({
      sequence,
      productCode: code,
      name: rawName,
      unitOfMeasure: col(row, unitCol) || 'шт',
      quantity: qty,
      unitPrice,
      amount,
      itemType,
    });
  }

  return items;
}
