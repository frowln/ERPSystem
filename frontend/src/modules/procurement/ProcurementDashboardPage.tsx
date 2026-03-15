import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  Clock,
  Plus,
  ListChecks,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

const STATUS_PIPELINE = ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'DELIVERED'] as const;

const orderStatusColorMap: Record<string, string> = {
  DELIVERED: 'green',
  CLOSED: 'green',
  APPROVED: 'blue',
  CONFIRMED: 'blue',
  SUBMITTED: 'yellow',
  IN_APPROVAL: 'yellow',
  SENT: 'yellow',
  CANCELLED: 'red',
  DRAFT: 'gray',
  ORDERED: 'purple',
  PARTIALLY_DELIVERED: 'yellow',
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const ProcurementDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: requestsData, isLoading: reqLoading, isError: reqError } = useQuery({
    queryKey: ['purchase-requests', 'dashboard'],
    queryFn: () => procurementApi.getPurchaseRequests({ size: 200 }),
  });

  const { data: ordersData, isLoading: ordLoading, isError: ordError } = useQuery({
    queryKey: ['purchase-orders', 'dashboard'],
    queryFn: () => procurementApi.getPurchaseOrders({ size: 200 }),
  });

  const requests = requestsData?.content ?? [];
  const orders = ordersData?.content ?? [];

  const kpis = useMemo(() => {
    const today = new Date();

    const active = requests.filter((r) =>
      ['DRAFT', 'SUBMITTED', 'IN_APPROVAL', 'APPROVED', 'ASSIGNED', 'ORDERED'].includes(r.status),
    ).length;
    const pendingApproval = requests.filter((r) => r.status === 'IN_APPROVAL').length;
    const overdue = orders.filter((o) => {
      if (!o.expectedDeliveryDate) return false;
      return new Date(o.expectedDeliveryDate) < today && o.status !== 'DELIVERED' && o.status !== 'CLOSED';
    }).length;

    // Average lead time (days) from orderDate to actualDeliveryDate for delivered orders
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED' && o.actualDeliveryDate && o.orderDate);
    const avgLeadTime = deliveredOrders.length > 0
      ? Math.round(
          deliveredOrders.reduce((sum, o) => {
            const diff = new Date(o.actualDeliveryDate!).getTime() - new Date(o.orderDate).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0) / deliveredOrders.length,
        )
      : 0;

    return { active, pendingApproval, overdue, avgLeadTime };
  }, [requests, orders]);

  // Pipeline by status — count requests per status
  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUS_PIPELINE) counts[s] = 0;
    for (const r of requests) {
      const status = r.status;
      if (status in counts) counts[status]++;
    }
    return STATUS_PIPELINE.map((s) => ({ status: s, count: counts[s] ?? 0 }));
  }, [requests]);

  const maxPipelineCount = Math.max(1, ...pipeline.map((p) => p.count));

  // Overdue orders — POs past expected delivery date
  const overdueOrders = useMemo(() => {
    const today = new Date();
    return orders
      .filter((o) => {
        if (!o.expectedDeliveryDate) return false;
        return new Date(o.expectedDeliveryDate) < today && o.status !== 'DELIVERED' && o.status !== 'CLOSED' && o.status !== 'CANCELLED';
      })
      .sort((a, b) => new Date(a.expectedDeliveryDate!).getTime() - new Date(b.expectedDeliveryDate!).getTime())
      .slice(0, 15);
  }, [orders]);

  if ((reqLoading || ordLoading) && requests.length === 0 && orders.length === 0) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (reqError && ordError) {
    return (
      <>
        <PageHeader title={t('procurement.dashboard.title')} />
        <EmptyState variant="ERROR" title={t('errors.generic')} description={t('errors.serverErrorRetry')} />
      </>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('procurement.dashboard.title')}
        subtitle={t('procurement.dashboard.subtitle')}
        breadcrumbs={[
          { label: t('procurement.dashboard.breadcrumbHome'), href: '/' },
          { label: t('procurement.dashboard.breadcrumbProcurement') },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<ClipboardList size={18} />}
          label={t('procurement.dashboard.activeRequests')}
          value={kpis.active}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('procurement.dashboard.pendingApproval')}
          value={kpis.pendingApproval}
          trend={kpis.pendingApproval > 0 ? { direction: 'down', value: String(kpis.pendingApproval) } : undefined}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('procurement.dashboard.overdueOrders')}
          value={kpis.overdue}
          trend={kpis.overdue > 0 ? { direction: 'down', value: String(kpis.overdue) } : undefined}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('procurement.dashboard.avgLeadTime')}
          value={kpis.avgLeadTime > 0 ? `${kpis.avgLeadTime} ${t('procurement.dashboard.days')}` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pipeline by Status */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('procurement.dashboard.pipelineByStatus')}
          </h2>
          <div className="space-y-3">
            {pipeline.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400 shrink-0">{item.status}</span>
                <div className="flex-1 h-7 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-md transition-all flex items-center px-2',
                      item.status === 'DELIVERED' ? 'bg-green-500 dark:bg-green-600' :
                      item.status === 'APPROVED' ? 'bg-blue-500 dark:bg-blue-600' :
                      item.status === 'SUBMITTED' ? 'bg-yellow-500 dark:bg-yellow-600' :
                      item.status === 'ORDERED' ? 'bg-purple-500 dark:bg-purple-600' :
                      'bg-neutral-400 dark:bg-neutral-500',
                    )}
                    style={{ width: `${Math.max(8, (item.count / maxPipelineCount) * 100)}%` }}
                  >
                    <span className="text-xs font-medium text-white">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Overdue Orders */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('procurement.dashboard.overdueOrders')}
          </h2>
          {overdueOrders.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('procurement.dashboard.noOverdueOrders')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('procurement.dashboard.colOrderNumber')}</th>
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('procurement.dashboard.colExpectedDate')}</th>
                    <th className="text-right py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('procurement.dashboard.colAmount')}</th>
                    <th className="text-left py-2 font-medium text-neutral-600 dark:text-neutral-400">{t('procurement.dashboard.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/procurement/purchase-orders/${order.id}`)}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <td className="py-2 pr-3 text-primary-600 dark:text-primary-400 font-medium">{order.orderNumber}</td>
                      <td className="py-2 pr-3 text-red-600 dark:text-red-400 font-medium">{formatDate(order.expectedDeliveryDate)}</td>
                      <td className="py-2 pr-3 text-right text-neutral-900 dark:text-neutral-100">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-2">
                        <StatusBadge status={order.status} colorMap={orderStatusColorMap} label={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('procurement.dashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/procurement/new')}
          >
            <Plus size={16} className="mr-1.5" />
            {t('procurement.dashboard.newRequest')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/procurement/purchase-orders/new')}
          >
            <Plus size={16} className="mr-1.5" />
            {t('procurement.dashboard.newOrder')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/specifications/competitive-registry')}
          >
            <ListChecks size={16} className="mr-1.5" />
            {t('procurement.dashboard.linkCompetitiveLists')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ProcurementDashboardPage;
