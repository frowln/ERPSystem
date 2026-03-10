import React, { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';

const DashboardCharts = lazy(() => import('../DashboardCharts'));

const CashFlowChartWidget: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  if (isLoading) {
    return <div className="h-[280px] bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />;
  }

  return (
    <Suspense fallback={<div className="h-[280px] bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />}>
      <DashboardCharts
        projectsByStatus={dashboard?.projectsByStatus ?? []}
        budgetVsActual={dashboard?.budgetVsActual ?? []}
      />
    </Suspense>
  );
};

export default CashFlowChartWidget;
