import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { safetyBriefingApi } from '@/api/safetyBriefings';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { WorkerCertificate, CertExpiryStatus } from './types';

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

const expiryColorMap: Record<CertExpiryStatus, string> = {
  valid: 'green',
  caution: 'yellow',
  warning: 'orange',
  critical: 'red',
  expired: 'red',
};

const getExpiryLabel = (status: CertExpiryStatus): string => ({
  valid: t('safety.certMatrix.statusValid'),
  caution: t('safety.certMatrix.statusCaution'),
  warning: t('safety.certMatrix.statusWarning'),
  critical: t('safety.certMatrix.statusCritical'),
  expired: t('safety.certMatrix.statusExpired'),
}[status]);

const WorkerCertsPage: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['worker-certs', workerId],
    queryFn: () => safetyBriefingApi.getWorkerCerts(workerId!),
    enabled: !!workerId,
  });

  const columns = useMemo<ColumnDef<WorkerCertificate, unknown>[]>(
    () => [
      {
        accessorKey: 'type',
        header: t('safety.certMatrix.colCertType'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'number',
        header: t('safety.certMatrix.colNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>() || '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'issueDate',
        header: t('safety.certMatrix.colIssueDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('safety.certMatrix.colExpiryDate'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          if (!val) return <span className="text-neutral-400">{t('safety.certMatrix.indefinite')}</span>;
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(val)}</span>
          );
        },
      },
      {
        id: 'status',
        header: t('safety.certMatrix.colCertStatus'),
        size: 130,
        cell: ({ row }) => {
          const status = getExpiryStatus(row.original.expiryDate);
          return (
            <StatusBadge
              status={status}
              colorMap={expiryColorMap}
              label={getExpiryLabel(status)}
            />
          );
        },
      },
      {
        accessorKey: 'issuingAuthority',
        header: t('safety.certMatrix.colAuthority'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[170px] block">
            {getValue<string>() || '\u2014'}
          </span>
        ),
      },
      {
        id: 'daysLeft',
        header: t('safety.certMatrix.colDaysLeft'),
        size: 100,
        cell: ({ row }) => {
          if (!row.original.expiryDate) return <span className="text-neutral-400">\u221e</span>;
          const now = new Date();
          const expiry = new Date(row.original.expiryDate);
          const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <span className={cn(
              'tabular-nums font-semibold',
              daysLeft < 0 ? 'text-danger-600' : daysLeft < 30 ? 'text-warning-600' : 'text-success-600',
            )}>
              {daysLeft}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.workerCerts.title')}
        subtitle={`${certs.length} ${t('safety.workerCerts.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.certMatrix.breadcrumbCerts'), href: '/safety/certifications' },
          { label: t('safety.workerCerts.breadcrumbWorker') },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/safety/certifications')} iconLeft={<ArrowLeft size={16} />}>
            {t('safety.workerCerts.btnBack')}
          </Button>
        }
      />

      {/* Summary cards */}
      {certs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(['valid', 'caution', 'warning', 'critical', 'expired'] as CertExpiryStatus[]).map((s) => {
            const count = certs.filter((c) => getExpiryStatus(c.expiryDate) === s).length;
            return (
              <div
                key={s}
                className={cn(
                  'rounded-lg border px-4 py-3 text-center',
                  count > 0 ? 'border-neutral-200 dark:border-neutral-700' : 'border-neutral-100 dark:border-neutral-800 opacity-50',
                )}
              >
                <div className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{count}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{getExpiryLabel(s)}</div>
              </div>
            );
          })}
        </div>
      )}

      <DataTable<WorkerCertificate>
        data={certs}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('safety.workerCerts.emptyTitle')}
        emptyDescription={t('safety.workerCerts.emptyDescription')}
      />
    </div>
  );
};

export default WorkerCertsPage;
