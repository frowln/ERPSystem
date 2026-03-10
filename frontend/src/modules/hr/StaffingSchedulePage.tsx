import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { StaffingPosition, CreateVacancyRequest } from './types';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Status maps
// ---------------------------------------------------------------------------

const vacancyStatusColorMap: Record<string, 'green' | 'yellow' | 'gray' | 'blue'> = {
  open: 'blue',
  in_progress: 'yellow',
  closed: 'green',
  full: 'gray',
};

function getPositionVacancyLabel(pos: StaffingPosition): string {
  const openVacancies = pos.vacancies.filter((v) => v.status === 'open');
  const inProgress = pos.vacancies.filter((v) => v.status === 'in_progress');
  if (openVacancies.length > 0) return t('hr.staffing.vacancyStatusOpen');
  if (inProgress.length > 0) return t('hr.staffing.vacancyStatusInProgress');
  if (pos.filled >= pos.total) return t('hr.staffing.vacancyStatusFull');
  return t('hr.staffing.vacancyStatusClosed');
}

function getPositionVacancyStatus(pos: StaffingPosition): string {
  const openVacancies = pos.vacancies.filter((v) => v.status === 'open');
  const inProgress = pos.vacancies.filter((v) => v.status === 'in_progress');
  if (openVacancies.length > 0) return 'open';
  if (inProgress.length > 0) return 'in_progress';
  if (pos.filled >= pos.total) return 'full';
  return 'closed';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StaffingSchedulePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateVacancyRequest>({
    department: '',
    position: '',
    grade: '',
    salaryMin: 0,
    salaryMax: 0,
  });

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['staffing-schedule', departmentFilter, statusFilter],
    queryFn: () =>
      hrApi.getStaffingSchedule({
        department: departmentFilter || undefined,
        vacancyStatus: statusFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVacancyRequest) => hrApi.createVacancy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-schedule'] });
      setShowCreateModal(false);
      setForm({ department: '', position: '', grade: '', salaryMin: 0, salaryMax: 0 });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const filtered = useMemo(() => {
    if (!search) return positions;
    const lower = search.toLowerCase();
    return positions.filter(
      (p) =>
        p.department.toLowerCase().includes(lower) ||
        p.position.toLowerCase().includes(lower) ||
        p.grade.toLowerCase().includes(lower),
    );
  }, [positions, search]);

  // Metrics
  const totalPositions = positions.reduce((s, p) => s + p.total, 0);
  const totalFilled = positions.reduce((s, p) => s + p.filled, 0);
  const totalVacant = totalPositions - totalFilled;
  const fillRate = totalPositions > 0 ? Math.round((totalFilled / totalPositions) * 100) : 0;

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(positions.map((p) => p.department));
    return Array.from(set).sort();
  }, [positions]);

  const departmentOptions = useMemo(
    () => [
      { value: '', label: t('hr.staffing.filterAllDepartments') },
      ...departments.map((d) => ({ value: d, label: d })),
    ],
    [departments],
  );

  const statusOptions = [
    { value: '', label: t('hr.staffing.filterAllStatuses') },
    { value: 'open', label: t('hr.staffing.filterStatusOpen') },
    { value: 'in_progress', label: t('hr.staffing.filterStatusInProgress') },
    { value: 'closed', label: t('hr.staffing.filterStatusClosed') },
  ];

  const columns = useMemo<ColumnDef<StaffingPosition, unknown>[]>(
    () => [
      {
        accessorKey: 'department',
        header: t('hr.staffing.columnDepartment'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'position',
        header: t('hr.staffing.columnPosition'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'grade',
        header: t('hr.staffing.columnGrade'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'salaryRange',
        header: t('hr.staffing.columnSalaryRange'),
        size: 180,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatMoney(row.original.salaryMin)} - {formatMoney(row.original.salaryMax)}
          </span>
        ),
      },
      {
        id: 'filledTotal',
        header: t('hr.staffing.columnFilled'),
        size: 120,
        cell: ({ row }) => {
          const { filled, total } = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                {filled}/{total}
              </span>
              <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden max-w-[60px]">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${total > 0 ? (filled / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'vacancyStatus',
        header: t('hr.staffing.columnVacancyStatus'),
        size: 140,
        cell: ({ row }) => {
          const status = getPositionVacancyStatus(row.original);
          const label = getPositionVacancyLabel(row.original);
          return (
            <StatusBadge
              status={status}
              colorMap={vacancyStatusColorMap}
              label={label}
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.staffing.title')}
        subtitle={t('hr.staffing.subtitle')}
        breadcrumbs={[
          { label: t('hr.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr/employees' },
          { label: t('hr.staffing.title') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            {t('hr.staffing.createVacancy')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Users size={18} />}
          label={t('hr.staffing.metricTotalPositions')}
          value={totalPositions}
        />
        <MetricCard
          icon={<UserCheck size={18} />}
          label={t('hr.staffing.metricFilled')}
          value={totalFilled}
        />
        <MetricCard
          icon={<UserX size={18} />}
          label={t('hr.staffing.metricVacant')}
          value={totalVacant}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('hr.staffing.metricFillRate')}
          value={`${fillRate}%`}
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
            placeholder={t('hr.staffing.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={departmentOptions}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable<StaffingPosition>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('hr.staffing.emptyTitle')}
        emptyDescription={t('hr.staffing.emptyDescription')}
      />

      {/* Create vacancy modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('hr.staffing.modalCreateTitle')}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              {t('hr.staffing.modalCancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
            >
              {t('hr.staffing.modalCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('hr.staffing.modalFieldDepartment')} required>
            <Input
              value={form.department}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, department: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t('hr.staffing.modalFieldPosition')} required>
            <Input
              value={form.position}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, position: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t('hr.staffing.modalFieldGrade')}>
            <Input
              value={form.grade}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, grade: e.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('hr.staffing.modalFieldSalaryMin')}>
              <Input
                type="number"
                value={form.salaryMin || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    salaryMin: Number(e.target.value),
                  }))
                }
              />
            </FormField>
            <FormField label={t('hr.staffing.modalFieldSalaryMax')}>
              <Input
                type="number"
                value={form.salaryMax || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    salaryMax: Number(e.target.value),
                  }))
                }
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffingSchedulePage;
