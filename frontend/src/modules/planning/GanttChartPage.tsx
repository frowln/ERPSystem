import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ChevronRight, ChevronDown, Search, Calendar, AlertTriangle, GitBranch,
  BarChart3, FolderTree, Route, Clock, Layers, CalendarCheck, GitCompare,
  ChevronsDownUp, ChevronsUpDown,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney } from '@/lib/format';
import { planningApi } from '@/api/planning';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { WbsNode, ScheduleBaseline, CriticalPathTask } from './types';
import type { Project, PaginatedResponse } from '@/types';

// ─── Shared tab type ────────────────────────────────────────────────────────
type PlanningTab = 'gantt' | 'wbs' | 'critical-path' | 'baselines';

const TAB_ICONS: Record<PlanningTab, React.ReactNode> = {
  gantt: <BarChart3 size={15} />,
  wbs: <FolderTree size={15} />,
  'critical-path': <Route size={15} />,
  baselines: <CalendarCheck size={15} />,
};

// ─── Shared helpers ──────────────────────────────────────────────────────────
function flattenTree(nodes: WbsNode[]): WbsNode[] {
  const result: WbsNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) result.push(...flattenTree(node.children));
  }
  return result;
}

const TODAY = new Date();

function computeTimeRange(nodes: WbsNode[]): { start: Date; end: Date; totalDays: number } {
  const flat = flattenTree(nodes);
  if (flat.length === 0) {
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    return { start, end, totalDays: 365 };
  }
  let minDate = Infinity;
  let maxDate = -Infinity;
  for (const n of flat) {
    const s = new Date(n.plannedStartDate).getTime();
    const e = new Date(n.plannedEndDate).getTime();
    if (s < minDate) minDate = s;
    if (e > maxDate) maxDate = e;
  }
  const start = new Date(minDate);
  const end = new Date(maxDate);
  end.setMonth(end.getMonth() + 1);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return { start, end, totalDays };
}

function computeMonths(start: Date, end: Date): string[] {
  const result: string[] = [];
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 3)) {
    result.push(d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }));
  }
  return result;
}

// ─── WBS helpers ─────────────────────────────────────────────────────────────
const getNodeTypeLabels = (): Record<string, string> => ({
  PROJECT: t('planning.wbs.nodeTypeProject'),
  PHASE: t('planning.wbs.nodeTypePhase'),
  WORK_PACKAGE: t('planning.wbs.nodeTypeWorkPackage'),
  ACTIVITY: t('planning.wbs.nodeTypeActivity'),
  MILESTONE: t('planning.wbs.nodeTypeMilestone'),
});

const nodeTypeColors: Record<string, string> = {
  PROJECT: 'bg-primary-100 text-primary-700',
  PHASE: 'bg-purple-100 text-purple-700',
  WORK_PACKAGE: 'bg-blue-100 text-blue-700',
  ACTIVITY: 'bg-green-100 text-green-700',
  MILESTONE: 'bg-orange-100 text-orange-700',
};

// ─── Baselines helpers ───────────────────────────────────────────────────────
const baselineStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'purple'> = {
  DRAFT: 'gray',
  APPROVED: 'blue',
  ACTIVE: 'green',
  SUPERSEDED: 'purple',
  ORIGINAL: 'blue',
  CURRENT: 'green',
  REVISED: 'yellow',
};

const getBaselineStatusLabels = (): Record<string, string> => ({
  DRAFT: t('planning.baselines.statusDraft'),
  APPROVED: t('planning.baselines.statusApproved'),
  ACTIVE: t('planning.baselines.statusActive'),
  SUPERSEDED: t('planning.baselines.statusSuperseded'),
  ORIGINAL: t('planning.baselines.statusOriginal'),
  CURRENT: t('planning.baselines.statusCurrent'),
  REVISED: t('planning.baselines.statusRevised'),
});

// ─── Zoom type ───────────────────────────────────────────────────────────────
type ZoomLevel = 'month' | 'quarter' | 'year';

