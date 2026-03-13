import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Truck,
  Plus,
  AlertTriangle,
  Calendar,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import {
  resourceAllocationApi,
  type ResourceAllocation,
  type CreateResourceAllocationRequest,
  type AllocationConflict,
  type ResourceSuggestion,
  type ResourceType,
} from '@/api/resourceAllocation';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const tp = (k: string) => t(`resourceAllocation.${k}`);

const ResourceAllocationBoardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [filterProjectId, setFilterProjectId] = useState('');

  // Create form
  const [formResourceType, setFormResourceType] = useState<ResourceType>('WORKER');
  const [formResourceId, setFormResourceId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formPercent, setFormPercent] = useState('100');
  const [formRole, setFormRole] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Suggestion form
  const [suggestProjectId, setSuggestProjectId] = useState('');
  const [suggestStartDate, setSuggestStartDate] = useState('');
  const [suggestEndDate, setSuggestEndDate] = useState('');

  const resourceTypeFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase() as ResourceType;

  const { data, isLoading } = useQuery({
    queryKey: ['resource-allocations', filterStartDate, filterEndDate, filterProjectId, resourceTypeFilter],
    queryFn: () => resourceAllocationApi.getAll({
      startDate: filterStartDate,
      endDate: filterEndDate,
      projectId: filterProjectId || undefined,
      resourceType: resourceTypeFilter,
      size: 200,
    }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const { data: conflicts } = useQuery({
    queryKey: ['allocation-conflicts', filterStartDate, filterEndDate],
    queryFn: () => resourceAllocationApi.getConflicts(filterStartDate, filterEndDate),
    enabled: !!filterStartDate && !!filterEndDate,
  });

  const { data: suggestions, refetch: fetchSuggestions } = useQuery({
    queryKey: ['allocation-suggestions', suggestProjectId, suggestStartDate, suggestEndDate],
    queryFn: () => resourceAllocationApi.getSuggestions(suggestProjectId, suggestStartDate, suggestEndDate),
    enabled: false,
  });

  const allocations = data?.content ?? [];
  const conflictList = conflicts ?? [];
  const suggestionList = suggestions ?? [];
  const projectOptions = (projects?.content ?? []).map((p) => ({ value: p.id, label: p.name }));
  const resourceTypeOptions = [
    { value: 'WORKER', label: tp('typeWorker') },
    { value: 'EQUIPMENT', label: tp('typeEquipment') },
  ];

  const metrics = useMemo(() => ({
    total: allocations.length,
    workers: allocations.filter((a) => a.resourceType === 'WORKER').length,
    equipment: allocations.filter((a) => a.resourceType === 'EQUIPMENT').length,
    conflicts: conflictList.length,
  }), [allocations, conflictList]);

  const tabs = [
    { id: 'all', label: tp('tabAll'), count: metrics.total },
    { id: 'worker', label: tp('tabWorkers'), count: metrics.workers },
    { id: 'equipment', label: tp('tabEquipment'), count: metrics.equipment },
  ];

  const createMutation = useMutation({
    mutationFn: (data: CreateResourceAllocationRequest) => resourceAllocationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['allocation-conflicts'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(tp('createError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resourceAllocationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['allocation-conflicts'] });
      toast.success(tp('deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetForm = () => {
    setFormResourceType('WORKER');
    setFormResourceId('');
    setFormProjectId('');
    setFormStartDate('');
    setFormEndDate('');
    setFormPercent('100');
    setFormRole('');
    setFormNotes('');
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      resourceType: formResourceType,
      resourceId: formResourceId,
      projectId: formProjectId,
      startDate: formStartDate,
      endDate: formEndDate,
      allocationPercent: parseInt(formPercent, 10) || 100,
      role: formRole || undefined,
      notes: formNotes || undefined,
    });
  }, [formResourceType, formResourceId, formProjectId, formStartDate, formEndDate, formPercent, formRole, formNotes]);

  const handleShowSuggestions = (pId?: string, sDate?: string, eDate?: string) => {
    const pid = pId ?? suggestProjectId;
    const sd = sDate ?? suggestStartDate;
    const ed = eDate ?? suggestEndDate;
    if (sd && ed) {
      // Update state for the query key
      if (pId !== undefined) setSuggestProjectId(pId);
      if (sDate !== undefined) setSuggestStartDate(sDate);
      if (eDate !== undefined) setSuggestEndDate(eDate);
      fetchSuggestions();
      setShowSuggestions(true);
    }
  };

  const columns = [
    {
      accessorKey: 'resourceName',
      header: tp('colResource'),
      cell: ({ row }: { row: { original: ResourceAllocation } }) => (
        <div>
          <span className="font-medium">{row.original.resourceName || row.original.resourceId.slice(0, 8)}</span>
          <StatusBadge
            status={row.original.resourceType === 'WORKER' ? tp('typeWorker') : tp('typeEquipment')}
            colorMap={{ [tp('typeWorker')]: 'blue', [tp('typeEquipment')]: 'purple' }}
          />
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: tp('colProject'),
      cell: ({ row }: { row: { original: ResourceAllocation } }) =>
        row.original.projectName || row.original.projectId.slice(0, 8),
    },
    {
      accessorKey: 'startDate',
      header: tp('colPeriod'),
      cell: ({ row }: { row: { original: ResourceAllocation } }) =>
        `${formatDate(row.original.startDate)} — ${formatDate(row.original.endDate)}`,
    },
    {
      accessorKey: 'allocationPercent',
      header: tp('colPercent'),
      cell: ({ row }: { row: { original: ResourceAllocation } }) => {
        const pct = row.original.allocationPercent;
        const color = pct > 100 ? 'text-danger-600 dark:text-danger-400' : pct === 100 ? 'text-success-600 dark:text-success-400' : 'text-primary-600 dark:text-primary-400';
        return <span className={`font-semibold tabular-nums ${color}`}>{pct}%</span>;
      },
    },
    {
      accessorKey: 'role',
      header: tp('colRole'),
      cell: ({ row }: { row: { original: ResourceAllocation } }) => row.original.role || '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: ResourceAllocation } }) => (
        <Button size="xs" variant="ghost" onClick={() => deleteMutation.mutate(row.original.id)}>
          <Trash2 size={12} />
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: tp('breadcrumbPlanning'), href: '/planning/wbs' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConflicts(true)}>
              <AlertTriangle size={14} className="mr-1" />
              {tp('conflictsBtn')} {conflictList.length > 0 && `(${conflictList.length})`}
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} className="mr-1" /> {tp('createAllocation')}
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <FormField label={tp('filterStart')}>
          <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
        </FormField>
        <FormField label={tp('filterEnd')}>
          <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
        </FormField>
        <FormField label={tp('filterProject')}>
          <Select options={[{ value: '', label: tp('allProjects') }, ...projectOptions]} value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)} />
        </FormField>
        <div className="flex items-end">
          <Button variant="outline" size="sm" onClick={() => handleShowSuggestions(filterProjectId, filterStartDate, filterEndDate)}>
            <Lightbulb size={14} className="mr-1" /> {tp('suggestionsBtn')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Calendar size={18} />} label={tp('metricTotal')} value={metrics.total} />
        <MetricCard icon={<Users size={18} />} label={tp('metricWorkers')} value={metrics.workers} />
        <MetricCard icon={<Truck size={18} />} label={tp('metricEquipment')} value={metrics.equipment} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={tp('metricConflicts')}
          value={metrics.conflicts}
          trend={metrics.conflicts > 0 ? { direction: 'up', value: tp('trendConflicts') } : undefined}
        />
      </div>

      {/* Allocations Table */}
      <DataTable columns={columns} data={allocations} loading={isLoading} enableExport />

      {/* Create Allocation Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldType')} required>
            <Select options={resourceTypeOptions} value={formResourceType} onChange={(e) => setFormResourceType(e.target.value as ResourceType)} />
          </FormField>
          <FormField label={tp('fieldResource')} required>
            <Input value={formResourceId} onChange={(e) => setFormResourceId(e.target.value)} placeholder={tp('resourcePlaceholder')} />
          </FormField>
          <FormField label={tp('fieldProject')} required>
            <Select options={projectOptions} value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} placeholder={tp('projectPlaceholder')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldStart')} required>
              <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
            </FormField>
            <FormField label={tp('fieldEnd')} required>
              <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldPercent')}>
              <Input type="number" min="1" max="100" value={formPercent} onChange={(e) => setFormPercent(e.target.value)} />
            </FormField>
            <FormField label={tp('fieldRole')}>
              <Input value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder={tp('rolePlaceholder')} />
            </FormField>
          </div>
          <FormField label={tp('fieldNotes')}>
            <textarea className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200" rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!formResourceId || !formProjectId || !formStartDate || !formEndDate} loading={createMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Conflicts Modal */}
      <Modal open={showConflicts} onClose={() => setShowConflicts(false)} title={tp('conflictsModalTitle')}>
        <div className="space-y-3">
          {conflictList.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{tp('noConflicts')}</p>
          ) : (
            conflictList.map((c, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-400">{c.resourceName}</span>
                  <span className="text-xs text-red-500">{c.totalPercent}% {tp('conflictAllocated')}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDate(c.overlapStart)} — {formatDate(c.overlapEnd)}
                </p>
                <div className="mt-1 space-y-1">
                  {c.projects.map((p, j) => (
                    <p key={j} className="text-xs text-neutral-500 dark:text-neutral-400">{p.projectName}: {p.percent}%</p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Suggestions Modal */}
      <Modal open={showSuggestions} onClose={() => setShowSuggestions(false)} title={tp('suggestionsModalTitle')}>
        <div className="space-y-3">
          {suggestionList.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{tp('noSuggestions')}</p>
          ) : (
            suggestionList.map((s, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{s.resourceName}</span>
                  <span className="text-sm text-green-600 font-semibold">{s.availabilityPercent}% {tp('available')}</span>
                </div>
                {s.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {s.skills.map((skill, j) => (
                      <span key={j} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{skill}</span>
                    ))}
                  </div>
                )}
                {s.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.certifications.map((cert, j) => (
                      <span key={j} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">{cert}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ResourceAllocationBoardPage;
