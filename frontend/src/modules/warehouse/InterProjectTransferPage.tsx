import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  ArrowRight,
  Trash2,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { Combobox } from '@/design-system/components/Combobox';
import { warehouseApi } from '@/api/warehouse';
import { formatDate, formatNumber } from '@/lib/format';
import { useProjectOptions, useMaterialOptions } from '@/hooks/useSelectOptions';
import type { InterProjectTransfer, InterProjectTransferStatus } from './types';

type TabId = 'all' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow'> = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'blue',
  IN_TRANSIT: 'blue',
  RECEIVED: 'green',
  CANCELLED: 'red',
};

const statusLabelsGetter: Record<string, string> = {
  get DRAFT() { return t('warehouse.interTransfer.statusDraft'); },
  get PENDING_APPROVAL() { return t('warehouse.interTransfer.statusPendingApproval'); },
  get APPROVED() { return t('warehouse.interTransfer.statusApproved'); },
  get IN_TRANSIT() { return t('warehouse.interTransfer.statusInTransit'); },
  get RECEIVED() { return t('warehouse.interTransfer.statusReceived'); },
  get CANCELLED() { return t('warehouse.interTransfer.statusCancelled'); },
};

interface TransferLineInput {
  id: string;
  materialId: string;
  materialName: string;
  quantity: string;
  unit: string;
}

const InterProjectTransferPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();
  const { options: materialOptions } = useMaterialOptions();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [formSourceProject, setFormSourceProject] = useState('');
  const [formDestProject, setFormDestProject] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formExpectedArrival, setFormExpectedArrival] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLines, setFormLines] = useState<TransferLineInput[]>([
    { id: crypto.randomUUID(), materialId: '', materialName: '', quantity: '', unit: '' },
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['inter-project-transfers', activeTab],
    queryFn: () =>
      warehouseApi.getInterProjectTransfers({
        size: 200,
        ...(activeTab !== 'all' ? { status: activeTab as InterProjectTransferStatus } : {}),
      }),
  });

  const transfers = data?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      warehouseApi.createInterProjectTransfer({
        sourceProjectId: formSourceProject,
        destinationProjectId: formDestProject,
        items: formLines
          .filter((l) => l.materialId && Number(l.quantity) > 0)
          .map((l) => ({
            materialId: l.materialId,
            materialName: l.materialName,
            quantity: Number(l.quantity),
            unit: l.unit || t('warehouse.interTransfer.defaultUnit'),
          })),
        vehicleNumber: formVehicle || undefined,
        driverName: formDriver || undefined,
        expectedArrival: formExpectedArrival || undefined,
        notes: formNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inter-project-transfers'] });
      toast.success(t('warehouse.interTransfer.toastCreated'));
      setCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('warehouse.interTransfer.toastError'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InterProjectTransferStatus }) =>
      warehouseApi.updateInterProjectTransferStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inter-project-transfers'] });
      toast.success(t('warehouse.interTransfer.toastStatusUpdated'));
    },
    onError: () => {
      toast.error(t('warehouse.interTransfer.toastError'));
    },
  });

  function resetForm() {
    setFormSourceProject('');
    setFormDestProject('');
    setFormVehicle('');
    setFormDriver('');
    setFormExpectedArrival('');
    setFormNotes('');
    setFormLines([{ id: crypto.randomUUID(), materialId: '', materialName: '', quantity: '', unit: '' }]);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!formSourceProject) errs.source = t('warehouse.interTransfer.validationSourceRequired');
    if (!formDestProject) errs.dest = t('warehouse.interTransfer.validationDestRequired');
    if (formSourceProject && formDestProject && formSourceProject === formDestProject) {
      errs.dest = t('warehouse.interTransfer.validationSameProject');
    }
    const validLines = formLines.filter((l) => l.materialId);
    if (validLines.length === 0) {
      errs.lines = t('warehouse.interTransfer.validationNoItems');
    }
    for (const line of validLines) {
      const qty = Number(line.quantity);
      if (!line.quantity || qty <= 0) {
        errs[`qty-${line.id}`] = t('warehouse.interTransfer.validationQtyPositive');
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleCreate() {
    if (validateForm()) {
      createMutation.mutate();
    }
  }

  function addLine() {
    setFormLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), materialId: '', materialName: '', quantity: '', unit: '' },
    ]);
  }

  function removeLine(id: string) {
    if (formLines.length <= 1) return;
    setFormLines((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLine(id: string, field: string, value: string) {
    setFormLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === 'materialId') {
          const opt = materialOptions.find((o) => o.value === value);
          return { ...l, materialId: value, materialName: opt?.label ?? '' };
        }
        return { ...l, [field]: value };
      }),
    );
  }

  const filtered = useMemo(() => {
    if (!search) return transfers;
    const q = search.toLowerCase();
    return transfers.filter(
      (tr) =>
        tr.number.toLowerCase().includes(q) ||
        (tr.sourceProjectName ?? '').toLowerCase().includes(q) ||
        (tr.destinationProjectName ?? '').toLowerCase().includes(q),
    );
  }, [transfers, search]);

  const tabCounts = useMemo(
    () => ({
      all: transfers.length,
      DRAFT: transfers.filter((t) => t.status === 'DRAFT').length,
      PENDING_APPROVAL: transfers.filter((t) => t.status === 'PENDING_APPROVAL').length,
      APPROVED: transfers.filter((t) => t.status === 'APPROVED').length,
      IN_TRANSIT: transfers.filter((t) => t.status === 'IN_TRANSIT').length,
      RECEIVED: transfers.filter((t) => t.status === 'RECEIVED').length,
      CANCELLED: transfers.filter((t) => t.status === 'CANCELLED').length,
    }),
    [transfers],
  );

  const nextStatusAction = (status: InterProjectTransferStatus): InterProjectTransferStatus | null => {
    switch (status) {
      case 'DRAFT':
        return 'PENDING_APPROVAL';
      case 'PENDING_APPROVAL':
        return 'APPROVED';
      case 'APPROVED':
        return 'IN_TRANSIT';
      case 'IN_TRANSIT':
        return 'RECEIVED';
      default:
        return null;
    }
  };

  const nextStatusLabel = (status: InterProjectTransferStatus): string => {
    switch (status) {
      case 'DRAFT':
        return t('warehouse.interTransfer.actionSubmit');
      case 'PENDING_APPROVAL':
        return t('warehouse.interTransfer.actionApprove');
      case 'APPROVED':
        return t('warehouse.interTransfer.actionShip');
      case 'IN_TRANSIT':
        return t('warehouse.interTransfer.actionReceive');
      default:
        return '';
    }
  };

  const columns = useMemo<ColumnDef<InterProjectTransfer, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('warehouse.interTransfer.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'direction',
        header: t('warehouse.interTransfer.colDirection'),
        size: 280,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate max-w-[120px] text-neutral-900 dark:text-neutral-100">
              {row.original.sourceProjectName}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate max-w-[120px] text-neutral-900 dark:text-neutral-100">
              {row.original.destinationProjectName}
            </span>
          </div>
        ),
      },
      {
        id: 'itemsCount',
        header: t('warehouse.interTransfer.colItems'),
        size: 80,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.items.length}</span>
        ),
      },
      {
        id: 'totalQty',
        header: t('warehouse.interTransfer.colTotalQty'),
        size: 100,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(row.original.items.reduce((sum, item) => sum + item.quantity, 0))}
          </span>
        ),
      },
      {
        accessorKey: 'vehicleNumber',
        header: t('warehouse.interTransfer.colVehicle'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'expectedArrival',
        header: t('warehouse.interTransfer.colExpectedArrival'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? (
            <span className="tabular-nums text-sm">{formatDate(val)}</span>
          ) : (
            <span className="text-neutral-400">-</span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('warehouse.interTransfer.colCreatedAt'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.interTransfer.colStatus'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabelsGetter[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: ({ row }) => {
          const nextStatus = nextStatusAction(row.original.status);
          if (!nextStatus) return null;
          return (
            <Button
              size="xs"
              variant="secondary"
              onClick={() =>
                statusMutation.mutate({ id: row.original.id, status: nextStatus })
              }
              loading={statusMutation.isPending}
            >
              {nextStatusLabel(row.original.status)}
            </Button>
          );
        },
      },
    ],
    [statusMutation],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.interTransfer.title')}
        subtitle={t('warehouse.interTransfer.subtitle', { count: transfers.length })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.interTransfer.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            {t('warehouse.interTransfer.newTransfer')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.interTransfer.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('warehouse.interTransfer.statusDraft'), count: tabCounts.DRAFT },
          { id: 'PENDING_APPROVAL', label: t('warehouse.interTransfer.statusPendingApproval'), count: tabCounts.PENDING_APPROVAL },
          { id: 'IN_TRANSIT', label: t('warehouse.interTransfer.statusInTransit'), count: tabCounts.IN_TRANSIT },
          { id: 'RECEIVED', label: t('warehouse.interTransfer.statusReceived'), count: tabCounts.RECEIVED },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.interTransfer.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<InterProjectTransfer>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.interTransfer.emptyTitle')}
        emptyDescription={t('warehouse.interTransfer.emptyDescription')}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title={t('warehouse.interTransfer.createTitle')}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={createMutation.isPending}
              onClick={handleCreate}
              disabled={!formSourceProject || !formDestProject}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Projects */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <FormField
              label={t('warehouse.interTransfer.formSourceProject')}
              error={formErrors.source}
              required
            >
              <Combobox
                options={projectOptions}
                value={formSourceProject}
                onChange={setFormSourceProject}
                placeholder={t('warehouse.interTransfer.formSelectProject')}
              />
            </FormField>
            <div className="hidden sm:flex items-center justify-center pb-1">
              <ArrowRight className="w-5 h-5 text-neutral-400" />
            </div>
            <FormField
              label={t('warehouse.interTransfer.formDestProject')}
              error={formErrors.dest}
              required
            >
              <Combobox
                options={projectOptions}
                value={formDestProject}
                onChange={setFormDestProject}
                placeholder={t('warehouse.interTransfer.formSelectProject')}
              />
            </FormField>
          </div>

          {/* Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('warehouse.interTransfer.formMaterials')}
              </h4>
              <Button variant="ghost" size="xs" iconLeft={<Plus size={14} />} onClick={addLine}>
                {t('warehouse.interTransfer.formAddItem')}
              </Button>
            </div>
            {formErrors.lines && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{formErrors.lines}</p>
            )}
            <div className="space-y-2">
              {formLines.map((line, idx) => (
                <div key={line.id} className="flex items-start gap-2">
                  <span className="text-xs text-neutral-400 pt-2.5 w-5 shrink-0 text-right">
                    {idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr_80px] gap-2">
                    <Combobox
                      options={materialOptions}
                      value={line.materialId}
                      onChange={(val) => updateLine(line.id, 'materialId', val)}
                      placeholder={t('warehouse.interTransfer.formMaterialPlaceholder')}
                    />
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                      placeholder={t('warehouse.interTransfer.formQtyPlaceholder')}
                      hasError={!!formErrors[`qty-${line.id}`]}
                    />
                    <Input
                      value={line.unit}
                      onChange={(e) => updateLine(line.id, 'unit', e.target.value)}
                      placeholder={t('warehouse.interTransfer.formUnitPlaceholder')}
                    />
                  </div>
                  {formLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="p-1.5 mt-1 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transport details */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-400" />
              {t('warehouse.interTransfer.formTransportSection')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label={t('warehouse.interTransfer.formVehicle')}>
                <Input
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value)}
                  placeholder={t('warehouse.interTransfer.formVehiclePlaceholder')}
                />
              </FormField>
              <FormField label={t('warehouse.interTransfer.formDriver')}>
                <Input
                  value={formDriver}
                  onChange={(e) => setFormDriver(e.target.value)}
                  placeholder={t('warehouse.interTransfer.formDriverPlaceholder')}
                />
              </FormField>
              <FormField label={t('warehouse.interTransfer.formExpectedArrival')}>
                <Input
                  type="date"
                  value={formExpectedArrival}
                  onChange={(e) => setFormExpectedArrival(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Notes */}
          <FormField label={t('warehouse.interTransfer.formNotes')}>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t('warehouse.interTransfer.formNotesPlaceholder')}
              rows={2}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default InterProjectTransferPage;
