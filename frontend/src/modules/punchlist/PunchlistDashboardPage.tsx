import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ListChecks, CheckCircle, Clock, AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  punchItemStatusColorMap,
  punchItemStatusLabels,
  punchItemPriorityColorMap,
  punchItemPriorityLabels,
  punchListStatusColorMap,
  punchListStatusLabels,
} from '@/design-system/components/StatusBadge';
import { formatDate, formatPercent } from '@/lib/format';
import { punchlistApi } from '@/api/punchlist';

interface PunchListSummary {
  id: string;
  name: string;
  project: string;
  status: string;
  totalItems: number;
  openItems: number;
  closedItems: number;
  completionPercent: number;
  dueDate?: string;
}

interface CategoryBreakdown {
  category: string;
  label: string;
  open: number;
  closed: number;
}

interface RecentItem {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  location: string;
  date: string;
}


const PunchlistDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: punchListsData } = useQuery({
    queryKey: ['punch-lists-dashboard'],
    queryFn: () => punchlistApi.getPunchLists({ size: 100 }),
  });

  // Use first punch list to fetch recent items
  const firstPunchListId = punchListsData?.content?.[0]?.id;
  const { data: recentItemsData } = useQuery({
    queryKey: ['punch-items-dashboard', firstPunchListId],
    queryFn: () => punchlistApi.getPunchItems(firstPunchListId!),
    enabled: !!firstPunchListId,
  });

  const punchLists: PunchListSummary[] = (punchListsData?.content ?? []).map((pl) => ({
    id: pl.id,
    name: pl.name,
    project: pl.projectName ?? '',
    status: pl.status,
    totalItems: pl.totalItems,
    openItems: pl.openItems,
    closedItems: pl.closedItems,
    completionPercent: pl.completionPercent,
    dueDate: pl.dueDate,
  }));

  const recentItems: RecentItem[] = (recentItemsData ?? []).slice(0, 5).map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    status: item.status,
    priority: item.priority,
    location: item.location,
    date: item.createdAt.split('T')[0],
  }));

  // Aggregate category breakdown from items
  const categoryMap = new Map<string, CategoryBreakdown>();
  for (const item of recentItemsData ?? []) {
    const existing = categoryMap.get(item.category) ?? { category: item.category, label: item.category, open: 0, closed: 0 };
    if (['CLOSED', 'APPROVED'].includes(item.status)) existing.closed++;
    else existing.open++;
    categoryMap.set(item.category, existing);
  }
  const categories = Array.from(categoryMap.values());

  const totalItems = punchLists.reduce((s, pl) => s + pl.totalItems, 0);
  const totalOpen = punchLists.reduce((s, pl) => s + pl.openItems, 0);
  const totalClosed = punchLists.reduce((s, pl) => s + pl.closedItems, 0);
  const overallCompletion = totalItems > 0 ? (totalClosed / totalItems) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Панель Punch List"
        subtitle="Сводка по перечням замечаний"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Punch List' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/punchlist/items')}>
              Все замечания
            </Button>
            <Button onClick={() => navigate('/punchlist/new')}>
              Новый перечень
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ListChecks size={18} />} label="Всего замечаний" value={totalItems} />
        <MetricCard icon={<Clock size={18} />} label="Открытые" value={totalOpen}
          trend={totalOpen > 0 ? { direction: 'neutral', value: `${totalOpen} шт.` } : undefined} />
        <MetricCard icon={<CheckCircle size={18} />} label="Закрытые" value={totalClosed} />
        <MetricCard icon={<TrendingUp size={18} />} label="Общая готовность" value={formatPercent(overallCompletion)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Punch lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Перечни замечаний</h3>
            </div>
            <div className="space-y-4">
              {punchLists.map((pl) => (
                <div key={pl.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/punchlist/lists/${pl.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{pl.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{pl.project}</p>
                    </div>
                    <StatusBadge status={pl.status} colorMap={punchListStatusColorMap} label={punchListStatusLabels[pl.status]} />
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1">
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full transition-all"
                          style={{ width: `${pl.completionPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium tabular-nums text-neutral-600 w-10 text-right">
                      {pl.completionPercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Всего: {pl.totalItems}</span>
                    <span>Открыто: {pl.openItems}</span>
                    <span>Закрыто: {pl.closedItems}</span>
                    {pl.dueDate && <span className="tabular-nums">Срок: {formatDate(pl.dueDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent items */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Последние замечания</h3>
              <Button variant="ghost" size="xs" onClick={() => navigate('/punchlist/items')}>
                Все замечания
              </Button>
            </div>
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  onClick={() => navigate(`/punchlist/items/${item.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-neutral-400 w-14 flex-shrink-0">{item.number}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={item.priority} colorMap={punchItemPriorityColorMap} label={punchItemPriorityLabels[item.priority]} />
                    <StatusBadge status={item.status} colorMap={punchItemStatusColorMap} label={punchItemStatusLabels[item.status]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">По категориям</h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const total = cat.open + cat.closed;
                const pct = total > 0 ? (cat.closed / total) * 100 : 0;
                return (
                  <div key={cat.category} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{cat.label}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{cat.open + cat.closed} шт.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-success-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400 w-8 text-right">{Math.round(pct)}%</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Открыто: {cat.open}</span>
                      <span>Закрыто: {cat.closed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Предупреждения</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-danger-50 rounded-lg">
                <AlertTriangle size={16} className="text-danger-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-danger-800">2 критических замечания</p>
                  <p className="text-xs text-danger-600 mt-0.5">PI-003, PI-005 требуют срочного устранения</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
                <Clock size={16} className="text-warning-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-800">1 замечание просрочено</p>
                  <p className="text-xs text-warning-600 mt-0.5">PI-003 -- срок истёк 14.02.2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchlistDashboardPage;
