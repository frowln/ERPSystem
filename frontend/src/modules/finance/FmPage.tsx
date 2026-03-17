import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Modal } from '@/design-system/components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { financeApi } from '@/api/finance';
import { estimatesApi } from '@/api/estimates';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { BudgetItem } from '@/types';
import type { MarginScenario } from '@/modules/finance/types';
import FmItemsTable from './budgetDetail/FmItemsTable';
import SnapshotPanel from './budgetDetail/SnapshotPanel';
import SnapshotCompareTable from './budgetDetail/SnapshotCompareTable';
import BudgetSectionConfig from './components/BudgetSectionConfig';
const AddBudgetItemModal = React.lazy(() => import('./budgetDetail/AddBudgetItemModal'));
import CvrView from './budgetDetail/CvrView';
import ValueEngineeringPanel from './ValueEngineeringPanel';
import { Camera, Download, Settings, Plus, ShieldCheck, ShieldAlert, FileSpreadsheet, Upload, AlertCircle, X, FileSignature, Wallet, SlidersHorizontal } from 'lucide-react';

// ─── ЛСР xlsx parser (ГРАНД-Смета Методика 2020 РИМ) ───────────────────────

type LsrItemType = 'EQUIPMENT' | 'WORK' | 'MATERIAL';

interface LsrRow {
  name: string;
  unit: string;
  quantity: number;
  estimatePrice: number; // цена за единицу из ЛСР
  total: number;         // quantity × estimatePrice
  type: LsrItemType;
  code: string;
  section: string;
}

/** Parse a number from ГРАНД-Смета xlsx cell: strips spaces, replaces comma → dot */
function parseGsNum(s: string): number {
  return parseFloat(s.replace(/\s/g, '').replace(/,/g, '.').replace(/\r/g, '')) || 0;
}

/** Clean cell value: trim + strip hidden \r and \n */
function cellVal(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return '';
  return (row[idx] ?? '').replace(/[\r\n]/g, '').trim();
}

/**
 * Detect position type from position number (col0) and code (col1).
 * Returns null if this row should be skipped.
 */
