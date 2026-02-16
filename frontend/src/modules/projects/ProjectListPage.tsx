import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import {
  StatusBadge,
  projectStatusColorMap,
  projectStatusLabels,
  projectTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { projectsApi } from '@/api/projects';
import { formatMoney, formatDate } from '@/lib/format';
import { guardDemoModeAction, isDemoMode } from '@/lib/demoMode';
import { t } from '@/i18n';
import type { Project } from '@/types';

type TabId = 'all' | 'IN_PROGRESS' | 'PLANNING' | 'COMPLETED';

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingCancellation, setPendingCancellation] = useState<{ ids: string[]; names: string[] } | null>(null);

  const deleteProjectsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await projectsApi.changeStatus(id, 'CANCELLED' as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const projects = useMemo(() => {
    const content = projectsData?.content ?? [];
    if (content.length > 0) return content;
    return [];
  }, [projectsData]);

  // Filter by tab
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (activeTab === 'IN_PROGRESS') {
      filtered = filtered.filter((p) => p.status === 'IN_PROGRESS');
    } else if (activeTab === 'PLANNING') {
      filtered = filtered.filter((p) => p.status === 'PLANNING' || p.status === 'DRAFT');
    } else if (activeTab === 'COMPLETED') {
      filtered = filtered.filter((p) => p.status === 'COMPLETED');
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.code.toLowerCase().includes(lower) ||
          p.customerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [projects, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: projects.length,
    in_progress: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    planning: projects.filter((p) => p.status === 'PLANNING' || p.status === 'DRAFT').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
  }), [projects]);

  const columns = useMemo<ColumnDef<Project, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('projects.code'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('projects.name'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.customerName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<string>()} colorMap={projectStatusColorMap} />
        ),
      },
      {
        accessorKey: 'type',
        header: t('projects.type'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">
            {projectTypeLabels[getValue<string>()] ?? getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'managerName',
        header: t('projects.manager'),
        size: 160,
      },
      {
        accessorKey: 'plannedEndDate',
        header: t('projects.plannedDeadline'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'budget',
        header: t('projects.budget'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'progress',
        header: t('projects.progress'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums">{val}%</span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (project: Project) => navigate(`/projects/${project.id}`),
    [navigate],
  );

  const handleBulkCancelRequest = useCallback((rows: Project[]) => {
    setPendingCancellation({
      ids: rows.map((row) => row.id),
      names: rows.map((row) => row.name),
    });
  }, []);

  const handleConfirmBulkCancel = useCallback(() => {
    if (!pendingCancellation || pendingCancellation.ids.length === 0) return;
    if (guardDemoModeAction(t('projects.demoCancelProjects'))) {
      setPendingCancellation(null);
      return;
    }

    deleteProjectsMutation.mutate(pendingCancellation.ids, {
      onSettled: () => {
        setPendingCancellation(null);
      },
    });
  }, [deleteProjectsMutation, pendingCancellation]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('projects.title')}
        subtitle={t('projects.inSystem', { count: String(projects.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('nav.projects') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              if (guardDemoModeAction(t('projects.demoCreateProject'))) return;
              navigate('/projects/new');
            }}
          >
            {t('projects.createProject')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('projects.tabAll'), count: tabCounts.all },
          { id: 'IN_PROGRESS', label: t('projects.tabInProgress'), count: tabCounts.in_progress },
          { id: 'PLANNING', label: t('projects.tabPlanning'), count: tabCounts.planning },
          { id: 'COMPLETED', label: t('projects.tabCompleted'), count: tabCounts.completed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('projects.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('projects.allStatuses') },
            ...Object.entries(projectStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<Project>
        data={filteredProjects}
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
            label: t('projects.cancelProjects'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: (rows) => {
              handleBulkCancelRequest(rows);
            },
          },
        ]}
        emptyTitle={t('projects.emptyState')}
        emptyDescription={t('projects.emptyStateDescription')}
      />

      <ConfirmDialog
        open={!!pendingCancellation}
        onClose={() => {
          if (deleteProjectsMutation.isPending) return;
          setPendingCancellation(null);
        }}
        onConfirm={handleConfirmBulkCancel}
        title={t('projects.cancelProjectsTitle')}
        description={t('projects.cancelProjectsDesc', { count: String(pendingCancellation?.ids.length ?? 0) })}
        confirmLabel={t('projects.confirmCancel')}
        cancelLabel={t('projects.keepAsIs')}
        loading={deleteProjectsMutation.isPending}
        items={pendingCancellation?.names}
      />
    </div>
  );
};

export default ProjectListPage;