function computeTimeLabels(start: Date, end: Date, zoom: ZoomLevel): { label: string; pct: number }[] {
  const result: { label: string; pct: number }[] = [];
  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return result;
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ru-RU';

  const step = zoom === 'month' ? 1 : zoom === 'quarter' ? 3 : 12;
  const fmt: Intl.DateTimeFormatOptions =
    zoom === 'year'
      ? { year: 'numeric' }
      : zoom === 'quarter'
        ? { month: 'short', year: '2-digit' }
        : { month: 'short', year: '2-digit' };

  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; ) {
    const pct = ((d.getTime() - start.getTime()) / totalMs) * 100;
    if (pct >= 0 && pct <= 100) {
      result.push({ label: d.toLocaleDateString(locale, fmt), pct });
    }
    d.setMonth(d.getMonth() + step);
  }
  return result;
}

// ═════════════════════════════════════════════════════════════════════════════
// GANTT TAB
// ═════════════════════════════════════════════════════════════════════════════
function GanttTab({
  tree,
  allNodes,
  search,
  setSearch,
  showCriticalOnly,
  setShowCriticalOnly,
  expandedIds,
  toggleExpand,
  setExpandedIds,
  isLoading,
  isError,
}: {
  tree: WbsNode[];
  allNodes: WbsNode[];
  search: string;
  setSearch: (s: string) => void;
  showCriticalOnly: string;
  setShowCriticalOnly: (s: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  setExpandedIds: (s: Set<string>) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const [zoom, setZoom] = useState<ZoomLevel>('quarter');

  const timeRange = useMemo(() => computeTimeRange(tree), [tree]);
  const timeLabels = useMemo(() => computeTimeLabels(timeRange.start, timeRange.end, zoom), [timeRange, zoom]);

  const minWidth = zoom === 'month' ? 1600 : zoom === 'quarter' ? 1000 : 600;

  function dateToPercent(dateStr: string): number {
    const d = new Date(dateStr);
    const days = Math.ceil((d.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (days / timeRange.totalDays) * 100));
  }

  const todayPercent = dateToPercent(TODAY.toISOString());
  const criticalCount = allNodes.filter((n) => n.isCriticalPath).length;
  const delayedCount = allNodes.filter((n) => n.totalFloat < 0).length;
  const avgProgress = allNodes.length > 0 ? Math.round(allNodes.reduce((s, n) => s + n.percentComplete, 0) / allNodes.length) : 0;

  const getVisibleNodes = useCallback(
    (nodes: WbsNode[], depth: number = 0): { node: WbsNode; depth: number }[] => {
      const result: { node: WbsNode; depth: number }[] = [];
      for (const node of nodes) {
        if (search) {
          const lower = search.toLowerCase();
          const matches = node.name.toLowerCase().includes(lower) || node.code.toLowerCase().includes(lower);
          if (!matches) continue;
        }
        if (showCriticalOnly === 'CRITICAL' && !node.isCriticalPath) continue;
        result.push({ node, depth });
        if (node.children && expandedIds.has(node.id)) {
          result.push(...getVisibleNodes(node.children, depth + 1));
        }
      }
      return result;
    },
    [expandedIds, search, showCriticalOnly],
  );

  const visibleNodes = useMemo(() => getVisibleNodes(tree), [getVisibleNodes, tree]);

  // Expand / Collapse All
  const expandAll = useCallback(() => {
    setExpandedIds(new Set(allNodes.map((n) => n.id)));
  }, [allNodes, setExpandedIds]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, [setExpandedIds]);

  const isSummaryNode = (nodeType: string) => ['PHASE', 'SUMMARY', 'PROJECT'].includes(nodeType);

  const renderGanttBar = (node: WbsNode) => {
    const plannedStart = dateToPercent(node.plannedStartDate);
    const plannedEnd = dateToPercent(node.plannedEndDate);
    const plannedWidth = plannedEnd - plannedStart;

    const actualStart = node.actualStartDate ? dateToPercent(node.actualStartDate) : plannedStart;
    const actualEnd = node.actualEndDate
      ? dateToPercent(node.actualEndDate)
      : actualStart + (plannedWidth * node.percentComplete) / 100;
    const actualWidth = actualEnd - actualStart;

    // Milestone: diamond
    if (node.nodeType === 'MILESTONE') {
      return (
        <div className="relative h-full flex items-center">
          <div
            className="absolute w-3 h-3 rotate-45 bg-orange-500 border-2 border-orange-600"
            style={{ left: `${plannedStart}%`, transform: 'translateX(-50%) rotate(45deg)' }}
          />
          {node.percentComplete === 100 && (
            <div
              className="absolute w-2 h-2 rotate-45 bg-success-500"
              style={{ left: `${plannedStart}%`, transform: 'translateX(-50%) rotate(45deg)' }}
            />
          )}
        </div>
      );
    }

    // Summary/Phase: thinner bar with bracket ends
    if (isSummaryNode(node.nodeType)) {
      return (
        <div className="relative h-full flex items-center">
          <div
            className="absolute h-2 bg-neutral-700 dark:bg-neutral-300 rounded-sm"
            style={{ left: `${plannedStart}%`, width: `${Math.max(plannedWidth, 0.5)}%` }}
          />
          {/* Progress fill */}
          <div
            className={cn('absolute h-2 rounded-sm', node.isCriticalPath ? 'bg-danger-600' : 'bg-neutral-500 dark:bg-neutral-400')}
            style={{ left: `${actualStart}%`, width: `${Math.max(actualWidth, 0.2)}%` }}
          />
          {/* Bracket ends */}
          <div className="absolute w-[3px] h-3 bg-neutral-700 dark:bg-neutral-300 rounded-sm" style={{ left: `${plannedStart}%` }} />
          <div className="absolute w-[3px] h-3 bg-neutral-700 dark:bg-neutral-300 rounded-sm" style={{ left: `${Math.max(plannedStart + plannedWidth - 0.2, plannedStart)}%` }} />
          <span
            className="absolute text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
            style={{ left: `${Math.min(plannedStart + plannedWidth + 0.5, 95)}%`, top: '-2px' }}
          >
            {node.percentComplete}%
          </span>
        </div>
      );
    }

    // Regular task bar
    return (
      <div className="relative h-full flex items-center">
        {/* Planned bar (background) */}
        <div
          className={cn('absolute h-3 rounded-full', node.isCriticalPath ? 'bg-danger-100' : 'bg-neutral-200 dark:bg-neutral-700')}
          style={{ left: `${plannedStart}%`, width: `${Math.max(plannedWidth, 0.5)}%` }}
        />
        {/* Actual/progress bar */}
        <div
          className={cn(
            'absolute h-3 rounded-full',
            node.percentComplete === 100
              ? 'bg-success-500'
              : node.isCriticalPath
                ? 'bg-danger-500'
                : 'bg-primary-500',
          )}
          style={{ left: `${actualStart}%`, width: `${Math.max(actualWidth, 0.3)}%` }}
        />
        <span
          className="absolute text-[10px] font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
          style={{ left: `${Math.min(actualStart + actualWidth + 0.5, 95)}%`, top: '-2px' }}
        >
          {node.percentComplete}%
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-neutral-500">{t('planning.gantt.loading')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
        <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
        <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('planning.gantt.errorTitle')}</p>
        <p className="text-sm text-neutral-400">{t('planning.gantt.errorDescription')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard icon={<Calendar size={18} />} label={t('planning.gantt.totalTasks')} value={allNodes.length} />
        <MetricCard icon={<GitBranch size={18} />} label={t('planning.gantt.criticalPath')} value={criticalCount} subtitle={t('planning.gantt.tasksSuffix')} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('planning.gantt.delayed')}
          value={delayedCount}
          subtitle={t('planning.gantt.tasksSuffix')}
          trend={{ direction: delayedCount > 0 ? 'down' : 'neutral', value: delayedCount > 0 ? t('planning.gantt.needAttention') : t('planning.gantt.none') }}
        />
        <MetricCard label={t('planning.gantt.avgProgress')} value={`${avgProgress}%`} />
        <MetricCard label={t('planning.gantt.dataDate')} value={formatDate(TODAY.toISOString())} />
      </div>

      {/* Toolbar: search + filter + zoom + expand/collapse */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('planning.gantt.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('planning.gantt.allTasks') },
            { value: 'CRITICAL', label: t('planning.gantt.criticalPathOnly') },
          ]}
          value={showCriticalOnly}
          onChange={(e) => setShowCriticalOnly(e.target.value)}
          className="w-56"
        />

        {/* Zoom controls */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          {(['month', 'quarter', 'year'] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoom(level)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                zoom === level
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700',
              )}
            >
              {t(`planning.gantt.zoom${level.charAt(0).toUpperCase() + level.slice(1)}`)}
            </button>
          ))}
        </div>

        {/* Expand / Collapse All */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={expandAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            title={t('planning.gantt.expandAll')}
          >
            <ChevronsDownUp size={14} />
            {t('planning.gantt.expandAll')}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            title={t('planning.gantt.collapseAll')}
          >
            <ChevronsUpDown size={14} />
            {t('planning.gantt.collapseAll')}
          </button>
        </div>
      </div>

      {allNodes.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
          <BarChart3 size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('planning.gantt.emptyTitle')}</p>
          <p className="text-sm text-neutral-400">{t('planning.gantt.emptyDescription')}</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="flex">
              {/* Left panel - task list */}
              <div className="w-[420px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700">
                <div className="h-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-4 gap-4">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase flex-1">
                    {t('planning.gantt.taskColumnHeader')}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase w-16 text-center">{t('planning.gantt.colDuration')}</span>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase w-10 text-center">%</span>
                </div>
                {visibleNodes.map(({ node, depth }) => {
                  const hasChildren = node.children && node.children.length > 0;
                  const isExpanded = expandedIds.has(node.id);
                  const isSummary = isSummaryNode(node.nodeType);
                  return (
                    <div
                      key={node.id}
                      className={cn(
                        'h-9 flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                        node.isCriticalPath && 'bg-danger-50/30 dark:bg-danger-950/20',
                        isSummary && 'bg-neutral-50/80 dark:bg-neutral-800/50',
                      )}
                      style={{ paddingLeft: `${depth * 20 + 12}px` }}
                    >
                      {hasChildren ? (
                        <button onClick={() => toggleExpand(node.id)} className="p-0.5 text-neutral-400 hover:text-neutral-600 mr-1">
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      ) : (
                        <span className="w-4 mr-1" />
                      )}
                      <span className="font-mono text-[10px] text-neutral-400 mr-2 w-8 flex-shrink-0">{node.code}</span>
                      <span className={cn(
                        'text-xs truncate flex-1',
                        node.isCriticalPath ? 'text-danger-700 dark:text-danger-400 font-medium' : 'text-neutral-800 dark:text-neutral-200',
                        isSummary && 'font-semibold',
                      )}>
                        {node.name}
                      </span>
                      <span className="text-[10px] tabular-nums text-neutral-400 w-16 text-center flex-shrink-0">
                        {node.nodeType === 'MILESTONE' ? '---' : `${node.level !== undefined ? (new Date(node.plannedEndDate).getTime() - new Date(node.plannedStartDate).getTime()) / 86400000 : 0} ${t('planning.wbs.daysUnit')}`}
                      </span>
                      <span className={cn(
                        'text-[10px] tabular-nums font-medium w-10 text-center flex-shrink-0',
                        node.percentComplete === 100 ? 'text-success-600' : node.percentComplete > 0 ? 'text-primary-600' : 'text-neutral-400',
                      )}>
                        {node.percentComplete}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Right panel - Gantt bars */}
              <div className="flex-1 overflow-x-auto">
                <div className={cn('h-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center relative')} style={{ minWidth: `${minWidth}px` }}>
                  {timeLabels.map((tl, idx) => (
                    <div key={idx} className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium absolute" style={{ left: `${tl.pct}%` }}>
                      <div className="px-1">{tl.label}</div>
                    </div>
                  ))}
                </div>
                <div className="relative" style={{ minWidth: `${minWidth}px` }}>
                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-px bg-danger-400 z-10" style={{ left: `${todayPercent}%` }}>
                    <div className="absolute -top-0 -translate-x-1/2 bg-danger-500 text-white text-[8px] px-1 rounded">
                      {t('planning.gantt.today')}
                    </div>
                  </div>

                  {/* Grid lines */}
                  {timeLabels.map((tl, idx) => (
                    <div key={idx} className="absolute top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800" style={{ left: `${tl.pct}%` }} />
                  ))}

                  {visibleNodes.map(({ node }) => (
                    <div key={node.id} className={cn('h-9 relative border-b border-neutral-100 dark:border-neutral-800', node.isCriticalPath && 'bg-danger-50/20 dark:bg-danger-950/10')}>
                      {renderGanttBar(node)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 px-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-primary-500" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.gantt.legendProgress')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-danger-500" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.gantt.legendCriticalPath')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-success-500" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.gantt.legendCompleted')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.gantt.legendPlannedDuration')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-neutral-700 dark:bg-neutral-300 rounded-sm" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.gantt.legendSummaryBar')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rotate-45 bg-orange-500" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.gantt.legendMilestone')}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// WBS TAB
// ═════════════════════════════════════════════════════════════════════════════
function WbsTab({
  tree,
  allNodes,
  search,
  setSearch,
  expandedIds,
  toggleExpand,
  isLoading,
}: {
  tree: WbsNode[];
  allNodes: WbsNode[];
  search: string;
  setSearch: (s: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  isLoading: boolean;
}) {
  const criticalCount = allNodes.filter((n) => n.isCriticalPath).length;
  const avgProgress = allNodes.length > 0 ? Math.round(allNodes.reduce((s, n) => s + n.percentComplete, 0) / allNodes.length) : 0;

  const renderNode = (node: WbsNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const nodeTypeLabels = getNodeTypeLabels();

    if (search) {
      const lower = search.toLowerCase();
      const matchesSelf = node.name.toLowerCase().includes(lower) || node.code.toLowerCase().includes(lower);
      const matchesChildren = hasChildren && node.children!.some(
        (c) => c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower),
      );
      if (!matchesSelf && !matchesChildren) return null;
    }

    return (
      <React.Fragment key={node.id}>
        <tr className={cn(
          'border-b border-neutral-100 dark:border-neutral-800 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
          node.isCriticalPath && 'bg-danger-50/30',
        )}>
          <td className="px-4 py-2.5 whitespace-nowrap" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{node.code}</span>
            </div>
          </td>
          <td className="px-4 py-2.5">
            <span className={cn('text-sm font-medium', node.isCriticalPath ? 'text-danger-700' : 'text-neutral-900 dark:text-neutral-100')}>
              {node.name}
            </span>
          </td>
          <td className="px-4 py-2.5">
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', nodeTypeColors[node.nodeType])}>
              {nodeTypeLabels[node.nodeType]}
            </span>
          </td>
          <td className="px-4 py-2.5 text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{formatDate(node.plannedStartDate)}</td>
          <td className="px-4 py-2.5 text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{formatDate(node.plannedEndDate)}</td>
          <td className="px-4 py-2.5 text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{node.actualStartDate ? formatDate(node.actualStartDate) : '---'}</td>
          <td className="px-4 py-2.5 text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{node.actualEndDate ? formatDate(node.actualEndDate) : '---'}</td>
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    node.percentComplete === 100 ? 'bg-success-500' : node.isCriticalPath ? 'bg-danger-500' : 'bg-primary-500',
                  )}
                  style={{ width: `${node.percentComplete}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums w-8 text-right">{node.percentComplete}%</span>
            </div>
          </td>
          <td className="px-4 py-2.5">
            <span className={cn(
              'text-xs font-medium tabular-nums',
              node.totalFloat < 0 ? 'text-danger-600' : node.totalFloat === 0 ? 'text-warning-600' : 'text-success-600',
            )}>
              {node.totalFloat > 0 ? `+${node.totalFloat}` : node.totalFloat} {t('planning.wbs.daysUnit')}
            </span>
          </td>
        </tr>
        {hasChildren && isExpanded && node.children!.map((child) => renderNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<GitBranch size={18} />} label={t('planning.wbs.metricTotalNodes')} value={allNodes.length} />
        <MetricCard label={t('planning.wbs.metricProgress')} value={`${avgProgress}%`} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('planning.wbs.criticalPath')} value={criticalCount} subtitle={t('planning.wbs.elementsSuffix')} />
        <MetricCard label={t('planning.wbs.phases')} value={allNodes.filter((n) => n.nodeType === 'PHASE').length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('planning.wbs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('planning.wbs.loading')}</p>
        </div>
      ) : tree.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 py-20 text-center">
          <FolderTree size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('planning.wbs.emptyTitle')}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('planning.wbs.emptyDescription')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-40">{t('planning.wbs.colCode')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('planning.wbs.colName')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-32">{t('planning.wbs.colType')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-28">{t('planning.wbs.colPlannedStart')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-28">{t('planning.wbs.colPlannedEnd')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-28">{t('planning.wbs.colActualStart')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-28">{t('planning.wbs.colActualEnd')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-36">{t('planning.wbs.colProgress')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-20">{t('planning.wbs.colFloat')}</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((node) => renderNode(node, 0))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CRITICAL PATH TAB
// ═════════════════════════════════════════════════════════════════════════════
function CriticalPathTab({ projectId }: { projectId: string }) {
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<CriticalPathTask[]>({
    queryKey: ['critical-path', projectId],
    queryFn: () => planningApi.getCriticalPathTasks(projectId),
    enabled: !!projectId,
  });

  const tasks = data ?? [];

  const groups = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => { if (task.group) set.add(task.group); });
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (groupFilter) result = result.filter((task) => task.group === groupFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((task) => task.name.toLowerCase().includes(lower));
    }
    return result;
  }, [tasks, groupFilter, search]);

  const criticalTasks = tasks.filter((task) => task.isCritical);
  const projectDuration = tasks.length > 0 ? Math.max(...tasks.map((task) => task.lateFinish)) : 0;
  const criticalPathLength = criticalTasks.length > 0 ? criticalTasks.reduce((sum, task) => sum + task.duration, 0) : 0;
  const maxFinish = tasks.length > 0 ? Math.max(...tasks.map((t) => t.lateFinish)) : 1;

  const columns = useMemo<ColumnDef<CriticalPathTask, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('planning.cpm.colTaskName'),
        size: 250,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.isCritical && <AlertTriangle size={14} className="text-danger-500 flex-shrink-0" />}
            <span className={cn('font-medium', row.original.isCritical ? 'text-danger-700 dark:text-danger-400' : 'text-neutral-900 dark:text-neutral-100')}>
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'duration',
        header: t('planning.cpm.colDuration'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<number>()} {t('planning.cpm.daysUnit')}</span>,
      },
      {
        accessorKey: 'earlyStart',
        header: t('planning.cpm.colEarlyStart'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'earlyFinish',
        header: t('planning.cpm.colEarlyFinish'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'lateStart',
        header: t('planning.cpm.colLateStart'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'lateFinish',
        header: t('planning.cpm.colLateFinish'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'totalFloat',
        header: t('planning.cpm.colFloat'),
        size: 100,
        cell: ({ row }) => {
          const val = row.original.totalFloat;
          return (
            <span className={cn(
              'tabular-nums font-semibold',
              val === 0 ? 'text-danger-600 dark:text-danger-400' : val <= 3 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400',
            )}>
              {val} {t('planning.cpm.daysUnit')}
            </span>
          );
        },
      },
      {
        id: 'gantt',
        header: t('planning.cpm.colGanttBar'),
        size: 200,
        cell: ({ row }) => {
          const task = row.original;
          const startPct = (task.earlyStart / maxFinish) * 100;
          const widthPct = Math.max((task.duration / maxFinish) * 100, 1);
          return (
            <div className="relative h-5 w-full">
              <div className={cn('absolute h-4 rounded top-0.5', task.isCritical ? 'bg-danger-500' : 'bg-primary-400')} style={{ left: `${startPct}%`, width: `${widthPct}%` }} />
            </div>
          );
        },
      },
    ],
    [maxFinish],
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Layers size={18} />} label={t('planning.cpm.metricTotalTasks')} value={tasks.length} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('planning.cpm.metricCriticalTasks')}
          value={criticalTasks.length}
          trend={criticalTasks.length > 0 ? { direction: 'down', value: `${((criticalTasks.length / Math.max(tasks.length, 1)) * 100).toFixed(0)}%` } : undefined}
        />
        <MetricCard icon={<Clock size={18} />} label={t('planning.cpm.metricProjectDuration')} value={`${projectDuration} ${t('planning.cpm.daysUnit')}`} />
        <MetricCard icon={<Route size={18} />} label={t('planning.cpm.metricCriticalPathLength')} value={`${criticalPathLength} ${t('planning.cpm.daysUnit')}`} />
      </div>

      {/* Gantt-like visualization */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('planning.cpm.ganttTitle')}</h3>
        <div className="space-y-1">
          {filtered.slice(0, 20).map((task) => {
            const startPct = (task.earlyStart / maxFinish) * 100;
            const widthPct = Math.max((task.duration / maxFinish) * 100, 1);
            return (
              <div key={task.id} className="flex items-center gap-3">
                <span className={cn('text-xs w-40 truncate flex-shrink-0', task.isCritical ? 'text-danger-700 dark:text-danger-400 font-medium' : 'text-neutral-600 dark:text-neutral-400')}>
                  {task.name}
                </span>
                <div className="flex-1 relative h-5 bg-neutral-50 dark:bg-neutral-800 rounded">
                  <div className={cn('absolute h-4 rounded top-0.5', task.isCritical ? 'bg-danger-500' : 'bg-primary-400')} style={{ left: `${startPct}%`, width: `${widthPct}%` }} />
                </div>
                <span className="text-[10px] tabular-nums text-neutral-400 w-10 text-right flex-shrink-0">{task.totalFloat}d</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-2.5 rounded bg-danger-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.cpm.legendCritical')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-2.5 rounded bg-primary-400" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('planning.cpm.legendNonCritical')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('planning.cpm.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[{ value: '', label: t('planning.cpm.allGroups') }, ...groups.map((g) => ({ value: g, label: g }))]}
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<CriticalPathTask>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('planning.cpm.emptyTitle')}
        emptyDescription={t('planning.cpm.emptyDescription')}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BASELINES TAB
// ═════════════════════════════════════════════════════════════════════════════
/** Normalize backend baselineType → frontend status for display */
function normalizeBaseline(raw: Record<string, unknown>): ScheduleBaseline {
  const r = raw as unknown as ScheduleBaseline & { baselineType?: string; baselineTypeDisplayName?: string };
  return {
    ...r,
    status: r.status ?? r.baselineType ?? 'ORIGINAL',
    totalActivities: r.totalActivities ?? 0,
    plannedStartDate: r.plannedStartDate ?? r.baselineDate ?? '',
    plannedEndDate: r.plannedEndDate ?? '',
    totalBudget: r.totalBudget ?? 0,
  } as ScheduleBaseline;
}

function BaselinesTab() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<ScheduleBaseline[]>({
    queryKey: ['schedule-baselines'],
    queryFn: async () => {
      const raw = await planningApi.getBaselines();
      return (raw as unknown as Record<string, unknown>[]).map(normalizeBaseline);
    },
  });

  const baselines = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return baselines;
    const lower = search.toLowerCase();
    return baselines.filter(
      (b) => b.name.toLowerCase().includes(lower) || (b.projectName ?? '').toLowerCase().includes(lower),
    );
  }, [baselines, search]);

  const activeBaseline = baselines.find((b) => b.status === 'ACTIVE' || b.status === 'CURRENT');

  const columns = useMemo<ColumnDef<ScheduleBaseline, unknown>[]>(
    () => {
      const baselineStatusLabels = getBaselineStatusLabels();
      return [
        {
          accessorKey: 'name',
          header: t('planning.baselines.colName'),
          size: 240,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
            </div>
          ),
        },
        {
          accessorKey: 'status',
          header: t('planning.baselines.colStatus'),
          size: 130,
          cell: ({ getValue }) => (
            <StatusBadge status={getValue<string>()} colorMap={baselineStatusColorMap} label={baselineStatusLabels[getValue<string>()] ?? getValue<string>()} />
          ),
        },
        {
          accessorKey: 'baselineDate',
          header: t('planning.baselines.colBaselineDate'),
          size: 150,
          cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
        },
        {
          accessorKey: 'totalActivities',
          header: t('planning.baselines.colActivities'),
          size: 90,
          cell: ({ getValue }) => <span className="tabular-nums text-neutral-600">{getValue<number>()}</span>,
        },
        {
          accessorKey: 'plannedStartDate',
          header: t('planning.baselines.colStart'),
          size: 120,
          cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
        },
        {
          accessorKey: 'plannedEndDate',
          header: t('planning.baselines.colEnd'),
          size: 120,
          cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
        },
        {
          accessorKey: 'totalBudget',
          header: t('planning.baselines.colBudget'),
          size: 180,
          cell: ({ getValue }) => <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>,
        },
      ];
    },
    [],
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarCheck size={18} />} label={t('planning.baselines.totalBaselines')} value={baselines.length} />
        <MetricCard label={t('planning.baselines.activeCount')} value={baselines.filter((b) => b.status === 'ACTIVE').length} />
        <MetricCard label={t('planning.baselines.currentPlan')} value={activeBaseline?.name ?? '---'} subtitle={activeBaseline ? formatDate(activeBaseline.baselineDate) : ''} />
        <MetricCard label={t('planning.baselines.activitiesInCurrent')} value={activeBaseline?.totalActivities ?? 0} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('planning.baselines.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="secondary" iconLeft={<GitCompare size={16} />} onClick={() => toast(t('common.operationStarted'))}>
          {t('planning.baselines.compareVersions')}
        </Button>
      </div>

      <DataTable<ScheduleBaseline>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('planning.baselines.emptyTitle')}
        emptyDescription={t('planning.baselines.emptyDescription')}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const GanttChartPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlanningTab>('gantt');
  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCriticalOnly, setShowCriticalOnly] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  // Gantt/WBS share the same WBS tree data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['gantt-data', selectedProjectId],
    queryFn: () => planningApi.getGanttData(selectedProjectId),
    enabled: !!selectedProjectId && (activeTab === 'gantt' || activeTab === 'wbs'),
  });

  const tree = data ?? [];
  const allNodes = useMemo(() => flattenTree(tree), [tree]);

  // Auto-expand root nodes on first load
  React.useEffect(() => {
    if (tree.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set(tree.map((n) => n.id)));
    }
  }, [tree]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedProjectName = projectOptions.find((p) => p.value === selectedProjectId)?.label;

  const tabs: PlanningTab[] = ['gantt', 'wbs', 'critical-path', 'baselines'];

  const tabLabels: Record<PlanningTab, string> = {
    gantt: t('planning.tabs.gantt'),
    wbs: t('planning.tabs.wbs'),
    'critical-path': t('planning.tabs.criticalPath'),
    baselines: t('planning.tabs.baselines'),
  };

  const needsProject = activeTab !== 'baselines';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.gantt.title')}
        subtitle={
          selectedProjectName && needsProject
            ? `${selectedProjectName} — ${t('planning.gantt.subtitle')}`
            : needsProject
              ? t('planning.gantt.selectProjectHint')
              : t('planning.baselines.subtitle')
        }
        breadcrumbs={[
          { label: t('planning.gantt.breadcrumbHome'), href: '/' },
          { label: t('planning.gantt.breadcrumbPlanning') },
          { label: tabLabels[activeTab] },
        ]}
        actions={
          needsProject ? (
            <Select
              options={[{ value: '', label: t('planning.gantt.selectProject') }, ...projectOptions]}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setExpandedIds(new Set());
              }}
              className="w-64"
            />
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setSearch('');
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600',
            )}
          >
            {TAB_ICONS[tab]}
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* No project selected (for project-dependent tabs) */}
      {needsProject && !selectedProjectId && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
          <BarChart3 size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('planning.gantt.selectProject')}</p>
          <p className="text-sm text-neutral-400">{t('planning.gantt.selectProjectHint')}</p>
        </div>
      )}

      {/* Tab content */}
      {(!needsProject || selectedProjectId) && (
        <>
          {activeTab === 'gantt' && (
            <GanttTab
              tree={tree}
              allNodes={allNodes}
              search={search}
              setSearch={setSearch}
              showCriticalOnly={showCriticalOnly}
              setShowCriticalOnly={setShowCriticalOnly}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              setExpandedIds={setExpandedIds}
              isLoading={isLoading}
              isError={isError}
            />
          )}
          {activeTab === 'wbs' && (
            <WbsTab
              tree={tree}
              allNodes={allNodes}
              search={search}
              setSearch={setSearch}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'critical-path' && (
            <CriticalPathTab projectId={selectedProjectId} />
          )}
          {activeTab === 'baselines' && (
            <BaselinesTab />
          )}
        </>
      )}
    </div>
  );
};

export default GanttChartPage;
