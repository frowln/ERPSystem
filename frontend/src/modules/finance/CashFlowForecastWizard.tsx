import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { apiClient } from '@/api/client';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface CashFlowForecastWizardProps {
  open: boolean;
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const periodOptions = [
  { value: 'MONTHLY', label: t('finance.cashFlowForecast.periodMonthly') },
  { value: 'WEEKLY', label: t('finance.cashFlowForecast.periodWeekly') },
  { value: 'QUARTERLY', label: t('finance.cashFlowForecast.periodQuarterly') },
];

const STEPS = [t('finance.cashFlowForecast.stepProjects'), t('finance.cashFlowForecast.stepPeriod'), t('finance.cashFlowForecast.stepParams'), t('finance.cashFlowForecast.stepGenerate')];

export const CashFlowForecastWizard: React.FC<CashFlowForecastWizardProps> = ({ open, onClose }) => {
  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const response = await apiClient.get<{ content: Project[] }>('/projects');
      return response.data.content;
    },
    enabled: open,
  });

  const allProjects = projectsData ?? [];
  const [step, setStep] = useState(0);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [growthRate, setGrowthRate] = useState('3');
  const [paymentDelay, setPaymentDelay] = useState('30');
  const [includeVat, setIncludeVat] = useState(true);
  const [includeRetention, setIncludeRetention] = useState(false);
  const [retentionPercent, setRetentionPercent] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const projects = allProjects.filter((p) => selectedProjects.has(p.id));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const projectIds = Array.from(selectedProjects);
      for (const pid of projectIds) {
        await apiClient.post('/cash-flow/generate', null, {
          params: {
            projectId: pid,
            startDate,
            endDate,
            paymentDelayDays: Number(paymentDelay) || 30,
            includeVat,
          },
        });
      }
      toast.success(t('finance.cashFlowForecast.toastSuccess'));
      resetAndClose();
    } catch {
      toast.error('Ошибка генерации прогноза');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedProjects(new Set());
    setStartDate('');
    setEndDate('');
    setPeriodType('MONTHLY');
    setGrowthRate('3');
    setPaymentDelay('30');
    setIncludeVat(true);
    setIncludeRetention(false);
    setRetentionPercent('5');
    onClose();
  };

  const canNext =
    step === 0
      ? selectedProjects.size > 0
      : step === 1
        ? startDate !== '' && endDate !== ''
        : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('finance.cashFlowForecast.modalTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('finance.cashFlowForecast.cancel') : t('finance.cashFlowForecast.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('finance.cashFlowForecast.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('finance.cashFlowForecast.generate')}
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

      {/* Step 1: Select projects */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('finance.cashFlowForecast.selectProjectsHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
            {allProjects.map((proj) => (
              <label key={proj.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <Checkbox checked={selectedProjects.has(proj.id)} onChange={() => toggleProject(proj.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{proj.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.cashFlowForecast.codeLabel', { code: proj.code })}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Set period */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('finance.cashFlowForecast.labelStartDate')} required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>
            <FormField label={t('finance.cashFlowForecast.labelEndDate')} required>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('finance.cashFlowForecast.labelDetailLevel')}>
            <Select options={periodOptions} value={periodType} onChange={(e) => setPeriodType(e.target.value)} />
          </FormField>
          {startDate && endDate && (
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
              <p className="text-sm text-neutral-600">
                {t('finance.cashFlowForecast.periodInfo', { start: startDate, end: endDate })}
              </p>
              <p className="text-sm text-neutral-600">
                {t('finance.cashFlowForecast.projectsCount', { count: selectedProjects.size })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Parameters */}
      {step === 2 && (
        <div className="space-y-4">
          <FormField label={t('finance.cashFlowForecast.growthRateLabel')} hint={t('finance.cashFlowForecast.growthRateHint')}>
            <Input
              type="number"
              value={growthRate}
              onChange={(e) => setGrowthRate(e.target.value)}
              min={0}
              max={50}
            />
          </FormField>
          <FormField label={t('finance.cashFlowForecast.paymentDelayLabel')} hint={t('finance.cashFlowForecast.paymentDelayHint')}>
            <Input
              type="number"
              value={paymentDelay}
              onChange={(e) => setPaymentDelay(e.target.value)}
              min={0}
              max={180}
            />
          </FormField>
          <div className="space-y-2">
            <Checkbox
              label={t('finance.cashFlowForecast.checkVat')}
              checked={includeVat}
              onChange={(e) => setIncludeVat(e.target.checked)}
              id="vat-check"
            />
            <Checkbox
              label={t('finance.cashFlowForecast.checkRetention')}
              checked={includeRetention}
              onChange={(e) => setIncludeRetention(e.target.checked)}
              id="retention-check"
            />
          </div>
          {includeRetention && (
            <FormField label={t('finance.cashFlowForecast.retentionPercentLabel')}>
              <Input
                type="number"
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(e.target.value)}
                min={1}
                max={20}
              />
            </FormField>
          )}
        </div>
      )}

      {/* Step 4: Confirm and generate */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('finance.cashFlowForecast.reviewHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>{t('finance.cashFlowForecast.summaryProjects')}:</strong> {projects.map((p) => p.name).join(', ')}</p>
            <p><strong>{t('finance.cashFlowForecast.summaryPeriod')}:</strong> {startDate} - {endDate}</p>
            <p><strong>{t('finance.cashFlowForecast.summaryDetail')}:</strong> {periodOptions.find((o) => o.value === periodType)?.label}</p>
            <p><strong>{t('finance.cashFlowForecast.summaryGrowth')}:</strong> {growthRate}%</p>
            <p><strong>{t('finance.cashFlowForecast.summaryDelay')}:</strong> {paymentDelay} {t('finance.cashFlowForecast.days')}</p>
            <p><strong>{t('finance.cashFlowForecast.summaryVat')}:</strong> {includeVat ? t('finance.cashFlowForecast.yes') : t('finance.cashFlowForecast.no')}</p>
            {includeRetention && <p><strong>{t('finance.cashFlowForecast.summaryRetention')}:</strong> {retentionPercent}%</p>}
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('finance.cashFlowForecast.confirmInfo')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
