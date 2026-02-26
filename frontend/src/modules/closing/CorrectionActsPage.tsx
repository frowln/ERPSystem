import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  MinusCircle,
  PlusCircle,
  FileText,
  Trash2,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import {
  StatusBadge,
} from '@/design-system/components/StatusBadge';
import { closingApi } from '@/api/closing';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { CorrectionAct, CorrectionActStatus, CorrectionActItem } from './types';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const correctionStatusColorMap: Record<string, string> = {
  draft: 'gray',
  approved: 'green',
  applied: 'blue',
};

const correctionStatusLabels: Record<string, string> = {
  draft: 'closing.correctionActs.statusDraft',
  approved: 'closing.correctionActs.statusApproved',
  applied: 'closing.correctionActs.statusApplied',
};

// ---------------------------------------------------------------------------
// Correction Item Form
// ---------------------------------------------------------------------------

interface CorrectionItemForm {
  workItem: string;
  originalQty: string;
  correctionQty: string;
  unit: string;
}

const DEFAULT_ITEM: CorrectionItemForm = {
  workItem: '',
  originalQty: '0',
  correctionQty: '0',
  unit: '',
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const CorrectionActsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [originalActId, setOriginalActId] = useState('');
  const [reason, setReason] = useState('');
  const [correctionItems, setCorrectionItems] = useState<CorrectionItemForm[]>([
    { ...DEFAULT_ITEM },
  ]);

  const { data: correctionActs, isLoading } = useQuery<CorrectionAct[]>({
    queryKey: ['correction-acts'],
    queryFn: () => closingApi.getCorrectionActs(),
  });

  const { data: ks2List } = useQuery({
    queryKey: ['ks2-documents-select'],
    queryFn: () => closingApi.getKs2Documents({ size: 200 }),
  });

  const actOptions = (ks2List?.content ?? []).map((doc) => ({
    value: doc.id,
    label: `${doc.number} - ${doc.name}`,
  }));

  const items = correctionActs ?? [];

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.number.toLowerCase().includes(lower) ||
        item.originalActNumber.toLowerCase().includes(lower) ||
        item.reason.toLowerCase().includes(lower),
    );
  }, [items, search]);

  const createMutation = useMutation({
    mutationFn: () => {
      const parsedItems = correctionItems
        .filter((ci) => ci.workItem.trim())
        .map((ci) => ({
          originalQty: parseFloat(ci.originalQty) || 0,
          correctionQty: parseFloat(ci.correctionQty) || 0,
          unit: ci.unit,
        }));

      return closingApi.createCorrectionAct({
        originalActId,
        reason,
        items: parsedItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correction-acts'] });
      toast.success(t('closing.correctionActs.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('closing.correctionActs.toastCreateError')),
  });

  const closeModal = () => {
    setShowCreate(false);
    setOriginalActId('');
    setReason('');
    setCorrectionItems([{ ...DEFAULT_ITEM }]);
  };

  const handleAddItem = () => {
    setCorrectionItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
  };

  const handleRemoveItem = (index: number) => {
    setCorrectionItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CorrectionItemForm, value: string) => {
    setCorrectionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const netAmount = useMemo(() => {
    return correctionItems.reduce((sum, ci) => {
      const correction = parseFloat(ci.correctionQty) || 0;
      return sum - Math.abs(correction);
    }, 0);
  }, [correctionItems]);

  const handleCreate = () => {
    if (!originalActId) {
      toast.error(t('closing.correctionActs.validationSelectAct'));
      return;
    }
    if (!reason.trim()) {
      toast.error(t('closing.correctionActs.validationReasonRequired'));
      return;
    }
    const validItems = correctionItems.filter((ci) => ci.workItem.trim());
    if (validItems.length === 0) {
      toast.error(t('closing.correctionActs.validationNoItems'));
      return;
    }
    createMutation.mutate();
  };

  const columns = useMemo<ColumnDef<CorrectionAct, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('closing.correctionActs.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'originalActNumber',
        header: t('closing.correctionActs.colOriginalAct'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('closing.correctionActs.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('closing.correctionActs.colAmount'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span
              className={cn(
                'tabular-nums font-medium text-right block',
                val < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100',
              )}
            >
              {formatMoney(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: t('closing.correctionActs.colReason'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closing.correctionActs.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<CorrectionActStatus>();
          return (
            <StatusBadge
              status={status}
              colorMap={correctionStatusColorMap}
              label={t(correctionStatusLabels[status] ?? status)}
            />
          );
        },
      },
      {
        id: 'itemCount',
        header: t('closing.correctionActs.colItems'),
        size: 80,
        cell: ({ row }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            {row.original.items.length} {t('closing.ks2.posUnit')}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closing.correctionActs.title')}
        subtitle={t('closing.correctionActs.subtitle')}
        breadcrumbs={[
          { label: t('closing.ks2.breadcrumbHome'), href: '/' },
          { label: t('closing.ks2.breadcrumbKs2'), href: '/ks2' },
          { label: t('closing.correctionActs.breadcrumb') },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <PlusCircle size={14} className="mr-1" />
            {t('closing.correctionActs.actionCreate')}
          </Button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('closing.correctionActs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<CorrectionAct>
        data={filteredItems}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('closing.correctionActs.emptyTitle')}
        emptyDescription={t('closing.correctionActs.emptyDescription')}
      />

      {/* Create Correction Act Modal */}
      <Modal
        open={showCreate}
        onClose={closeModal}
        title={t('closing.correctionActs.modalCreateTitle')}
      >
        <div className="space-y-4">
          {/* Original act select */}
          <FormField label={t('closing.correctionActs.fieldOriginalAct')} required>
            <Select
              options={actOptions}
              value={originalActId}
              onChange={(e) => setOriginalActId(e.target.value)}
              placeholder={t('closing.correctionActs.selectActPlaceholder')}
            />
          </FormField>

          {/* Reason */}
          <FormField label={t('closing.correctionActs.fieldReason')} required>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('closing.correctionActs.reasonPlaceholder')}
              rows={2}
            />
          </FormField>

          {/* Correction items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('closing.correctionActs.sectionItems')}
              </p>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <PlusCircle size={14} className="mr-1" />
                {t('closing.correctionActs.addItem')}
              </Button>
            </div>

            <div className="space-y-3">
              {correctionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {t('closing.correctionActs.itemWorkItem')}
                    </label>
                    <Input
                      value={item.workItem}
                      onChange={(e) => handleItemChange(idx, 'workItem', e.target.value)}
                      placeholder={t('closing.correctionActs.itemWorkItemPlaceholder')}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {t('closing.correctionActs.itemOriginalQty')}
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={item.originalQty}
                      onChange={(e) => handleItemChange(idx, 'originalQty', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {t('closing.correctionActs.itemCorrectionQty')}
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={item.correctionQty}
                      onChange={(e) => handleItemChange(idx, 'correctionQty', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {t('closing.correctionActs.itemUnit')}
                    </label>
                    <Input
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      placeholder={t('closing.ks2Detail.placeholderUnit')}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 flex justify-end">
                    {correctionItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        aria-label={t('closing.correctionActs.removeItem')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Net amount */}
          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('closing.correctionActs.netAmount')}
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                netAmount < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100',
              )}
            >
              {formatMoney(netAmount)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button loading={createMutation.isPending} onClick={handleCreate}>
              <MinusCircle size={14} className="mr-1" />
              {t('closing.correctionActs.actionCreate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CorrectionActsPage;
