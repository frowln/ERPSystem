import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Download,
  ShieldCheck,
  Calendar,
  PenLine,
  FileText,
  ClipboardList,
  GitBranch,
  Boxes,
  Crosshair,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import {
  validateItdDocument,
  getValidationSummary,
  type ItdDocumentData,
  type RuleCategory,
  type RuleSeverity,
  type ValidationResultEntry,
} from './validation/itdRules';

// ---------------------------------------------------------------------------
// Demo / mock data — a sample AOSR with intentional errors for demonstration
// ---------------------------------------------------------------------------
const DEMO_DATA: ItdDocumentData = {
  projectStartDate: '2025-03-01',
  projectEndDate: '2026-12-31',
  aosr: {
    number: '15',
    date: '2025-11-20',
    workName: 'Устройство монолитных железобетонных стен подвала в осях 1-5/А-Г',
    startDate: '2025-11-10',
    endDate: '2025-11-18',
    materialCertificates: ['Серт. №1842-Ц от 05.11.2025', 'Серт. №А-2210 от 01.11.2025'],
    labTests: ['Протокол прочности бетона В25 №ЛИ-445'],
    drawings: ['0125-КР.04'],
    signatories: [
      { name: 'Петров А.С.', role: 'Представитель заказчика', signed: true },
      { name: 'Сидоров К.В.', role: 'Представитель подрядчика', signed: true },
      { name: '', role: 'Представитель проектировщика', signed: false },
    ],
    geodesyReference: 'ИСх №15 от 19.11.2025',
    previousAosrNumber: '14',
    nextWorkStage: 'Устройство перекрытия над подвалом',
    workVolume: 128.5,
    workMethod: 'Монолитное бетонирование в инвентарную опалубку',
    qualityConclusion: 'Работы выполнены в соответствии с проектной документацией и нормативными требованиями',
    weatherConditions: '',
    equipmentUsed: ['Автобетононасос Putzmeister BSF 36', 'Вибратор ИВ-116'],
    snipReference: 'СП 70.13330.2012',
    buildingPermitNumber: 'RU77-123456-2025',
    photos: [],
  },
  executiveScheme: {
    number: 'ИСх-15',
    date: '2025-11-19',
    deviations: [
      { value: 3, allowable: 5 },
      { value: -4, allowable: 5 },
      { value: 7, allowable: 5 },
    ],
    geodesyMarks: [
      { planned: -3.300, actual: -3.304 },
      { planned: -3.300, actual: -3.298 },
      { planned: 0.000, actual: -0.015 },
    ],
    referencePoint: 'Репер №7 (отм. +150.320 БС)',
  },
  materialCertificate: {
    date: '2025-11-05',
    expiryDate: '2026-05-05',
    brand: 'Евроцемент',
    grade: 'ПЦ-500',
    batchNumber: 'П-2025/1842',
    specificationBrand: 'Евроцемент',
    specificationGrade: 'ПЦ-500',
  },
  previousDocuments: [
    { type: 'aosr', number: '12', date: '2025-10-15', workType: 'Устройство фундаментной плиты' },
    { type: 'aosr', number: '13', date: '2025-10-28', workType: 'Гидроизоляция фундамента' },
    { type: 'aosr', number: '14', date: '2025-11-05', workType: 'Армирование стен подвала' },
  ],
};

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'errors' | 'warnings' | 'passed';

const CATEGORY_ORDER: RuleCategory[] = [
  'dates',
  'signatures',
  'references',
  'completeness',
  'sequence',
  'materials',
  'geodesy',
];

const CATEGORY_ICONS: Record<RuleCategory, React.ElementType> = {
  dates: Calendar,
  signatures: PenLine,
  references: FileText,
  completeness: ClipboardList,
  sequence: GitBranch,
  materials: Boxes,
  geodesy: Crosshair,
};

function severityIcon(severity: RuleSeverity, passed: boolean) {
  if (passed) return <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />;
  switch (severity) {
    case 'error':
      return <XCircle size={18} className="text-red-500 flex-shrink-0" />;
    case 'warning':
      return <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
    case 'info':
      return <Info size={18} className="text-blue-500 flex-shrink-0" />;
  }
}

