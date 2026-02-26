import React, { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, GitMerge, ChevronRight } from 'lucide-react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useSyncQueue, type SyncConflict } from '@/lib/syncQueue';
import { putRecord, getRecord } from '@/lib/offlineDb';
import { apiClient } from '@/api/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested object into dot-separated key paths.
 */
function flattenObject(
  obj: unknown,
  prefix = '',
): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];

  if (obj === null || obj === undefined) {
    result.push({ key: prefix || '(value)', value: String(obj) });
    return result;
  }

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    result.push({ key: prefix || '(value)', value: JSON.stringify(obj) });
    return result;
  }

  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenObject(v, fullKey));
    } else {
      result.push({ key: fullKey, value: JSON.stringify(v) });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DataColumnProps {
  label: string;
  data: Array<{ key: string; value: string }>;
  diffKeys: Set<string>;
  variant: 'local' | 'server';
}

const DataColumn: React.FC<DataColumnProps> = ({ label, data, diffKeys, variant }) => {
  const borderColor = variant === 'local'
    ? 'border-blue-300 dark:border-blue-700'
    : 'border-emerald-300 dark:border-emerald-700';
  const headerBg = variant === 'local'
    ? 'bg-blue-50 dark:bg-blue-900/30'
    : 'bg-emerald-50 dark:bg-emerald-900/30';

  return (
    <div className={cn('flex-1 border rounded-lg overflow-hidden', borderColor)}>
      <div className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-wide', headerBg, 'text-neutral-700 dark:text-neutral-300')}>
        {label}
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-64 overflow-y-auto">
        {data.map(({ key, value }) => (
          <div
            key={key}
            className={cn(
              'px-3 py-1.5 text-sm',
              diffKeys.has(key)
                ? 'bg-yellow-50 dark:bg-yellow-900/20 font-medium'
                : '',
            )}
          >
            <span className="text-neutral-500 dark:text-neutral-400 mr-1.5">{key}:</span>
            <span className="text-neutral-900 dark:text-neutral-100 break-all">{value}</span>
          </div>
        ))}
        {data.length === 0 && (
          <div className="px-3 py-3 text-sm text-neutral-400 dark:text-neutral-500 italic">
            {t('offline.conflictNoData')}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ConflictResolutionModalProps {
  conflict: SyncConflict | null;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onClose,
}) => {
  const resolveConflict = useSyncQueue((s) => s.resolveConflict);
  const [resolving, setResolving] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'local' | 'server' | 'merge'>('local');

  // Flatten both data sets for side-by-side comparison
  const localFlat = useMemo(
    () => (conflict ? flattenObject(conflict.localData) : []),
    [conflict],
  );
  const serverFlat = useMemo(
    () => (conflict ? flattenObject(conflict.serverData) : []),
    [conflict],
  );

  // Determine which keys differ
  const diffKeys = useMemo(() => {
    const localMap = new Map(localFlat.map((e) => [e.key, e.value]));
    const serverMap = new Map(serverFlat.map((e) => [e.key, e.value]));
    const diffs = new Set<string>();

    for (const [key, val] of localMap) {
      if (serverMap.get(key) !== val) diffs.add(key);
    }
    for (const key of serverMap.keys()) {
      if (!localMap.has(key)) diffs.add(key);
    }

    return diffs;
  }, [localFlat, serverFlat]);

  // -------------------------------------------------------------------------
  // Resolution handlers
  // -------------------------------------------------------------------------

  const handleKeepLocal = async () => {
    if (!conflict) return;
    setResolving(true);
    try {
      // Push local data to the server (force overwrite)
      await apiClient.put(`/${conflict.storeName}/${conflict.recordId}`, conflict.localData, {
        headers: { 'If-Match': '*' }, // Force overwrite
      });

      // Update local record
      const existing = await getRecord(conflict.storeName, conflict.recordId);
      if (existing) {
        await putRecord(conflict.storeName, {
          ...existing,
          syncStatus: 'synced',
          updatedAt: new Date().toISOString(),
        });
      }

      resolveConflict(conflict.id);
      onClose();
    } catch {
      // If push fails, the conflict stays for another attempt
    } finally {
      setResolving(false);
    }
  };

  const handleKeepServer = async () => {
    if (!conflict) return;
    setResolving(true);
    try {
      // Overwrite local record with server data
      const existing = await getRecord(conflict.storeName, conflict.recordId);
      if (existing) {
        await putRecord(conflict.storeName, {
          ...existing,
          data: conflict.serverData,
          syncStatus: 'synced',
          serverVersion: conflict.serverVersion,
          updatedAt: new Date().toISOString(),
        });
      }

      resolveConflict(conflict.id);
      onClose();
    } catch {
      // Keep conflict for retry
    } finally {
      setResolving(false);
    }
  };

  if (!conflict) return null;

  return (
    <Modal
      open={!!conflict}
      onClose={onClose}
      title={t('offline.conflictTitle')}
      description={t('offline.conflictDescription')}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={resolving}
          >
            {t('common.cancel')}
          </Button>
          <div className="flex-1" />
          {selectedTab === 'local' && (
            <Button
              variant="primary"
              onClick={handleKeepLocal}
              disabled={resolving}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t('offline.conflictKeepLocal')}
            </Button>
          )}
          {selectedTab === 'server' && (
            <Button
              variant="primary"
              onClick={handleKeepServer}
              disabled={resolving}
            >
              <ArrowRight className="h-4 w-4 mr-1.5" />
              {t('offline.conflictKeepServer')}
            </Button>
          )}
          {selectedTab === 'merge' && (
            <Button
              variant="primary"
              onClick={handleKeepLocal}
              disabled={resolving}
            >
              <GitMerge className="h-4 w-4 mr-1.5" />
              {t('offline.conflictMerge')}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t('offline.conflictWarning')}
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          {(['local', 'server', 'merge'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedTab === tab
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
              )}
            >
              {tab === 'local' && t('offline.conflictTabLocal')}
              {tab === 'server' && t('offline.conflictTabServer')}
              {tab === 'merge' && t('offline.conflictTabMerge')}
            </button>
          ))}
        </div>

        {/* Diff count */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('offline.conflictDiffCount', { count: String(diffKeys.size) })}
        </p>

        {/* Side-by-side comparison */}
        <div className="flex gap-3">
          <DataColumn
            label={t('offline.conflictLocalVersion')}
            data={localFlat}
            diffKeys={diffKeys}
            variant="local"
          />
          <DataColumn
            label={t('offline.conflictServerVersion')}
            data={serverFlat}
            diffKeys={diffKeys}
            variant="server"
          />
        </div>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Multi-conflict list modal
// ---------------------------------------------------------------------------

interface ConflictListModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Shows a list of all unresolved conflicts and lets the user drill into
 * each one using the ConflictResolutionModal.
 */
export const ConflictListModal: React.FC<ConflictListModalProps> = ({ open, onClose }) => {
  const conflicts = useSyncQueue((s) => s.conflicts);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  const handleSelectConflict = useCallback((conflict: SyncConflict) => {
    setSelectedConflict(conflict);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedConflict(null);
  }, []);

  if (selectedConflict) {
    return (
      <ConflictResolutionModal
        conflict={selectedConflict}
        onClose={handleCloseDetail}
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('offline.conflictListTitle')}
      description={t('offline.conflictListDescription', { count: String(conflicts.length) })}
      size="lg"
    >
      <div className="space-y-2">
        {conflicts.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
            {t('offline.conflictListEmpty')}
          </p>
        )}
        {conflicts.map((conflict) => (
          <button
            key={conflict.id}
            type="button"
            onClick={() => handleSelectConflict(conflict)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg',
              'bg-neutral-50 dark:bg-neutral-800',
              'border border-neutral-200 dark:border-neutral-700',
              'hover:bg-neutral-100 dark:hover:bg-neutral-750',
              'transition-colors text-left',
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {conflict.storeName} / {conflict.recordId}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('offline.conflictListVersionMismatch')}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </Modal>
  );
};
