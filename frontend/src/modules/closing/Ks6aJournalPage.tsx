import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Download, BookOpen, Calendar, FolderKanban } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { projectsApi } from '@/api/projects';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Ks6aEntry } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currentYear = new Date().getFullYear();

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - i;
  return { value: String(y), label: String(y) };
});

const progressColor = (percent: number) => {
  if (percent >= 100) return 'bg-green-500 dark:bg-green-400';
  if (percent >= 75) return 'bg-blue-500 dark:bg-blue-400';
  if (percent >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
  return 'bg-neutral-400 dark:bg-neutral-500';
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const Ks6aJournalPage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState(String(currentYear));

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const { data: entries, isLoading } = useQuery<Ks6aEntry[]>({
    queryKey: ['ks6a-entries', projectId, year],
    queryFn: () => closingApi.getKs6aEntries(projectId, parseInt(year, 10)),
    enabled: !!projectId && !!year,
  });

  const items = entries ?? [];

  const handleExport = () => {
    toast.success(t('closing.ks6a.toastExportStarted'));
  };

  const columns = useMemo<ColumnDef<Ks6aEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'month',
        header: t('closing.ks6a.colMonth'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'workItem',
        header: t('closing.ks6a.colWorkItem'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="text-neutral-800 dark:text-neutral-200">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('closing.ks6a.colUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'planQty',
        header: t('closing.ks6a.colPlanQty'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'cumulativeQty',
        header: t('closing.ks6a.colCumulativeQty'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-medium">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'thisMonthQty',
        header: t('closing.ks6a.colThisMonthQty'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-primary-700 dark:text-primary-400 font-medium">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'progressPercent',
        header: t('closing.ks6a.colProgress'),
        size: 180,
        cell: ({ getValue }) => {
          const percent = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    progressColor(percent),
                  )}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-400 w-12 text-right">
                {percent.toFixed(1)}%
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closing.ks6a.title')}
        subtitle={t('closing.ks6a.subtitle')}
        breadcrumbs={[
          { label: t('closing.ks2.breadcrumbHome'), href: '/' },
          { label: t('closing.ks6a.breadcrumb') },
        ]}
        actions={
          projectId ? (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} className="mr-1" />
              {t('closing.ks6a.actionExport')}
            </Button>
          ) : null
        }
      />

      {/* Selectors */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} className="text-neutral-400" />
          <div className="w-64">
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('closing.ks6a.selectProject')}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-neutral-400" />
          <div className="w-32">
            <Select
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table or empty state */}
      {projectId ? (
        <DataTable<Ks6aEntry>
          data={items}
          columns={columns}
          loading={isLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={50}
          emptyTitle={t('closing.ks6a.emptyTitle')}
          emptyDescription={t('closing.ks6a.emptyDescription')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('closing.ks6a.selectProjectHint')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Ks6aJournalPage;
