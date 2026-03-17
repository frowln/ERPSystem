import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { financeApi } from '@/api/finance';
import { specificationsApi } from '@/api/specifications';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { PageHeader } from '@/design-system/components/PageHeader';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import type { CompetitiveList, CompetitiveListEntry, SpecItem } from '@/types';
import { buildMatrix, filterRows, type CoverageFilter } from './lib/matrixBuilder';
import { ClPageHeader } from './components/ClPageHeader';
import { ClKpiStrip } from './components/ClKpiStrip';
import { ClToolbar } from './components/ClToolbar';
import { SupplierMatrixView } from './components/SupplierMatrixView';
import { ProcurementSummaryView } from './components/ProcurementSummaryView';
import { InvoiceImportWizard } from './components/InvoiceImportWizard';
import { ClEntryFormModal } from './components/ClEntryFormModal';
import { ClWinnerModal } from './components/ClWinnerModal';
import { INITIAL_FORM, type ProposalFormData } from './components/ClTypes';

export default function CompetitiveListPage() {
  const { specId, id } = useParams<{ specId: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();
  const isNew = id === 'new';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [view, setView] = useState<'matrix' | 'summary'>('matrix');
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>('all');
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalSpecItemId, setAddModalSpecItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ProposalFormData>(INITIAL_FORM);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [winnerReason, setWinnerReason] = useState('');

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data: specification } = useQuery({
    queryKey: ['SPECIFICATION', specId],
    queryFn: () => specificationsApi.getSpecification(specId!),
    enabled: !!specId,
  });

  const { data: specItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['spec-items', specId],
    queryFn: () => specificationsApi.getSpecItems(specId!),
    enabled: !!specId,
  });

  const { data: competitiveList, isLoading: clLoading, isError: clError } = useQuery({
    queryKey: ['competitive-list', id],
    queryFn: () => financeApi.getCompetitiveList(id!),
    enabled: !!id && !isNew,
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['competitive-list-entries', id],
    queryFn: () => financeApi.getCompetitiveListEntries(id!),
    enabled: !!id && !isNew,
  });

  const isLoading = clLoading || itemsLoading || entriesLoading;

  // ---------------------------------------------------------------------------
  // Auto-create or redirect to existing CL
  // ---------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (data: { specificationId: string; name: string }) =>
      financeApi.createCompetitiveList(data),
    onSuccess: (cl) => {
      navigate(`/specifications/${specId}/competitive-list/${cl.id}`, { replace: true });
    },
    onError: () => toast.error(t('common.error')),
  });

  const [checkedExisting, setCheckedExisting] = useState(false);

  React.useEffect(() => {
    if (!isNew || !specId || !specification || createMutation.isPending || checkedExisting) return;

    setCheckedExisting(true);

    // Check if a CL already exists for this specification
    financeApi.getCompetitiveListsBySpec(specId).then((existing) => {
      if (existing.length > 0) {
        // Redirect to the first (most recent) existing CL
        navigate(`/specifications/${specId}/competitive-list/${existing[0].id}`, { replace: true });
      } else {
        // No existing CL — create one
        createMutation.mutate({
          specificationId: specId,
          name: `${t('competitiveList.title')} — ${specification.name ?? ''}`,
        });
      }
    }).catch(() => {
      // Fallback: create new if check fails
      createMutation.mutate({
        specificationId: specId,
        name: `${t('competitiveList.title')} — ${specification.name ?? ''}`,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, specId, specification]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['competitive-list', id] });
    queryClient.invalidateQueries({ queryKey: ['competitive-list-entries', id] });
  }, [queryClient, id]);

  const statusMutation = useMutation({
    mutationFn: (status: string) => financeApi.changeCompetitiveListStatus(id!, status),
    onSuccess: invalidate,
    onError: () => toast.error(t('common.error')),
  });

  const addEntryMutation = useMutation({
    mutationFn: (data: Partial<CompetitiveListEntry>) => financeApi.addCompetitiveListEntry(id!, data),
    onSuccess: () => {
      toast.success(t('competitiveList.toasts.entryAdded'));
      invalidate();
      setAddModalOpen(false);
      setForm(INITIAL_FORM);
    },
    onError: () => toast.error(t('common.error')),
  });

  const selectWinnerMutation = useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason?: string }) =>
      financeApi.selectCompetitiveListWinner(id!, entryId, reason),
    onSuccess: () => {
      toast.success(t('competitiveList.toasts.winnerSelected'));
      invalidate();
      setWinnerModalOpen(false);
      setSelectedEntryId(null);
      setWinnerReason('');
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => financeApi.deleteCompetitiveListEntry(id!, entryId),
    onSuccess: invalidate,
    onError: () => toast.error(t('common.error')),
  });

  const autoRankMutation = useMutation({
    mutationFn: () => financeApi.autoRankEntries(id!),
    onSuccess: () => {
      toast.success(t('competitiveList.toasts.autoRanked'));
      invalidate();
    },
    onError: () => toast.error(t('common.error')),
  });

  const autoSelectMutation = useMutation({
    mutationFn: () => financeApi.autoSelectBestPrices(id!),
    onSuccess: () => {
      toast.success(t('competitiveList.toasts.autoSelected'));
      invalidate();
    },
    onError: () => toast.error(t('common.error')),
  });

  const sendRfqMutation = useMutation({
    mutationFn: () => {
      const vendorIds = [...new Set(entries.map(e => e.vendorId).filter(Boolean) as string[])];
      return financeApi.sendRfq(id!, vendorIds);
    },
    onSuccess: () => toast.success(t('competitiveList.rfqSent')),
    onError: () => toast.error(t('common.error')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ entryId, type }: { entryId: string; type: string }) =>
      financeApi.rejectEntry(id!, entryId, type),
    onSuccess: invalidate,
    onError: () => toast.error(t('common.error')),
  });

  const unrejectMutation = useMutation({
    mutationFn: (entryId: string) => financeApi.unrejectEntry(id!, entryId),
    onSuccess: invalidate,
    onError: () => toast.error(t('common.error')),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (bulkEntries: { specItemId: string; vendorName: string; unitPrice: number; quantity: number }[]) =>
      financeApi.bulkAddEntries(id!, bulkEntries.map(e => ({
        specItemId: e.specItemId,
        vendorName: e.vendorName,
        unitPrice: e.unitPrice,
        quantity: e.quantity,
      }))),
    onSuccess: () => {
      toast.success(t('competitiveList.toasts.entryAdded'));
      invalidate();
      setImportWizardOpen(false);
    },
    onError: () => toast.error(t('common.error')),
  });

  // ---------------------------------------------------------------------------
  // Matrix computation
  // ---------------------------------------------------------------------------
  const matrix = useMemo(() => buildMatrix(specItems, entries), [specItems, entries]);

  const sections = useMemo(
    () => matrix.sections.map(s => s.sectionName).filter(Boolean),
    [matrix],
  );

  const filteredRows = useMemo(
    () => filterRows(matrix.flatRows, search, sectionFilter, coverageFilter),
    [matrix.flatRows, search, sectionFilter, coverageFilter],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSelectWinner = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
    setWinnerModalOpen(true);
  }, []);

  const handleConfirmWinner = useCallback(() => {
    if (!selectedEntryId) return;
    selectWinnerMutation.mutate({ entryId: selectedEntryId, reason: winnerReason });
  }, [selectedEntryId, winnerReason, selectWinnerMutation]);

  const handleAddProposal = useCallback((specItemId: string, vendorName?: string) => {
    setAddModalSpecItemId(specItemId);
    setForm({ ...INITIAL_FORM, vendorName: vendorName ?? '' });
    setAddModalOpen(true);
  }, []);

  const handleSubmitProposal = useCallback(() => {
    if (!addModalSpecItemId) return;
    const item = specItems.find(s => s.id === addModalSpecItemId);
    addEntryMutation.mutate({
      specItemId: addModalSpecItemId,
      vendorName: form.vendorName,
      unitPrice: parseFloat(form.unitPrice) || 0,
      quantity: parseFloat(form.quantity) || item?.quantity || 0,
      deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays) : undefined,
      paymentTerms: form.paymentTerms || undefined,
      prepaymentPercent: form.prepaymentPercent ? parseFloat(form.prepaymentPercent) : undefined,
      paymentDelayDays: form.paymentDelayDays ? parseInt(form.paymentDelayDays) : undefined,
      warrantyMonths: form.warrantyMonths ? parseInt(form.warrantyMonths) : undefined,
      notes: form.notes || undefined,
    });
  }, [addModalSpecItemId, form, specItems, addEntryMutation]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    const ok = await confirm({
      title: t('competitiveList.matrix.confirmDeleteTitle'),
      description: t('competitiveList.matrix.confirmDeleteDesc'),
      confirmLabel: t('common.delete'),
      confirmVariant: 'danger',
      items: entry ? [`${entry.vendorName ?? entry.supplierName} — ${formatMoney(entry.unitPrice)}`] : undefined,
    });
    if (ok) deleteEntryMutation.mutate(entryId);
  }, [confirm, entries, deleteEntryMutation]);

  const handleExport = useCallback(() => {
    const wsData: any[][] = [
      [
        t('competitiveList.matrix.colPosition'),
        t('competitiveList.matrix.colQty'),
        ...matrix.vendorKeys,
        t('competitiveList.matrix.colSelected'),
      ],
    ];
    for (const row of filteredRows) {
      wsData.push([
        row.item.name,
        `${row.item.quantity} ${row.item.unitOfMeasure}`,
        ...matrix.vendorKeys.map(vk => {
          const c = row.cells.get(vk);
          return c ? c.entry.unitPrice : '';
        }),
        row.winnerVendorKey
          ? `${row.cells.get(row.winnerVendorKey)?.entry.unitPrice ?? ''} (${row.winnerVendorKey})`
          : '',
      ]);
    }
    // Add totals row
    wsData.push([
      t('competitiveList.matrix.totals'),
      '',
      ...matrix.vendors.map(v => v.grandTotal || ''),
      matrix.kpi.totalSelected || '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matrix');
    XLSX.writeFile(wb, `competitive-list-${id}.xlsx`);
  }, [matrix, filteredRows, id]);

  const isApproved = competitiveList?.status === 'APPROVED';
  const hasEntries = entries.length > 0;
  const hasWinner = entries.some(e => e.isWinner);

  // ---------------------------------------------------------------------------
  // Loading / creating state
  // ---------------------------------------------------------------------------
  if (isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">{t('competitiveList.creating')}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <PageSkeleton variant="list" />
      </div>
    );
  }

  if (clError || !competitiveList) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader
          title={t('competitiveList.matrix.notFound')}
          backTo={`/specifications/${specId}`}
        />
        <div className="text-center py-16">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('competitiveList.matrix.notFoundDesc')}
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4 p-4 md:p-6">
      <ClPageHeader
        name={competitiveList.name ?? competitiveList.title ?? t('competitiveList.title')}
        specId={specId!}
        status={competitiveList.status}
        hasEntries={hasEntries}
        hasWinner={hasWinner}
        canCreatePO={hasWinner}
        onStatusChange={(s) => statusMutation.mutate(s)}
        onAutoRank={() => autoRankMutation.mutate()}
        onAutoSelect={() => autoSelectMutation.mutate()}
        onAutoSelectByRatio={() => {
          autoRankMutation.mutateAsync().then(() => autoSelectMutation.mutate());
        }}
        onCreatePurchaseOrder={() => {/* TODO: navigate to PO creation */}}
        onSendRfq={() => sendRfqMutation.mutate()}
        onImportInvoice={() => setImportWizardOpen(true)}
        onExport={handleExport}
        statusPending={statusMutation.isPending}
        autoRankPending={autoRankMutation.isPending}
        autoSelectPending={autoSelectMutation.isPending}
        rfqPending={sendRfqMutation.isPending}
      />

      <ClKpiStrip kpi={matrix.kpi} />

      <ClToolbar
        search={search}
        onSearchChange={setSearch}
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        coverageFilter={coverageFilter}
        onCoverageFilterChange={setCoverageFilter}
        sections={sections}
        view={view}
        onViewChange={setView}
      />

      {view === 'matrix' ? (
        specItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {t('competitiveList.emptyItemsTitle')}
            </p>
            <p className="text-neutral-400 text-xs mt-1">
              {t('competitiveList.emptyItemsDescription')}
            </p>
          </div>
        ) : (
          <SupplierMatrixView
            matrix={matrix}
            filteredRows={filteredRows}
            onSelectWinner={handleSelectWinner}
            onRejectEntry={(entryId, type) => rejectMutation.mutate({ entryId, type })}
            onUnrejectEntry={(entryId) => unrejectMutation.mutate(entryId)}
            onDeleteEntry={handleDeleteEntry}
            onAddProposal={handleAddProposal}
            disabled={isApproved}
          />
        )
      ) : (
        <ProcurementSummaryView
          matrix={matrix}
          filteredRows={filteredRows}
          onExportExcel={handleExport}
          onCreateCp={() => {/* TODO: navigate to CP creation */}}
        />
      )}

      {/* Add proposal modal */}
      <ClEntryFormModal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); setForm(INITIAL_FORM); }}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmitProposal}
        isPending={addEntryMutation.isPending}
        defaultQuantity={
          addModalSpecItemId
            ? String(specItems.find(s => s.id === addModalSpecItemId)?.quantity ?? '')
            : ''
        }
      />

      {/* Winner selection modal */}
      <ClWinnerModal
        open={winnerModalOpen}
        onClose={() => { setWinnerModalOpen(false); setSelectedEntryId(null); setWinnerReason(''); }}
        winnerReason={winnerReason}
        onReasonChange={setWinnerReason}
        onConfirm={handleConfirmWinner}
        isPending={selectWinnerMutation.isPending}
      />

      {/* Invoice import wizard */}
      <InvoiceImportWizard
        open={importWizardOpen}
        onClose={() => setImportWizardOpen(false)}
        specItems={specItems}
        onImport={(importEntries) => bulkImportMutation.mutate(importEntries)}
        isPending={bulkImportMutation.isPending}
      />
    </div>
  );
}
