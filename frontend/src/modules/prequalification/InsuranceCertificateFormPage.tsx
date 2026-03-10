import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { insuranceApi } from '@/api/insurance';
import type { InsuranceCertificateType, InsuranceCertificateStatus } from '@/api/insurance';
import { t } from '@/i18n';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface CertificateForm {
  vendorName: string;
  certificateType: InsuranceCertificateType | '';
  policyNumber: string;
  insurerName: string;
  coverageAmount: string;
  deductible: string;
  effectiveDate: string;
  expiryDate: string;
  certificateHolder: string;
  status: InsuranceCertificateStatus;
  notes: string;
}

const initialForm: CertificateForm = {
  vendorName: '',
  certificateType: '',
  policyNumber: '',
  insurerName: '',
  coverageAmount: '',
  deductible: '',
  effectiveDate: '',
  expiryDate: '',
  certificateHolder: '',
  status: 'PENDING',
  notes: '',
};

const InsuranceCertificateFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CertificateForm>(initialForm);

  const { data: existing } = useQuery({
    queryKey: ['insurance-certificate', id],
    queryFn: () => insuranceApi.getCertificate(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        vendorName: existing.vendorName ?? '',
        certificateType: existing.certificateType ?? '',
        policyNumber: existing.policyNumber ?? '',
        insurerName: existing.insurerName ?? '',
        coverageAmount: existing.coverageAmount != null ? String(existing.coverageAmount) : '',
        deductible: existing.deductible != null ? String(existing.deductible) : '',
        effectiveDate: existing.effectiveDate ?? '',
        expiryDate: existing.expiryDate ?? '',
        certificateHolder: existing.certificateHolder ?? '',
        status: existing.status ?? 'PENDING',
        notes: existing.notes ?? '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vendorName: form.vendorName,
        certificateType: form.certificateType || undefined,
        policyNumber: form.policyNumber || undefined,
        insurerName: form.insurerName || undefined,
        coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : undefined,
        deductible: form.deductible ? Number(form.deductible) : undefined,
        effectiveDate: form.effectiveDate || undefined,
        expiryDate: form.expiryDate || undefined,
        certificateHolder: form.certificateHolder || undefined,
        status: form.status,
        notes: form.notes || undefined,
      };
      if (isEdit) {
        return insuranceApi.updateCertificate(id!, payload);
      }
      return insuranceApi.createCertificate(payload as Parameters<typeof insuranceApi.createCertificate>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificate', id] });
      toast.success(isEdit ? t('insurance.updated') : t('insurance.created'));
      navigate('/insurance-certificates');
    },
    onError: () => {
      toast.error(t('common.unknownError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorName.trim()) {
      toast.error(t('insurance.vendorNameRequired'));
      return;
    }
    if (!form.certificateType) {
      toast.error(t('insurance.certificateTypeRequired'));
      return;
    }
    mutation.mutate();
  };

  const update = <K extends keyof CertificateForm>(key: K, value: CertificateForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const certificateTypeOptions = [
    { value: '', label: t('insurance.selectType') },
    { value: 'GENERAL_LIABILITY', label: t('insurance.typeGeneralLiability') },
    { value: 'WORKERS_COMP', label: t('insurance.typeWorkersComp') },
    { value: 'AUTO', label: t('insurance.typeAuto') },
    { value: 'UMBRELLA', label: t('insurance.typeUmbrella') },
    { value: 'PROFESSIONAL', label: t('insurance.typeProfessional') },
    { value: 'BUILDERS_RISK', label: t('insurance.typeBuildersRisk') },
  ];

  const statusOptions = [
    { value: 'PENDING', label: t('insurance.statusPending') },
    { value: 'ACTIVE', label: t('insurance.statusActive') },
    { value: 'EXPIRING_SOON', label: t('insurance.statusExpiringSoon') },
    { value: 'EXPIRED', label: t('insurance.statusExpired') },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('insurance.editCertificate') : t('insurance.createCertificate')}
        subtitle={t('insurance.formSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('insurance.title'), href: '/insurance-certificates' },
          { label: isEdit ? t('insurance.editCertificate') : t('insurance.createCertificate') },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Vendor & Type */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('common.basicInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('insurance.vendorName')} required>
              <Input
                value={form.vendorName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('vendorName', e.target.value)}
                placeholder={t('insurance.vendorNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('insurance.certificateType')} required>
              <Select
                value={form.certificateType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('certificateType', e.target.value as InsuranceCertificateType)}
                options={certificateTypeOptions}
              />
            </FormField>
            <FormField label={t('insurance.policyNumber')}>
              <Input
                value={form.policyNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('policyNumber', e.target.value)}
                placeholder="POL-2025-001"
              />
            </FormField>
            <FormField label={t('insurance.insurerName')}>
              <Input
                value={form.insurerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('insurerName', e.target.value)}
                placeholder={t('insurance.insurerNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('insurance.certificateHolder')}>
              <Input
                value={form.certificateHolder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('certificateHolder', e.target.value)}
                placeholder={t('insurance.certificateHolderPlaceholder')}
              />
            </FormField>
            <FormField label={t('insurance.status')}>
              <Select
                value={form.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('status', e.target.value as InsuranceCertificateStatus)}
                options={statusOptions}
              />
            </FormField>
          </div>
        </div>

        {/* Coverage & Dates */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('insurance.coverageSection')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('insurance.coverageAmount')}>
              <Input
                type="number"
                value={form.coverageAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('coverageAmount', e.target.value)}
                placeholder="10 000 000"
              />
              {form.coverageAmount && Number(form.coverageAmount) > 0 && (
                <p className="mt-1 text-xs text-neutral-500">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(form.coverageAmount))}</p>
              )}
            </FormField>
            <FormField label={t('insurance.deductible')}>
              <Input
                type="number"
                value={form.deductible}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('deductible', e.target.value)}
                placeholder="100 000"
              />
              {form.deductible && Number(form.deductible) > 0 && (
                <p className="mt-1 text-xs text-neutral-500">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(form.deductible))}</p>
              )}
            </FormField>
            <FormField label={t('insurance.effectiveDate')}>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('effectiveDate', e.target.value)}
              />
            </FormField>
            <FormField label={t('insurance.expiryDate')}>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('expiryDate', e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('common.notes')}
          </h3>
          <Textarea
            value={form.notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('notes', e.target.value)}
            placeholder={t('insurance.notesPlaceholder')}
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending} iconLeft={<Save size={16} />}>
            {isEdit ? t('common.save') : t('insurance.createCertificate')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/insurance-certificates')} iconLeft={<ArrowLeft size={16} />}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InsuranceCertificateFormPage;
