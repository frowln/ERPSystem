import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Link2, Pencil, Package, Unlink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import ContractCoverageBar from './ContractCoverageBar';
import type { ContractBudgetItem, ContractDirection, FinanceExpenseItem } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContractBudgetItemsTabProps {
  contractId: string;
  projectId?: string;
  contractDirection?: ContractDirection;
}

interface PendingLink {
  id: string;
  budgetItemId: string;
  budgetItemLabel: string;
  allocatedQuantity?: number;
  allocatedAmount?: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ContractBudgetItemsTab: React.FC<ContractBudgetItemsTabProps> = ({
  contractId,
  projectId,
  contractDirection,
}) => {
  const queryClient = useQueryClient();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState('');
  const [allocatedQuantityInput, setAllocatedQuantityInput] = useState('');
  const [allocatedAmountInput, setAllocatedAmountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantityInput, setEditQuantityInput] = useState('');
  const [editAmountInput, setEditAmountInput] = useState('');
  const [editNotesInput, setEditNotesInput] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['contract-budget-items', contractId],
    queryFn: () => financeApi.getContractBudgetItems(contractId),
    enabled: !!contractId,
  });

  const { data: candidateResponse, isLoading: candidatesLoading } = useQuery({
    queryKey: ['contract-budget-item-candidates', projectId],
    queryFn: () => financeApi.getExpenses({ projectId: projectId!, size: 2000 }),
    enabled: !!projectId,
  });

  const candidates = useMemo(() => {
    const list = (candidateResponse?.content ?? []) as FinanceExpenseItem[];
    return list
      .filter((item) => !item.section)
      .sort((a, b) => {
        const markA = a.disciplineMark ?? '';
        const markB = b.disciplineMark ?? '';
        if (markA !== markB) return markA.localeCompare(markB, 'ru');
        return a.name.localeCompare(b.name, 'ru');
      });
  }, [candidateResponse]);

  const candidateById = useMemo(
    () => new Map(candidates.map((item) => [item.id, item])),
    [candidates],
  );

  const linkedBudgetItemIds = useMemo(
    () => new Set(items.map((item) => item.budgetItemId)),
    [items],
  );

  const pendingBudgetItemIds = useMemo(
    () => new Set(pendingLinks.map((item) => item.budgetItemId)),
    [pendingLinks],
  );

  const selectableCandidates = useMemo(
    () => candidates.filter((item) => !linkedBudgetItemIds.has(item.id) && !pendingBudgetItemIds.has(item.id)),
    [candidates, linkedBudgetItemIds, pendingBudgetItemIds],
  );

  const selectedCandidate = selectedBudgetItemId
    ? candidateById.get(selectedBudgetItemId)
    : undefined;

  const { data: selectedCoverage, isLoading: coverageLoading } = useQuery({
    queryKey: ['budget-item-coverage', selectedBudgetItemId],
    queryFn: () => financeApi.getBudgetItemCoverage(selectedBudgetItemId),
    enabled: !!selectedBudgetItemId,
  });

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId),
    [items, editingId],
  );

  const { data: editingCoverage } = useQuery({
    queryKey: ['budget-item-coverage', editingItem?.budgetItemId],
    queryFn: () => financeApi.getBudgetItemCoverage(editingItem!.budgetItemId),
    enabled: !!editingItem?.budgetItemId,
  });

  const remainingQuantity = useMemo(() => {
    if (!selectedCoverage) {
      return null;
    }
    const total = toSafeNumber(selectedCoverage.totalQuantity);
    const allocated = toSafeNumber(selectedCoverage.allocatedQuantity);
    return Math.max(total - allocated, 0);
  }, [selectedCoverage]);

  const remainingAmountByCoverage = useMemo(() => {
    if (!selectedCoverage) {
      return null;
    }
    const totalAmount = toSafeNumber(selectedCoverage.totalAmount);
    const allocatedAmount = toSafeNumber(selectedCoverage.allocatedAmount);
    return Math.max(totalAmount - allocatedAmount, 0);
  }, [selectedCoverage]);

  const remainingPlannedAmount = useMemo(() => {
    if (!selectedCandidate) {
      return null;
    }
    const planned = toSafeNumber(selectedCandidate.plannedAmount);
    const contracted = toSafeNumber(selectedCandidate.contractedAmount);
    return Math.max(planned - contracted, 0);
  }, [selectedCandidate]);

  const amountCoveragePercent = useMemo(() => {
    if (!selectedCoverage) {
      return null;
    }
    const raw = selectedCoverage.amountCoveragePercent;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }

    const totalAmount = toSafeNumber(selectedCoverage.totalAmount);
    const allocatedAmount = toSafeNumber(selectedCoverage.allocatedAmount);
    if (totalAmount <= 0) {
      return 0;
    }
    return (allocatedAmount / totalAmount) * 100;
  }, [selectedCoverage]);

  const linkMutation = useMutation({
    mutationFn: (payloads: {
      budgetItemId: string;
      allocatedQuantity?: number;
      allocatedAmount?: number;
      notes?: string;
    }[]) => financeApi.linkContractBudgetItems(contractId, payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-budget-items', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-budget-item-candidates', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-budget-expenses', projectId] });
      if (selectedBudgetItemId) {
        queryClient.invalidateQueries({ queryKey: ['budget-item-coverage', selectedBudgetItemId] });
      }
      toast.success(t('contracts.budgetItems.linkSuccess'));
      setSelectedBudgetItemId('');
      setAllocatedQuantityInput('');
      setAllocatedAmountInput('');
      setNotesInput('');
      setFormError(null);
      setBatchError(null);
      setPendingLinks([]);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      linkId: string;
      allocatedQuantity?: number;
      allocatedAmount?: number;
      notes?: string;
      budgetItemId: string;
    }) => financeApi.updateContractBudgetItem(contractId, payload.linkId, {
      allocatedQuantity: payload.allocatedQuantity,
      allocatedAmount: payload.allocatedAmount,
      notes: payload.notes,
    }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-budget-items', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-budget-item-candidates', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-budget-expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['budget-item-coverage', variables.budgetItemId] });
      toast.success(t('contracts.budgetItems.updateSuccess'));
      resetEditState();
    },
    onError: (error) => {
      const message = extractErrorMessage(error);
      setEditError(message);
      toast.error(message);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => financeApi.unlinkContractBudgetItem(contractId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-budget-items', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-budget-item-candidates', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-budget-expenses', projectId] });
      toast.success(t('contracts.budgetItems.unlinkSuccess'));
      setUnlinkingId(null);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
      setUnlinkingId(null);
    },
  });

  const handleUnlink = (item: ContractBudgetItem) => {
    if (unlinkingId === item.id) {
      unlinkMutation.mutate(item.id);
    } else {
      setUnlinkingId(item.id);
    }
  };

  function resetEditState() {
    setEditingId(null);
    setEditQuantityInput('');
    setEditAmountInput('');
    setEditNotesInput('');
    setEditError(null);
  }

  const startEdit = (item: ContractBudgetItem) => {
    setUnlinkingId(null);
    setEditingId(item.id);
    setEditQuantityInput(String(toSafeNumber(item.allocatedQuantity)));
    setEditAmountInput(String(toSafeNumber(item.allocatedAmount)));
    setEditNotesInput(item.notes ?? '');
    setEditError(null);
  };

  const handleEditSave = () => {
    if (!editingItem) {
      return;
    }

    const quantity = parseInputNumber(editQuantityInput);
    const amount = parseInputNumber(editAmountInput);

    if (Number.isNaN(quantity) || Number.isNaN(amount)) {
      setEditError(t('contracts.budgetItems.errorInvalidNumber'));
      return;
    }

    if (quantity < 0 || amount < 0) {
      setEditError(t('contracts.budgetItems.errorNegativeValues'));
      return;
    }

    if (quantity === 0 && amount === 0) {
      setEditError(t('contracts.budgetItems.errorQuantityOrAmountRequired'));
      return;
    }

    if (editingCoverage) {
      const total = toSafeNumber(editingCoverage.totalQuantity);
      const allocated = toSafeNumber(editingCoverage.allocatedQuantity);
      const availableForUpdate = Math.max(total - allocated, 0) + toSafeNumber(editingItem.allocatedQuantity);
      if (quantity > availableForUpdate + 0.000001) {
        setEditError(t('contracts.budgetItems.errorQuantityExceedsCoverage'));
        return;
      }

      const totalAmount = toSafeNumber(editingCoverage.totalAmount);
      const allocatedAmount = toSafeNumber(editingCoverage.allocatedAmount);
      if (totalAmount > 0) {
        const availableAmount = Math.max(totalAmount - allocatedAmount, 0) + toSafeNumber(editingItem.allocatedAmount);
        if (amount > availableAmount + 0.005) {
          setEditError(t('contracts.budgetItems.errorAmountExceedsCoverage'));
          return;
        }
      }
    }

    updateMutation.mutate({
      linkId: editingItem.id,
      budgetItemId: editingItem.budgetItemId,
      allocatedQuantity: quantity,
      allocatedAmount: amount,
      notes: editNotesInput.trim() || undefined,
    });
  };

  const totalAllocated = items.reduce((sum, item) => sum + (item.allocatedAmount ?? 0), 0);

  const selectOptions = useMemo(
    () => selectableCandidates.map((item) => ({
      value: item.id,
      label: formatCandidateLabel(item),
    })),
    [selectableCandidates],
  );

  const handleSelectBudgetItem = (value: string) => {
    setSelectedBudgetItemId(value);
    setFormError(null);
    setBatchError(null);

    if (!value) {
      setAllocatedQuantityInput('');
      setAllocatedAmountInput('');
      setNotesInput('');
      return;
    }

    const candidate = candidateById.get(value);
    if (!candidate) {
      setAllocatedQuantityInput('');
      setAllocatedAmountInput('');
      return;
    }

    const defaultQty = toSafeNumber(candidate.quantity);
    const defaultAmount = Math.max(
      toSafeNumber(candidate.plannedAmount) - toSafeNumber(candidate.contractedAmount),
      0,
    );
    setAllocatedQuantityInput(defaultQty > 0 ? String(defaultQty) : '');
    setAllocatedAmountInput(defaultAmount > 0 ? String(defaultAmount) : '');
  };

  const resetDraftInputs = () => {
    setSelectedBudgetItemId('');
    setAllocatedQuantityInput('');
    setAllocatedAmountInput('');
    setNotesInput('');
  };

  const handleAddToBatch = () => {
    setFormError(null);
    setBatchError(null);

    if (!projectId) {
      setFormError(t('contracts.budgetItems.errorProjectRequired'));
      return;
    }

    if (!selectedBudgetItemId) {
      setFormError(t('contracts.budgetItems.errorSelectItem'));
      return;
    }

    const quantity = parseInputNumber(allocatedQuantityInput);
    const amount = parseInputNumber(allocatedAmountInput);

    if (Number.isNaN(quantity) || Number.isNaN(amount)) {
      setFormError(t('contracts.budgetItems.errorInvalidNumber'));
      return;
    }

    if (quantity < 0 || amount < 0) {
      setFormError(t('contracts.budgetItems.errorNegativeValues'));
      return;
    }

    if (quantity === 0 && amount === 0) {
      setFormError(t('contracts.budgetItems.errorQuantityOrAmountRequired'));
      return;
    }

    if (remainingQuantity !== null && quantity > remainingQuantity + 0.000001) {
      setFormError(t('contracts.budgetItems.errorQuantityExceedsCoverage'));
      return;
    }

    if (remainingAmountByCoverage !== null && amount > remainingAmountByCoverage + 0.005) {
      setFormError(t('contracts.budgetItems.errorAmountExceedsCoverage'));
      return;
    }

    if (pendingBudgetItemIds.has(selectedBudgetItemId)) {
      setFormError(t('contracts.budgetItems.errorDuplicateInBatch'));
      return;
    }

    const candidate = candidateById.get(selectedBudgetItemId);
    if (!candidate) {
      setFormError(t('contracts.budgetItems.errorSelectItem'));
      return;
    }

    setPendingLinks((prev) => [
      ...prev,
      {
        id: createPendingId(),
        budgetItemId: selectedBudgetItemId,
        budgetItemLabel: formatCandidateLabel(candidate),
        allocatedQuantity: quantity > 0 ? quantity : undefined,
        allocatedAmount: amount > 0 ? amount : undefined,
        notes: notesInput.trim() || undefined,
      },
    ]);
    resetDraftInputs();
  };

  const handleRemoveFromBatch = (pendingId: string) => {
    setPendingLinks((prev) => prev.filter((row) => row.id !== pendingId));
    setBatchError(null);
  };

  const handleLinkBatch = async () => {
    setBatchError(null);
    setFormError(null);

    if (pendingLinks.length === 0) {
      setBatchError(t('contracts.budgetItems.errorBatchEmpty'));
      return;
    }

    try {
      const coveragePairs = await Promise.all(
        pendingLinks.map(async (row) => ({
          row,
          coverage: await financeApi.getBudgetItemCoverage(row.budgetItemId),
        })),
      );

      for (const pair of coveragePairs) {
        const qty = pair.row.allocatedQuantity ?? 0;
        const amount = pair.row.allocatedAmount ?? 0;

        const totalQty = toSafeNumber(pair.coverage.totalQuantity);
        const allocatedQty = toSafeNumber(pair.coverage.allocatedQuantity);
        if (totalQty > 0 && qty > Math.max(totalQty - allocatedQty, 0) + 0.000001) {
          setBatchError(`${pair.row.budgetItemLabel}: ${t('contracts.budgetItems.errorQuantityExceedsCoverage')}`);
          return;
        }

        const totalAmount = toSafeNumber(pair.coverage.totalAmount);
        const allocatedAmount = toSafeNumber(pair.coverage.allocatedAmount);
        if (totalAmount > 0 && amount > Math.max(totalAmount - allocatedAmount, 0) + 0.005) {
          setBatchError(`${pair.row.budgetItemLabel}: ${t('contracts.budgetItems.errorAmountExceedsCoverage')}`);
          return;
        }
      }

      linkMutation.mutate(
        pendingLinks.map((row) => ({
          budgetItemId: row.budgetItemId,
          allocatedQuantity: row.allocatedQuantity,
          allocatedAmount: row.allocatedAmount,
          notes: row.notes,
        })),
      );
    } catch (error) {
      const message = extractErrorMessage(error);
      setBatchError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {t('contracts.budgetItems.linkTitle')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('contracts.budgetItems.linkHint', {
                direction: contractDirection === 'CLIENT'
                  ? t('forms.contract.directionClient')
                  : t('forms.contract.directionContractor'),
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddToBatch}
              disabled={!projectId || selectableCandidates.length === 0 || !selectedBudgetItemId || linkMutation.isPending}
            >
              {t('contracts.budgetItems.addToBatch')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              iconLeft={<Link2 size={14} />}
              onClick={handleLinkBatch}
              loading={linkMutation.isPending}
              disabled={!projectId || pendingLinks.length === 0 || updateMutation.isPending}
            >
              {t('contracts.budgetItems.linkBatchAction', { count: String(pendingLinks.length) })}
            </Button>
          </div>
        </div>

        {!projectId ? (
          <p className="text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
            {t('contracts.budgetItems.errorProjectRequired')}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <FormField label={t('contracts.budgetItems.fieldItem')} required>
                <Select
                  value={selectedBudgetItemId}
                  onChange={(event) => handleSelectBudgetItem(event.target.value)}
                  options={selectOptions}
                  placeholder={
                    candidatesLoading
                      ? t('common.loading')
                      : t('contracts.budgetItems.fieldItemPlaceholder')
                  }
                  disabled={candidatesLoading || selectableCandidates.length === 0}
                />
              </FormField>

              <FormField
                label={t('contracts.budgetItems.fieldQuantity')}
                hint={remainingQuantity !== null
                  ? t('contracts.budgetItems.fieldQuantityHint', {
                    value: formatNumber(remainingQuantity),
                  })
                  : undefined}
              >
                <Input
                  inputMode="decimal"
                  value={allocatedQuantityInput}
                  onChange={(event) => {
                    setAllocatedQuantityInput(event.target.value);
                    setFormError(null);
                    setBatchError(null);
                  }}
                  placeholder="0"
                />
              </FormField>

              <FormField
                label={t('contracts.budgetItems.fieldAmount')}
                hint={(() => {
                  if (remainingAmountByCoverage !== null) {
                    return t('contracts.budgetItems.fieldAmountHint', {
                      value: formatMoney(remainingAmountByCoverage),
                    });
                  }
                  if (remainingPlannedAmount !== null) {
                    return t('contracts.budgetItems.fieldAmountHint', {
                      value: formatMoney(remainingPlannedAmount),
                    });
                  }
                  return undefined;
                })()}
              >
                <Input
                  inputMode="decimal"
                  value={allocatedAmountInput}
                  onChange={(event) => {
                    setAllocatedAmountInput(event.target.value);
                    setFormError(null);
                    setBatchError(null);
                  }}
                  placeholder="0"
                />
              </FormField>
            </div>

            <FormField label={t('contracts.budgetItems.fieldNotes')}>
              <Textarea
                value={notesInput}
                onChange={(event) => {
                  setNotesInput(event.target.value);
                  setFormError(null);
                  setBatchError(null);
                }}
                placeholder={t('contracts.budgetItems.fieldNotesPlaceholder')}
                className="min-h-[72px]"
              />
            </FormField>

            {selectedCandidate && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <MetricHint
                  label={t('contracts.budgetItems.metricPlanned')}
                  value={formatMoney(toSafeNumber(selectedCandidate.plannedAmount))}
                />
                <MetricHint
                  label={t('contracts.budgetItems.metricContracted')}
                  value={formatMoney(toSafeNumber(selectedCandidate.contractedAmount))}
                />
                <MetricHint
                  label={coverageLoading
                    ? t('common.loading')
                    : t('contracts.budgetItems.metricCoverage')}
                  value={selectedCoverage
                    ? `${formatNumber(toSafeNumber(selectedCoverage.coveragePercent))}%`
                    : '—'}
                />
                <MetricHint
                  label={coverageLoading
                    ? t('common.loading')
                    : t('contracts.budgetItems.metricAmountCoverage')}
                  value={amountCoveragePercent !== null
                    ? `${formatNumber(amountCoveragePercent)}%`
                    : '—'}
                />
              </div>
            )}

            {!candidatesLoading && selectableCandidates.length === 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('contracts.budgetItems.noSelectableItems')}
              </p>
            )}

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-3 py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {t('contracts.budgetItems.batchTitle')} ({pendingLinks.length})
                </p>
              </div>

              {pendingLinks.length === 0 ? (
                <p className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/20">
                  {t('contracts.budgetItems.batchEmpty')}
                </p>
              ) : (
                <div className="max-h-56 overflow-auto bg-neutral-50/60 dark:bg-neutral-900/20">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-neutral-500">
                        <th className="px-3 py-2 text-left font-medium">{t('contracts.budgetItems.colName')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('contracts.budgetItems.colQuantity')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('contracts.budgetItems.colAmount')}</th>
                        <th className="px-3 py-2 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-700/70">
                      {pendingLinks.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{row.budgetItemLabel}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-600">
                            {row.allocatedQuantity ? formatNumber(row.allocatedQuantity) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
                            {row.allocatedAmount ? formatMoney(row.allocatedAmount) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleRemoveFromBatch(row.id)}
                              disabled={linkMutation.isPending}
                              iconLeft={<X size={12} />}
                              title={t('contracts.budgetItems.removeFromBatch')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {batchError && (
          <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
            {batchError}
          </p>
        )}

        {formError && (
          <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('contracts.budgetItems.title')} ({items.length})
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center">
          <Package size={32} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {t('contracts.budgetItems.empty')}
          </p>
        </div>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('contracts.budgetItems.colName')}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('contracts.budgetItems.colQuantity')}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('contracts.budgetItems.colAmount')}
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-28">
                  {t('contracts.budgetItems.colCoverage')}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('contracts.budgetItems.colNotes')}
                </th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                      {item.disciplineMark && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-500 mr-2">
                          {item.disciplineMark}
                        </span>
                      )}
                      {item.budgetItemName || item.budgetItemId}
                      {item.budgetItemUnit && (
                        <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                          ({item.budgetItemUnit})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editQuantityInput}
                          onChange={(event) => {
                            setEditQuantityInput(event.target.value);
                            setEditError(null);
                          }}
                          className="h-8 text-xs text-right"
                        />
                      ) : (
                        formatNumber(item.allocatedQuantity)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-800 dark:text-neutral-200">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editAmountInput}
                          onChange={(event) => {
                            setEditAmountInput(event.target.value);
                            setEditError(null);
                          }}
                          className="h-8 text-xs text-right"
                        />
                      ) : (
                        formatMoney(item.allocatedAmount)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.coveragePercent != null ? (
                        <ContractCoverageBar percent={item.coveragePercent} />
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 max-w-[260px]">
                      {isEditing ? (
                        <Input
                          value={editNotesInput}
                          onChange={(event) => {
                            setEditNotesInput(event.target.value);
                            setEditError(null);
                          }}
                          className="h-8 text-xs"
                          placeholder={t('contracts.budgetItems.fieldNotesPlaceholder')}
                        />
                      ) : (
                        <span className="block truncate">{item.notes || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="success"
                            size="xs"
                            onClick={handleEditSave}
                            loading={updateMutation.isPending}
                            iconLeft={<Check size={12} />}
                            title={t('contracts.budgetItems.save')}
                          />
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={resetEditState}
                            disabled={updateMutation.isPending}
                            iconLeft={<X size={12} />}
                            title={t('contracts.budgetItems.cancel')}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => startEdit(item)}
                            iconLeft={<Pencil size={13} />}
                            title={t('contracts.budgetItems.edit')}
                            disabled={Boolean(editingId) || updateMutation.isPending}
                          />
                          <Button
                            variant={unlinkingId === item.id ? 'danger' : 'ghost'}
                            size="xs"
                            onClick={() => handleUnlink(item)}
                            onBlur={() => {
                              if (unlinkingId === item.id) setUnlinkingId(null);
                            }}
                            loading={unlinkMutation.isPending && unlinkingId === item.id}
                            disabled={Boolean(editingId)}
                            title={
                              unlinkingId === item.id
                                ? t('contracts.budgetItems.unlinkConfirm')
                                : t('contracts.budgetItems.unlink')
                            }
                            iconLeft={<Unlink size={13} />}
                          >
                            {unlinkingId === item.id
                              ? t('contracts.budgetItems.unlinkConfirm')
                              : undefined}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {editError && (
                <tr>
                  <td colSpan={5} className="px-4 py-2.5 text-sm text-danger-600 bg-danger-50 dark:bg-danger-900/20">
                    {editError}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Footer with total */}
            <tfoot>
              <tr className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <td className="px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('contracts.budgetItems.total')}
                </td>
                <td />
                <td
                  className={cn(
                    'px-4 py-2.5 text-right tabular-nums text-sm font-bold',
                    'text-neutral-900 dark:text-neutral-100',
                  )}
                >
                  {formatMoney(totalAllocated)}
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContractBudgetItemsTab;

const parseInputNumber = (value: string): number => {
  const normalized = value.replace(/\s+/g, '').replace(',', '.').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractErrorMessage = (error: unknown): string => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || t('common.error');
};

const formatCandidateLabel = (item: FinanceExpenseItem): string => {
  const mark = item.disciplineMark ? `${item.disciplineMark} · ` : '';
  const qty = formatNumber(toSafeNumber(item.quantity));
  const unit = item.unit ? ` ${item.unit}` : '';
  return `${mark}${item.name} (${qty}${unit})`;
};

const createPendingId = (): string =>
  `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface MetricHintProps {
  label: string;
  value: string;
}

const MetricHint: React.FC<MetricHintProps> = ({ label, value }) => (
  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900">
    <p className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200 tabular-nums">{value}</p>
  </div>
);
