import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  User,
  Calendar,
  FileText,
  Send,
  CheckCircle2,
  MessageSquare,
  Link2,
  DollarSign,
  CalendarClock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  rfiStatusColorMap,
  rfiStatusLabels,
  rfiPriorityColorMap,
  rfiPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Textarea } from '@/design-system/components/FormField';
import { rfiApi } from '@/api/rfi';
import { formatDateLong, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Rfi, RfiResponse, RfiStatus } from './types';
import toast from 'react-hot-toast';

const RfiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newResponse, setNewResponse] = useState('');

  const { data: rfi } = useQuery<Rfi>({
    queryKey: ['RFI', id],
    queryFn: () => rfiApi.getRfi(id!),
    enabled: !!id,
  });

  const { data: responses } = useQuery<RfiResponse[]>({
    queryKey: ['rfi-responses', id],
    queryFn: () => rfiApi.getRfiResponses(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: RfiStatus) => rfiApi.changeRfiStatus(id!, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['RFI', id], updated);
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      toast.success(t('rfi.statusChangeToast', { status: rfiStatusLabels[updated.status] ?? updated.status }));
    },
    onError: () => toast.error(t('rfi.statusChangeError')),
  });

  const responseMutation = useMutation({
    mutationFn: ({ content, isOfficial }: { content: string; isOfficial: boolean }) =>
      rfiApi.addRfiResponse(id!, content, isOfficial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfi-responses', id] });
      toast.success(t('rfi.detailResponseAdded'));
      setNewResponse('');
    },
    onError: () => toast.error(t('rfi.detailResponseError')),
  });

  const defaultRfi: Rfi = {
    id: id ?? '',
    number: '',
    subject: '',
    question: '',
    status: 'DRAFT',
    priority: 'NORMAL',
    projectId: '',
    projectName: '',
    createdByName: '',
    dueDate: '',
    distributionList: [],
    linkedDocumentIds: [],
    createdAt: '',
    updatedAt: '',
  };

  const r = rfi ?? defaultRfi;
  const rfiResponses = responses ?? [];

  const statusActions = useMemo(() => {
    switch (r.status) {
      case 'DRAFT': return [{ label: t('rfi.actionSend'), targetStatus: 'OPEN' as const }];
      case 'OPEN': return [{ label: t('rfi.actionAssign'), targetStatus: 'ASSIGNED' as const }];
      case 'ASSIGNED': return [{ label: t('rfi.actionAnswer'), targetStatus: 'ANSWERED' as const }];
      case 'ANSWERED': return [{ label: t('rfi.actionClose'), targetStatus: 'CLOSED' as const }];
      default: return [];
    }
  }, [r.status]);

  const handleSendResponse = (isOfficial: boolean) => {
    if (!newResponse.trim()) return;
    responseMutation.mutate({ content: newResponse.trim(), isOfficial });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={r.subject || t('rfi.breadcrumbRfi')}
        subtitle={r.number ? `${r.number} / ${r.projectName ?? ''}` : ''}
        backTo="/pm/rfis"
        breadcrumbs={[
          { label: t('rfi.breadcrumbHome'), href: '/' },
          { label: t('rfi.breadcrumbRfi'), href: '/pm/rfis' },
          { label: r.number || '...' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={r.isOverdue ? 'OVERDUE' : r.status}
              colorMap={rfiStatusColorMap}
              label={rfiStatusLabels[r.isOverdue ? 'OVERDUE' : r.status] ?? r.status}
              size="md"
            />
            <StatusBadge
              status={r.priority}
              colorMap={rfiPriorityColorMap}
              label={rfiPriorityLabels[r.priority] ?? r.priority}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate(action.targetStatus)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-500" />
              {t('rfi.detailQuestion')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {r.question || '—'}
            </div>
          </div>

          {/* Official answer */}
          {r.answer && (
            <div className="bg-success-50 dark:bg-success-950 rounded-xl border border-success-200 dark:border-success-800 p-6">
              <h3 className="text-sm font-semibold text-success-800 dark:text-success-200 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-600" />
                {t('rfi.detailOfficialAnswer')}
              </h3>
              <div className="text-sm text-success-900 dark:text-success-100 leading-relaxed whitespace-pre-wrap">
                {r.answer}
              </div>
              {r.answeredDate && (
                <p className="text-xs text-success-600 dark:text-success-400 mt-3">
                  {t('rfi.detailAnsweredAt', { date: formatDateLong(r.answeredDate) })}
                </p>
              )}
            </div>
          )}

          {/* Response thread */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('rfi.detailDiscussion', { count: String(rfiResponses.length) })}
            </h3>

            <div className="space-y-4 mb-6">
              {rfiResponses.map((resp) => (
                <div
                  key={resp.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    resp.isOfficial
                      ? 'bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800'
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300">
                        {(resp.authorName ?? '?').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{resp.authorName ?? resp.authorId}</span>
                      {resp.isOfficial && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 bg-primary-100 dark:bg-primary-900 dark:text-primary-300 px-1.5 py-0.5 rounded">
                          {t('rfi.detailOfficial')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatRelativeTime(resp.createdAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{resp.content}</p>
                </div>
              ))}
            </div>

            {/* New response input */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <Textarea
                placeholder={t('rfi.detailResponsePlaceholder')}
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<Send size={14} />}
                  onClick={() => handleSendResponse(false)}
                  disabled={!newResponse.trim() || responseMutation.isPending}
                >
                  {t('rfi.detailSend')}
                </Button>
                <Button
                  size="sm"
                  iconLeft={<CheckCircle2 size={14} />}
                  onClick={() => handleSendResponse(true)}
                  disabled={!newResponse.trim() || responseMutation.isPending}
                >
                  {t('rfi.detailSendOfficial')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('rfi.detailDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('rfi.detailCreatedBy')} value={r.createdByName ?? '---'} />
              <InfoItem icon={<User size={15} />} label={t('rfi.detailAssignee')} value={r.assignedToName ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label={t('rfi.detailCreatedAt')} value={formatDateLong(r.createdAt)} />
              <InfoItem icon={<Clock size={15} />} label={t('rfi.detailDueDate')} value={formatDateLong(r.dueDate)} />
              <InfoItem icon={<FileText size={15} />} label={t('rfi.detailSection')} value={r.specSection ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('rfi.detailProject')} value={r.projectName ?? '---'} />
              {r.costImpact !== undefined && (
                <InfoItem icon={<DollarSign size={15} />} label={t('rfi.detailCostImpact')} value={r.costImpact ? t('common.yes') : t('common.no')} />
              )}
              {r.scheduleImpact !== undefined && (
                <InfoItem icon={<CalendarClock size={15} />} label={t('rfi.detailScheduleImpact')} value={r.scheduleImpact ? t('common.yes') : t('common.no')} />
              )}
            </div>
          </div>

          {/* Distribution list */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('rfi.detailDistributionList')}</h3>
            {r.distributionList.length > 0 ? (
              <div className="space-y-2">
                {r.distributionList.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('rfi.detailDistributionEmpty')}</p>
            )}
          </div>

          {/* Linked documents */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('rfi.detailLinkedDocs')}
            </h3>
            {r.linkedDocumentIds.length > 0 ? (
              <div className="space-y-2">
                {r.linkedDocumentIds.map((docId) => (
                  <div
                    key={docId}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => navigate('/cde/documents')}
                  >
                    <FileText size={15} className="text-neutral-400" />
                    <span className="text-sm text-primary-600 hover:text-primary-700">
                      {t('rfi.detailDocument', { id: docId })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('rfi.detailNoLinkedDocs')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default RfiDetailPage;
