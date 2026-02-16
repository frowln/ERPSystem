import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { formatMoney } from '@/lib/format';
import { russianDocsApi } from '@/api/russianDocs';
import { t } from '@/i18n';

interface Ks2LineForm {
  workName: string;
  unitOfMeasure: string;
  quantity: string;
  unitPrice: string;
}

const getProjectOptions = () => [
  { value: '1', label: t('russianDocs.projectSolnechny') },
  { value: '3', label: t('russianDocs.projectBridge') },
  { value: '6', label: t('russianDocs.projectMall') },
];

const getContractOptions = () => [
  { value: 'c1', label: t('russianDocs.contractGP') },
  { value: 'c2', label: t('russianDocs.contractSubcontract') },
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
        title={t('russianDocs.ks2Title')}
        subtitle={t('russianDocs.ks2Subtitle')}
        breadcrumbs={[
          { label: t('russianDocs.breadcrumbHome'), href: '/' },
          { label: t('russianDocs.breadcrumbExecDocs'), href: '/russian-docs' },
          { label: t('russianDocs.breadcrumbNewKs2') },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/russian-docs')}>
            {t('russianDocs.back')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6 mb-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('russianDocs.ks2Requisites')}</h3>

          <FormField label={t('russianDocs.ks2NameLabel')} required>
            <Input placeholder={t('russianDocs.ks2NamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('russianDocs.project')} required>
              <Select options={getProjectOptions()} value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder={t('russianDocs.ks2SelectProject')} />
            </FormField>
            <FormField label={t('russianDocs.contract')} required>
              <Select options={getContractOptions()} value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder={t('russianDocs.ks2SelectContract')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={t('russianDocs.ks2ActDate')} required>
              <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
            </FormField>
            <FormField label={t('russianDocs.ks2PeriodFrom')} required>
              <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
            </FormField>
            <FormField label={t('russianDocs.ks2PeriodTo')} required>
              <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('russianDocs.customer')} required>
              <Input placeholder={t('russianDocs.ks2CustomerPlaceholder')} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </FormField>
            <FormField label={t('russianDocs.contractor')} required>
              <Input placeholder={t('russianDocs.ks2ContractorPlaceholder')} value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('russianDocs.ks2WorkTypes')}</h3>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addLine}>
              {t('russianDocs.addRow')}
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-12 sm:col-span-4">
                  <FormField label={index === 0 ? t('russianDocs.ks2WorkNameLabel') : undefined}>
                    <Input
                      placeholder={t('russianDocs.ks2WorkNamePlaceholder')}
                      value={line.workName}
                      onChange={(e) => updateLine(index, 'workName', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <FormField label={index === 0 ? t('russianDocs.ks2UnitLabel') : undefined}>
                    <Select options={unitOptions} value={line.unitOfMeasure} onChange={(e) => updateLine(index, 'unitOfMeasure', e.target.value)} />
                  </FormField>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <FormField label={index === 0 ? t('russianDocs.ks2QuantityLabel') : undefined}>
                    <Input type="number" placeholder="0" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} />
                  </FormField>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <FormField label={index === 0 ? t('russianDocs.ks2PriceLabel') : undefined}>
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
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('russianDocs.ks2TotalNoVat')}</span>
              <span className="text-sm font-medium tabular-nums w-36 text-right">{formatMoney(totalAmount)}</span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('russianDocs.ks2Vat20')}</span>
              <span className="text-sm font-medium tabular-nums w-36 text-right">{formatMoney(vatAmount)}</span>
            </div>
            <div className="flex justify-end gap-8 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('russianDocs.ks2TotalWithVat')}</span>
              <span className="text-sm font-semibold tabular-nums w-36 text-right">{formatMoney(totalWithVat)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/russian-docs')}>{t('russianDocs.cancel')}</Button>
          <Button type="submit" iconLeft={<Save size={16} />} disabled={!name || !projectId || !contractId || lines.every((l) => !l.workName)}>
            {t('russianDocs.ks2Submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormKs2Page;
