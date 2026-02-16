import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { formatMoney } from '@/lib/format';
import { russianDocsApi } from '@/api/russianDocs';

interface Ks2LineForm {
  workName: string;
  unitOfMeasure: string;
  quantity: string;
  unitPrice: string;
}

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const contractOptions = [
  { value: 'c1', label: 'Договор ГП №12-2025' },
  { value: 'c2', label: 'Договор субподряда №45-2025' },
];

const unitOptions = [
  { value: 'м3', label: 'м3' },
  { value: 'м2', label: 'м2' },
  { value: 'м.п.', label: 'м.п.' },
  { value: 'т', label: 'т' },
  { value: 'кг', label: 'кг' },
  { value: 'шт', label: 'шт' },
  { value: 'компл', label: 'компл' },
];

const emptyLine: Ks2LineForm = { workName: '', unitOfMeasure: 'м3', quantity: '', unitPrice: '' };

const FormKs2Page: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createKs2Mutation = useMutation({
    mutationFn: russianDocsApi.createKs2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['russian-docs'] });
      navigate('/russian-docs');
    },
  });

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [contractId, setContractId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [lines, setLines] = useState<Ks2LineForm[]>([{ ...emptyLine }]);

  const addLine = () => setLines([...lines, { ...emptyLine }]);

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof Ks2LineForm, value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const lineAmount = (line: Ks2LineForm) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    return qty * price;
  };

  const totalAmount = lines.reduce((sum, line) => sum + lineAmount(line), 0);
  const vatAmount = totalAmount * 0.2;
  const totalWithVat = totalAmount + vatAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name, projectId, contractId, documentDate, periodFrom, periodTo,
      customerName, contractorName,
      lines: lines.map((l) => ({
        workName: l.workName,
        unitOfMeasure: l.unitOfMeasure,
        quantity: parseFloat(l.quantity) || 0,
        unitPrice: parseFloat(l.unitPrice) || 0,
        amount: lineAmount(l),
      })),
    };
    createKs2Mutation.mutate(payload as any);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Новый акт КС-2"
        subtitle="Акт о приёмке выполненных работ (форма КС-2)"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Исп. документация', href: '/russian-docs' },
          { label: 'Новый КС-2' },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/russian-docs')}>
            Назад
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6 mb-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Реквизиты акта</h3>

          <FormField label="Наименование акта" required>
            <Input placeholder="Акт выполненных работ за..." value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Проект" required>
              <Select options={projectOptions} value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Выберите проект" />
            </FormField>
            <FormField label="Договор" required>
              <Select options={contractOptions} value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Выберите договор" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Дата акта" required>
              <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
            </FormField>
            <FormField label="Период с" required>
              <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
            </FormField>
            <FormField label="Период по" required>
              <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Заказчик" required>
              <Input placeholder="ООО &quot;...&quot;" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </FormField>
            <FormField label="Подрядчик" required>
              <Input placeholder="ООО &quot;...&quot;" value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Виды работ</h3>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addLine}>
              Добавить строку
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-12 sm:col-span-4">
                  <FormField label={index === 0 ? 'Наименование работ' : undefined}>
                    <Input
                      placeholder="Описание работ"
                      value={line.workName}
                      onChange={(e) => updateLine(index, 'workName', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <FormField label={index === 0 ? 'Ед. изм.' : undefined}>
                    <Select options={unitOptions} value={line.unitOfMeasure} onChange={(e) => updateLine(index, 'unitOfMeasure', e.target.value)} />
                  </FormField>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <FormField label={index === 0 ? 'Количество' : undefined}>
                    <Input type="number" placeholder="0" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} />
                  </FormField>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <FormField label={index === 0 ? 'Цена, руб.' : undefined}>
                    <Input type="number" placeholder="0.00" value={line.unitPrice} onChange={(e) => updateLine(index, 'unitPrice', e.target.value)} />
                  </FormField>
                </div>
                <div className="col-span-10 sm:col-span-1 flex items-center justify-end">
                  <span className="text-sm font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
                    {formatMoney(lineAmount(line))}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="p-1.5 text-neutral-400 hover:text-danger-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex justify-end gap-8">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Итого без НДС:</span>
              <span className="text-sm font-medium tabular-nums w-36 text-right">{formatMoney(totalAmount)}</span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">НДС (20%):</span>
              <span className="text-sm font-medium tabular-nums w-36 text-right">{formatMoney(vatAmount)}</span>
            </div>
            <div className="flex justify-end gap-8 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Итого с НДС:</span>
              <span className="text-sm font-semibold tabular-nums w-36 text-right">{formatMoney(totalWithVat)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/russian-docs')}>Отмена</Button>
          <Button type="submit" iconLeft={<Save size={16} />} disabled={!name || !projectId || !contractId || lines.every((l) => !l.workName)}>
            Создать акт КС-2
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormKs2Page;
