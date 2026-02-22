import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  bidScoringApi,
  type BidComparisonStatus,
  type BidScore,
  type CreateBidScorePayload,
} from '@/api/bidScoring';
import { procurementApi } from '@/api/procurement';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

import type { EditableCriteria, Participant, RankingEntry, ScoringSaveProgress, TenderEvaluateDraft } from './types';
import {
  getDefaultCriteria,
  parseInputNumber,
  isApprover,
  mapCriteriaToEditable,
  getHttpStatusCode,
  isRetryableStatus,
  waitMs,
  SCORE_BATCH_INITIAL_SIZE,
  SCORE_BATCH_MIN_SIZE,
  SCORE_BATCH_RETRY_LIMIT,
  SCORE_BATCH_RETRY_BASE_DELAY_MS,
} from './types';
import { useDraftPersistence } from './useDraftPersistence';

export interface UseTenderEvaluateWizardReturn {
  // State
  step: number;
  comparisonId: string;
  comparisonStatus: BidComparisonStatus | null;
  criteria: EditableCriteria[];
  scoresInput: Record<string, Record<string, string>>;
  winnerId: string;
  winnerJustification: string;
  supplierSearch: string;
  stepLoading: boolean;
  submitLoading: boolean;
  isDraftHydrated: boolean;
  restoredDraftAt: number | null;
  lastDraftSavedAt: number | null;
  scoringSaveProgress: ScoringSaveProgress | null;

  // Derived
  participants: Participant[];
  filteredSuppliers: Participant[];
  hasDraftContent: boolean;
  criteriaWithIds: (EditableCriteria & { id: string })[];
  totalWeight: number;
  ranking: RankingEntry[];
  rankingForDisplay: RankingEntry[];
  isComparisonLocked: boolean;
  comparisonOptions: { value: string; label: string }[];
  comparisonsLoading: boolean;
  canNext: boolean;
  comparisonProjectId: string;
  comparisonTitle: string;

  // Setters
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setWinnerId: (id: string) => void;
  setWinnerJustification: (value: string) => void;
  setSupplierSearch: (value: string) => void;

  // Actions
  handleComparisonChange: (value: string) => void;
  updateWeight: (index: number, value: string) => void;
  setScoreValue: (vendorId: string, criterionId: string, value: string) => void;
  handleStepParametersNext: () => Promise<void>;
  handleStepScoringNext: () => Promise<void>;
  handleFinish: () => Promise<void>;
  handleCloseAfterAward: () => void;
  clearDraft: () => void;
  closeWizard: (options?: { force?: boolean; clearDraft?: boolean }) => Promise<void>;
}