function downloadReport(results: ValidationResultEntry[]) {
  const summary = getValidationSummary(results);
  const lines: string[] = [
    '=== ОТЧЁТ ПРОВЕРКИ ИСПОЛНИТЕЛЬНОЙ ДОКУМЕНТАЦИИ ===',
    `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`,
    '',
    `Всего проверок: ${summary.total}`,
    `Пройдено: ${summary.passed}`,
    `Ошибок: ${summary.errors}`,
    `Предупреждений: ${summary.warnings}`,
    `Информация: ${summary.infos}`,
    '',
    '--- ДЕТАЛИ ---',
    '',
  ];

  for (const cat of CATEGORY_ORDER) {
    const catResults = results.filter((r) => r.rule.category === cat);
    if (!catResults.length) continue;
    lines.push(`[${cat.toUpperCase()}]`);
    for (const { rule, result } of catResults) {
      const status = result.passed ? 'OK' : rule.severity.toUpperCase();
      lines.push(`  [${status}] ${rule.id}: ${rule.name}`);
      if (!result.passed && result.message) {
        lines.push(`         ${result.message}`);
      }
      if (result.details) {
        lines.push(`         ${result.details}`);
      }
    }
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `itd-validation-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ItdValidationPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER),
  );

  const results = useMemo(() => validateItdDocument(DEMO_DATA), []);
  const summary = useMemo(() => getValidationSummary(results), [results]);
  const percent = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;

  // Filter
  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'errors':
        return results.filter((r) => !r.result.passed && r.rule.severity === 'error');
      case 'warnings':
        return results.filter(
          (r) => !r.result.passed && (r.rule.severity === 'warning' || r.rule.severity === 'info'),
        );
      case 'passed':
        return results.filter((r) => r.result.passed);
      default:
        return results;
    }
  }, [results, activeFilter]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<RuleCategory, ValidationResultEntry[]>();
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter((r) => r.rule.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filtered]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: t('itdValidation.filterAll'), count: results.length },
    { id: 'errors', label: t('itdValidation.filterErrors'), count: summary.errors },
    { id: 'warnings', label: t('itdValidation.filterWarnings'), count: summary.warnings + summary.infos },
    { id: 'passed', label: t('itdValidation.filterPassed'), count: summary.passed },
  ];

  return (
    <div>
      <PageHeader
        title={t('itdValidation.title')}
        subtitle={t('itdValidation.subtitle')}
        breadcrumbs={[
          { label: t('pto.breadcrumbHome'), href: '/' },
          { label: t('pto.breadcrumbPto'), href: '/pto/documents' },
          { label: t('itdValidation.title') },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadReport(results)}
          >
            <Download size={16} className="mr-1.5" />
            {t('itdValidation.downloadReport')}
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<XCircle size={20} className="text-red-500" />}
          label={t('itdValidation.errors')}
          value={summary.errors}
          className={summary.errors > 0 ? 'border-red-200 dark:border-red-800' : ''}
        />
        <MetricCard
          icon={<AlertTriangle size={20} className="text-amber-500" />}
          label={t('itdValidation.warnings')}
          value={summary.warnings + summary.infos}
          className={summary.warnings > 0 ? 'border-amber-200 dark:border-amber-800' : ''}
        />
        <MetricCard
          icon={<CheckCircle2 size={20} className="text-emerald-500" />}
          label={t('itdValidation.passed')}
          value={summary.passed}
          className="border-emerald-200 dark:border-emerald-800"
        />
        <MetricCard
          icon={<ShieldCheck size={20} className="text-primary-500" />}
          label={t('itdValidation.total')}
          value={summary.total}
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('itdValidation.progressLabel', {
              passed: String(summary.passed),
              total: String(summary.total),
              percent: String(percent),
            })}
          </span>
          <span
            className={cn(
              'text-sm font-semibold',
              percent >= 90
                ? 'text-emerald-600'
                : percent >= 70
                  ? 'text-amber-600'
                  : 'text-red-600',
            )}
          >
            {percent}%
          </span>
        </div>
        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percent >= 90
                ? 'bg-emerald-500'
                : percent >= 70
                  ? 'bg-amber-500'
                  : 'bg-red-500',
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              activeFilter === tab.id
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Rules grouped by category */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat);
          if (!items) return null;
          const isExpanded = expandedCategories.has(cat);
          const CatIcon = CATEGORY_ICONS[cat];
          const catErrors = items.filter(
            (r) => !r.result.passed && r.rule.severity === 'error',
          ).length;
          const catWarnings = items.filter(
            (r) => !r.result.passed && (r.rule.severity === 'warning' || r.rule.severity === 'info'),
          ).length;
          const catPassed = items.filter((r) => r.result.passed).length;

          return (
            <div
              key={cat}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-neutral-400" />
                  ) : (
                    <ChevronRight size={16} className="text-neutral-400" />
                  )}
                  <CatIcon size={18} className="text-primary-500" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {t(`itdValidation.categories.${cat}`)}
                  </span>
                  <span className="text-xs text-neutral-400 ml-1">({items.length})</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {catErrors > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle size={14} /> {catErrors}
                    </span>
                  )}
                  {catWarnings > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle size={14} /> {catWarnings}
                    </span>
                  )}
                  {catPassed > 0 && (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 size={14} /> {catPassed}
                    </span>
                  )}
                </div>
              </button>

              {/* Rules list */}
              {isExpanded && (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {items.map(({ rule, result }) => (
                    <div
                      key={rule.id}
                      className={cn(
                        'px-4 py-3 flex items-start gap-3',
                        !result.passed && rule.severity === 'error'
                          ? 'bg-red-50/50 dark:bg-red-950/20'
                          : !result.passed && rule.severity === 'warning'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : '',
                      )}
                    >
                      <div className="mt-0.5">{severityIcon(rule.severity, result.passed)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-neutral-400">{rule.id}</span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {rule.name}
                          </span>
                        </div>
                        {!result.passed && result.message && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {result.message}
                          </p>
                        )}
                        {result.details && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
                            {result.details}
                          </p>
                        )}
                        {result.affectedField && !result.passed && (
                          <span className="inline-block mt-1 text-xs font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            {result.affectedField}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {grouped.size === 0 && (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            {t('itdValidation.noResults')}
          </div>
        )}
      </div>
    </div>
  );
}
