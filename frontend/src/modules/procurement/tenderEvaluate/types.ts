import type { BidCriteriaType, BidComparisonStatus } from '@/api/bidScoring';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditableCriteria {
  id?: string;
  type: BidCriteriaType;
  name: string;
  weight: number;
  maxScore: number;
  sortOrder: number;
}

export interface ScoringSaveProgress {
  saved: number;
  total: number;
  retryAttempt: number;
}

export type TenderEvaluateDraft = {
  savedAt: number;
  step: number;
  comparisonId: string;
  comparisonStatus: BidComparisonStatus | null;
  criteria: EditableCriteria[];
  scoresInput: Record<string, Record<string, string>>;
  winnerId: string;
  supplierSearch: string;
};

export interface RankingEntry {
  id: string;
  name: string;
  total: number;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  categories: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TENDER_EVALUATE_DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
export const SCORE_BATCH_INITIAL_SIZE = 300;
export const SCORE_BATCH_MIN_SIZE = 50;
export const SCORE_BATCH_RETRY_LIMIT = 3;
export const SCORE_BATCH_RETRY_BASE_DELAY_MS = 700;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const getDefaultCriteria = (): EditableCriteria[] => [
  { type: 'PRICE', name: t('procurement.tenderEvaluate.criteriaPrice'), weight: 40, maxScore: 10, sortOrder: 1 },
  { type: 'DELIVERY', name: t('procurement.tenderEvaluate.criteriaDeliveryTime'), weight: 25, maxScore: 10, sortOrder: 2 },
  { type: 'QUALITY', name: t('procurement.tenderEvaluate.criteriaQuality'), weight: 20, maxScore: 10, sortOrder: 3 },
  { type: 'EXPERIENCE', name: t('procurement.tenderEvaluate.criteriaExperience'), weight: 15, maxScore: 10, sortOrder: 4 },
];

export const getSteps = () => [
  t('procurement.tenderEvaluate.step1'),
  t('procurement.tenderEvaluate.step2'),
  t('procurement.tenderEvaluate.step3'),
  t('procurement.tenderEvaluate.step4'),
];

export const parseInputNumber = (raw: string | undefined): number | undefined => {
  const normalized = (raw ?? '').trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const isApprover = (roles: string[] | undefined, role: string | undefined): boolean => {
  return role === 'ADMIN'
    || role === 'PROJECT_MANAGER'
    || Boolean(roles?.includes('ADMIN'))
    || Boolean(roles?.includes('PROJECT_MANAGER'));
};

export const mapCriteriaToEditable = (loadedCriteria: import('@/api/bidScoring').BidCriteria[]): EditableCriteria[] => {
  return loadedCriteria
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
};

export const getTenderEvaluateDraftStorageKey = (
  userId: string | undefined,
  organizationId: string | undefined,
): string => {
  return `procurement:tender-evaluate:wizard:draft:v1:${organizationId ?? 'global'}:${userId ?? 'anonymous'}`;
};

export const isBidComparisonStatus = (value: unknown): value is BidComparisonStatus => {
  return value === 'DRAFT'
    || value === 'IN_PROGRESS'
    || value === 'COMPLETED'
    || value === 'APPROVED';
};

export const parseTenderEvaluateDraft = (raw: string): TenderEvaluateDraft | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<TenderEvaluateDraft>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (typeof parsed.savedAt !== 'number' || typeof parsed.step !== 'number') {
      return null;
    }

    const rawCriteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];
    const normalizedCriteria = rawCriteria
      .map((item, index): EditableCriteria | null => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const source = item as Partial<EditableCriteria>;
        if (typeof source.name !== 'string' || source.name.trim() === '') {
          return null;
        }
        const parsedWeight = Number(source.weight);
        const parsedMaxScore = Number(source.maxScore);
        const parsedSortOrder = Number(source.sortOrder);

        return {
          id: typeof source.id === 'string' ? source.id : undefined,
          type: typeof source.type === 'string' ? source.type as BidCriteriaType : 'CUSTOM',
          name: source.name,
          weight: Number.isFinite(parsedWeight) ? Math.max(0, Math.min(100, parsedWeight)) : 0,
          maxScore: Number.isFinite(parsedMaxScore) && parsedMaxScore > 0 ? parsedMaxScore : 10,
          sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : index + 1,
        };
      })
      .filter((item): item is EditableCriteria => Boolean(item));

    const normalizedScoresInput: Record<string, Record<string, string>> = {};
    if (parsed.scoresInput && typeof parsed.scoresInput === 'object') {
      for (const [vendorId, vendorScores] of Object.entries(parsed.scoresInput)) {
        if (!vendorScores || typeof vendorScores !== 'object') {
          continue;
        }

        const normalizedVendorScores: Record<string, string> = {};
        for (const [criteriaId, rawScore] of Object.entries(vendorScores)) {
          if (typeof rawScore === 'string') {
            normalizedVendorScores[criteriaId] = rawScore;
            continue;
          }
          if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
            normalizedVendorScores[criteriaId] = String(rawScore);
          }
        }

        if (Object.keys(normalizedVendorScores).length > 0) {
          normalizedScoresInput[vendorId] = normalizedVendorScores;
        }
      }
    }

    return {
      savedAt: parsed.savedAt,
      step: Math.max(0, Math.min(3, parsed.step)),
      comparisonId: typeof parsed.comparisonId === 'string' ? parsed.comparisonId : '',
      comparisonStatus: isBidComparisonStatus(parsed.comparisonStatus) ? parsed.comparisonStatus : null,
      criteria: normalizedCriteria.length > 0 ? normalizedCriteria : getDefaultCriteria(),
      scoresInput: normalizedScoresInput,
      winnerId: typeof parsed.winnerId === 'string' ? parsed.winnerId : '',
      supplierSearch: typeof parsed.supplierSearch === 'string' ? parsed.supplierSearch : '',
    };
  } catch {
    return null;
  }
};

export const getHttpStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const candidate = error as { response?: { status?: unknown } };
  return typeof candidate.response?.status === 'number' ? candidate.response.status : undefined;
};

export const isRetryableStatus = (status: number | undefined): boolean => {
  if (status === undefined) {
    return true;
  }
  return status === 408 || status === 429 || status >= 500;
};

export const waitMs = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});
