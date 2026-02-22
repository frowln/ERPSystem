import type { PurchaseOrderStatus } from '@/api/procurement';
import { t } from '@/i18n';

export type OrderAction = 'send' | 'confirm' | 'invoice' | 'cancel' | 'close';

export const getStatusLabels = (): Record<PurchaseOrderStatus, string> => ({
  DRAFT: t('procurement.orderStatus.draft'),
  SENT: t('procurement.orderStatus.sent'),
  CONFIRMED: t('procurement.orderStatus.confirmed'),
  PARTIALLY_DELIVERED: t('procurement.orderStatus.partiallyDelivered'),
  DELIVERED: t('procurement.orderStatus.delivered'),
  INVOICED: t('procurement.orderStatus.invoiced'),
  CLOSED: t('procurement.orderStatus.closed'),
  CANCELLED: t('procurement.orderStatus.cancelled'),
});

export const statusColorMap: Record<PurchaseOrderStatus, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  CONFIRMED: 'cyan',
  PARTIALLY_DELIVERED: 'yellow',
  DELIVERED: 'green',
  INVOICED: 'purple',
  CLOSED: 'gray',
  CANCELLED: 'red',
};

export const getActionLabelMap = (): Record<OrderAction, string> => ({
  send: t('procurement.orderAction.send'),
  confirm: t('procurement.orderAction.confirm'),
  invoice: t('procurement.orderAction.invoice'),
  cancel: t('procurement.orderAction.cancel'),
  close: t('procurement.orderAction.close'),
});

export const getActionSuccessMap = (): Record<OrderAction, string> => ({
  send: t('procurement.orderAction.sendSuccess'),
  confirm: t('procurement.orderAction.confirmSuccess'),
  invoice: t('procurement.orderAction.invoiceSuccess'),
  cancel: t('procurement.orderAction.cancelSuccess'),
  close: t('procurement.orderAction.closeSuccess'),
});

export const shortUuid = (value?: string) => (value ? `${value.slice(0, 8)}...` : '\u2014');

export const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const parseQuantityInput = (raw: string): number | null => {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

export const getAvailableActions = (status: PurchaseOrderStatus): OrderAction[] => {
  switch (status) {
    case 'DRAFT':
      return ['send', 'cancel'];
    case 'SENT':
      return ['confirm', 'cancel'];
    case 'DELIVERED':
      return ['invoice', 'close'];
    case 'INVOICED':
      return ['close'];
    default:
      return [];
  }
};
