import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { contractsApi } from '@/api/contracts';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';

interface ContractSignWizardProps {
  open: boolean;
  onClose: () => void;
  contractId?: string;
}

interface ContractSummary {
  number: string;
  title: string;
  contractor: string;
  contractorInn: string;
  amount: number;
  startDate: string;
  endDate: string;
  type: string;
  sections: number;
}
const signatoryRoles = [
  { value: 'director', label: t('contracts.sign.roleDirector') },
  { value: 'deputy', label: t('contracts.sign.roleDeputy') },
  { value: 'proxy', label: t('contracts.sign.roleProxy') },
];

const signMethods = [
  { value: 'scan', label: t('contracts.sign.methodScan') },
  { value: 'kep', label: t('contracts.sign.methodKep') },
];

const STEPS = [t('contracts.sign.stepInfo'), t('contracts.sign.stepSign'), t('contracts.sign.stepConfirm')];

export const ContractSignWizard: React.FC<ContractSignWizardProps> = ({ open, onClose, contractId }) => {
  const [step, setStep] = useState(0);
  const [signMethod, setSignMethod] = useState('scan');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryRole, setSignatoryRole] = useState('director');
  const [signDate, setSignDate] = useState('');
  const [proxyNumber, setProxyNumber] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: contractData } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractsApi.getContract(contractId!),
    enabled: !!contractId && open,
  });

  const contract: ContractSummary = contractData
    ? {
        number: (contractData as any).number ?? '',
        title: (contractData as any).title ?? '',
        contractor: (contractData as any).contractorName ?? '',
        contractorInn: (contractData as any).contractorInn ?? '',
        amount: (contractData as any).amount ?? 0,
        startDate: (contractData as any).startDate ?? '',
        endDate: (contractData as any).endDate ?? '',
        type: (contractData as any).type ?? '',
        sections: (contractData as any).sections ?? 0,
      }
    : { number: '', title: '', contractor: '', contractorInn: '', amount: 0, startDate: '', endDate: '', type: '', sections: 0 };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await contractsApi.changeContractStatus(contractId!, 'SIGNED');
      toast.success(t('contracts.sign.toastSigned', { number: contract.number }));
      resetAndClose();
    } catch {
      toast.error(t('common.operationError'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSignMethod('scan');
    setSignatoryName('');
    setSignatoryRole('director');
    setSignDate('');
    setProxyNumber('');
    setFileName('');
    onClose();
  };

  const canNext =
    step === 0
      ? true
      : step === 1
        ? signatoryName !== '' && signDate !== '' && (signMethod === 'kep' || fileName !== '')
        : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('contracts.sign.title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('common.cancel') : t('contracts.sign.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('contracts.sign.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('contracts.sign.confirmSign')}
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

      {/* Step 1: Contract summary */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.contractNumber')}</p>
                <p className="text-sm font-semibold">{contract.number}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.contractType')}</p>
                <p className="text-sm">{contract.type}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.contractSubject')}</p>
              <p className="text-sm">{contract.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.contractor')}</p>
                <p className="text-sm">{contract.contractor}</p>
                <p className="text-xs text-neutral-400">{t('contracts.sign.innLabel', { inn: contract.contractorInn })}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.contractAmountLabel')}</p>
                <p className="text-sm font-semibold">{formatMoney(contract.amount)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.validityPeriod')}</p>
                <p className="text-sm">{contract.startDate} - {contract.endDate}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.sign.sectionsLabel')}</p>
                <p className="text-sm">{contract.sections}</p>
              </div>
            </div>
          </div>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-800">
              {t('contracts.sign.warningCheckTerms')}
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Upload signed scan / KEP */}
      {step === 1 && (
        <div className="space-y-4">
          <FormField label={t('contracts.sign.signMethodLabel')} required>
            <Select options={signMethods} value={signMethod} onChange={(e) => setSignMethod(e.target.value)} />
          </FormField>

          {signMethod === 'scan' && (
            <FormField label={t('contracts.sign.scanFileLabel')} required>
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                <input type="file" accept=".pdf,.jpg,.png" onChange={handleFileChange} className="hidden" id="sign-file" />
                <label htmlFor="sign-file" className="cursor-pointer">
                  {fileName ? (
                    <p className="text-sm text-primary-700 font-medium">{fileName}</p>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-600">{t('contracts.sign.uploadFile')}</p>
                      <p className="text-xs text-neutral-400 mt-1">{t('contracts.sign.fileFormats')}</p>
                    </>
                  )}
                </label>
              </div>
            </FormField>
          )}

          {signMethod === 'kep' && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-800">
                {t('contracts.sign.kepInfo')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('contracts.sign.signatoryName')} required>
              <Input
                placeholder={t('contracts.sign.signatoryNamePlaceholder')}
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
              />
            </FormField>
            <FormField label={t('contracts.sign.signatoryRole')} required>
              <Select options={signatoryRoles} value={signatoryRole} onChange={(e) => setSignatoryRole(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('contracts.sign.signDate')} required>
              <Input type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)} />
            </FormField>
            {signatoryRole === 'proxy' && (
              <FormField label={t('contracts.sign.proxyNumber')}>
                <Input
                  placeholder={t('contracts.sign.proxyPlaceholder')}
                  value={proxyNumber}
                  onChange={(e) => setProxyNumber(e.target.value)}
                />
              </FormField>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('contracts.sign.checkDataLabel')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>{t('contracts.sign.summaryContract')}</strong> {contract.number} - {contract.title}</p>
            <p><strong>{t('contracts.sign.summaryMethod')}</strong> {signMethods.find((m) => m.value === signMethod)?.label}</p>
            {fileName && <p><strong>{t('contracts.sign.summaryFile')}</strong> {fileName}</p>}
            <p><strong>{t('contracts.sign.summarySignatory')}</strong> {signatoryName}</p>
            <p><strong>{t('contracts.sign.summaryRole')}</strong> {signatoryRoles.find((r) => r.value === signatoryRole)?.label}</p>
            <p><strong>{t('contracts.sign.summaryDate')}</strong> {signDate}</p>
            {signatoryRole === 'proxy' && proxyNumber && (
              <p><strong>{t('contracts.sign.summaryProxy')}</strong> {proxyNumber}</p>
            )}
          </div>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-800">
              {t('contracts.sign.confirmInfo')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
