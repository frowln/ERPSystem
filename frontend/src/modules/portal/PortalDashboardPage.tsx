import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen,
  FileText,
  MessageSquare,
  Users,
  Activity,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { portalApi } from '@/api/portal';
import { formatRelativeTime, formatPercent, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { PortalProject, PortalDocument, PortalMessage } from './types';

const PortalDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: projectData } = useQuery({
    queryKey: ['portal-projects'],
    queryFn: () => portalApi.getProjects(),
  });

  const { data: docData } = useQuery({
    queryKey: ['portal-documents-recent'],
    queryFn: () => portalApi.getDocuments({ size: 5 }),
  });

  const { data: msgData } = useQuery({
    queryKey: ['portal-messages-recent'],
    queryFn: () => portalApi.getMessages({ size: 5 }),
  });

  const projects = projectData?.content ?? [];
  const documents = docData?.content ?? [];
  const messages = msgData?.content ?? [];

  const metrics = useMemo(() => ({
    totalProjects: projects.length,
    totalDocuments: documents.length,
    unreadMessages: messages.filter((m) => m.status === 'SENT').length,
    activeUsers: 8,
  }), [projects, documents, messages]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.dashboard.title')}
        subtitle={t('portal.dashboard.subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal') },
        ]}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FolderOpen size={18} />} label={t('portal.dashboard.metricProjects')} value={metrics.totalProjects} />
        <MetricCard icon={<FileText size={18} />} label={t('portal.dashboard.metricDocuments')} value={metrics.totalDocuments} />
        <MetricCard
          icon={<MessageSquare size={18} />}
          label={t('portal.dashboard.metricUnread')}
          value={metrics.unreadMessages}
          trend={metrics.unreadMessages > 0 ? { direction: 'up', value: t('portal.dashboard.trendNew') } : undefined}
        />
        <MetricCard icon={<Users size={18} />} label={t('portal.dashboard.metricUsers')} value={metrics.activeUsers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects summary */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('portal.dashboard.sectionProjects')}</h3>
            <Button variant="ghost" size="xs" onClick={() => navigate('/portal/projects')}>
              {t('portal.dashboard.allProjects')} <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                onClick={() => navigate('/portal/projects')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.code} / {p.managerName}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatPercent(p.progress)}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('portal.dashboard.progressLabel')}</p>
                  </div>
                  <div className="w-24 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${Math.min(p.progress, 100)}%` }}
                    />
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{formatMoneyCompact(p.spentAmount)}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('portal.dashboard.ofBudget', { budget: formatMoneyCompact(p.budget) })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent documents */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('portal.dashboard.sectionRecentDocs')}</h3>
              <Button variant="ghost" size="xs" onClick={() => navigate('/portal/documents')}>
                {t('portal.dashboard.allDocs')} <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {documents.slice(0, 4).map((doc) => (
                <div key={doc.id} className="flex items-start gap-3">
                  <FileText size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{doc.title}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{doc.projectName} / {formatRelativeTime(doc.sharedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent messages */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('portal.dashboard.sectionRecentMessages')}</h3>
              <Button variant="ghost" size="xs" onClick={() => navigate('/portal/messages')}>
                {t('portal.dashboard.allMessages')} <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {messages.slice(0, 4).map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${msg.status === 'SENT' ? 'bg-primary-500' : 'bg-neutral-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{msg.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{msg.senderName}</span>
                      <Clock size={10} />
                      <span>{formatRelativeTime(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('portal.dashboard.sectionQuickActions')}</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => navigate('/portal/messages')}>
                <MessageSquare size={14} className="mr-2" /> {t('portal.dashboard.actionSendMessage')}
              </Button>
              <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => navigate('/portal/documents')}>
                <FileText size={14} className="mr-2" /> {t('portal.dashboard.actionViewDocuments')}
              </Button>
              <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => navigate('/portal/admin')}>
                <Activity size={14} className="mr-2" /> {t('portal.dashboard.actionManageAccess')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboardPage;
