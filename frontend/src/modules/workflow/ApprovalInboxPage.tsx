import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { workflowApi } from './api';
import { t } from '@/i18n';
import type { ApprovalInstance } from './types';

type TabId = 'pending' | 'completed' | 'all';

const statusColorMap: Record<string, string> = {
  IN_PROGRESS: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  ESCALATED: 'yellow',
};

const entityTypeLabels: Record<string, string> = {
  KS2: 'entityKS2',
  KS3: 'entityKS3',
  INVOICE: 'entityInvoice',
  CONTRACT: 'entityContract',
  PURCHASE_REQUEST: 'entityPurchaseRequest',
  CHANGE_ORDER: 'entityChangeOrder',
  PAYMENT: 'entityPayment',
};

const tp = (k: string) => t(`workflow.approvalInbox.${k}`);

export default function ApprovalInboxPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delegate' | null>(null);
  const [comments, setComments] = useState('');

  const { data: inboxData, isLoading } = useQuery({
    queryKey: ['approval-inbox', activeTab],
    queryFn: () => workflowApi.getApprovalInbox({ page: 0, size: 100 }),
  });

  const instances = inboxData?.content ?? [];

  const filtered = useMemo(() => {
    if (activeTab === 'pending') return instances.filter((i) => i.status === 'IN_PROGRESS');
    if (activeTab === 'completed') return instances.filter((i) => i.status !== 'IN_PROGRESS');
    return instances;
  }, [instances, activeTab]);

  const pendingCount = instances.filter((i) => i.status === 'IN_PROGRESS').length;
  const overdueCount = instances.filter((i) => i.isOverdue).length;

  const decideMutation = useMutation({
    mutationFn: ({ id, decision, comment }: { id: string; decision: string; comment?: string }) =>
      workflowApi.submitDecision(id, { decision, comments: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      closeModal();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => workflowApi.cancelApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      closeModal();
    },
  });

  const closeModal = useCallback(() => {
    setSelectedInstance(null);
    setActionType(null);
    setComments('');
  }, []);

  const handleAction = useCallback((instance: ApprovalInstance, action: 'approve' | 'reject' | 'delegate') => {
    setSelectedInstance(instance);
    setActionType(action);
  }, []);

  const confirmAction = useCallback(() => {
    if (!selectedInstance || !actionType) return;
    if (actionType === 'approve') {
      decideMutation.mutate({ id: selectedInstance.id, decision: 'APPROVED', comment: comments });
    } else if (actionType === 'reject') {
      decideMutation.mutate({ id: selectedInstance.id, decision: 'REJECTED', comment: comments });
    }
  }, [selectedInstance, actionType, comments, decideMutation]);

  const tabs = useMemo(() => [
    { id: 'pending' as TabId, label: tp('tabPending'), count: pendingCount },
    { id: 'completed' as TabId, label: tp('tabCompleted') },
    { id: 'all' as TabId, label: tp('tabAll'), count: instances.length },
  ], [pendingCount, instances.length]);

  const columns = useMemo<ColumnDef<ApprovalInstance>[]>(() => [
    {
      accessorKey: 'entityNumber',
      header: tp('colEntityNumber'),
      size: 140,
      cell: ({ getValue }) => <span className="font-mono font-medium">{(getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'entityType',
      header: tp('colEntityType'),
      size: 120,
      cell: ({ getValue }) => {
        const key = entityTypeLabels[getValue() as string];
        return key ? tp(key) : (getValue() as string);
      },
    },
    {
      accessorKey: 'currentStepName',
      header: tp('colCurrentStep'),
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.original.status} colorMap={statusColorMap} />
          {row.original.isOverdue && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} /> {tp('overdue')}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'slaDeadline',
      header: tp('colSlaDeadline'),
      size: 140,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        if (!v) return '—';
        return new Date(v).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreatedAt'),
      size: 120,
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('ru-RU'),
    },
    {
      id: 'actions',
      header: '',
      size: 200,
      cell: ({ row }) => {
        if (row.original.status !== 'IN_PROGRESS') return null;
        return (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="success" onClick={() => handleAction(row.original, 'approve')}>
              <CheckCircle size={14} className="mr-1" /> {tp('actionApprove')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAction(row.original, 'reject')}>
              <XCircle size={14} className="mr-1" /> {tp('actionReject')}
            </Button>
          </div>
        );
      },
    },
  ], [handleAction]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('workflow.breadcrumbHome'), href: '/' },
          { label: t('workflow.breadcrumbWorkflows'), href: '/workflow/templates' },
          { label: tp('breadcrumbInbox') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label={tp('metricPending')} value={String(pendingCount)} loading={isLoading} />
        <MetricCard label={tp('metricOverdue')} value={String(overdueCount)} loading={isLoading} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
      />

      {/* Decision modal */}
      <Modal
        open={!!selectedInstance && !!actionType}
        onClose={closeModal}
        title={actionType === 'approve' ? tp('confirmApprove') : tp('confirmReject')}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedInstance?.entityNumber} — {selectedInstance?.entityType}
          </div>
          <textarea
            className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            rows={3}
            placeholder={tp('commentPlaceholder')}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={confirmAction}
              disabled={decideMutation.isPending}
            >
              {actionType === 'approve' ? tp('actionApprove') : tp('actionReject')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
