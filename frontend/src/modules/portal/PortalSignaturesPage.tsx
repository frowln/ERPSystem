import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { PortalDocumentSignature, SignatureStatus } from './types';

const tp = (k: string) => t(`portal.signatures.${k}`);

const statusColorMap: Record<SignatureStatus, string> = {
  PENDING: 'yellow',
  SIGNED: 'green',
  REJECTED: 'red',
  EXPIRED: 'gray',
};

const getStatusLabel = (status: SignatureStatus): string => {
  const map: Record<SignatureStatus, string> = {
    PENDING: 'statusPending',
    SIGNED: 'statusSigned',
    REJECTED: 'statusRejected',
    EXPIRED: 'statusExpired',
  };
  return tp(map[status]);
};

const isExpiringSoon = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  const expires = new Date(expiresAt);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 3;
};

const isOverdue = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
};

const PortalSignaturesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [signTarget, setSignTarget] = useState<PortalDocumentSignature | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PortalDocumentSignature | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const statusFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal-signatures', statusFilter],
    queryFn: () => portalApi.getSignatures({ status: statusFilter, size: 100 }),
  });

  const signatures = data?.content ?? [];

  const metrics = useMemo(() => ({
    total: signatures.length,
    pending: signatures.filter((s) => s.status === 'PENDING').length,
    signed: signatures.filter((s) => s.status === 'SIGNED').length,
    rejected: signatures.filter((s) => s.status === 'REJECTED').length,
  }), [signatures]);

  const tabs = useMemo(() => [
    { id: 'all', label: tp('tabAll'), count: metrics.total },
    { id: 'pending', label: tp('tabPending'), count: metrics.pending },
    { id: 'signed', label: tp('tabSigned'), count: metrics.signed },
    { id: 'rejected', label: tp('tabRejected'), count: metrics.rejected },
  ], [metrics]);

  const signMutation = useMutation({
    mutationFn: (id: string) => portalApi.signDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-signatures'] });
      toast.success(tp('signSuccess'));
      setSignTarget(null);
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      portalApi.rejectSignature(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-signatures'] });
      toast.success(tp('rejectSuccess'));
      setRejectTarget(null);
      setRejectionReason('');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const handleConfirmSign = useCallback(() => {
    if (signTarget) signMutation.mutate(signTarget.id);
  }, [signTarget]);

  const handleConfirmReject = useCallback(() => {
    if (rejectTarget && rejectionReason.trim()) {
      rejectMutation.mutate({ id: rejectTarget.id, reason: rejectionReason.trim() });
    }
  }, [rejectTarget, rejectionReason]);

  const columns: ColumnDef<PortalDocumentSignature, unknown>[] = useMemo(() => [
    {
      accessorKey: 'documentTitle',
      header: tp('colDocument'),
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {row.original.documentTitle}
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {row.original.documentType}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: tp('colProject'),
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          colorMap={statusColorMap}
          label={getStatusLabel(row.original.status)}
        />
      ),
    },
    {
      accessorKey: 'signerName',
      header: tp('colSigner'),
    },
    {
      accessorKey: 'expiresAt',
      header: tp('colExpires'),
      cell: ({ row }) => {
        const { expiresAt, status } = row.original;
        if (!expiresAt) return '\u2014';
        const overdue = isOverdue(expiresAt);
        const expiring = isExpiringSoon(expiresAt);
        const showWarning = status === 'PENDING' && (overdue || expiring);
        return (
          <div className="flex items-center gap-1.5">
            <span className={showWarning ? 'text-danger-600 dark:text-danger-400 font-medium' : ''}>
              {formatDate(expiresAt)}
            </span>
            {showWarning && (
              <AlertTriangle
                size={14}
                className="text-danger-500 dark:text-danger-400"
                aria-label={overdue ? tp('overdueWarning') : tp('expiringSoonWarning')}
              />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreated'),
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 text-sm">
          {formatRelativeTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const s = row.original;
        if (s.status !== 'PENDING') return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant="success"
              onClick={() => setSignTarget(s)}
              title={tp('signAction')}
            >
              <CheckCircle size={12} className="mr-1" />
              {tp('signAction')}
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => setRejectTarget(s)}
              title={tp('rejectAction')}
            >
              <XCircle size={12} className="mr-1" />
              {tp('rejectAction')}
            </Button>
          </div>
        );
      },
    },
  ], []);

  if (isError) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={tp('title')}
          subtitle={tp('subtitle')}
          breadcrumbs={[
            { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
            { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
            { label: tp('breadcrumb') },
          ]}
        />
        <div className="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-danger-500 mb-2" />
          <p className="text-danger-700 dark:text-danger-300 font-medium">{t('common.loadError')}</p>
          <button onClick={() => void refetch()} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
            <RefreshCw size={14} /> {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 animate-pulse">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          ))
        ) : (
          <>
            <MetricCard icon={<FileSignature size={18} />} label={tp('metricTotal')} value={metrics.total} />
            <MetricCard icon={<Clock size={18} />} label={tp('metricPending')} value={metrics.pending} />
            <MetricCard icon={<CheckCircle size={18} />} label={tp('metricSigned')} value={metrics.signed} />
            <MetricCard icon={<XCircle size={18} />} label={tp('metricRejected')} value={metrics.rejected} />
          </>
        )}
      </div>

      {!isLoading && signatures.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center">
          <FileSignature size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400">{tp('emptyState')}</p>
        </div>
      ) : (
        <DataTable
          enableExport
                      columns={columns}
          data={signatures}
          loading={isLoading}
        />
      )}

      {/* Sign Confirmation Modal */}
      <Modal
        open={!!signTarget}
        onClose={() => setSignTarget(null)}
        title={tp('signModalTitle')}
        size="sm"
      >
        {signTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-4 space-y-2">
              <p>
                <strong>{tp('colDocument')}:</strong>{' '}
                {signTarget.documentTitle}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {signTarget.documentType}
              </p>
              <p>
                <strong>{tp('colProject')}:</strong>{' '}
                {signTarget.projectName}
              </p>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {tp('signConfirmText')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSignTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="success"
                onClick={handleConfirmSign}
                loading={signMutation.isPending}
              >
                <CheckCircle size={14} className="mr-1" />
                {tp('signAction')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectionReason(''); }}
        title={tp('rejectModalTitle')}
        size="sm"
      >
        {rejectTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-4 space-y-2">
              <p>
                <strong>{tp('colDocument')}:</strong>{' '}
                {rejectTarget.documentTitle}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {rejectTarget.documentType}
              </p>
              <p>
                <strong>{tp('colProject')}:</strong>{' '}
                {rejectTarget.projectName}
              </p>
            </div>
            <FormField label={tp('rejectionReasonLabel')} required>
              <Textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={tp('rejectionReasonPlaceholder')}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setRejectTarget(null); setRejectionReason(''); }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                loading={rejectMutation.isPending}
              >
                <XCircle size={14} className="mr-1" />
                {tp('rejectAction')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortalSignaturesPage;
