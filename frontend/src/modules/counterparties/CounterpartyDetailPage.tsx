import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Edit, Phone, Mail, MapPin, CreditCard, Globe, User, FileText, Power,
  ShieldAlert, Scale, AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { contractsApi, type ChekkaRiskResponse } from '@/api/contracts';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

const CounterpartyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cp, isLoading, isError } = useQuery({
    queryKey: ['counterparty', id],
    queryFn: () => contractsApi.getCounterparty(id!),
    enabled: !!id,
  });

  const { data: riskData, isLoading: riskLoading, refetch: refetchRisk } = useQuery({
    queryKey: ['counterparty-risk', cp?.inn],
    queryFn: () => contractsApi.checkCounterpartyRisk(cp!.inn),
    enabled: !!cp?.inn,
    staleTime: 24 * 60 * 60 * 1000, // 24h — matches backend cache
    retry: false,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => contractsApi.deleteCounterparty(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
      queryClient.invalidateQueries({ queryKey: ['counterparty', id] });
      toast.success(t('counterparties.deleteSuccess'));
      navigate('/counterparties');
    },
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
    if (cp.contractor) types.push(t('counterparties.labelIsContractor'));
    if (cp.subcontractor) types.push(t('counterparties.labelIsSubcontractor'));
    if (cp.designer) types.push(t('counterparties.labelIsDesigner'));
    return types;
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-neutral-500 dark:text-neutral-400 text-sm">{label}</span>
      <span className="text-neutral-900 dark:text-neutral-100 text-sm font-medium tabular-nums text-right max-w-[60%]">
        {value || '—'}
      </span>
    </div>
  );

  const handleDeactivate = () => {
    if (window.confirm(t('counterparties.deleteConfirmText'))) {
      deactivateMutation.mutate();
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={cp.shortName || cp.name}
        subtitle={cp.shortName ? cp.name : undefined}
        backTo="/counterparties"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('counterparties.title'), href: '/counterparties' },
          { label: cp.shortName || cp.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => navigate(`/counterparties/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
            {cp.active && (
              <Button
                variant="danger"
                size="sm"
                iconLeft={<Power size={14} />}
                onClick={handleDeactivate}
                loading={deactivateMutation.isPending}
              >
                {t('counterparties.deactivateButton')}
              </Button>
            )}
          </div>
        }
      />

      {/* Status + types */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
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
            {cp.shortName && <InfoRow label={t('counterparties.labelShortName')} value={cp.shortName} />}
            <InfoRow label={t('counterparties.labelInn')} value={cp.inn} />
            <InfoRow label={t('counterparties.labelKpp')} value={cp.kpp} />
            <InfoRow label={t('counterparties.labelOgrn')} value={cp.ogrn} />
          </section>

          {/* Addresses */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.sectionAddresses')}</h3>
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
            <InfoRow label={t('counterparties.labelBankName')} value={cp.bankName} />
            <InfoRow label={t('counterparties.labelBik')} value={cp.bik} />
            <InfoRow label={t('counterparties.labelCorrespondentAccount')} value={cp.correspondentAccount} />
            <InfoRow label={t('counterparties.labelBankAccount')} value={cp.bankAccount} />
          </section>

          {/* Notes */}
          {cp.notes && (
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.sectionNotes')}</h3>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{cp.notes}</p>
            </section>
          )}
        </div>

        {/* Right: Contact info + Risk check */}
        <div className="space-y-6">
          {/* Risk check (Chekka) */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.riskCheck')}</h3>
              </div>
              <button
                onClick={() => refetchRisk()}
                disabled={riskLoading}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title={t('counterparties.riskRefresh')}
              >
                {riskLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              </button>
            </div>

            {riskLoading && !riskData && (
              <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
                <Loader2 size={14} className="animate-spin" />
                {t('counterparties.riskLoading')}
              </div>
            )}

            {riskData?.error && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                <AlertTriangle size={14} />
                {riskData.error}
              </div>
            )}

            {riskData && !riskData.error && (
              <div className="space-y-3">
                {/* Risk level badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('counterparties.riskLevel')}</span>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                    riskData.riskLevel === 'LOW' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
                    riskData.riskLevel === 'MEDIUM' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
                    riskData.riskLevel === 'HIGH' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
                    riskData.riskLevel === 'UNKNOWN' && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                  )}>
                    {riskData.riskLevel === 'LOW' && <CheckCircle size={12} />}
                    {riskData.riskLevel === 'MEDIUM' && <AlertTriangle size={12} />}
                    {riskData.riskLevel === 'HIGH' && <XCircle size={12} />}
                    {t(`counterparties.risk_${riskData.riskLevel}` as any)}
                  </span>
                </div>

                {/* Risk score */}
                {riskData.riskScore != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('counterparties.riskScore')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            riskData.riskScore < 40 ? 'bg-green-500' : riskData.riskScore < 70 ? 'bg-amber-500' : 'bg-red-500',
                          )}
                          style={{ width: `${riskData.riskScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{riskData.riskScore}</span>
                    </div>
                  </div>
                )}

                {/* Activity status */}
                {riskData.isActive != null && (
                  <InfoRow
                    label={t('counterparties.riskIsActive')}
                    value={riskData.isActive ? t('counterparties.riskActive') : t('counterparties.riskLiquidated')}
                  />
                )}

                {/* Bankruptcy */}
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('counterparties.riskBankruptcy')}</span>
                  {riskData.hasBankruptcy ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <XCircle size={12} /> {t('counterparties.riskYes')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle size={12} /> {t('counterparties.riskNo')}
                    </span>
                  )}
                </div>

                {/* Debts */}
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('counterparties.riskDebts')}</span>
                  {riskData.hasDebts ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <XCircle size={12} /> {t('counterparties.riskYes')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle size={12} /> {t('counterparties.riskNo')}
                    </span>
                  )}
                </div>

                {/* Arbitration */}
                {(riskData.arbitrationCount != null && riskData.arbitrationCount > 0) && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale size={13} className="text-neutral-400" />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        {t('counterparties.riskArbitration')}
                      </span>
                    </div>
                    <InfoRow label={t('counterparties.riskArbTotal')} value={String(riskData.arbitrationCount)} />
                    {riskData.arbitrationAsPlaintiff != null && (
                      <InfoRow label={t('counterparties.riskArbPlaintiff')} value={String(riskData.arbitrationAsPlaintiff)} />
                    )}
                    {riskData.arbitrationAsDefendant != null && (
                      <InfoRow label={t('counterparties.riskArbDefendant')} value={String(riskData.arbitrationAsDefendant)} />
                    )}
                  </div>
                )}

                {/* Related companies */}
                {riskData.relatedCompanies && riskData.relatedCompanies.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      {t('counterparties.riskRelated')}
                    </span>
                    <div className="mt-2 space-y-1">
                      {riskData.relatedCompanies.map((c, i) => (
                        <div key={i} className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded px-2 py-1.5">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last updated */}
                {riskData.lastUpdated && (
                  <div className="pt-2 text-[11px] text-neutral-400">
                    {t('counterparties.riskUpdatedAt')}: {new Date(riskData.lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Contact info */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('counterparties.sectionContacts')}</h3>
            </div>
            <InfoRow label={t('counterparties.labelContactPerson')} value={cp.contactPerson} />
            <div className="flex justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1.5">
                <Phone size={13} />
                {t('counterparties.labelPhone')}
              </span>
              {cp.phone ? (
                <a href={`tel:${cp.phone}`} className="text-sm font-medium text-primary-600 hover:underline">{cp.phone}</a>
              ) : (
                <span className="text-sm text-neutral-400">—</span>
              )}
            </div>
            <div className="flex justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1.5">
                <Mail size={13} />
                {t('counterparties.labelEmail')}
              </span>
              {cp.email ? (
                <a href={`mailto:${cp.email}`} className="text-sm font-medium text-primary-600 hover:underline">{cp.email}</a>
              ) : (
                <span className="text-sm text-neutral-400">—</span>
              )}
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1.5">
                <Globe size={13} />
                {t('counterparties.labelWebsite')}
              </span>
              {cp.website ? (
                <a href={cp.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:underline">{cp.website}</a>
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
