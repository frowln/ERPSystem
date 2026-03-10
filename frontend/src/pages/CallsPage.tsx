import React, { useEffect, useMemo, useState } from 'react';
import { Phone, Video, PhoneCall, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { callsApi, type CallSession } from '@/api/calls';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';

const statusKeys: Record<string, string> = {
  RINGING: 'calls.statusRinging',
  ACTIVE: 'calls.statusActive',
  ENDED: 'calls.statusEnded',
  CANCELLED: 'calls.statusCancelled',
  MISSED: 'calls.statusMissed',
};

export default function CallsPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<CallSession[]>([]);
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const [all, active] = await Promise.all([callsApi.list(), callsApi.listActive()]);
      setHistory(all);
      setActiveCalls(active);
    } catch {
      toast.error(t('common.operationError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  const startCall = async (callType: 'AUDIO' | 'VIDEO') => {
    if (!user) return;
    setCreating(true);
    try {
      await callsApi.create({
        title: callType === 'VIDEO' ? t('calls.quickVideoCall') : t('calls.quickAudioCall'),
        callType,
        initiatorId: user.id,
        initiatorName: `${user.firstName} ${user.lastName}`,
      });
      await loadCalls();
    } catch {
      toast.error(t('common.operationError'));
    } finally {
      setCreating(false);
    }
  };

  const totalMinutes = useMemo(() => {
    return history.reduce((acc, item) => acc + Math.floor((item.durationSeconds ?? 0) / 60), 0);
  }, [history]);

  return (
    <div>
      <PageHeader
        title={t('calls.title')}
        subtitle={t('calls.subtitle')}
        breadcrumbs={[
          { label: t('calls.breadcrumbCommunications') },
          { label: t('calls.title') },
        ]}
        actions={(
          <>
            <Button
              variant="secondary"
              iconLeft={<Phone size={16} />}
              onClick={() => startCall('AUDIO')}
              loading={creating}
            >
              {t('calls.newAudioCall')}
            </Button>
            <Button
              iconLeft={<Video size={16} />}
              onClick={() => startCall('VIDEO')}
              loading={creating}
            >
              {t('calls.newVideoCall')}
            </Button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('calls.activeCalls')}</div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{activeCalls.length}</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('calls.totalCalls')}</div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{history.length}</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('calls.minutesInCalls')}</div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{totalMinutes}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('calls.callHistory')}
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {loading && (
            <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400">{t('calls.loading')}</div>
          )}
          {!loading && history.length === 0 && (
            <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400">{t('calls.noCalls')}</div>
          )}
          {!loading && history.map((call) => (
            <div key={call.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {call.title ?? t('calls.defaultCallTitle')}
                </div>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <PhoneCall size={12} />
                    {call.callType === 'VIDEO' ? t('calls.videoType') : t('calls.audioType')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    {Math.floor((call.durationSeconds ?? 0) / 60)} {t('calls.minutesShort')}
                  </span>
                  <span>{formatDateTime(call.createdAt)}</span>
                </div>
              </div>
              <span className="px-2 py-1 rounded-md text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {statusKeys[call.status] ? t(statusKeys[call.status]) : call.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
