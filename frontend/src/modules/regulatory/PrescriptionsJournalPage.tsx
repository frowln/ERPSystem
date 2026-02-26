import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  FileWarning,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  prescriptionStatusColorMap,
  prescriptionStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate } from '@/lib/format';
import type { Prescription, PrescriptionStatus } from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

type TabId = 'all' | 'active' | 'overdue' | 'resolved';

const ACTIVE_STATUSES: PrescriptionStatus[] = [
  'RECEIVED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESPONSE_SUBMITTED',
];

function DeadlineCell({ prescription }: { prescription: Prescription }) {
  if (!prescription.deadline)
    return <span className="text-neutral-400">---</span>;

  const days = prescription.daysUntilDeadline ?? 0;
  const isOverdue = prescription.overdue;

  if (isOverdue) {
    return (
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={14} className="text-danger-500 shrink-0" />
        <div>
          <p className="text-danger-600 dark:text-danger-400 font-medium text-xs tabular-nums">
            {formatDate(prescription.deadline)}
          </p>
          <p className="text-danger-500 text-[11px]">
            {t('regulatory.daysOverdue', { days: String(Math.abs(days)) })}
          </p>
        </div>
      </div>
    );
  }

  const urgency =
    days <= 7
      ? 'text-warning-600 dark:text-warning-400'
      : 'text-neutral-700 dark:text-neutral-300';

  return (
    <div>
      <p className={`font-medium text-xs tabular-nums ${urgency}`}>
        {formatDate(prescription.deadline)}
      </p>
      <p className="text-neutral-500 text-[11px]">
        {t('regulatory.daysLeft', { days: String(days) })}
      </p>
    </div>
  );
}

const PrescriptionsJournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [bodyFilter, setBodyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    description: '',
    regulatoryBodyType: 'ROSTEKHNADZOR' as string,
    deadline: '',
    responsibleName: '',
    projectName: '',
  });

  const { data: prescriptionData, isLoading } = useQuery<
    PaginatedResponse<Prescription>
  >({
    queryKey: ['prescriptions-journal'],
    queryFn: () => regulatoryApi.getPrescriptions({ size: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Prescription>) =>
      regulatoryApi.createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions-journal'] });
      toast.success(t('regulatory.pjCreateSuccess'));
      setCreateOpen(false);
      setFormData({
        number: '',
        description: '',
        regulatoryBodyType: 'ROSTEKHNADZOR',
        deadline: '',
        responsibleName: '',
        projectName: '',
      });
    },
    onError: () => toast.error(t('regulatory.pjCreateError')),
  });

  const prescriptions = prescriptionData?.content ?? [];

  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;
    if (activeTab === 'active')
      filtered = filtered.filter((p) => ACTIVE_STATUSES.includes(p.status));
    else if (activeTab === 'overdue')
      filtered = filtered.filter((p) => p.overdue || p.status === 'OVERDUE');
    else if (activeTab === 'resolved')
      filtered = filtered.filter(
        (p) => p.status === 'COMPLETED' || p.status === 'CLOSED',
      );
    if (bodyFilter) {
      filtered = filtered.filter((p) => p.regulatoryBodyType === bodyFilter);
    }
    if (dateFrom) {
      filtered = filtered.filter(
        (p) => p.receivedDate && p.receivedDate >= dateFrom,
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (p) => p.receivedDate && p.receivedDate <= dateTo,
      );
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.number.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          (p.responsibleName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [prescriptions, activeTab, search, bodyFilter, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const total = prescriptions.length;
    const active = prescriptions.filter((p) =>
      ACTIVE_STATUSES.includes(p.status),
    ).length;
    const overdue = prescriptions.filter(
      (p) => p.overdue || p.status === 'OVERDUE',
    ).length;
    const resolved = prescriptions.filter(
      (p) => p.status === 'COMPLETED' || p.status === 'CLOSED',
    ).length;
    return { total, active, overdue, resolved };
  }, [prescriptions]);

  const tabCounts = useMemo(
    () => ({
      all: prescriptions.length,
      active: metrics.active,
      overdue: metrics.overdue,
      resolved: metrics.resolved,
    }),
    [prescriptions.length, metrics],
  );

  const columns = useMemo<ColumnDef<Prescription, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('regulatory.pjColNumber'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'regulatoryBodyType',
        header: t('regulatory.pjColAuthority'),
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {row.original.regulatoryBodyTypeDisplayName ??
              row.original.regulatoryBodyType ??
              '---'}
          </span>
        ),
      },
      {
        accessorKey: 'receivedDate',
        header: t('regulatory.pjColIssueDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'deadline',
        header: t('regulatory.pjColDeadline'),
        size: 150,
        cell: ({ row }) => <DeadlineCell prescription={row.original} />,
      },
      {
        accessorKey: 'status',
        header: t('regulatory.pjColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={prescriptionStatusColorMap}
            label={
              prescriptionStatusLabels[getValue<string>()] ?? getValue<string>()
            }
          />
        ),
      },
      {
        accessorKey: 'description',
        header: t('regulatory.pjColSubject'),
        size: 220,
        cell: ({ getValue }) => (
          <p className="text-neutral-700 dark:text-neutral-300 text-xs truncate max-w-[200px]">
            {getValue<string>() || '---'}
          </p>
        ),
      },
      {
        accessorKey: 'responsibleName',
        header: t('regulatory.pjColResponsible'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>() ?? '---'}
          </span>
        ),
      },
      {
        id: 'overdueDays',
        header: t('regulatory.pjColOverdueDays'),
        size: 100,
        cell: ({ row }) => {
          const p = row.original;
          if (!p.overdue || !p.daysUntilDeadline) return <span className="text-neutral-400 text-xs">---</span>;
          const days = Math.abs(p.daysUntilDeadline);
          return (
            <span className="font-medium text-danger-600 dark:text-danger-400 tabular-nums text-xs">
              {days}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      number: formData.number,
      description: formData.description,
      regulatoryBodyType: formData.regulatoryBodyType as Prescription['regulatoryBodyType'],
      deadline: formData.deadline || undefined,
      responsibleName: formData.responsibleName || undefined,
      projectName: formData.projectName || undefined,
      violationCount: 0,
    });
  }, [createMutation, formData]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.pjTitle')}
        subtitle={t('regulatory.pjSubtitle', {
          count: String(prescriptions.length),
        })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          {
            label: t('regulatory.breadcrumbRegulatory'),
            href: '/regulatory/dashboard',
          },
          { label: t('regulatory.pjBreadcrumb') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            {t('regulatory.pjBtnCreate')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          {
            id: 'active',
            label: t('regulatory.pjTabActive'),
            count: tabCounts.active,
          },
          {
            id: 'overdue',
            label: t('regulatory.pjTabOverdue'),
            count: tabCounts.overdue,
          },
          {
            id: 'resolved',
            label: t('regulatory.pjTabResolved'),
            count: tabCounts.resolved,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileWarning size={18} />}
          label={t('regulatory.pjMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('regulatory.pjMetricActive')}
          value={metrics.active}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('regulatory.pjMetricOverdue')}
          value={metrics.overdue}
          trend={
            metrics.overdue > 0
              ? { direction: 'down', value: t('regulatory.trendUrgent') }
              : undefined
          }
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('regulatory.pjMetricResolved')}
          value={metrics.resolved}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('regulatory.pjSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('regulatory.bodyTypeFilterAll') },
            { value: 'ROSTEKHNADZOR', label: t('regulatory.bodyTypeRostekhnadzor') },
            { value: 'GIT', label: t('regulatory.bodyTypeGit') },
            { value: 'STROYNADZOR', label: t('regulatory.bodyTypeStroynadzor') },
            { value: 'MCHS', label: t('regulatory.bodyTypeMchs') },
            { value: 'ROSPOTREBNADZOR', label: t('regulatory.bodyTypeRospotrebnadzor') },
            { value: 'ENVIRONMENTAL', label: t('regulatory.bodyTypeEnvironmental') },
            { value: 'OTHER', label: t('regulatory.bodyTypeOther') },
          ]}
          value={bodyFilter}
          onChange={(e) => setBodyFilter(e.target.value)}
          className="w-48"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
          placeholder={t('regulatory.pjDateFrom')}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
          placeholder={t('regulatory.pjDateTo')}
        />
      </div>

      <DataTable<Prescription>
        data={filteredPrescriptions}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('regulatory.pjEmptyTitle')}
        emptyDescription={t('regulatory.pjEmptyDesc')}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('regulatory.pjModalTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('regulatory.pjFieldNumber')} required>
            <Input
              value={formData.number}
              onChange={(e) =>
                setFormData((p) => ({ ...p, number: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t('regulatory.pjFieldAuthority')}>
            <Select
              options={[
                { value: 'ROSTEKHNADZOR', label: t('regulatory.bodyTypeRostekhnadzor') },
                { value: 'GIT', label: t('regulatory.bodyTypeGit') },
                { value: 'STROYNADZOR', label: t('regulatory.bodyTypeStroynadzor') },
                { value: 'MCHS', label: t('regulatory.bodyTypeMchs') },
                { value: 'ROSPOTREBNADZOR', label: t('regulatory.bodyTypeRospotrebnadzor') },
                { value: 'ENVIRONMENTAL', label: t('regulatory.bodyTypeEnvironmental') },
                { value: 'OTHER', label: t('regulatory.bodyTypeOther') },
              ]}
              value={formData.regulatoryBodyType}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  regulatoryBodyType: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label={t('regulatory.pjFieldDeadline')}>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData((p) => ({ ...p, deadline: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t('regulatory.pjFieldResponsible')}>
            <Input
              value={formData.responsibleName}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  responsibleName: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label={t('regulatory.pjFieldDescription')} required>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default PrescriptionsJournalPage;
