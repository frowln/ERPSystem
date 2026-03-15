import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { insuranceApi } from '@/api/insurance';
import type { InsuranceCertificate, InsuranceCertificateStatus } from '@/api/insurance';
import { insuranceCertificateStatusColorMap, insuranceCertificateStatusLabels } from '@/design-system/components/StatusBadge/statusConfig';
import { t } from '@/i18n';
import { formatCountRu, formatDate } from '@/lib/format';
import { Plus, ShieldCheck, Trash2, Edit, AlertTriangle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

type TabId = 'ALL' | InsuranceCertificateStatus;

const TABS: TabId[] = ['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'PENDING'];

function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getExpiryBadge(days: number | null): React.ReactNode {
  if (days === null) return null;
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300">
        <AlertTriangle size={12} />
        {t('insurance.expired')}
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300">
        <AlertTriangle size={12} />
        {t('insurance.expiresInDays', { days: String(days) })}
      </span>
    );
  }
  if (days <= 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300">
        <AlertTriangle size={12} />
        {t('insurance.expiresInDays', { days: String(days) })}
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
        <AlertTriangle size={12} />
        {t('insurance.expiresInDays', { days: String(days) })}
      </span>
    );
  }
  return null;
}

const CERTIFICATE_TYPE_LABELS: Record<string, () => string> = {
  GENERAL_LIABILITY: () => t('insurance.typeGeneralLiability'),
  WORKERS_COMP: () => t('insurance.typeWorkersComp'),
  AUTO: () => t('insurance.typeAuto'),
  UMBRELLA: () => t('insurance.typeUmbrella'),
  PROFESSIONAL: () => t('insurance.typeProfessional'),
  BUILDERS_RISK: () => t('insurance.typeBuildersRisk'),
};

const InsuranceCertificateListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['insurance-certificates'],
    queryFn: async () => {
      const resp = await insuranceApi.getCertificates({ page: 0, size: 500 });
      return Array.isArray(resp) ? resp : resp?.content ?? [];
    },
  });

  const certificates: InsuranceCertificate[] = data ?? [];

  const filtered = useMemo(() => {
    let result = activeTab === 'ALL' ? certificates : certificates.filter((c) => c.status === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) =>
        c.vendorName?.toLowerCase().includes(q) ||
        c.policyNumber?.toLowerCase().includes(q) ||
        c.insurerName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [certificates, activeTab, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => insuranceApi.deleteCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates'] });
      toast.success(t('common.deleted'));
    },
    onError: () => {
      toast.error(t('common.unknownError'));
    },
  });

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('insurance.deleteConfirm'),
      description: t('common.confirmDeleteDesc'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = { ALL: certificates.length, ACTIVE: 0, EXPIRING_SOON: 0, EXPIRED: 0, PENDING: 0 };
    for (const c of certificates) {
      if (c.status in counts) counts[c.status as InsuranceCertificateStatus]++;
    }
    return counts;
  }, [certificates]);

  const tabLabels: Record<TabId, string> = {
    ALL: t('common.all'),
    ACTIVE: insuranceCertificateStatusLabels['ACTIVE'] ?? 'Active',
    EXPIRING_SOON: insuranceCertificateStatusLabels['EXPIRING_SOON'] ?? 'Expiring Soon',
    EXPIRED: insuranceCertificateStatusLabels['EXPIRED'] ?? 'Expired',
    PENDING: insuranceCertificateStatusLabels['PENDING'] ?? 'Pending',
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('insurance.title')}
        subtitle={formatCountRu(certificates.length, 'сертификат', 'сертификата', 'сертификатов')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('insurance.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/insurance-certificates/new')}>
            {t('insurance.createCertificate')}
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {tabLabels[tab]} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('insurance.searchPlaceholder')}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 pl-9 pr-3 py-2 text-sm
            bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <ShieldCheck size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('insurance.noCertificates')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            {t('insurance.noCertificatesDesc')}
          </p>
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/insurance-certificates/new')}>
            {t('insurance.createCertificate')}
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
                <tr className="text-left text-sm text-neutral-500 dark:text-neutral-400">
                  <th className="px-4 py-3 font-medium">{t('insurance.vendorName')}</th>
                  <th className="px-4 py-3 font-medium">{t('insurance.certificateType')}</th>
                  <th className="px-4 py-3 font-medium">{t('insurance.policyNumber')}</th>
                  <th className="px-4 py-3 font-medium">{t('insurance.insurerName')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('insurance.coverageAmount')}</th>
                  <th className="px-4 py-3 font-medium">{t('insurance.expiryDate')}</th>
                  <th className="px-4 py-3 font-medium">{t('insurance.status')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cert) => {
                  const days = getDaysUntilExpiry(cert.expiryDate);
                  return (
                    <tr
                      key={cert.id}
                      className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      onClick={() => navigate(`/insurance-certificates/${cert.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {cert.vendorName}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {CERTIFICATE_TYPE_LABELS[cert.certificateType]?.() ?? cert.certificateType}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                        {cert.policyNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {cert.insurerName || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-right">
                        {formatCurrency(cert.coverageAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {formatDate(cert.expiryDate)}
                          </span>
                          {getExpiryBadge(days)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={cert.status}
                          colorMap={insuranceCertificateStatusColorMap}
                          label={insuranceCertificateStatusLabels[cert.status] ?? cert.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              navigate(`/insurance-certificates/${cert.id}`);
                            }}
                            title={t('common.edit')}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-500 dark:text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleDelete(cert.id);
                            }}
                            title={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceCertificateListPage;
