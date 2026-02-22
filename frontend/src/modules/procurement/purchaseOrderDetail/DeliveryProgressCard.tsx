import React from 'react';
import { formatNumber } from '@/lib/format';
import { t } from '@/i18n';

interface DeliveryProgressCardProps {
  totalDeliveredQty: number;
  totalOrderedQty: number;
  deliveryPercent: number;
}

export const DeliveryProgressCard: React.FC<DeliveryProgressCardProps> = React.memo(({
  totalDeliveredQty,
  totalOrderedQty,
  deliveryPercent,
}) => (
  <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
      {t('procurement.orderDetail.deliveryExecution')}
    </h3>
    <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300 mb-2">
      <span>{formatNumber(totalDeliveredQty)} / {formatNumber(totalOrderedQty)} {t('procurement.orderDetail.unitsSuffix')}</span>
      <span>{deliveryPercent.toFixed(0)}%</span>
    </div>
    <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
      <div
        className="h-full bg-primary-500 rounded-full transition-all duration-500"
        style={{ width: `${deliveryPercent}%` }}
      />
    </div>
    <p className="mt-3 text-xs text-neutral-500">
      {t('procurement.orderDetail.deliveryHint')}
    </p>
  </div>
));

DeliveryProgressCard.displayName = 'DeliveryProgressCard';
