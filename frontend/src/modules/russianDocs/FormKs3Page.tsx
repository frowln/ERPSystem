import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { formatMoney, formatDate } from '@/lib/format';
import { russianDocsApi } from '@/api/russianDocs';
import type { RussianDocument } from './types';

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const contractOptions = [
  { value: 'c1', label: 'Договор ГП №12-2025' },
  { value: 'c2', label: 'Договор субподряда №45-2025' },
];

interface AvailableKs2 {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  totalWithVat: number;
  selected: boolean;
}

const FormKs3Page: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createKs3Mutation = useMutation({
    mutationFn: russianDocsApi.createKs3,
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
  const { data: ks2DocsData } = useQuery({
    queryKey: ['ks2-documents-for-ks3'],
    queryFn: () => russianDocsApi.getDocuments({ documentType: 'KS2' }),
  });

  const [ks2List, setKs2List] = useState<AvailableKs2[]>([]);

  useEffect(() => {
    const docs = ks2DocsData?.content ?? [];
    setKs2List(
      docs.map((d: RussianDocument) => ({
        id: d.id,
        number: d.number,
        name: d.name,
        documentDate: d.documentDate,
        totalWithVat: d.totalWithVat,
        selected: false,
      })),
    );
  }, [ks2DocsData]);

  const toggleKs2 = (id: string) => {
    setKs2List(ks2List.map((k) => k.id === id ? { ...k, selected: !k.selected } : k));
  };

  const selectedKs2 = ks2List.filter((k) => k.selected);
  const worksTotal = useMemo(() => selectedKs2.reduce((sum, k) => sum + k.totalWithVat, 0), [selectedKs2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name, projectId, contractId, documentDate, periodFrom, periodTo,
      customerName, contractorName,
      ks2DocumentIds: selectedKs2.map((k) => k.id),
    };
    createKs3Mutation.mutate(payload as any);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Новая справка КС-3"
        subtitle="Справка о стоимости выполненных работ и затрат (форма КС-3)"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Исп. документация', href: '/russian-docs' },
          { label: 'Новая КС-3' },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/russian-docs')}>
            Назад
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6 mb-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Реквизиты справки</h3>

          <FormField label="Наименование" required>
            <Input placeholder="Справка о стоимости за..." value={name} onChange={(e) => setName(e.target.value)} />
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
            <FormField label="Дата справки" required>
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

        {/* KS-2 selection */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Акты КС-2 для включения в справку</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Выберите акты КС-2 за отчётный период, которые войдут в данную справку КС-3.
          </p>

          <div className="space-y-3">
            {ks2List.map((ks2) => (
              <label
                key={ks2.id}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  ks2.selected
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ks2.selected}
                  onChange={() => toggleKs2(ks2.id)}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                />
                <FileText size={18} className="text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{ks2.number} — {ks2.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Дата: {formatDate(ks2.documentDate)}</p>
                </div>
                <span className="text-sm font-medium tabular-nums text-neutral-700 dark:text-neutral-300 flex-shrink-0">
                  {formatMoney(ks2.totalWithVat)}
                </span>
              </label>
            ))}
          </div>

          {selectedKs2.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Выбрано актов: <strong>{selectedKs2.length}</strong>
              </span>
              <div className="text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Итого стоимость работ</p>
                <p className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatMoney(worksTotal)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/russian-docs')}>Отмена</Button>
          <Button type="submit" iconLeft={<Save size={16} />} disabled={!name || !projectId || !contractId || selectedKs2.length === 0}>
            Создать справку КС-3
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormKs3Page;
