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

// ─── ЛСР xlsx parser ─────────────────────────────────────────────────────────

interface LsrRow {
  name: string;
  unit: string;
  quantity: number;
  estimatePrice: number; // цена за единицу из ЛСР
  total: number;         // quantity × estimatePrice
}

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

        // ── Ищем строку с заголовками ──
        let hRow = -1;
        let nameCol = -1, unitCol = -1, qtyCol = -1, priceCol = -1, totalCol = -1;

        for (let r = 0; r < Math.min(rows.length, 30); r++) {
          const row = rows[r].map((c) => c.toLowerCase());
          const ni = row.findIndex((c) =>
            c.includes('наименован') || c.includes('название') || c === 'name',
          );
          if (ni < 0) continue;

          hRow = r; nameCol = ni;
          unitCol = row.findIndex((c) => (c.includes('ед') && c.includes('изм')) || c === 'unit');
          qtyCol  = row.findIndex((c) => c.includes('кол') || c === 'qty' || c.includes('количеств'));

          // Цена — ищем "цена" или "стоимость ед" но НЕ "сумма"
          priceCol = row.findIndex((c) =>
            (c.includes('цена') || c.includes('расценк') || (c.includes('стоимость') && !c.includes('сумм')))
            && !c.includes('сумм') && !c.includes('итог'),
          );
          // Сумма — последний столбец с "сумм" или "итог"
          totalCol = row.findLastIndex((c) => c.includes('сумм') || c.includes('итог'));
          break;
        }

        // Fallback: стандартный порядок ГРАНД-Сметы
        // №|Шифр|Наименование|Ед.изм.|Кол-во|ЦенаЕд|Сумма
        if (hRow < 0 || nameCol < 0) {
          hRow = 0;
          nameCol = 2; unitCol = 3; qtyCol = 4; priceCol = 5; totalCol = 6;
        }

        const col = (row: string[], idx: number) => (idx >= 0 ? row[idx] ?? '' : '');
        const parseNum = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;

        const items: LsrRow[] = [];
        for (let r = hRow + 1; r < rows.length; r++) {
          const row = rows[r];
          const rawName = col(row, nameCol);
          if (!rawName || rawName.length < 3) continue;
          // Пропускаем строки-заголовки разделов (все заглавные без цифр)
          if (/^[А-ЯA-Z\s\-–—.,:;!?()]+$/.test(rawName) && rawName.length > 40) continue;

          const qty   = parseNum(col(row, qtyCol)) || 1;
          const price = parseNum(col(row, priceCol));
          const sum   = parseNum(col(row, totalCol));
          // Если нет колонки цены, вычисляем из суммы ÷ qty
          const estimatePrice = price > 0 ? price : (sum > 0 && qty > 0 ? sum / qty : 0);
          if (estimatePrice === 0) continue; // пропускаем пустые строки

          items.push({
            name: rawName,
            unit: col(row, unitCol) || 'шт',
            quantity: qty,
            estimatePrice,
            total: estimatePrice * qty,
          });
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

  // ─── ЛСР → ФМ import mutation ──────────────────────────────────────────────
  const importLsrMutation = useMutation({
    mutationFn: async (rows: LsrRow[]) => {
      // Текущие позиции ФМ для матчинга по наименованию
      const existingItems = items as BudgetItem[];
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
      const existingMap = new Map(existingItems.map((i) => [normalize(i.name), i]));

      let updated = 0; let created = 0;
      for (const row of rows) {
        const key = normalize(row.name);
        const existing = existingMap.get(key);
        if (existing) {
          // Обновляем estimatePrice у существующей позиции ФМ
          await financeApi.updateBudgetItem(budgetId!, existing.id, {
            estimatePrice: row.estimatePrice,
            quantity: existing.quantity ?? row.quantity,
          } as any);
          updated++;
        } else {
          // Создаём новую позицию с estimatePrice
          await financeApi.createBudgetItem(budgetId!, {
            name: row.name,
            category: 'WORKS',
            unit: row.unit,
            quantity: row.quantity,
            estimatePrice: row.estimatePrice,
          });
          created++;
        }
      }
      return { updated, created };
    },
    onSuccess: ({ updated, created }) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      toast.success(t('finance.fm.lsrImportSuccess', {
        updated: String(updated), created: String(created),
      }));
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
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
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
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {lsrRows.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                    {t('finance.fm.lsrPreview', { count: String(lsrRows.length) })}
                  </p>
                  <div className="overflow-auto max-h-64 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-neutral-500 dark:text-neutral-400">{t('finance.fm.lsrColName')}</th>
                          <th className="px-3 py-2 text-center font-medium text-neutral-500 dark:text-neutral-400 w-16">{t('finance.fm.lsrColUnit')}</th>
                          <th className="px-3 py-2 text-right font-medium text-neutral-500 dark:text-neutral-400 w-20">{t('finance.fm.lsrColQty')}</th>
                          <th className="px-3 py-2 text-right font-medium text-neutral-500 dark:text-neutral-400 w-28">{t('finance.fm.lsrColPrice')}</th>
                          <th className="px-3 py-2 text-right font-medium text-neutral-500 dark:text-neutral-400 w-28">{t('finance.fm.lsrColTotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lsrRows.map((row, i) => {
                          const existingMatch = (items as BudgetItem[]).some(
                            (bi) => bi.name.toLowerCase().trim() === row.name.toLowerCase().trim(),
                          );
                          return (
                            <tr key={i} className={`border-t border-neutral-100 dark:border-neutral-800 ${existingMatch ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                              <td className="px-3 py-1.5 text-neutral-800 dark:text-neutral-200">
                                {row.name}
                                {existingMatch && (
                                  <span className="ml-1.5 text-[10px] text-green-600 dark:text-green-400 font-medium">↻ обновит цену</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-center text-neutral-500">{row.unit}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                {new Intl.NumberFormat('ru-RU').format(row.quantity)}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-blue-700 dark:text-blue-400 font-medium">
                                {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(row.estimatePrice)}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(row.total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="sticky bottom-0 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                        <tr>
                          <td className="px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100" colSpan={4}>
                            {t('finance.fm.lsrTotalLabel')}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                            {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
                              lsrRows.reduce((s, r) => s + r.total, 0),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
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