function detectPositionType(pos: string, code: string): LsrItemType | null {
  // Normative rows (pos = "Н" or "н")
  if (/^[Нн]$/i.test(pos)) return null;
  // Auxiliary rows with decimal pos (3.1, 4.2) and codes like 421/пр_...
  if (/^\d+\.\d+/.test(pos) && /^\d+\//.test(code)) return null;
  // Equipment: pos ends with О/о/O/o (Russian or Latin)
  if (/^\d+[ОоOo]$/i.test(pos)) return 'EQUIPMENT';
  // ГЭСН works
  if (/^Г[ЭЕ]СН/i.test(code)) return 'WORK';
  // ТЦ materials
  if (/^ТЦ[_-]/i.test(code)) return 'MATERIAL';
  // ФСБЦ materials
  if (/^ФСБЦ/i.test(code)) return 'MATERIAL';
  // ФЕР / ТЕР — works
  if (/^[ФТ]ЕР/i.test(code)) return 'WORK';
  // Generic numeric position with some code — treat as work
  if (/^\d+$/.test(pos) && code.length > 2) return 'WORK';
  return null;
}

/**
 * Check if a row is a section header: all-caps Cyrillic in col2, no position number.
 */
function isSectionHeader(pos: string, code: string, name: string): boolean {
  if (pos || code) return false;
  if (!name || name.length < 5) return false;
  // Section headers: mostly uppercase Cyrillic with spaces/punctuation
  return /^[А-ЯЁ\s\-–—.,:;!?()№«»"0-9]+$/u.test(name) && name.length > 8;
}

/**
 * Scan forward from a ГЭСН work position to find its "Всего по позиции" summary row.
 * Returns the unit price from col13 of that summary row, or 0.
 */
function findVsegoPoPozitiRow(rows: string[][], startRow: number, maxScan: number): number {
  for (let r = startRow + 1; r < Math.min(startRow + maxScan, rows.length); r++) {
    const name = cellVal(rows[r], 2).toLowerCase();
    if (name.includes('всего по позиции')) {
      return parseGsNum(cellVal(rows[r], 13)) || parseGsNum(cellVal(rows[r], 15));
    }
    // If we hit another position row (has code in col1), stop scanning
    const nextCode = cellVal(rows[r], 1);
    const nextPos = cellVal(rows[r], 0);
    if (nextPos && nextCode && /^[А-Яа-яA-Za-z]/.test(nextCode)) break;
  }
  return 0;
}

/**
 * Extract the primary equipment TYPE word from a name string.
 * Returns the canonical type keyword (lowercase), or null if not identifiable.
 */
function extractEquipmentType(name: string): string | null {
  const s = name.toLowerCase();
  // Order matters: check multi-word types first, then single-word
  const typePatterns: [RegExp, string][] = [
    [/модуль\s+управлен/,    'модуль управления'],
    [/узел\s+регулирующ/,    'узел регулирующий'],
    [/узел\s+обвязки/,       'узел обвязки'],
    [/шкаф\s+автоматик/,     'шкаф автоматики'],
    [/шкаф\s+управлен/,      'шкаф управления'],
    [/теплообменник/,         'теплообменник'],
    [/установк/,             'установка'],       // приточная установка, etc.
    [/вентилятор/,           'вентилятор'],
    [/клапан/,               'клапан'],
    [/насос/,                'насос'],
    [/кондиционер/,          'кондиционер'],
    [/калорифер/,            'калорифер'],
    [/фильтр/,              'фильтр'],
    [/воздуховод/,           'воздуховод'],
    [/глушител/,             'глушитель'],
    [/задвижк/,              'задвижка'],
    [/кабел/,                'кабель'],
    [/датчик/,               'датчик'],
    [/электроконвектор/,     'конвектор'],
    [/конвектор/,            'конвектор'],
    [/агрегат/,              'агрегат'],
    [/термостат/,            'термостат'],
    [/коллектор/,            'коллектор'],
    [/наружный\s+блок/,      'наружный блок'],
    [/внутренний\s+(?:кассетный\s+)?блок/, 'внутренний блок'],
    [/блок/,                 'блок'],
  ];
  for (const [pat, type] of typePatterns) {
    if (pat.test(s)) return type;
  }
  return null;
}

/**
 * Check if two equipment types are compatible for matching.
 * Returns true if types are the same or both are null (unknown).
 * Returns false if one is known and they conflict.
 */
function areEquipmentTypesCompatible(typeA: string | null, typeB: string | null): boolean {
  // If either is unknown, be conservative — don't reject, but don't boost either
  if (!typeA || !typeB) return true;
  // Exact match
  if (typeA === typeB) return true;
  // "наружный блок" and "внутренний блок" are DIFFERENT
  if ((typeA === 'наружный блок' && typeB === 'внутренний блок') ||
      (typeA === 'внутренний блок' && typeB === 'наружный блок')) return false;
  // "блок" is generic — compatible with наружный/внутренний блок
  if ((typeA === 'блок' && typeB.includes('блок')) ||
      (typeB === 'блок' && typeA.includes('блок'))) return true;
  // "модуль управления" and "шкаф автоматики"/"шкаф управления" are automation — NOT equipment
  const automationTypes = ['модуль управления', 'шкаф автоматики', 'шкаф управления'];
  const equipmentTypes = ['установка', 'вентилятор', 'клапан', 'насос', 'кондиционер',
    'калорифер', 'теплообменник', 'наружный блок', 'внутренний блок', 'блок',
    'узел регулирующий', 'узел обвязки', 'конвектор', 'агрегат'];
  if (automationTypes.includes(typeA) && equipmentTypes.includes(typeB)) return false;
  if (equipmentTypes.includes(typeA) && automationTypes.includes(typeB)) return false;
  // "вентилятор" and "установка" are DIFFERENT equipment — a fan is not a supply unit
  if ((typeA === 'вентилятор' && typeB === 'установка') ||
      (typeA === 'установка' && typeB === 'вентилятор')) return false;
  // "узел регулирующий" should not match "конвектор"
  if ((typeA === 'узел регулирующий' && typeB === 'конвектор') ||
      (typeA === 'конвектор' && typeB === 'узел регулирующий')) return false;
  // "кабель" should not match anything else
  if (typeA === 'кабель' || typeB === 'кабель') return typeA === typeB;
  // Different specific types — only match if same
  return typeA === typeB;
}

/**
 * Extract L= airflow value (e.g., "L= 8100" → 8100, "L=12000" → 12000).
 */
function extractAirflow(name: string): number | null {
  const m = name.match(/l\s*=\s*([\d\s]+)/i);
  if (!m) return null;
  return parseInt(m[1].replace(/\s/g, ''), 10) || null;
}

/**
 * Fuzzy match an LSR item name against an existing BudgetItem name.
 * Returns a match score: 0 = no match, higher = better match.
 *
 * Matching rules (in priority order):
 * 1. Exact match → 100
 * 2. L= airflow value match + compatible type → 90
 * 3. System designation + compatible equipment type → 85
 * 4. System designation match WITHOUT compatible type → 0 (reject!)
 * 5. Brand match + compatible equipment type → 70
 * 6. Prefix match → 60
 * 7. Common words match (3+) → 40-50
 */
function fuzzyMatchScore(lsrName: string, fmName: string): number {
  const a = lsrName.toLowerCase().replace(/\s+/g, ' ').trim();
  const b = fmName.toLowerCase().replace(/\s+/g, ' ').trim();

  // Exact match
  if (a === b) return 100;

  const typeA = extractEquipmentType(a);
  const typeB = extractEquipmentType(b);
  const typesCompatible = areEquipmentTypesCompatible(typeA, typeB);

  // L= airflow value match — very reliable identifier
  const airflowA = extractAirflow(a);
  const airflowB = extractAirflow(b);
  if (airflowA && airflowB && airflowA === airflowB && typesCompatible) return 90;

  // System designation match (П1.1, В2.1, К3, ВК1, ОВ2, etc.)
  // IMPORTANT: Only match if equipment types are compatible!
  const sysPattern = /\b([а-яА-Я]{1,3}\d+(?:\.\d+)?)\b/;
  const sysA = a.match(sysPattern)?.[1];
  const sysB = b.match(sysPattern)?.[1];
  if (sysA && sysB && sysA === sysB) {
    // System code matches — but MUST also have compatible equipment type
    if (typesCompatible && typeA && typeB) return 85;
    // If types are explicitly incompatible, REJECT the match entirely
    if (!typesCompatible) return 0;
    // One or both types unknown — allow with lower confidence
    return 50;
  }

  // Brand/model keyword match — but only if equipment types are compatible
  const brandPatterns = [
    /вероса/i, /\bвектор\b/i, /канал[- ]?пкв/i, /кром/i, /ктп/i,
    /daikin/i, /grundfos/i, /danfoss/i, /schneider/i, /abb/i,
    /siemens/i, /carrier/i, /systemair/i, /арктос/i, /лиссант/i,
  ];
  for (const bp of brandPatterns) {
    if (bp.test(a) && bp.test(b)) {
      if (!typesCompatible) return 0; // Same brand but different equipment type → reject
      return 70;
    }
  }

  // First 30 chars prefix match
  const prefixLen = 30;
  if (a.length >= prefixLen && b.length >= prefixLen && a.substring(0, prefixLen) === b.substring(0, prefixLen)) {
    return 60;
  }

  // Common words match (3+ shared meaningful words of 3+ chars)
  const wordsA = new Set(a.split(/[\s,;().\-–—/]+/).filter((w) => w.length >= 3));
  const wordsB = new Set(b.split(/[\s,;().\-–—/]+/).filter((w) => w.length >= 3));
  const common = [...wordsA].filter((w) => wordsB.has(w));
  if (common.length >= 3) {
    // Even for common-words match, reject if types are explicitly incompatible
    if (!typesCompatible) return 0;
    return 40 + Math.min(common.length, 10);
  }

  return 0;
}

/**
 * Check if a BudgetItem belongs to an automation discipline (АОВ).
 * Automation items (modules, controllers) are from АОВ specs and should be
 * deprioritized when matching physical equipment from estimates.
 */
function isAutomationItem(item: BudgetItem, allItems: BudgetItem[]): boolean {
  // Check item's own disciplineMark
  if (item.disciplineMark) {
    const mark = item.disciplineMark.toUpperCase();
    if (mark.startsWith('АОВ') || mark.startsWith('АВТ') || mark.startsWith('АСУ')) return true;
  }
  // Check parent section's disciplineMark
  if (item.parentId) {
    const parent = allItems.find((p) => p.id === item.parentId && p.section);
    if (parent?.disciplineMark) {
      const mark = parent.disciplineMark.toUpperCase();
      if (mark.startsWith('АОВ') || mark.startsWith('АВТ') || mark.startsWith('АСУ')) return true;
    }
  }
  // Check item name for automation keywords
  const name = item.name.toLowerCase();
  if (/модуль\s+управлен/.test(name) || /шкаф\s+автоматик/.test(name) || /шкаф\s+управлен/.test(name)) {
    return true;
  }
  return false;
}

/**
 * Find the best fuzzy match for an LSR name among existing FM items.
 * Returns the matched BudgetItem and score, or null if no good match.
 *
 * When multiple items have the same score, prefers items from equipment
 * disciplines (ОВ, ИТП, ВК, etc.) over automation disciplines (АОВ).
 */
function findBestFmMatch(
  lsrName: string,
  existingItems: BudgetItem[],
  threshold: number = 40,
  allItems?: BudgetItem[],
): { item: BudgetItem; score: number } | null {
  const all = allItems ?? existingItems;
  let bestItem: BudgetItem | null = null;
  let bestScore = 0;
  let bestIsAutomation = false;
  for (const item of existingItems) {
    if (item.section) continue;
    const score = fuzzyMatchScore(lsrName, item.name);
    if (score < threshold) continue;
    const itemIsAutomation = isAutomationItem(item, all);
    // Prefer higher score. On equal score, prefer non-automation (ОВ/ИТП) over automation (АОВ)
    if (score > bestScore || (score === bestScore && bestIsAutomation && !itemIsAutomation)) {
      bestScore = score;
      bestItem = item;
      bestIsAutomation = itemIsAutomation;
    }
  }
  return bestScore >= threshold && bestItem ? { item: bestItem, score: bestScore } : null;
}

/**
 * Parse ГРАНД-Смета Методика 2020 РИМ xlsx file.
 *
 * XLSX column layout:
 * - col0: Position number (1, 2О, 3, 3.1, Н)
 * - col1: Code/basis (ГЭСН..., ТЦ_..., ФСБЦ-...)
 * - col2: Name
 * - col7: Unit of measure
 * - col8: Quantity per unit
 * - col10: Total quantity
 * - col13: Unit price
 * - col15: Total price
 */
function parseLsrXlsx(file: File): Promise<LsrRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = (XLSX.utils.sheet_to_json(sheet, {
          header: 1, defval: '', raw: false,
        }) as unknown[][]).map((r) => r.map((c) => String(c ?? '').trim()));

        const items: LsrRow[] = [];
        let currentSection = '';

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const pos = cellVal(row, 0);
          const code = cellVal(row, 1);
          const name = cellVal(row, 2);

          // Section in col0 (ГРАНД-Смета puts "Раздел N. ..." in column A, col2 may be empty)
          if (pos && !code && /^раздел\s/i.test(pos)) {
            currentSection = pos;
            continue;
          }

          // Skip empty name rows
          if (!name || name.length < 3) continue;

          // Section header detection (col0 empty, col1 empty, col2 is ALL CAPS)
          if (isSectionHeader(pos, code, name)) {
            currentSection = name;
            continue;
          }
          // Alternative section detection: sometimes section is in col0/col2 with "Раздел" keyword
          if (!pos && !code && /^раздел\s/i.test(name)) {
            currentSection = name;
            continue;
          }

          // Skip summary/total rows
          const nameLower = name.toLowerCase();
          if (nameLower.startsWith('итого') || nameLower.startsWith('всего')) continue;
          if (nameLower.includes('накладные расходы') || nameLower.includes('сметная прибыль')) continue;

          // Detect position type
          const posType = detectPositionType(pos, code);
          if (!posType) continue;

          const unit = cellVal(row, 7) || cellVal(row, 3) || 'шт';
          const qtyPerUnit = parseGsNum(cellVal(row, 8));
          const qtyTotal = parseGsNum(cellVal(row, 10));
          const quantity = qtyTotal > 0 ? qtyTotal : (qtyPerUnit > 0 ? qtyPerUnit : 1);
          const unitPrice = parseGsNum(cellVal(row, 13));
          const totalPrice = parseGsNum(cellVal(row, 15));

          if (posType === 'WORK') {
            // For ГЭСН works: the price in the same row is often 0.
            // Real price is in the next "Всего по позиции" row.
            let workPrice = unitPrice;
            let workTotal = totalPrice;
            if (workPrice === 0 && workTotal === 0) {
              // Scan forward for "Всего по позиции"
              const vsegoPrice = findVsegoPoPozitiRow(rows, r, 100);
              if (vsegoPrice > 0) {
                workTotal = vsegoPrice;
                workPrice = quantity > 0 ? workTotal / quantity : workTotal;
              }
            }
            if (workPrice === 0 && workTotal === 0) continue; // skip if no price found

            // If we have total but no unit price, compute it
            if (workPrice === 0 && workTotal > 0 && quantity > 0) {
              workPrice = workTotal / quantity;
            }
            // If we have unit price but no total, compute it
            if (workTotal === 0 && workPrice > 0) {
              workTotal = workPrice * quantity;
            }

            items.push({
              name,
              unit,
              quantity,
              estimatePrice: workPrice,
              total: workTotal,
              type: 'WORK',
              code,
              section: currentSection,
            });
          } else {
            // EQUIPMENT or MATERIAL — price in col13, total in col15
            let itemPrice = unitPrice;
            let itemTotal = totalPrice;

            // For equipment, also check rows ahead for "Всего по позиции"
            if (posType === 'EQUIPMENT' && itemPrice === 0 && itemTotal === 0) {
              for (let look = r + 1; look < Math.min(r + 5, rows.length); look++) {
                const lookName = cellVal(rows[look], 2).toLowerCase();
                if (lookName.includes('всего по позиции')) {
                  itemTotal = parseGsNum(cellVal(rows[look], 13)) || parseGsNum(cellVal(rows[look], 15));
                  itemPrice = quantity > 0 ? itemTotal / quantity : itemTotal;
                  break;
                }
              }
            }

            if (itemPrice === 0 && itemTotal === 0) continue;

            if (itemPrice === 0 && itemTotal > 0 && quantity > 0) {
              itemPrice = itemTotal / quantity;
            }
            if (itemTotal === 0 && itemPrice > 0) {
              itemTotal = itemPrice * quantity;
            }

            items.push({
              name,
              unit,
              quantity,
              estimatePrice: itemPrice,
              total: itemTotal,
              type: posType,
              code,
              section: currentSection,
            });
          }
        }

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

type FmTab = 'ALL' | 'WORKS' | 'MATERIALS' | 'EQUIPMENT' | 'CVR' | 'SNAPSHOTS' | 'VE';
type ValidationMode = 'soft' | 'hard';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(v);

export default function FmPage() {
  const { id: budgetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FmTab>('ALL');
  const [compareSnapshotId, setCompareSnapshotId] = useState<string | null>(null);
  const [sectionsConfigOpen, setSectionsConfigOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [lsrImportOpen, setLsrImportOpen] = useState(false);
  const [lsrRows, setLsrRows] = useState<LsrRow[]>([]);
  const [lsrFile, setLsrFile] = useState<string>('');
  const [lsrDragOver, setLsrDragOver] = useState(false);
  const [lsrParseError, setLsrParseError] = useState<string | null>(null);
  const lsrInputRef = useRef<HTMLInputElement>(null);
  const [validationMode, setValidationMode] = useState<ValidationMode>(() => {
    try { return (localStorage.getItem('fm-validation-mode') as ValidationMode) || 'soft'; } catch { return 'soft'; }
  });
  // Scenario panel
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [targetMargin, setTargetMargin] = useState(15);
  const [scenario, setScenario] = useState<MarginScenario | null>(null);
  // КП creation
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const [cpName, setCpName] = useState('');
  const [importEstimateConfirm, setImportEstimateConfirm] = useState<string | null>(null);

  const handleLsrFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setLsrParseError(t('finance.fm.lsrWrongType'));
      return;
    }
    setLsrParseError(null);
    try {
      const rows = await parseLsrXlsx(file);
      if (rows.length === 0) { setLsrParseError(t('finance.fm.lsrNoRows')); return; }
      setLsrRows(rows);
      setLsrFile(file.name);
    } catch {
      setLsrParseError(t('finance.fm.lsrParseError'));
    }
  }, []);

  const toggleValidationMode = () => {
    const next: ValidationMode = validationMode === 'soft' ? 'hard' : 'soft';
    setValidationMode(next);
    try { localStorage.setItem('fm-validation-mode', next); } catch { /* noop */ }
  };

  const { data: budget } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => financeApi.getBudget(budgetId!),
    enabled: !!budgetId,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['budget-items', budgetId],
    queryFn: () => financeApi.getBudgetItems(budgetId!),
    enabled: !!budgetId,
  });

  const { data: roi } = useQuery({
    queryKey: ['budget-roi', budgetId],
    queryFn: () => financeApi.calculateROI(budgetId!),
    enabled: !!budgetId,
  });

  const handleSimulate = async () => {
    if (!budgetId) return;
    const res = await financeApi.simulateMarginScenario(budgetId, targetMargin);
    setScenario(res);
  };

  const generateOwnCostMutation = useMutation({
    mutationFn: () => financeApi.generateOwnCostLines(budgetId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      toast.success(t('finance.fm.ownCostSuccess'));
    },
    onError: () => toast.error(t('finance.fm.ownCostError')),
  });

  // Section items for AddBudgetItemModal
  const sectionItems = useMemo(() => items.filter((i: BudgetItem) => i.section), [items]);

  // КП creation mutation
  const createCpMutation = useMutation({
    mutationFn: (name: string) => financeApi.createCommercialProposal({ budgetId: budgetId!, name }),
    onSuccess: (cp) => {
      toast.success(t('finance.fm.createKpSuccess'));
      setCpModalOpen(false);
      setCpName('');
      navigate(`/commercial-proposals/${cp.id}`);
    },
    onError: () => toast.error(t('finance.fm.createKpError')),
  });

  // KPI calculations
  const kpis = useMemo(() => {
    const nonSection = items.filter((i: BudgetItem) => !i.section);
    const sum = (fn: (i: BudgetItem) => number) => nonSection.reduce((acc, i) => acc + fn(i), 0);
    const costTotal = sum((i) => (i.costPrice ?? 0) * (i.quantity ?? 1));
    const estimateTotal = sum((i) => (i.estimatePrice ?? 0) * (i.quantity ?? 1));
    const customerTotal = sum((i) => (i.customerPrice ?? 0) * (i.quantity ?? 1));
    const ndvTotal = customerTotal * 0.22;
    const marginTotal = customerTotal - costTotal;
    const marginPct = customerTotal > 0 ? (marginTotal / customerTotal) * 100 : 0;
    let overheadTotal = 0, profitTotal = 0, contingencyTotal = 0;
    for (const i of nonSection) {
      const cl = (i.costPrice ?? 0) * (i.quantity ?? 1);
      const oh = cl * ((i.overheadRate ?? 0) / 100);
      overheadTotal += oh;
      profitTotal += cl * ((i.profitRate ?? 0) / 100);
      contingencyTotal += (cl + oh) * ((i.contingencyRate ?? 0) / 100);
    }
    return { costTotal, estimateTotal, customerTotal, ndvTotal, marginTotal, marginPct, overheadTotal, profitTotal, contingencyTotal };
  }, [items]);

  const marginPctColor = kpis.marginPct < 0
    ? 'text-red-600'
    : kpis.marginPct < 5
      ? 'text-orange-500'
      : kpis.marginPct < 15
        ? 'text-yellow-600'
        : 'text-green-600';

  const tabs: { key: FmTab; label: string }[] = [
    { key: 'ALL', label: t('finance.fm.tabAll') },
    { key: 'WORKS', label: t('finance.fm.tabWorks') },
    { key: 'MATERIALS', label: t('finance.fm.tabMaterials') },
    { key: 'EQUIPMENT', label: t('finance.fm.tabEquipment') },
    { key: 'CVR', label: t('finance.fm.tabCvr') },
    { key: 'SNAPSHOTS', label: t('finance.fm.tabSnapshots') },
    { key: 'VE', label: t('finance.valueEngineering.tabTitle') },
  ];

  const tableBranch = tab === 'ALL' ? 'ALL' : tab === 'WORKS' ? 'WORKS' : tab === 'EQUIPMENT' ? 'EQUIPMENT' : 'MATERIALS';

  const exportRows = useMemo(
    () => items
      .filter((item) =>
        !item.section
        && (tab === 'ALL'
          || (tab === 'WORKS' && item.itemType === 'WORKS')
          || (tab === 'MATERIALS' && item.itemType === 'MATERIALS')
          || (tab === 'EQUIPMENT' && item.itemType === 'EQUIPMENT')),
      )
      .map((item) => ({
        name: item.name,
        unit: item.unit ?? '',
        quantity: item.quantity ?? 0,
        costPrice: item.costPrice ?? 0,
        estimatePrice: item.estimatePrice ?? 0,
        customerPrice: item.customerPrice ?? 0,
        plannedAmount: item.plannedAmount ?? 0,
        contractedAmount: item.contractedAmount ?? 0,
        actSignedAmount: item.actSignedAmount ?? 0,
        paidAmount: item.paidAmount ?? 0,
        marginPercent: item.marginPercent ?? 0,
        status: item.docStatus ?? '',
      })),
    [items, tab],
  );

  const { data: estimateResponse } = useQuery({
    queryKey: ['estimates', budget?.projectId],
    queryFn: () => estimatesApi.getEstimates({ projectId: budget!.projectId }),
    enabled: !!budget?.projectId,
  });
  const estimates = estimateResponse?.content ?? [];
  const importEstimateMutation = useMutation({
    mutationFn: (estimateId: string) => financeApi.importFromEstimate(budgetId!, estimateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      toast.success(t('finance.fm.toasts.estimateImported'));
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  // ─── ЛСР → ФМ import mutation (with fuzzy matching) ────────────────────────
  const importLsrMutation = useMutation({
    mutationFn: async (rows: LsrRow[]) => {
      const allBudgetItems = items as BudgetItem[];
      const existingItems = allBudgetItems.filter((i) => !i.section);
      const usedIds = new Set<string>(); // track already-matched FM items to avoid double-update

      let updated = 0;
      let created = 0;
      let skipped = 0;

      // Map LsrItemType → BudgetCategory
      const categoryMap: Record<LsrItemType, string> = {
        EQUIPMENT: 'EQUIPMENT',
        WORK: 'LABOR',
        MATERIAL: 'MATERIALS',
      };
      const itemTypeMap: Record<LsrItemType, string> = {
        EQUIPMENT: 'EQUIPMENT',
        WORK: 'WORKS',
        MATERIAL: 'MATERIALS',
      };

      for (const row of rows) {
        try {
          if (row.type === 'WORK') {
            // WORKS: always create new FM items with category LABOR
            await financeApi.createBudgetItem(budgetId!, {
              name: row.name,
              category: categoryMap[row.type],
              itemType: itemTypeMap[row.type],
              unit: row.unit,
              quantity: row.quantity,
              estimatePrice: row.estimatePrice,
              plannedAmount: row.total,
            });
            created++;
          } else {
            // EQUIPMENT / MATERIAL: try to match existing FM items
            const match = findBestFmMatch(row.name, existingItems.filter((i) => !usedIds.has(i.id)), 40, allBudgetItems);
            if (match) {
              // Update existing item's estimate price
              await financeApi.updateBudgetItem(budgetId!, match.item.id, {
                estimatePrice: row.estimatePrice,
                quantity: match.item.quantity ?? row.quantity,
              } as any);
              usedIds.add(match.item.id);
              updated++;
            } else {
              // No match — create new item
              await financeApi.createBudgetItem(budgetId!, {
                name: row.name,
                category: categoryMap[row.type],
                itemType: itemTypeMap[row.type],
                unit: row.unit,
                quantity: row.quantity,
                estimatePrice: row.estimatePrice,
                plannedAmount: row.total,
              });
              created++;
            }
          }
        } catch {
          skipped++;
        }
      }
      return { updated, created, skipped };
    },
    onSuccess: ({ updated, created, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      const msg = t('finance.fm.lsrImportSuccess', {
        updated: String(updated),
        created: String(created),
      }) + (skipped > 0 ? ` (${t('finance.fm.lsrSkipped', { count: String(skipped) })})` : '');
      toast.success(msg);
      setLsrImportOpen(false);
      setLsrRows([]);
      setLsrFile('');
    },
    onError: () => toast.error(t('finance.fm.lsrImportError')),
  });

  const handleExport = () => {
    if (exportRows.length === 0) return;
    const datePart = new Date().toISOString().slice(0, 10);
    const headers = Object.keys(exportRows[0]);
    const csv = [
      headers.map((h) => `"${h}"`).join(','),
      ...exportRows.map((row) =>
        headers.map((h) => `"${String((row as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fm_${budgetId}_${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!budgetId) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb & header */}
      <div className="px-6 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          <Link to="/budgets" className="hover:text-neutral-700 dark:hover:text-neutral-200">
            {t('finance.budgetDetail.breadcrumbFinance')}
          </Link>
          <span>/</span>
          <Link to="/budgets" className="hover:text-neutral-700 dark:hover:text-neutral-200">
            {t('finance.budgetDetail.breadcrumbBudgets')}
          </Link>
          <span>/</span>
          <Link to={`/budgets/${budgetId}`} className="hover:text-neutral-700 dark:hover:text-neutral-200">
            {budget?.name ?? '...'}
          </Link>
          <span>/</span>
          <span className="text-neutral-700 dark:text-neutral-200">{t('finance.fm.breadcrumbFm')}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('finance.fm.title')}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{budget?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Validation mode toggle */}
            <button
              onClick={toggleValidationMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded transition-colors ${
                validationMode === 'hard'
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
              title={t('finance.fm.validationMode')}
            >
              {validationMode === 'hard'
                ? <><ShieldAlert className="w-3.5 h-3.5" /> {t('finance.fm.validationHard')}</>
                : <><ShieldCheck className="w-3.5 h-3.5" /> {t('finance.fm.validationSoft')}</>
              }
            </button>

            {/* Создать КП из ФМ */}
            <button
              onClick={() => { setCpModalOpen(true); setCpName(budget?.name ? `КП — ${budget.name}` : 'Коммерческое предложение'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded transition-colors"
              title={t('finance.fm.createKpHint')}
            >
              <FileSignature className="w-3.5 h-3.5" />
              {t('finance.fm.createKp')}
            </button>

            {/* Own cost generation */}
            <button
              onClick={() => generateOwnCostMutation.mutate()}
              disabled={generateOwnCostMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded transition-colors disabled:opacity-50"
              title={t('finance.fm.ownCostHint')}
            >
              <Wallet className="w-3.5 h-3.5" />
              {t('finance.fm.ownCost')}
            </button>

            {/* Scenario panel toggle */}
            <button
              onClick={() => setScenarioOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded transition-colors ${
                scenarioOpen
                  ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
              title={t('finance.fm.scenario.title')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('finance.fm.scenarioBtn')}
            </button>

            {/* Import ЛСР xlsx */}
            <button
              onClick={() => { setLsrImportOpen(true); setLsrRows([]); setLsrFile(''); setLsrParseError(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded transition-colors"
              title={t('finance.fm.importLsrHint')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {t('finance.fm.importLsr')}
            </button>

            {/* Add item */}
            <button
              onClick={() => setAddItemOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('finance.fm.addItem')}
            </button>

            {estimates.length > 0 && (
              <select
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setImportEstimateConfirm(e.target.value);
                  }
                }}
              >
                <option value="" disabled>{t('finance.fm.importEstimate')}...</option>
                {estimates.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            )}
            <button
              onClick={() => setSectionsConfigOpen(true)}
              disabled={!budget?.projectId}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="w-3.5 h-3.5" />
              {t('finance.fm.manageSections')}
            </button>
            <button
              onClick={() => setTab('SNAPSHOTS')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Camera className="w-3.5 h-3.5" />
              {t('finance.fm.createSnapshot')}
            </button>
            <button
              onClick={handleExport}
              disabled={exportRows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              {t('finance.fm.exportFm')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 py-3 flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-wrap">
        <KpiCard label={t('finance.fm.kpiCostPrice')} value={fmtCurrency(kpis.costTotal)} />
        <KpiCard label={t('finance.fm.kpiEstimatePrice')} value={fmtCurrency(kpis.estimateTotal)} />
        <KpiCard label={t('finance.fm.kpiCustomerPrice')} value={fmtCurrency(kpis.customerTotal)} />
        <KpiCard label={t('finance.fm.kpiOverhead')} value={fmtCurrency(kpis.overheadTotal)} valueClass="text-orange-600 dark:text-orange-400" />
        <KpiCard label={t('finance.fm.kpiProfit')} value={fmtCurrency(kpis.profitTotal)} valueClass="text-teal-600 dark:text-teal-400" />
        <KpiCard label={t('finance.fm.kpiContingency')} value={fmtCurrency(kpis.contingencyTotal)} valueClass="text-amber-600 dark:text-amber-400" />
        <KpiCard label={t('finance.fm.kpiNdv')} value={fmtCurrency(kpis.ndvTotal)} valueClass="text-violet-600 dark:text-violet-400" />
        <KpiCard label={t('finance.fm.kpiMargin')} value={fmtCurrency(kpis.marginTotal)} valueClass={marginPctColor} />
        <KpiCard
          label={t('finance.fm.kpiMarginPercent')}
          value={`${kpis.marginPct.toFixed(1)}%`}
          valueClass={marginPctColor}
        />
        <KpiCard
          label={t('finance.fm.kpiRoi')}
          value={roi ? `${roi.roi.toFixed(1)}%` : '\u2014'}
          valueClass={roi && roi.roi > 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Scenario panel */}
      {scenarioOpen && (
        <div className="mx-6 mt-3 border rounded-lg p-4 mb-0 bg-neutral-50 dark:bg-neutral-800">
          <h3 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{t('finance.fm.scenario.title')}</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">{t('finance.fm.scenario.targetMargin')}</label>
            <input type="range" min={0} max={40} step={1} value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} className="w-48" />
            <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">{targetMargin}%</span>
            <button onClick={handleSimulate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">{t('finance.fm.scenario.simulate')}</button>
          </div>
          {scenario && (
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-neutral-500 dark:text-neutral-400">{t('finance.fm.scenario.currentRevenue')}</span><br/><span className="font-mono text-neutral-900 dark:text-neutral-100">{fmtCurrency(scenario.currentRevenue)}</span></div>
              <div><span className="text-neutral-500 dark:text-neutral-400">{t('finance.fm.scenario.targetRevenue')}</span><br/><span className="font-mono text-neutral-900 dark:text-neutral-100">{fmtCurrency(scenario.targetRevenue)}</span></div>
              <div><span className="text-neutral-500 dark:text-neutral-400">{t('finance.fm.scenario.revenueDelta')}</span><br/><span className={`font-mono ${scenario.revenueDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtCurrency(scenario.revenueDelta)}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-0">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => { setTab(tabItem.key); setCompareSnapshotId(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tabItem.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {tab === 'SNAPSHOTS' ? (
          compareSnapshotId ? (
            <div className="flex-1">
              <SnapshotCompareTable
                budgetId={budgetId}
                snapshotId={compareSnapshotId}
                onBack={() => setCompareSnapshotId(null)}
              />
            </div>
          ) : (
            <div className="flex-1 flex">
              <div className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                {t('finance.fm.snapshot.noSnapshotsDesc')}
              </div>
              <SnapshotPanel budgetId={budgetId} onCompare={setCompareSnapshotId} />
            </div>
          )
        ) : tab === 'CVR' ? (
          <div className="flex-1 overflow-auto">
            <CvrView items={items} />
          </div>
        ) : tab === 'VE' ? (
          <div className="flex-1 overflow-auto">
            <ValueEngineeringPanel projectId={budget?.projectId ?? ''} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center text-neutral-500 animate-pulse">{t('common.loading')}</div>
            ) : (
              <>
                {items.length > 0 && (
                  <div className="px-4 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
                    {(() => {
                      const posCount = items.filter((i: BudgetItem) => !i.section).length;
                      const secCount = items.filter((i: BudgetItem) => i.section).length;
                      return secCount > 0
                        ? `${posCount} позиций в ${secCount} разделах`
                        : `${posCount} позиций`;
                    })()}
                  </div>
                )}
                <FmItemsTable
                  budgetId={budgetId}
                  items={items}
                  branch={tableBranch}
                  validationMode={validationMode}
                />
              </>
            )}
          </div>
        )}
      </div>

      {budget?.projectId && (
        <BudgetSectionConfig
          projectId={budget.projectId}
          open={sectionsConfigOpen}
          onClose={() => setSectionsConfigOpen(false)}
        />
      )}

      {addItemOpen && (
        <React.Suspense fallback={null}>
          <AddBudgetItemModal
            budgetId={budgetId}
            sections={sectionItems}
            open={addItemOpen}
            onClose={() => setAddItemOpen(false)}
          />
        </React.Suspense>
      )}

      {/* ─── ЛСР Import Modal ─────────────────────────────────────────────── */}
      {lsrImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('finance.fm.lsrImportTitle')}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('finance.fm.lsrImportSubtitle')}
                </p>
              </div>
              <button
                onClick={() => setLsrImportOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {/* Drop zone */}
              <input
                ref={lsrInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLsrFile(f); e.target.value = ''; }}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setLsrDragOver(true); }}
                onDragLeave={() => setLsrDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setLsrDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleLsrFile(f); }}
                onClick={() => lsrInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  lsrDragOver
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-neutral-300 dark:border-neutral-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                {lsrFile
                  ? <p className="text-sm font-medium text-green-700 dark:text-green-400">{lsrFile} — {lsrRows.length} поз.</p>
                  : <>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('finance.fm.lsrDropHint')}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{t('finance.fm.lsrDropFormats')}</p>
                  </>
                }
              </div>

              {/* Parse error */}
              {lsrParseError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {lsrParseError}
                </div>
              )}

              {/* Info banner */}
              {lsrRows.length === 0 && !lsrParseError && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">{t('finance.fm.lsrInfoTitle')}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-600 dark:text-blue-400">
                    <li>{t('finance.fm.lsrInfo1')}</li>
                    <li>{t('finance.fm.lsrInfo2')}</li>
                    <li>{t('finance.fm.lsrInfo3')}</li>
                    <li>{t('finance.fm.lsrInfo4')}</li>
                    <li>{t('finance.fm.lsrInfo5')}</li>
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {lsrRows.length > 0 && (() => {
                // Pre-compute stats and matches
                const allBudgetItemsPreview = items as BudgetItem[];
                const nonSectionItems = allBudgetItemsPreview.filter((i) => !i.section);
                const matchResults = lsrRows.map((row) => {
                  if (row.type === 'WORK') return { action: 'create' as const, match: null };
                  const m = findBestFmMatch(row.name, nonSectionItems, 40, allBudgetItemsPreview);
                  return m ? { action: 'update' as const, match: m } : { action: 'create' as const, match: null };
                });
                const updateCount = matchResults.filter((m) => m.action === 'update').length;
                const createCount = matchResults.filter((m) => m.action === 'create').length;
                const workCount = lsrRows.filter((r) => r.type === 'WORK').length;
                const equipCount = lsrRows.filter((r) => r.type === 'EQUIPMENT').length;
                const matCount = lsrRows.filter((r) => r.type === 'MATERIAL').length;

                const typeBadge = (type: LsrItemType) => {
                  const cls = type === 'WORK'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : type === 'EQUIPMENT'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400';
                  const label = type === 'WORK' ? t('finance.fm.lsrTypeWork') : type === 'EQUIPMENT' ? t('finance.fm.lsrTypeEquipment') : t('finance.fm.lsrTypeMaterial');
                  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>{label}</span>;
                };

                return (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {t('finance.fm.lsrPreview', { count: String(lsrRows.length) })}
                    </p>
                    {/* Stats strip */}
                    <div className="flex items-center gap-3 mb-2 text-[11px]">
                      <span className="text-blue-600 dark:text-blue-400">{t('finance.fm.lsrStatsWorks')}: {workCount}</span>
                      <span className="text-amber-600 dark:text-amber-400">{t('finance.fm.lsrStatsEquip')}: {equipCount}</span>
                      <span className="text-teal-600 dark:text-teal-400">{t('finance.fm.lsrStatsMat')}: {matCount}</span>
                      <span className="text-neutral-400 dark:text-neutral-500">|</span>
                      <span className="text-green-600 dark:text-green-400">{t('finance.fm.lsrStatsUpdate')}: {updateCount}</span>
                      <span className="text-violet-600 dark:text-violet-400">{t('finance.fm.lsrStatsCreate')}: {createCount}</span>
                    </div>
                    <div className="overflow-auto max-h-72 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 z-10">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium text-neutral-500 dark:text-neutral-400 w-16">{t('finance.fm.lsrColType')}</th>
                            <th className="px-2 py-2 text-left font-medium text-neutral-500 dark:text-neutral-400 w-24">{t('finance.fm.lsrColCode')}</th>
                            <th className="px-2 py-2 text-left font-medium text-neutral-500 dark:text-neutral-400">{t('finance.fm.lsrColName')}</th>
                            <th className="px-2 py-2 text-center font-medium text-neutral-500 dark:text-neutral-400 w-14">{t('finance.fm.lsrColUnit')}</th>
                            <th className="px-2 py-2 text-right font-medium text-neutral-500 dark:text-neutral-400 w-16">{t('finance.fm.lsrColQty')}</th>
                            <th className="px-2 py-2 text-right font-medium text-neutral-500 dark:text-neutral-400 w-24">{t('finance.fm.lsrColPrice')}</th>
                            <th className="px-2 py-2 text-right font-medium text-neutral-500 dark:text-neutral-400 w-24">{t('finance.fm.lsrColTotal')}</th>
                            <th className="px-2 py-2 text-center font-medium text-neutral-500 dark:text-neutral-400 w-20">{t('finance.fm.lsrColAction')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            let lastSection = '';
                            return lsrRows.map((row, i) => {
                              const mr = matchResults[i];
                              const sectionChanged = row.section && row.section !== lastSection;
                              if (sectionChanged) lastSection = row.section;
                              const isUpdate = mr.action === 'update';

                              return (
                                <React.Fragment key={i}>
                                  {sectionChanged && (
                                    <tr className="bg-neutral-100 dark:bg-neutral-800/70">
                                      <td colSpan={8} className="px-3 py-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                                        {row.section}
                                      </td>
                                    </tr>
                                  )}
                                  <tr className={`border-t border-neutral-100 dark:border-neutral-800 ${isUpdate ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                                    <td className="px-2 py-1.5">{typeBadge(row.type)}</td>
                                    <td className="px-2 py-1.5 text-neutral-400 dark:text-neutral-500 font-mono truncate max-w-[120px]" title={row.code}>{row.code}</td>
                                    <td className="px-2 py-1.5 text-neutral-800 dark:text-neutral-200">
                                      <span className="line-clamp-2">{row.name}</span>
                                      {isUpdate && mr.match && (
                                        <span className="ml-1.5 text-[10px] text-green-600 dark:text-green-400 font-medium">
                                          {t('finance.fm.lsrMatchUpdate')} ({mr.match.score}%)
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-2 py-1.5 text-center text-neutral-500">{row.unit}</td>
                                    <td className="px-2 py-1.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                      {new Intl.NumberFormat('ru-RU').format(row.quantity)}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums text-blue-700 dark:text-blue-400 font-medium">
                                      {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(row.estimatePrice)}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                      {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(row.total)}
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      {isUpdate ? (
                                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">{t('finance.fm.lsrActionUpdate')}</span>
                                      ) : (
                                        <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">{t('finance.fm.lsrActionCreate')}</span>
                                      )}
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            });
                          })()}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 z-10">
                          <tr>
                            <td className="px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100" colSpan={6}>
                              {t('finance.fm.lsrTotalLabel')}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                              {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
                                lsrRows.reduce((s, r) => s + r.total, 0),
                              )}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setLsrImportOpen(false)}
                className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => importLsrMutation.mutate(lsrRows)}
                disabled={lsrRows.length === 0 || importLsrMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {importLsrMutation.isPending
                  ? t('common.saving')
                  : t('finance.fm.lsrImportBtn', { count: String(lsrRows.length) })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Import Estimate Modal ────────────────────────────────── */}
      <Modal
        open={!!importEstimateConfirm}
        onClose={() => setImportEstimateConfirm(null)}
        title={t('finance.fm.importEstimateTitle', { defaultValue: 'Импорт из сметы' })}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setImportEstimateConfirm(null)}
              className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => {
                if (importEstimateConfirm) {
                  importEstimateMutation.mutate(importEstimateConfirm);
                }
                setImportEstimateConfirm(null);
              }}
              disabled={importEstimateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importEstimateMutation.isPending ? t('common.saving') : t('finance.fm.importEstimateBtn', { defaultValue: 'Импортировать' })}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t('finance.fm.confirmImportEstimateDesc', { defaultValue: 'Позиции из выбранной сметы будут добавлены в финансовую модель. Сметные цены станут основой для столбца «Сметная стоимость».' })}
        </p>
        <p className="mt-3 text-xs text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 rounded-lg px-3 py-2">
          {t('finance.fm.confirmImportEstimateWarning', { defaultValue: '⚠ Если позиции уже были импортированы ранее, могут возникнуть дубликаты. Проверьте текущие позиции перед импортом.' })}
        </p>
      </Modal>

      {/* ─── Create КП modal ───────────────────────────────────────────────── */}
      {cpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('finance.fm.createKpTitle')}
              </h2>
              <button onClick={() => setCpModalOpen(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('finance.fm.createKpDesc')}</p>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('finance.fm.createKpNameLabel')}
                </label>
                <input
                  type="text"
                  value={cpName}
                  onChange={(e) => setCpName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && cpName.trim()) createCpMutation.mutate(cpName.trim()); }}
                  placeholder={t('finance.fm.createKpNamePlaceholder')}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setCpModalOpen(false)}
                className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => { if (cpName.trim()) createCpMutation.mutate(cpName.trim()); }}
                disabled={!cpName.trim() || createCpMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                <FileSignature className="w-4 h-4" />
                {createCpMutation.isPending ? t('common.saving') : t('finance.fm.createKpBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass = 'text-neutral-900 dark:text-neutral-100',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
