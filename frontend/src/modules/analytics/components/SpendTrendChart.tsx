import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { t } from '@/i18n';
import { formatMoneyCompact } from '@/lib/format';
import type { MonthlySpendEntry } from '@/api/analytics';

interface SpendTrendChartProps {
  data: MonthlySpendEntry[];
}

const SpendTrendChart: React.FC<SpendTrendChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('dashboard.monthlySpendTrend')}
      </h3>
      <div className="h-[280px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-neutral-400">
            {t('dashboard.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
                  name === 'planned' ? t('dashboard.plannedLabel') : t('dashboard.actualLabel'),
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingBottom: '8px' }}
                formatter={(value: string) =>
                  value === 'planned' ? t('dashboard.plannedLabel') : t('dashboard.actualLabel')
                }
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SpendTrendChart;
