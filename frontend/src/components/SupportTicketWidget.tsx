import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, X, Send, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

interface TicketTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  defaultPriority: string;
  bodyTemplate?: string;
}

interface TicketListItem {
  id: string;
  code?: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

type TabKey = 'new' | 'my' | 'kb';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ASSIGNED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  WAITING_RESPONSE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
};

const SupportTicketWidget: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('new');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('');
  const [kbSearch, setKbSearch] = useState('');

  const { data: templates = [] } = useQuery<TicketTemplate[]>({
    queryKey: ['ticket-templates'],
    queryFn: async () => {
      const response = await apiClient.get<TicketTemplate[]>('/support/templates');
      return response.data;
    },
    enabled: isOpen,
  });

  const { data: myTickets = [] } = useQuery<TicketListItem[]>({
    queryKey: ['my-support-tickets'],
    queryFn: async () => {
      const response = await apiClient.get('/support/tickets/my');
      return (response.data as { content?: TicketListItem[] }).content ?? response.data ?? [];
    },
    enabled: isOpen && activeTab === 'my',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/support/tickets', { subject, description, priority, category: category || undefined });
    },
    onSuccess: () => {
      toast.success(t('supportWidget.created'));
      setSubject('');
      setDescription('');
      setActiveTab('my');
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: () => toast.error(t('supportWidget.createError')),
  });

  const selectTemplate = (tpl: TicketTemplate) => {
    setSubject(tpl.name);
    setDescription(tpl.bodyTemplate ?? '');
    setPriority(tpl.defaultPriority);
    setCategory(tpl.category ?? '');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all',
          isOpen
            ? 'bg-neutral-600 hover:bg-neutral-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-110',
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <LifeBuoy className="h-6 w-6" />}
      </button>

      {/* Slide-out panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[70vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('supportWidget.title')}</h3>
            <div className="flex gap-1 mt-3">
              {(['new', 'my', 'kb'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                    activeTab === tab
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  )}
                >
                  {tab === 'new' ? t('supportWidget.tabNew') : tab === 'my' ? t('supportWidget.tabMy') : t('supportWidget.tabKb')}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'new' && (
              <div className="space-y-4">
                {/* Templates */}
                {templates.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">{t('supportWidget.templates')}</p>
                    <div className="space-y-1.5">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => selectTemplate(tpl)}
                          className="w-full flex items-center gap-2 p-2.5 rounded-lg text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{tpl.name}</p>
                            {tpl.description && <p className="text-xs text-neutral-500 truncate">{tpl.description}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t('supportWidget.subject')}</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                    placeholder={t('supportWidget.subjectPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t('supportWidget.description')}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 resize-none"
                    placeholder={t('supportWidget.descriptionPlaceholder')}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t('supportWidget.priority')}</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="LOW">{t('support.priorityLow')}</option>
                      <option value="MEDIUM">{t('support.priorityMedium')}</option>
                      <option value="HIGH">{t('support.priorityHigh')}</option>
                      <option value="CRITICAL">{t('support.priorityCritical')}</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!subject || createMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {t('supportWidget.submit')}
                </button>
              </div>
            )}

            {activeTab === 'my' && (
              <div className="space-y-2">
                {myTickets.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400">
                    <LifeBuoy className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t('supportWidget.noTickets')}</p>
                  </div>
                ) : myTickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-1">
                      {ticket.code && <span className="text-xs font-mono text-neutral-400">{ticket.code}</span>}
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', statusColors[ticket.status] ?? statusColors.OPEN)}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{ticket.subject}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'kb' && (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                    placeholder={t('supportWidget.kbPlaceholder')}
                  />
                </div>
                <div className="text-center py-6 text-neutral-400">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('supportWidget.kbEmpty')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportTicketWidget;