export const useTenderEvaluateWizard = (
  open: boolean,
  onClose: () => void,
): UseTenderEvaluateWizardReturn => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const confirmDialog = useConfirmDialog();

  // ---------------------------------------------------------------------------
  // Core state
  // ---------------------------------------------------------------------------

  const [step, setStep] = useState(0);
  const [comparisonId, setComparisonId] = useState('');
  const [comparisonStatus, setComparisonStatus] = useState<BidComparisonStatus | null>(null);
  const [criteria, setCriteria] = useState<EditableCriteria[]>(getDefaultCriteria());
  const [scoresInput, setScoresInput] = useState<Record<string, Record<string, string>>>({});
  const [winnerId, setWinnerId] = useState('');
  const [winnerJustification, setWinnerJustification] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [stepLoading, setStepLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [scoringSaveProgress, setScoringSaveProgress] = useState<ScoringSaveProgress | null>(null);

  // ---------------------------------------------------------------------------
  // Draft persistence
  // ---------------------------------------------------------------------------

  const hydrateState = useCallback((draft: TenderEvaluateDraft) => {
    setStep(draft.step);
    setComparisonId(draft.comparisonId);
    setComparisonStatus(draft.comparisonStatus);
    setCriteria(draft.criteria);
    setScoresInput(draft.scoresInput);
    setWinnerId(draft.winnerId);
    setSupplierSearch(draft.supplierSearch);
  }, []);

  const draftPersistence = useDraftPersistence(
    open,
    { step, comparisonId, comparisonStatus, criteria, scoresInput, winnerId, supplierSearch },
    hydrateState,
  );

  const {
    draftStorageKey,
    isDraftHydrated,
    restoredDraftAt,
    lastDraftSavedAt,
    hasDraftContent,
    hasUnsavedChanges,
    draftProtectedComparisonId,
    setDraftProtectedComparisonId,
  } = draftPersistence;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const comparisons = comparisonsQuery.data?.content ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const participants: Participant[] = useMemo(() => {
    const byId = new Map<string, Participant>();
    for (const supplier of suppliers) {
      byId.set(supplier.id, supplier);
    }
    for (const score of scoresQuery.data ?? []) {
      if (byId.has(score.vendorId)) continue;
      byId.set(score.vendorId, {
        id: score.vendorId,
        name: score.vendorName?.trim() || score.vendorId,
        email: '',
        categories: [],
      });
    }
    return Array.from(byId.values());
  }, [scoresQuery.data, suppliers]);

  const normalizedSupplierSearch = supplierSearch.trim().toLowerCase();

  const filteredSuppliers = useMemo(() => {
    if (!normalizedSupplierSearch) return participants;
    return participants.filter((s) =>
      s.name.toLowerCase().includes(normalizedSupplierSearch) ||
      s.email.toLowerCase().includes(normalizedSupplierSearch),
    );
  }, [normalizedSupplierSearch, participants]);

  const criteriaWithIds = useMemo(
    () => criteria.filter((item): item is EditableCriteria & { id: string } => Boolean(item.id)),
    [criteria],
  );

  const existingScoreByPair = useMemo(() => {
    const map = new Map<string, BidScore>();
    for (const score of scoresQuery.data ?? []) {
      map.set(`${score.vendorId}:${score.criteriaId}`, score);
    }
    return map;
  }, [scoresQuery.data]);

  const totalWeight = useMemo(
    () => criteria.reduce((sum, item) => sum + item.weight, 0),
    [criteria],
  );

  const ranking: RankingEntry[] = useMemo(() => {
    if (criteriaWithIds.length === 0) return [];

    const isValid = (vendorId: string, cId: string, max: number): boolean => {
      const s = parseInputNumber(scoresInput[vendorId]?.[cId]);
      return s !== undefined && s >= 0 && s <= max;
    };

    const getTotal = (vendorId: string): number =>
      criteriaWithIds.reduce((sum, c) => {
        const s = parseInputNumber(scoresInput[vendorId]?.[c.id]);
        return s === undefined ? sum : sum + (s * c.weight) / Math.max(c.maxScore, 1);
      }, 0);

    return participants
      .filter((sup) => criteriaWithIds.every((c) => isValid(sup.id, c.id, c.maxScore)))
      .map((sup) => ({ id: sup.id, name: sup.name, total: getTotal(sup.id) }))
      .sort((a, b) => b.total - a.total);
  }, [criteriaWithIds, participants, scoresInput]);

  const rankingForDisplay = ranking;
  const isComparisonLocked = comparisonStatus === 'COMPLETED' || comparisonStatus === 'APPROVED';

  const comparisonOptions = useMemo(
    () => comparisons.map((item) => {
      const parts = [item.rfqNumber?.trim(), item.title, item.category?.trim(), item.statusDisplayName ?? item.status]
        .filter((p): p is string => Boolean(p && p.length > 0));
      return { value: item.id, label: parts.join(' \u2022 ') };
    }),
    [comparisons],
  );

  const selectedComparison = useMemo(
    () => comparisons.find((item) => item.id === comparisonId),
    [comparisons, comparisonId],
  );
  const comparisonProjectId = selectedComparison?.projectId ?? '';
  const comparisonTitle = selectedComparison?.title ?? '';

  const canNext = step === 0
    ? comparisonId !== '' && criteria.length > 0 && (isComparisonLocked || totalWeight === 100)
    : step === 1
      ? isComparisonLocked || ranking.length > 0
      : winnerId !== '';

  // ---------------------------------------------------------------------------
  // Sync effects (comparison / criteria / scores / ranking)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!comparisonId) {
      setComparisonStatus(null);
      setCriteria(getDefaultCriteria());
      setScoresInput({});
      setWinnerId('');
      setSupplierSearch('');
      setDraftProtectedComparisonId(null);
      return;
    }
    if (draftProtectedComparisonId && draftProtectedComparisonId === comparisonId) return;
    const selected = comparisons.find((item) => item.id === comparisonId);
    setComparisonStatus(selected?.status ?? null);
    setWinnerId(selected?.winnerVendorId ?? '');
  }, [comparisonId, comparisons, draftProtectedComparisonId, setDraftProtectedComparisonId]);

  useEffect(() => {
    if (!comparisonId) return;
    if (draftProtectedComparisonId && draftProtectedComparisonId === comparisonId) return;
    const loaded = criteriaQuery.data ?? [];
    setCriteria(loaded.length === 0 ? getDefaultCriteria() : mapCriteriaToEditable(loaded));
  }, [comparisonId, criteriaQuery.data, draftProtectedComparisonId]);

  useEffect(() => {
    if (!comparisonId) return;
    if (draftProtectedComparisonId && draftProtectedComparisonId === comparisonId) return;
    const mapped: Record<string, Record<string, string>> = {};
    for (const score of scoresQuery.data ?? []) {
      mapped[score.vendorId] = { ...(mapped[score.vendorId] ?? {}), [score.criteriaId]: String(score.score) };
    }
    setScoresInput(mapped);
  }, [comparisonId, draftProtectedComparisonId, scoresQuery.data]);

  useEffect(() => {
    if (rankingForDisplay.length === 0) { setWinnerId(''); return; }
    if (!rankingForDisplay.some((r) => r.id === winnerId)) setWinnerId(rankingForDisplay[0].id);
  }, [rankingForDisplay, winnerId]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const updateWeight = useCallback((index: number, value: string) => {
    const parsed = parseInputNumber(value);
    const normalized = parsed === undefined ? 0 : Math.max(0, Math.min(100, parsed));
    setCriteria((prev) => prev.map((item, i) => i === index ? { ...item, weight: normalized } : item));
  }, []);

  const setScoreValue = useCallback((vendorId: string, criterionId: string, raw: string) => {
    setScoresInput((prev) => ({
      ...prev,
      [vendorId]: { ...(prev[vendorId] ?? {}), [criterionId]: raw },
    }));
  }, []);

  const handleComparisonChange = useCallback((value: string) => {
    setDraftProtectedComparisonId(null);
    setComparisonId(value);
  }, [setDraftProtectedComparisonId]);

  // ---------------------------------------------------------------------------
  // Async actions
  // ---------------------------------------------------------------------------

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
          await bidScoringApi.updateCriteria(criterion.id, {
            criteriaType: criterion.type, name: criterion.name,
            weight: criterion.weight, maxScore: criterion.maxScore, sortOrder: criterion.sortOrder,
          });
        } else {
          await bidScoringApi.createCriteria({
            bidComparisonId: comparisonId, criteriaType: criterion.type, name: criterion.name,
            weight: criterion.weight, maxScore: criterion.maxScore, sortOrder: criterion.sortOrder,
          });
        }
      }
      const refreshed = await bidScoringApi.getCriteria(comparisonId);
      setCriteria(mapCriteriaToEditable(refreshed));
      setDraftProtectedComparisonId(null);
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
    if (criteriaWithIds.length === 0 || ranking.length === 0) {
      toast.error(t('procurement.tenderEvaluate.validationScores'));
      return;
    }

    setStepLoading(true);
    setScoringSaveProgress(null);
    try {
      await ensureComparisonStarted();

      const payload: CreateBidScorePayload[] = [];
      for (const vendor of participants) {
        for (const criterion of criteriaWithIds) {
          const score = parseInputNumber(scoresInput[vendor.id]?.[criterion.id]);
          if (score === undefined) continue;
          if (score < 0 || score > criterion.maxScore) throw new Error(t('procurement.tenderEvaluate.validationScores'));
          const existing = existingScoreByPair.get(`${vendor.id}:${criterion.id}`);
          if (existing && Number(existing.score) === score) continue;
          payload.push({
            bidComparisonId: comparisonId, criteriaId: criterion.id,
            vendorId: vendor.id, vendorName: vendor.name, score, scoredById: currentUser?.id,
          });
        }
      }

      if (payload.length > 0) {
        const total = payload.length;
        setScoringSaveProgress({ saved: 0, total, retryAttempt: 0 });

        const saveChunk = async (chunk: CreateBidScorePayload[], attempt: number): Promise<void> => {
          try {
            await bidScoringApi.upsertScoresBatch({ scores: chunk });
          } catch (error) {
            const status = getHttpStatusCode(error);
            if (status === 413 && chunk.length > SCORE_BATCH_MIN_SIZE) {
              const mid = Math.ceil(chunk.length / 2);
              await saveChunk(chunk.slice(0, mid), 1);
              await saveChunk(chunk.slice(mid), 1);
              return;
            }
            if (attempt < SCORE_BATCH_RETRY_LIMIT && isRetryableStatus(status)) {
              setScoringSaveProgress((p) => (p ? { ...p, retryAttempt: attempt } : p));
              await waitMs(SCORE_BATCH_RETRY_BASE_DELAY_MS * attempt);
              await saveChunk(chunk, attempt + 1);
              return;
            }
            throw error;
          }
        };

        for (let i = 0; i < total; i += SCORE_BATCH_INITIAL_SIZE) {
          const chunk = payload.slice(i, i + SCORE_BATCH_INITIAL_SIZE);
          setScoringSaveProgress((p) => (p ? { ...p, retryAttempt: 0 } : p));
          await saveChunk(chunk, 1);
          setScoringSaveProgress((p) => (p ? { ...p, saved: Math.min(total, p.saved + chunk.length), retryAttempt: 0 } : p));
        }
      }

      setDraftProtectedComparisonId(null);
      await queryClient.invalidateQueries({ queryKey: ['bid-scoring-scores', comparisonId] });
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('procurement.tenderEvaluate.toastError'));
    } finally {
      setStepLoading(false);
      setScoringSaveProgress(null);
    }
  };

  const resetAllState = useCallback(() => {
    setStep(0);
    setComparisonId('');
    setComparisonStatus(null);
    setCriteria(getDefaultCriteria());
    setScoresInput({});
    setWinnerId('');
    setSupplierSearch('');
    setStepLoading(false);
    setSubmitLoading(false);
    setScoringSaveProgress(null);
  }, []);

  const handleFinish = async () => {
    if (!comparisonId || !winnerId) return;
    if (comparisonStatus === 'APPROVED') {
      toast.error(t('procurement.tenderEvaluate.comparisonLockedHint'));
      return;
    }

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
      await bidScoringApi.updateComparison(comparisonId, {
        winnerVendorId: winnerId,
        winnerJustification: winnerJustification.trim() || t('procurement.tenderEvaluate.manualWinnerJustification'),
      });
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

      const winnerName = rankingForDisplay.find((i) => i.id === winnerId)?.name
        ?? participants.find((i) => i.id === winnerId)?.name ?? '\u2014';
      toast.success(t('procurement.tenderEvaluate.toastSuccess', { name: winnerName }));
      window.localStorage.removeItem(draftStorageKey);
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('procurement.tenderEvaluate.toastError'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const clearDraft = useCallback(() => {
    draftPersistence.clearDraft(() => {
      setStep(0);
      setComparisonId('');
      setComparisonStatus(null);
      setCriteria(getDefaultCriteria());
      setScoresInput({});
      setWinnerId('');
      setSupplierSearch('');
      setScoringSaveProgress(null);
    });
  }, [draftPersistence]);

  const closeWizard = async ({ force = false, clearDraft: shouldClearDraft = false }: { force?: boolean; clearDraft?: boolean } = {}) => {
    if (!force && hasUnsavedChanges) {
      const confirmed = await confirmDialog({
        title: t('common.unsavedChangesTitle'),
        description: t('common.unsavedChanges'),
        confirmLabel: t('common.discardChanges'),
        cancelLabel: t('common.keepEditing'),
        confirmVariant: 'danger',
      });
      if (!confirmed) return;
    }
    if (shouldClearDraft) {
      window.localStorage.removeItem(draftStorageKey);
    }
    resetAllState();
    onClose();
  };

  const handleCloseAfterAward = useCallback(() => {
    resetAllState();
    onClose();
  }, [onClose, resetAllState]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    step, comparisonId, comparisonStatus, criteria, scoresInput,
    winnerId, winnerJustification, supplierSearch,
    stepLoading, submitLoading,
    isDraftHydrated, restoredDraftAt, lastDraftSavedAt, scoringSaveProgress,

    participants, filteredSuppliers, hasDraftContent,
    criteriaWithIds, totalWeight, ranking, rankingForDisplay,
    isComparisonLocked, comparisonOptions,
    comparisonsLoading: comparisonsQuery.isLoading,
    canNext, comparisonProjectId, comparisonTitle,

    setStep, setWinnerId, setWinnerJustification, setSupplierSearch,

    handleComparisonChange, updateWeight, setScoreValue,
    handleStepParametersNext, handleStepScoringNext, handleFinish,
    handleCloseAfterAward, clearDraft, closeWizard,
  };
};
