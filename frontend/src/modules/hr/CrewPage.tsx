import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Users, UserCheck, Briefcase, HardHat } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { projectsApi } from '@/api/projects';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Crew {
  id: string;
  name: string;
  foreman: string;
  foremanPhone?: string;
  workersCount: number;
  currentProject?: string;
  status: 'ACTIVE' | 'IDLE' | 'ON_LEAVE' | 'DISBANDED';
  specialization: string;
  performance: number; // 0-100
  activeOrders: number;
}

const statusColorMap: Record<string, 'green' | 'gray' | 'yellow' | 'red'> = {
  active: 'green',
  idle: 'gray',
  on_leave: 'yellow',
  disbanded: 'red',
};

const statusLabels: Record<string, string> = {
  active: t('hr.crews.statusLabels.active'),
  idle: t('hr.crews.statusLabels.idle'),
  on_leave: t('hr.crews.statusLabels.onLeave'),
  disbanded: t('hr.crews.statusLabels.disbanded'),
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CrewPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);

  const navigate = useNavigate();
  const { data: crewData, isLoading } = useQuery({
    queryKey: ['crews'],
    queryFn: () => hrApi.getCrews(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const projectOptions = useMemo(
    () =>
      (projectsData?.content ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [projectsData],
  );

  const crews = crewData?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return crews;
    const lower = search.toLowerCase();
    return crews.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.foreman.toLowerCase().includes(lower) || c.specialization.toLowerCase().includes(lower),
    );
  }, [crews, search]);

  const totalWorkers = crews.reduce((s, c) => s + c.workersCount, 0);
  const activeCrews = crews.filter((c) => c.status === 'ACTIVE').length;
  const idleCrews = crews.filter((c) => c.status === 'IDLE').length;

  const handleAssign = useCallback((crew: Crew) => {
    setSelectedCrew(crew);
    setShowAssignModal(true);
  }, []);

  const columns = useMemo<ColumnDef<Crew, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: t('hr.crews.columnCrew'),
      size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.specialization}</p>
        </div>
      ),
    },
    { accessorKey: 'foreman', header: t('hr.crews.columnForeman'), size: 150 },
    {
      accessorKey: 'workersCount',
      header: t('hr.crews.columnWorkers'),
      size: 90,
      cell: ({ getValue }) => <span className="tabular-nums font-medium">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'currentProject',
      header: t('hr.crews.columnCurrentProject'),
      size: 180,
      cell: ({ getValue }) => <span className="text-neutral-600">{getValue<string>() ?? <span className="text-neutral-400">{t('hr.crews.notAssigned')}</span>}</span>,
    },
    {
      accessorKey: 'status',
      header: t('hr.crews.columnStatus'),
      size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'performance',
      header: t('hr.crews.columnPerformance'),
      size: 120,
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', val >= 90 ? 'bg-success-500' : val >= 75 ? 'bg-warning-500' : 'bg-danger-500')}
                style={{ width: `${val}%` }}
              />
            </div>
            <span className="text-xs tabular-nums font-medium text-neutral-700 dark:text-neutral-300">{val}%</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => { e.stopPropagation(); handleAssign(row.original); }}
          disabled={row.original.status === 'DISBANDED'}
        >
          {t('hr.crews.modalAssign')}
        </Button>
      ),
    },
  ], [handleAssign]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.crews.title')}
        subtitle={t('hr.crews.subtitle')}
        breadcrumbs={[{ label: t('hr.crews.breadcrumbHome'), href: '/' }, { label: t('hr.breadcrumbPersonnel'), href: '/employees' }, { label: t('hr.crews.title') }]}
        actions={<Button iconLeft={<Plus size={16} />} onClick={() => navigate('/hr/crews/new')}>{t('hr.crews.createCrew')}</Button>}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('hr.crews.metricTotalCrews')} value={crews.length} />
        <MetricCard icon={<HardHat size={18} />} label={t('hr.crews.metricTotalWorkers')} value={totalWorkers} />
        <MetricCard icon={<Briefcase size={18} />} label={t('hr.crews.metricOnSite')} value={activeCrews} trend={{ direction: 'up', value: `${activeCrews}` }} />
        <MetricCard icon={<UserCheck size={18} />} label={t('hr.crews.metricAvailable')} value={idleCrews} />
      </div>

      {/* Crew cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {crews.filter((c) => c.status === 'ACTIVE').slice(0, 3).map((crew) => (
          <div key={crew.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{crew.name}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{crew.specialization}</p>
              </div>
              <StatusBadge status={crew.status} colorMap={statusColorMap} label={statusLabels[crew.status]} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hr.crews.cardForeman')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{crew.foreman}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hr.crews.cardWorkers')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{crew.workersCount} {t('hr.crews.personsSuffix')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hr.crews.cardProject')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{crew.currentProject ?? t('hr.crews.notAssigned')}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-500 dark:text-neutral-400">{t('hr.crews.cardPerformance')}</span>
                <span className="font-medium">{crew.performance}%</span>
              </div>
              <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', crew.performance >= 90 ? 'bg-success-500' : crew.performance >= 75 ? 'bg-warning-500' : 'bg-danger-500')}
                  style={{ width: `${crew.performance}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('hr.crews.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<Crew>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('hr.crews.emptyTitle')}
        emptyDescription={t('hr.crews.emptyDescription')}
      />

      {/* Assign modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={t('hr.crews.modalTitle', { name: selectedCrew?.name ?? '' })}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>{t('hr.crews.modalCancel')}</Button>
            <Button onClick={() => setShowAssignModal(false)}>{t('hr.crews.modalAssign')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('hr.crews.modalFieldProject')} required>
            <Select
              options={projectOptions}
              placeholder={t('hr.crews.modalFieldProjectPlaceholder')}
            />
          </FormField>
          <FormField label={t('hr.crews.modalFieldStartDate')} required>
            <Input type="date" />
          </FormField>
          <FormField label={t('hr.crews.modalFieldComment')}>
            <Textarea placeholder={t('hr.crews.modalFieldCommentPlaceholder')} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default CrewPage;
