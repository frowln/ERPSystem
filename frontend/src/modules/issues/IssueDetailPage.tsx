import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Clock, User, Tag, Building2, Link2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  issueStatusColorMap,
  issueStatusLabels,
  issueTypeColorMap,
  issueTypeLabels,
  issuePriorityColorMap,
  issuePriorityLabels,
} from '@/design-system/components/StatusBadge';
import { FormField, Textarea, Select } from '@/design-system/components/FormField';
import { issuesApi } from '@/api/issues';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import type { Issue, IssueComment } from './types';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

const getStatusOptions = () => [
  { value: 'OPEN', label: t('issuesPage.detail.statusOpen') },
  { value: 'IN_PROGRESS', label: t('issuesPage.detail.statusInProgress') },
  { value: 'RESOLVED', label: t('issuesPage.detail.statusResolved') },
  { value: 'CLOSED', label: t('issuesPage.detail.statusClosed') },
  { value: 'REOPENED', label: t('issuesPage.detail.statusReopened') },
];

const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [newComment, setNewComment] = useState('');

  const { data: issue, isLoading } = useQuery<Issue>({
    queryKey: ['issue', id],
    queryFn: () => issuesApi.getIssue(id!),
    enabled: !!id,
  });

  const { data: comments, refetch: refetchComments } = useQuery<IssueComment[]>({
    queryKey: ['issue-comments', id],
    queryFn: () => issuesApi.getIssueComments(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => issuesApi.changeStatus(id!, status as Issue['status']),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(t('issuesPage.detail.toastStatusChanged', { status: '' }));
    },
    onError: () => {
      toast.error(t('issuesPage.detail.toastStatusError'));
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) =>
      issuesApi.addIssueComment(id!, {
        authorId: user?.id ?? '',
        commentText: text,
      }),
    onSuccess: () => {
      refetchComments();
      toast.success(t('issuesPage.detail.toastCommentAdded'));
      setNewComment('');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (isLoading || !issue) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.loading')}</div>;
  }

  const currentIssue = issue;
  const currentComments = comments ?? [];

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  const handleStatusChange = (newStatus: string) => {
    statusMutation.mutate(newStatus);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${currentIssue.number}: ${currentIssue.title}`}
        breadcrumbs={[
          { label: t('issuesPage.detail.breadcrumbHome'), href: '/' },
          { label: t('issuesPage.detail.breadcrumbIssues'), href: '/pm/issues' },
          { label: currentIssue.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/pm/issues/${id}/edit`)}>
              {t('common.edit')}
            </Button>
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/pm/issues')}>
              {t('issuesPage.detail.backToList')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{t('issuesPage.detail.sectionDescription')}</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {currentIssue.description ?? t('issuesPage.detail.noDescription')}
            </p>
          </div>

          {/* Resolution */}
          {currentIssue.resolution && (
            <div className="bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800 p-6">
              <h3 className="text-sm font-semibold text-success-800 dark:text-success-200 mb-3">{t('issuesPage.detail.sectionResolution')}</h3>
              <p className="text-sm text-success-700 dark:text-success-300">{currentIssue.resolution}</p>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('issuesPage.detail.sectionComments')} ({currentComments.length})
            </h3>

            <div className="space-y-4 mb-6">
              {currentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-semibold text-primary-700 dark:text-primary-300">
                        {(comment.createdBy ?? 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{comment.createdBy ?? '---'}</span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatRelativeTime(comment.postedAt ?? comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{comment.commentText}</p>
                </div>
              ))}
              {currentComments.length === 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.noDescription')}</p>
              )}
            </div>

            {/* Add comment */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <FormField label={t('issuesPage.detail.addComment')}>
                <Textarea
                  placeholder={t('issuesPage.detail.commentPlaceholder')}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
              </FormField>
              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  iconLeft={<Send size={14} />}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  loading={commentMutation.isPending}
                >
                  {t('issuesPage.detail.sendButton')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('issuesPage.detail.sectionInfo')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelStatus')}</span>
                <StatusBadge
                  status={currentIssue.status}
                  colorMap={issueStatusColorMap}
                  label={issueStatusLabels[currentIssue.status]}
                />
              </div>
              {currentIssue.issueType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelType')}</span>
                  <StatusBadge
                    status={currentIssue.issueType}
                    colorMap={issueTypeColorMap}
                    label={issueTypeLabels[currentIssue.issueType]}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelPriority')}</span>
                <StatusBadge
                  status={currentIssue.priority}
                  colorMap={issuePriorityColorMap}
                  label={issuePriorityLabels[currentIssue.priority]}
                />
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('issuesPage.detail.sectionDetails')}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelAuthor')}</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentIssue.createdBy ?? '---'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelDueDate')}</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentIssue.dueDate ? formatDateTime(currentIssue.dueDate) : t('issuesPage.detail.notSet')}</p>
                </div>
              </div>
              {currentIssue.location && (
                <div className="flex items-start gap-2">
                  <Building2 size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('issues.location')}</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentIssue.location}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelCreated')}</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDateTime(currentIssue.createdAt)}</p>
                </div>
              </div>
              {(currentIssue.linkedRfiId || currentIssue.linkedSubmittalId) && (
                <div className="flex items-start gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <Link2 size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('issuesPage.detail.labelLinkedDocs')}</p>
                    {currentIssue.linkedRfiId && (
                      <p className="text-sm text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">RFI: {currentIssue.linkedRfiId}</p>
                    )}
                    {currentIssue.linkedSubmittalId && (
                      <p className="text-sm text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">Submittal: {currentIssue.linkedSubmittalId}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('issuesPage.detail.sectionActions')}</h3>
            <div className="space-y-3">
              <FormField label={t('issuesPage.detail.changeStatus')}>
                <Select
                  options={getStatusOptions()}
                  value={currentIssue.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusMutation.isPending}
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
