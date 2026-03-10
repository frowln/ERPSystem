import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { russianDocsApi } from '@/api/russianDocs';
import { useProjectOptions, useContractOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

const getDocumentTypeOptions = () => [
  { value: 'KS2', label: t('russianDocs.docTypeKs2Full') },
  { value: 'KS3', label: t('russianDocs.docTypeKs3Full') },
  { value: 'M29', label: t('russianDocs.docTypeM29Full') },
  { value: 'EXECUTIVE_SCHEME', label: t('russianDocs.docTypeExecScheme') },
  { value: 'HIDDEN_WORKS_ACT', label: t('russianDocs.docTypeHiddenWorksAct') },
  { value: 'GENERAL_JOURNAL', label: t('russianDocs.docTypeGeneralJournal') },
  { value: 'COMMISSIONING_ACT', label: t('russianDocs.docTypeCommissioningAct') },
  { value: 'PASSPORT', label: t('russianDocs.docTypePassport') },
  { value: 'PROTOCOL', label: t('russianDocs.docTypeProtocol') },
];

const DocumentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();
  const { options: contractOptions } = useContractOptions();
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
    onError: () => {
      toast.error(t('common.operationError'));
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
        title={t('russianDocs.docCreateTitle')}
        subtitle={t('russianDocs.docCreateSubtitle')}
        breadcrumbs={[
          { label: t('russianDocs.breadcrumbHome'), href: '/' },
          { label: t('russianDocs.breadcrumbExecDocs'), href: '/russian-docs' },
          { label: t('russianDocs.breadcrumbNewDocument') },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/russian-docs')}>
            {t('russianDocs.back')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('russianDocs.docCreateMainData')}</h3>

          <FormField label={t('russianDocs.docCreateDocType')} required>
            <Select
              options={getDocumentTypeOptions()}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder={t('russianDocs.docCreateSelectDocType')}
            />
          </FormField>

          <FormField label={t('russianDocs.nameLabel')} required>
            <Input
              placeholder={t('russianDocs.docCreateNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('russianDocs.project')} required>
              <Select
                options={projectOptions}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder={t('russianDocs.docCreateSelectProject')}
              />
            </FormField>
            <FormField label={t('russianDocs.contract')}>
              <Select
                options={contractOptions}
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder={t('russianDocs.docCreateSelectContract')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={t('russianDocs.docCreateDocDate')} required>
              <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
            </FormField>
            {needsPeriod && (
              <>
                <FormField label={t('russianDocs.docCreatePeriodFrom')}>
                  <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
                </FormField>
                <FormField label={t('russianDocs.docCreatePeriodTo')}>
                  <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
                </FormField>
              </>
            )}
          </div>

          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 pt-4 border-t border-neutral-200 dark:border-neutral-700">{t('russianDocs.docCreateParties')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('russianDocs.customer')} required>
              <Input
                placeholder={t('russianDocs.docCreateCustomerPlaceholder')}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </FormField>
            <FormField label={t('russianDocs.contractor')} required>
              <Input
                placeholder={t('russianDocs.docCreateContractorPlaceholder')}
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label={t('russianDocs.docCreateNotes')}>
            <Textarea
              placeholder={t('russianDocs.docCreateNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate('/russian-docs')}>
            {t('russianDocs.cancel')}
          </Button>
          <Button type="submit" iconLeft={<Save size={16} />} disabled={!name || !documentType || !projectId}>
            {t('russianDocs.docCreateSubmit')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentCreatePage;
