import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import type { PurchaseOrder, PurchaseOrderItem } from '@/api/procurement';
import { formatMoney, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import { shortUuid, toNumber } from './types';

interface UseOrderColumnsParams {
  order: PurchaseOrder | undefined;
  deliveryDrafts: Record<string, string>;
  pendingItemId: string | null;
  pendingDeleteItemId: string | null;
  editingItemId: string | null;
  materialById: Map<string, { name?: string; unit?: string }>;
  setDeliveryDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setEditingItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingItemDraft: React.Dispatch<React.SetStateAction<{
    materialId: string;
    materialName: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    vatRate: string;
  }>>;
  registerDeliveryMutation: {
    isPending: boolean;
    mutate: (payload: { orderId: string; itemId: string; quantity: number }) => void;
  };
  deleteItemMutation: {
    isPending: boolean;
    mutate: (payload: { orderId: string; itemId: string }) => void;
  };
  confirm: (options: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
  }) => Promise<boolean>;
}

// We need React in scope for JSX in cell renderers.
// The actual JSX factories are used inside the column cell functions.
import React from 'react';
import { Pencil, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/FormField';
import { AuditFooter } from '@/design-system/components/AuditFooter';
import { parseQuantityInput } from './types';

export function useOrderColumns({
  order,
  deliveryDrafts,
  pendingItemId,
  pendingDeleteItemId,
  editingItemId,
  materialById,
  setDeliveryDrafts,
  setEditingItemId,
  setEditingItemDraft,
  registerDeliveryMutation,
  deleteItemMutation,
  confirm,
}: UseOrderColumnsParams): ColumnDef<PurchaseOrderItem, unknown>[] {
  return useMemo<ColumnDef<PurchaseOrderItem, unknown>[]>(() => {
    const isDraft = order?.status === 'DRAFT';
    const canRegisterDelivery = order?.status === 'CONFIRMED' || order?.status === 'PARTIALLY_DELIVERED';
    const baseColumns: ColumnDef<PurchaseOrderItem, unknown>[] = [
      {
        accessorKey: 'materialName',
        header: t('procurement.orderDetail.colMaterial'),
        size: 260,
        cell: ({ row, getValue }) => (
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {getValue<string>() || `${t('procurement.orderDetail.colMaterial')} ${shortUuid(row.original.materialId)}`}
            </p>
            <p className="text-xs text-neutral-500">ID: {shortUuid(row.original.materialId)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('procurement.orderDetail.colUnit'),
        size: 70,
        cell: ({ getValue }) => <span>{getValue<string>() || '\u2014'}</span>,
      },
      {
        id: 'quantity',
        header: t('procurement.orderDetail.colOrdered'),
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(toNumber(row.original.quantity))}
          </span>
        ),
      },
      {
        id: 'delivered',
        header: t('procurement.orderDetail.colDelivered'),
        size: 150,
        cell: ({ row }) => {
          const ordered = toNumber(row.original.quantity);
          const delivered = toNumber(row.original.deliveredQuantity);
          const rowPercent = ordered > 0 ? Math.min(100, (delivered / ordered) * 100) : 0;
          return (
            <div className="min-w-[140px]">
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span className="tabular-nums">{formatNumber(delivered)}</span>
                <span>{rowPercent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${rowPercent}%` }}
                />
              </div>

            <AuditFooter data={order} />
</div>
          );
        },
      },
      {
        id: 'remaining',
        header: t('procurement.orderDetail.colRemaining'),
        size: 120,
        cell: ({ row }) => {
          const ordered = toNumber(row.original.quantity);
          const delivered = toNumber(row.original.deliveredQuantity);
          const remaining = Math.max(0, ordered - delivered);
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatNumber(remaining)}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: t('procurement.orderDetail.colAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium block text-right">
            {formatMoney(toNumber(getValue<number>()))}
          </span>
        ),
      },
      {
        id: 'registerDelivery',
        header: t('procurement.orderDetail.colDelivery'),
        size: 240,
        cell: ({ row }) => {
          const item = row.original;
          const itemId = item.id;
          const ordered = toNumber(item.quantity);
          const delivered = toNumber(item.deliveredQuantity);
          const remaining = Math.max(0, ordered - delivered);
          const value = deliveryDrafts[itemId] ?? '';
          const isPending = registerDeliveryMutation.isPending && pendingItemId === itemId;

          if (!canRegisterDelivery || remaining <= 0 || !order) {
            return <span className="text-xs text-neutral-400">{'\u2014'}</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(event) => {
                  setDeliveryDrafts((prev) => ({ ...prev, [itemId]: event.target.value }));
                }}
                placeholder={t('procurement.orderDetail.placeholderQty')}
                className="h-8 w-24"
                aria-label={`${t('procurement.orderDetail.ariaDeliveryQty')} ${item.materialName || item.materialId}`}
              />
              <Button
                variant="secondary"
                size="xs"
                iconLeft={<Truck size={12} />}
                loading={isPending}
                onClick={() => {
                  if (isPending || !order) {
                    return;
                  }
                  const parsed = parseQuantityInput(value);
                  if (!parsed) {
                    toast.error(t('procurement.orderDetail.errorInvalidDeliveryQty'));
                    return;
                  }
                  if (parsed > remaining) {
                    toast.error(`${t('procurement.orderDetail.errorExceedsRemaining')} (${formatNumber(remaining)})`);
                    return;
                  }
                  registerDeliveryMutation.mutate({
                    orderId: order.id,
                    itemId,
                    quantity: parsed,
                  });
                }}
              >
                {t('procurement.orderDetail.accept')}
              </Button>
            </div>
          );
        },
      },
    ];

    if (isDraft) {
      baseColumns.push({
        id: 'draftActions',
        header: t('procurement.orderDetail.colManagement'),
        size: 240,
        cell: ({ row }) => {
          const item = row.original;
          const isPending = deleteItemMutation.isPending && pendingDeleteItemId === item.id;
          const isEditing = editingItemId === item.id;
          if (!order) {
            return null;
          }
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant={isEditing ? 'primary' : 'secondary'}
                size="xs"
                iconLeft={<Pencil size={12} />}
                onClick={() => {
                  const resolvedMaterial = materialById.get(item.materialId);
                  setEditingItemId(item.id);
                  setEditingItemDraft({
                    materialId: item.materialId,
                    materialName: item.materialName || resolvedMaterial?.name || '',
                    unit: item.unit || resolvedMaterial?.unit || t('common.unitPcs'),
                    quantity: String(toNumber(item.quantity)),
                    unitPrice: String(toNumber(item.unitPrice)),
                    vatRate: String(toNumber(item.vatRate) || 20),
                  });
                }}
              >
                {isEditing ? t('procurement.orderDetail.selected') : t('procurement.orderDetail.edit')}
              </Button>
              <Button
                variant="danger"
                size="xs"
                iconLeft={<Trash2 size={12} />}
                loading={isPending}
                onClick={async () => {
                  if (isPending) {
                    return;
                  }
                  const isConfirmed = await confirm({
                    title: `${t('procurement.orderDetail.confirmDeleteItemTitle')} ${item.materialName || shortUuid(item.materialId)}?`,
                    description: t('procurement.orderDetail.confirmDeleteItemDescription'),
                    confirmLabel: t('procurement.orderDetail.confirmDeleteItemLabel'),
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                  });
                  if (!isConfirmed) {
                    return;
                  }
                  deleteItemMutation.mutate({ orderId: order.id, itemId: item.id });
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [
    confirm,
    deleteItemMutation,
    deliveryDrafts,
    editingItemId,
    materialById,
    order,
    pendingDeleteItemId,
    pendingItemId,
    registerDeliveryMutation,
    setDeliveryDrafts,
    setEditingItemId,
    setEditingItemDraft,
  ]);
}
