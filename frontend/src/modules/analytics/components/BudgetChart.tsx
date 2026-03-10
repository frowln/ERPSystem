import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { t } from '@/i18n';
import { formatMoneyCompact } from '@/lib/format';
import type { ProjectFinancialEntry } from '@/api/analytics';

interface BudgetChartProps {
  data: ProjectFinancialEntry[];
}

const BudgetChart: React.FC<BudgetChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.projectName.length > 20 ? item.projectName.slice(0, 18) + '...' : item.projectName,
    budget: item.budget,
    spent: item.spent,
    committed: item.committed,
  }));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('dashboard.budgetByProject')}
      </h3>
      <div className="h-[280px]">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-neutral-400">
            {t('dashboard.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: number) => formatMoneyCompact(v)}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#f8fafc',
                  padding: '8px 12px',
                }}
                formatter={(value: number, name: string) => [
                  formatMoneyCompact(value),
                  name === 'budget' ? t('dashboard.budgetLabel') : name === 'spent' ? t('dashboard.spentLabel') : t('dashboard.committedLabel'),
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingBottom: '8px' }}
                formatter={(value: string) =>
                  value === 'budget' ? t('dashboard.budgetLabel') : value === 'spent' ? t('dashboard.spentLabel') : t('dashboard.committedLabel')
                }
              />
              <Bar dataKey="budget" fill="#bfdbfe" radius={[3, 3, 0, 0]} barSize={20} />
              <Bar dataKey="spent" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={20} />
              <Bar dataKey="committed" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default BudgetChart;
