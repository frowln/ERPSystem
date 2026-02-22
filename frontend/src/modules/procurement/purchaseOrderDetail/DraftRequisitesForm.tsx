import React from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { parseQuantityInput, toNumber } from './types';

interface DraftMeta {
  expectedDeliveryDate: string;
  paymentTerms: string;
  deliveryAddress: string;
  notes: string;
}

interface DraftItem {
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

interface DraftRequisitesFormProps {
  orderId: string;
  draftMeta: DraftMeta;
  setDraftMeta: React.Dispatch<React.SetStateAction<DraftMeta>>;
  draftItem: DraftItem;
  setDraftItem: React.Dispatch<React.SetStateAction<DraftItem>>;
  materialOptions: MaterialOption[];
  materialSelectOptions: MaterialOption[];
  materialById: Map<string, MaterialInfo>;
  isUpdateOrderPending: boolean;
  isAddItemPending: boolean;
  onUpdateOrder: (payload: {
    orderId: string;
    data: {
      expectedDeliveryDate?: string;
      paymentTerms?: string;
      deliveryAddress?: string;
      notes?: string;
    };
  }) => void;
  onAddItem: (payload: {
    orderId: string;
    data: {
      materialId: string;
      materialName?: string;
      unit?: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    };
  }) => void;
}

export const DraftRequisitesForm: React.FC<DraftRequisitesFormProps> = React.memo(({
  orderId,
  draftMeta,
  setDraftMeta,
  draftItem,
  setDraftItem,
  materialOptions,
  materialSelectOptions,
  materialById,
  isUpdateOrderPending,
  isAddItemPending,
  onUpdateOrder,
  onAddItem,
}) => (
  <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('procurement.orderDetail.draftRequisites')}</p>
        <Input
          type="date"
          value={draftMeta.expectedDeliveryDate}
          onChange={(event) => setDraftMeta((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
        />
        <Input
          placeholder={t('procurement.orderDetail.placeholderPaymentTerms')}
          value={draftMeta.paymentTerms}
          onChange={(event) => setDraftMeta((prev) => ({ ...prev, paymentTerms: event.target.value }))}
        />
        <Input
          placeholder={t('procurement.orderDetail.placeholderDeliveryAddress')}
          value={draftMeta.deliveryAddress}
          onChange={(event) => setDraftMeta((prev) => ({ ...prev, deliveryAddress: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('procurement.orderDetail.draftNotes')}</p>
        <Textarea
          rows={5}
          placeholder={t('procurement.orderDetail.placeholderOrderNotes')}
          value={draftMeta.notes}
          onChange={(event) => setDraftMeta((prev) => ({ ...prev, notes: event.target.value }))}
        />
        <Button
          variant="secondary"
          size="sm"
          loading={isUpdateOrderPending}
          onClick={() => {
            onUpdateOrder({
              orderId,
              data: {
                expectedDeliveryDate: draftMeta.expectedDeliveryDate || undefined,
                paymentTerms: draftMeta.paymentTerms.trim() || undefined,
                deliveryAddress: draftMeta.deliveryAddress.trim() || undefined,
                notes: draftMeta.notes.trim() || undefined,
              },
            });
          }}
        >
          {t('procurement.orderDetail.saveRequisites')}
        </Button>
      </div>
    </div>

    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {t('procurement.orderDetail.addItemTitle')}
      </h3>
      <Button
        variant="secondary"
        size="sm"
        iconLeft={<Plus size={14} />}
        loading={isAddItemPending}
        onClick={() => {
          const quantity = parseQuantityInput(draftItem.quantity);
          const unitPrice = parseQuantityInput(draftItem.unitPrice);
          const vatRate = toNumber(draftItem.vatRate);
          if (!draftItem.materialId.trim()) {
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
          onAddItem({
            orderId,
            data: {
              materialId: draftItem.materialId.trim(),
              materialName: draftItem.materialName.trim() || undefined,
              unit: draftItem.unit.trim() || undefined,
              quantity,
              unitPrice,
              vatRate,
            },
          });
        }}
      >
        {t('procurement.orderDetail.addItemButton')}
      </Button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      {materialOptions.length > 0 ? (
        <Select
          options={materialSelectOptions}
          value={draftItem.materialId}
          onChange={(event) => {
            const materialId = event.target.value;
            const material = materialById.get(materialId);
            setDraftItem((prev) => ({
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
          value={draftItem.materialId}
          onChange={(event) => setDraftItem((prev) => ({ ...prev, materialId: event.target.value }))}
        />
      )}
      <Input
        placeholder={t('procurement.orderDetail.placeholderMaterialName')}
        value={draftItem.materialName}
        onChange={(event) => setDraftItem((prev) => ({ ...prev, materialName: event.target.value }))}
      />
      <Input
        placeholder={t('procurement.orderDetail.placeholderUnit')}
        value={draftItem.unit}
        onChange={(event) => setDraftItem((prev) => ({ ...prev, unit: event.target.value }))}
      />
      <Input
        type="text"
        inputMode="decimal"
        placeholder={t('procurement.orderDetail.placeholderQuantity')}
        value={draftItem.quantity}
        onChange={(event) => setDraftItem((prev) => ({ ...prev, quantity: event.target.value }))}
      />
      <Input
        type="text"
        inputMode="decimal"
        placeholder={t('procurement.orderDetail.placeholderPrice')}
        value={draftItem.unitPrice}
        onChange={(event) => setDraftItem((prev) => ({ ...prev, unitPrice: event.target.value }))}
      />
      <Input
        type="text"
        inputMode="decimal"
        placeholder={t('procurement.orderDetail.placeholderVatPercent')}
        value={draftItem.vatRate}
        onChange={(event) => setDraftItem((prev) => ({ ...prev, vatRate: event.target.value }))}
      />
    </div>
  </section>
));

DraftRequisitesForm.displayName = 'DraftRequisitesForm';
