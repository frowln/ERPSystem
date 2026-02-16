import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Select } from '@/design-system/components/FormField';
import toast from 'react-hot-toast';

interface EstimateImportWizardProps {
  open: boolean;
  onClose: () => void;
}

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
  { value: 'arps', label: 'АРПС (Гранд-Смета)' },
  { value: 'xml', label: 'XML (смета)' },
];

interface ColumnMapping {
  fileColumn: string;
  systemField: string;
}

const systemFields = [
  { value: '', label: '-- Пропустить --' },
  { value: 'code', label: 'Шифр расценки' },
  { value: 'name', label: 'Наименование работ' },
  { value: 'unit', label: 'Единица измерения' },
  { value: 'quantity', label: 'Количество' },
  { value: 'unit_price', label: 'Цена за единицу' },
  { value: 'total', label: 'Сумма' },
  { value: 'labor_cost', label: 'Затраты труда (чел-ч)' },
  { value: 'materials_cost', label: 'Стоимость материалов' },
  { value: 'machines_cost', label: 'Стоимость машин' },
  { value: 'section', label: 'Раздел сметы' },
];
interface PreviewRow {
  code: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
}

const STEPS = ['Загрузка файла', 'Сопоставление колонок', 'Предпросмотр', 'Импорт'] as const;

export const EstimateImportWizard: React.FC<EstimateImportWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState('xlsx');
  const [fileName, setFileName] = useState('');
  const [mappings, setMappings] = useState<ColumnMapping[]>(
    ([] as any[]).map((col) => ({ fileColumn: col, systemField: '' }))
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
  const totalImportAmount = ([] as any[]).reduce((sum, r) => sum + r.total, 0);

  const handleFinish = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(`Смета импортирована: ${0} позиций`);
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setFormat('xlsx');
    setFileName('');
    setMappings(([] as any[]).map((col) => ({ fileColumn: col, systemField: '' })));
    onClose();
  };

  const canNext =
    step === 0 ? fileName !== '' : step === 1 ? mappedCount >= 2 : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Импорт сметы"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? 'Отмена' : 'Назад'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Далее
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              Импортировать
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

      {/* Step 1: Upload file */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label="Формат файла" required>
            <Select options={formatOptions} value={format} onChange={(e) => setFormat(e.target.value)} />
          </FormField>
          <FormField label="Файл сметы" required>
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
                    <p className="text-xs text-neutral-400 mt-1">Нажмите для замены</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-neutral-600">Нажмите или перетащите файл сюда</p>
                    <p className="text-xs text-neutral-400 mt-1">Поддерживаются: XLSX, CSV, АРПС, XML</p>
                  </div>
                )}
              </label>
            </div>
          </FormField>
          {format === 'arps' && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-800">
                Формат АРПС будет автоматически распознан. Сопоставление колонок не потребуется.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Map columns */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Сопоставьте колонки файла с полями системы. Сопоставлено: {mappedCount} из {0}.
          </p>
          <div className="space-y-2">
            {mappings.map((mapping, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                <span className="text-sm font-medium w-28 shrink-0">{mapping.fileColumn}</span>
                <span className="text-neutral-400">→</span>
                <Select
                  options={systemFields}
                  value={mapping.systemField}
                  onChange={(e) => updateMapping(idx, e.target.value)}
                  placeholder="Выберите поле"
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
            Предварительный просмотр импортируемых данных ({0} позиций):
          </p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">Шифр</th>
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">Наименование</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">Ед.</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">Кол-во</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">Цена</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {([] as any[]).map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100">
                    <td className="px-3 py-2 text-xs text-primary-700 font-mono">{row.code}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-right">{row.unit}</td>
                    <td className="px-3 py-2 text-right">{row.qty}</td>
                    <td className="px-3 py-2 text-right">{row.price.toLocaleString('ru-RU')}</td>
                    <td className="px-3 py-2 text-right font-medium">{row.total.toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 dark:bg-neutral-800">
                  <td colSpan={5} className="px-3 py-2 font-semibold text-right">Итого:</td>
                  <td className="px-3 py-2 text-right font-bold">{totalImportAmount.toLocaleString('ru-RU')} ₽</td>
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
            <p><strong>Файл:</strong> {fileName}</p>
            <p><strong>Формат:</strong> {formatOptions.find((f) => f.value === format)?.label}</p>
            <p><strong>Позиций:</strong> {0}</p>
            <p><strong>Сопоставлено колонок:</strong> {mappedCount}</p>
            <p><strong>Общая сумма:</strong> {totalImportAmount.toLocaleString('ru-RU')} ₽</p>
          </div>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-800">
              Данные будут импортированы в новую смету. Проверьте корректность данных перед подтверждением.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
