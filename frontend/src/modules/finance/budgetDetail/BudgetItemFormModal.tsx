import React from 'react';
import { Tag, FileText, Receipt } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { BudgetItem } from '@/types';
import {
  calcSalePrice,
  calcVatAmount,
  calcTotalWithVat,
  calcPlanned,
} from '@/modules/finance/budgetDetail/budgetDetailHelpers';
import type {
  ItemFormState,
  SelectedTenderInfo,
  SelectedEstimateInfo,
  SelectedInvoiceInfo,
} from '@/modules/finance/budgetDetail/budgetDetailTypes';
import {
  ITEM_TYPES,
  BUDGET_CATEGORIES,
  UNITS,
  DISCIPLINE_MARKS,
} from '@/modules/finance/budgetDetail/budgetDetailTypes';

interface BudgetItemFormModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: BudgetItem | null;
  form: ItemFormState;
  setF: (key: keyof ItemFormState, value: string | boolean) => void;
  onSubmit: () => void;
  isPending: boolean;
  selectedTenderInfo: SelectedTenderInfo | null;
  selectedEstimateInfo: SelectedEstimateInfo | null;
  selectedInvoiceInfo: SelectedInvoiceInfo | null;
  onClearTender: () => void;
  onClearEstimate: () => void;
  onClearInvoice: () => void;
  onOpenTenderPicker: () => void;
  onOpenEstimatePicker: () => void;
  onOpenInvoicePicker: () => void;
  onCostPriceManualChange: (value: string) => void;
}

