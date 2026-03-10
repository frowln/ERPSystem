import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Search, GitBranch, AlertTriangle, FolderTree } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { planningApi } from '@/api/planning';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { WbsNode } from './types';
import type { Project, PaginatedResponse } from '@/types';

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

function flattenTree(nodes: WbsNode[]): WbsNode[] {
  const result: WbsNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

const WbsTreePage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Load projects for selector
  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  // Fetch WBS tree only when a valid project is selected
  const { data, isLoading } = useQuery({
    queryKey: ['wbs-tree', selectedProjectId],
    queryFn: () => planningApi.getWbsTree(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const tree = data ?? [];
  const allNodes = useMemo(() => flattenTree(tree), [tree]);

  const criticalCount = allNodes.filter((n) => n.isCriticalPath).length;
  const avgProgress = allNodes.length > 0 ? Math.round(allNodes.reduce((s, n) => s + n.percentComplete, 0) / allNodes.length) : 0;

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
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.wbs.title')}
        subtitle={t('planning.wbs.subtitle')}
        breadcrumbs={[
          { label: t('planning.wbs.breadcrumbHome'), href: '/' },
          { label: t('planning.wbs.breadcrumbPlanning') },
          { label: t('planning.wbs.breadcrumbWbs') },
        ]}
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-72">
          <Select
            value={selectedProjectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setExpandedIds(new Set());
            }}
            options={projectOptions}
            placeholder={t('planning.wbs.selectProject')}
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.wbs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="text-center py-20">
          <FolderTree size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('planning.wbs.selectProjectPrompt')}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('planning.wbs.selectProjectHint')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<GitBranch size={18} />} label={t('planning.wbs.metricTotalNodes')} value={allNodes.length} />
            <MetricCard label={t('planning.wbs.metricProgress')} value={`${avgProgress}%`} />
            <MetricCard icon={<AlertTriangle size={18} />} label={t('planning.wbs.criticalPath')} value={criticalCount} subtitle={t('planning.wbs.elementsSuffix')} />
            <MetricCard label={t('planning.wbs.phases')} value={allNodes.filter((n) => n.nodeType === 'PHASE').length} />
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
      )}
    </div>
  );
};

export default WbsTreePage;
