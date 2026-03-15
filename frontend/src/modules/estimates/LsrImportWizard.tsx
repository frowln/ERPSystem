import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  Settings2,
  Columns3,
  ArrowLeft,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { parseFullLsrFile, type LsrParseResult, type LsrParsedNode, type LsrParsedSummary, type LsrColumnMapping } from '@/lib/parseFullLsr';
import { estimatesApi, type ImportLsrRequest, type ImportLsrResult, type ImportLsrLine } from '@/api/estimates';
import { financeApi } from '@/api/finance';
import { projectsApi } from '@/api/projects';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep = 'upload' | 'mapping' | 'preview' | 'options' | 'import';

const STEPS: WizardStep[] = ['upload', 'mapping', 'preview', 'options', 'import'];

const STEP_LABELS: Record<WizardStep, string> = {
  upload: 'estimates.lsrWizard.stepUpload',
  mapping: 'estimates.lsrWizard.stepMapping',
  preview: 'estimates.lsrWizard.stepPreview',
  options: 'estimates.lsrWizard.stepOptions',
  import: 'estimates.lsrWizard.stepImport',
};

const STEP_ICONS: Record<WizardStep, React.FC<{ className?: string }>> = {
  upload: Upload,
  mapping: Columns3,
  preview: Eye,
  options: Settings2,
  import: CheckCircle2,
};

interface ImportOptions {
  targetMode: 'new' | 'existing';
  estimateId?: string;
  estimateName: string;
  autoLinkSpec: boolean;
  autoPushFm: boolean;
  autoPushMaterials: boolean;
  budgetId?: string;
}

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  OT: 'text-blue-600 dark:text-blue-400',
  EM: 'text-amber-600 dark:text-amber-400',
  ZT: 'text-purple-600 dark:text-purple-400',
  M: 'text-green-600 dark:text-green-400',
  NR: 'text-orange-600 dark:text-orange-400',
  SP: 'text-teal-600 dark:text-teal-400',
};

