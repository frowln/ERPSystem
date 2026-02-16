import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { russianDocsApi } from '@/api/russianDocs';

const documentTypeOptions = [
  { value: 'KS2', label: 'КС-2 (Акт выполненных работ)' },
  { value: 'KS3', label: 'КС-3 (Справка о стоимости)' },
  { value: 'M29', label: 'М-29 (Отчёт о расходе материалов)' },
  { value: 'EXECUTIVE_SCHEME', label: 'Исполнительная схема' },
  { value: 'HIDDEN_WORKS_ACT', label: 'Акт освидетельствования скрытых работ' },
  { value: 'GENERAL_JOURNAL', label: 'Общий журнал работ' },
  { value: 'COMMISSIONING_ACT', label: 'Акт ввода в эксплуатацию' },
  { value: 'PASSPORT', label: 'Паспорт объекта' },
  { value: 'PROTOCOL', label: 'Протокол испытаний' },
];

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const contractOptions = [
  { value: 'c1', label: 'Договор ГП №12-2025' },
  { value: 'c2', label: 'Договор субподряда №45-2025' },
  { value: 'c3', label: 'Договор поставки №88-2025' },
];

const DocumentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [projectId, setProjectId] = useState('');
  const [contractId, setContractId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: russianDocsApi.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['russian-docs'] });
      navigate('/russian-docs');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name, documentType: documentType as any, projectId, contractId, documentDate,
      periodFrom, periodTo, customerName, contractorName, notes,
    } as any);
  };

  const needsPeriod = ['KS2', 'KS3', 'M29'].includes(documentType);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Новый документ"
        subtitle="Создание документа исполнительной документации"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Исп. документация', href: '/russian-docs' },
          { label: 'Новый документ' },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/russian-docs')}>
            Назад
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Основные данные</h3>

          <FormField label="Тип документа" required>
            <Select
              options={documentTypeOptions}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="Выберите тип документа"
            />
          </FormField>

          <FormField label="Наименование" required>
            <Input
              placeholder="Например: Акт выполненных работ за февраль 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Проект" required>
              <Select
                options={projectOptions}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Выберите проект"
              />
            </FormField>
            <FormField label="Договор">
              <Select
                options={contractOptions}
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder="Выберите договор"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Дата документа" required>
              <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
            </FormField>
            {needsPeriod && (
              <>
                <FormField label="Период с">
                  <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
                </FormField>
                <FormField label="Период по">
                  <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
                </FormField>
              </>
            )}
          </div>

          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 pt-4 border-t border-neutral-200 dark:border-neutral-700">Стороны</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Заказчик" required>
              <Input
                placeholder="Наименование заказчика"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </FormField>
            <FormField label="Подрядчик" required>
              <Input
                placeholder="Наименование подрядчика"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Примечания">
            <Textarea
              placeholder="Дополнительная информация..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate('/russian-docs')}>
            Отмена
          </Button>
          <Button type="submit" iconLeft={<Save size={16} />} disabled={!name || !documentType || !projectId}>
            Создать документ
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentCreatePage;
