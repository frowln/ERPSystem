import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  Award,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type {
  QualificationRecord,
  QualificationStatus,
  CreateQualificationRequest,
} from './types';

// ---------------------------------------------------------------------------
// Status maps
// ---------------------------------------------------------------------------

const qualStatusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  valid: 'green',
  expiring: 'yellow',
  expired: 'red',
};

const qualStatusLabels: Record<string, string> = {
  valid: t('hr.qualifications.statusValid'),
  expiring: t('hr.qualifications.statusExpiring'),
  expired: t('hr.qualifications.statusExpired'),
};

const statusFilterOptions = [
  { value: '', label: t('hr.qualifications.filterAllStatuses') },
  { value: 'valid', label: t('hr.qualifications.filterValid') },
  { value: 'expiring', label: t('hr.qualifications.filterExpiring') },
  { value: 'expired', label: t('hr.qualifications.filterExpired') },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const QualificationsJournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateQualificationRequest>({
    employeeId: '',
    qualificationType: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
  });

  const { data: qualifications = [], isLoading } = useQuery({
    queryKey: ['hr-qualifications', typeFilter, statusFilter],
    queryFn: () =>
      hrApi.getQualifications({
        qualificationType: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateQualificationRequest) =>
      hrApi.createQualification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-qualifications'] });
      setShowCreateModal(false);
      setForm({
        employeeId: '',
        qualificationType: '',
        certificateNumber: '',
        issueDate: '',
        expiryDate: '',
      });
    },
  });

  // Unique qualification types for filter
  const qualTypes = useMemo(() => {
    const set = new Set(qualifications.map((q) => q.qualificationType));
    return Array.from(set).sort();
  }, [qualifications]);

  const typeOptions = useMemo(
    () => [
      { value: '', label: t('hr.qualifications.filterAllTypes') },
      ...qualTypes.map((qt) => ({ value: qt, label: qt })),
    ],
    [qualTypes],
  );

  const filtered = useMemo(() => {
    if (!search) return qualifications;
    const lower = search.toLowerCase();
    return qualifications.filter(
      (q) =>
        q.employeeName.toLowerCase().includes(lower) ||
        q.qualificationType.toLowerCase().includes(lower) ||
        q.certificateNumber.toLowerCase().includes(lower),
    );
  }, [qualifications, search]);

  // Metrics
  const totalCount = qualifications.length;
  const validCount = qualifications.filter((q) => q.status === 'valid').length;
  const expiringCount = qualifications.filter(
    (q) => q.status === 'expiring',
  ).length;
  const expiredCount = qualifications.filter(
    (q) => q.status === 'expired',
  ).length;

  const columns = useMemo<ColumnDef<QualificationRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: t('hr.qualifications.columnEmployee'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'qualificationType',
        header: t('hr.qualifications.columnType'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'certificateNumber',
        header: t('hr.qualifications.columnCertNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'issueDate',
        header: t('hr.qualifications.columnIssueDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('hr.qualifications.columnExpiryDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('hr.qualifications.columnStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue<QualificationStatus>();
          return (
            <StatusBadge
              status={status}
              colorMap={qualStatusColorMap}
              label={qualStatusLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'daysRemaining',
        header: t('hr.qualifications.columnDaysRemaining'),
        size: 100,
        cell: ({ row }) => {
          const days = row.original.daysRemaining;
          const status = row.original.status;
          return (
            <span
              className={cn(
                'tabular-nums font-medium',
                status === 'expired'
                  ? 'text-danger-600 dark:text-danger-400'
                  : status === 'expiring'
                    ? 'text-warning-600 dark:text-warning-400'
                    : 'text-success-600 dark:text-success-400',
              )}
            >
              {days}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleCreate = useCallback(() => {
    createMutation.mutate(form);
  }, [createMutation, form]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.qualifications.title')}
        subtitle={t('hr.qualifications.subtitle')}
        breadcrumbs={[
          { label: t('hr.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr/employees' },
          { label: t('hr.qualifications.title') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            {t('hr.qualifications.createRecord')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Award size={18} />}
          label={t('hr.qualifications.metricTotal')}
          value={totalCount}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('hr.qualifications.metricValid')}
          value={validCount}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('hr.qualifications.metricExpiring')}
          value={expiringCount}
          trend={
            expiringCount > 0
              ? { direction: 'down', value: String(expiringCount) }
              : undefined
          }
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('hr.qualifications.metricExpired')}
          value={expiredCount}
          trend={
            expiredCount > 0
              ? { direction: 'down', value: String(expiredCount) }
              : undefined
          }
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('hr.qualifications.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-52"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable<QualificationRecord>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('hr.qualifications.emptyTitle')}
        emptyDescription={t('hr.qualifications.emptyDescription')}
      />

      {/* Create qualification modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('hr.qualifications.modalCreateTitle')}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              {t('hr.qualifications.modalCancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
            >
              {t('hr.qualifications.modalCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            label={t('hr.qualifications.modalFieldEmployee')}
            required
          >
            <Input
              placeholder={t('hr.qualifications.modalFieldEmployeePlaceholder')}
              value={form.employeeId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employeeId: e.target.value }))
              }
            />
          </FormField>

          <FormField label={t('hr.qualifications.modalFieldType')} required>
            <Input
              placeholder={t('hr.qualifications.modalFieldTypePlaceholder')}
              value={form.qualificationType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  qualificationType: e.target.value,
                }))
              }
            />
          </FormField>

          <FormField
            label={t('hr.qualifications.modalFieldCertNumber')}
            required
          >
            <Input
              value={form.certificateNumber}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  certificateNumber: e.target.value,
                }))
              }
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('hr.qualifications.modalFieldIssueDate')}
              required
            >
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, issueDate: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label={t('hr.qualifications.modalFieldExpiryDate')}
              required
            >
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QualificationsJournalPage;
