import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Select } from '@/design-system/components/FormField';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';

interface EstimateImportWizardProps {
  open: boolean;
  onClose: () => void;
}

const getFormatOptions = () => [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
  { value: 'arps', label: t('estimates.import.formatArps') },
  { value: 'xml', label: t('estimates.import.formatXml') },
];

interface ColumnMapping {
  fileColumn: string;
  systemField: string;
}

const getSystemFields = () => [
  { value: '', label: t('estimates.import.fieldSkip') },
  { value: 'code', label: t('estimates.import.fieldCode') },
  { value: 'name', label: t('estimates.import.fieldWorkName') },
  { value: 'unit', label: t('estimates.import.fieldUnit') },
  { value: 'quantity', label: t('estimates.import.fieldQuantity') },
  { value: 'unit_price', label: t('estimates.import.fieldUnitPrice') },
  { value: 'total', label: t('estimates.import.fieldTotal') },
  { value: 'labor_cost', label: t('estimates.import.fieldLaborCost') },
  { value: 'materials_cost', label: t('estimates.import.fieldMaterialsCost') },
  { value: 'machines_cost', label: t('estimates.import.fieldMachinesCost') },
  { value: 'section', label: t('estimates.import.fieldSection') },
];
interface PreviewRow {
  code: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
}

const getSteps = () => [t('estimates.import.stepUpload'), t('estimates.import.stepMapping'), t('estimates.import.stepPreview'), t('estimates.import.stepImport')] as const;

export const EstimateImportWizard: React.FC<EstimateImportWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState('xlsx');
  const [fileName, setFileName] = useState('');
  const [mappings, setMappings] = useState<ColumnMapping[]>(
    ([] as string[]).map((col) => ({ fileColumn: col, systemField: '' }))
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const updateMapping = (index: number, field: string) => {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, systemField: field } : m)));
  };

  const mappedCount = mappings.filter((m) => m.systemField !== '').length;
  const totalImportAmount = ([] as Array<{ total: number }>).reduce((sum, r) => sum + r.total, 0);

  const handleFinish = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(t('estimates.import.toastSuccess', { count: '0' }));
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setFormat('xlsx');
    setFileName('');
    setMappings(([] as string[]).map((col) => ({ fileColumn: col, systemField: '' })));
    onClose();
  };

  const canNext =
    step === 0 ? fileName !== '' : step === 1 ? mappedCount >= 2 : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('estimates.import.title')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('common.cancel') : t('common.back')}
          </Button>
          {step < getSteps().length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('common.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('estimates.import.btnImport')}
            </Button>
          )}
        </>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {getSteps().map((label, i) => (
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
            {i < getSteps().length - 1 && <div className="w-8 h-px bg-neutral-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload file */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label={t('estimates.import.labelFormat')} required>
            <Select options={getFormatOptions()} value={format} onChange={(e) => setFormat(e.target.value)} />
          </FormField>
          <FormField label={t('estimates.import.labelFile')} required>
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.xml,.arps"
                onChange={handleFileChange}
                className="hidden"
                id="estimate-file"
              />
              <label htmlFor="estimate-file" className="cursor-pointer">
                {fileName ? (
                  <div>
                    <p className="text-sm text-primary-700 font-medium">{fileName}</p>
                    <p className="text-xs text-neutral-400 mt-1">{t('estimates.import.clickToReplace')}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-neutral-600">{t('estimates.import.dropzoneText')}</p>
                    <p className="text-xs text-neutral-400 mt-1">{t('estimates.import.supportedFormats')}</p>
                  </div>
                )}
              </label>
            </div>
          </FormField>
          {format === 'arps' && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-800">
                {t('estimates.import.arpsAutoHint')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Map columns */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('estimates.import.mappingHint', { mapped: String(mappedCount), total: '0' })}
          </p>
          <div className="space-y-2">
            {mappings.map((mapping, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                <span className="text-sm font-medium w-28 shrink-0">{mapping.fileColumn}</span>
                <span className="text-neutral-400">→</span>
                <Select
                  options={getSystemFields()}
                  value={mapping.systemField}
                  onChange={(e) => updateMapping(idx, e.target.value)}
                  placeholder={t('estimates.import.selectField')}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('estimates.import.previewHint', { count: '0' })}
          </p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('estimates.import.thCode')}</th>
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('estimates.import.thName')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('estimates.import.thUnit')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('estimates.import.thQty')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('estimates.import.thPrice')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('estimates.import.thTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {([] as Array<{ code: string; name: string; unit: string; qty: number; price: number; total: number }>).map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100">
                    <td className="px-3 py-2 text-xs text-primary-700 font-mono">{row.code}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-right">{row.unit}</td>
                    <td className="px-3 py-2 text-right">{row.qty}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(row.price)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatMoney(row.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 dark:bg-neutral-800">
                  <td colSpan={5} className="px-3 py-2 font-semibold text-right">{t('estimates.import.totalLabel')}</td>
                  <td className="px-3 py-2 text-right font-bold">{formatMoney(totalImportAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Step 4: Confirm import */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>{t('estimates.import.summaryFile')}:</strong> {fileName}</p>
            <p><strong>{t('estimates.import.summaryFormat')}:</strong> {getFormatOptions().find((f) => f.value === format)?.label}</p>
            <p><strong>{t('estimates.import.summaryItems')}:</strong> {0}</p>
            <p><strong>{t('estimates.import.summaryMapped')}:</strong> {mappedCount}</p>
            <p><strong>{t('estimates.import.summaryTotal')}:</strong> {formatMoney(totalImportAmount)}</p>
          </div>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-800">
              {t('estimates.import.confirmWarning')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
