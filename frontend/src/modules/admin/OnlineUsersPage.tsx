import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Monitor, Clock, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { t } from '@/i18n';
import { adminApi, type OnlineSession } from '@/api/admin';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import toast from 'react-hot-toast';

interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

function parseUserAgent(ua?: string): string {
  if (!ua) return t('admin.onlineUsers.unknownBrowser');
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 40);
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  if (!f && !l) return '?';
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}

/** Embeddable content component (no PageHeader) */
export const OnlineUsersContent: React.FC = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const { data: sessions = [], isLoading, refetch } = useQuery<OnlineSession[]>({
    queryKey: ['online-sessions'],
    queryFn: adminApi.getOnlineSessions,
    refetchInterval: 15000,
  });

  // Fetch all users to resolve session userId → display name
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      try {
        const { apiClient } = await import('@/api/client');
        const response = await apiClient.get('/users', { params: { size: 500 }, _silentErrors: true } as any);
        const data = response.data;
        if (data?.content) return data.content as UserInfo[];
        if (Array.isArray(data)) return data as UserInfo[];
      } catch { /* ignore */ }
      return [] as UserInfo[];
    },
    staleTime: 60000,
  });

  const userMap = useMemo(() => {
    const map = new Map<string, UserInfo>();
    for (const u of usersData ?? []) {
      map.set(u.id, u);
    }
    return map;
  }, [usersData]);

  const terminateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.terminateUserSessions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-sessions'] });
      toast.success(t('admin.onlineUsers.toastSessionTerminated'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const handleTerminate = async (session: OnlineSession) => {
    const user = userMap.get(session.userId);
    const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : session.userId.slice(0, 8);
    const confirmed = await confirm({
      title: t('admin.onlineUsers.confirmTerminateTitle'),
      description: t('admin.onlineUsers.confirmTerminateDesc', { name: displayName }),
      confirmLabel: t('admin.onlineUsers.terminate'),
      confirmVariant: 'danger',
    });
    if (confirmed) {
      terminateMutation.mutate(session.userId);
    }
  };

  const activeSessions = sessions.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} />} onClick={() => refetch()}>
          {t('common.refresh')}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-success-50 dark:bg-success-500/10">
            <Wifi className="h-5 w-5 text-success-600 dark:text-success-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{activeSessions.length}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.onlineUsers.onlineNow')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10">
            <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {new Set(activeSessions.map((s) => s.userId)).size}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.onlineUsers.uniqueUsers')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <WifiOff className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {sessions.filter((s) => !s.isActive).length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.onlineUsers.inactive')}</p>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('admin.onlineUsers.emptyState')}</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {activeSessions.map((session) => {
              const user = userMap.get(session.userId);
              const displayName = user
                ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
                : session.userId.slice(0, 8) + '...';
              const initials = user
                ? getInitials(user.firstName, user.lastName)
                : session.userId.slice(0, 2).toUpperCase();

              return (
                <div key={session.id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-semibold">
                      {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-500 border-2 border-white dark:border-neutral-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {displayName}
                    </p>
                    {user?.email && user.email !== displayName && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Monitor size={11} /> {parseUserAgent(session.userAgent)}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">IP: {session.ipAddress ?? '—'}</span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                        <Clock size={11} /> {formatRelativeTime(session.lastActivityAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{t('admin.onlineUsers.sessionStart')}: {formatDateTime(session.startedAt)}</p>
                    <Button
                      size="xs"
                      variant="danger"
                      iconLeft={<LogOut size={12} />}
                      onClick={() => handleTerminate(session)}
                      disabled={terminateMutation.isPending}
                    >
                      {t('admin.onlineUsers.terminate')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/** Standalone page with PageHeader (direct route access) */
const OnlineUsersPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('admin.onlineUsers.title')}
        subtitle={t('admin.onlineUsers.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('admin.onlineUsers.title') },
        ]}
      />
      <OnlineUsersContent />
    </div>
  );
};

export default OnlineUsersPage;
