import React from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { parseQuantityInput, toNumber } from './types';

interface EditingItemDraft {
  materialId: string;
  materialName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
}

interface MaterialOption {
  value: string;
  label: string;
}

interface MaterialInfo {
  name?: string;
  unit?: string;
}

interface EditItemFormProps {
  orderId: string;
  editingItemId: string;
  editingItemDraft: EditingItemDraft;
  setEditingItemDraft: React.Dispatch<React.SetStateAction<EditingItemDraft>>;
  materialOptions: MaterialOption[];
  materialSelectOptions: MaterialOption[];
  materialById: Map<string, MaterialInfo>;
  isUpdateItemPending: boolean;
  onUpdateItem: (payload: {
    orderId: string;
    itemId: string;
    data: {
      materialId?: string;
      materialName?: string;
      unit?: string;
      quantity?: number;
      unitPrice?: number;
      vatRate?: number;
    };
  }) => void;
  onCancelEdit: () => void;
}

export const EditItemForm: React.FC<EditItemFormProps> = React.memo(({
  orderId,
  editingItemId,
  editingItemDraft,
  setEditingItemDraft,
  materialOptions,
  materialSelectOptions,
  materialById,
  isUpdateItemPending,
  onUpdateItem,
  onCancelEdit,
}) => (
  <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
      {t('procurement.orderDetail.editItemTitle')}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
      {materialOptions.length > 0 ? (
        <Select
          options={materialSelectOptions}
          value={editingItemDraft.materialId}
          onChange={(event) => {
            const materialId = event.target.value;
            const material = materialById.get(materialId);
            setEditingItemDraft((prev) => ({
              ...prev,
              materialId,
              materialName: material?.name || prev.materialName,
              unit: material?.unit || prev.unit,
            }));
          }}
        />
      ) : (
        <Input
          placeholder={t('procurement.orderDetail.placeholderMaterialId')}
          value={editingItemDraft.materialId}
          onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, materialId: event.target.value }))}
        />
      )}
      <Input
        placeholder={t('procurement.orderDetail.placeholderMaterialName')}
        value={editingItemDraft.materialName}
        onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, materialName: event.target.value }))}
      />
      <Input
        placeholder={t('procurement.orderDetail.placeholderUnit')}
        value={editingItemDraft.unit}
        onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, unit: event.target.value }))}
      />
      <Input
        type="text"
        inputMode="decimal"
        placeholder={t('procurement.orderDetail.placeholderQuantity')}
        value={editingItemDraft.quantity}
        onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, quantity: event.target.value }))}
      />
      <Input
        type="text"
        inputMode="decimal"
        placeholder={t('procurement.orderDetail.placeholderPrice')}
        value={editingItemDraft.unitPrice}
        onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, unitPrice: event.target.value }))}
      />
      <Input
        type="text"
        inputMode="decimal"
        placeholder={t('procurement.orderDetail.placeholderVatPercent')}
        value={editingItemDraft.vatRate}
        onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, vatRate: event.target.value }))}
      />
    </div>
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        loading={isUpdateItemPending}
        onClick={() => {
          const quantity = parseQuantityInput(editingItemDraft.quantity);
          const unitPrice = parseQuantityInput(editingItemDraft.unitPrice);
          const vatRate = toNumber(editingItemDraft.vatRate);
          if (!editingItemDraft.materialId.trim()) {
            toast.error(t('procurement.orderDetail.validationMaterialId'));
            return;
          }
          if (!quantity) {
            toast.error(t('procurement.orderDetail.validationQuantity'));
            return;
          }
          if (!unitPrice) {
            toast.error(t('procurement.orderDetail.validationPrice'));
            return;
          }
          if (vatRate < 0 || vatRate > 100) {
            toast.error(t('procurement.orderDetail.validationVatRange'));
            return;
          }
          onUpdateItem({
            orderId,
            itemId: editingItemId,
            data: {
              materialId: editingItemDraft.materialId.trim(),
              materialName: editingItemDraft.materialName.trim() || undefined,
              unit: editingItemDraft.unit.trim() || undefined,
              quantity,
              unitPrice,
              vatRate,
            },
          });
        }}
      >
        {t('procurement.orderDetail.saveItem')}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onCancelEdit}
      >
        {t('common.cancel')}
      </Button>
    </div>
  </section>
));

EditItemForm.displayName = 'EditItemForm';
