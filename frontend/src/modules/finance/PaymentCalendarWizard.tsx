import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface PaymentCalendarWizardProps {
  open: boolean;
  onClose: () => void;
}

const getProjectOptions = () => [
  { value: 'p1', label: t('mockData.projectNovyeGorizonty') },
  { value: 'p2', label: t('mockData.projectBcCentralny') },
  { value: 'p3', label: t('mockData.projectSkladLogistik') },
];

const frequencyOptions = [
  { value: 'WEEKLY', label: t('finance.paymentCalendar.freqWeekly') },
  { value: 'BIWEEKLY', label: t('finance.paymentCalendar.freqBiweekly') },
  { value: 'MONTHLY', label: t('finance.paymentCalendar.freqMonthly') },
];

const paymentTypeOptions = [
  { value: 'all', label: t('finance.paymentCalendar.typeAll') },
  { value: 'MATERIALS', label: t('finance.paymentCalendar.typeMaterials') },
  { value: 'works', label: t('finance.paymentCalendar.typeWorks') },
  { value: 'services', label: t('finance.paymentCalendar.typeServices') },
];

interface PreviewRow {
  date: string;
  description: string;
  amount: number;
  type: string;
}

const STEPS = [t('finance.paymentCalendar.stepProject'), t('finance.paymentCalendar.stepParams'), t('finance.paymentCalendar.stepPreview'), t('finance.paymentCalendar.stepCreate')];

export const PaymentCalendarWizard: React.FC<PaymentCalendarWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [paymentType, setPaymentType] = useState('all');
  const [includeApproved, setIncludeApproved] = useState(true);
  const [includePlanned, setIncludePlanned] = useState(true);
  const [autoDistribute, setAutoDistribute] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = ([] as any[]).reduce((sum, r) => sum + r.amount, 0);

  const handleFinish = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success(t('finance.paymentCalendar.toastSuccess'));
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setProjectId('');
    setStartDate('');
    setEndDate('');
    setFrequency('MONTHLY');
    setPaymentType('all');
    setIncludeApproved(true);
    setIncludePlanned(true);
    setAutoDistribute(false);
    onClose();
  };

  const canNext =
    step === 0 ? projectId !== '' && startDate !== '' && endDate !== '' : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('finance.paymentCalendar.modalTitle')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('finance.paymentCalendar.cancel') : t('finance.paymentCalendar.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('finance.paymentCalendar.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('finance.paymentCalendar.generate')}
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

      {/* Step 1: Project and period */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label={t('finance.paymentCalendar.labelProject')} required>
            <Select
              options={getProjectOptions()}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('finance.paymentCalendar.selectProject')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('finance.paymentCalendar.labelStartDate')} required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>
            <FormField label={t('finance.paymentCalendar.labelEndDate')} required>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>
          </div>
        </div>
      )}

      {/* Step 2: Parameters */}
      {step === 1 && (
        <div className="space-y-4">
          <FormField label={t('finance.paymentCalendar.labelFrequency')}>
            <Select options={frequencyOptions} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </FormField>
          <FormField label={t('finance.paymentCalendar.labelPaymentType')}>
            <Select options={paymentTypeOptions} value={paymentType} onChange={(e) => setPaymentType(e.target.value)} />
          </FormField>
          <div className="space-y-2">
            <Checkbox
              label={t('finance.paymentCalendar.checkApproved')}
              checked={includeApproved}
              onChange={(e) => setIncludeApproved(e.target.checked)}
              id="inc-approved"
            />
            <Checkbox
              label={t('finance.paymentCalendar.checkPlanned')}
              checked={includePlanned}
              onChange={(e) => setIncludePlanned(e.target.checked)}
              id="inc-planned"
            />
            <Checkbox
              label={t('finance.paymentCalendar.checkAutoDistribute')}
              checked={autoDistribute}
              onChange={(e) => setAutoDistribute(e.target.checked)}
              id="auto-dist"
            />
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('finance.paymentCalendar.previewHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('finance.paymentCalendar.colDate')}</th>
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('finance.paymentCalendar.colDescription')}</th>
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('finance.paymentCalendar.colType')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('finance.paymentCalendar.colAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {([] as any[]).map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100">
                    <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-2">{row.description}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-2 py-0.5 rounded">{row.type}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{row.amount.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 dark:bg-neutral-800">
                  <td colSpan={3} className="px-3 py-2 font-semibold text-right">{t('finance.paymentCalendar.totalRow')}:</td>
                  <td className="px-3 py-2 text-right font-bold">{totalAmount.toLocaleString('ru-RU')} ₽</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>{t('finance.paymentCalendar.summaryProject')}:</strong> {getProjectOptions().find((o) => o.value === projectId)?.label}</p>
            <p><strong>{t('finance.paymentCalendar.summaryPeriod')}:</strong> {startDate} - {endDate}</p>
            <p><strong>{t('finance.paymentCalendar.summaryFrequency')}:</strong> {frequencyOptions.find((o) => o.value === frequency)?.label}</p>
            <p><strong>{t('finance.paymentCalendar.summaryPayments')}:</strong> {0}</p>
            <p><strong>{t('finance.paymentCalendar.summaryTotal')}:</strong> {totalAmount.toLocaleString('ru-RU')} ₽</p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('finance.paymentCalendar.confirmInfo')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
