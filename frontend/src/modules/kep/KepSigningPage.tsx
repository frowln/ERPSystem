import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  FilePen,
  CheckCircle,
  XCircle,
  FileSignature,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { kepApi } from './api';
import { t } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';
import type {
  KepSigningRequest,
  KepCertificate,
  KepPriority,
  CreateKepSigningRequest,
} from './types';
import type { PaginatedResponse } from '@/types';

const tp = (k: string, params?: Record<string, string | number>) => t(`kep.signing.${k}`, params);

const signingStatusColorMap: Record<string, 'yellow' | 'green' | 'red' | 'gray' | 'orange'> = {
  pending: 'yellow',
  signed: 'green',
  rejected: 'red',
  expired: 'orange',
  cancelled: 'gray',
};

const getSigningStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: tp('statusPending'),
    signed: tp('statusSigned'),
    rejected: tp('statusRejected'),
    expired: tp('statusExpired'),
    cancelled: tp('statusCancelled'),
  };
  return labels[status] ?? status;
};

const priorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

type TabId = 'all' | 'PENDING' | 'SIGNED' | 'REJECTED';

const emptyForm: CreateKepSigningRequest = {
  documentName: '',
  documentId: '',
  priority: 'MEDIUM',
  signerId: '',
  certificateId: '',
  dueDate: '',
  projectId: '',
};

