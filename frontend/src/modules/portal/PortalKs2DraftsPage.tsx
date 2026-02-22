import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { projectsApi } from '@/api/projects';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { PortalKs2Draft, PortalKs2DraftStatus, CreatePortalKs2DraftRequest } from './types';

const tp = (k: string) => t(`portal.ks2Drafts.${k}`);

const statusColorMap: Record<PortalKs2DraftStatus, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CONVERTED: 'purple',
};

const statusLabelMap: Record<PortalKs2DraftStatus, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CONVERTED: 'converted',
};

const PortalKs2DraftsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<PortalKs2Draft | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  // Form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formDraftNumber, setFormDraftNumber] = useState('');
  const [formPeriodStart, setFormPeriodStart] = useState('');
  const [formPeriodEnd, setFormPeriodEnd] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formWorkDescription, setFormWorkDescription] = useState('');

  const statusFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase() as PortalKs2DraftStatus;

  const { data, isLoading } = useQuery({
    queryKey: ['portal-ks2-drafts', statusFilter],
    queryFn: () => portalApi.getKs2Drafts({ status: statusFilter, size: 100 }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const drafts = data?.content ?? [];

  const metrics = useMemo(() => ({
    total: drafts.length,
    draft: drafts.filter((d) => d.status === 'DRAFT').length,
    submitted: drafts.filter((d) => d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW').length,
    approved: drafts.filter((d) => d.status === 'APPROVED' || d.status === 'CONVERTED').length,
  }), [drafts]);

  const tabs = [
    { id: 'all', label: tp('tabAll'), count: metrics.total },
    { id: 'draft', label: tp('tabDraft'), count: metrics.draft },
    { id: 'submitted', label: tp('tabSubmitted'), count: metrics.submitted },
    { id: 'approved', label: tp('tabApproved'), count: metrics.approved },
  ];

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const createMutation = useMutation({
    mutationFn: (data: CreatePortalKs2DraftRequest) => portalApi.createKs2Draft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-ks2-drafts'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(tp('createError')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => portalApi.submitKs2Draft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-ks2-drafts'] });
      toast.success(tp('submitSuccess'));
    },
    onError: () => toast.error(tp('submitError')),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approved, comment }: { id: string; approved: boolean; comment?: string }) =>
      portalApi.reviewKs2Draft(id, { approved, reviewComment: comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-ks2-drafts'] });
      toast.success(variables.approved ? tp('approveSuccess') : tp('rejectSuccess'));
      setReviewDraft(null);
      setReviewComment('');
    },
    onError: () => toast.error(tp('reviewError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalApi.deleteKs2Draft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-ks2-drafts'] });
      toast.success(tp('deleteSuccess'));
    },
  });

  const resetForm = () => {
    setFormProjectId('');
    setFormDraftNumber('');
    setFormPeriodStart('');
    setFormPeriodEnd('');
    setFormTotalAmount('');
    setFormWorkDescription('');
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      projectId: formProjectId,
      draftNumber: formDraftNumber || undefined,
      reportingPeriodStart: formPeriodStart || undefined,
      reportingPeriodEnd: formPeriodEnd || undefined,
      totalAmount: formTotalAmount ? parseFloat(formTotalAmount) : undefined,
      workDescription: formWorkDescription || undefined,
    });
  }, [formProjectId, formDraftNumber, formPeriodStart, formPeriodEnd, formTotalAmount, formWorkDescription]);

  const columns = [
    {
      accessorKey: 'draftNumber',
      header: tp('colNumber'),
      cell: ({ row }: { row: { original: PortalKs2Draft } }) => (
        <span className="font-medium text-primary-600 dark:text-primary-400">
          {row.original.draftNumber || `#${row.original.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      accessorKey: 'projectName',
      header: tp('colProject'),
    },
    {
      accessorKey: 'reportingPeriodStart',
      header: tp('colPeriod'),
      cell: ({ row }: { row: { original: PortalKs2Draft } }) => {
        const d = row.original;
        if (!d.reportingPeriodStart) return '—';
        return `${formatDate(d.reportingPeriodStart)} — ${d.reportingPeriodEnd ? formatDate(d.reportingPeriodEnd) : '...'}`;
      },
    },
    {
      accessorKey: 'totalAmount',
      header: tp('colAmount'),
      cell: ({ row }: { row: { original: PortalKs2Draft } }) =>
        row.original.totalAmount != null ? formatMoney(row.original.totalAmount) : '—',
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      cell: ({ row }: { row: { original: PortalKs2Draft } }) => (
        <StatusBadge status={tp(`status${statusLabelMap[row.original.status]}`)} colorMap={{ [tp(`status${statusLabelMap[row.original.status]}`)]: statusColorMap[row.original.status] }} />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreated'),
      cell: ({ row }: { row: { original: PortalKs2Draft } }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: PortalKs2Draft } }) => {
        const d = row.original;
        return (
          <div className="flex items-center gap-1">
            {d.status === 'DRAFT' && (
              <>
                <Button size="xs" variant="outline" onClick={() => submitMutation.mutate(d.id)} title={tp('submitAction')}>
                  <Send size={12} />
                </Button>
                <Button size="xs" variant="ghost" onClick={() => deleteMutation.mutate(d.id)} title={t('common.delete')}>
                  <Trash2 size={12} />
                </Button>
              </>
            )}
            {(d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW') && (
              <Button size="xs" variant="outline" onClick={() => setReviewDraft(d)} title={tp('reviewAction')}>
                <Eye size={12} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

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
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> {tp('createDraft')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileCheck size={18} />} label={tp('metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={tp('metricDraft')} value={metrics.draft} />
        <MetricCard icon={<Send size={18} />} label={tp('metricSubmitted')} value={metrics.submitted} />
        <MetricCard icon={<CheckCircle size={18} />} label={tp('metricApproved')} value={metrics.approved} />
      </div>

      <DataTable
        columns={columns}
        data={drafts}
        loading={isLoading}
      />

      {/* Create Draft Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldProject')} required>
            <Select options={projectOptions} value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} placeholder={tp('projectPlaceholder')} />
          </FormField>
          <FormField label={tp('fieldNumber')}>
            <Input value={formDraftNumber} onChange={(e) => setFormDraftNumber(e.target.value)} placeholder="KS2-DRAFT-001" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldPeriodStart')}>
              <Input type="date" value={formPeriodStart} onChange={(e) => setFormPeriodStart(e.target.value)} />
            </FormField>
            <FormField label={tp('fieldPeriodEnd')}>
              <Input type="date" value={formPeriodEnd} onChange={(e) => setFormPeriodEnd(e.target.value)} />
            </FormField>
          </div>
          <FormField label={tp('fieldAmount')}>
            <Input type="number" value={formTotalAmount} onChange={(e) => setFormTotalAmount(e.target.value)} placeholder="0.00" />
          </FormField>
          <FormField label={tp('fieldWorkDescription')}>
            <textarea
              className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              rows={4}
              value={formWorkDescription}
              onChange={(e) => setFormWorkDescription(e.target.value)}
              placeholder={tp('workDescPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!formProjectId} loading={createMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!reviewDraft} onClose={() => { setReviewDraft(null); setReviewComment(''); }} title={tp('reviewModalTitle')}>
        {reviewDraft && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
              <p><strong>{tp('colNumber')}:</strong> {reviewDraft.draftNumber || `#${reviewDraft.id.slice(0, 8)}`}</p>
              <p><strong>{tp('colProject')}:</strong> {reviewDraft.projectName}</p>
              {reviewDraft.reportingPeriodStart && (
                <p><strong>{tp('colPeriod')}:</strong> {formatDate(reviewDraft.reportingPeriodStart)} — {reviewDraft.reportingPeriodEnd ? formatDate(reviewDraft.reportingPeriodEnd) : '...'}</p>
              )}
              {reviewDraft.totalAmount != null && (
                <p><strong>{tp('colAmount')}:</strong> {formatMoney(reviewDraft.totalAmount)}</p>
              )}
              {reviewDraft.workDescription && (
                <div>
                  <strong>{tp('fieldWorkDescription')}:</strong>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{reviewDraft.workDescription}</p>
                </div>
              )}
            </div>
            <FormField label={tp('reviewCommentLabel')}>
              <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={tp('reviewCommentPlaceholder')}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="danger" onClick={() => reviewMutation.mutate({ id: reviewDraft.id, approved: false, comment: reviewComment })} loading={reviewMutation.isPending}>
                <XCircle size={14} className="mr-1" /> {tp('rejectAction')}
              </Button>
              <Button variant="success" onClick={() => reviewMutation.mutate({ id: reviewDraft.id, approved: true, comment: reviewComment })} loading={reviewMutation.isPending}>
                <CheckCircle size={14} className="mr-1" /> {tp('approveAction')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortalKs2DraftsPage;
