import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface TenderEvaluateWizardProps {
  open: boolean;
  onClose: () => void;
}

interface Bidder {
  id: string;
  name: string;
  totalPrice: number;
}

interface Criteria {
  id: string;
  name: string;
  weight: number;
}

// TODO: replace with real API call
const bidders: Bidder[] = [];

const getDefaultCriteria = (): Criteria[] => [
  { id: 'c1', name: t('procurement.tenderEvaluate.criteriaPrice'), weight: 40 },
  { id: 'c2', name: t('procurement.tenderEvaluate.criteriaDelivery'), weight: 25 },
  { id: 'c3', name: t('procurement.tenderEvaluate.criteriaQuality'), weight: 20 },
  { id: 'c4', name: t('procurement.tenderEvaluate.criteriaExperience'), weight: 15 },
];

const getSteps = () => [
  t('procurement.tenderEvaluate.stepParameters'),
  t('procurement.tenderEvaluate.stepScoring'),
  t('procurement.tenderEvaluate.stepResults'),
];

export const TenderEvaluateWizard: React.FC<TenderEvaluateWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [tenderId, setTenderId] = useState('');
  const [criteria, setCriteria] = useState<Criteria[]>(getDefaultCriteria());
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [winnerId, setWinnerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateWeight = (criteriaId: string, weight: number) => {
    setCriteria((prev) => prev.map((c) => (c.id === criteriaId ? { ...c, weight } : c)));
  };

  const setScore = (bidderId: string, criteriaId: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [bidderId]: { ...prev[bidderId], [criteriaId]: Math.min(10, Math.max(0, score)) },
    }));
  };

  const calculateTotal = (bidderId: string): number => {
    const bidderScores = scores[bidderId] || {};
    return criteria.reduce((total, c) => {
      const score = bidderScores[c.id] || 0;
      return total + score * (c.weight / 100);
    }, 0);
  };

  const ranking = [...bidders]
    .map((b) => ({ ...b, total: calculateTotal(b.id) }))
    .sort((a, b) => b.total - a.total);

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  const handleFinish = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`${t('procurement.tenderEvaluate.toastWinnerApproved')}: ${ranking.find((b) => b.id === winnerId)?.name ?? '—'}`);
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setTenderId('');
    setCriteria(getDefaultCriteria());
    setScores({});
    setWinnerId('');
    onClose();
  };

  const canNext =
    step === 0 ? tenderId !== '' && totalWeight === 100 : step === 1 ? Object.keys(scores).length > 0 : winnerId !== '';

  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.tenderEvaluate.title')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('procurement.tenderEvaluate.cancel') : t('procurement.tenderEvaluate.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('procurement.tenderEvaluate.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting} disabled={!winnerId}>
              {t('procurement.tenderEvaluate.approveWinner')}
            </Button>
          )}
        </>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= step ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i <= step ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-neutral-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select tender and set criteria weights */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label={t('procurement.tenderEvaluate.tenderLabel')} required>
            <Select options={[]} value={tenderId} onChange={(e) => setTenderId(e.target.value)} placeholder={t('procurement.tenderEvaluate.tenderPlaceholder')} />
          </FormField>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('procurement.tenderEvaluate.criteriaWeights')}</span>
              <span className={`text-xs font-medium ${totalWeight === 100 ? 'text-success-600' : 'text-danger-600'}`}>
                {t('procurement.tenderEvaluate.totalWeight')}: {totalWeight}% {totalWeight !== 100 && `(${t('procurement.tenderEvaluate.mustBe100')})`}
              </span>
            </div>
            <div className="space-y-2">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                  <span className="text-sm flex-1">{c.name}</span>
                  <Input
                    type="number"
                    className="w-20 text-center"
                    value={c.weight}
                    onChange={(e) => updateWeight(c.id, Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Score each bidder on each criteria */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('procurement.tenderEvaluate.scoringHint')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 pr-3 font-medium text-neutral-600">{t('procurement.tenderEvaluate.thBidder')}</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="text-center py-2 px-2 font-medium text-neutral-600 whitespace-nowrap">
                      {c.name} ({c.weight}%)
                    </th>
                  ))}
                  <th className="text-center py-2 pl-3 font-medium text-neutral-600">{t('procurement.tenderEvaluate.thTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {([] as any[]).map((bidder) => (
                  <tr key={bidder.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-3">
                      <p className="font-medium">{bidder.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{bidder.totalPrice.toLocaleString('ru-RU')} ₽</p>
                    </td>
                    {criteria.map((c) => (
                      <td key={c.id} className="py-2 px-2">
                        <Input
                          type="number"
                          className="w-16 text-center"
                          min={0}
                          max={10}
                          value={scores[bidder.id]?.[c.id] ?? ''}
                          onChange={(e) => setScore(bidder.id, c.id, Number(e.target.value))}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="py-2 pl-3 text-center font-semibold text-primary-700">
                      {calculateTotal(bidder.id).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: View ranking, select winner */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('procurement.tenderEvaluate.rankingHint')}</p>
          <div className="space-y-2">
            {ranking.map((bidder, idx) => (
              <label
                key={bidder.id}
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  winnerId === bidder.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                onClick={() => setWinnerId(bidder.id)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0
                      ? 'bg-warning-100 text-warning-700'
                      : idx === 1
                        ? 'bg-neutral-200 text-neutral-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{bidder.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{bidder.totalPrice.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-700">{bidder.total.toFixed(2)}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.tenderEvaluate.points')}</p>
                </div>
                <input
                  type="radio"
                  name="winner"
                  checked={winnerId === bidder.id}
                  onChange={() => setWinnerId(bidder.id)}
                  className="h-4 w-4 text-primary-600"
                />
              </label>
            ))}
          </div>
          {winnerId && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-3">
              <p className="text-sm text-success-800">
                {t('procurement.tenderEvaluate.winner')}: <strong>{(undefined as any[] | undefined)?.find((b) => b.id === winnerId)?.name}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
