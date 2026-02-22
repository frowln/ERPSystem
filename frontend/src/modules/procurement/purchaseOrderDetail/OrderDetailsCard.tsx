import React from 'react';
import { Calendar, FolderKanban, MapPin, Package, Percent } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { PurchaseOrder } from '@/api/procurement';
import { InfoRow } from './InfoRow';
import { shortUuid } from './types';

interface OrderDetailsCardProps {
  order: PurchaseOrder;
}

export const OrderDetailsCard: React.FC<OrderDetailsCardProps> = React.memo(({ order }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
      {t('procurement.orderDetail.orderDetails')}
    </h3>
    <InfoRow icon={<FolderKanban size={15} />} label={t('procurement.orderDetail.infoProject')} value={shortUuid(order.projectId)} />
    <InfoRow icon={<Package size={15} />} label={t('procurement.orderDetail.infoPurchaseRequest')} value={shortUuid(order.purchaseRequestId)} />
    <InfoRow icon={<Calendar size={15} />} label={t('procurement.orderDetail.infoOrderDate')} value={formatDate(order.orderDate)} />
    <InfoRow icon={<Calendar size={15} />} label={t('procurement.orderDetail.infoActualDelivery')} value={formatDate(order.actualDeliveryDate)} />
    <InfoRow icon={<Percent size={15} />} label={t('procurement.orderDetail.infoVat')} value={formatMoney(order.vatAmount)} />
    <InfoRow icon={<MapPin size={15} />} label={t('procurement.orderDetail.infoDeliveryAddress')} value={order.deliveryAddress || '\u2014'} />
  </div>
));

OrderDetailsCard.displayName = 'OrderDetailsCard';
