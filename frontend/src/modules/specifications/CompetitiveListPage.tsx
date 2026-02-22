import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  ChevronRight,
  Clock,
  CreditCard,
  ListChecks,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { specificationsApi } from '@/api/specifications';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { SupplyStatusIndicator } from './SupplyStatusIndicator';
import { PriceIndicator } from './PriceIndicator';
import type { CompetitiveList, CompetitiveListEntry, CompetitiveListStatus, SpecItem } from '@/types';
import type { BadgeColor } from '@/design-system/components/StatusBadge';

// ---------------------------------------------------------------------------
// Status color map & labels
// ---------------------------------------------------------------------------
const competitiveListStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  COLLECTING: 'blue',
  EVALUATING: 'yellow',
  DECIDED: 'purple',
  APPROVED: 'green',
};

const competitiveListStatusLabels: Record<string, string> = {
  get DRAFT() { return t('competitiveList.statuses.DRAFT'); },
  get COLLECTING() { return t('competitiveList.statuses.COLLECTING'); },
  get EVALUATING() { return t('competitiveList.statuses.EVALUATING'); },
  get DECIDED() { return t('competitiveList.statuses.DECIDED'); },
  get APPROVED() { return t('competitiveList.statuses.APPROVED'); },
};

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------
const STATUS_TRANSITIONS: Record<string, { next: CompetitiveListStatus; label: string; variant: 'primary' | 'secondary' }[]> = {
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
// Add Proposal Modal Form
// ---------------------------------------------------------------------------
interface ProposalFormData {
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

const INITIAL_FORM: ProposalFormData = {
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
// Component
// ---------------------------------------------------------------------------
const CompetitiveListPage: React.FC = () => {
  const { specId, id: rawId } = useParams<{ specId: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = rawId === 'new';
  const id = isNew ? undefined : rawId;

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [selectedEntryForWinner, setSelectedEntryForWinner] = useState<string | null>(null);
  const [winnerReason, setWinnerReason] = useState('');
  const [form, setForm] = useState<ProposalFormData>(INITIAL_FORM);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data: spec } = useQuery({
    queryKey: ['SPECIFICATION', specId],
    queryFn: () => specificationsApi.getSpecification(specId!),
    enabled: !!specId,
  });

  const { data: specItems } = useQuery({
    queryKey: ['spec-items', specId],
    queryFn: () => specificationsApi.getSpecItems(specId!),
    enabled: !!specId,
  });

  const { data: competitiveList } = useQuery({
    queryKey: ['competitive-list', id],
    queryFn: () => financeApi.getCompetitiveList(id!),
    enabled: !!id && !isNew,
  });

  const { data: entries } = useQuery({
    queryKey: ['competitive-list-entries', id],
    queryFn: () => financeApi.getCompetitiveListEntries(id!),
    enabled: !!id && !isNew,
  });

  // Auto-create competitive list when navigating with "new"
  const createMutation = useMutation({
    mutationFn: () =>
      financeApi.createCompetitiveList({
        specificationId: specId!,
        name: `${t('competitiveList.title')} — ${spec?.name ?? ''}`,
      }),
    onSuccess: (created) => {
      navigate(`/specifications/${specId}/competitive-list/${created.id}`, { replace: true });
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
      navigate(`/specifications/${specId}`);
    },
  });

  React.useEffect(() => {
    if (isNew && specId && spec && !createMutation.isPending) {
      createMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, specId, spec]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const statusMutation = useMutation({
    mutationFn: (status: string) => financeApi.changeCompetitiveListStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-list', id] });
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.saving')),
  });

  const addEntryMutation = useMutation({
    mutationFn: (data: Partial<CompetitiveListEntry>) => financeApi.addCompetitiveListEntry(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-list-entries', id] });
      toast.success(t('competitiveList.toasts.entryAdded'));
      setAddModalOpen(false);
      setForm(INITIAL_FORM);
    },
    onError: () => toast.error(t('common.saving')),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => financeApi.deleteCompetitiveListEntry(id!, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-list-entries', id] });
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.saving')),
  });

  const selectWinnerMutation = useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason?: string }) =>
      financeApi.selectCompetitiveListWinner(id!, entryId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-list-entries', id] });
      toast.success(t('competitiveList.toasts.winnerSelected'));
      setWinnerModalOpen(false);
      setSelectedEntryForWinner(null);
      setWinnerReason('');
    },
    onError: () => toast.error(t('common.saving')),
  });

  const autoRankMutation = useMutation({
    mutationFn: () => financeApi.autoRankEntries(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-list-entries', id] });
      toast.success(t('competitiveList.toasts.autoRanked'));
    },
    onError: () => toast.error(t('common.saving')),
  });

  const autoSelectMutation = useMutation({
    mutationFn: () => financeApi.autoSelectBestPrices(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-list', id] });
      queryClient.invalidateQueries({ queryKey: ['competitive-list-entries', id] });
      toast.success(t('competitiveList.toasts.autoSelected'));
    },
    onError: () => toast.error(t('common.saving')),
  });

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const allEntries = entries ?? [];
  const allItems = specItems ?? [];
  const cl = competitiveList;
  const transitions = STATUS_TRANSITIONS[cl?.status ?? ''] ?? [];

  // Group entries by specItemId for quick lookup
  const entriesByItem = useMemo(() => {
    const map = new Map<string, CompetitiveListEntry[]>();
    for (const entry of allEntries) {
      const key = entry.specItemId ?? '';
      if (!key) continue;
      const group = map.get(key) ?? [];
      group.push(entry);
      map.set(key, group);
    }
    return map;
  }, [allEntries]);

  // Build per-item summary for the left panel
  const itemSummaries = useMemo(() => {
    return allItems.map((item) => {
      const itemEntries = entriesByItem.get(item.id) ?? [];
      const prices = itemEntries.map((e) => e.unitPrice).filter((p) => p > 0);
      const bestPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const hasWinner = itemEntries.some((e) => e.isWinner);
      return {
        item,
        proposalCount: itemEntries.length,
        bestPrice,
        hasWinner,
      };
    });
  }, [allItems, entriesByItem]);

  // Keep item selection stable and avoid blank right panel when data is present
  React.useEffect(() => {
    if (itemSummaries.length === 0) {
      if (selectedItemId !== null) setSelectedItemId(null);
      return;
    }
    const exists = selectedItemId ? itemSummaries.some((s) => s.item.id === selectedItemId) : false;
    if (!exists) {
      setSelectedItemId(itemSummaries[0].item.id);
    }
  }, [itemSummaries, selectedItemId]);

  // Entries for the currently selected item
  const selectedItemEntries = useMemo(() => {
    if (!selectedItemId) return [];
    return entriesByItem.get(selectedItemId) ?? [];
  }, [selectedItemId, entriesByItem]);

  const selectedSpecItem = useMemo(() => {
    return allItems.find((i) => i.id === selectedItemId);
  }, [allItems, selectedItemId]);

  // Summary metrics
  const summary = useMemo(() => {
    const totalPositions = allItems.length;
    const totalProposals = allEntries.length;
    const decidedCount = itemSummaries.filter((s) => s.hasWinner).length;
    const coveredItems = itemSummaries.filter((s) => s.bestPrice > 0);
    const coveredPositions = coveredItems.length;
    const totalBestPrice = coveredItems.reduce((sum, s) => sum + s.bestPrice * s.item.quantity, 0);
    const coveredPlanned = coveredItems.reduce((sum, s) => sum + s.item.plannedAmount, 0);
    const savings = coveredPlanned - totalBestPrice;
    const coveragePercent = totalPositions > 0 ? (coveredPositions / totalPositions) * 100 : 0;
    const savingsPercent = coveredPlanned > 0 ? (savings / coveredPlanned) * 100 : 0;
    return {
      totalPositions,
      totalProposals,
      decidedCount,
      totalBestPrice,
      savings,
      coveredPositions,
      coveragePercent,
      savingsPercent,
    };
  }, [allItems, allEntries, itemSummaries]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddProposal = useCallback(() => {
    if (!selectedItemId) return;
    const unitPrice = parseFloat(form.unitPrice) || 0;
    const quantity = parseFloat(form.quantity) || selectedSpecItem?.quantity || 0;
    addEntryMutation.mutate({
      specItemId: selectedItemId,
      vendorName: form.vendorName,
      unitPrice,
      quantity,
      totalPrice: unitPrice * quantity,
      deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays, 10) : undefined,
      paymentTerms: form.paymentTerms || undefined,
      prepaymentPercent: form.prepaymentPercent ? parseFloat(form.prepaymentPercent) : undefined,
      paymentDelayDays: form.paymentDelayDays ? parseInt(form.paymentDelayDays, 10) : undefined,
      warrantyMonths: form.warrantyMonths ? parseInt(form.warrantyMonths, 10) : undefined,
      notes: form.notes || undefined,
    });
  }, [form, selectedItemId, selectedSpecItem, addEntryMutation]);

  const handleOpenAddModal = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      quantity: String(selectedSpecItem?.quantity ?? ''),
    });
    setAddModalOpen(true);
  }, [selectedSpecItem]);

  const handleOpenWinnerModal = useCallback((entryId: string) => {
    setSelectedEntryForWinner(entryId);
    setWinnerReason('');
    setWinnerModalOpen(true);
  }, []);

  const handleConfirmWinner = useCallback(() => {
    if (!selectedEntryForWinner) return;
    selectWinnerMutation.mutate({ entryId: selectedEntryForWinner, reason: winnerReason || undefined });
  }, [selectedEntryForWinner, winnerReason, selectWinnerMutation]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isNew || createMutation.isPending) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('competitiveList.creating')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={cl?.name ?? t('competitiveList.detail.title')}
        subtitle={spec?.name ?? ''}
        backTo={`/specifications/${specId}`}
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications'), href: '/specifications' },
          { label: spec?.name ?? '', href: `/specifications/${specId}` },
          { label: cl?.name ?? t('competitiveList.detail.title') },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              status={cl?.status ?? ''}
              colorMap={competitiveListStatusColorMap}
              label={competitiveListStatusLabels[cl?.status ?? ''] ?? cl?.status ?? ''}
              size="md"
            />
            {allEntries.length > 0 && cl?.status !== 'APPROVED' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Sparkles size={13} />}
                  loading={autoRankMutation.isPending}
                  onClick={() => autoRankMutation.mutate()}
                >
                  {t('competitiveList.autoRank')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Target size={13} />}
                  loading={autoSelectMutation.isPending}
                  onClick={() => autoSelectMutation.mutate()}
                >
                  {t('competitiveList.autoSelectBest')}
                </Button>
              </>
            )}
            {transitions.map((tr) => (
              <Button
                key={tr.next}
                variant={tr.variant}
                size="sm"
                iconRight={<ArrowRight size={13} />}
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate(tr.next)}
              >
                {t(tr.label)}
              </Button>
            ))}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ListChecks size={18} />}
          label={t('competitiveList.colPositions')}
          value={String(summary.totalPositions)}
        />
        <MetricCard
          icon={<Users size={18} />}
          label={t('competitiveList.detail.proposals')}
          value={String(summary.totalProposals)}
          subtitle={`${summary.decidedCount} ${t('competitiveList.detail.winner').toLowerCase()}`}
        />
        <MetricCard
          icon={<ShoppingCart size={18} />}
          label={t('competitiveList.detail.bestPrice')}
          value={formatMoneyCompact(summary.totalBestPrice)}
        />
        <MetricCard
          icon={<Award size={18} />}
          label={t('competitiveList.detail.savings')}
          value={formatMoneyCompact(summary.savings)}
          subtitle={t('competitiveList.detail.savingsCoverage', {
            covered: String(summary.coveredPositions),
            total: String(summary.totalPositions),
            percent: summary.coveragePercent.toFixed(0),
            savingsPercent: summary.savingsPercent.toFixed(1),
          })}
        />
      </div>

      {/* Split view */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left panel: spec items */}
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('competitiveList.detail.position')}
              </h2>
            </div>
            <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
              {itemSummaries.length === 0 ? (
                <div className="p-6 text-center">
                  <Package size={32} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('competitiveList.emptyItemsTitle')}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {t('competitiveList.emptyItemsDescription')}
                  </p>
                </div>
              ) : (
                itemSummaries.map(({ item, proposalCount, bestPrice, hasWinner }) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      selectedItemId === item.id && 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="tabular-nums">
                            {new Intl.NumberFormat('ru-RU').format(item.quantity)} {item.unitOfMeasure}
                          </span>
                          <span className="text-neutral-300 dark:text-neutral-600">|</span>
                          <span className="tabular-nums">{formatMoney(item.plannedAmount)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {hasWinner && (
                          <Trophy size={14} className="text-warning-500" />
                        )}
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full',
                          proposalCount > 0
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                        )}
                        title={
                          cl?.minProposalsRequired
                            ? t('competitiveList.detail.proposalsCount', {
                              count: String(proposalCount),
                              required: String(cl.minProposalsRequired),
                            })
                            : t('competitiveList.detail.proposalsOnly', { count: String(proposalCount) })
                        }
                        aria-label={
                          cl?.minProposalsRequired
                            ? t('competitiveList.detail.proposalsCount', {
                              count: String(proposalCount),
                              required: String(cl.minProposalsRequired),
                            })
                            : t('competitiveList.detail.proposalsOnly', { count: String(proposalCount) })
                        }
                        >
                          {proposalCount}
                          {cl?.minProposalsRequired ? `/${cl.minProposalsRequired} ${t('competitiveList.detail.minShort')}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <SupplyStatusIndicator
                        proposalCount={proposalCount}
                        hasWinner={hasWinner}
                        minRequired={cl?.minProposalsRequired ?? 1}
                      />
                      {bestPrice > 0 && (
                        <span className="text-xs text-success-600 dark:text-success-400 font-medium">
                          {formatMoney(bestPrice)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right panel: proposals table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {selectedItemId && selectedSpecItem ? (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {t('competitiveList.detail.proposals')}
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                      {selectedSpecItem.name} &mdash; {new Intl.NumberFormat('ru-RU').format(selectedSpecItem.quantity)} {selectedSpecItem.unitOfMeasure}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<Plus size={14} />}
                    onClick={handleOpenAddModal}
                    disabled={cl?.status === 'APPROVED' || cl?.status === 'DECIDED'}
                  >
                    {t('competitiveList.detail.addProposal')}
                  </Button>
                </div>

                {/* Proposals table */}
                {selectedItemEntries.length === 0 ? (
                  <div className="p-10 text-center">
                    <CreditCard size={36} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t('competitiveList.emptyTitle')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {t('competitiveList.emptyDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.vendor')}
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.price')}
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.total')}
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.deliveryDays')}
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.prepayment')}
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.warranty')}
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.entry.score')}
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('competitiveList.colStatus')}
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {t('common.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItemEntries.map((entry) => {
                          const isBestPrice =
                            selectedItemEntries.length > 1 &&
                            entry.unitPrice === Math.min(...selectedItemEntries.map((e) => e.unitPrice).filter((p) => p > 0));
                          return (
                            <tr
                              key={entry.id}
                              className={cn(
                                'border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                                'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                                entry.isWinner && 'bg-success-50/50 dark:bg-success-900/10',
                              )}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {entry.isWinner && <Trophy size={14} className="text-warning-500 flex-shrink-0" />}
                                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {entry.vendorName || '---'}
                                  </span>
                                </div>
                                {entry.selectionReason && (
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 italic">
                                    {entry.selectionReason}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                <span className="inline-flex items-center gap-1.5">
                                  <PriceIndicator
                                    price={entry.unitPrice}
                                    allPrices={selectedItemEntries.map((e) => e.unitPrice)}
                                  />
                                  <span className={cn(
                                    'font-medium',
                                    isBestPrice
                                      ? 'text-success-600 dark:text-success-400'
                                      : 'text-neutral-900 dark:text-neutral-100',
                                  )}>
                                    {formatMoney(entry.unitPrice)}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                {formatMoney(entry.totalPrice)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                {entry.deliveryDays != null ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={12} className="text-neutral-400" />
                                    {entry.deliveryDays}
                                  </span>
                                ) : '---'}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                {entry.prepaymentPercent != null ? `${entry.prepaymentPercent}%` : '---'}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                {entry.warrantyMonths != null ? `${entry.warrantyMonths} ${t('competitiveList.entry.months')}` : '---'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {entry.score != null ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                                    <span className={cn(
                                      'px-2 py-0.5 rounded-full',
                                      entry.rankPosition === 1
                                        ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                                    )}>
                                      {entry.score.toFixed(1)}
                                      {entry.rankPosition != null && ` (#${entry.rankPosition})`}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-neutral-400">---</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {entry.isWinner ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                                    <Trophy size={12} />
                                    {t('competitiveList.detail.winner')}
                                  </span>
                                ) : (
                                  <span className="text-xs text-neutral-400 dark:text-neutral-500">---</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {!entry.isWinner && cl?.status !== 'APPROVED' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenWinnerModal(entry.id)}
                                        title={t('competitiveList.detail.selectWinner')}
                                        className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                                      >
                                        <Award size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteEntryMutation.mutate(entry.id)}
                                        title={t('common.delete')}
                                        className="p-1.5 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded transition-colors"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="p-10 text-center">
                <ChevronRight size={36} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('competitiveList.detail.position')}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('competitiveList.detail.selectPositionHint')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Proposal Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('competitiveList.detail.addProposal')}
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={addEntryMutation.isPending}
              onClick={handleAddProposal}
              disabled={!form.vendorName || !form.unitPrice}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('competitiveList.entry.vendor')} required>
            <Input
              value={form.vendorName}
              onChange={(e) => setForm((prev) => ({ ...prev, vendorName: e.target.value }))}
              placeholder={t('competitiveList.entry.vendor')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('competitiveList.entry.price')} required>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="0.00"
              />
            </FormField>
            <FormField label={t('competitiveList.entry.quantity')}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder={String(selectedSpecItem?.quantity ?? '')}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('competitiveList.entry.deliveryDays')}>
              <Input
                type="number"
                min="0"
                value={form.deliveryDays}
                onChange={(e) => setForm((prev) => ({ ...prev, deliveryDays: e.target.value }))}
                placeholder="0"
              />
            </FormField>
            <FormField label={t('competitiveList.entry.paymentTerms')}>
              <Input
                value={form.paymentTerms}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('competitiveList.entry.prepayment')}>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.prepaymentPercent}
                onChange={(e) => setForm((prev) => ({ ...prev, prepaymentPercent: e.target.value }))}
                placeholder="0"
              />
            </FormField>
            <FormField label={t('competitiveList.entry.paymentDelay')}>
              <Input
                type="number"
                min="0"
                value={form.paymentDelayDays}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentDelayDays: e.target.value }))}
                placeholder="0"
              />
            </FormField>
            <FormField label={t('competitiveList.entry.warranty')}>
              <Input
                type="number"
                min="0"
                value={form.warrantyMonths}
                onChange={(e) => setForm((prev) => ({ ...prev, warrantyMonths: e.target.value }))}
                placeholder="0"
              />
            </FormField>
          </div>
          <FormField label={t('common.notes')}>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </FormField>
        </div>
      </Modal>

      {/* Select Winner Modal */}
      <Modal
        open={winnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        title={t('competitiveList.detail.selectWinner')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setWinnerModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="success"
              size="sm"
              iconLeft={<Trophy size={14} />}
              loading={selectWinnerMutation.isPending}
              onClick={handleConfirmWinner}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('competitiveList.detail.selectWinner')}
          </p>
          <FormField label={t('common.notes')}>
            <Textarea
              value={winnerReason}
              onChange={(e) => setWinnerReason(e.target.value)}
              rows={3}
              placeholder={t('common.notes')}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default CompetitiveListPage;
