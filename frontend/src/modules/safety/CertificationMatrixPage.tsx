import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { safetyBriefingApi } from '@/api/safetyBriefings';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { WorkerCertificate, CertExpiryStatus, CreateCertificateRequest } from './types';
import { CERT_TYPES } from './types';

function getExpiryStatus(expiryDate?: string): CertExpiryStatus {
  if (!expiryDate) return 'valid';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'expired';
  if (daysLeft < 7) return 'critical';
  if (daysLeft < 30) return 'warning';
  if (daysLeft < 90) return 'caution';
  return 'valid';
}

function getDaysLeft(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const statusColors: Record<CertExpiryStatus, string> = {
  valid: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-700',
  caution: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  warning: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  critical: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-700',
  expired: 'bg-danger-200 dark:bg-danger-900/50 text-danger-800 dark:text-danger-200 border-danger-300 dark:border-danger-600',
};

const getStatusLabel = (status: CertExpiryStatus): string => ({
  valid: t('safety.certMatrix.statusValid'),
  caution: t('safety.certMatrix.statusCaution'),
  warning: t('safety.certMatrix.statusWarning'),
  critical: t('safety.certMatrix.statusCritical'),
  expired: t('safety.certMatrix.statusExpired'),
}[status]);

interface WorkerRow {
  employeeId: string;
  employeeName: string;
  certs: Map<string, WorkerCertificate>;
}

const CertificationMatrixPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'matrix' | 'alerts'>('matrix');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formCertType, setFormCertType] = useState<string>(CERT_TYPES[0]);
  const [formNumber, setFormNumber] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formAuthority, setFormAuthority] = useState('');

  const { data: certData, isLoading } = useQuery({
    queryKey: ['safety-certificates'],
    queryFn: () => safetyBriefingApi.getCertificates({ size: 500 }),
  });

  const { data: expiringCerts = [] } = useQuery({
    queryKey: ['safety-expiring-certs'],
    queryFn: () => safetyBriefingApi.getExpiringCerts(90),
  });

  const certs = certData?.content ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateCertificateRequest) => safetyBriefingApi.createCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['safety-expiring-certs'] });
      toast.success(t('safety.certMatrix.toastCreated'));
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('safety.certMatrix.toastCreateError'));
    },
  });

  const resetForm = () => {
    setFormEmployeeName('');
    setFormCertType(CERT_TYPES[0]);
    setFormNumber('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormAuthority('');
  };

  // Build matrix: rows = workers, columns = cert types
  const { workerRows, metrics } = useMemo(() => {
    const workerMap = new Map<string, WorkerRow>();

    for (const cert of certs) {
      const existing = workerMap.get(cert.employeeId);
      if (existing) {
        existing.certs.set(cert.type, cert);
      } else {
        // We don't have employee names from the cert endpoint directly, use cert.employeeId as fallback
        const row: WorkerRow = {
          employeeId: cert.employeeId,
          employeeName: cert.employeeId, // Will be replaced if we get names
          certs: new Map([[cert.type, cert]]),
        };
        workerMap.set(cert.employeeId, row);
      }
    }

    const rows = Array.from(workerMap.values());

    // Metrics
    const totalWorkers = rows.length;
    let fullyCertified = 0;
    let expiringThisMonth = 0;
    let expiredCount = 0;

    for (const row of rows) {
      let allValid = true;
      for (const certType of CERT_TYPES) {
        const cert = row.certs.get(certType);
        if (!cert) { allValid = false; continue; }
        const status = getExpiryStatus(cert.expiryDate);
        if (status === 'expired') { allValid = false; expiredCount++; }
        if (status === 'warning' || status === 'critical') expiringThisMonth++;
      }
      if (allValid) fullyCertified++;
    }

    const certifiedPercent = totalWorkers > 0 ? Math.round((fullyCertified / totalWorkers) * 100) : 0;

    return {
      workerRows: rows,
      metrics: { totalWorkers, fullyCertified, certifiedPercent, expiringThisMonth, expiredCount },
    };
  }, [certs]);

  const filteredRows = useMemo(() => {
    if (!search) return workerRows;
    const lower = search.toLowerCase();
    return workerRows.filter((r) => r.employeeName.toLowerCase().includes(lower) || r.employeeId.toLowerCase().includes(lower));
  }, [workerRows, search]);

  // Group expiring certs by urgency
  const alertGroups = useMemo(() => {
    const groups: Record<CertExpiryStatus, WorkerCertificate[]> = {
      expired: [],
      critical: [],
      warning: [],
      caution: [],
      valid: [],
    };
    for (const cert of expiringCerts) {
      const status = getExpiryStatus(cert.expiryDate);
      groups[status].push(cert);
    }
    return groups;
  }, [expiringCerts]);

  const handleCreate = () => {
    createMutation.mutate({
      employeeId: formEmployeeName.replace(/\s/g, '-').toLowerCase(),
      type: formCertType,
      number: formNumber,
      issueDate: formIssueDate,
      expiryDate: formExpiryDate || undefined,
      issuingAuthority: formAuthority,
    });
  };

  const certTypeOptions = CERT_TYPES.map((ct) => ({ value: ct, label: ct }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.certMatrix.title')}
        subtitle={t('safety.certMatrix.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.certMatrix.breadcrumbCerts') },
        ]}
        tabs={[
          { id: 'matrix', label: t('safety.certMatrix.tabMatrix') },
          { id: 'alerts', label: t('safety.certMatrix.tabAlerts'), count: expiringCerts.length || undefined },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'matrix' | 'alerts')}
        actions={
          <Button onClick={() => setModalOpen(true)} iconLeft={<Plus size={16} />}>
            {t('safety.certMatrix.btnAddCert')}
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('safety.certMatrix.metricWorkers')} value={metrics.totalWorkers} />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('safety.certMatrix.metricCertified')}
          value={`${metrics.certifiedPercent}%`}
          trend={metrics.certifiedPercent >= 80 ? { direction: 'up', value: `${metrics.fullyCertified}` } : { direction: 'down', value: `${metrics.fullyCertified}` }}
        />
        <MetricCard icon={<Clock size={18} />} label={t('safety.certMatrix.metricExpiring')} value={metrics.expiringThisMonth} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.certMatrix.metricExpired')}
          value={metrics.expiredCount}
          trend={metrics.expiredCount > 0 ? { direction: 'down', value: t('safety.certMatrix.requireAction') } : undefined}
        />
      </div>

      {activeTab === 'matrix' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder={t('safety.certMatrix.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 ml-auto text-xs">
              {(['valid', 'caution', 'warning', 'critical', 'expired'] as CertExpiryStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={cn('w-3 h-3 rounded-sm border', statusColors[s])} />
                  <span className="text-neutral-500 dark:text-neutral-400">{getStatusLabel(s)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[200px]">
                    {t('safety.certMatrix.colWorker')}
                  </th>
                  {CERT_TYPES.map((ct) => (
                    <th
                      key={ct}
                      className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                    >
                      {ct}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.employeeId}
                    className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                    onClick={() => navigate(`/safety/certifications/${row.employeeId}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate block max-w-[190px]">
                        {row.employeeName}
                      </span>
                    </td>
                    {CERT_TYPES.map((ct) => {
                      const cert = row.certs.get(ct);
                      if (!cert) {
                        return (
                          <td key={ct} className="px-3 py-3 text-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                              \u2014
                            </div>
                          </td>
                        );
                      }
                      const status = getExpiryStatus(cert.expiryDate);
                      const days = getDaysLeft(cert.expiryDate);
                      return (
                        <td key={ct} className="px-3 py-3 text-center">
                          <div
                            className={cn(
                              'inline-flex flex-col items-center justify-center rounded-lg border px-2 py-1 min-w-[60px]',
                              statusColors[status],
                            )}
                          >
                            <span className="text-xs font-semibold tabular-nums">
                              {status === 'valid' ? '\u2713' : days !== null ? `${days}d` : '\u2713'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={CERT_TYPES.length + 1} className="px-4 py-12 text-center text-sm text-neutral-500">
                      {isLoading ? t('common.loading') : t('safety.certMatrix.emptyMatrix')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {(['expired', 'critical', 'warning', 'caution'] as CertExpiryStatus[]).map((urgency) => {
            const items = alertGroups[urgency];
            if (items.length === 0) return null;
            return (
              <div key={urgency}>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', statusColors[urgency].split(' ')[0])} />
                  {getStatusLabel(urgency)} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((cert) => {
                    const days = getDaysLeft(cert.expiryDate);
                    return (
                      <div
                        key={cert.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-4 py-3',
                          statusColors[urgency],
                        )}
                      >
                        <div>
                          <span className="text-sm font-medium">{cert.employeeId}</span>
                          <span className="text-sm ml-2">\u2014 {cert.type}</span>
                          {cert.number && (
                            <span className="text-xs ml-2 opacity-70">#{cert.number}</span>
                          )}
                        </div>
                        <div className="text-right">
                          {cert.expiryDate && (
                            <span className="text-xs tabular-nums">
                              {formatDate(cert.expiryDate)}
                              {days !== null && ` (${days}${t('safety.certMatrix.daysUnit')})`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {expiringCerts.length === 0 && (
            <div className="text-center py-12">
              <ShieldCheck size={40} className="mx-auto text-success-400 mb-3" />
              <p className="text-sm text-neutral-500">{t('safety.certMatrix.noAlerts')}</p>
            </div>
          )}
        </div>
      )}

      {/* Create Certificate Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={t('safety.certMatrix.modalTitle')}
        description={t('safety.certMatrix.modalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!formEmployeeName || !formIssueDate}
              iconLeft={<ShieldCheck size={16} />}
            >
              {t('safety.certMatrix.btnSave')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('safety.certMatrix.labelEmployee')} required>
            <Input
              placeholder={t('safety.certMatrix.placeholderEmployee')}
              value={formEmployeeName}
              onChange={(e) => setFormEmployeeName(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safety.certMatrix.labelCertType')} required>
              <Select
                options={certTypeOptions}
                value={formCertType}
                onChange={(e) => setFormCertType(e.target.value)}
              />
            </FormField>
            <FormField label={t('safety.certMatrix.labelNumber')}>
              <Input
                placeholder={t('safety.certMatrix.placeholderNumber')}
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safety.certMatrix.labelIssueDate')} required>
              <Input type="date" value={formIssueDate} onChange={(e) => setFormIssueDate(e.target.value)} />
            </FormField>
            <FormField label={t('safety.certMatrix.labelExpiryDate')}>
              <Input type="date" value={formExpiryDate} onChange={(e) => setFormExpiryDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('safety.certMatrix.labelAuthority')}>
            <Input
              placeholder={t('safety.certMatrix.placeholderAuthority')}
              value={formAuthority}
              onChange={(e) => setFormAuthority(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default CertificationMatrixPage;
