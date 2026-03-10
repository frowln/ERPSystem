import React, { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncItemStatus = 'pending' | 'syncing' | 'synced' | 'conflict';
type EntityType = 'Task' | 'Defect' | 'Movement' | 'Report' | 'Invoice';
type ActionType = 'create' | 'update' | 'delete';
type SyncHistoryStatus = 'success' | 'failure';

interface PendingChange {
  id: string;
  entityType: EntityType;
  entityName: string;
  action: ActionType;
  timestamp: string;
  status: SyncItemStatus;
  fields?: ConflictField[];
}

interface ConflictField {
  field: string;
  localValue: string;
  serverValue: string;
  resolution?: 'local' | 'server';
}

interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  itemsSynced: number;
  itemsFailed: number;
  status: SyncHistoryStatus;
  details: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PENDING: PendingChange[] = [
  {
    id: '1',
    entityType: 'Task',
    entityName: 'Монтаж опалубки 4-го этажа',
    action: 'update',
    timestamp: '2026-03-08T14:23:00',
    status: 'conflict',
    fields: [
      { field: 'status', localValue: 'В работе', serverValue: 'Завершена' },
      { field: 'progress', localValue: '75%', serverValue: '100%' },
      { field: 'assignee', localValue: 'Иванов А.В.', serverValue: 'Петров С.М.' },
    ],
  },
  {
    id: '2',
    entityType: 'Defect',
    entityName: 'Трещина в стене секции 3',
    action: 'create',
    timestamp: '2026-03-08T13:45:00',
    status: 'pending',
  },
  {
    id: '3',
    entityType: 'Movement',
    entityName: 'Арматура A500C d16 → Склад-2',
    action: 'create',
    timestamp: '2026-03-08T12:10:00',
    status: 'synced',
  },
  {
    id: '4',
    entityType: 'Task',
    entityName: 'Приёмка бетона серии №12',
    action: 'update',
    timestamp: '2026-03-08T11:30:00',
    status: 'syncing',
  },
  {
    id: '5',
    entityType: 'Report',
    entityName: 'Дневной отчёт 07.03.2026',
    action: 'create',
    timestamp: '2026-03-07T18:00:00',
    status: 'pending',
  },
  {
    id: '6',
    entityType: 'Defect',
    entityName: 'Отклонение уровня перекрытия',
    action: 'update',
    timestamp: '2026-03-07T16:20:00',
    status: 'conflict',
    fields: [
      { field: 'severity', localValue: 'Критический', serverValue: 'Серьёзный' },
      { field: 'description', localValue: 'Отклонение 15мм на участке A3', serverValue: 'Отклонение 12мм на участке A3 — уточнено геодезистом' },
    ],
  },
  {
    id: '7',
    entityType: 'Task',
    entityName: 'Геодезическая разбивка опоры №5',
    action: 'delete',
    timestamp: '2026-03-07T15:00:00',
    status: 'pending',
  },
];

const MOCK_HISTORY: SyncHistoryEntry[] = [
  { id: 'h1', timestamp: '2026-03-08T10:00:00', itemsSynced: 12, itemsFailed: 0, status: 'success', details: '12 изменений синхронизированы успешно' },
  { id: 'h2', timestamp: '2026-03-07T22:00:00', itemsSynced: 8, itemsFailed: 2, status: 'failure', details: '2 конфликта обнаружены — задачи #1, #6' },
  { id: 'h3', timestamp: '2026-03-07T14:00:00', itemsSynced: 5, itemsFailed: 0, status: 'success', details: '5 изменений синхронизированы успешно' },
  { id: 'h4', timestamp: '2026-03-06T18:00:00', itemsSynced: 20, itemsFailed: 1, status: 'failure', details: '1 ошибка при создании дефекта — повтор при следующей синхронизации' },
  { id: 'h5', timestamp: '2026-03-06T10:00:00', itemsSynced: 15, itemsFailed: 0, status: 'success', details: '15 изменений синхронизированы' },
];

// ---------------------------------------------------------------------------
// Status color maps
// ---------------------------------------------------------------------------

const syncStatusColorMap: Record<string, string> = {
  pending: 'yellow',
  syncing: 'blue',
  synced: 'green',
  conflict: 'red',
};

const historyStatusColorMap: Record<string, string> = {
  success: 'green',
  failure: 'red',
};

const actionLabelMap: Record<ActionType, string> = {
  create: 'settings.offlineSync.actionCreate',
  update: 'settings.offlineSync.actionUpdate',
  delete: 'settings.offlineSync.actionDelete',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Using formatDateTime from @/lib/format

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const OnlineIndicator: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <div className="flex items-center gap-2">
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-red-500',
      )}
    />
    <span className={cn('text-sm font-medium', isOnline ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
      {isOnline ? t('settings.offlineSync.statusOnline') : t('settings.offlineSync.statusOffline')}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Conflict Resolution Panel
// ---------------------------------------------------------------------------

interface ConflictPanelProps {
  item: PendingChange;
  onResolve: (itemId: string, fields: ConflictField[]) => void;
}

const ConflictPanel: React.FC<ConflictPanelProps> = ({ item, onResolve }) => {
  const [fields, setFields] = useState<ConflictField[]>(
    () => (item.fields ?? []).map((f) => ({ ...f })),
  );

  const setResolution = useCallback((fieldIndex: number, resolution: 'local' | 'server') => {
    setFields((prev) => prev.map((f, i) => (i === fieldIndex ? { ...f, resolution } : f)));
  }, []);

  const acceptAllLocal = useCallback(() => {
    setFields((prev) => prev.map((f) => ({ ...f, resolution: 'local' })));
  }, []);

  const acceptAllServer = useCallback(() => {
    setFields((prev) => prev.map((f) => ({ ...f, resolution: 'server' })));
  }, []);

  const allResolved = fields.every((f) => f.resolution != null);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {item.entityName}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {item.entityType} &middot; {formatDateTime(item.timestamp)}
          </p>
        </div>
        <StatusBadge status="conflict" colorMap={syncStatusColorMap} />
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <Button size="xs" variant="outline" onClick={acceptAllLocal}>
          {t('settings.offlineSync.acceptAllMine')}
        </Button>
        <Button size="xs" variant="outline" onClick={acceptAllServer}>
          {t('settings.offlineSync.acceptAllServer')}
        </Button>
      </div>

      {/* Field-by-field comparison */}
      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div
            key={field.field}
            className="border border-neutral-100 dark:border-neutral-800 rounded-lg p-3"
          >
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-2 uppercase tracking-wider">
              {field.field}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Local version */}
              <label
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                  field.resolution === 'local'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
                )}
              >
                <input
                  type="radio"
                  name={`field-${item.id}-${idx}`}
                  checked={field.resolution === 'local'}
                  onChange={() => setResolution(idx, 'local')}
                  className="mt-0.5 accent-primary-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
                    {t('settings.offlineSync.yourVersion')}
                  </p>
                  <p className="text-xs text-neutral-900 dark:text-neutral-100 break-words">
                    {field.localValue}
                  </p>
                </div>
              </label>

              {/* Server version */}
              <label
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                  field.resolution === 'server'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
                )}
              >
                <input
                  type="radio"
                  name={`field-${item.id}-${idx}`}
                  checked={field.resolution === 'server'}
                  onChange={() => setResolution(idx, 'server')}
                  className="mt-0.5 accent-primary-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
                    {t('settings.offlineSync.serverVersion')}
                  </p>
                  <p className="text-xs text-neutral-900 dark:text-neutral-100 break-words">
                    {field.serverValue}
                  </p>
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="primary"
          disabled={!allResolved}
          onClick={() => onResolve(item.id, fields)}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {t('settings.offlineSync.resolve')}
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const OfflineSyncPage: React.FC = () => {
  const [isOnline] = useState(true); // mock: user is online
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(MOCK_PENDING);
  const [syncHistory] = useState<SyncHistoryEntry[]>(MOCK_HISTORY);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);

  // Settings state
  const [autoSyncInterval, setAutoSyncInterval] = useState<string>('15');
  const [syncOnReconnect, setSyncOnReconnect] = useState(true);
  const [syncTasks, setSyncTasks] = useState(true);
  const [syncDefects, setSyncDefects] = useState(true);
  const [syncMovements, setSyncMovements] = useState(true);
  const [syncReports, setSyncReports] = useState(false);

  // ---------------------------------------------------------------------------
  // Derived metrics
  // ---------------------------------------------------------------------------

  const pendingCount = useMemo(
    () => pendingChanges.filter((c) => c.status === 'pending').length,
    [pendingChanges],
  );
  const conflictCount = useMemo(
    () => pendingChanges.filter((c) => c.status === 'conflict').length,
    [pendingChanges],
  );
  const syncedCount = useMemo(
    () => pendingChanges.filter((c) => c.status === 'synced').length,
    [pendingChanges],
  );
  const lastSyncTime = useMemo(() => {
    if (syncHistory.length === 0) return '\u2014';
    return formatDateTime(syncHistory[0].timestamp);
  }, [syncHistory]);

  const syncProgress = useMemo(() => {
    if (pendingChanges.length === 0) return 100;
    return Math.round((syncedCount / pendingChanges.length) * 100);
  }, [pendingChanges, syncedCount]);

  // ---------------------------------------------------------------------------
  // Conflict items
  // ---------------------------------------------------------------------------

  const conflictItems = useMemo(
    () => pendingChanges.filter((c) => c.status === 'conflict'),
    [pendingChanges],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSyncNow = useCallback(() => {
    // Mock: mark all pending as synced
    setPendingChanges((prev) =>
      prev.map((c) => (c.status === 'pending' ? { ...c, status: 'synced' as SyncItemStatus } : c)),
    );
  }, []);

  const handleResolveConflict = useCallback((itemId: string, _fields: ConflictField[]) => {
    setPendingChanges((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, status: 'synced' as SyncItemStatus, fields: undefined } : c)),
    );
  }, []);

  const handleClearCache = useCallback(() => {
    setPendingChanges([]);
    setClearCacheModalOpen(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Breadcrumbs
  // ---------------------------------------------------------------------------

  const breadcrumbs = useMemo(
    () => [
      { label: t('settings.breadcrumbHome'), href: '/' },
      { label: t('settings.breadcrumbSettings'), href: '/settings' },
      { label: t('settings.offlineSync.title') },
    ],
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.offlineSync.title')}
        subtitle={t('settings.offlineSync.subtitle')}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-3">
            <OnlineIndicator isOnline={isOnline} />
            <Button variant="primary" onClick={handleSyncNow} disabled={!isOnline || pendingCount === 0}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {t('settings.offlineSync.syncNow')}
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label={t('settings.offlineSync.metricLastSync')}
          value={lastSyncTime}
        />
        <MetricCard
          icon={<ArrowRightLeft className="h-5 w-5" />}
          label={t('settings.offlineSync.metricPending')}
          value={pendingCount}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={t('settings.offlineSync.metricConflicts')}
          value={conflictCount}
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5" />}
          label={t('settings.offlineSync.metricSynced')}
          value={syncedCount}
        />
      </div>

      {/* Progress bar */}
      {pendingChanges.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('settings.offlineSync.syncProgress')}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {syncProgress}%
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pending Changes Queue */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('settings.offlineSync.pendingChanges')}
          </h3>
        </div>
        {pendingChanges.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('settings.offlineSync.noPending')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {change.entityType}
                    </span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {change.entityName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t(actionLabelMap[change.action])}
                    </span>
                    <span className="text-xs text-neutral-400">&middot;</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(change.timestamp)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={change.status} colorMap={syncStatusColorMap} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conflict Resolution Panel */}
      {conflictItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('settings.offlineSync.conflictResolution')}
            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              {conflictItems.length}
            </span>
          </h3>
          {conflictItems.map((item) => (
            <ConflictPanel key={item.id} item={item} onResolve={handleResolveConflict} />
          ))}
        </div>
      )}

      {/* Sync History */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('settings.offlineSync.syncHistory')}
          </h3>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {syncHistory.map((entry) => (
            <div key={entry.id}>
              <button
                onClick={() => setExpandedHistoryId((prev) => (prev === entry.id ? null : entry.id))}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
              >
                {expandedHistoryId === entry.id ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-900 dark:text-neutral-100">
                      {formatDateTime(entry.timestamp)}
                    </span>
                    <StatusBadge status={entry.status} colorMap={historyStatusColorMap} />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {t('settings.offlineSync.historySynced', { count: String(entry.itemsSynced) })}
                    {entry.itemsFailed > 0 && (
                      <span className="text-red-500 ml-2">
                        {t('settings.offlineSync.historyFailed', { count: String(entry.itemsFailed) })}
                      </span>
                    )}
                  </p>
                </div>
              </button>
              {expandedHistoryId === entry.id && (
                <div className="px-4 pb-3 pl-11">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2">
                    {entry.details}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-5">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('settings.offlineSync.settingsTitle')}
        </h3>

        {/* Auto-sync interval */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('settings.offlineSync.autoSyncInterval')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('settings.offlineSync.autoSyncIntervalHint')}
            </p>
          </div>
          <select
            value={autoSyncInterval}
            onChange={(e) => setAutoSyncInterval(e.target.value)}
            className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="5">{t('settings.offlineSync.interval5')}</option>
            <option value="15">{t('settings.offlineSync.interval15')}</option>
            <option value="30">{t('settings.offlineSync.interval30')}</option>
            <option value="manual">{t('settings.offlineSync.intervalManual')}</option>
          </select>
        </div>

        {/* Sync on reconnect */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('settings.offlineSync.syncOnReconnect')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('settings.offlineSync.syncOnReconnectHint')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={syncOnReconnect}
              onChange={(e) => setSyncOnReconnect(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        {/* Data to sync */}
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {t('settings.offlineSync.dataToSync')}
          </p>
          <div className="space-y-2">
            {[
              { label: t('settings.offlineSync.syncTasks'), checked: syncTasks, onChange: setSyncTasks },
              { label: t('settings.offlineSync.syncDefects'), checked: syncDefects, onChange: setSyncDefects },
              { label: t('settings.offlineSync.syncMovements'), checked: syncMovements, onChange: setSyncMovements },
              { label: t('settings.offlineSync.syncReports'), checked: syncReports, onChange: setSyncReports },
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.onChange(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-400"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear cache */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="danger" size="sm" onClick={() => setClearCacheModalOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t('settings.offlineSync.clearCache')}
          </Button>
        </div>
      </div>

      {/* Clear Cache Confirmation Modal */}
      <Modal
        open={clearCacheModalOpen}
        onClose={() => setClearCacheModalOpen(false)}
        title={t('settings.offlineSync.clearCacheConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('settings.offlineSync.clearCacheConfirmDescription')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setClearCacheModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleClearCache}>
              {t('settings.offlineSync.clearCacheConfirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OfflineSyncPage;
