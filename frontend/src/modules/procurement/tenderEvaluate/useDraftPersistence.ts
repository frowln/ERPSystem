import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';

import type { BidComparisonStatus } from '@/api/bidScoring';
import type { EditableCriteria, TenderEvaluateDraft } from './types';
import {
  getDefaultCriteria,
  getTenderEvaluateDraftStorageKey,
  parseTenderEvaluateDraft,
  TENDER_EVALUATE_DRAFT_MAX_AGE_MS,
} from './types';

export interface DraftState {
  step: number;
  comparisonId: string;
  comparisonStatus: BidComparisonStatus | null;
  criteria: EditableCriteria[];
  scoresInput: Record<string, Record<string, string>>;
  winnerId: string;
  supplierSearch: string;
}

export interface DraftPersistenceReturn {
  draftStorageKey: string;
  isDraftHydrated: boolean;
  restoredDraftAt: number | null;
  lastDraftSavedAt: number | null;
  hasDraftContent: boolean;
  hasUnsavedChanges: boolean;
  draftProtectedComparisonId: string | null;
  setDraftProtectedComparisonId: React.Dispatch<React.SetStateAction<string | null>>;
  clearDraft: (resetState: () => void) => void;
}

export const useDraftPersistence = (
  open: boolean,
  draftState: DraftState,
  hydrateState: (draft: TenderEvaluateDraft) => void,
): DraftPersistenceReturn => {
  const currentUser = useAuthStore((state) => state.user);
  const draftStorageKey = useMemo(
    () => getTenderEvaluateDraftStorageKey(currentUser?.id, currentUser?.organizationId),
    [currentUser?.id, currentUser?.organizationId],
  );

  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [draftProtectedComparisonId, setDraftProtectedComparisonId] = useState<string | null>(null);

  const { step, comparisonId, comparisonStatus, criteria, scoresInput, winnerId, supplierSearch } = draftState;

  const hasDraftContent = useMemo(() => {
    if (comparisonId.trim() !== '' || winnerId.trim() !== '' || supplierSearch.trim() !== '' || step > 0) {
      return true;
    }

    const hasScoreValues = Object.values(scoresInput).some((vendorScores) => (
      Object.values(vendorScores).some((rawValue) => rawValue.trim() !== '')
    ));
    if (hasScoreValues) {
      return true;
    }

    const defaultCriteria = getDefaultCriteria();
    return criteria.some((item, index) => {
      const defaultItem = defaultCriteria[index];
      if (!defaultItem) {
        return true;
      }
      return item.name !== defaultItem.name
        || item.type !== defaultItem.type
        || item.weight !== defaultItem.weight
        || item.maxScore !== defaultItem.maxScore;
    });
  }, [comparisonId, criteria, scoresInput, step, supplierSearch, winnerId]);

  const hasUnsavedChanges = open && hasDraftContent;

  // Hydrate from localStorage on open
  useEffect(() => {
    if (!open) {
      setIsDraftHydrated(false);
      return;
    }

    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) {
      setIsDraftHydrated(true);
      return;
    }

    const parsedDraft = parseTenderEvaluateDraft(rawDraft);
    if (!parsedDraft) {
      window.localStorage.removeItem(draftStorageKey);
      setIsDraftHydrated(true);
      return;
    }

    if ((Date.now() - parsedDraft.savedAt) > TENDER_EVALUATE_DRAFT_MAX_AGE_MS) {
      window.localStorage.removeItem(draftStorageKey);
      setIsDraftHydrated(true);
      return;
    }

    hydrateState(parsedDraft);
    setRestoredDraftAt(parsedDraft.savedAt);
    setLastDraftSavedAt(parsedDraft.savedAt);
    setDraftProtectedComparisonId(parsedDraft.comparisonId || null);
    setIsDraftHydrated(true);
    toast.success(t('procurement.tenderEvaluate.draftRestored', {
      date: formatDateTime(new Date(parsedDraft.savedAt).toISOString()),
    }));
  }, [draftStorageKey, open]); // eslint-disable-line react-hooks/exhaustive-deps -- hydrateState is stable

  // Auto-save draft
  useEffect(() => {
    if (!open || !isDraftHydrated) {
      return;
    }

    if (!hasDraftContent) {
      window.localStorage.removeItem(draftStorageKey);
      setLastDraftSavedAt(null);
      setRestoredDraftAt(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const draft: TenderEvaluateDraft = {
        savedAt: Date.now(),
        step,
        comparisonId,
        comparisonStatus,
        criteria,
        scoresInput,
        winnerId,
        supplierSearch,
      };
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setLastDraftSavedAt(draft.savedAt);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    comparisonId,
    comparisonStatus,
    criteria,
    draftStorageKey,
    hasDraftContent,
    isDraftHydrated,
    open,
    scoresInput,
    step,
    supplierSearch,
    winnerId,
  ]);

  // Warn on page unload
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [hasUnsavedChanges]);

  const clearDraft = (resetState: () => void) => {
    window.localStorage.removeItem(draftStorageKey);
    resetState();
    setRestoredDraftAt(null);
    setLastDraftSavedAt(null);
    setDraftProtectedComparisonId(null);
    toast.success(t('procurement.tenderEvaluate.draftCleared'));
  };

  return {
    draftStorageKey,
    isDraftHydrated,
    restoredDraftAt,
    lastDraftSavedAt,
    hasDraftContent,
    hasUnsavedChanges,
    draftProtectedComparisonId,
    setDraftProtectedComparisonId,
    clearDraft,
  };
};
