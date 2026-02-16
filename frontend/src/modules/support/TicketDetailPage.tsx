import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Clock, User, Tag, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { FormField, Textarea, Select } from '@/design-system/components/FormField';
import { supportApi } from '@/api/support';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/format';
import type { SupportTicket, TicketStatus } from './types';
import toast from 'react-hot-toast';

const ticketStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  OPEN: 'blue',
  ASSIGNED: 'cyan',
  IN_PROGRESS: 'orange',
  WAITING_RESPONSE: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const ticketStatusLabels: Record<string, string> = {
  OPEN: 'Открыта',
  ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе',
  WAITING_RESPONSE: 'Ожидание ответа',
  RESOLVED: 'Решена',
  CLOSED: 'Закрыта',
};

const ticketPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const ticketPriorityLabels: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

const categoryLabels: Record<string, string> = {
  TECHNICAL: 'Техническая',
  ACCESS: 'Доступ',
  DOCUMENTS: 'Документы',
  EQUIPMENT: 'Оборудование',
  SAFETY: 'Безопасность',
  SCHEDULE: 'График',
  OTHER: 'Прочее',
};

const statusOptions = [
  { value: 'OPEN', label: 'Открыта' },
  { value: 'ASSIGNED', label: 'Назначена' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'WAITING_RESPONSE', label: 'Ожидание ответа' },
  { value: 'RESOLVED', label: 'Решена' },
  { value: 'CLOSED', label: 'Закрыта' },
];

function categoryLabel(value?: string): string {
  if (!value) return '—';
  return categoryLabels[value] ?? value;
}

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const {
    data: ticket,
    isLoading: ticketLoading,
    isError: ticketError,
    refetch: refetchTicket,
  } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: () => supportApi.getTicket(id!),
    enabled: Boolean(id),
  });

  const {
    data: comments = [],
    isError: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['support-ticket-comments', id],
    queryFn: () => supportApi.getTicketComments(id!),
    enabled: Boolean(id),
  });

  const addCommentMutation = useMutation({
    mutationFn: (payload: { content: string; isInternal: boolean }) => supportApi.addTicketComment(id!, {
      authorId: currentUser?.id,
      content: payload.content,
      isInternal: payload.isInternal,
    }),
    onSuccess: async () => {
      toast.success('Комментарий добавлен');
      setNewComment('');
      setIsInternal(false);
      await queryClient.invalidateQueries({ queryKey: ['support-ticket-comments', id] });
    },
    onError: () => {
      toast.error('Не удалось добавить комментарий');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => {
      if (!id || !ticket) {
        throw new Error('Заявка не загружена');
      }

      if (status === 'ASSIGNED' && !ticket.assignedToId) {
        throw new Error('Нельзя назначить заявку без исполнителя');
      }

      return supportApi.changeTicketStatus(id, status, {
        assigneeId: ticket.assignedToId,
      });
    },
    onSuccess: async () => {
      toast.success('Статус обновлен');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support-ticket', id] }),
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['support-dashboard'] }),
      ]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Не удалось обновить статус';
      toast.error(message);
    },
  });

  const handleAddComment = () => {
    const content = newComment.trim();
    if (!content) return;
    addCommentMutation.mutate({ content, isInternal });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    statusMutation.mutate(newStatus);
  };

  if (!id) {
    return (
      <EmptyState
        variant="ERROR"
        title="Некорректный идентификатор заявки"
        description="Откройте заявку из списка и попробуйте снова"
      />
    );
  }

  if (ticketError && !ticket) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Заявка поддержки"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Поддержка', href: '/support/tickets' },
          ]}
          actions={(
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/support/tickets')}>
              Назад к списку
            </Button>
          )}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить заявку"
          description="Проверьте соединение и повторите загрузку"
          actionLabel="Повторить"
          onAction={() => { void refetchTicket(); }}
        />
      </div>
    );
  }

  const currentTicket: SupportTicket | undefined = ticket;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={currentTicket ? `${currentTicket.number}: ${currentTicket.subject}` : 'Заявка поддержки'}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Поддержка', href: '/support/tickets' },
          { label: currentTicket?.number ?? 'Карточка заявки' },
        ]}
        actions={(
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/support/tickets')}>
            Назад к списку
          </Button>
        )}
      />

      {ticketLoading && !currentTicket ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-sm text-neutral-500 dark:text-neutral-400">
          Загрузка заявки...
        </div>
      ) : !currentTicket ? (
        <EmptyState
          variant="ERROR"
          title="Заявка не найдена"
          description="Проверьте ссылку или перейдите в список заявок"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Описание</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{currentTicket.description}</p>
            </div>

            {currentTicket.resolvedDate && (
              <div className="bg-success-50 rounded-xl border border-success-200 p-6">
                <h3 className="text-sm font-semibold text-success-800 mb-2">Заявка закрыта/решена</h3>
                <p className="text-sm text-success-700">
                  Дата решения: {formatDateTime(currentTicket.resolvedDate)}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Комментарии ({comments.length})
              </h3>

              {commentsError && (
                <div className="mb-4 text-sm text-danger-600">
                  Не удалось загрузить комментарии.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => { void refetchComments(); }}
                  >
                    Повторить
                  </button>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg p-4 ${comment.isInternal ? 'bg-warning-50 border border-warning-200' : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-semibold text-primary-700">
                          {(comment.authorName ?? comment.authorId ?? 'U')
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {comment.authorName ?? comment.authorId ?? 'Неизвестный пользователь'}
                        </span>
                        {comment.isInternal && (
                          <span className="text-[10px] font-medium text-warning-700 bg-warning-100 px-1.5 py-0.5 rounded">
                            Внутренний
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Комментариев пока нет.</p>
                )}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <FormField label="Добавить комментарий">
                  <Textarea
                    placeholder="Введите комментарий..."
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    rows={3}
                  />
                </FormField>
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(event) => setIsInternal(event.target.checked)}
                      className="rounded border-neutral-300 dark:border-neutral-600"
                    />
                    Внутренний комментарий
                  </label>
                  <Button
                    size="sm"
                    iconLeft={<Send size={14} />}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    loading={addCommentMutation.isPending}
                  >
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Информация</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Статус</span>
                  <StatusBadge
                    status={currentTicket.status}
                    colorMap={ticketStatusColorMap}
                    label={ticketStatusLabels[currentTicket.status] ?? currentTicket.statusDisplayName ?? currentTicket.status}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Приоритет</span>
                  <StatusBadge
                    status={currentTicket.priority}
                    colorMap={ticketPriorityColorMap}
                    label={ticketPriorityLabels[currentTicket.priority] ?? currentTicket.priorityDisplayName ?? currentTicket.priority}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Категория</span>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{categoryLabel(currentTicket.category)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детали</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Заявитель</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentTicket.requesterName ?? currentTicket.requesterId ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Исполнитель</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentTicket.assignedToName ?? currentTicket.assignedToId ?? 'Не назначен'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarClock size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Срок</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDate(currentTicket.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Создана</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDateTime(currentTicket.createdAt)}</p>
                  </div>
                </div>
                {currentTicket.resolvedDate && (
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Решена</p>
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDateTime(currentTicket.resolvedDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Действия</h3>
              <FormField label="Изменить статус">
                <Select
                  options={statusOptions}
                  value={currentTicket.status}
                  onChange={(event) => handleStatusChange(event.target.value as TicketStatus)}
                  disabled={statusMutation.isPending}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;
