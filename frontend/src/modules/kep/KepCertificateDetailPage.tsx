import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, ShieldX, Trash2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { kepApi } from './api';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import type { OcspStatus } from './types';
import toast from 'react-hot-toast';

const tp = (k: string) => t(`kep.certDetail.${k}`);

const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  EXPIRING_SOON: 'yellow',
  EXPIRED: 'red',
  REVOKED: 'gray',
  SUSPENDED: 'orange',
};

const ocspColorMap: Record<OcspStatus, string> = {
  GOOD: 'green',
  REVOKED: 'red',
  UNKNOWN: 'yellow',
  ERROR: 'gray',
};

export default function KepCertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRevoke, setShowRevoke] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: cert, isLoading } = useQuery({
    queryKey: ['kep-certificate', id],
    queryFn: () => kepApi.getCertificateById(id!),
    enabled: !!id,
  });

  const ocspMutation = useMutation({
    mutationFn: () => kepApi.validateCertificateOcsp(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['kep-certificate', id] });
      if (result.status === 'GOOD') {
        toast.success(tp('ocspGood'));
      } else {
        toast.error(`${tp('ocspResult')}: ${result.status} — ${result.message ?? ''}`);
      }
    },
    onError: () => toast.error(tp('ocspError')),
  });

  const revokeMutation = useMutation({
    mutationFn: () => kepApi.revokeCertificate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-certificate', id] });
      setShowRevoke(false);
      toast.success(tp('revokeSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => kepApi.deleteCertificate(id!),
    onSuccess: () => {
      toast.success(tp('deleteSuccess'));
      navigate('/kep/certificates');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (isLoading || !cert) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  const isExpired = new Date(cert.validTo) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(cert.validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${tp('title')}: ${cert.serialNumber}`}
        subtitle={cert.ownerName}
        breadcrumbs={[
          { label: t('kep.certificates.breadcrumbHome'), href: '/' },
          { label: t('kep.certificates.breadcrumbKep'), href: '/kep/certificates' },
          { label: t('kep.certificates.breadcrumbCertificates'), href: '/kep/certificates' },
          { label: cert.serialNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => ocspMutation.mutate()}
              disabled={ocspMutation.isPending || cert.status === 'REVOKED'}
            >
              <RefreshCw size={14} className={`mr-1 ${ocspMutation.isPending ? 'animate-spin' : ''}`} />
              {tp('ocspCheck')}
            </Button>
            {cert.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" onClick={() => setShowRevoke(true)}>
                <ShieldX size={14} className="mr-1" /> {tp('revoke')}
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} className="mr-1" /> {t('common.delete')}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label={tp('metricStatus')}
          value={t(`kep.certificates.status${cert.status.charAt(0) + cert.status.slice(1).toLowerCase().replace(/_./g, (m) => m[1].toUpperCase())}`)}
          loading={false}
        />
        <MetricCard
          label={tp('metricDaysLeft')}
          value={isExpired ? tp('expired') : String(daysUntilExpiry)}
          loading={false}
        />
        <MetricCard
          label={tp('metricIssuer')}
          value={cert.issuerName}
          loading={false}
        />
        <MetricCard
          label={tp('metricThumbprint')}
          value={cert.thumbprint?.substring(0, 16) + '...'}
          loading={false}
        />
      </div>

      {/* Certificate details card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">{tp('sectionSubject')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoRow label={tp('fieldOwner')} value={cert.ownerName} />
          <InfoRow label={tp('fieldInn')} value={cert.ownerInn || '—'} />
          <InfoRow label={tp('fieldOrganization')} value={cert.organizationName || '—'} />
          <InfoRow label={tp('fieldSerialNumber')} value={cert.serialNumber} mono />
          <InfoRow label={tp('fieldIssuer')} value={cert.issuerName} />
          <InfoRow label={tp('fieldThumbprint')} value={cert.thumbprint} mono />
          <InfoRow label={tp('fieldValidFrom')} value={formatDate(cert.validFrom)} />
          <InfoRow label={tp('fieldValidTo')} value={formatDate(cert.validTo)} highlight={isExpired} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{tp('fieldStatus')}:</span>
          <StatusBadge status={cert.status} colorMap={statusColorMap} />
        </div>
      </div>

      {/* OCSP Validation section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{tp('sectionOcsp')}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ocspMutation.mutate()}
            disabled={ocspMutation.isPending}
          >
            <RefreshCw size={14} className={`mr-1 ${ocspMutation.isPending ? 'animate-spin' : ''}`} />
            {tp('ocspRunCheck')}
          </Button>
        </div>
        {ocspMutation.data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {ocspMutation.data.status === 'GOOD' ? (
                <ShieldCheck className="h-8 w-8 text-green-500" />
              ) : ocspMutation.data.status === 'REVOKED' ? (
                <ShieldX className="h-8 w-8 text-red-500" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-yellow-500" />
              )}
              <div>
                <StatusBadge status={ocspMutation.data.status} colorMap={ocspColorMap} />
                {ocspMutation.data.message && (
                  <p className="text-sm text-gray-500 mt-1">{ocspMutation.data.message}</p>
                )}
              </div>
            </div>
            <InfoRow label={tp('ocspCheckedAt')} value={formatDate(ocspMutation.data.checkedAt)} />
            {ocspMutation.data.responderUrl && (
              <InfoRow label={tp('ocspResponder')} value={ocspMutation.data.responderUrl} mono />
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">{tp('ocspNotChecked')}</p>
        )}
      </div>

      {/* 63-FZ Compliance */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">{tp('sectionCompliance')}</h3>
        <div className="space-y-2">
          <ComplianceRow label={tp('compliance63fz')} ok={cert.status === 'ACTIVE' && !isExpired} />
          <ComplianceRow label={tp('complianceNotRevoked')} ok={cert.status !== 'REVOKED'} />
          <ComplianceRow label={tp('complianceNotExpired')} ok={!isExpired} />
          <ComplianceRow label={tp('complianceQualified')} ok={!!cert.issuerName} />
        </div>
      </div>

      {/* Revoke modal */}
      <Modal open={showRevoke} onClose={() => setShowRevoke(false)} title={tp('revokeTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{tp('revokeDescription')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRevoke(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending}>
              {tp('revokeConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={tp('deleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{tp('deleteDescription')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''} ${highlight ? 'text-red-600 font-medium' : ''}`}>{value}</p>
    </div>
  );
}

function ComplianceRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
