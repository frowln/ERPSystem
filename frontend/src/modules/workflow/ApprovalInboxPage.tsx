import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle, XCircle, AlertTriangle, Clock, Inbox, Timer, Search,
  Filter, ChevronRight, Ban, Eye, ArrowUpRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { workflowApi } from './api';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import type { ApprovalInstance } from './types';
import toast from 'react-hot-toast';

type TabId = 'pending' | 'completed' | 'all';

const statusColorMap: Record<string, string> = {
  IN_PROGRESS: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  ESCALATED: 'yellow',
};

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    IN_PROGRESS: tp('statusInProgress'),
    APPROVED: tp('statusApproved'),
    REJECTED: tp('statusRejected'),
    CANCELLED: tp('statusCancelled'),
    ESCALATED: tp('statusEscalated'),
  };
  return map[status] ?? status;
};

const entityTypeKeys: Record<string, string> = {
  KS2: 'entityKS2',
  KS3: 'entityKS3',
  INVOICE: 'entityInvoice',
  CONTRACT: 'entityContract',
  PURCHASE_REQUEST: 'entityPurchaseRequest',
  CHANGE_ORDER: 'entityChangeOrder',
  PAYMENT: 'entityPayment',
  BUDGET: 'entityBudget',
  DOCUMENT: 'entityDocument',
};

function tp(k: string): string {
  return t(`workflow.approvalInbox.${k}` as Parameters<typeof t>[0]);
}

function getEntityLabel(type: string): string {
  const key = entityTypeKeys[type];
  return key ? tp(key) : type;
}

/** Returns SLA urgency: 'overdue' | 'urgent' (<4h) | 'warning' (<24h) | 'normal' | null */
function getSlaUrgency(deadline: string | undefined | null, isOverdue?: boolean): 'overdue' | 'urgent' | 'warning' | 'normal' | null {
  if (isOverdue) return 'overdue';
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 4 * 60 * 60 * 1000) return 'urgent';
  if (diff < 24 * 60 * 60 * 1000) return 'warning';
  return 'normal';
}

function formatSlaRemaining(deadline: string | undefined | null): string | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return tp('slaOverdue');
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `< 1 ${tp('hoursAbbrev')}`;
  if (hours < 24) return `${hours} ${tp('hoursAbbrev')}`;
  const days = Math.floor(hours / 24);
  return `${days} ${tp('daysAbbrev')}`;
}

const slaColorClasses: Record<string, string> = {
  overdue: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  urgent: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  normal: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
};

function formatWaitingDays(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return tp('waitingDays').replace('{days}', String(days));
}

function computeAvgWaitDays(items: ApprovalInstance[]): string {
  const pending = items.filter(i => i.status === 'IN_PROGRESS');
  if (pending.length === 0) return '—';
  const totalMs = pending.reduce((sum, i) => sum + (Date.now() - new Date(i.createdAt).getTime()), 0);
  const avgDays = totalMs / pending.length / (1000 * 60 * 60 * 24);
  if (avgDays < 1) {
    const avgHours = Math.round(totalMs / pending.length / (1000 * 60 * 60));
    return `${avgHours} ${tp('hoursAbbrev')}`;
  }
  return `${avgDays.toFixed(1)} ${tp('daysAbbrev')}`;
}

// ─────────────────────────────── Component ──────────────────────────────

