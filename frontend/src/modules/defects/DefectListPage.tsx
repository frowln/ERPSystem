import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2, Clock, BarChart3, Zap, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { defectsApi, type Defect, type DefectSeverity, type DefectStatus as DStatus } from '@/api/defects';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const severityColorMap: Record<string, 'gray' | 'yellow' | 'red' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'red',
  CRITICAL: 'red',
};

const statusColorMap: Record<string, 'yellow' | 'blue' | 'green' | 'green' | 'gray' | 'red'> = {
  OPEN: 'yellow',
  IN_PROGRESS: 'blue',
  FIXED: 'green',
  VERIFIED: 'green',
  CLOSED: 'gray',
  REJECTED: 'red',
};

const getSeverityLabels = (): Record<string, string> => ({
  LOW: t('defects.severityLow'),
  MEDIUM: t('defects.severityMedium'),
  HIGH: t('defects.severityHigh'),
  CRITICAL: t('defects.severityCritical'),
});

const getStatusLabels = (): Record<string, string> => ({
  OPEN: t('defects.statusOpen'),
  IN_PROGRESS: t('defects.statusInProgress'),
  FIXED: t('defects.statusFixed'),
  VERIFIED: t('defects.statusVerified'),
  CLOSED: t('defects.statusClosed'),
  REJECTED: t('defects.statusRejected'),
});

function deadlineInfo(deadline?: string): { text: string; urgent: boolean } | null {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: t('defects.overdue', { days: String(Math.abs(diff)) }), urgent: true };
  if (diff === 0) return { text: t('defects.dueToday'), urgent: true };
  if (diff <= 3) return { text: t('defects.dueSoon', { days: String(diff) }), urgent: true };
  return { text: formatDate(deadline), urgent: false };
}

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'FIXED';

const DefectListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Quick create state
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSeverity, setQuickSeverity] = useState<DefectSeverity>('MEDIUM');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickPhoto, setQuickPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: defectsData, isLoading } = useQuery({
    queryKey: ['defects'],
    queryFn: () => defectsApi.getDefects({ size: 200 }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await defectsApi.deleteDefect(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      toast.success(t('defects.toastDeleted'));
    },
    onError: () => toast.error(t('defects.toastDeleteError')),
  });

  const quickCreateMutation = useMutation({
    mutationFn: async () => {
      const photoUrls = quickPhoto ? JSON.stringify([quickPhoto.name]) : undefined;
      return defectsApi.createDefect({
        projectId: '',
        title: quickTitle.trim(),
        severity: quickSeverity,
        location: quickLocation.trim() || undefined,
        photoUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      toast.success(t('defects.quickCreateSuccess'));
      setQuickTitle('');
      setQuickSeverity('MEDIUM');
      setQuickLocation('');
      setQuickPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setQuickOpen(false);
    },
    onError: () => toast.error(t('defects.quickCreateError')),
  });

  const defects = defectsData?.content ?? [];

  const filteredDefects = useMemo(() => {
    let filtered = defects;
    if (activeTab !== 'all') filtered = filtered.filter(d => d.status === activeTab);
    if (severityFilter) filtered = filtered.filter(d => d.severity === severityFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(lower) ||
        d.code.toLowerCase().includes(lower) ||
        (d.location ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [defects, activeTab, severityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: defects.length,
    open: defects.filter(d => d.status === 'OPEN').length,
    in_progress: defects.filter(d => d.status === 'IN_PROGRESS').length,
    fixed: defects.filter(d => d.status === 'FIXED').length,
  }), [defects]);

  const columns = useMemo<ColumnDef<Defect, unknown>[]>(() => {
    const severityLabels = getSeverityLabels();
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'code',
        header: t('defects.colCode'),
        size: 100,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'title',
        header: t('defects.colTitle'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</p>
            {row.original.location && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'severity',
        header: t('defects.colSeverity'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={severityColorMap}
            label={severityLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('defects.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'fixDeadline',
        header: t('defects.colDeadline'),
        size: 140,
        cell: ({ row }) => {
          const info = deadlineInfo(row.original.fixDeadline);
          if (!info) return <span className="text-xs text-neutral-400">—</span>;
          return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${info.urgent ? 'text-danger-600' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {info.urgent && <Clock size={12} />}
              {info.text}
            </span>
          );
        },
      },
      {
        accessorKey: 'photoUrls',
        header: t('defects.colPhotos'),
        size: 80,
        cell: ({ getValue }) => {
          const raw = getValue<string>();
          if (!raw) return <span className="text-xs text-neutral-400">0</span>;
          try {
            const urls = JSON.parse(raw) as string[];
            return <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{urls.length}</span>;
          } catch {
            return <span className="text-xs text-neutral-400">0</span>;
          }
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('defects.colCreated'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-xs">{formatDate(getValue<string>())}</span>,
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('defects.title')}
        subtitle={t('defects.subtitle', { count: String(defects.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('quality.list.breadcrumbQuality'), href: '/quality' },
          { label: t('defects.breadcrumb') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" iconLeft={<BarChart3 size={16} />} onClick={() => navigate('/defects/dashboard')}>
              {t('defects.btnDashboard')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/defects/new')}>
              {t('defects.btnNew')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('defects.tabAll'), count: tabCounts.all },
          { id: 'OPEN', label: t('defects.tabOpen'), count: tabCounts.open },
          { id: 'IN_PROGRESS', label: t('defects.tabInProgress'), count: tabCounts.in_progress },
          { id: 'FIXED', label: t('defects.tabFixed'), count: tabCounts.fixed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Quick defect creation */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setQuickOpen(!quickOpen)}
          className={cn(
            'flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors',
            'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
            'hover:bg-amber-100 dark:hover:bg-amber-900/40',
          )}
        >
          <Zap size={14} />
          {t('defects.quickCreate')}
          {quickOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {quickOpen && (
          <div className="mt-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              {t('defects.quickCreateHint')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('defects.quickCreateTitle')} *
                </label>
                <Input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder={t('defects.quickCreatePlaceholderTitle')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('defects.quickSeverity')}
                </label>
                <Select
                  value={quickSeverity}
                  onChange={(e) => setQuickSeverity(e.target.value as DefectSeverity)}
                  options={[
                    { value: 'LOW', label: getSeverityLabels().LOW },
                    { value: 'MEDIUM', label: getSeverityLabels().MEDIUM },
                    { value: 'HIGH', label: getSeverityLabels().HIGH },
                    { value: 'CRITICAL', label: getSeverityLabels().CRITICAL },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('defects.quickLocation')}
                </label>
                <Input
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  placeholder={t('defects.quickCreatePlaceholderLocation')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('defects.quickPhoto')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                      'border-neutral-300 dark:border-neutral-600',
                      'text-neutral-700 dark:text-neutral-300',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    )}
                  >
                    <Camera size={14} />
                    {quickPhoto ? quickPhoto.name.slice(0, 20) : t('defects.quickPhoto')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setQuickPhoto(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                iconLeft={<Zap size={14} />}
                loading={quickCreateMutation.isPending}
                disabled={!quickTitle.trim()}
                onClick={() => quickCreateMutation.mutate()}
              >
                {t('defects.quickCreateSubmit')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('defects.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('defects.filterAllSeverities') },
            ...Object.entries(getSeverityLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable<Defect>
        data={filteredDefects}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        enableSavedViews
        pageSize={20}
        onRowClick={(row) => navigate(`/defects/${row.id}`)}
        bulkActions={[
          {
            label: t('defects.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map(r => r.id);
              const ok = await confirm({
                title: t('defects.confirmDeleteTitle', { count: String(ids.length) }),
                description: t('defects.confirmDeleteDescription'),
                confirmLabel: t('defects.confirmDeleteBtn'),
                cancelLabel: t('common.cancel'),
              });
              if (!ok) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('defects.emptyTitle')}
        emptyDescription={t('defects.emptyDescription')}
      />
    </div>
  );
};

export default DefectListPage;
