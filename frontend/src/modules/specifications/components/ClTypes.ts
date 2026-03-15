import { t } from '@/i18n';
import type { CompetitiveListStatus } from '@/types';
import type { BadgeColor } from '@/design-system/components/StatusBadge';

// ---------------------------------------------------------------------------
// Status color map & labels
// ---------------------------------------------------------------------------
export const competitiveListStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  COLLECTING: 'blue',
  EVALUATING: 'yellow',
  DECIDED: 'purple',
  APPROVED: 'green',
};

export const competitiveListStatusLabels: Record<string, string> = {
  get DRAFT() { return t('competitiveList.statuses.DRAFT'); },
  get COLLECTING() { return t('competitiveList.statuses.COLLECTING'); },
  get EVALUATING() { return t('competitiveList.statuses.EVALUATING'); },
  get DECIDED() { return t('competitiveList.statuses.DECIDED'); },
  get APPROVED() { return t('competitiveList.statuses.APPROVED'); },
};

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------
export const STATUS_TRANSITIONS: Record<string, { next: CompetitiveListStatus; label: string; variant: 'primary' | 'secondary' }[]> = {
  DRAFT: [{ next: 'COLLECTING', label: 'competitiveList.statuses.COLLECTING', variant: 'primary' }],
  COLLECTING: [
    { next: 'EVALUATING', label: 'competitiveList.statuses.EVALUATING', variant: 'primary' },
    { next: 'DRAFT', label: 'competitiveList.statuses.DRAFT', variant: 'secondary' },
  ],
  EVALUATING: [
    { next: 'DECIDED', label: 'competitiveList.statuses.DECIDED', variant: 'primary' },
    { next: 'COLLECTING', label: 'competitiveList.statuses.COLLECTING', variant: 'secondary' },
  ],
  DECIDED: [{ next: 'APPROVED', label: 'competitiveList.statuses.APPROVED', variant: 'primary' }],
  APPROVED: [],
};

// ---------------------------------------------------------------------------
// Proposal form
// ---------------------------------------------------------------------------
export interface ProposalFormData {
  vendorName: string;
  unitPrice: string;
  quantity: string;
  deliveryDays: string;
  paymentTerms: string;
  prepaymentPercent: string;
  paymentDelayDays: string;
  warrantyMonths: string;
  notes: string;
}

export const INITIAL_FORM: ProposalFormData = {
  vendorName: '',
  unitPrice: '',
  quantity: '',
  deliveryDays: '',
  paymentTerms: '',
  prepaymentPercent: '',
  paymentDelayDays: '',
  warrantyMonths: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Minimum proposals threshold
// ---------------------------------------------------------------------------
export const MIN_PROPOSALS = 3;

// ---------------------------------------------------------------------------
// Item summary (used in left panel & metrics)
// ---------------------------------------------------------------------------
export interface ItemSummary {
  item: import('@/types').SpecItem;
  proposalCount: number;
  bestPrice: number;
  hasWinner: boolean;
}

// ---------------------------------------------------------------------------
// Summary metrics data
// ---------------------------------------------------------------------------
export interface SummaryData {
  totalPositions: number;
  totalProposals: number;
  decidedCount: number;
  totalBestPrice: number;
  savings: number;
  coveredPositions: number;
  coveragePercent: number;
  savingsPercent: number;
}
