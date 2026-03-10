import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Shield, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { WarrantyObligation, WarrantyObligationStatus } from './types';
import type { PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

const statusColorMap: Record<string, 'gray' | 'green' | 'yellow' | 'red' | 'purple'> = {
  ACTIVE: 'green',
  EXPIRING_SOON: 'yellow',
  EXPIRED: 'red',
  VOIDED: 'gray',
};

const getStatusLabels = (): Record<WarrantyObligationStatus, string> => ({
  ACTIVE: t('closeout.warrantyOblStatusActive'),
  EXPIRING_SOON: t('closeout.warrantyOblStatusExpiringSoon'),
  EXPIRED: t('closeout.warrantyOblStatusExpired'),
  VOIDED: t('closeout.warrantyOblStatusVoided'),
});

type TabId = 'all' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

interface FormData {
  title: string;
  projectId: string;
  system: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  contractorName: string;
  coverageTerms: string;
  exclusions: string;
  notes: string;
}

const emptyForm: FormData = {
  title: '',
  projectId: '',
  system: '',
  warrantyStartDate: '',
  warrantyEndDate: '',
  contractorName: '',
  coverageTerms: '',
  exclusions: '',
  notes: '',
};

const WarrantyObligationListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data: dashboardData } = useQuery({
    queryKey: ['warranty-obligations-dashboard'],
    queryFn: () => closeoutApi.getWarrantyDashboard(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['warranty-obligations'],
    queryFn: () => closeoutApi.getWarrantyObligations({ size: 200 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const obligations = (data as PaginatedResponse<WarrantyObligation> | undefined)?.content ?? [];
  const projects = (projectsData as PaginatedResponse<{ id: string; name: string }> | undefined)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<WarrantyObligation>) => closeoutApi.createWarrantyObligation(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['warranty-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['warranty-obligations-dashboard'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarrantyObligation> }) =>
      closeoutApi.updateWarrantyObligation(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['warranty-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['warranty-obligations-dashboard'] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => closeoutApi.deleteWarrantyObligation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['warranty-obligations'] });
      void queryClient.invalidateQueries({ queryKey: ['warranty-obligations-dashboard'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const filtered = useMemo(() => {
    if (activeTab === 'all') return obligations;
    if (activeTab === 'ACTIVE') return obligations.filter((o) => o.status === 'ACTIVE');
    if (activeTab === 'EXPIRING_SOON') return obligations.filter((o) => o.status === 'EXPIRING_SOON');
    return obligations.filter((o) => o.status === 'EXPIRED');
  }, [obligations, activeTab]);

  const counts = useMemo(() => ({
    all: obligations.length,
    active: obligations.filter((o) => o.status === 'ACTIVE').length,
    expiring: obligations.filter((o) => o.status === 'EXPIRING_SOON').length,
    expired: obligations.filter((o) => o.status === 'EXPIRED').length,
  }), [obligations]);

  const statusLabels = getStatusLabels();

  const handleEdit = useCallback((obl: WarrantyObligation) => {
    setEditingId(obl.id);
    setForm({
      title: obl.title,
      projectId: obl.projectId,
      system: obl.system ?? '',
      warrantyStartDate: obl.warrantyStartDate,
      warrantyEndDate: obl.warrantyEndDate,
      contractorName: obl.contractorName ?? '',
      coverageTerms: obl.coverageTerms ?? '',
      exclusions: obl.exclusions ?? '',
      notes: obl.notes ?? '',
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const payload: Partial<WarrantyObligation> = {
      title: form.title,
      projectId: form.projectId,
      system: form.system || undefined,
      warrantyStartDate: form.warrantyStartDate,
      warrantyEndDate: form.warrantyEndDate,
      contractorName: form.contractorName || undefined,
      coverageTerms: form.coverageTerms || undefined,
      exclusions: form.exclusions || undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingId, createMutation, updateMutation]);

  const handleDelete = useCallback((obl: WarrantyObligation) => {
    if (confirm(t('closeout.warrantyOblDeleteConfirm').replace('{name}', obl.title))) {
      deleteMutation.mutate(obl.id);
    }
  }, [deleteMutation]);

  const getDaysColor = (days: number) => {
    if (days <= 0) return 'text-red-600 dark:text-red-400';
    if (days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    if (days <= 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const columns = useMemo<ColumnDef<WarrantyObligation, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: t('closeout.warrantyOblColTitle'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.title}</p>
            {row.original.system && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.system}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'contractorName',
        header: t('closeout.warrantyOblColContractor'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closeout.warrantyOblColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<WarrantyObligationStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'warrantyStartDate',
        header: t('closeout.warrantyOblColStartDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'warrantyEndDate',
        header: t('closeout.warrantyOblColEndDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'daysRemaining',
        header: t('closeout.warrantyOblColDaysRemaining'),
        size: 120,
        cell: ({ row }) => {
          const days = row.original.daysRemaining;
          return (
            <span className={`tabular-nums font-medium ${getDaysColor(days)}`}>
              {days <= 0 ? t('closeout.warrantyOblStatusExpired') : `${days}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'claimCount',
        header: t('closeout.warrantyOblColClaims'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}>
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}>
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [statusLabels, handleEdit, handleDelete],
  );

  const projectOptions = useMemo(() => [
    { value: '', label: '—' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ], [projects]);

  const setField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.warrantyOblTitle')}
        subtitle={t('closeout.warrantyOblSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.warrantyOblTitle') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowModal(true); }}>
            {t('closeout.warrantyOblCreate')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'ACTIVE', label: t('closeout.warrantyOblStatusActive'), count: counts.active },
          { id: 'EXPIRING_SOON', label: t('closeout.warrantyOblStatusExpiringSoon'), count: counts.expiring },
          { id: 'EXPIRED', label: t('closeout.warrantyOblStatusExpired'), count: counts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Shield size={18} />}
          label={t('closeout.warrantyOblDashMetricActive')}
          value={dashboardData?.totalActive ?? counts.active}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('closeout.warrantyOblDashMetricExpiring')}
          value={dashboardData?.totalExpiringSoon ?? counts.expiring}
          trend={counts.expiring > 0 ? { direction: 'up' as const, value: `${counts.expiring}` } : undefined}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('closeout.warrantyOblDashMetricExpired')}
          value={dashboardData?.totalExpired ?? counts.expired}
        />
      </div>

      {dashboardData && dashboardData.upcomingExpirations.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <Clock size={16} />
            {t('closeout.warrantyOblDashUpcoming')}
          </h3>
          <div className="space-y-1">
            {dashboardData.upcomingExpirations.slice(0, 5).map((obl) => (
              <div key={obl.id} className="flex items-center justify-between text-sm">
                <span className="text-yellow-900 dark:text-yellow-200">{obl.title}</span>
                <span className="tabular-nums text-yellow-700 dark:text-yellow-400">
                  {formatDate(obl.warrantyEndDate)} ({obl.daysRemaining} {t('closeout.warrantyOblColDaysRemaining').toLowerCase()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable<WarrantyObligation>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('closeout.warrantyOblEmpty')}
        emptyDescription={t('closeout.warrantyOblEmptyDesc')}
      />

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? t('closeout.warrantyOblFormTitleEdit') : t('closeout.warrantyOblFormTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldTitle')} *
            </label>
            <Input value={form.title} onChange={setField('title')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldProject')} *
            </label>
            <Select options={projectOptions} value={form.projectId} onChange={setField('projectId')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldSystem')}
            </label>
            <Input value={form.system} onChange={setField('system')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.warrantyOblFieldStartDate')} *
              </label>
              <Input type="date" value={form.warrantyStartDate} onChange={setField('warrantyStartDate')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.warrantyOblFieldEndDate')} *
              </label>
              <Input type="date" value={form.warrantyEndDate} onChange={setField('warrantyEndDate')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldContractor')}
            </label>
            <Input value={form.contractorName} onChange={setField('contractorName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldCoverage')}
            </label>
            <Input value={form.coverageTerms} onChange={setField('coverageTerms')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldExclusions')}
            </label>
            <Input value={form.exclusions} onChange={setField('exclusions')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldNotes')}
            </label>
            <Input value={form.notes} onChange={setField('notes')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.projectId || !form.warrantyStartDate || !form.warrantyEndDate}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WarrantyObligationListPage;
