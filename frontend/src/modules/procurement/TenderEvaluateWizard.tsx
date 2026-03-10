import React, { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import {
  bidScoringApi,
  type BidCriteria,
  type BidComparisonStatus,
  type BidCriteriaType,
  type BidScore,
} from '@/api/bidScoring';
import { procurementApi } from '@/api/procurement';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TenderEvaluateWizardProps {
  open: boolean;
  onClose: () => void;
}

interface EditableCriteria {
  id?: string;
  type: BidCriteriaType;
  name: string;
  weight: number;
  maxScore: number;
  sortOrder: number;
}

type CriteriaWithId = EditableCriteria & { id: string };

interface RankingEntry {
  id: string;
  name: string;
  total: number;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  categories: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getDefaultCriteria = (): EditableCriteria[] => [
  { type: 'PRICE', name: t('procurement.tenderEvaluate.criteriaPrice'), weight: 40, maxScore: 10, sortOrder: 1 },
  { type: 'DELIVERY', name: t('procurement.tenderEvaluate.criteriaDeliveryTime'), weight: 25, maxScore: 10, sortOrder: 2 },
  { type: 'QUALITY', name: t('procurement.tenderEvaluate.criteriaQuality'), weight: 20, maxScore: 10, sortOrder: 3 },
  { type: 'EXPERIENCE', name: t('procurement.tenderEvaluate.criteriaExperience'), weight: 15, maxScore: 10, sortOrder: 4 },
];

const getSteps = () => [
  t('procurement.tenderEvaluate.step1'),
  t('procurement.tenderEvaluate.step2'),
  t('procurement.tenderEvaluate.step3'),
];

const parseInputNumber = (raw: string | undefined): number | undefined => {
  const normalized = (raw ?? '').trim().replace(',', '.');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const runInBatches = async (tasks: Array<() => Promise<unknown>>, batchSize = 20): Promise<void> => {
  for (let index = 0; index < tasks.length; index += batchSize) {
    const batch = tasks.slice(index, index + batchSize);
    await Promise.all(batch.map((task) => task()));
  }
};

const isApprover = (roles: string[] | undefined, role: string | undefined): boolean =>
  role === 'ADMIN' || role === 'PROJECT_MANAGER' || Boolean(roles?.includes('ADMIN')) || Boolean(roles?.includes('PROJECT_MANAGER'));

const mapCriteriaToEditable = (loadedCriteria: BidCriteria[]): EditableCriteria[] =>
  loadedCriteria
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((item) => ({
      id: item.id,
      type: (item.criteriaType ?? 'CUSTOM') as BidCriteriaType,
      name: item.name,
      weight: Number(item.weight),
      maxScore: Number(item.maxScore || 10),
      sortOrder: item.sortOrder ?? 0,
    }));

// ---------------------------------------------------------------------------
// Sub-component: WizardStepIndicator
// ---------------------------------------------------------------------------

const WizardStepIndicator = memo<{ steps: string[]; currentStep: number }>(({ steps, currentStep }) => (
  <div className="flex items-center gap-2 mb-6">
    {steps.map((label, index) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
            index <= currentStep ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {index + 1}
        </div>
        <span className={`text-sm ${index <= currentStep ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-400'}`}>
          {label}
        </span>
        {index < steps.length - 1 && <div className="w-8 h-px bg-neutral-300" />}
      </div>
    ))}
  </div>
));
WizardStepIndicator.displayName = 'WizardStepIndicator';

// ---------------------------------------------------------------------------
// Sub-component: StepParameters
// ---------------------------------------------------------------------------

interface StepParametersProps {
  comparisonId: string;
  setComparisonId: (id: string) => void;
  comparisonOptions: { value: string; label: string }[];
  comparisonsLoading: boolean;
  criteria: EditableCriteria[];
  totalWeight: number;
  isComparisonLocked: boolean;
  updateWeight: (index: number, value: string) => void;
}

const StepParameters = memo<StepParametersProps>(({
  comparisonId, setComparisonId, comparisonOptions, comparisonsLoading,
  criteria, totalWeight, isComparisonLocked, updateWeight,
}) => (
  <div className="space-y-4">
    <FormField label={t('procurement.tenderEvaluate.labelTender')} required>
      {(!comparisonsLoading && comparisonOptions.length === 0) ? (
        <Input disabled placeholder={t('procurement.tenderEvaluate.emptyTenders')} />
      ) : (
        <Select
          options={comparisonOptions}
          value={comparisonId}
          onChange={(event) => setComparisonId(event.target.value)}
          placeholder={comparisonsLoading ? t('common.loading') : t('procurement.tenderEvaluate.placeholderTender')}
        />
      )}
    </FormField>

    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('procurement.tenderEvaluate.criteriaLabel')}
        </span>
        <span className={`text-xs font-medium ${totalWeight === 100 ? 'text-success-600' : 'text-danger-600'}`}>
          {t('procurement.tenderEvaluate.criteriaWeightTotal', { total: String(totalWeight) })}
          {totalWeight !== 100 ? ` ${t('procurement.tenderEvaluate.criteriaWeightMustBe100')}` : ''}
        </span>
      </div>
      {isComparisonLocked && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          {t('procurement.tenderEvaluate.comparisonLockedHint')}
        </p>
      )}
      <div className="space-y-2">
        {criteria.map((criterion, index) => (
          <div key={`${criterion.type}-${criterion.sortOrder}-${criterion.id ?? index}`} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
            <span className="text-sm flex-1">{criterion.name}</span>
            <Input
              type="number"
              className="w-20 text-center"
              value={String(criterion.weight)}
              onChange={(event) => updateWeight(index, event.target.value)}
              min={0}
              max={100}
              disabled={isComparisonLocked}
            />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
));
StepParameters.displayName = 'StepParameters';

// ---------------------------------------------------------------------------
// Sub-component: ScoringCell (memoized to prevent O(n²) re-renders)
// ---------------------------------------------------------------------------

interface ScoringCellProps {
  vendorId: string;
  criterionId: string;
  maxScore: number;
  value: string;
  disabled: boolean;
  onChange: (vendorId: string, criterionId: string, raw: string) => void;
}

const ScoringCell = memo<ScoringCellProps>(({ vendorId, criterionId, maxScore, value, disabled, onChange }) => (
  <td className="py-2 px-2">
    <Input
      type="number"
      className="w-20 text-center"
      min={0}
      max={maxScore}
      step="0.1"
      value={value}
      onChange={(event) => onChange(vendorId, criterionId, event.target.value)}
      placeholder="0"
      disabled={disabled}
    />
  </td>
));
ScoringCell.displayName = 'ScoringCell';

// ---------------------------------------------------------------------------
// Sub-component: StepScoring
// ---------------------------------------------------------------------------

interface StepScoringProps {
  criteriaWithIds: CriteriaWithId[];
  filteredSuppliers: Supplier[];
  scoresInput: Record<string, Record<string, string>>;
  isComparisonLocked: boolean;
  supplierSearch: string;
  setSupplierSearch: (search: string) => void;
  setScoreValue: (vendorId: string, criterionId: string, raw: string) => void;
  hasParticipants: boolean;
}

const StepScoring = memo<StepScoringProps>(({
  criteriaWithIds, filteredSuppliers, scoresInput, isComparisonLocked,
  supplierSearch, setSupplierSearch, setScoreValue, hasParticipants,
}) => (
  <div className="space-y-4">
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      {t('procurement.tenderEvaluate.step2Hint')}
    </p>
    {!hasParticipants ? (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500 dark:text-neutral-400">
        {t('procurement.tenderEvaluate.emptySuppliers')}
      </div>
    ) : (
      <div className="space-y-3">
        <Input
          value={supplierSearch}
          onChange={(event) => setSupplierSearch(event.target.value)}
          placeholder={`${t('common.search')}...`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('procurement.tenderEvaluate.thParticipant')}
                </th>
                {criteriaWithIds.map((criterion) => (
                  <th key={criterion.id} className="text-center py-2 px-2 font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                    {criterion.name} ({criterion.weight}%)
                  </th>
                ))}
                <th className="text-center py-2 pl-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('procurement.tenderEvaluate.thTotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={criteriaWithIds.length + 2} className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {t('search.noResults')}
                  </td>
                </tr>
              )}
              {filteredSuppliers.map((supplier) => {
                const hasAllScores = criteriaWithIds.every((criterion) => {
                  const value = parseInputNumber(scoresInput[supplier.id]?.[criterion.id]);
                  return value !== undefined && value >= 0 && value <= criterion.maxScore;
                });
                const total = hasAllScores
                  ? criteriaWithIds.reduce((sum, criterion) => {
                    const value = parseInputNumber(scoresInput[supplier.id]?.[criterion.id]);
                    if (value === undefined) return sum;
                    return sum + (value * criterion.weight) / Math.max(criterion.maxScore, 1);
                  }, 0)
                  : null;

                return (
                  <tr key={supplier.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.email && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{supplier.email}</p>
                      )}
                    </td>
                    {criteriaWithIds.map((criterion) => (
                      <ScoringCell
                        key={criterion.id}
                        vendorId={supplier.id}
                        criterionId={criterion.id}
                        maxScore={criterion.maxScore}
                        value={scoresInput[supplier.id]?.[criterion.id] ?? ''}
                        disabled={isComparisonLocked}
                        onChange={setScoreValue}
                      />
                    ))}
                    <td className="py-2 pl-3 text-center font-semibold text-primary-700 dark:text-primary-300">
                      {total === null ? '—' : total.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
));
StepScoring.displayName = 'StepScoring';

// ---------------------------------------------------------------------------
// Sub-component: StepWinner
// ---------------------------------------------------------------------------

interface StepWinnerProps {
  ranking: RankingEntry[];
  winnerId: string;
  setWinnerId: (id: string) => void;
}

const StepWinner = memo<StepWinnerProps>(({ ranking, winnerId, setWinnerId }) => (
  <div className="space-y-4">
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      {t('procurement.tenderEvaluate.rankingTitle')}
    </p>
    <div className="space-y-2">
      {ranking.map((participant, index) => (
        <label
          key={participant.id}
          className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
            winnerId === participant.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
              : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
          onClick={() => setWinnerId(participant.id)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index === 0
                ? 'bg-warning-100 text-warning-700'
                : index === 1
                  ? 'bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{participant.name}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{participant.total.toFixed(2)}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.tenderEvaluate.pointsUnit')}</p>
          </div>
          <input
            type="radio"
            name="winner"
            checked={winnerId === participant.id}
            onChange={() => setWinnerId(participant.id)}
            className="h-4 w-4 text-primary-600"
          />
        </label>
      ))}
    </div>

    {winnerId && (
      <div className="bg-success-50 border border-success-200 rounded-lg p-3 dark:bg-success-950/30 dark:border-success-900">
        <p className="text-sm text-success-800 dark:text-success-300">
          {t('procurement.tenderEvaluate.winnerLabel')} <strong>{ranking.find((item) => item.id === winnerId)?.name ?? '—'}</strong>
        </p>
      </div>
    )}
  </div>
));
StepWinner.displayName = 'StepWinner';

// ---------------------------------------------------------------------------
// Main Wizard Component
// ---------------------------------------------------------------------------

export const TenderEvaluateWizard: React.FC<TenderEvaluateWizardProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [step, setStep] = useState(0);
  const [comparisonId, setComparisonId] = useState('');
  const [comparisonStatus, setComparisonStatus] = useState<BidComparisonStatus | null>(null);
  const [criteria, setCriteria] = useState<EditableCriteria[]>(getDefaultCriteria());
  const [scoresInput, setScoresInput] = useState<Record<string, Record<string, string>>>({});
  const [winnerId, setWinnerId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [stepLoading, setStepLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const comparisonsQuery = useQuery({
    queryKey: ['bid-scoring-comparisons', 'wizard'],
    queryFn: () => bidScoringApi.getComparisons({ page: 0, size: 200, sort: 'createdAt,desc' }),
    enabled: open,
  });

  const suppliersQuery = useQuery({
    queryKey: ['procurement-suppliers', 'tender-evaluate'],
    queryFn: () => procurementApi.getSuppliers(),
    enabled: open,
  });

  const criteriaQuery = useQuery({
    queryKey: ['bid-scoring-criteria', comparisonId],
    queryFn: () => bidScoringApi.getCriteria(comparisonId),
    enabled: open && Boolean(comparisonId),
  });

  const scoresQuery = useQuery({
    queryKey: ['bid-scoring-scores', comparisonId],
    queryFn: () => bidScoringApi.getScores(comparisonId),
    enabled: open && Boolean(comparisonId),
  });

  const comparisons = comparisonsQuery.data?.content ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const participants = useMemo<Supplier[]>(() => {
    const byId = new Map<string, Supplier>();
    for (const supplier of suppliers) byId.set(supplier.id, supplier);
    for (const score of scoresQuery.data ?? []) {
      if (!byId.has(score.vendorId)) {
        byId.set(score.vendorId, { id: score.vendorId, name: score.vendorName?.trim() || score.vendorId, email: '', categories: [] });
      }
    }
    return Array.from(byId.values());
  }, [scoresQuery.data, suppliers]);

  const normalizedSupplierSearch = supplierSearch.trim().toLowerCase();
  const filteredSuppliers = useMemo(() => {
    if (!normalizedSupplierSearch) return participants;
    return participants.filter((s) => s.name.toLowerCase().includes(normalizedSupplierSearch) || s.email.toLowerCase().includes(normalizedSupplierSearch));
  }, [normalizedSupplierSearch, participants]);

  useEffect(() => {
    if (!comparisonId) {
      setComparisonStatus(null);
      setCriteria(getDefaultCriteria());
      setScoresInput({});
      setWinnerId('');
      setSupplierSearch('');
      return;
    }
    const selected = comparisons.find((item) => item.id === comparisonId);
    setComparisonStatus(selected?.status ?? null);
    setWinnerId(selected?.winnerVendorId ?? '');
  }, [comparisonId, comparisons]);

  useEffect(() => {
    if (!comparisonId) return;
    const loadedCriteria = criteriaQuery.data ?? [];
    setCriteria(loadedCriteria.length === 0 ? getDefaultCriteria() : mapCriteriaToEditable(loadedCriteria));
  }, [comparisonId, criteriaQuery.data]);

  useEffect(() => {
    if (!comparisonId) return;
    const mapped: Record<string, Record<string, string>> = {};
    for (const score of scoresQuery.data ?? []) {
      mapped[score.vendorId] = { ...(mapped[score.vendorId] ?? {}), [score.criteriaId]: String(score.score) };
    }
    setScoresInput(mapped);
  }, [comparisonId, scoresQuery.data]);

  const criteriaWithIds = useMemo(
    () => criteria.filter((item): item is CriteriaWithId => Boolean(item.id)),
    [criteria],
  );

  const existingScoreByPair = useMemo(() => {
    const map = new Map<string, BidScore>();
    for (const score of scoresQuery.data ?? []) map.set(`${score.vendorId}:${score.criteriaId}`, score);
    return map;
  }, [scoresQuery.data]);

  const totalWeight = useMemo(() => criteria.reduce((sum, item) => sum + item.weight, 0), [criteria]);

  const ranking = useMemo<RankingEntry[]>(() => {
    if (criteriaWithIds.length === 0) return [];
    return participants
      .filter((supplier) =>
        criteriaWithIds.every((c) => {
          const v = parseInputNumber(scoresInput[supplier.id]?.[c.id]);
          return v !== undefined && v >= 0 && v <= c.maxScore;
        }),
      )
      .map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        total: criteriaWithIds.reduce((sum, c) => {
          const v = parseInputNumber(scoresInput[supplier.id]?.[c.id]);
          return v === undefined ? sum : sum + (v * c.weight) / Math.max(c.maxScore, 1);
        }, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [criteriaWithIds, participants, scoresInput]);

  const isComparisonLocked = comparisonStatus === 'COMPLETED' || comparisonStatus === 'APPROVED';

  useEffect(() => {
    if (ranking.length === 0) { setWinnerId(''); return; }
    if (!ranking.some((row) => row.id === winnerId)) setWinnerId(ranking[0].id);
  }, [ranking, winnerId]);

  const comparisonOptions = useMemo(
    () => comparisons.map((item) => {
      const parts = [item.rfqNumber?.trim(), item.title, item.category?.trim(), item.statusDisplayName ?? item.status]
        .filter((p): p is string => Boolean(p && p.length > 0));
      return { value: item.id, label: parts.join(' • ') };
    }),
    [comparisons],
  );

  const updateWeight = useCallback((index: number, value: string) => {
    const parsed = parseInputNumber(value);
    const normalized = parsed === undefined ? 0 : Math.max(0, Math.min(100, parsed));
    setCriteria((prev) => prev.map((item, i) => (i === index ? { ...item, weight: normalized } : item)));
  }, []);

  const setScoreValue = useCallback((vendorId: string, criterionId: string, raw: string) => {
    setScoresInput((prev) => ({
      ...prev,
      [vendorId]: { ...(prev[vendorId] ?? {}), [criterionId]: raw },
    }));
  }, []);

  const ensureComparisonStarted = async (): Promise<BidComparisonStatus> => {
    if (!comparisonId) throw new Error(t('procurement.tenderEvaluate.toastError'));
    if (comparisonStatus === 'DRAFT') {
      const started = await bidScoringApi.startComparison(comparisonId);
      setComparisonStatus(started.status);
      return started.status;
    }
    return comparisonStatus ?? 'DRAFT';
  };

  const handleStepParametersNext = async () => {
    if (!comparisonId) return;
    if (isComparisonLocked) { setStep(1); return; }
    if (totalWeight !== 100) { toast.error(t('procurement.tenderEvaluate.validationWeight')); return; }

    setStepLoading(true);
    try {
      for (const criterion of criteria) {
        if (criterion.id) {
          await bidScoringApi.updateCriteria(criterion.id, { criteriaType: criterion.type, name: criterion.name, weight: criterion.weight, maxScore: criterion.maxScore, sortOrder: criterion.sortOrder });
        } else {
          await bidScoringApi.createCriteria({ bidComparisonId: comparisonId, criteriaType: criterion.type, name: criterion.name, weight: criterion.weight, maxScore: criterion.maxScore, sortOrder: criterion.sortOrder });
        }
      }
      const refreshedCriteria = await bidScoringApi.getCriteria(comparisonId);
      setCriteria(mapCriteriaToEditable(refreshedCriteria));
      await queryClient.invalidateQueries({ queryKey: ['bid-scoring-criteria', comparisonId] });
      setStep(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('procurement.tenderEvaluate.toastError'));
    } finally {
      setStepLoading(false);
    }
  };

  const handleStepScoringNext = async () => {
    if (!comparisonId) return;
    if (isComparisonLocked) { setStep(2); return; }
    if (criteriaWithIds.length === 0 || ranking.length === 0) { toast.error(t('procurement.tenderEvaluate.validationScores')); return; }

    setStepLoading(true);
    try {
      await ensureComparisonStarted();
      const scoreUpsertTasks: Array<() => Promise<unknown>> = [];
      for (const vendor of participants) {
        for (const criterion of criteriaWithIds) {
          const score = parseInputNumber(scoresInput[vendor.id]?.[criterion.id]);
          if (score === undefined) continue;
          if (score < 0 || score > criterion.maxScore) throw new Error(t('procurement.tenderEvaluate.validationScores'));
          const existing = existingScoreByPair.get(`${vendor.id}:${criterion.id}`);
          if (existing) {
            if (Number(existing.score) !== score) {
              scoreUpsertTasks.push(() => bidScoringApi.updateScore(existing.id, { score, vendorName: vendor.name, scoredById: currentUser?.id }));
            }
          } else {
            scoreUpsertTasks.push(() => bidScoringApi.createScore({ bidComparisonId: comparisonId, criteriaId: criterion.id, vendorId: vendor.id, vendorName: vendor.name, score, scoredById: currentUser?.id }));
          }
        }
      }
      if (scoreUpsertTasks.length > 0) await runInBatches(scoreUpsertTasks, 25);
      await queryClient.invalidateQueries({ queryKey: ['bid-scoring-scores', comparisonId] });
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('procurement.tenderEvaluate.toastError'));
    } finally {
      setStepLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!comparisonId || !winnerId) return;
    if (comparisonStatus === 'APPROVED') { toast.error(t('procurement.tenderEvaluate.comparisonLockedHint')); return; }

    setSubmitLoading(true);
    try {
      let status: BidComparisonStatus | null = comparisonStatus;
      if (status === 'DRAFT') {
        const started = await bidScoringApi.startComparison(comparisonId);
        status = started.status;
        setComparisonStatus(started.status);
      }
      if (status === 'IN_PROGRESS') {
        const completed = await bidScoringApi.completeComparison(comparisonId);
        status = completed.status;
        setComparisonStatus(completed.status);
      }
      await bidScoringApi.updateComparison(comparisonId, { winnerVendorId: winnerId, winnerJustification: t('procurement.tenderEvaluate.manualWinnerJustification') });
      if (status === 'COMPLETED' && isApprover(currentUser?.roles, currentUser?.role)) {
        const approved = await bidScoringApi.approveComparison(comparisonId, currentUser?.id);
        setComparisonStatus(approved.status);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bid-scoring-comparisons'] }),
        queryClient.invalidateQueries({ queryKey: ['bid-scoring-comparisons', 'wizard'] }),
        queryClient.invalidateQueries({ queryKey: ['bid-scoring-criteria', comparisonId] }),
        queryClient.invalidateQueries({ queryKey: ['bid-scoring-scores', comparisonId] }),
      ]);
      const winnerName = ranking.find((item) => item.id === winnerId)?.name ?? participants.find((item) => item.id === winnerId)?.name ?? '—';
      toast.success(t('procurement.tenderEvaluate.toastSuccess', { name: winnerName }));
      resetAndClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('procurement.tenderEvaluate.toastError'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setComparisonId('');
    setComparisonStatus(null);
    setCriteria(getDefaultCriteria());
    setScoresInput({});
    setWinnerId('');
    setSupplierSearch('');
    setStepLoading(false);
    setSubmitLoading(false);
    onClose();
  };

  const canNext = step === 0
    ? comparisonId !== '' && criteria.length > 0 && (isComparisonLocked || totalWeight === 100)
    : step === 1
      ? isComparisonLocked || ranking.length > 0
      : winnerId !== '';

  const steps = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.tenderEvaluate.title')}
      size="xl"
      footer={(
        <>
          <Button
            variant="secondary"
            onClick={step === 0 ? resetAndClose : () => setStep((prev) => prev - 1)}
            disabled={stepLoading || submitLoading}
          >
            {step === 0 ? t('procurement.tenderEvaluate.btnCancel') : t('procurement.tenderEvaluate.btnBack')}
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={step === 0 ? handleStepParametersNext : handleStepScoringNext}
              disabled={!canNext || stepLoading || submitLoading}
              loading={stepLoading}
            >
              {t('procurement.tenderEvaluate.btnNext')}
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!winnerId || stepLoading || submitLoading || comparisonStatus === 'APPROVED'}
              loading={submitLoading}
            >
              {t('procurement.tenderEvaluate.btnConfirmWinner')}
            </Button>
          )}
        </>
      )}
    >
      <WizardStepIndicator steps={steps} currentStep={step} />

      {step === 0 && (
        <StepParameters
          comparisonId={comparisonId}
          setComparisonId={setComparisonId}
          comparisonOptions={comparisonOptions}
          comparisonsLoading={comparisonsQuery.isLoading}
          criteria={criteria}
          totalWeight={totalWeight}
          isComparisonLocked={isComparisonLocked}
          updateWeight={updateWeight}
        />
      )}

      {step === 1 && (
        <StepScoring
          criteriaWithIds={criteriaWithIds}
          filteredSuppliers={filteredSuppliers}
          scoresInput={scoresInput}
          isComparisonLocked={isComparisonLocked}
          supplierSearch={supplierSearch}
          setSupplierSearch={setSupplierSearch}
          setScoreValue={setScoreValue}
          hasParticipants={participants.length > 0}
        />
      )}

      {step === 2 && (
        <StepWinner
          ranking={ranking}
          winnerId={winnerId}
          setWinnerId={setWinnerId}
        />
      )}
    </Modal>
  );
};

export default TenderEvaluateWizard;
