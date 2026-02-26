import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, ShieldCheck, AlertTriangle, Clock, KeyRound, Upload, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { kepApi } from '@/api/kep';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { KepCertificate } from './types';
import type { PaginatedResponse } from '@/types';

const certStatusColorMap: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'orange'> = {
  active: 'green',
  expiring_soon: 'yellow',
  expired: 'red',
  revoked: 'red',
  suspended: 'orange',
};

const getCertStatusLabels = (): Record<string, string> => ({
  active: t('kep.certificates.statusActive'),
  expiring_soon: t('kep.certificates.statusExpiringSoon'),
  expired: t('kep.certificates.statusExpired'),
  revoked: t('kep.certificates.statusRevoked'),
  suspended: t('kep.certificates.statusSuspended'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('kep.certificates.allStatuses') },
  { value: 'ACTIVE', label: t('kep.certificates.statusActive') },
  { value: 'EXPIRING_SOON', label: t('kep.certificates.statusExpiringSoon') },
  { value: 'EXPIRED', label: t('kep.certificates.statusExpired') },
  { value: 'REVOKED', label: t('kep.certificates.statusRevoked') },
  { value: 'SUSPENDED', label: t('kep.certificates.statusSuspended') },
];

type TabId = 'all' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';


const KepCertificateListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPassword, setUploadPassword] = useState('');

  // Delete confirmation state
  const [showDelete, setShowDelete] = useState<KepCertificate | null>(null);

  const { data: certData, isLoading } = useQuery<PaginatedResponse<KepCertificate>>({
    queryKey: ['kep-certificates'],
    queryFn: () => kepApi.getCertificates(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) =>
      kepApi.uploadCertificate(file, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-certificates'] });
      setShowUpload(false);
      setUploadFile(null);
      setUploadPassword('');
      toast.success(t('kep.certificates.uploadSuccess'));
    },
    onError: () => toast.error(t('kep.certificates.uploadError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => kepApi.deleteCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-certificates'] });
      setShowDelete(null);
      toast.success(t('kep.certificates.deleteSuccess'));
    },
    onError: () => toast.error(t('kep.certificates.deleteError')),
  });

  const certificates = certData?.content ?? [];

  const filteredCertificates = useMemo(() => {
    let filtered = certificates;

    if (activeTab === 'ACTIVE') {
      filtered = filtered.filter((c) => c.status === 'ACTIVE');
    } else if (activeTab === 'EXPIRING_SOON') {
      filtered = filtered.filter((c) => c.status === 'EXPIRING_SOON');
    } else if (activeTab === 'EXPIRED') {
      filtered = filtered.filter((c) => c.status === 'EXPIRED' || c.status === 'REVOKED');
    }

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.ownerName.toLowerCase().includes(lower) ||
          c.serialNumber.toLowerCase().includes(lower) ||
          c.issuerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [certificates, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: certificates.length,
    active: certificates.filter((c) => c.status === 'ACTIVE').length,
    expiring_soon: certificates.filter((c) => c.status === 'EXPIRING_SOON').length,
    expired: certificates.filter((c) => c.status === 'EXPIRED' || c.status === 'REVOKED').length,
  }), [certificates]);

  const metrics = useMemo(() => {
    const active = certificates.filter((c) => c.status === 'ACTIVE').length;
    const expiring = certificates.filter((c) => c.status === 'EXPIRING_SOON').length;
    const expired = certificates.filter((c) => c.status === 'EXPIRED').length;
    return { total: certificates.length, active, expiring, expired };
  }, [certificates]);

  const columns = useMemo<ColumnDef<KepCertificate, unknown>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: t('kep.certificates.colSerialNumber'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'ownerName',
        header: t('kep.certificates.colOwner'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.ownerName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.organizationName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'issuerName',
        header: t('kep.certificates.colIssuer'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('kep.certificates.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={certStatusColorMap}
            label={getCertStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'validFrom',
        header: t('kep.certificates.colValidFrom'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'validTo',
        header: t('kep.certificates.colValidTo'),
        size: 120,
        cell: ({ row }) => {
          const validTo = row.original.validTo;
          const isExpired = validTo && new Date(validTo) < new Date();
          return (
            <span className={isExpired ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(validTo)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/kep/certificates/${row.original.id}`);
              }}
            >
              {t('kep.certificates.openButton')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Trash2 size={12} />}
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(row.original);
              }}
            />
          </div>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (cert: KepCertificate) => navigate(`/kep/certificates/${cert.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('kep.certificates.title')}
        subtitle={t('kep.certificates.subtitle', { count: String(certificates.length) })}
        breadcrumbs={[
          { label: t('kep.certificates.breadcrumbHome'), href: '/' },
          { label: t('kep.certificates.breadcrumbKep') },
          { label: t('kep.certificates.breadcrumbCertificates') },
        ]}
        tabs={[
          { id: 'all', label: t('kep.certificates.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('kep.certificates.tabActive'), count: tabCounts.active },
          { id: 'EXPIRING_SOON', label: t('kep.certificates.tabExpiring'), count: tabCounts.expiring_soon },
          { id: 'EXPIRED', label: t('kep.certificates.tabExpired'), count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button
            size="sm"
            iconLeft={<Upload size={14} />}
            onClick={() => setShowUpload(true)}
          >
            {t('kep.certificates.uploadButton')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<KeyRound size={18} />}
          label={t('kep.certificates.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label={t('kep.certificates.metricActive')}
          value={metrics.active}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('kep.certificates.metricExpiring')}
          value={metrics.expiring}
          trend={metrics.expiring > 0 ? { direction: 'down', value: t('kep.certificates.trendNeedRenewal') } : undefined}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('kep.certificates.metricExpired')}
          value={metrics.expired}
          trend={metrics.expired > 0 ? { direction: 'down', value: t('kep.certificates.trendNeedReplacement') } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('kep.certificates.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<KepCertificate>
        data={filteredCertificates}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('kep.certificates.emptyTitle')}
        emptyDescription={t('kep.certificates.emptyDescription')}
      />

      {/* Upload certificate modal */}
      <Modal
        open={showUpload}
        onClose={() => {
          setShowUpload(false);
          setUploadFile(null);
          setUploadPassword('');
        }}
        title={t('kep.certificates.uploadTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('kep.certificates.uploadDescription')}
          </p>
          <FormField label={t('kep.certificates.uploadFieldFile')} required>
            <div
              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                uploadFile
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900'
              }`}
            >
              <Upload
                size={24}
                className={`mx-auto mb-2 ${
                  uploadFile ? 'text-primary-500' : 'text-neutral-400 dark:text-neutral-500'
                }`}
              />
              {uploadFile ? (
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </p>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('kep.certificates.uploadDropzone')}
                </p>
              )}
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pfx,.p12,.cer,.crt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </FormField>
          <FormField label={t('kep.certificates.uploadFieldPassword')} required>
            <Input
              type="password"
              value={uploadPassword}
              onChange={(e) => setUploadPassword(e.target.value)}
              placeholder={t('kep.certificates.uploadPasswordPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUpload(false);
                setUploadFile(null);
                setUploadPassword('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (uploadFile) {
                  uploadMutation.mutate({ file: uploadFile, password: uploadPassword });
                }
              }}
              disabled={!uploadFile || !uploadPassword || uploadMutation.isPending}
              loading={uploadMutation.isPending}
              iconLeft={<Upload size={14} />}
            >
              {t('kep.certificates.uploadConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete certificate modal */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={t('kep.certificates.deleteTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('kep.certificates.deleteDescription')}
          </p>
          {showDelete && (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{showDelete.ownerName}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-mono">{showDelete.serialNumber}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (showDelete) {
                  deleteMutation.mutate(showDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              loading={deleteMutation.isPending}
              iconLeft={<Trash2 size={14} />}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KepCertificateListPage;
