import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  PlusCircle,
  Search,
  PackageCheck,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { execDocsApi } from '@/api/execDocs';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { IncomingControlEntry, IncomingControlResult } from './types';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const resultColorMap: Record<string, string> = {
  accepted: 'green',
  rejected: 'red',
  conditional: 'yellow',
};

const resultOptions = [
  { value: '', label: '--' },
  { value: 'accepted', label: 'accepted' },
  { value: 'rejected', label: 'rejected' },
  { value: 'conditional', label: 'conditional' },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const IncomingControlJournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [resultFilter, setResultFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [inspector, setInspector] = useState('');
  const [result, setResult] = useState<IncomingControlResult>('accepted');
  const [notes, setNotes] = useState('');

  const { data: entries, isLoading } = useQuery<IncomingControlEntry[]>({
    queryKey: ['incoming-control-entries', resultFilter],
    queryFn: () =>
      execDocsApi.getIncomingControlEntries(
        resultFilter ? { result: resultFilter as IncomingControlResult } : undefined,
      ),
  });

  const items = entries ?? [];

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.materialName.toLowerCase().includes(lower) ||
        item.supplier.toLowerCase().includes(lower) ||
        item.documentNumber.toLowerCase().includes(lower) ||
        item.inspector.toLowerCase().includes(lower),
    );
  }, [items, search]);

  const createMutation = useMutation({
    mutationFn: () =>
      execDocsApi.createIncomingControlEntry({
        date: formDate,
        materialName,
        supplier,
        documentNumber,
        quantity: parseFloat(quantity) || 0,
        unit,
        inspector,
        result,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-control-entries'] });
      toast.success(t('execDocs.incomingControl.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('execDocs.incomingControl.toastCreateError')),
  });

  const closeModal = useCallback(() => {
    setShowCreate(false);
    setFormDate('');
    setMaterialName('');
    setSupplier('');
    setDocumentNumber('');
    setQuantity('');
    setUnit('');
    setInspector('');
    setResult('accepted');
    setNotes('');
  }, []);

  const handleCreate = useCallback(() => {
    if (!formDate) {
      toast.error(t('execDocs.incomingControl.validationDate'));
      return;
    }
    if (!materialName.trim()) {
      toast.error(t('execDocs.incomingControl.validationMaterial'));
      return;
    }
    createMutation.mutate();
  }, [formDate, materialName, createMutation]);

  const columns = useMemo<ColumnDef<IncomingControlEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('execDocs.incomingControl.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'materialName',
        header: t('execDocs.incomingControl.colMaterial'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'supplier',
        header: t('execDocs.incomingControl.colSupplier'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'documentNumber',
        header: t('execDocs.incomingControl.colDocNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('execDocs.incomingControl.colQuantity'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-sm">
            {getValue<number>().toLocaleString('ru-RU')}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('execDocs.incomingControl.colUnit'),
        size: 70,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'inspector',
        header: t('execDocs.incomingControl.colInspector'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'result',
        header: t('execDocs.incomingControl.colResult'),
        size: 130,
        cell: ({ getValue }) => {
          const res = getValue<IncomingControlResult>();
          return (
            <StatusBadge
              status={res}
              colorMap={resultColorMap}
              label={t(`execDocs.incomingControl.result${res.charAt(0).toUpperCase() + res.slice(1)}`)}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('execDocs.incomingControl.title')}
        subtitle={t('execDocs.incomingControl.subtitle')}
        breadcrumbs={[
          { label: t('execDocs.breadcrumbHome'), href: '/' },
          { label: t('execDocs.incomingControl.breadcrumb') },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <PlusCircle size={14} className="mr-1" />
            {t('execDocs.incomingControl.actionCreate')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('execDocs.incomingControl.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-neutral-400" />
          <div className="w-40">
            <Select
              options={resultOptions.map((o) => ({
                ...o,
                label: o.value
                  ? t(`execDocs.incomingControl.result${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)
                  : t('common.all'),
              }))}
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable<IncomingControlEntry>
        data={filteredItems}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('execDocs.incomingControl.emptyTitle')}
        emptyDescription={t('execDocs.incomingControl.emptyDescription')}
      />

      {/* Create Entry Modal */}
      <Modal
        open={showCreate}
        onClose={closeModal}
        title={t('execDocs.incomingControl.modalCreateTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label={t('execDocs.incomingControl.fieldDate')} required>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </FormField>

          <FormField label={t('execDocs.incomingControl.fieldMaterial')} required>
            <Input
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder={t('execDocs.incomingControl.placeholderMaterial')}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.incomingControl.fieldSupplier')}>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder={t('execDocs.incomingControl.placeholderSupplier')}
              />
            </FormField>
            <FormField label={t('execDocs.incomingControl.fieldDocNumber')}>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder={t('execDocs.incomingControl.placeholderDocNumber')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('execDocs.incomingControl.fieldQuantity')}>
              <Input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </FormField>
            <FormField label={t('execDocs.incomingControl.fieldUnit')}>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={t('execDocs.incomingControl.placeholderUnit')}
              />
            </FormField>
            <FormField label={t('execDocs.incomingControl.fieldResult')}>
              <Select
                options={[
                  { value: 'accepted', label: t('execDocs.incomingControl.resultAccepted') },
                  { value: 'rejected', label: t('execDocs.incomingControl.resultRejected') },
                  { value: 'conditional', label: t('execDocs.incomingControl.resultConditional') },
                ]}
                value={result}
                onChange={(e) => setResult(e.target.value as IncomingControlResult)}
              />
            </FormField>
          </div>

          <FormField label={t('execDocs.incomingControl.fieldInspector')}>
            <Input
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              placeholder={t('execDocs.incomingControl.placeholderInspector')}
            />
          </FormField>

          <FormField label={t('execDocs.incomingControl.fieldNotes')}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('execDocs.incomingControl.placeholderNotes')}
              rows={2}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button loading={createMutation.isPending} onClick={handleCreate}>
              <PackageCheck size={14} className="mr-1" />
              {t('execDocs.incomingControl.actionCreate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncomingControlJournalPage;
