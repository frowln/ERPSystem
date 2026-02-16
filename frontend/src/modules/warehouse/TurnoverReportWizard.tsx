import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { warehouseApi } from '@/api/warehouse';
import type { TurnoverReportEntry } from './types';

interface TurnoverReportWizardProps {
  open: boolean;
  onClose: () => void;
}

const warehouseOptions = [
  { value: 'wh1', label: t('warehouse.turnoverWizard.warehouseCentral') },
  { value: 'wh2', label: t('warehouse.turnoverWizard.warehouseNewHorizons') },
  { value: 'wh3', label: t('warehouse.turnoverWizard.warehouseCentralBC') },
  { value: 'wh4', label: t('warehouse.turnoverWizard.warehouseGSM') },
];

const groupByOptions = [
  { value: 'MATERIAL', label: t('warehouse.turnoverWizard.groupByMaterial') },
  { value: 'category', label: t('warehouse.turnoverWizard.groupByCategory') },
  { value: 'supplier', label: t('warehouse.turnoverWizard.groupBySupplier') },
];

const exportFormatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF' },
];

const STEPS = [t('warehouse.turnoverWizard.step1'), t('warehouse.turnoverWizard.step2'), t('warehouse.turnoverWizard.step3')];

export const TurnoverReportWizard: React.FC<TurnoverReportWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [warehouseId, setWarehouseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('MATERIAL');
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [submitting, setSubmitting] = useState(false);

  const canFetchReport = warehouseId !== '' && startDate !== '' && endDate !== '';

  const { data: turnoverRows = [], isLoading: loadingReport } = useQuery({
    queryKey: ['turnover-report', warehouseId, startDate, endDate, groupBy, showZeroBalance],
    queryFn: () =>
      warehouseApi.getTurnoverReport({
        locationId: warehouseId,
        periodFrom: startDate,
        periodTo: endDate,
      }),
    enabled: canFetchReport && step >= 1,
  });

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await warehouseApi.exportTurnoverReport({
        locationId: warehouseId,
        periodFrom: startDate,
        periodTo: endDate,
        format: exportFormat,
      });
      toast.success(t('warehouse.turnoverWizard.toastGenerated', { format: exportFormat.toUpperCase() }));
    } catch {
      toast.error(t('warehouse.turnoverWizard.toastGenerateError', { format: exportFormat.toUpperCase() }));
    } finally {
      setSubmitting(false);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setWarehouseId('');
    setStartDate('');
    setEndDate('');
    setGroupBy('MATERIAL');
    setShowZeroBalance(false);
    setExportFormat('xlsx');
    onClose();
  };

  const canNext = step === 0 ? warehouseId !== '' && startDate !== '' && endDate !== '' : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('warehouse.turnoverWizard.title')}
      description={t('warehouse.turnoverWizard.description')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('warehouse.turnoverWizard.btnCancel') : t('warehouse.turnoverWizard.btnBack')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('warehouse.turnoverWizard.btnNext')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('warehouse.turnoverWizard.btnExport')}
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

      {/* Step 1: Warehouse and period */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label={t('warehouse.turnoverWizard.fieldWarehouse')} required>
            <Select
              options={warehouseOptions}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              placeholder={t('warehouse.turnoverWizard.fieldWarehousePlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('warehouse.turnoverWizard.fieldStartDate')} required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>
            <FormField label={t('warehouse.turnoverWizard.fieldEndDate')} required>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('warehouse.turnoverWizard.fieldGroupBy')}>
            <Select options={groupByOptions} value={groupBy} onChange={(e) => setGroupBy(e.target.value)} />
          </FormField>
          <Checkbox
            label={t('warehouse.turnoverWizard.checkboxZeroBalance')}
            checked={showZeroBalance}
            onChange={(e) => setShowZeroBalance(e.target.checked)}
            id="zero-balance"
          />
        </div>
      )}

      {/* Step 2: Preview turnover data */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('warehouse.turnoverWizard.step2Instruction', { count: turnoverRows.length })}
          </p>
          {loadingReport ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-neutral-400">{t('common.loading')}</span>
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('warehouse.turnoverWizard.headerName')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('warehouse.turnoverWizard.headerUnit')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('warehouse.turnoverWizard.headerOpenBalance')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600 text-success-700">{t('warehouse.turnoverWizard.headerIncome')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600 text-danger-700">{t('warehouse.turnoverWizard.headerExpense')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('warehouse.turnoverWizard.headerCloseBalance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {turnoverRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      <td className="px-3 py-2">{row.materialName}</td>
                      <td className="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">{row.unitOfMeasure}</td>
                      <td className="px-3 py-2 text-right">{row.openingBalance}</td>
                      <td className="px-3 py-2 text-right text-success-700 font-medium">+{row.receipts}</td>
                      <td className="px-3 py-2 text-right text-danger-700 font-medium">-{row.issues}</td>
                      <td className="px-3 py-2 text-right font-semibold">{row.closingBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Export */}
      {step === 2 && (
        <div className="space-y-4">
          <FormField label={t('warehouse.turnoverWizard.fieldExportFormat')}>
            <Select options={exportFormatOptions} value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} />
          </FormField>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>{t('warehouse.turnoverWizard.summaryWarehouse')}:</strong> {warehouseOptions.find((o) => o.value === warehouseId)?.label}</p>
            <p><strong>{t('warehouse.turnoverWizard.summaryPeriod')}:</strong> {startDate} - {endDate}</p>
            <p><strong>{t('warehouse.turnoverWizard.summaryGroupBy')}:</strong> {groupByOptions.find((o) => o.value === groupBy)?.label}</p>
            <p><strong>{t('warehouse.turnoverWizard.summaryPositions')}:</strong> {turnoverRows.length}</p>
            <p><strong>{t('warehouse.turnoverWizard.summaryFormat')}:</strong> {exportFormatOptions.find((o) => o.value === exportFormat)?.label}</p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('warehouse.turnoverWizard.infoExportReady')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
