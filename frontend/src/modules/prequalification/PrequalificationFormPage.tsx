import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { prequalificationsApi, type CreatePrequalificationRequest } from '@/api/prequalifications';
import { Save, ArrowLeft, Shield, ShieldCheck, ShieldX, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { sroApi, type SroVerificationResult } from '@/api/sro';

interface PrequalificationForm {
  companyName: string;
  inn: string;
  workType: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  // Financial stability
  annualRevenue: number;
  yearsInBusiness: number;
  hasNoDebts: boolean;
  hasCreditLine: boolean;
  // Experience
  similarProjectsCount: number;
  maxProjectValue: number;
  hasReferences: boolean;
  // Licenses & certifications
  hasSroMembership: boolean;
  sroNumber: string;
  hasIsoCertification: boolean;
  hasSafetyCertification: boolean;
  // Safety
  ltir: number;
  hasSafetyPlan: boolean;
  noFatalIncidents3y: boolean;
  // Insurance
  hasLiabilityInsurance: boolean;
  insuranceCoverage: number;
  canProvideBankGuarantee: boolean;
  // Resources
  employeeCount: number;
  hasOwnEquipment: boolean;
  hasOwnTransport: boolean;
  notes: string;
}

const WORK_TYPES = [
  { value: '', label: t('prequalification.form.selectWorkType') },
  { value: 'GENERAL', label: t('prequalification.form.workTypeGeneral') },
  { value: 'CONCRETE', label: t('prequalification.form.workTypeConcrete') },
  { value: 'STEEL', label: t('prequalification.form.workTypeSteel') },
  { value: 'ELECTRICAL', label: t('prequalification.form.workTypeElectrical') },
  { value: 'PLUMBING', label: t('prequalification.form.workTypePlumbing') },
  { value: 'HVAC', label: t('prequalification.form.workTypeHvac') },
  { value: 'FACADE', label: t('prequalification.form.workTypeFacade') },
  { value: 'ROOFING', label: t('prequalification.form.workTypeRoofing') },
  { value: 'LANDSCAPING', label: t('prequalification.form.workTypeLandscaping') },
  { value: 'OTHER', label: t('prequalification.form.workTypeOther') },
];

const initialForm: PrequalificationForm = {
  companyName: '',
  inn: '',
  workType: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  annualRevenue: 0,
  yearsInBusiness: 0,
  hasNoDebts: false,
  hasCreditLine: false,
  similarProjectsCount: 0,
  maxProjectValue: 0,
  hasReferences: false,
  hasSroMembership: false,
  sroNumber: '',
  hasIsoCertification: false,
  hasSafetyCertification: false,
  ltir: 0,
  hasSafetyPlan: false,
  noFatalIncidents3y: false,
  hasLiabilityInsurance: false,
  insuranceCoverage: 0,
  canProvideBankGuarantee: false,
  employeeCount: 0,
  hasOwnEquipment: false,
  hasOwnTransport: false,
  notes: '',
};

const BoolField: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
    />
    <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
    {value ? (
      <CheckCircle2 size={16} className="ml-auto text-success-500 shrink-0" />
    ) : (
      <XCircle size={16} className="ml-auto text-neutral-300 dark:text-neutral-600 shrink-0" />
    )}
  </label>
);

const PrequalificationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PrequalificationForm>(initialForm);
  const [sroResult, setSroResult] = useState<SroVerificationResult | null>(null);

  const sroMutation = useMutation({
    mutationFn: (inn: string) => sroApi.verifySro(inn),
    onSuccess: (data) => {
      setSroResult(data);
      if (data.isMember && data.status === 'ACTIVE') {
        setForm(prev => ({
          ...prev,
          hasSroMembership: true,
          sroNumber: data.certificateNumber || prev.sroNumber,
        }));
      }
    },
    onError: () => {
      toast.error(t('procurement.prequalification.sro.error'));
    },
  });

  const handleVerifySro = () => {
    if (form.inn.trim().length > 0) {
      sroMutation.mutate(form.inn.trim());
    }
  };

  const { data: existing } = useQuery({
    queryKey: ['prequalification', id],
    queryFn: () => prequalificationsApi.getById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        companyName: existing.companyName ?? '',
        inn: existing.inn ?? '',
        workType: existing.workType ?? '',
        contactPerson: existing.contactPerson ?? '',
        contactPhone: existing.contactPhone ?? '',
        contactEmail: existing.contactEmail ?? '',
        annualRevenue: existing.annualRevenue ?? 0,
        yearsInBusiness: existing.yearsInBusiness ?? 0,
        hasNoDebts: (existing as any).hasNoDebts ?? false,
        hasCreditLine: (existing as any).hasCreditLine ?? false,
        similarProjectsCount: (existing as any).similarProjectsCount ?? 0,
        maxProjectValue: (existing as any).maxProjectValue ?? 0,
        hasReferences: (existing as any).hasReferences ?? false,
        hasSroMembership: existing.hasSroMembership ?? false,
        sroNumber: existing.sroNumber ?? '',
        hasIsoCertification: (existing as any).hasIsoCertification ?? false,
        hasSafetyCertification: (existing as any).hasSafetyCertification ?? false,
        ltir: (existing as any).ltir ?? 0,
        hasSafetyPlan: (existing as any).hasSafetyPlan ?? false,
        noFatalIncidents3y: (existing as any).noFatalIncidents3y ?? false,
        hasLiabilityInsurance: (existing as any).hasLiabilityInsurance ?? false,
        insuranceCoverage: (existing as any).insuranceCoverage ?? 0,
        canProvideBankGuarantee: (existing as any).canProvideBankGuarantee ?? false,
        employeeCount: existing.employeeCount ?? 0,
        hasOwnEquipment: (existing as any).hasOwnEquipment ?? false,
        hasOwnTransport: (existing as any).hasOwnTransport ?? false,
        notes: existing.notes ?? '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: CreatePrequalificationRequest = {
        companyName: form.companyName,
        inn: form.inn || undefined,
        contactPerson: form.contactPerson || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        workType: form.workType || undefined,
        annualRevenue: form.annualRevenue || undefined,
        yearsInBusiness: form.yearsInBusiness || undefined,
        hasNoDebts: form.hasNoDebts,
        hasCreditLine: form.hasCreditLine,
        similarProjectsCount: form.similarProjectsCount || undefined,
        maxProjectValue: form.maxProjectValue || undefined,
        hasReferences: form.hasReferences,
        hasSroMembership: form.hasSroMembership,
        sroNumber: form.sroNumber || undefined,
        hasIsoCertification: form.hasIsoCertification,
        hasSafetyCertification: form.hasSafetyCertification,
        ltir: form.ltir || undefined,
        hasSafetyPlan: form.hasSafetyPlan,
        noFatalIncidents3y: form.noFatalIncidents3y,
        hasLiabilityInsurance: form.hasLiabilityInsurance,
        insuranceCoverage: form.insuranceCoverage || undefined,
        canProvideBankGuarantee: form.canProvideBankGuarantee,
        employeeCount: form.employeeCount || undefined,
        hasOwnEquipment: form.hasOwnEquipment,
        hasOwnTransport: form.hasOwnTransport,
        notes: form.notes || undefined,
      };
      if (isEdit) {
        return prequalificationsApi.update(id!, payload);
      }
      return prequalificationsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prequalifications'] });
      toast.success(isEdit ? t('prequalification.form.toastUpdated') : t('prequalification.form.toastCreated'));
      navigate('/prequalifications');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast.error(t('prequalification.form.toastCompanyRequired'));
      return;
    }
    mutation.mutate();
  };

  const update = <K extends keyof PrequalificationForm>(key: K, value: PrequalificationForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('prequalification.form.editTitle') : t('prequalification.form.createTitle')}
        subtitle={t('prequalification.form.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('prequalification.title'), href: '/prequalifications' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Company info */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionCompany')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('prequalification.form.labelCompanyName')} required>
              <Input value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder={t('prequalification.form.placeholderCompanyName')} />
            </FormField>
            <FormField label={t('prequalification.form.labelInn')}>
              <div className="flex gap-2">
                <Input
                  value={form.inn}
                  onChange={e => {
                    update('inn', e.target.value);
                    if (sroResult) setSroResult(null);
                  }}
                  placeholder="7701234567"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  iconLeft={
                    sroMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Shield size={14} />
                    )
                  }
                  onClick={handleVerifySro}
                  disabled={sroMutation.isPending || !form.inn.trim()}
                >
                  {sroMutation.isPending
                    ? t('procurement.prequalification.sro.verifying')
                    : t('procurement.prequalification.sro.verify')}
                </Button>
              </div>
            </FormField>
            <FormField label={t('prequalification.form.labelWorkType')}>
              <Select value={form.workType} onChange={e => update('workType', e.target.value)} options={WORK_TYPES} />
            </FormField>
            <FormField label={t('prequalification.form.labelContactPerson')}>
              <Input value={form.contactPerson} onChange={e => update('contactPerson', e.target.value)} />
            </FormField>
            <FormField label={t('prequalification.form.labelPhone')}>
              <Input value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} placeholder="+7 (999) 123-45-67" />
            </FormField>
            <FormField label={t('prequalification.form.labelEmail')}>
              <Input value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder="info@company.ru" />
            </FormField>
          </div>

          {/* SRO inline result */}
          {sroResult && (
            <div
              className={cn(
                'mt-4 p-3 rounded-lg border flex items-start gap-3',
                sroResult.isMember && sroResult.status === 'ACTIVE'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              )}
            >
              {sroResult.isMember && sroResult.status === 'ACTIVE' ? (
                <ShieldCheck size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldX size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    sroResult.isMember && sroResult.status === 'ACTIVE'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300',
                  )}
                >
                  {sroResult.isMember
                    ? `${t('procurement.prequalification.sro.member')} — ${sroResult.sroName}`
                    : t('procurement.prequalification.sro.notMember')}
                </p>
                {sroResult.isMember && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    {t('procurement.prequalification.sro.certificateNumber')}: {sroResult.certificateNumber}
                    {' | '}
                    {t('procurement.prequalification.sro.competencyLevel')}: {sroResult.competencyLevel}
                    {' | '}
                    {t('procurement.prequalification.sro.status')}: {t(`procurement.prequalification.sro.${sroResult.status === 'NOT_FOUND' ? 'notFound' : sroResult.status.toLowerCase() as 'active' | 'suspended' | 'excluded'}`)}
                  </p>
                )}
                {!sroResult.isMember && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {t('procurement.prequalification.sro.warning')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Company details */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionDetails')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('prequalification.form.labelAnnualRevenue')}>
              <Input type="number" value={form.annualRevenue} onChange={e => update('annualRevenue', Number(e.target.value))} />
            </FormField>
            <FormField label={t('prequalification.form.labelEmployeeCount')}>
              <Input type="number" value={form.employeeCount} onChange={e => update('employeeCount', Number(e.target.value))} />
            </FormField>
            <FormField label={t('prequalification.form.labelYearsInBusiness')}>
              <Input type="number" value={form.yearsInBusiness} onChange={e => update('yearsInBusiness', Number(e.target.value))} />
            </FormField>
            <FormField label={t('prequalification.form.labelSimilarProjectsCount')}>
              <Input type="number" value={form.similarProjectsCount} onChange={e => update('similarProjectsCount', Number(e.target.value))} />
            </FormField>
            <FormField label={t('prequalification.form.labelMaxProjectValue')}>
              <Input type="number" value={form.maxProjectValue} onChange={e => update('maxProjectValue', Number(e.target.value))} />
            </FormField>
            <FormField label={t('prequalification.form.labelInsuranceCoverage')}>
              <Input type="number" value={form.insuranceCoverage} onChange={e => update('insuranceCoverage', Number(e.target.value))} />
            </FormField>
            <FormField label={t('prequalification.form.labelLtir')}>
              <Input type="number" step="0.01" value={form.ltir} onChange={e => update('ltir', Number(e.target.value))} />
            </FormField>
          </div>
        </div>

        {/* Financial stability criteria */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionFinancial')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BoolField label={t('prequalification.form.hasNoDebts')} value={form.hasNoDebts} onChange={v => update('hasNoDebts', v)} />
            <BoolField label={t('prequalification.form.hasCreditLine')} value={form.hasCreditLine} onChange={v => update('hasCreditLine', v)} />
            <BoolField label={t('prequalification.form.hasReferences')} value={form.hasReferences} onChange={v => update('hasReferences', v)} />
          </div>
        </div>

        {/* Licenses & certifications */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionLicenses')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BoolField label={t('prequalification.form.hasSroMembership')} value={form.hasSroMembership} onChange={v => update('hasSroMembership', v)} />
            {form.hasSroMembership && (
              <FormField label={t('prequalification.form.labelSroNumber')}>
                <Input value={form.sroNumber} onChange={e => update('sroNumber', e.target.value)} placeholder="CPO-C-123-45678" />
              </FormField>
            )}
            <BoolField label={t('prequalification.form.hasIsoCertification')} value={form.hasIsoCertification} onChange={v => update('hasIsoCertification', v)} />
            <BoolField label={t('prequalification.form.hasSafetyCertification')} value={form.hasSafetyCertification} onChange={v => update('hasSafetyCertification', v)} />
          </div>
        </div>

        {/* Safety */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionSafety')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BoolField label={t('prequalification.form.hasSafetyPlan')} value={form.hasSafetyPlan} onChange={v => update('hasSafetyPlan', v)} />
            <BoolField label={t('prequalification.form.noFatalIncidents3y')} value={form.noFatalIncidents3y} onChange={v => update('noFatalIncidents3y', v)} />
            <BoolField label={t('prequalification.form.hasLiabilityInsurance')} value={form.hasLiabilityInsurance} onChange={v => update('hasLiabilityInsurance', v)} />
            <BoolField label={t('prequalification.form.canProvideBankGuarantee')} value={form.canProvideBankGuarantee} onChange={v => update('canProvideBankGuarantee', v)} />
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionResources')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BoolField label={t('prequalification.form.hasOwnEquipment')} value={form.hasOwnEquipment} onChange={v => update('hasOwnEquipment', v)} />
            <BoolField label={t('prequalification.form.hasOwnTransport')} value={form.hasOwnTransport} onChange={v => update('hasOwnTransport', v)} />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('prequalification.form.sectionNotes')}</h3>
          <Textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder={t('prequalification.form.placeholderNotes')}
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending} iconLeft={<Save size={16} />}>
            {isEdit ? t('common.save') : t('procurement.prequalification.createForm')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/prequalifications')} iconLeft={<ArrowLeft size={16} />}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PrequalificationFormPage;
