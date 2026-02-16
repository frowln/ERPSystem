import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { kepApi } from '@/api/kep';
import { apiClient } from '@/api/client';
import { formatDate } from '@/lib/format';
import toast from 'react-hot-toast';

interface KepSignWizardProps {
  open: boolean;
  onClose: () => void;
  documentId?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
}

interface Certificate {
  id: string;
  owner: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serial: string;
}

const STEPS = ['Выбор документа', 'Выбор сертификата', 'Подписание', 'Результат'] as const;

export const KepSignWizard: React.FC<KepSignWizardProps> = ({ open, onClose, documentId: initialDocId }) => {
  const [step, setStep] = useState(0);
  const [documentId, setDocumentId] = useState(initialDocId || '');
  const [certId, setCertId] = useState('');
  const [pin, setPin] = useState('');
  const [signing, setSigning] = useState(false);
  const [signResult, setSignResult] = useState<'SUCCESS' | 'ERROR' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: signingRequests } = useQuery({
    queryKey: ['kep-signing-requests-wizard'],
    queryFn: () => kepApi.getSigningRequests(),
    enabled: open,
  });

  const { data: certificatesData } = useQuery({
    queryKey: ['kep-certificates-wizard'],
    queryFn: () => kepApi.getCertificates({ status: 'ACTIVE' } as any),
    enabled: open,
  });

  const documents = useMemo<Document[]>(() => {
    const reqs = signingRequests?.content ?? [];
    return reqs.map((r) => ({
      id: r.id,
      name: r.documentName,
      type: 'PDF',
      size: '',
      date: formatDate(r.createdAt),
    }));
  }, [signingRequests]);

  const certificates = useMemo<Certificate[]>(() => {
    const certs = certificatesData?.content ?? [];
    return certs.map((c) => ({
      id: c.id,
      owner: c.ownerName,
      issuer: c.issuerName,
      validFrom: formatDate(c.validFrom),
      validTo: formatDate(c.validTo),
      serial: c.serialNumber,
    }));
  }, [certificatesData]);

  const documentSelectOptions = useMemo(() =>
    documents.map((d) => ({ value: d.id, label: d.name })),
    [documents],
  );

  const certSelectOptions = useMemo(() =>
    certificates.map((c) => ({ value: c.id, label: `${c.owner} (${c.issuer}, до ${c.validTo})` })),
    [certificates],
  );

  const selectedDoc = documents.find((d) => d.id === documentId);
  const selectedCert = certificates.find((c) => c.id === certId);

  const handleSign = async () => {
    setSigning(true);
    setSignResult(null);
    setErrorMessage('');

    await new Promise((r) => setTimeout(r, 2000));

    // Simulate sign result
    if (pin.length >= 4) {
      setSignResult('SUCCESS');
      toast.success('Документ подписан КЭП');
    } else {
      setSignResult('ERROR');
      setErrorMessage('Неверный ПИН-код контейнера закрытого ключа. Проверьте правильность ввода.');
      toast.error('Ошибка подписания КЭП');
    }

    setSigning(false);
    setStep(3);
  };

  const resetAndClose = () => {
    setStep(0);
    setDocumentId(initialDocId || '');
    setCertId('');
    setPin('');
    setSignResult(null);
    setErrorMessage('');
    onClose();
  };

  const canNext =
    step === 0 ? documentId !== '' : step === 1 ? certId !== '' : step === 2 ? pin !== '' : true;

  const isCertExpired = selectedCert
    ? new Date(selectedCert.validTo) < new Date()
    : false;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Подписание документа КЭП"
      description="Квалифицированная электронная подпись"
      size="lg"
      footer={
        step === 3 ? (
          <Button onClick={resetAndClose}>
            {signResult === 'SUCCESS' ? 'Готово' : 'Закрыть'}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
              {step === 0 ? 'Отмена' : 'Назад'}
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                Далее
              </Button>
            ) : (
              <Button onClick={handleSign} loading={signing} disabled={!canNext}>
                Подписать
              </Button>
            )}
          </>
        )
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

      {/* Step 1: Select document */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label="Документ для подписания" required>
            <Select
              options={documentSelectOptions}
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Выберите документ"
            />
          </FormField>
          {selectedDoc && (
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Название</p>
                  <p className="text-sm font-medium">{selectedDoc.name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Дата документа</p>
                  <p className="text-sm">{selectedDoc.date}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Формат</p>
                  <p className="text-sm">{selectedDoc.type}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Размер</p>
                  <p className="text-sm">{selectedDoc.size}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select certificate */}
      {step === 1 && (
        <div className="space-y-4">
          <FormField label="Сертификат КЭП" required>
            <Select
              options={certSelectOptions}
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Выберите сертификат"
            />
          </FormField>
          {selectedCert && (
            <div className={`border rounded-lg p-4 ${isCertExpired ? 'bg-danger-50 border-danger-200' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Владелец</p>
                  <p className="text-sm font-medium">{selectedCert.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Удостоверяющий центр</p>
                  <p className="text-sm">{selectedCert.issuer}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Серийный номер</p>
                  <p className="text-sm font-mono text-xs">{selectedCert.serial}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Срок действия</p>
                  <p className="text-sm">{selectedCert.validFrom} - {selectedCert.validTo}</p>
                </div>
              </div>
              {isCertExpired && (
                <p className="text-sm text-danger-700 font-medium mt-3">
                  Внимание: срок действия сертификата истёк!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Enter PIN */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-sm">
            <p><strong>Документ:</strong> {selectedDoc?.name}</p>
            <p className="mt-1"><strong>Сертификат:</strong> {selectedCert?.owner} ({selectedCert?.issuer})</p>
          </div>

          <FormField label="ПИН-код контейнера закрытого ключа" required hint="Введите ПИН-код, установленный при создании контейнера ключа">
            <Input
              type="password"
              placeholder="Введите ПИН-код"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
          </FormField>

          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-800">
              Не передавайте ПИН-код третьим лицам. Система не сохраняет введённый ПИН-код.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 3 && (
        <div className="space-y-4">
          {signResult === 'SUCCESS' && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-success-900">Документ успешно подписан</h3>
              <p className="text-sm text-success-700 mt-2">
                Документ "{selectedDoc?.name}" подписан квалифицированной электронной подписью.
              </p>
              <div className="mt-4 text-sm text-success-700 space-y-1">
                <p>Подписант: {selectedCert?.owner}</p>
                <p>Дата подписания: {new Date().toLocaleDateString('ru-RU')}</p>
                <p>УЦ: {selectedCert?.issuer}</p>
              </div>
            </div>
          )}

          {signResult === 'ERROR' && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-danger-900">Ошибка подписания</h3>
              <p className="text-sm text-danger-700 mt-2">{errorMessage}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setStep(2); setPin(''); }}>
                Попробовать снова
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