const RESOURCE_TYPE_BG: Record<string, string> = {
  OT: 'bg-blue-50 dark:bg-blue-900/20',
  EM: 'bg-amber-50 dark:bg-amber-900/20',
  ZT: 'bg-purple-50 dark:bg-purple-900/20',
  M: 'bg-green-50 dark:bg-green-900/20',
  NR: 'bg-orange-50 dark:bg-orange-900/20',
  SP: 'bg-teal-50 dark:bg-teal-900/20',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const LsrImportWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId') ?? '';

  const [step, setStep] = useState<WizardStep>('upload');
  const [parseResult, setParseResult] = useState<LsrParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportLsrResult | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId);

  const projectId = selectedProjectId || urlProjectId;

  const [options, setOptions] = useState<ImportOptions>({
    targetMode: 'new',
    estimateName: '',
    autoLinkSpec: false,
    autoPushFm: false,
    autoPushMaterials: false,
  });

  // Fetch available projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-lsr'],
    queryFn: async () => {
      const resp = await projectsApi.getProjects({ page: 0, size: 100 });
      return (resp.content ?? []).map(p => ({ id: p.id, name: p.name }));
    },
  });

  // Fetch available budgets for options step
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets-for-lsr', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const resp = await financeApi.getBudgets({ projectId, page: 0, size: 100 });
      return resp.content ?? [];
    },
    enabled: !!projectId,
  });

  const stepIndex = STEPS.indexOf(step);
  const canGoNext = useMemo(() => {
    if (step === 'upload') return !!parseResult;
    if (step === 'mapping') return !!parseResult;
    if (step === 'preview') return !!parseResult;
    if (step === 'options') {
      if (!projectId) return false; // Проект обязателен для импорта
      if (options.targetMode === 'new' && !options.estimateName.trim()) return false;
      if ((options.autoPushFm || options.autoPushMaterials) && !options.budgetId) return false;
      return true;
    }
    return false;
  }, [step, parseResult, options, projectId]);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }, [step]);

  // ── File Upload Handler ──
  const handleFileDrop = useCallback(async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let file: File | null = null;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0] ?? null;
    } else {
      file = e.target.files?.[0] ?? null;
    }
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setParseError(t('estimates.lsrWizard.uploadWrongType'));
      return;
    }

    setParsing(true);
    setParseError(null);
    setFileName(file.name);
    try {
      const result = await parseFullLsrFile(file);
      if (result.flatLines.length === 0) {
        setParseError(t('estimates.lsrWizard.uploadNoData'));
        setParsing(false);
        return;
      }
      setParseResult(result);
      // Auto-set estimate name from file name
      if (!options.estimateName) {
        const nameWithoutExt = file.name.replace(/\.(xlsx|xls)$/i, '');
        setOptions(prev => ({ ...prev, estimateName: nameWithoutExt }));
      }
    } catch {
      setParseError(t('estimates.lsrWizard.uploadParseError'));
    } finally {
      setParsing(false);
    }
  }, [options.estimateName]);

  // ── Import Mutation ──
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parseResult) throw new Error('No parse result');

      // Build lines with parentLineNumber from tree hierarchy
      let lastSectionLineNum: number | null = null;
      let lastPositionLineNum: number | null = null;
      const lines: ImportLsrLine[] = parseResult.flatLines.map(node => {
        let parentLineNumber: number | undefined;
        if (node.lineType === 'SECTION') {
          lastSectionLineNum = node.lineNumber;
          lastPositionLineNum = null;
          parentLineNumber = undefined;
        } else if (node.lineType === 'POSITION') {
          lastPositionLineNum = node.lineNumber;
          parentLineNumber = lastSectionLineNum ?? undefined;
        } else if (node.lineType === 'RESOURCE') {
          parentLineNumber = lastPositionLineNum ?? lastSectionLineNum ?? undefined;
        }
        return {
          lineNumber: node.lineNumber,
          lineType: node.lineType,
          positionType: node.positionType,
          resourceType: node.resourceType,
          justification: node.justification,
          name: node.name,
          unit: node.unit,
          quantity: node.quantityTotal,
          baseCost: node.baseCost,
          indexValue: node.indexValue,
          currentCost: node.currentCost,
          totalAmount: node.totalAmount,
          coefficients: node.coefficients,
          sectionName: node.sectionName,
          depth: node.depth,
          parentLineNumber,
        };
      });

      const request: ImportLsrRequest = {
        projectId,
        estimateId: options.targetMode === 'existing' ? options.estimateId : undefined,
        estimateName: options.targetMode === 'new' ? options.estimateName : undefined,
        lines,
        summary: parseResult.summary as unknown as Record<string, unknown>,
        options: {
          autoLinkSpec: options.autoLinkSpec,
          autoPushFm: options.autoPushFm,
          autoPushMaterials: options.autoPushMaterials,
          budgetId: options.budgetId,
        },
      };

      return estimatesApi.importLsrHierarchical(request);
    },
    onSuccess: (result) => {
      setImportResult(result);
      toast.success(t('estimates.lsrWizard.importSuccess'));
    },
    onError: () => {
      toast.error(t('estimates.lsrWizard.importError'));
    },
  });

  const handleImport = useCallback(() => {
    importMutation.mutate();
  }, [importMutation]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={t('estimates.lsrWizard.title')}
        subtitle={t('estimates.lsrWizard.subtitle')}
        breadcrumbs={[
          { label: t('estimates.lsrWizard.breadcrumbHome'), href: '/' },
          { label: t('estimates.lsrWizard.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.lsrWizard.breadcrumbImportLsr') },
        ]}
      />

      {/* Step Indicators */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s];
            const isActive = s === step;
            const isCompleted = i < stepIndex;
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    isCompleted ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-700'
                  )} />
                )}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isActive && 'bg-blue-500 text-white',
                    isCompleted && 'bg-blue-500 text-white',
                    !isActive && !isCompleted && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    'text-sm hidden sm:inline',
                    isActive ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'
                  )}>
                    {t(STEP_LABELS[s])}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        {step === 'upload' && (
          <StepUpload
            parsing={parsing}
            parseError={parseError}
            parseResult={parseResult}
            fileName={fileName}
            onFileDrop={handleFileDrop}
          />
        )}
        {step === 'mapping' && parseResult && (
          <StepMapping columnMapping={parseResult.columnMapping} />
        )}
        {step === 'preview' && parseResult && (
          <StepPreview parseResult={parseResult} />
        )}
        {step === 'options' && (
          <StepOptions
            options={options}
            onChange={setOptions}
            budgets={budgets}
            projects={projects}
            selectedProjectId={projectId}
            onProjectChange={setSelectedProjectId}
          />
        )}
        {step === 'import' && (
          <StepImport
            importing={importMutation.isPending}
            importResult={importResult}
            onImport={handleImport}
            onViewEstimate={() => {
              if (importResult?.estimateId) {
                navigate(`/estimates/${importResult.estimateId}/normative`);
              }
            }}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {step !== 'import' && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => step === 'upload' ? navigate(-1) : goBack()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {step === 'upload' ? t('estimates.lsrWizard.btnCancel') : t('estimates.lsrWizard.btnBack')}
          </Button>
          <Button
            onClick={() => {
              if (step === 'options') {
                setStep('import');
              } else {
                goNext();
              }
            }}
            disabled={!canGoNext}
          >
            {t('estimates.lsrWizard.btnNext')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Upload
// ─────────────────────────────────────────────────────────────────────────────

const StepUpload: React.FC<{
  parsing: boolean;
  parseError: string | null;
  parseResult: LsrParseResult | null;
  fileName: string;
  onFileDrop: (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ parsing, parseError, parseResult, fileName, onFileDrop }) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('estimates.lsrWizard.uploadTitle')}
      </h3>

      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          dragOver && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
          parseResult && !parsing && 'border-green-400 bg-green-50 dark:bg-green-900/20',
          parseError && 'border-red-400 bg-red-50 dark:bg-red-900/20',
          !dragOver && !parseResult && !parseError && 'border-neutral-300 dark:border-neutral-600 hover:border-blue-400',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setDragOver(false); onFileDrop(e); }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx,.xls';
          input.onchange = (e) => onFileDrop(e as unknown as React.ChangeEvent<HTMLInputElement>);
          input.click();
        }}
      >
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('estimates.lsrWizard.uploadParsing')}</p>
          </div>
        ) : parseResult ? (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">{fileName}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('estimates.lsrWizard.uploadSuccess', {
                sections: String(parseResult.metadata.parsedSections),
                positions: String(parseResult.metadata.parsedPositions),
                resources: String(parseResult.metadata.parsedResources),
              })}
            </p>
          </div>
        ) : parseError ? (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-neutral-400" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('estimates.lsrWizard.uploadHint')}
            </p>
            <p className="text-xs text-neutral-400">
              {t('estimates.lsrWizard.uploadFormats')}
            </p>
          </div>
        )}
      </div>

      {/* Summary block preview */}
      {parseResult && parseResult.summary.grandTotal > 0 && (
        <SummaryPreview summary={parseResult.summary} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Column Mapping (auto-detected, overridable)
// ─────────────────────────────────────────────────────────────────────────────

const MAPPING_FIELDS: { key: keyof LsrColumnMapping; labelKey: string }[] = [
  { key: 'numCol', labelKey: 'estimates.lsrWizard.mappingColNum' },
  { key: 'codeCol', labelKey: 'estimates.lsrWizard.mappingColCode' },
  { key: 'nameCol', labelKey: 'estimates.lsrWizard.mappingColName' },
  { key: 'unitCol', labelKey: 'estimates.lsrWizard.mappingColUnit' },
  { key: 'qtyPerUnitCol', labelKey: 'estimates.lsrWizard.mappingColQtyPerUnit' },
  { key: 'qtyCoeffCol', labelKey: 'estimates.lsrWizard.mappingColQtyCoeff' },
  { key: 'qtyTotalCol', labelKey: 'estimates.lsrWizard.mappingColQtyTotal' },
  { key: 'baseCostCol', labelKey: 'estimates.lsrWizard.mappingColBaseCost' },
  { key: 'indexCol', labelKey: 'estimates.lsrWizard.mappingColIndex' },
  { key: 'currentCostCol', labelKey: 'estimates.lsrWizard.mappingColCurrentCost' },
  { key: 'coefficientsCol', labelKey: 'estimates.lsrWizard.mappingColCoefficients' },
  { key: 'totalCol', labelKey: 'estimates.lsrWizard.mappingColTotal' },
];

const colLetter = (n: number): string => {
  let result = '';
  let num = n;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
};

const StepMapping: React.FC<{
  columnMapping: LsrColumnMapping;
}> = ({ columnMapping }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('estimates.lsrWizard.mappingTitle')}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t('estimates.lsrWizard.mappingHint')}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MAPPING_FIELDS.map(({ key, labelKey }) => {
          const colIndex = columnMapping[key];
          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                colIndex >= 0
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800',
              )}
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t(labelKey)}</span>
              <span className={cn(
                'text-sm font-mono font-semibold',
                colIndex >= 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-400'
              )}>
                {colIndex >= 0 ? colLetter(colIndex) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Tree Preview with ГОСТ 12-column table (matches ГРАНД-Смета)
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_GRID = 'grid-cols-[48px_110px_1fr_72px_90px_72px_90px_110px_68px_110px_72px_130px]';
const PREVIEW_MIN_W = 'min-w-[1400px]';

const fmtPreviewMoney = (v: number): string => {
  if (!v || v === 0) return '';
  return formatMoney(v);
};

const fmtPreviewQty = (v: number | undefined): string => {
  if (v == null || v === 0) return '';
  return String(v);
};

const fmtPreviewIdx = (v: number | undefined): string => {
  if (v == null || v === 0) return '';
  return v.toFixed(4);
};

const StepPreview: React.FC<{
  parseResult: LsrParseResult;
}> = ({ parseResult }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());

  const toggleSection = useCallback((lineNumber: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(lineNumber)) next.delete(lineNumber);
      else next.add(lineNumber);
      return next;
    });
  }, []);

  const togglePosition = useCallback((lineNumber: number) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      if (next.has(lineNumber)) next.delete(lineNumber);
      else next.add(lineNumber);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const sectionNums = new Set<number>();
    const positionNums = new Set<number>();
    parseResult.sections.forEach(s => {
      sectionNums.add(s.lineNumber);
      s.children.forEach(p => {
        if (p.lineType === 'POSITION') positionNums.add(p.lineNumber);
      });
    });
    setExpandedSections(sectionNums);
    setExpandedPositions(positionNums);
  }, [parseResult]);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
    setExpandedPositions(new Set());
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('estimates.lsrWizard.previewTitle')}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {t('estimates.lsrWizard.previewHint')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            {t('estimates.lsrWizard.previewExpandAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            {t('estimates.lsrWizard.previewCollapseAll')}
          </Button>
        </div>
      </div>

      {/* Stats badges */}
      <div className="flex gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          <FolderTree className="w-3.5 h-3.5" />
          {t('estimates.lsrWizard.previewSections')}: {parseResult.metadata.parsedSections}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          {t('estimates.lsrWizard.previewPositions')}: {parseResult.metadata.parsedPositions}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          {t('estimates.lsrWizard.previewResources')}: {parseResult.metadata.parsedResources}
        </span>
        {parseResult.summary.grandTotal > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            {t('estimates.lsrWizard.previewTotal')}: {formatMoney(parseResult.summary.grandTotal)}
          </span>
        )}
      </div>

      {/* ГОСТ 12-column table */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className={PREVIEW_MIN_W}>
            {/* Row 1: Main headers */}
            <div className={cn('grid gap-0 px-3 py-1.5 border-b border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 tracking-wide', PREVIEW_GRID)}>
              <div className="flex items-center text-center leading-tight">
                {t('estimates.normative.col1Num')}
              </div>
              <div className="flex items-center leading-tight">
                {t('estimates.normative.col2Code')}
              </div>
              <div className="flex items-center leading-tight">
                {t('estimates.normative.col3Name')}
              </div>
              <div className="flex items-center leading-tight">
                {t('estimates.normative.col4Unit')}
              </div>
              <div className="col-span-3 text-center border-l border-neutral-300 dark:border-neutral-600 pl-1 flex items-center justify-center uppercase">
                {t('estimates.normative.grpQuantity')}
              </div>
              <div className="col-span-5 text-center border-l border-neutral-300 dark:border-neutral-600 pl-1 flex items-center justify-center uppercase">
                {t('estimates.normative.grpCost')}
              </div>
            </div>
            {/* Row 2: Sub-column names */}
            <div className={cn('grid gap-0 px-3 py-1 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight', PREVIEW_GRID)}>
              <div /><div /><div /><div />
              <div className="text-center border-l border-neutral-200 dark:border-neutral-700 pl-1">{t('estimates.normative.col5QtyPerUnit')}</div>
              <div className="text-center">{t('estimates.normative.col6Coeff')}</div>
              <div className="text-center">{t('estimates.normative.col7QtyTotal')}</div>
              <div className="text-center border-l border-neutral-200 dark:border-neutral-700 pl-1">{t('estimates.normative.col8Basis')}</div>
              <div className="text-center">{t('estimates.normative.col9Index')}</div>
              <div className="text-center">{t('estimates.normative.col10Current')}</div>
              <div className="text-center">{t('estimates.normative.col11Coeffs')}</div>
              <div className="text-center">{t('estimates.normative.col12Total')}</div>
            </div>
            {/* Row 3: Column numbers */}
            <div className={cn('grid gap-0 px-3 py-0.5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold text-neutral-400 dark:text-neutral-500', PREVIEW_GRID)}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={cn('text-center', i === 4 && 'border-l border-neutral-200 dark:border-neutral-700', i === 7 && 'border-l border-neutral-200 dark:border-neutral-700')}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data rows */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <div className={PREVIEW_MIN_W}>
            {parseResult.sections.map(section => (
              <PreviewSectionNode
                key={section.lineNumber}
                node={section}
                expanded={expandedSections.has(section.lineNumber)}
                expandedPositions={expandedPositions}
                onToggle={toggleSection}
                onTogglePosition={togglePosition}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewSectionNode: React.FC<{
  node: LsrParsedNode;
  expanded: boolean;
  expandedPositions: Set<number>;
  onToggle: (lineNumber: number) => void;
  onTogglePosition: (lineNumber: number) => void;
}> = ({ node, expanded, expandedPositions, onToggle, onTogglePosition }) => {
  return (
    <>
      {/* Section row — spans full width */}
      <div
        className={cn('grid gap-0 px-3 py-2 bg-blue-50 dark:bg-blue-900/15 border-b border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors', PREVIEW_GRID)}
        onClick={() => onToggle(node.lineNumber)}
      >
        <div className="flex items-center">
          {expanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
        </div>
        <div />
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {node.name || node.sectionName}
          </span>
          <span className="text-xs text-neutral-400 shrink-0">
            ({node.children.length} {t('estimates.lsrWizard.previewPositions').toLowerCase()})
          </span>
        </div>
        <div className="col-span-8" />
        <div className="text-right">
          {node.totalAmount > 0 && (
            <span className="font-semibold text-sm tabular-nums">{formatMoney(node.totalAmount)}</span>
          )}
        </div>
      </div>

      {expanded && node.children.map(pos => (
        <PreviewPositionNode
          key={pos.lineNumber}
          node={pos}
          expanded={expandedPositions.has(pos.lineNumber)}
          onToggle={onTogglePosition}
        />
      ))}
    </>
  );
};

const PreviewPositionNode: React.FC<{
  node: LsrParsedNode;
  expanded: boolean;
  onToggle: (lineNumber: number) => void;
}> = ({ node, expanded, onToggle }) => {
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        className={cn(
          'grid gap-0 px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-sm',
          hasChildren && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
          PREVIEW_GRID,
        )}
        style={{ paddingLeft: 32 }}
        onClick={() => hasChildren && onToggle(node.lineNumber)}
      >
        {/* 1: № */}
        <div className="flex items-center text-neutral-500 tabular-nums text-xs">
          {hasChildren && (expanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400 mr-1" />)}
          {node.lineNumber}
        </div>
        {/* 2: Обоснование */}
        <div className="flex items-center gap-1">
          {node.positionType && (
            <span className="text-[10px] font-semibold px-1 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shrink-0">
              {node.positionType}
            </span>
          )}
          <span className="text-xs font-mono text-neutral-500 truncate" title={node.justification}>
            {node.justification || '—'}
          </span>
        </div>
        {/* 3: Наименование */}
        <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate pr-2" title={node.name}>
          {node.name}
        </div>
        {/* 4: Ед.изм. */}
        <div className="text-neutral-500 text-xs">{node.unit || '—'}</div>
        {/* 5: на ед.изм. */}
        <div className="text-right tabular-nums text-xs text-neutral-500">{fmtPreviewQty(node.quantityPerUnit)}</div>
        {/* 6: коэффициенты */}
        <div className="text-right tabular-nums text-xs text-neutral-500">{fmtPreviewQty(node.coefficient)}</div>
        {/* 7: всего */}
        <div className="text-right tabular-nums font-medium">{fmtPreviewQty(node.quantityTotal > 0 ? node.quantityTotal : undefined)}</div>
        {/* 8: базис */}
        <div className="text-right tabular-nums text-neutral-500">{fmtPreviewMoney(node.baseCost)}</div>
        {/* 9: индекс */}
        <div className="text-right tabular-nums text-primary-600 dark:text-primary-400 font-medium text-xs">{fmtPreviewIdx(node.indexValue)}</div>
        {/* 10: текущая */}
        <div className="text-right tabular-nums font-semibold">{fmtPreviewMoney(node.currentCost)}</div>
        {/* 11: коэффициенты */}
        <div className="text-right text-xs text-neutral-400 truncate" title={node.coefficients ?? ''}>{node.coefficients ?? ''}</div>
        {/* 12: всего */}
        <div className="text-right tabular-nums font-bold">{fmtPreviewMoney(node.totalAmount)}</div>
      </div>

      {expanded && node.children.map(res => (
        <PreviewResourceNode key={res.lineNumber} node={res} />
      ))}
    </>
  );
};

const PreviewResourceNode: React.FC<{ node: LsrParsedNode }> = ({ node }) => {
  const colorClass = RESOURCE_TYPE_COLORS[node.resourceType ?? ''] ?? 'text-neutral-500';
  const bgClass = RESOURCE_TYPE_BG[node.resourceType ?? ''] ?? '';

  return (
    <div
      className={cn(
        'grid gap-0 px-3 py-1 border-b border-neutral-50 dark:border-neutral-800/50 text-xs',
        bgClass,
        PREVIEW_GRID,
      )}
      style={{ paddingLeft: 52 }}
    >
      {/* 1: # */}
      <div />
      {/* 2: Code/type */}
      <div className={cn('font-mono font-semibold', colorClass)}>{node.resourceType ?? ''}</div>
      {/* 3: Name */}
      <div className={cn('truncate', colorClass)}>{node.name}</div>
      {/* 4: Unit */}
      <div className="text-neutral-400">{node.unit ?? ''}</div>
      {/* 5-6 empty for resources */}
      <div />
      <div />
      {/* 7: Qty total */}
      <div className="text-right tabular-nums text-neutral-500">{fmtPreviewQty(node.quantityTotal > 0 ? node.quantityTotal : undefined)}</div>
      {/* 8: Base */}
      <div className="text-right tabular-nums text-neutral-400">{fmtPreviewMoney(node.baseCost)}</div>
      {/* 9: Index */}
      <div className="text-right tabular-nums text-neutral-400 text-[10px]">{fmtPreviewIdx(node.indexValue)}</div>
      {/* 10: Current */}
      <div className={cn('text-right tabular-nums', colorClass)}>{fmtPreviewMoney(node.currentCost)}</div>
      {/* 11: Coefficients */}
      <div className="text-right text-neutral-400 truncate">{node.coefficients ?? ''}</div>
      {/* 12: Total */}
      <div className={cn('text-right tabular-nums font-medium', colorClass)}>{fmtPreviewMoney(node.totalAmount)}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Options
// ─────────────────────────────────────────────────────────────────────────────

const StepOptions: React.FC<{
  options: ImportOptions;
  onChange: (o: ImportOptions) => void;
  budgets: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
}> = ({ options, onChange, budgets, projects, selectedProjectId, onProjectChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('estimates.lsrWizard.optionsTitle')}
      </h3>

      {/* Project selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('estimates.lsrWizard.optSelectProject')}
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            onProjectChange(e.target.value);
            onChange({ ...options, budgetId: undefined });
          }}
          className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('estimates.lsrWizard.optSelectProjectPlaceholder')}</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {!selectedProjectId && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t('estimates.lsrWizard.optProjectHint')}
          </p>
        )}
      </div>

      {/* Target */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('estimates.lsrWizard.optTarget')}
        </label>
        <div className="flex gap-3">
          <button
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
              options.targetMode === 'new'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-blue-300'
            )}
            onClick={() => onChange({ ...options, targetMode: 'new' })}
          >
            {t('estimates.lsrWizard.optTargetNew')}
          </button>
          <button
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
              options.targetMode === 'existing'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-blue-300'
            )}
            onClick={() => onChange({ ...options, targetMode: 'existing' })}
          >
            {t('estimates.lsrWizard.optTargetExisting')}
          </button>
        </div>
      </div>

      {/* Estimate Name (for new) */}
      {options.targetMode === 'new' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('estimates.lsrWizard.optEstimateName')}
          </label>
          <input
            type="text"
            value={options.estimateName}
            onChange={(e) => onChange({ ...options, estimateName: e.target.value })}
            placeholder={t('estimates.lsrWizard.optEstimateNamePlaceholder')}
            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleOption
          label={t('estimates.lsrWizard.optAutoLinkSpec')}
          hint={t('estimates.lsrWizard.optAutoLinkSpecHint')}
          checked={options.autoLinkSpec}
          onChange={(v) => onChange({ ...options, autoLinkSpec: v })}
        />
        <ToggleOption
          label={t('estimates.lsrWizard.optAutoPushFm')}
          hint={t('estimates.lsrWizard.optAutoPushFmHint')}
          checked={options.autoPushFm}
          onChange={(v) => onChange({ ...options, autoPushFm: v })}
        />
        <ToggleOption
          label={t('estimates.lsrWizard.optAutoPushMaterials')}
          hint={t('estimates.lsrWizard.optAutoPushMaterialsHint')}
          checked={options.autoPushMaterials}
          onChange={(v) => onChange({ ...options, autoPushMaterials: v })}
        />
      </div>

      {/* Budget selector */}
      {(options.autoPushFm || options.autoPushMaterials) && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('estimates.lsrWizard.optSelectBudget')}
          </label>
          <select
            value={options.budgetId ?? ''}
            onChange={(e) => onChange({ ...options, budgetId: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('estimates.lsrWizard.optSelectBudgetPlaceholder')}</option>
            {budgets.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

const ToggleOption: React.FC<{
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
    />
    <div>
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
      <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>
    </div>
  </label>
);

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Import
// ─────────────────────────────────────────────────────────────────────────────

const StepImport: React.FC<{
  importing: boolean;
  importResult: ImportLsrResult | null;
  onImport: () => void;
  onViewEstimate: () => void;
}> = ({ importing, importResult, onImport, onViewEstimate }) => {
  if (!importResult && !importing) {
    return (
      <div className="text-center py-8 space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('estimates.lsrWizard.importTitle')}
        </h3>
        <Button onClick={onImport} size="lg">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          {t('estimates.lsrWizard.btnImport')}
        </Button>
      </div>
    );
  }

  if (importing) {
    return (
      <div className="text-center py-8 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('estimates.lsrWizard.importing')}</p>
      </div>
    );
  }

  if (importResult) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
            {t('estimates.lsrWizard.importSuccess')}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ResultCard label={t('estimates.lsrWizard.resultSections')} value={importResult.sectionsCreated ?? 0} />
          <ResultCard label={t('estimates.lsrWizard.resultPositions')} value={importResult.positionsCreated ?? 0} />
          <ResultCard label={t('estimates.lsrWizard.resultResources')} value={importResult.resourcesCreated ?? 0} />
          {(importResult.fmItemsCreated ?? 0) > 0 && (
            <ResultCard label={t('estimates.lsrWizard.resultFmCreated')} value={importResult.fmItemsCreated ?? 0} />
          )}
          {(importResult.fmItemsUpdated ?? 0) > 0 && (
            <ResultCard label={t('estimates.lsrWizard.resultFmUpdated')} value={importResult.fmItemsUpdated ?? 0} />
          )}
          {(importResult.specLinked ?? 0) > 0 && (
            <ResultCard label={t('estimates.lsrWizard.resultLinked')} value={importResult.specLinked ?? 0} />
          )}
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={onViewEstimate}>
            {t('estimates.lsrWizard.btnViewEstimate')}
          </Button>
          <Button onClick={() => window.location.reload()}>
            {t('estimates.lsrWizard.btnDone')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

const ResultCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
    <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</span>
    <span className="text-xs text-neutral-500 text-center">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary Preview (shared)
// ─────────────────────────────────────────────────────────────────────────────

const SummaryPreview: React.FC<{ summary: LsrParsedSummary }> = ({ summary }) => {
  const rows = [
    { label: t('estimates.lsrWizard.summaryDirectCosts'), value: summary.directCostsTotal },
    { label: t('estimates.lsrWizard.summaryOverhead'), value: summary.overheadTotal },
    { label: t('estimates.lsrWizard.summaryProfit'), value: summary.profitTotal },
    { label: t('estimates.lsrWizard.summarySubtotal'), value: summary.subtotal, bold: true },
    ...(summary.winterSurcharge > 0 ? [{ label: `${t('estimates.lsrWizard.summaryWinter')} (${summary.winterSurchargeRate}%)`, value: summary.winterSurcharge }] : []),
    ...(summary.tempStructures > 0 ? [{ label: `${t('estimates.lsrWizard.summaryTemp')} (${summary.tempStructuresRate}%)`, value: summary.tempStructures }] : []),
    ...(summary.contingency > 0 ? [{ label: `${t('estimates.lsrWizard.summaryContingency')} (${summary.contingencyRate}%)`, value: summary.contingency }] : []),
    ...(summary.vatAmount > 0 ? [{ label: `${t('estimates.lsrWizard.summaryVat')} (${summary.vatRate}%)`, value: summary.vatAmount }] : []),
    { label: t('estimates.lsrWizard.summaryGrandTotal'), value: summary.grandTotal, bold: true, highlight: true },
  ];

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {t('estimates.lsrWizard.summaryTitle')}
        </h4>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between px-4 py-1.5',
              row.highlight && 'bg-blue-50 dark:bg-blue-900/20',
            )}
          >
            <span className={cn(
              'text-sm',
              row.bold ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400',
            )}>
              {row.label}
            </span>
            <span className={cn(
              'text-sm font-mono',
              row.bold ? 'font-bold text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300',
            )}>
              {formatMoney(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LsrImportWizard;