const BudgetItemFormModal: React.FC<BudgetItemFormModalProps> = ({
  open,
  onClose,
  editingItem,
  form,
  setF,
  onSubmit,
  isPending,
  selectedTenderInfo,
  selectedEstimateInfo,
  selectedInvoiceInfo,
  onClearTender,
  onClearEstimate,
  onClearInvoice,
  onOpenTenderPicker,
  onOpenEstimatePicker,
  onOpenInvoicePicker,
  onCostPriceManualChange,
}) => {
  // ── Preview calculations ────────────────────────────────────────────────
  const previewCp   = parseFloat(form.costPrice) || 0;
  const previewEp   = parseFloat(form.estimatePrice) || 0;
  const previewCustomer = parseFloat(form.customerPrice) || 0;
  const previewCoef = parseFloat(form.coefficient) || 1;
  const previewVat  = parseFloat(form.vatRate) || 22;
  const previewQty  = parseFloat(form.quantity) || 1;
  const previewSp   = calcSalePrice(previewCp, previewCoef);
  const previewVa   = calcVatAmount(previewSp, previewVat);
  const previewTwv  = calcTotalWithVat(previewSp, previewVa);
  const previewPa   = calcPlanned(previewSp, previewQty);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingItem
          ? (editingItem.section ? t('finance.editSection') : t('finance.editPosition'))
          : (form.section ? t('finance.addSectionTitle') : t('finance.addPositionTitle'))
      }
      size="lg"
    >
      <div className="space-y-4">
        {!editingItem && (
          <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.section}
                onChange={(e) => setF('section', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('finance.isSectionHint')}</span>
            </label>
          </div>
        )}

        <FormField label={form.section ? t('finance.fieldSectionName') : t('finance.fieldPositionName')} required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setF('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={form.section ? t('finance.placeholderSectionName') : t('finance.placeholderPositionName')}
          />
        </FormField>

        {form.section && (
          <FormField label={t('finance.fieldSectionMark')} required={false}>
            <select
              value={form.disciplineMark}
              onChange={(e) => setF('disciplineMark', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="">{t('finance.notSpecified')}</option>
              {DISCIPLINE_MARKS.map((mark) => (
                <option key={mark} value={mark}>{mark}</option>
              ))}
            </select>
          </FormField>
        )}

        {!form.section && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('finance.fieldItemType')}>
                <select
                  value={form.itemType}
                  onChange={(e) => setF('itemType', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                >
                  {ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>
              <FormField label={t('finance.fieldCategory')}>
                <select
                  value={form.category}
                  onChange={(e) => setF('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                >
                  {BUDGET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label={t('finance.fieldQuantity')}>
                <input type="number" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} min="0" step="0.001"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
              </FormField>
              <FormField label={t('finance.fieldUnit')}>
                <select value={form.unit} onChange={(e) => setF('unit', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm">
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label={t('finance.fieldVatPercent')}>
                <input type="number" value={form.vatRate} onChange={(e) => setF('vatRate', e.target.value)} min="0" max="100" step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <FormField label={t('finance.fieldCostPricePerUnit')} hint={t('finance.hintPriceFromTenderOrEstimate')}>
                <div className="flex flex-wrap gap-2">
                  <input type="number" value={form.costPrice} onChange={(e) => onCostPriceManualChange(e.target.value)} min="0" step="0.01"
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                  <button
                    type="button"
                    onClick={onOpenTenderPicker}
                    title={t('finance.pickPriceFromTender')}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-primary-50 hover:border-primary-300 text-neutral-500 hover:text-primary-700 text-xs transition-colors"
                  >
                    <Tag size={12} />
                    {t('finance.tender')}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEstimatePicker}
                    title={t('finance.pickPriceFromEstimate')}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-primary-50 hover:border-primary-300 text-neutral-500 hover:text-primary-700 text-xs transition-colors"
                  >
                    <FileText size={12} />
                    {t('finance.estimate')}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenInvoicePicker}
                    title={t('finance.pickPriceFromInvoice')}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-primary-50 hover:border-primary-300 text-neutral-500 hover:text-primary-700 text-xs transition-colors"
                  >
                    <Receipt size={12} />
                    {t('finance.invoice')}
                  </button>
                </div>
                {selectedTenderInfo && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-100 dark:border-primary-800">
                    <Tag size={10} className="text-primary-600 shrink-0" />
                    <span className="text-xs text-primary-700 dark:text-primary-300 truncate">
                      {selectedTenderInfo.itemName} · {formatMoney(selectedTenderInfo.price)}
                    </span>
                    <button
                      type="button"
                      onClick={onClearTender}
                      className="ml-auto shrink-0 text-primary-400 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedEstimateInfo && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-100 dark:border-primary-800">
                    <FileText size={10} className="text-primary-600 shrink-0" />
                    <span className="text-xs text-primary-700 dark:text-primary-300 truncate">
                      {selectedEstimateInfo.itemName} · {formatMoney(selectedEstimateInfo.price)}
                    </span>
                    <button
                      type="button"
                      onClick={onClearEstimate}
                      className="ml-auto shrink-0 text-primary-400 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedInvoiceInfo && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-100 dark:border-primary-800">
                    <Receipt size={10} className="text-primary-600 shrink-0" />
                    <span className="text-xs text-primary-700 dark:text-primary-300 truncate">
                      {selectedInvoiceInfo.itemName} · {formatMoney(selectedInvoiceInfo.price)}
                    </span>
                    <button
                      type="button"
                      onClick={onClearInvoice}
                      className="ml-auto shrink-0 text-primary-400 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </FormField>
              <FormField label={t('finance.fieldEstimatePricePerUnit')} hint={t('finance.hintBaseEstimatePrice')}>
                <input
                  type="number"
                  value={form.estimatePrice}
                  onChange={(e) => setF('estimatePrice', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                />
              </FormField>
              <FormField label={t('finance.colClientPrice')} hint={t('finance.hintCustomerPriceLimit')}>
                <input
                  type="number"
                  value={form.customerPrice}
                  onChange={(e) => setF('customerPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                />
              </FormField>
              <FormField label={t('finance.fieldMarkupCoefficient')} hint={t('finance.hintMarkupCoefficient')}>
                <input type="number" value={form.coefficient} onChange={(e) => setF('coefficient', e.target.value)} min="0" step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
              </FormField>
            </div>

            {previewCp > 0 && (
              <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 p-3">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">{t('finance.priceCalculation')}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-neutral-600">{t('finance.calcCostPrice')}:</span>
                  <span className="text-right font-medium tabular-nums">{formatMoney(previewCp)}</span>
                  <span className="text-neutral-600">{t('finance.calcEstimatePrice')}:</span>
                  <span className="text-right font-medium tabular-nums">{previewEp > 0 ? formatMoney(previewEp) : <span className="text-neutral-300">—</span>}</span>
                  <span className="text-neutral-600">{t('finance.calcCoefficient', { value: form.coefficient })}:</span>
                  <span className="text-right font-medium tabular-nums">{formatMoney(previewSp)}</span>
                  <span className="text-neutral-600">{t('finance.colClientPrice')}:</span>
                  <span className="text-right font-medium tabular-nums">{previewCustomer > 0 ? formatMoney(previewCustomer) : <span className="text-neutral-300">—</span>}</span>
                  <span className="text-neutral-600">{t('finance.calcVat', { rate: form.vatRate })}:</span>
                  <span className="text-right font-medium tabular-nums text-neutral-500">{formatMoney(previewVa)}</span>
                  <span className="text-neutral-600">{t('finance.calcTotalWithVatPerUnit')}:</span>
                  <span className="text-right font-bold tabular-nums text-primary-700">{formatMoney(previewTwv)}</span>
                  <span className="text-neutral-600 border-t border-primary-100 pt-1">{t('finance.calcPlannedAmount', { qty: form.quantity, unit: form.unit })}:</span>
                  <span className="text-right font-bold tabular-nums text-primary-700 border-t border-primary-100 pt-1">{formatMoney(previewPa)}</span>
                </div>
              </div>
            )}
          </>
        )}

        <FormField label={t('finance.fieldNote')} required={false}>
          <textarea
            value={form.notes}
            onChange={(e) => setF('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            loading={isPending}
          >
            {editingItem ? t('common.save') : t('finance.addButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BudgetItemFormModal;
