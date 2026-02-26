import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Circle,
  BarChart3,
  Printer,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { CommissioningItem, CommissioningItemStatus } from './types';
import type { PaginatedResponse } from '@/types';

const statusColorMap: Record<string, 'green' | 'yellow' | 'gray' | 'blue'> = {
  completed: 'green',
  in_progress: 'yellow',
  not_started: 'gray',
  n_a: 'blue',
};

const getStatusLabel = (status: CommissioningItemStatus): string => {
  switch (status) {
    case 'completed':
      return t('closeout.commChecklistStatusCompleted');
    case 'in_progress':
      return t('closeout.commChecklistStatusInProgress');
    case 'not_started':
      return t('closeout.commChecklistStatusNotStarted');
    case 'n_a':
      return t('closeout.commChecklistStatusNA');
  }
};

const SECTIONS = [
  'structural',
  'mep',
  'fire_safety',
  'elevators',
  'landscaping',
  'accessibility',
  'documentation',
] as const;

const getSectionLabel = (section: string): string => {
  switch (section) {
    case 'structural':
      return t('closeout.commChecklistSectionStructural');
    case 'mep':
      return t('closeout.commChecklistSectionMep');
    case 'fire_safety':
      return t('closeout.commChecklistSectionFireSafety');
    case 'elevators':
      return t('closeout.commChecklistSectionElevators');
    case 'landscaping':
      return t('closeout.commChecklistSectionLandscaping');
    case 'accessibility':
      return t('closeout.commChecklistSectionAccessibility');
    case 'documentation':
      return t('closeout.commChecklistSectionDocumentation');
    default:
      return section;
  }
};

