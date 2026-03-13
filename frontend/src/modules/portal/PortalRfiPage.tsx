import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileQuestion,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Plus,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { PortalRfi, PortalRfiStatus, PortalRfiPriority, PortalRfiResponse as RfiResponseType } from './types';

const tp = (k: string) => t(`portal.rfis.${k}`);

const statusColorMap: Record<PortalRfiStatus, string> = {
  OPEN: 'blue',
  ASSIGNED: 'yellow',
  ANSWERED: 'green',
  CLOSED: 'gray',
};

const priorityColorMap: Record<PortalRfiPriority, string> = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
  CRITICAL: 'red',
};

const getStatusLabel = (status: PortalRfiStatus): string => {
  const map: Record<PortalRfiStatus, string> = {
    OPEN: 'statusOpen',
    ASSIGNED: 'statusAssigned',
    ANSWERED: 'statusAnswered',
    CLOSED: 'statusClosed',
  };
  return tp(map[status]);
};

const getPriorityLabel = (priority: PortalRfiPriority): string => {
  const map: Record<PortalRfiPriority, string> = {
    LOW: 'priorityLow',
    NORMAL: 'priorityNormal',
    HIGH: 'priorityHigh',
    URGENT: 'priorityUrgent',
    CRITICAL: 'priorityCritical',
  };
  return tp(map[priority]);
};

const PortalRfiPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<PortalRfi | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [responseText, setResponseText] = useState('');

  // Form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formPriority, setFormPriority] = useState<PortalRfiPriority>('NORMAL');
  const [formSpecSection, setFormSpecSection] = useState('');
  const [formCostImpact, setFormCostImpact] = useState(false);
  const [formScheduleImpact, setFormScheduleImpact] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal-rfis'],
    queryFn: () => portalApi.getRfis({ size: 200 }),
  });

  const { data: portalProjects } = useQuery({
    queryKey: ['portal-projects-select'],
    queryFn: () => portalApi.getProjects({ size: 200 }),
  });

  const { data: detailResponses } = useQuery({
    queryKey: ['portal-rfi-responses', showDetail?.id],
    queryFn: () => portalApi.getRfiResponses(showDetail!.id),
    enabled: !!showDetail,
  });

  const allRfis = data?.content ?? [];
  const responses = detailResponses ?? [];

  const metrics = useMemo(() => ({
    total: allRfis.length,
    open: allRfis.filter((r) => r.status === 'OPEN' || r.status === 'ASSIGNED').length,
    overdue: allRfis.filter((r) => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'ANSWERED' && r.status !== 'CLOSED').length,
    answered: allRfis.filter((r) => r.status === 'ANSWERED' || r.status === 'CLOSED').length,
  }), [allRfis]);

  const filteredRfis = useMemo(() => {
    let result = allRfis;

    if (activeTab === 'open') {
      result = result.filter((r) => r.status === 'OPEN' || r.status === 'ASSIGNED');
    } else if (activeTab === 'answered') {
      result = result.filter((r) => r.status === 'ANSWERED');
    } else if (activeTab === 'overdue') {
      result = result.filter((r) => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'ANSWERED' && r.status !== 'CLOSED');
    } else if (activeTab === 'mine') {
      result = result.filter((r) => currentUser && r.createdById === currentUser.id);
    }

    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (priorityFilter) result = result.filter((r) => r.priority === priorityFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.number ?? '').toLowerCase().includes(q) ||
          (r.subject ?? '').toLowerCase().includes(q) ||
          (r.projectName ?? '').toLowerCase().includes(q) ||
          (r.assignedToName ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [allRfis, activeTab, statusFilter, priorityFilter, searchQuery, currentUser]);

  const tabs = useMemo(() => [
    { id: 'all', label: tp('tabAll'), count: allRfis.length },
    { id: 'open', label: tp('tabOpen'), count: metrics.open },
    { id: 'answered', label: tp('tabAnswered'), count: metrics.answered },
    { id: 'overdue', label: tp('tabOverdue'), count: metrics.overdue },
    { id: 'mine', label: tp('tabMine') },
  ], [allRfis.length, metrics.open, metrics.answered, metrics.overdue]);

  const projectOptions = useMemo(
    () => (portalProjects?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
    [portalProjects],
  );

  const statusOptions = useMemo(() => [
    { value: '', label: tp('filterAllStatuses') },
    { value: 'OPEN', label: tp('statusOpen') },
    { value: 'ASSIGNED', label: tp('statusAssigned') },
    { value: 'ANSWERED', label: tp('statusAnswered') },
    { value: 'CLOSED', label: tp('statusClosed') },
  ], []);

  const priorityOptions = useMemo(() => [
    { value: '', label: tp('filterAllPriorities') },
    { value: 'LOW', label: tp('priorityLow') },
    { value: 'NORMAL', label: tp('priorityNormal') },
    { value: 'HIGH', label: tp('priorityHigh') },
    { value: 'CRITICAL', label: tp('priorityCritical') },
  ], []);

  const formPriorityOptions = useMemo(() => [
    { value: 'LOW', label: tp('priorityLow') },
    { value: 'NORMAL', label: tp('priorityNormal') },
    { value: 'HIGH', label: tp('priorityHigh') },
    { value: 'CRITICAL', label: tp('priorityCritical') },
  ], []);

  const createMutation = useMutation({
    mutationFn: (payload: { projectId: string; subject: string; question: string; priority: PortalRfiPriority; specSection?: string; costImpact?: boolean; scheduleImpact?: boolean }) =>
      portalApi.createRfi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-rfis'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const addResponseMutation = useMutation({
    mutationFn: ({ rfiId, content }: { rfiId: string; content: string }) =>
      portalApi.addRfiResponse(rfiId, { response: content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-rfi-responses', showDetail?.id] });
      queryClient.invalidateQueries({ queryKey: ['portal-rfis'] });
      toast.success(tp('responseSent'));
      setResponseText('');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const resetForm = () => {
    setFormProjectId('');
    setFormSubject('');
    setFormQuestion('');
    setFormPriority('NORMAL');
    setFormSpecSection('');
    setFormCostImpact(false);
    setFormScheduleImpact(false);
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      projectId: formProjectId,
      subject: formSubject,
      question: formQuestion,
      priority: formPriority,
      specSection: formSpecSection || undefined,
      costImpact: formCostImpact || undefined,
      scheduleImpact: formScheduleImpact || undefined,
    });
  }, [formProjectId, formSubject, formQuestion, formPriority, formSpecSection, formCostImpact, formScheduleImpact]);

  const handleSendResponse = useCallback(() => {
    if (!showDetail || !responseText.trim()) return;
    addResponseMutation.mutate({ rfiId: showDetail.id, content: responseText.trim() });
  }, [showDetail, responseText]);

  const columns: ColumnDef<PortalRfi, unknown>[] = useMemo(() => [
    {
      accessorKey: 'number',
      header: tp('colNumber'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{row.original.number}</span>
      ),
    },
    {
      accessorKey: 'subject',
      header: tp('colSubject'),
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.subject}</span>
          {row.original.specSection && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{tp('specSectionShort')}: {row.original.specSection}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: tp('colProject'),
    },
    {
      accessorKey: 'priority',
      header: tp('colPriority'),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.priority}
          colorMap={priorityColorMap}
          label={getPriorityLabel(row.original.priority)}
        />
      ),
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
      accessorKey: 'assignedToName',
      header: tp('colAssignee'),
      cell: ({ row }) => row.original.assignedToName || '\u2014',
    },
    {
      accessorKey: 'responseCount',
      header: tp('colResponses'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
          <MessageSquare size={12} />
          <span className="text-sm">{row.original.responseCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: tp('colDueDate'),
      cell: ({ row }) => {
        if (!row.original.dueDate) return '\u2014';
        const isOverdue =
          new Date(row.original.dueDate) < new Date() &&
          row.original.status !== 'ANSWERED' &&
          row.original.status !== 'CLOSED';
        return (
          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {formatDate(row.original.dueDate)}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreated'),
      cell: ({ row }) => formatRelativeTime(row.original.createdAt),
    },
  ], []);

  const handleRowClick = useCallback((row: PortalRfi) => {
    setShowDetail(row);
  }, []);

  if (isError) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={tp('title')}
          breadcrumbs={[
            { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
            { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
            { label: tp('breadcrumb') },
          ]}
        />
        <div className="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-danger-500 mb-2" />
          <p className="text-danger-700 dark:text-danger-300 font-medium">{tp('errorTitle')}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{tp('errorDescription')}</p>
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
        subtitle={t('portal.rfis.subtitle', { count: String(filteredRfis.length) })}
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
            <Plus size={14} className="mr-1" /> {tp('createRfi')}
          </Button>
        }
      />

      {/* Metrics */}
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
            <MetricCard icon={<FileQuestion size={18} />} label={tp('metricTotal')} value={metrics.total} />
            <MetricCard icon={<MessageSquare size={18} />} label={tp('metricOpen')} value={metrics.open} />
            <MetricCard
              icon={<Clock size={18} />}
              label={tp('metricOverdue')}
              value={metrics.overdue}
              trend={metrics.overdue > 0 ? { direction: 'up', value: tp('trendOverdue') } : undefined}
            />
            <MetricCard icon={<CheckCircle size={18} />} label={tp('metricAnswered')} value={metrics.answered} />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-48">
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div className="w-48">
          <Select options={priorityOptions} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tp('searchPlaceholder')}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
            enableExport
                    columns={columns}
        data={filteredRfis}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableSavedViews
      />

      {/* Create RFI Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldProject')} required>
            <Select
              options={projectOptions}
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              placeholder={tp('projectPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldSubject')} required>
            <Input
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder={tp('subjectPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldQuestion')} required>
            <Textarea
              rows={5}
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder={tp('questionPlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldPriority')}>
              <Select
                options={formPriorityOptions}
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as PortalRfiPriority)}
              />
            </FormField>
            <FormField label={tp('fieldSpecSection')}>
              <Input
                value={formSpecSection}
                onChange={(e) => setFormSpecSection(e.target.value)}
                placeholder={tp('specSectionPlaceholder')}
              />
            </FormField>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formCostImpact}
                onChange={(e) => setFormCostImpact(e.target.checked)}
                className="rounded border-neutral-300"
              />
              {tp('fieldCostImpact')}
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formScheduleImpact}
                onChange={(e) => setFormScheduleImpact(e.target.checked)}
                className="rounded border-neutral-300"
              />
              {tp('fieldScheduleImpact')}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formProjectId || !formSubject.trim() || !formQuestion.trim()}
              loading={createMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RFI Detail Modal */}
      <Modal
        open={!!showDetail}
        onClose={() => { setShowDetail(null); setResponseText(''); }}
        title={showDetail ? `${showDetail.number} — ${showDetail.subject}` : ''}
      >
        {showDetail && (
          <div className="space-y-5">
            {/* Info bar */}
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={showDetail.status} colorMap={statusColorMap} label={getStatusLabel(showDetail.status)} />
              <StatusBadge status={showDetail.priority} colorMap={priorityColorMap} label={getPriorityLabel(showDetail.priority)} />
              {showDetail.costImpact && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  {tp('costImpactBadge')}
                </span>
              )}
              {showDetail.scheduleImpact && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                  {tp('scheduleImpactBadge')}
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="text-neutral-500 dark:text-neutral-400">{tp('detailProject')}:</span> <span className="font-medium text-neutral-900 dark:text-neutral-100">{showDetail.projectName}</span></div>
              <div><span className="text-neutral-500 dark:text-neutral-400">{tp('detailCreatedBy')}:</span> <span className="font-medium text-neutral-900 dark:text-neutral-100">{showDetail.createdByName}</span></div>
              <div><span className="text-neutral-500 dark:text-neutral-400">{tp('detailAssignee')}:</span> <span className="font-medium text-neutral-900 dark:text-neutral-100">{showDetail.assignedToName || '\u2014'}</span></div>
              <div><span className="text-neutral-500 dark:text-neutral-400">{tp('detailDueDate')}:</span> <span className="font-medium text-neutral-900 dark:text-neutral-100">{showDetail.dueDate ? formatDate(showDetail.dueDate) : '\u2014'}</span></div>
              {showDetail.specSection && (
                <div className="col-span-2"><span className="text-neutral-500 dark:text-neutral-400">{tp('detailSpecSection')}:</span> <span className="font-medium text-neutral-900 dark:text-neutral-100">{showDetail.specSection}</span></div>
              )}
            </div>

            {/* Question */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{tp('detailQuestion')}</h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                {showDetail.question}
              </div>
            </div>

            {/* Official answer */}
            {showDetail.answer && (
              <div>
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">{tp('detailOfficialAnswer')}</h4>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                  {showDetail.answer}
                </div>
                {showDetail.answeredDate && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{tp('detailAnsweredAt')}: {formatDate(showDetail.answeredDate)}</p>
                )}
              </div>
            )}

            {/* Discussion thread */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {tp('detailDiscussion')} ({responses.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {responses.map((r: RfiResponseType) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg text-sm ${
                      r.isOfficial
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                        {r.authorName}
                        {r.isOfficial && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">{tp('detailOfficial')}</span>
                        )}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatRelativeTime(r.createdAt)}</span>
                    </div>
                    <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{r.content}</p>
                  </div>
                ))}
                {responses.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">{tp('noResponses')}</p>
                )}
              </div>
            </div>

            {/* Add response */}
            {showDetail.status !== 'CLOSED' && (
              <div className="flex gap-2">
                <Textarea
                  rows={2}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={tp('responsePlaceholder')}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleSendResponse}
                  disabled={!responseText.trim()}
                  loading={addResponseMutation.isPending}
                  className="self-end"
                >
                  {tp('sendResponse')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortalRfiPage;
