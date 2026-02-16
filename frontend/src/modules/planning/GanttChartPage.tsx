import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Search, Calendar, AlertTriangle, GitBranch } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { planningApi } from '@/api/planning';
import { t } from '@/i18n';
import type { WbsNode } from './types';

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
  // Add padding
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

const GanttChartPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCriticalOnly, setShowCriticalOnly] = useState('');

  const { data } = useQuery({
    queryKey: ['gantt-data'],
    queryFn: () => planningApi.getGanttData(),
  });

  const tree = data ?? [];
  const allNodes = useMemo(() => flattenTree(tree), [tree]);

  const timeRange = useMemo(() => computeTimeRange(tree), [tree]);
  const months = useMemo(() => computeMonths(timeRange.start, timeRange.end), [timeRange]);

  // Auto-expand root nodes on first load
  React.useEffect(() => {
    if (tree.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set(tree.map((n) => n.id)));
    }
  }, [tree]);

  function dateToPercent(dateStr: string): number {
    const d = new Date(dateStr);
    const days = Math.ceil((d.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (days / timeRange.totalDays) * 100));
  }

  const todayPercent = dateToPercent(TODAY.toISOString());
  const criticalCount = allNodes.filter((n) => n.isCriticalPath).length;
  const delayedCount = allNodes.filter((n) => n.totalFloat < 0).length;

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const getVisibleNodes = useCallback((nodes: WbsNode[], depth: number = 0): { node: WbsNode; depth: number }[] => {
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
  }, [expandedIds, search, showCriticalOnly]);

  const visibleNodes = useMemo(() => getVisibleNodes(tree), [getVisibleNodes, tree]);

  const renderGanttBar = (node: WbsNode) => {
    const plannedStart = dateToPercent(node.plannedStartDate);
    const plannedEnd = dateToPercent(node.plannedEndDate);
    const plannedWidth = plannedEnd - plannedStart;

    const actualStart = node.actualStartDate ? dateToPercent(node.actualStartDate) : plannedStart;
    const actualEnd = node.actualEndDate
      ? dateToPercent(node.actualEndDate)
      : actualStart + (plannedWidth * node.percentComplete) / 100;
    const actualWidth = actualEnd - actualStart;

    const isMilestone = node.nodeType === 'MILESTONE';

    if (isMilestone) {
      return (
        <div className="relative h-full flex items-center">
          <div
            className="absolute w-3 h-3 rotate-45 bg-orange-500 border-2 border-orange-600"
            style={{ left: `${plannedStart}%`, transform: 'translateX(-50%) rotate(45deg)' }}
          />
        </div>
      );
    }

    return (
      <div className="relative h-full flex items-center">
        {/* Planned bar (background) */}
        <div
          className={cn(
            'absolute h-3 rounded-full',
            node.isCriticalPath ? 'bg-danger-100' : 'bg-neutral-200',
          )}
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
        {/* Percent label */}
        <span
          className="absolute text-[10px] font-medium text-neutral-600 whitespace-nowrap"
          style={{ left: `${Math.min(actualStart + actualWidth + 0.5, 95)}%`, top: '-2px' }}
        >
          {node.percentComplete}%
        </span>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.gantt.title')}
        subtitle={t('planning.gantt.subtitle')}
        breadcrumbs={[
          { label: t('planning.gantt.breadcrumbHome'), href: '/' },
          { label: t('planning.gantt.breadcrumbPlanning') },
          { label: t('planning.gantt.breadcrumbGantt') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Calendar size={18} />} label={t('planning.gantt.totalTasks')} value={allNodes.length} />
        <MetricCard icon={<GitBranch size={18} />} label={t('planning.gantt.criticalPath')} value={criticalCount} subtitle={t('planning.gantt.tasksSuffix')} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('planning.gantt.delayed')} value={delayedCount} subtitle={t('planning.gantt.tasksSuffix')} trend={{ direction: delayedCount > 0 ? 'down' : 'neutral', value: delayedCount > 0 ? t('planning.gantt.needAttention') : t('planning.gantt.none') }} />
        <MetricCard label={t('planning.gantt.dataDate')} value={formatDate(TODAY.toISOString())} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.gantt.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('planning.gantt.allTasks') },
            { value: 'CRITICAL', label: t('planning.gantt.criticalPathOnly') },
          ]}
          value={showCriticalOnly}
          onChange={(e) => setShowCriticalOnly(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="flex">
          {/* Left panel - task list */}
          <div className="w-[380px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700">
            <div className="h-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-4">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('planning.gantt.taskColumnHeader')}</span>
            </div>
            {visibleNodes.map(({ node, depth }) => {
              const hasChildren = node.children && node.children.length > 0;
              const isExpanded = expandedIds.has(node.id);
              return (
                <div
                  key={node.id}
                  className={cn(
                    'h-9 flex items-center border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                    node.isCriticalPath && 'bg-danger-50/30',
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
                  <span className="font-mono text-[10px] text-neutral-400 mr-2 w-8">{node.code}</span>
                  <span className={cn(
                    'text-xs truncate',
                    node.isCriticalPath ? 'text-danger-700 font-medium' : 'text-neutral-800 dark:text-neutral-200',
                  )}>
                    {node.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right panel - Gantt bars */}
          <div className="flex-1 overflow-x-auto">
            {/* Timeline header */}
            <div className="h-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center relative min-w-[800px]">
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium absolute"
                  style={{ left: `${(idx / months.length) * 100}%` }}
                >
                  <div className="px-1">{m}</div>
                </div>
              ))}
            </div>

            {/* Gantt rows */}
            <div className="relative min-w-[800px]">
              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-danger-400 z-10"
                style={{ left: `${todayPercent}%` }}
              >
                <div className="absolute -top-0 -translate-x-1/2 bg-danger-500 text-white text-[8px] px-1 rounded">
                  {t('planning.gantt.today')}
                </div>
              </div>

              {/* Quarter grid lines */}
              {months.map((_, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800"
                  style={{ left: `${(idx / months.length) * 100}%` }}
                />
              ))}

              {visibleNodes.map(({ node }) => (
                <div
                  key={node.id}
                  className={cn(
                    'h-9 relative border-b border-neutral-100',
                    node.isCriticalPath && 'bg-danger-50/20',
                  )}
                >
                  {renderGanttBar(node)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-2 rounded-full bg-primary-500" />
          <span className="text-xs text-neutral-600">{t('planning.gantt.legendProgress')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-2 rounded-full bg-danger-500" />
          <span className="text-xs text-neutral-600">{t('planning.gantt.legendCriticalPath')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-2 rounded-full bg-success-500" />
          <span className="text-xs text-neutral-600">{t('planning.gantt.legendCompleted')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-2 rounded-full bg-neutral-200" />
          <span className="text-xs text-neutral-600">{t('planning.gantt.legendPlannedDuration')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rotate-45 bg-orange-500" />
          <span className="text-xs text-neutral-600">{t('planning.gantt.legendMilestone')}</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChartPage;
