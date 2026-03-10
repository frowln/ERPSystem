import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { materialAnalogsApi } from '@/api/materialAnalogs';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// Maps to backend QualityImpact enum: NO_IMPACT, IMPROVEMENT, ACCEPTABLE_REDUCTION
type QualityImpactLocal = 'NO_IMPACT' | 'IMPROVEMENT' | 'ACCEPTABLE_REDUCTION';

interface SpecItemLike {
  id: string;
  name: string;
  brand?: string;
  manufacturer?: string;
  productCode?: string;
  quantity?: number;
}

interface VeProposalModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  specItem?: SpecItemLike;
}

const inputCn =
  'w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400';
const labelCn = 'block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1';

export const VeProposalModal: React.FC<VeProposalModalProps> = ({ open, onClose, projectId, specItem }) => {
  const queryClient = useQueryClient();

  // Form state — auto-fill from specItem when available
  const [originalName, setOriginalName] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [analogName, setAnalogName] = useState('');
  const [analogBrand, setAnalogBrand] = useState('');
  const [analogManufacturer, setAnalogManufacturer] = useState('');
  const [analogPrice, setAnalogPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [justification, setJustification] = useState('');
  const [qualityImpact, setQualityImpact] = useState<QualityImpactLocal>('NO_IMPACT');

  // Auto-fill from specItem when modal opens with a linked spec item
  useEffect(() => {
    if (open && specItem) {
      setOriginalName(specItem.name || '');
      setOriginalCode(specItem.productCode || '');
      if (specItem.quantity) setQuantity(String(specItem.quantity));
    }
  }, [open, specItem]);

  const parseNum = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;

  // Impact calculation
  const impact = useMemo(() => {
    const origP = parseNum(originalPrice);
    const analP = parseNum(analogPrice);
    const qty = parseNum(quantity);
    const unitDelta = origP - analP;
    const totalDelta = unitDelta * qty;
    return { unitDelta, totalDelta, origP, analP, qty };
  }, [originalPrice, analogPrice, quantity]);

  const createRequestMutation = useMutation({
    mutationFn: () =>
      materialAnalogsApi.createVeProposal({
        projectId: projectId || undefined,
        specItemId: specItem?.id || undefined,
        originalMaterialName: originalName.trim(),
        originalMaterialCode: originalCode.trim() || undefined,
        originalPrice: impact.origP,
        analogMaterialName: analogName.trim(),
        analogBrand: analogBrand.trim() || undefined,
        analogManufacturer: analogManufacturer.trim() || undefined,
        analogPrice: impact.analP,
        quantity: impact.qty,
        qualityImpact: qualityImpact,
        reason: justification.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analog-requests'] });
      queryClient.invalidateQueries({ queryKey: ['material-analogs'] });
      toast.success(t('specifications.ve.proposalSubmitted'));
      resetAndClose();
    },
    onError: () => {
      toast.error(t('specifications.ve.proposalError'));
    },
  });

  const resetAndClose = () => {
    setOriginalName('');
    setOriginalCode('');
    setOriginalPrice('');
    setAnalogName('');
    setAnalogBrand('');
    setAnalogManufacturer('');
    setAnalogPrice('');
    setQuantity('');
    setJustification('');
    setQualityImpact('NO_IMPACT');
    onClose();
  };

  const canSubmit =
    originalName.trim().length > 0 &&
    analogName.trim().length > 0 &&
    impact.origP > 0 &&
    impact.analP > 0 &&
    impact.qty > 0 &&
    justification.trim().length > 0;

  const qualityOptions: { value: QualityImpactLocal; label: string; color: string }[] = [
    {
      value: 'NO_IMPACT',
      label: t('specifications.ve.noImpact'),
      color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      value: 'IMPROVEMENT',
      label: t('specifications.ve.improvement'),
      color: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      value: 'ACCEPTABLE_REDUCTION',
      label: t('specifications.ve.acceptableReduction'),
      color: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ];

  return (
    <Modal
      open={open}
      onClose={createRequestMutation.isPending ? () => {} : resetAndClose}
      title={t('specifications.ve.proposeReplacement')}
      size="lg"
      closeOnOverlayClick={!createRequestMutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={createRequestMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => createRequestMutation.mutate()}
            loading={createRequestMutation.isPending}
            disabled={!canSubmit}
          >
            {t('common.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Original material */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
            {t('specifications.ve.originalMaterial')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCn}>{t('specifications.ve.originalMaterial')} *</label>
              <input className={inputCn} value={originalName} onChange={(e) => setOriginalName(e.target.value)} placeholder={t('specifications.ve.materialNamePlaceholder')} />
            </div>
            <div>
              <label className={labelCn}>{t('specifications.ve.materialCode')}</label>
              <input className={inputCn} value={originalCode} onChange={(e) => setOriginalCode(e.target.value)} />
            </div>
            <div>
              <label className={labelCn}>{t('specifications.ve.unitPrice')} *</label>
              <input className={inputCn} type="text" inputMode="decimal" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Arrow separator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <ArrowRightLeft size={14} className="text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('specifications.ve.replacementArrow')}</span>
          </div>
        </div>

        {/* Analog material */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
            {t('specifications.ve.analogMaterial')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCn}>{t('specifications.ve.analogMaterial')} *</label>
              <input className={inputCn} value={analogName} onChange={(e) => setAnalogName(e.target.value)} placeholder={t('specifications.ve.analogNamePlaceholder')} />
            </div>
            <div>
              <label className={labelCn}>{t('specifications.ve.brand')}</label>
              <input className={inputCn} value={analogBrand} onChange={(e) => setAnalogBrand(e.target.value)} />
            </div>
            <div>
              <label className={labelCn}>{t('specifications.ve.manufacturer')}</label>
              <input className={inputCn} value={analogManufacturer} onChange={(e) => setAnalogManufacturer(e.target.value)} />
            </div>
            <div>
              <label className={labelCn}>{t('specifications.ve.unitPrice')} *</label>
              <input className={inputCn} type="text" inputMode="decimal" value={analogPrice} onChange={(e) => setAnalogPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCn}>{t('specifications.ve.quantity')} *</label>
              <input className={inputCn} type="text" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Impact calculation */}
        {impact.origP > 0 && impact.analP > 0 && impact.qty > 0 && (
          <div
            className={cn(
              'rounded-xl px-4 py-3 border',
              impact.totalDelta >= 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {impact.totalDelta >= 0 ? (
                <TrendingDown size={14} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingUp size={14} className="text-red-600 dark:text-red-400" />
              )}
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {t('specifications.ve.impactCalculation')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-0.5">
                  {t('specifications.ve.priceDelta')}
                </p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    impact.unitDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400',
                  )}
                >
                  {impact.unitDelta >= 0 ? '+' : ''}{formatMoney(impact.unitDelta)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-0.5">
                  {t('specifications.ve.quantity')}
                </p>
                <p className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {impact.qty}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-0.5">
                  {t('specifications.ve.totalImpact')}
                </p>
                <p
                  className={cn(
                    'font-bold text-base tabular-nums',
                    impact.totalDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400',
                  )}
                >
                  {impact.totalDelta >= 0 ? '+' : ''}{formatMoney(impact.totalDelta)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quality impact selector */}
        <div>
          <label className={labelCn}>{t('specifications.ve.qualityImpact')} *</label>
          <div className="flex gap-2 flex-wrap">
            {qualityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setQualityImpact(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  qualityImpact === opt.value
                    ? cn(opt.color, 'ring-2 ring-offset-1 ring-primary-400')
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Justification */}
        <div>
          <label className={labelCn}>{t('specifications.ve.justification')} *</label>
          <textarea
            className={cn(inputCn, 'min-h-[80px] resize-y')}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={t('specifications.ve.justificationPlaceholder')}
          />
        </div>

        {/* Warning note */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t('specifications.ve.approvalNote')}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default VeProposalModal;
