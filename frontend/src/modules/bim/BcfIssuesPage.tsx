import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Plus,
  Upload,
  Download,
  MessageSquare,
  Send,
  User,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { bimApi } from '@/api/bim';
import type { BcfTopic } from '@/modules/bim/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { t } from '@/i18n';

const topicTypeColorMap: Record<string, 'red' | 'blue' | 'gray' | 'green'> = {
  issue: 'red',
  request: 'blue',
  comment: 'gray',
  solution: 'green',
};

const topicStatusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'gray'> = {
  open: 'blue',
  in_progress: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

const topicPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  low: 'gray',
  normal: 'blue',
  high: 'orange',
  critical: 'red',
};

const BcfIssuesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<BcfTopic | null>(null);
  const [commentText, setCommentText] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<string>('issue');
  const [formPriority, setFormPriority] = useState<string>('normal');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const { data: topicData, isLoading } = useQuery({
    queryKey: ['bcf-topics'],
    queryFn: () => bimApi.getBcfTopics(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<BcfTopic>) => bimApi.createBcfTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bcf-topics'] });
      toast.success(t('bim.bcfTopicCreated'));
      resetForm();
      setShowCreateModal(false);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ topicId, text }: { topicId: string; text: string }) =>
      bimApi.addBcfComment(topicId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bcf-topics'] });
      toast.success(t('bim.bcfCommentAdded'));
      setCommentText('');
    },
  });

  const resetForm = () => {
    setFormTitle('');
    setFormType('issue');
    setFormPriority('normal');
    setFormDescription('');
    setFormAssignedTo('');
    setFormDueDate('');
  };

  const topics = topicData?.content ?? [];

  const getTypeLabels = (): Record<string, string> => ({
    issue: t('bim.bcfTypeIssue'),
    request: t('bim.bcfTypeRequest'),
    comment: t('bim.bcfTypeComment'),
    solution: t('bim.bcfTypeSolution'),
  });

  const getStatusLabels = (): Record<string, string> => ({
    open: t('bim.bcfStatusOpen'),
    in_progress: t('bim.bcfStatusInProgress'),
    resolved: t('bim.bcfStatusResolved'),
    closed: t('bim.bcfStatusClosed'),
  });

  const getPriorityLabels = (): Record<string, string> => ({
    low: t('bim.bcfPriorityLow'),
    normal: t('bim.bcfPriorityNormal'),
    high: t('bim.bcfPriorityHigh'),
    critical: t('bim.bcfPriorityCritical'),
  });

  const filtered = useMemo(() => {
    let result = topics;
    if (statusFilter) result = result.filter((topic) => topic.status === statusFilter);
    if (priorityFilter) result = result.filter((topic) => topic.priority === priorityFilter);
    if (typeFilter) result = result.filter((topic) => topic.topicType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (topic) =>
          topic.topicNumber.toLowerCase().includes(lower) ||
          topic.title.toLowerCase().includes(lower) ||
          topic.assignedTo.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [topics, statusFilter, priorityFilter, typeFilter, search]);

  const totalCount = topics.length;
  const openCount = topics.filter(
    (topic) => topic.status === 'open' || topic.status === 'in_progress',
  ).length;
  const resolvedCount = topics.filter((topic) => topic.status === 'resolved').length;
  const criticalCount = topics.filter(
    (topic) =>
      topic.priority === 'critical' &&
      topic.status !== 'resolved' &&
      topic.status !== 'closed',
  ).length;

  const columns = useMemo<ColumnDef<BcfTopic, unknown>[]>(() => {
    const typeLabels = getTypeLabels();
    const statusLabels = getStatusLabels();
    const priorityLabels = getPriorityLabels();
    return [
      {
        accessorKey: 'topicNumber',
        header: '#',
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('bim.bcfColTitle'),
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.title}
            </p>
            {row.original.comments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400 mt-0.5">
                <MessageSquare size={10} />
                {row.original.comments.length}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'topicType',
        header: t('bim.bcfColType'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={topicTypeColorMap}
            label={typeLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('bim.bcfColStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={topicStatusColorMap}
            label={statusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('bim.bcfColPriority'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={topicPriorityColorMap}
            label={priorityLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'assignedTo',
        header: t('bim.bcfColAssignedTo'),
        size: 140,
        cell: ({ getValue }) =>
          getValue<string>() || (
            <span className="text-neutral-400">{t('bim.notAssigned')}</span>
          ),
      },
      {
        accessorKey: 'createdDate',
        header: t('bim.bcfColCreated'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('bim.bcfColDueDate'),
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return val ? (
            <span className="tabular-nums">{formatDate(val)}</span>
          ) : (
            <span className="text-neutral-400">--</span>
          );
        },
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    if (!formTitle.trim()) return;
    createMutation.mutate({
      title: formTitle,
      topicType: formType as BcfTopic['topicType'],
      priority: formPriority as BcfTopic['priority'],
      description: formDescription,
      assignedTo: formAssignedTo,
      dueDate: formDueDate || undefined,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.bcfTitle')}
        subtitle={t('bim.bcfSubtitle', { count: String(totalCount) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.bcfBreadcrumb') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<Upload size={16} />}
              onClick={() => toast.success(t('bim.bcfImportToast'))}
            >
              {t('bim.bcfImport')}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<Download size={16} />}
              onClick={() => toast.success(t('bim.bcfExportToast'))}
            >
              {t('bim.bcfExport')}
            </Button>
            <Button
              variant="primary"
              iconLeft={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              {t('bim.bcfCreateTopic')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<MessageSquare size={18} />}
          label={t('bim.bcfMetricTotal')}
          value={totalCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<MessageSquare size={18} />}
          label={t('bim.bcfMetricOpen')}
          value={openCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<MessageSquare size={18} />}
          label={t('bim.bcfMetricResolved')}
          value={resolvedCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<MessageSquare size={18} />}
          label={t('bim.bcfMetricCritical')}
          value={criticalCount}
          loading={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('bim.bcfSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('bim.bcfFilterAllStatuses') },
            ...Object.entries(getStatusLabels()).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: t('bim.bcfFilterAllPriorities') },
            ...Object.entries(getPriorityLabels()).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: t('bim.bcfFilterAllTypes') },
            ...Object.entries(getTypeLabels()).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable<BcfTopic>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        onRowClick={(row) => setSelectedTopic(row)}
        emptyTitle={t('bim.bcfEmptyTitle')}
        emptyDescription={t('bim.bcfEmptyDescription')}
      />

      {/* Create Topic Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={t('bim.bcfCreateModalTitle')}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!formTitle.trim()}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('bim.bcfFormTitle')} required>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t('bim.bcfFormTitlePlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('bim.bcfFormType')}>
              <Select
                options={Object.entries(getTypeLabels()).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
            </FormField>
            <FormField label={t('bim.bcfFormPriority')}>
              <Select
                options={Object.entries(getPriorityLabels()).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label={t('bim.bcfFormDescription')}>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={t('bim.bcfFormDescriptionPlaceholder')}
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('bim.bcfFormAssignedTo')}>
              <Input
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
                placeholder={t('bim.bcfFormAssignedToPlaceholder')}
              />
            </FormField>
            <FormField label={t('bim.bcfFormDueDate')}>
              <Input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Topic Detail Modal */}
      <Modal
        open={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        title={selectedTopic?.title ?? ''}
        description={`#${selectedTopic?.topicNumber ?? ''}`}
        size="lg"
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('bim.bcfColType')}
                </p>
                <StatusBadge
                  status={selectedTopic.topicType}
                  colorMap={topicTypeColorMap}
                  label={getTypeLabels()[selectedTopic.topicType]}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('bim.bcfColStatus')}
                </p>
                <StatusBadge
                  status={selectedTopic.status}
                  colorMap={topicStatusColorMap}
                  label={getStatusLabels()[selectedTopic.status]}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('bim.bcfColPriority')}
                </p>
                <StatusBadge
                  status={selectedTopic.priority}
                  colorMap={topicPriorityColorMap}
                  label={getPriorityLabels()[selectedTopic.priority]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <User size={14} />
                <span>{selectedTopic.assignedTo || t('bim.notAssigned')}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Calendar size={14} />
                <span>
                  {selectedTopic.dueDate
                    ? formatDate(selectedTopic.dueDate)
                    : t('bim.bcfNoDueDate')}
                </span>
              </div>
            </div>

            {selectedTopic.description && (
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {selectedTopic.description}
                </p>
              </div>
            )}

            {/* Comments thread */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                {t('bim.bcfComments')} ({selectedTopic.comments.length})
              </h4>
              <div className="space-y-3 max-h-[30vh] overflow-y-auto mb-3">
                {selectedTopic.comments.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                    {t('bim.bcfNoComments')}
                  </p>
                ) : (
                  selectedTopic.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {comment.author}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {formatDateTime(comment.date)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('bim.bcfCommentPlaceholder')}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      addCommentMutation.mutate({
                        topicId: selectedTopic.id,
                        text: commentText.trim(),
                      });
                    }
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<Send size={14} />}
                  onClick={() => {
                    if (commentText.trim()) {
                      addCommentMutation.mutate({
                        topicId: selectedTopic.id,
                        text: commentText.trim(),
                      });
                    }
                  }}
                  loading={addCommentMutation.isPending}
                  disabled={!commentText.trim()}
                >
                  {t('bim.bcfSendComment')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BcfIssuesPage;
