import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { projectStatusLabels } from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';
import type { DashboardSummary } from '@/types';

const STATUS_CHART_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  PLANNING: '#3b82f6',
  IN_PROGRESS: '#22c55e',
  ON_HOLD: '#f59e0b',
  COMPLETED: '#a855f7',
  CANCELLED: '#ef4444',
};

interface DashboardChartsProps {
  projectsByStatus: DashboardSummary['projectsByStatus'];
  budgetVsActual: DashboardSummary['budgetVsActual'];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ projectsByStatus, budgetVsActual }) => {
  const statusChartData = projectsByStatus.map((item) => ({
    name: projectStatusLabels[item.status] ?? item.status,
    value: item.count,
    color: STATUS_CHART_COLORS[item.status] ?? '#94a3b8',
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.projectsByStatus')}</h2>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {statusChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: 'NONE',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#f8fafc',
                  padding: '8px 12px',
                }}
                formatter={(value: number, name: string) => [`${value} ${t('dashboard.projectsWord')}`, name]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.budgetVsActual')}</h2>
          <span className="inline-flex items-center gap-1 text-xs text-success-600 font-medium">
            <TrendingUp size={13} />
            {t('dashboard.withinBudget')}
          </span>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetVsActual} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: 'NONE',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#f8fafc',
                  padding: '8px 12px',
                }}
                formatter={(value: number) => [`${value} ${t('dashboard.millionRub')}`]}
              />
              <Bar dataKey="budget" name={t('dashboard.budgetLabel')} fill="#bfdbfe" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="actual" name={t('dashboard.actualLabel')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingBottom: '12px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