export default function ApprovalInboxPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [batchComments, setBatchComments] = useState('');
  const [detailInstance, setDetailInstance] = useState<ApprovalInstance | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<ApprovalInstance | null>(null);

  const { data: inboxData, isLoading } = useQuery({
    queryKey: ['approval-inbox'],
    queryFn: () => workflowApi.getApprovalInbox({ page: 0, size: 200 }),
  });

  const instances = inboxData?.content ?? [];

  // Collect available entity types from data for filter dropdown
  const entityTypes = useMemo(() => {
    const types = new Set(instances.map(i => i.entityType));
    return Array.from(types).sort();
  }, [instances]);

  const filtered = useMemo(() => {
    let result = instances;
    if (activeTab === 'pending') result = result.filter(i => i.status === 'IN_PROGRESS');
    if (activeTab === 'completed') result = result.filter(i => i.status !== 'IN_PROGRESS');
    if (entityTypeFilter) result = result.filter(i => i.entityType === entityTypeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(i =>
        (i.entityNumber ?? '').toLowerCase().includes(lower) ||
        (i.notes ?? '').toLowerCase().includes(lower) ||
        (i.currentStepName ?? '').toLowerCase().includes(lower) ||
        getEntityLabel(i.entityType).toLowerCase().includes(lower),
      );
    }
    // Sort: overdue first, then by SLA deadline (soonest first), then by creation date
    result = [...result].sort((a, b) => {
      const aOverdue = a.isOverdue ? 1 : 0;
      const bOverdue = b.isOverdue ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      if (a.slaDeadline && b.slaDeadline) return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
      if (a.slaDeadline) return -1;
      if (b.slaDeadline) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [instances, activeTab, search, entityTypeFilter]);

  const pendingCount = instances.filter(i => i.status === 'IN_PROGRESS').length;
  const overdueCount = instances.filter(i => i.isOverdue).length;
  const approvedCount = instances.filter(i => i.status === 'APPROVED').length;
  const rejectedCount = instances.filter(i => i.status === 'REJECTED').length;

  // ─── Mutations ────────────────────────────────────────────────────────

  const decideMutation = useMutation({
    mutationFn: ({ id, decision, comment }: { id: string; decision: string; comment?: string }) =>
      workflowApi.submitDecision(id, { decision, comments: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      closeModal();
      toast.success(t('common.operationSuccess'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const batchMutation = useMutation({
    mutationFn: async ({ ids, decision, comment }: { ids: string[]; decision: string; comment?: string }) => {
      return workflowApi.batchDecision({ instanceIds: ids, decision, comments: comment });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      setSelectedIds(new Set());
      setBatchAction(null);
      setBatchComments('');
      if (result.failed > 0) {
        toast.error(tp('batchPartialError').replace('{succeeded}', String(result.succeeded)).replace('{failed}', String(result.failed)));
      } else {
        toast.success(tp('batchSuccess').replace('{count}', String(result.succeeded)));
      }
    },
    onError: () => {
      // Fallback to per-item requests
      const ids = Array.from(selectedIds);
      const decision = batchAction === 'approve' ? 'APPROVED' : 'REJECTED';
      Promise.allSettled(ids.map(id => workflowApi.submitDecision(id, { decision, comments: batchComments }))).then((results) => {
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
        setSelectedIds(new Set());
        setBatchAction(null);
        setBatchComments('');
        if (failed > 0) {
          toast.error(tp('batchPartialError').replace('{succeeded}', String(succeeded)).replace('{failed}', String(failed)));
        } else {
          toast.success(tp('batchSuccess').replace('{count}', String(succeeded)));
        }
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => workflowApi.cancelApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      setCancelConfirmId(null);
      toast.success(t('common.operationSuccess'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  // ─── Callbacks ────────────────────────────────────────────────────────

  const closeModal = useCallback(() => {
    setSelectedInstance(null);
    setActionType(null);
    setComments('');
  }, []);

  const handleAction = useCallback((instance: ApprovalInstance, action: 'approve' | 'reject') => {
    setSelectedInstance(instance);
    setActionType(action);
  }, []);

  const confirmAction = useCallback(() => {
    if (!selectedInstance || !actionType) return;
    decideMutation.mutate({
      id: selectedInstance.id,
      decision: actionType === 'approve' ? 'APPROVED' : 'REJECTED',
      comment: comments,
    });
  }, [selectedInstance, actionType, comments, decideMutation]);

  const confirmBatchAction = useCallback(() => {
    if (!batchAction || selectedIds.size === 0) return;
    batchMutation.mutate({
      ids: Array.from(selectedIds),
      decision: batchAction === 'approve' ? 'APPROVED' : 'REJECTED',
      comment: batchComments,
    });
  }, [batchAction, selectedIds, batchComments, batchMutation]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const pendingItems = filtered.filter(i => i.status === 'IN_PROGRESS');
    if (selectedIds.size === pendingItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingItems.map(i => i.id)));
    }
  }, [filtered, selectedIds.size]);

  // ─── Tab config ───────────────────────────────────────────────────────

  const tabs = useMemo(() => [
    { id: 'pending' as TabId, label: tp('tabPending'), count: pendingCount },
    { id: 'completed' as TabId, label: tp('tabCompleted'), count: approvedCount + rejectedCount },
    { id: 'all' as TabId, label: tp('tabAll'), count: instances.length },
  ], [pendingCount, approvedCount, rejectedCount, instances.length]);

  // ─── Columns ──────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<ApprovalInstance>[]>(() => [
    {
      id: 'select',
      header: () => {
        const pendingItems = filtered.filter(i => i.status === 'IN_PROGRESS');
        if (pendingItems.length === 0) return null;
        return (
          <input
            type="checkbox"
            checked={selectedIds.size === pendingItems.length && pendingItems.length > 0}
            onChange={toggleSelectAll}
            className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
          />
        );
      },
      size: 40,
      cell: ({ row }) => {
        if (row.original.status !== 'IN_PROGRESS') return null;
        return (
          <input
            type="checkbox"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            onClick={e => e.stopPropagation()}
            className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
          />
        );
      },
    },
    {
      id: 'priority',
      header: '',
      size: 8,
      cell: ({ row }) => {
        const urgency = getSlaUrgency(row.original.slaDeadline, row.original.isOverdue);
        if (!urgency || urgency === 'normal') return null;
        const colors: Record<string, string> = {
          overdue: 'bg-red-500',
          urgent: 'bg-orange-500',
          warning: 'bg-amber-400',
        };
        return <div className={`w-1.5 h-8 rounded-full ${colors[urgency]}`} />;
      },
    },
    {
      accessorKey: 'entityNumber',
      header: tp('colEntityNumber'),
      size: 140,
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {row.original.entityNumber || '—'}
          </span>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {formatWaitingDays(row.original.createdAt)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'entityType',
      header: tp('colEntityType'),
      size: 140,
      cell: ({ getValue }) => {
        const type = getValue() as string;
        const typeColors: Record<string, string> = {
          CONTRACT: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          INVOICE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          PURCHASE_REQUEST: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
          CHANGE_ORDER: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          BUDGET: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
          PAYMENT: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
          KS2: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
          KS3: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        };
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeColors[type] ?? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>
            {getEntityLabel(type)}
          </span>
        );
      },
    },
    {
      accessorKey: 'currentStepName',
      header: tp('colCurrentStep'),
      size: 200,
      cell: ({ row }) => {
        const stepOrder = row.original.currentStepOrder ?? 0;
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] font-bold flex-shrink-0">
                {stepOrder}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {row.original.currentStepName || '—'}
              </span>
            </div>
            {row.original.workflowName && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 pl-6 truncate">
                {row.original.workflowName}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: tp('colNotes'),
      size: 240,
      cell: ({ getValue }) => {
        const notes = getValue() as string | undefined;
        return notes
          ? <span className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{notes}</span>
          : <span className="text-neutral-400">—</span>;
      },
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      size: 140,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge
            status={row.original.status}
            colorMap={statusColorMap}
            label={getStatusLabel(row.original.status)}
          />
          {row.original.isOverdue && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
              <AlertTriangle size={10} /> {tp('overdue')}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'slaDeadline',
      header: tp('colSlaDeadline'),
      size: 150,
      cell: ({ row }) => {
        const dl = row.original.slaDeadline;
        if (!dl) return <span className="text-neutral-400">—</span>;
        const remaining = formatSlaRemaining(dl);
        const urgency = getSlaUrgency(dl, row.original.isOverdue);
        const colorCls = urgency ? slaColorClasses[urgency] : '';
        return (
          <div className="text-xs">
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatDateTime(dl)}
            </span>
            {remaining && (
              <p className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${colorCls}`}>
                <Clock size={10} />
                {remaining}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      size: 220,
      cell: ({ row }) => {
        if (row.original.status !== 'IN_PROGRESS') {
          return (
            <Button size="xs" variant="ghost" onClick={e => { e.stopPropagation(); setDetailInstance(row.original); }}>
              <Eye size={14} className="mr-1" /> {t('common.details')}
            </Button>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <Button size="xs" variant="success" onClick={e => { e.stopPropagation(); handleAction(row.original, 'approve'); }}>
              <CheckCircle size={14} className="mr-1" /> {tp('actionApprove')}
            </Button>
            <Button size="xs" variant="outline" onClick={e => { e.stopPropagation(); handleAction(row.original, 'reject'); }}>
              <XCircle size={14} className="mr-1" /> {tp('actionReject')}
            </Button>
            <Button size="xs" variant="ghost" onClick={e => { e.stopPropagation(); setDetailInstance(row.original); }}>
              <Eye size={14} />
            </Button>
          </div>
        );
      },
    },
  ], [handleAction, selectedIds, toggleSelect, toggleSelectAll, filtered]);

  // ─── Entity type filter options ───────────────────────────────────────

  const entityFilterOptions = useMemo(() => [
    { value: '', label: tp('filterAllTypes') },
    ...entityTypes.map(et => ({ value: et, label: getEntityLabel(et) })),
  ], [entityTypes]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
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
        onTabChange={id => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard icon={<Inbox size={18} />} label={tp('metricPending')} value={pendingCount} loading={isLoading} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={tp('metricOverdue')}
          value={overdueCount}
          loading={isLoading}
          trend={overdueCount > 0 ? { direction: 'down' as const, value: tp('needsAttention') } : undefined}
        />
        <MetricCard icon={<CheckCircle size={18} />} label={tp('metricApproved')} value={approvedCount} loading={isLoading} />
        <MetricCard
          icon={<Timer size={18} />}
          label={tp('metricAvgWait')}
          value={computeAvgWaitDays(instances)}
          loading={isLoading}
        />
      </div>

      {/* Search + Filter + Batch actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={tp('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-neutral-400" />
          <Select
            options={entityFilterOptions}
            value={entityTypeFilter}
            onChange={e => setEntityTypeFilter(e.target.value)}
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {tp('selected')}: <strong className="text-primary-600 dark:text-primary-400">{selectedIds.size}</strong>
            </span>
            <Button
              size="sm"
              variant="success"
              iconLeft={<CheckCircle size={14} />}
              onClick={() => setBatchAction('approve')}
            >
              {tp('batchApprove')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              iconLeft={<XCircle size={14} />}
              onClick={() => setBatchAction('reject')}
            >
              {tp('batchReject')}
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={tp('emptyTitle')}
        emptyDescription={tp('emptyDescription')}
        onRowClick={row => setDetailInstance(row)}
      />

      {/* ────────── Single Decision Modal ────────── */}
      <Modal
        open={!!selectedInstance && !!actionType}
        onClose={closeModal}
        title={actionType === 'approve' ? tp('confirmApprove') : tp('confirmReject')}
      >
        <div className="space-y-4">
          {/* Entity info card */}
          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{selectedInstance?.entityNumber}</span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                entityTypeKeys[selectedInstance?.entityType ?? '']
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
                {getEntityLabel(selectedInstance?.entityType ?? '')}
              </span>
            </div>
            {selectedInstance?.workflowName && (
              <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <ArrowUpRight size={12} />
                {selectedInstance.workflowName}
              </div>
            )}
            {selectedInstance?.currentStepName && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{tp('detailStep')}:</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900 text-[9px] font-bold">
                    {selectedInstance.currentStepOrder ?? '?'}
                  </span>
                  {selectedInstance.currentStepName}
                </span>
              </div>
            )}
            {selectedInstance?.notes && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-2">
                {selectedInstance.notes}
              </p>
            )}
            {selectedInstance?.slaDeadline && (
              <div className="flex items-center gap-2 text-xs">
                <Clock size={12} className="text-neutral-400" />
                <span className="text-neutral-500 dark:text-neutral-400">SLA:</span>
                <span className={`font-medium ${
                  getSlaUrgency(selectedInstance.slaDeadline, selectedInstance.isOverdue) === 'overdue'
                    ? 'text-red-600 dark:text-red-400'
                    : getSlaUrgency(selectedInstance.slaDeadline, selectedInstance.isOverdue) === 'urgent'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  {formatSlaRemaining(selectedInstance.slaDeadline)}
                </span>
              </div>
            )}
          </div>

          {/* Decision indicator */}
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            actionType === 'approve'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {actionType === 'approve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {actionType === 'approve' ? tp('confirmApprove') : tp('confirmReject')}
          </div>

          <textarea
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 text-sm dark:bg-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={3}
            placeholder={tp('commentPlaceholder')}
            value={comments}
            onChange={e => setComments(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={confirmAction}
              disabled={decideMutation.isPending}
              loading={decideMutation.isPending}
              iconLeft={actionType === 'approve' ? <CheckCircle size={14} /> : <XCircle size={14} />}
            >
              {actionType === 'approve' ? tp('actionApprove') : tp('actionReject')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ────────── Batch Decision Modal ────────── */}
      <Modal
        open={!!batchAction}
        onClose={() => { setBatchAction(null); setBatchComments(''); }}
        title={batchAction === 'approve' ? tp('batchConfirmApprove') : tp('batchConfirmReject')}
      >
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
            batchAction === 'approve'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {batchAction === 'approve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span className="font-medium">
              {tp('batchDescription').replace('{count}', String(selectedIds.size))}
            </span>
          </div>
          {/* List of selected items */}
          <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-neutral-200 dark:border-neutral-700 p-2">
            {Array.from(selectedIds).map(id => {
              const inst = instances.find(i => i.id === id);
              return inst ? (
                <div key={id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 py-1">
                  <ChevronRight size={12} className="text-neutral-400" />
                  <span className="font-mono">{inst.entityNumber}</span>
                  <span className="text-neutral-400">—</span>
                  <span>{getEntityLabel(inst.entityType)}</span>
                </div>
              ) : null;
            })}
          </div>
          <textarea
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 text-sm dark:bg-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={3}
            placeholder={tp('commentPlaceholder')}
            value={batchComments}
            onChange={e => setBatchComments(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setBatchAction(null); setBatchComments(''); }}>{t('common.cancel')}</Button>
            <Button
              variant={batchAction === 'approve' ? 'success' : 'danger'}
              onClick={confirmBatchAction}
              disabled={batchMutation.isPending}
              loading={batchMutation.isPending}
              iconLeft={batchAction === 'approve' ? <CheckCircle size={14} /> : <XCircle size={14} />}
            >
              {batchAction === 'approve'
                ? `${tp('actionApprove')} (${selectedIds.size})`
                : `${tp('actionReject')} (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ────────── Detail Side Panel (Modal) ────────── */}
      <Modal
        open={!!detailInstance}
        onClose={() => setDetailInstance(null)}
        title={tp('detailTitle')}
      >
        {detailInstance && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {detailInstance.entityNumber}
                </h3>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium mt-1 ${
                  entityTypeKeys[detailInstance.entityType]
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                  {getEntityLabel(detailInstance.entityType)}
                </span>
              </div>
              <StatusBadge
                status={detailInstance.status}
                colorMap={statusColorMap}
                label={getStatusLabel(detailInstance.status)}
              />
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block">{tp('detailWorkflow')}</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {detailInstance.workflowName || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block">{tp('detailStep')}</span>
                <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px] font-bold">
                    {detailInstance.currentStepOrder ?? '?'}
                  </span>
                  {detailInstance.currentStepName || '—'}
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block">{tp('detailCreated')}</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatDateTime(detailInstance.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block">{tp('detailSla')}</span>
                {detailInstance.slaDeadline ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatDateTime(detailInstance.slaDeadline)}
                    </span>
                    {(() => {
                      const remaining = formatSlaRemaining(detailInstance.slaDeadline);
                      const urgency = getSlaUrgency(detailInstance.slaDeadline, detailInstance.isOverdue);
                      const colorCls = urgency ? slaColorClasses[urgency] : '';
                      return remaining ? (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${colorCls}`}>
                          <Clock size={10} /> {remaining}
                        </span>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {detailInstance.notes && (
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">{tp('detailNotes')}</span>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{detailInstance.notes}</p>
              </div>
            )}

            {/* Actions */}
            {detailInstance.status === 'IN_PROGRESS' && (
              <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => { setDetailInstance(null); handleAction(detailInstance, 'approve'); }}
                  iconLeft={<CheckCircle size={16} />}
                >
                  {tp('actionApprove')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setDetailInstance(null); handleAction(detailInstance, 'reject'); }}
                  iconLeft={<XCircle size={16} />}
                >
                  {tp('actionReject')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCancelConfirmId(detailInstance); setDetailInstance(null); }}
                  iconLeft={<Ban size={14} />}
                >
                  {tp('cancelApproval')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ────────── Cancel Confirmation Modal ────────── */}
      <Modal
        open={!!cancelConfirmId}
        onClose={() => setCancelConfirmId(null)}
        title={tp('cancelApproval')}
      >
        {cancelConfirmId && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {tp('cancelConfirm').replace('{number}', cancelConfirmId.entityNumber ?? cancelConfirmId.id)}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelConfirmId(null)}>{t('common.cancel')}</Button>
              <Button
                variant="danger"
                onClick={() => cancelMutation.mutate(cancelConfirmId.id)}
                disabled={cancelMutation.isPending}
                loading={cancelMutation.isPending}
                iconLeft={<Ban size={14} />}
              >
                {tp('cancelApproval')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
