import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BudgetItem } from '@/types';

interface AddBudgetItemModalProps {
  budgetId: string;
  sections: BudgetItem[];
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER'] as const;
const ITEM_TYPES = ['WORKS', 'MATERIALS', 'EQUIPMENT'] as const;

export default function AddBudgetItemModal({ budgetId, sections, open, onClose }: AddBudgetItemModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('MATERIALS');
  const [itemType, setItemType] = useState<string>('MATERIALS');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [estimatePrice, setEstimatePrice] = useState<string>('');
  const [customerPrice, setCustomerPrice] = useState<string>('');
  const [plannedAmount, setPlannedAmount] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');

  // Auto-compute planned amount from quantity * costPrice if user hasn't manually set it
  const computedPlanned = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const c = parseFloat(costPrice) || 0;
    return q * c;
  }, [quantity, costPrice]);

  const effectivePlanned = plannedAmount ? parseFloat(plannedAmount) : computedPlanned;

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof financeApi.createBudgetItem>[1]) =>
      financeApi.createBudgetItem(budgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      toast.success(t('finance.fm.toasts.itemCreated'));
      resetAndClose();
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const resetAndClose = () => {
    setName('');
    setCategory('MATERIALS');
    setItemType('MATERIALS');
    setUnit('');
    setQuantity('');
    setCostPrice('');
    setEstimatePrice('');
    setCustomerPrice('');
    setPlannedAmount('');
    setParentId('');
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({
      name: name.trim(),
      category,
      itemType,
      unit: unit || undefined,
      quantity: quantity ? parseFloat(quantity) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      estimatePrice: estimatePrice ? parseFloat(estimatePrice) : undefined,
      customerPrice: customerPrice ? parseFloat(customerPrice) : undefined,
      plannedAmount: effectivePlanned,
      parentId: parentId || undefined,
    });
  };

  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('finance.fm.addItemTitle')}
          </h2>
          <button onClick={resetAndClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className={labelCls}>{t('finance.fm.fieldName')} *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('finance.fm.fieldCategory')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('finance.fm.fieldItemType')}</label>
              <select value={itemType} onChange={(e) => setItemType(e.target.value)} className={inputCls}>
                {ITEM_TYPES.map((it) => (
                  <option key={it} value={it}>{it}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('finance.fm.fieldUnit')}</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('finance.fm.fieldQuantity')}</label>
              <input type="number" step="0.01" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>{t('finance.fm.fieldCostPrice')}</label>
              <input type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('finance.fm.fieldEstimatePrice')}</label>
              <input type="number" step="0.01" min="0" value={estimatePrice} onChange={(e) => setEstimatePrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('finance.fm.fieldCustomerPrice')}</label>
              <input type="number" step="0.01" min="0" value={customerPrice} onChange={(e) => setCustomerPrice(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              {t('finance.fm.fieldPlannedAmount')} *
              {computedPlanned > 0 && !plannedAmount && (
                <span className="ml-2 text-xs text-neutral-400 font-normal">
                  (= {t('finance.fm.fieldQuantity')} × {t('finance.fm.fieldCostPrice')})
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={plannedAmount}
              placeholder={computedPlanned > 0 ? String(computedPlanned) : '0'}
              onChange={(e) => setPlannedAmount(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>{t('finance.fm.fieldParentSection')}</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputCls}>
              <option value="">{t('finance.fm.fieldNoSection')}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={resetAndClose}
            className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={!name.trim() || mutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
