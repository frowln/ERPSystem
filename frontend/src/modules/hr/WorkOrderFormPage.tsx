import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import {
  FormField,
  Input,
  Select,
  Textarea,
} from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type {
  HrWorkOrder,
  HrWorkOrderType,
  CreateWorkOrderRequest,
} from './types';

// ---------------------------------------------------------------------------
// Status / type maps
// ---------------------------------------------------------------------------

const orderStatusColorMap: Record<string, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  draft: 'gray',
  issued: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'red',
};

const orderStatusLabels: Record<string, string> = {
  draft: t('hr.workOrders.statusDraft'),
  issued: t('hr.workOrders.statusIssued'),
  in_progress: t('hr.workOrders.statusInProgress'),
  completed: t('hr.workOrders.statusCompleted'),
  cancelled: t('hr.workOrders.statusCancelled'),
};

const orderTypeLabels: Record<string, string> = {
  task_order: t('hr.workOrders.typeTaskOrder'),
  access_order: t('hr.workOrders.typeAccessOrder'),
};

const typeOptions = [
  { value: '', label: t('hr.workOrders.filterAllTypes') },
  { value: 'task_order', label: t('hr.workOrders.filterTaskOrder') },
  { value: 'access_order', label: t('hr.workOrders.filterAccessOrder') },
];

const statusFilterOptions = [
  { value: '', label: t('hr.workOrders.filterAllStatuses') },
  { value: 'draft', label: t('hr.workOrders.filterDraft') },
  { value: 'issued', label: t('hr.workOrders.filterIssued') },
  { value: 'in_progress', label: t('hr.workOrders.filterInProgress') },
  { value: 'completed', label: t('hr.workOrders.filterCompleted') },
  { value: 'cancelled', label: t('hr.workOrders.filterCancelled') },
];

const typeFormOptions = [
  { value: 'task_order', label: t('hr.workOrders.typeTaskOrder') },
  { value: 'access_order', label: t('hr.workOrders.typeAccessOrder') },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorkOrderFormPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateWorkOrderRequest>({
    type: 'task_order',
    projectId: '',
    crewName: '',
    workDescription: '',
    date: '',
    endDate: '',
    safetyRequirements: '',
    hazardousConditions: '',
    requiredPermits: [],
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['hr-work-orders', typeFilter, statusFilter],
    queryFn: () =>
      hrApi.getWorkOrders({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkOrderRequest) => hrApi.createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-work-orders'] });
      setShowCreateModal(false);
      setForm({
        type: 'task_order',
        projectId: '',
        crewName: '',
        workDescription: '',
        date: '',
        endDate: '',
        safetyRequirements: '',
        hazardousConditions: '',
        requiredPermits: [],
      });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const filtered = useMemo(() => {
    if (!search) return orders;
    const lower = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.number.toLowerCase().includes(lower) ||
        o.workDescription.toLowerCase().includes(lower) ||
        o.crewName.toLowerCase().includes(lower) ||
        o.projectName.toLowerCase().includes(lower),
    );
  }, [orders, search]);

  const columns = useMemo<ColumnDef<HrWorkOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('hr.workOrders.columnNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('hr.workOrders.columnType'),
        size: 150,
        cell: ({ getValue }) => {
          const type = getValue<HrWorkOrderType>();
          return (
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              {orderTypeLabels[type] ?? type}
            </span>
          );
        },
      },
      {
        accessorKey: 'projectName',
        header: t('hr.workOrders.columnProject'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'crewName',
        header: t('hr.workOrders.columnCrew'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'workDescription',
        header: t('hr.workOrders.columnWorkDescription'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 truncate block max-w-[240px]">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('hr.workOrders.columnDate'),
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(row.original.date)}
            {row.original.endDate ? ` - ${formatDate(row.original.endDate)}` : ''}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('hr.workOrders.columnStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <StatusBadge
              status={status}
              colorMap={orderStatusColorMap}
              label={orderStatusLabels[status] ?? status}
            />
          );
        },
      },
    ],
    [],
  );

  const handleCreate = useCallback(() => {
    createMutation.mutate(form);
  }, [createMutation, form]);

  const isAccessOrder = form.type === 'access_order';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.workOrders.title')}
        subtitle={t('hr.workOrders.subtitle')}
        breadcrumbs={[
          { label: t('hr.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr/employees' },
          { label: t('hr.workOrders.title') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            {t('hr.workOrders.createOrder')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('hr.workOrders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable<HrWorkOrder>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('hr.workOrders.emptyTitle')}
        emptyDescription={t('hr.workOrders.emptyDescription')}
      />

      {/* Create work order modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('hr.workOrders.modalCreateTitle')}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              {t('hr.workOrders.modalCancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
            >
              {t('hr.workOrders.modalCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('hr.workOrders.modalFieldType')} required>
            <Select
              options={typeFormOptions}
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as HrWorkOrderType,
                }))
              }
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('hr.workOrders.modalFieldProject')} required>
              <Input
                value={form.projectId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, projectId: e.target.value }))
                }
              />
            </FormField>
            <FormField label={t('hr.workOrders.modalFieldCrew')} required>
              <Input
                value={form.crewName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, crewName: e.target.value }))
                }
              />
            </FormField>
          </div>

          <FormField label={t('hr.workOrders.modalFieldWorkDescription')} required>
            <Textarea
              value={form.workDescription}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  workDescription: e.target.value,
                }))
              }
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('hr.workOrders.modalFieldDate')} required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </FormField>
            <FormField label={t('hr.workOrders.modalFieldEndDate')}>
              <Input
                type="date"
                value={form.endDate ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </FormField>
          </div>

          <FormField label={t('hr.workOrders.modalFieldSafety')}>
            <Textarea
              value={form.safetyRequirements ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  safetyRequirements: e.target.value,
                }))
              }
              rows={2}
            />
          </FormField>

          {/* Access order specific fields */}
          {isAccessOrder && (
            <>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList
                    size={16}
                    className="text-warning-500"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('hr.workOrders.typeAccessOrder')}
                  </span>
                </div>

                <div className="space-y-4">
                  <FormField label={t('hr.workOrders.modalFieldHazardous')}>
                    <Textarea
                      value={form.hazardousConditions ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          hazardousConditions: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </FormField>

                  <FormField label={t('hr.workOrders.modalFieldPermits')}>
                    <Input
                      placeholder={t('hr.workOrders.modalFieldPermitsPlaceholder')}
                      value={(form.requiredPermits ?? []).join(', ')}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          requiredPermits: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                    />
                  </FormField>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default WorkOrderFormPage;