const CommissioningChecklistPage: React.FC = () => {
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<CommissioningItem | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projects = (projectsData as PaginatedResponse<{ id: string; name: string }> | undefined)?.content ?? [];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['commissioning-checklist-items', selectedProjectId],
    queryFn: () => closeoutApi.getCommissioningItems(selectedProjectId || undefined),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommissioningItemStatus }) =>
      closeoutApi.updateCommissioningItemStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commissioning-checklist-items'] });
      toast.success(t('closeout.commChecklistStatusUpdated'));
    },
    onError: () => {
      toast.error(t('closeout.commChecklistStatusError'));
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { notes?: string } }) =>
      closeoutApi.updateCommissioningItem(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commissioning-checklist-items'] });
      setEditingItem(null);
      toast.success(t('closeout.commChecklistStatusUpdated'));
    },
    onError: () => {
      toast.error(t('closeout.commChecklistStatusError'));
    },
  });

  const filtered = useMemo(() => {
    if (activeSection === 'all') return items;
    return items.filter((item) => item.section === activeSection);
  }, [items, activeSection]);

  const groupedBySection = useMemo(() => {
    const groups: Record<string, CommissioningItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    }
    return groups;
  }, [filtered]);

  const metrics = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const inProgress = items.filter((i) => i.status === 'in_progress').length;
    const notStarted = items.filter((i) => i.status === 'not_started').length;
    const na = items.filter((i) => i.status === 'n_a').length;
    const applicable = total - na;
    const overallPercent = applicable > 0 ? Math.round((completed / applicable) * 100) : 0;
    return { total, completed, inProgress, notStarted, na, overallPercent };
  }, [items]);

  const sectionMetrics = useMemo(() => {
    const map: Record<string, { total: number; completed: number; na: number }> = {};
    for (const item of items) {
      if (!map[item.section]) map[item.section] = { total: 0, completed: 0, na: 0 };
      map[item.section].total += 1;
      if (item.status === 'completed') map[item.section].completed += 1;
      if (item.status === 'n_a') map[item.section].na += 1;
    }
    return map;
  }, [items]);

  const handleStatusChange = useCallback(
    (id: string, status: CommissioningItemStatus) => {
      updateStatusMutation.mutate({ id, status });
    },
    [updateStatusMutation],
  );

  const handleSaveNotes = useCallback(() => {
    if (!editingItem) return;
    updateItemMutation.mutate({ id: editingItem.id, data: { notes: editNotes } });
  }, [editingItem, editNotes, updateItemMutation]);

  const toggleSectionCollapse = useCallback((section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const sectionTabs = useMemo(() => {
    const allCount = items.length;
    const tabs = [{ id: 'all', label: t('common.all'), count: allCount }];
    for (const section of SECTIONS) {
      const count = items.filter((i) => i.section === section).length;
      if (count > 0) {
        tabs.push({ id: section, label: getSectionLabel(section), count });
      }
    }
    return tabs;
  }, [items]);

  const projectOptions = useMemo(
    () => [
      { value: '', label: t('closeout.commChecklistAllProjects') },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  return (
    <div className="animate-fade-in" ref={printRef}>
      <PageHeader
        title={t('closeout.commChecklistTitle')}
        subtitle={t('closeout.commChecklistSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.commChecklistTitle') },
        ]}
        actions={
          <Button
            variant="secondary"
            iconLeft={<Printer size={16} />}
            onClick={handlePrint}
          >
            {t('closeout.commChecklistPrint')}
          </Button>
        }
        tabs={sectionTabs}
        activeTab={activeSection}
        onTabChange={(id) => setActiveSection(id)}
      />

      {/* Project selector */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('closeout.commChecklistProject')}:
          </label>
          <Select
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-72"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardCheck size={18} />}
          label={t('closeout.commChecklistMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('closeout.commChecklistMetricCompleted')}
          value={metrics.completed}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('closeout.commChecklistMetricInProgress')}
          value={metrics.inProgress}
        />
        <MetricCard
          icon={<Circle size={18} />}
          label={t('closeout.commChecklistMetricNotStarted')}
          value={metrics.notStarted}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('closeout.commChecklistMetricOverall')}
          value={`${metrics.overallPercent}%`}
        />
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('closeout.commChecklistOverallProgress')}
          </span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {metrics.overallPercent}%
          </span>
        </div>
        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${metrics.overallPercent}%` }}
          />
        </div>
      </div>

      {/* Section progress bars */}
      {activeSection === 'all' && Object.keys(sectionMetrics).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {SECTIONS.map((section) => {
            const sm = sectionMetrics[section];
            if (!sm) return null;
            const applicable = sm.total - sm.na;
            const pct = applicable > 0 ? Math.round((sm.completed / applicable) * 100) : 0;
            return (
              <div
                key={section}
                className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {getSectionLabel(section)}
                  </span>
                  <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                    {sm.completed}/{applicable}
                    {sm.na > 0 && (
                      <span className="ml-1 text-blue-500">({sm.na} N/A)</span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Checklist items grouped by section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {t('closeout.commChecklistEmpty')}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBySection).map(([section, sectionItems]) => {
            const sm = sectionMetrics[section];
            const applicable = sm ? sm.total - sm.na : sectionItems.length;
            const completed = sm?.completed ?? 0;
            const sectionPct = applicable > 0 ? Math.round((completed / applicable) * 100) : 0;
            const isCollapsed = collapsedSections.has(section);

            return (
              <div
                key={section}
                className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
              >
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse(section)}
                  className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight size={18} className="text-neutral-400" />
                    ) : (
                      <ChevronDown size={18} className="text-neutral-400" />
                    )}
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {getSectionLabel(section)}
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      ({sectionItems.length} {t('closeout.commChecklistItemsLabel')})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${sectionPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums w-10 text-right">
                      {sectionPct}%
                    </span>
                  </div>
                </button>

                {/* Section items */}
                {!isCollapsed && (
                  <div className="border-t border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <StatusBadge
                              status={item.status}
                              colorMap={statusColorMap}
                              label={getStatusLabel(item.status)}
                            />
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {item.itemName}
                            </span>
                          </div>
                          {item.requirement && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-0">
                              {t('closeout.commChecklistRequirement')}: {item.requirement}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <span>{item.responsibleName}</span>
                            {item.completedDate && (
                              <span className="tabular-nums">{item.completedDate}</span>
                            )}
                            {item.notes && (
                              <span className="truncate max-w-[200px]">{item.notes}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="xs"
                            iconLeft={<Edit3 size={12} />}
                            onClick={() => {
                              setEditingItem(item);
                              setEditNotes(item.notes ?? '');
                            }}
                          >
                            {t('closeout.commChecklistEditNotes')}
                          </Button>
                          {item.status !== 'completed' && item.status !== 'n_a' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusChange(item.id, 'completed')}
                            >
                              {t('closeout.commChecklistMarkComplete')}
                            </Button>
                          )}
                          {item.status === 'not_started' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusChange(item.id, 'in_progress')}
                            >
                              {t('closeout.commChecklistMarkInProgress')}
                            </Button>
                          )}
                          {item.status !== 'n_a' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              iconLeft={<MinusCircle size={12} />}
                              onClick={() => handleStatusChange(item.id, 'n_a')}
                            >
                              N/A
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit notes modal */}
      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t('closeout.commChecklistEditNotesTitle')}
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                {editingItem.itemName}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {getSectionLabel(editingItem.section)} | {editingItem.responsibleName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.commChecklistNotesLabel')}
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingItem(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveNotes} loading={updateItemMutation.isPending}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommissioningChecklistPage;
