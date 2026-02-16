import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Users, UserCheck, Clock, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  applicantStatusColorMap,
  applicantStatusLabels,
  applicantPriorityColorMap,
  applicantPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { recruitmentApi } from '@/api/recruitment';
import { formatDate } from '@/lib/format';
import toast from 'react-hot-toast';
import type { Applicant } from './types';

type TabId = 'all' | 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'NEW', label: 'Новый' },
  { value: 'SCREENING', label: 'Скрининг' },
  { value: 'INTERVIEW', label: 'Собеседование' },
  { value: 'OFFER', label: 'Оффер' },
  { value: 'HIRED', label: 'Принят' },
  { value: 'REJECTED', label: 'Отклонён' },
  { value: 'WITHDRAWN', label: 'Отозван' },
];

const priorityFilterOptions = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочный' },
];


const ApplicantListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const deleteApplicantMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await recruitmentApi.deleteApplicant(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success('Кандидат(ы) удалены');
    },
    onError: () => {
      toast.error('Ошибка при удалении');
    },
  });

  const { data: applicantData, isLoading } = useQuery({
    queryKey: ['applicants'],
    queryFn: () => recruitmentApi.getApplicants(),
  });

  const applicants = applicantData?.content ?? [];

  const filteredApplicants = useMemo(() => {
    let filtered = applicants;
    if (activeTab !== 'all') {
      filtered = filtered.filter((a) => a.status === activeTab);
    }
    if (priorityFilter) {
      filtered = filtered.filter((a) => a.priority === priorityFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.number.toLowerCase().includes(lower) ||
          a.fullName.toLowerCase().includes(lower) ||
          a.positionName.toLowerCase().includes(lower) ||
          a.email.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [applicants, activeTab, priorityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: applicants.length,
    new: applicants.filter((a) => a.status === 'NEW').length,
    screening: applicants.filter((a) => a.status === 'SCREENING').length,
    interview: applicants.filter((a) => a.status === 'INTERVIEW').length,
    offer: applicants.filter((a) => a.status === 'OFFER').length,
    hired: applicants.filter((a) => a.status === 'HIRED').length,
  }), [applicants]);

  const metrics = useMemo(() => {
    const inProgress = applicants.filter((a) => [ 'NEW', 'SCREENING', 'INTERVIEW', 'OFFER'].includes(a.status)).length;
    const hired = applicants.filter((a) => a.status === 'HIRED').length;
    const interviewStage = applicants.filter((a) => a.status === 'INTERVIEW').length;
    const avgExperience = applicants.length > 0
      ? Math.round(applicants.reduce((s, a) => s + (a.experienceYears ?? 0), 0) / applicants.length)
      : 0;
    return { total: applicants.length, inProgress, hired, interviewStage, avgExperience };
  }, [applicants]);

  const columns = useMemo<ColumnDef<Applicant, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'fullName',
        header: 'Кандидат',
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.fullName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Должность',
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-neutral-800 dark:text-neutral-200">{row.original.positionName}</p>
            {row.original.departmentName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.departmentName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={applicantStatusColorMap}
            label={applicantStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Приоритет',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={applicantPriorityColorMap}
            label={applicantPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'experienceYears',
        header: 'Опыт (лет)',
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{getValue<number>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'recruiterName',
        header: 'Рекрутер',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'appliedAt',
        header: 'Дата заявки',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (applicant: Applicant) => navigate(`/recruitment/applicants/${applicant.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Кандидаты"
        subtitle={`${applicants.length} кандидатов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Рекрутинг' },
          { label: 'Кандидаты' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/recruitment/applicants/new')}>
            Новый кандидат
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'NEW', label: 'Новые', count: tabCounts.new },
          { id: 'SCREENING', label: 'Скрининг', count: tabCounts.screening },
          { id: 'INTERVIEW', label: 'Собеседование', count: tabCounts.interview },
          { id: 'OFFER', label: 'Оффер', count: tabCounts.offer },
          { id: 'HIRED', label: 'Приняты', count: tabCounts.hired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label="Всего кандидатов" value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label="В процессе" value={metrics.inProgress} />
        <MetricCard icon={<UserCheck size={18} />} label="Принято" value={metrics.hired} />
        <MetricCard icon={<Star size={18} />} label="Ср. опыт (лет)" value={metrics.avgExperience} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по имени, должности, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={priorityFilterOptions}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<Applicant>
        data={filteredApplicants}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: 'Удалить',
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: `Удалить ${ids.length} кандидат(ов)?`,
                description: 'Операция необратима. Выбранные карточки кандидатов будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteApplicantMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет кандидатов"
        emptyDescription="Добавьте первого кандидата для начала работы"
      />
    </div>
  );
};

export default ApplicantListPage;