export default function KepSigningPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showSign, setShowSign] = useState<KepSigningRequest | null>(null);
  const [showReject, setShowReject] = useState<KepSigningRequest | null>(null);
  const [showPreview, setShowPreview] = useState<KepSigningRequest | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBatchSign, setShowBatchSign] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateKepSigningRequest>(emptyForm);
  const [signCertificateId, setSignCertificateId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [batchCertificateId, setBatchCertificateId] = useState('');

  // Queries
  const { data: requestsData, isLoading } = useQuery<PaginatedResponse<KepSigningRequest>>({
    queryKey: ['kep-signing-requests'],
    queryFn: () => kepApi.getSigningRequests(),
  });

  const { data: certData } = useQuery<PaginatedResponse<KepCertificate>>({
    queryKey: ['kep-certificates-active'],
    queryFn: () => kepApi.getCertificates(),
  });

  const certificates = certData?.content?.filter((c) => c.status === 'ACTIVE') ?? [];
  const requests = requestsData?.content ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateKepSigningRequest) => kepApi.createSigningRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] });
      setShowCreate(false);
      setForm(emptyForm);
      toast.success(tp('createSuccess'));
    },
    onError: () => toast.error(tp('createError')),
  });

  const signMutation = useMutation({
    mutationFn: ({ documentId, certificateId }: { documentId: string; certificateId: string }) =>
      kepApi.signDocument({ certificateId, documentModel: 'signing-request', documentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] });
      setShowSign(null);
      setSignCertificateId('');
      toast.success(tp('signSuccess'));
    },
    onError: () => toast.error(tp('signError')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kepApi.rejectSigningRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] });
      setShowReject(null);
      setRejectReason('');
      toast.success(tp('rejectSuccess'));
    },
    onError: () => toast.error(tp('rejectError')),
  });

  const batchSignMutation = useMutation({
    mutationFn: async (params: { ids: string[]; certificateId: string }) => {
      const results = await Promise.allSettled(
        params.ids.map((id) =>
          kepApi.signDocument({ certificateId: params.certificateId, documentModel: 'signing-request', documentId: id }),
        ),
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] });
      setShowBatchSign(false);
      setBatchCertificateId('');
      setSelectedRows(new Set());
      toast.success(tp('batchSignSuccess'));
    },
    onError: () => toast.error(tp('batchSignError')),
  });

  // Filtering
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (activeTab === 'PENDING') {
      filtered = filtered.filter((r) => r.status === 'PENDING');
    } else if (activeTab === 'SIGNED') {
      filtered = filtered.filter((r) => r.status === 'SIGNED');
    } else if (activeTab === 'REJECTED') {
      filtered = filtered.filter((r) => r.status === 'REJECTED' || r.status === 'EXPIRED');
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.documentName.toLowerCase().includes(lower) ||
          r.signerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [requests, activeTab, statusFilter, search]);

  const tabCounts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      signed: requests.filter((r) => r.status === 'SIGNED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED' || r.status === 'EXPIRED').length,
    }),
    [requests],
  );

  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const signed = requests.filter((r) => r.status === 'SIGNED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    return { total: requests.length, pending, signed, rejected };
  }, [requests]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const pendingIds = filteredRequests.filter((r) => r.status === 'PENDING').map((r) => r.id);
    if (selectedRows.size === pendingIds.length && pendingIds.every((id) => selectedRows.has(id))) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pendingIds));
    }
  }, [filteredRequests, selectedRows]);

  const setField = useCallback(<K extends keyof CreateKepSigningRequest>(key: K, value: CreateKepSigningRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const certOptions = useMemo(
    () => [
      { value: '', label: tp('selectCertificate') },
      ...certificates.map((c) => ({
        value: c.id,
        label: `${c.ownerName} (${c.serialNumber.substring(0, 12)}...)`,
      })),
    ],
    [certificates],
  );

  const priorityOptions = [
    { value: 'LOW', label: tp('priorityLow') },
    { value: 'MEDIUM', label: tp('priorityMedium') },
    { value: 'HIGH', label: tp('priorityHigh') },
    { value: 'CRITICAL', label: tp('priorityCritical') },
  ];

  const statusFilterOptions = [
    { value: '', label: tp('filterAllStatuses') },
    { value: 'PENDING', label: tp('statusPending') },
    { value: 'SIGNED', label: tp('statusSigned') },
    { value: 'REJECTED', label: tp('statusRejected') },
    { value: 'EXPIRED', label: tp('statusExpired') },
    { value: 'CANCELLED', label: tp('statusCancelled') },
  ];

  const columns = useMemo<ColumnDef<KepSigningRequest, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
            checked={
              selectedRows.size > 0 &&
              filteredRequests.filter((r) => r.status === 'PENDING').every((r) => selectedRows.has(r.id))
            }
            onChange={toggleAll}
          />
        ),
        size: 40,
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') return null;
          return (
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
              checked={selectedRows.has(row.original.id)}
              onChange={() => toggleRow(row.original.id)}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
      },
      {
        accessorKey: 'number',
        header: '#',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'documentName',
        header: tp('colDocument'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">
              {row.original.documentName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.projectName ?? '---'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: tp('colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={signingStatusColorMap}
            label={getSigningStatusLabel(getValue<string>())}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: tp('colPriority'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={priorityColorMap}
          />
        ),
      },
      {
        accessorKey: 'signerName',
        header: tp('colSigner'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: tp('colDueDate'),
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue =
            dueDate && new Date(dueDate) < new Date() && row.original.status === 'PENDING';
          return (
            <span
              className={
                isOverdue
                  ? 'text-danger-600 font-medium tabular-nums'
                  : 'tabular-nums text-neutral-700 dark:text-neutral-300'
              }
            >
              {formatDate(dueDate)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 200,
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') {
            return (
              <Button
                variant="ghost"
                size="xs"
                iconLeft={<Eye size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(row.original);
                }}
              >
                {tp('viewButton')}
              </Button>
            );
          }
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="xs"
                iconLeft={<Eye size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(row.original);
                }}
              >
                {tp('viewButton')}
              </Button>
              <Button
                variant="primary"
                size="xs"
                iconLeft={<CheckCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSign(row.original);
                }}
              >
                {tp('signButton')}
              </Button>
              <Button
                variant="danger"
                size="xs"
                iconLeft={<XCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReject(row.original);
                }}
              >
                {tp('rejectButton')}
              </Button>
            </div>
          );
        },
      },
    ],
    [selectedRows, filteredRequests, toggleAll, toggleRow],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle', { count: String(requests.length) })}
        breadcrumbs={[
          { label: tp('breadcrumbHome'), href: '/' },
          { label: tp('breadcrumbKep'), href: '/settings/kep/certificates' },
          { label: tp('breadcrumbSigning') },
        ]}
        tabs={[
          { id: 'all', label: tp('tabAll'), count: tabCounts.all },
          { id: 'PENDING', label: tp('tabPending'), count: tabCounts.pending },
          { id: 'SIGNED', label: tp('tabSigned'), count: tabCounts.signed },
          { id: 'REJECTED', label: tp('tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <Button
                variant="success"
                size="sm"
                iconLeft={<FileSignature size={14} />}
                onClick={() => setShowBatchSign(true)}
              >
                {tp('batchSign', { count: String(selectedRows.size) })}
              </Button>
            )}
            <Button
              size="sm"
              iconLeft={<FilePen size={14} />}
              onClick={() => setShowCreate(true)}
            >
              {tp('createRequest')}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FilePen size={18} />}
          label={tp('metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<FileSignature size={18} />}
          label={tp('metricPending')}
          value={metrics.pending}
          trend={
            metrics.pending > 0
              ? { direction: 'up', value: `${metrics.pending} ${tp('trendPcs')}` }
              : undefined
          }
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={tp('metricSigned')}
          value={metrics.signed}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={tp('metricRejected')}
          value={metrics.rejected}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={tp('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-52"
        />
      </div>

      {/* Table */}
      <DataTable<KepSigningRequest>
        data={filteredRequests}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={tp('emptyTitle')}
        emptyDescription={tp('emptyDescription')}
      />

      {/* Create signing request modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={tp('createTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={tp('fieldDocumentName')} required>
              <Input
                value={form.documentName}
                onChange={(e) => setField('documentName', e.target.value)}
                placeholder={tp('documentNamePlaceholder')}
              />
            </FormField>
            <FormField label={tp('fieldDocumentId')} required>
              <Input
                value={form.documentId}
                onChange={(e) => setField('documentId', e.target.value)}
                placeholder={tp('documentIdPlaceholder')}
              />
            </FormField>
            <FormField label={tp('fieldSignerId')} required>
              <Input
                value={form.signerId}
                onChange={(e) => setField('signerId', e.target.value)}
                placeholder={tp('signerIdPlaceholder')}
              />
            </FormField>
            <FormField label={tp('fieldPriority')}>
              <Select
                options={priorityOptions}
                value={form.priority}
                onChange={(e) => setField('priority', e.target.value as KepPriority)}
              />
            </FormField>
            <FormField label={tp('fieldCertificate')}>
              <Select
                options={certOptions}
                value={form.certificateId ?? ''}
                onChange={(e) => setField('certificateId', e.target.value)}
              />
            </FormField>
            <FormField label={tp('fieldDueDate')}>
              <Input
                type="date"
                value={form.dueDate ?? ''}
                onChange={(e) => setField('dueDate', e.target.value)}
              />
            </FormField>
            <FormField label={tp('fieldProjectId')}>
              <Input
                value={form.projectId ?? ''}
                onChange={(e) => setField('projectId', e.target.value)}
                placeholder={tp('projectIdPlaceholder')}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={
                !form.documentName ||
                !form.documentId ||
                !form.signerId ||
                createMutation.isPending
              }
              loading={createMutation.isPending}
            >
              {tp('createConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sign confirmation modal */}
      <Modal
        open={!!showSign}
        onClose={() => {
          setShowSign(null);
          setSignCertificateId('');
        }}
        title={tp('signTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {tp('signDescription')}
          </p>
          {showSign && (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {showSign.documentName}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {tp('requestedBy')}: {showSign.requestedByName}
              </p>
              {showSign.dueDate && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {tp('colDueDate')}: {formatDate(showSign.dueDate)}
                </p>
              )}
            </div>
          )}
          <FormField label={tp('fieldCertificate')} required>
            <Select
              options={certOptions}
              value={signCertificateId}
              onChange={(e) => setSignCertificateId(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSign(null);
                setSignCertificateId('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (showSign) {
                  signMutation.mutate({
                    documentId: showSign.id,
                    certificateId: signCertificateId,
                  });
                }
              }}
              disabled={!signCertificateId || signMutation.isPending}
              loading={signMutation.isPending}
              iconLeft={<CheckCircle size={14} />}
            >
              {tp('signConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!showReject}
        onClose={() => {
          setShowReject(null);
          setRejectReason('');
        }}
        title={tp('rejectTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {tp('rejectDescription')}
          </p>
          <FormField label={tp('fieldRejectReason')} required>
            <textarea
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 p-2 text-sm dark:bg-neutral-800 dark:text-neutral-200"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={tp('rejectReasonPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReject(null);
                setRejectReason('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (showReject) {
                  rejectMutation.mutate({ id: showReject.id, reason: rejectReason });
                }
              }}
              disabled={!rejectReason || rejectMutation.isPending}
              loading={rejectMutation.isPending}
              iconLeft={<XCircle size={14} />}
            >
              {tp('rejectConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview modal */}
      <Modal
        open={!!showPreview}
        onClose={() => setShowPreview(null)}
        title={tp('previewTitle')}
        size="lg"
      >
        {showPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label={tp('fieldDocumentName')} value={showPreview.documentName} />
              <InfoRow label="#" value={showPreview.number} mono />
              <InfoRow label={tp('colSigner')} value={showPreview.signerName} />
              <InfoRow label={tp('requestedBy')} value={showPreview.requestedByName} />
              <InfoRow label={tp('colStatus')} value={getSigningStatusLabel(showPreview.status)} />
              <InfoRow label={tp('colPriority')} value={showPreview.priority} />
              <InfoRow label={tp('colDueDate')} value={formatDate(showPreview.dueDate)} />
              <InfoRow label={tp('fieldProjectName')} value={showPreview.projectName ?? '---'} />
              {showPreview.signedAt && (
                <InfoRow label={tp('signedAt')} value={formatDateTime(showPreview.signedAt)} />
              )}
              {showPreview.rejectionReason && (
                <InfoRow label={tp('rejectionReason')} value={showPreview.rejectionReason} />
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowPreview(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Batch sign modal */}
      <Modal
        open={showBatchSign}
        onClose={() => {
          setShowBatchSign(false);
          setBatchCertificateId('');
        }}
        title={tp('batchSignTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {tp('batchSignDescription', { count: String(selectedRows.size) })}
          </p>
          <FormField label={tp('fieldCertificate')} required>
            <Select
              options={certOptions}
              value={batchCertificateId}
              onChange={(e) => setBatchCertificateId(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBatchSign(false);
                setBatchCertificateId('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                batchSignMutation.mutate({
                  ids: Array.from(selectedRows),
                  certificateId: batchCertificateId,
                });
              }}
              disabled={!batchCertificateId || batchSignMutation.isPending}
              loading={batchSignMutation.isPending}
              iconLeft={<FileSignature size={14} />}
            >
              {tp('batchSignConfirm', { count: String(selectedRows.size) })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`text-sm text-neutral-900 dark:text-neutral-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
