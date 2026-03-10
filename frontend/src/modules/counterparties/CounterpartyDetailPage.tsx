import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Edit, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { contractsApi } from '@/api/contracts';
import { t } from '@/i18n';

const CounterpartyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cp, isLoading, isError } = useQuery({
    queryKey: ['counterparty', id],
    queryFn: () => contractsApi.getCounterparty(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (isError || !cp) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('counterparties.notFound')}
          backTo="/counterparties"
          breadcrumbs={[
            { label: t('forms.common.home'), href: '/' },
            { label: t('counterparties.title'), href: '/counterparties' },
          ]}
        />
      </div>
    );
  }

  const getTypes = () => {
    const types: string[] = [];
    if (cp.customer) types.push(t('counterparties.typeCustomer'));
    if (cp.supplier) types.push(t('counterparties.typeSupplier'));
    if ((cp as any).contractor) types.push(t('counterparties.labelIsContractor'));
    if ((cp as any).subcontractor) types.push(t('counterparties.labelIsSubcontractor'));
    if ((cp as any).designer) types.push(t('counterparties.labelIsDesigner'));
    return types;
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-neutral-500 dark:text-neutral-400 text-sm">{label}</span>
      <span className="text-neutral-900 dark:text-neutral-100 text-sm font-medium tabular-nums">{value || '—'}</span>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={(cp as any).shortName || cp.name}
        subtitle={cp.name}
        backTo="/counterparties"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('counterparties.title'), href: '/counterparties' },
          { label: (cp as any).shortName || cp.name },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Edit size={14} />}
            onClick={() => navigate(`/counterparties/${id}/edit`)}
          >
            {t('common.edit')}
          </Button>
        }
      />

      {/* Status + types */}
      <div className="flex items-center gap-2 mb-6">
        <StatusBadge
          status={cp.active ? 'ACTIVE' : 'INACTIVE'}
          colorMap={{ ACTIVE: 'green', INACTIVE: 'gray' }}
          label={cp.active ? t('counterparties.statusActive') : t('counterparties.statusInactive')}
        />
        {getTypes().map((type) => (
          <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
            {type}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requisites */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.sectionRequisites')}</h3>
            </div>
            <InfoRow label={t('counterparties.labelName')} value={cp.name} />
            {(cp as any).shortName && <InfoRow label={t('counterparties.labelShortName')} value={(cp as any).shortName} />}
            <InfoRow label={t('counterparties.labelInn')} value={cp.inn} />
            <InfoRow label={t('counterparties.labelKpp')} value={cp.kpp} />
            <InfoRow label={t('counterparties.labelOgrn')} value={cp.ogrn} />
          </section>

          {/* Addresses */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.labelLegalAddress')}</h3>
            </div>
            <InfoRow label={t('counterparties.labelLegalAddress')} value={cp.legalAddress} />
            <InfoRow label={t('counterparties.labelActualAddress')} value={cp.actualAddress} />
          </section>

          {/* Bank details */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.sectionBankDetails')}</h3>
            </div>
            <InfoRow label={t('counterparties.labelBankName')} value={(cp as any).bankName} />
            <InfoRow label={t('counterparties.labelBik')} value={cp.bik} />
            <InfoRow label={t('counterparties.labelCorrespondentAccount')} value={cp.correspondentAccount} />
            <InfoRow label={t('counterparties.labelBankAccount')} value={cp.bankAccount} />
          </section>
        </div>

        {/* Right: Contact info */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={16} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.sectionContacts')}</h3>
            </div>
            <InfoRow label={t('counterparties.labelContactPerson')} value={(cp as any).contactPerson} />
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400 text-sm">{t('counterparties.labelPhone')}</span>
              {(cp as any).phone ? (
                <a href={`tel:${(cp as any).phone}`} className="text-sm font-medium text-primary-600 hover:underline">{(cp as any).phone}</a>
              ) : (
                <span className="text-sm text-neutral-400">—</span>
              )}
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-500 dark:text-neutral-400 text-sm">{t('counterparties.labelEmail')}</span>
              {(cp as any).email ? (
                <a href={`mailto:${(cp as any).email}`} className="text-sm font-medium text-primary-600 hover:underline">{(cp as any).email}</a>
              ) : (
                <span className="text-sm text-neutral-400">—</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CounterpartyDetailPage;
