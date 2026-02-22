import React from 'react';
import { Calendar, ClipboardList, Package, Truck } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { t } from '@/i18n';

interface OrderMetricsProps {
  totalAmount: number;
  itemsCount: number;
  totalOrderedQty: number;
  totalDeliveredQty: number;
  deliveryPercent: number;
  expectedDeliveryDate: string | null | undefined;
}

export const OrderMetrics: React.FC<OrderMetricsProps> = React.memo(({
  totalAmount,
  itemsCount,
  totalOrderedQty,
  totalDeliveredQty,
  deliveryPercent,
  expectedDeliveryDate,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
    <MetricCard
      icon={<ClipboardList size={16} />}
      label={t('procurement.orderDetail.metricAmount')}
      value={formatMoney(totalAmount)}
    />
    <MetricCard
      icon={<Package size={16} />}
      label={t('procurement.orderDetail.metricItems')}
      value={String(itemsCount)}
      subtitle={`${formatNumber(totalOrderedQty)} ${t('procurement.orderDetail.unitsSuffix')}`}
    />
    <MetricCard
      icon={<Truck size={16} />}
      label={t('procurement.orderDetail.metricDelivered')}
      value={`${deliveryPercent.toFixed(0)}%`}
      subtitle={`${formatNumber(totalDeliveredQty)} ${t('procurement.orderDetail.outOf')} ${formatNumber(totalOrderedQty)}`}
    />
    <MetricCard
      icon={<Calendar size={16} />}
      label={t('procurement.orderDetail.metricDeliveryPlan')}
      value={formatDate(expectedDeliveryDate)}
    />
  </div>
));

OrderMetrics.displayName = 'OrderMetrics';
