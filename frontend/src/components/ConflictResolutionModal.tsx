// =============================================================================
// PRIVOD NEXT -- Conflict Resolution Modal
// Shows when sync conflicts are detected after going online.
// Displays local vs server state side by side, with options:
//   - Keep Local: push local data to server (force overwrite)
//   - Keep Server: overwrite local record with server data
//   - Merge (manual): per-field resolution (pick local or server for each diff)
// Also provides a multi-conflict list view for navigating queued conflicts.
// =============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  GitMerge,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';
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

/**
 * Unflatten dot-separated key/value pairs back into a nested object.
 */
function unflattenObject(
  entries: Array<{ key: string; value: string }>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const { key, value } of entries) {
    const parts = key.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastPart = parts[parts.length - 1];
    try {
      current[lastPart] = JSON.parse(value);
    } catch {
      current[lastPart] = value;
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
// Merge field picker
// ---------------------------------------------------------------------------

interface MergeFieldRowProps {
  fieldKey: string;
  localValue: string;
  serverValue: string;
  choice: 'local' | 'server' | null;
  onChoose: (choice: 'local' | 'server') => void;
}

const MergeFieldRow: React.FC<MergeFieldRowProps> = ({
  fieldKey,
  localValue,
  serverValue,
  choice,
  onChoose,
}) => (
  <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-2">
    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
      {fieldKey}
    </p>
    <div className="grid grid-cols-2 gap-3">
      {/* Local */}
      <label
        className={cn(
          'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
          choice === 'local'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
        )}
      >
        <input
          type="radio"
          name={`merge-${fieldKey}`}
          checked={choice === 'local'}
          onChange={() => onChoose('local')}
          className="mt-0.5 accent-blue-600"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
            {t('offline.conflictLocalVersion')}
          </p>
          <p className="text-xs text-neutral-900 dark:text-neutral-100 break-words">
            {localValue}
          </p>
        </div>
      </label>
      {/* Server */}
      <label
        className={cn(
          'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
          choice === 'server'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
        )}
      >
        <input
          type="radio"
          name={`merge-${fieldKey}`}
          checked={choice === 'server'}
          onChange={() => onChoose('server')}
          className="mt-0.5 accent-emerald-600"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
            {t('offline.conflictServerVersion')}
          </p>
          <p className="text-xs text-neutral-900 dark:text-neutral-100 break-words">
            {serverValue}
          </p>
        </div>
      </label>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ConflictResolutionModalProps {
  conflict: SyncConflict | null;
  onClose: () => void;
  /** Index within the conflict queue (1-based), if shown from the list */
  currentIndex?: number;
  /** Total conflicts in queue */
  totalConflicts?: number;
  /** Navigate to prev/next conflict */
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onClose,
  currentIndex,
  totalConflicts,
  onNavigate,
}) => {
  const resolveConflict = useSyncQueue((s) => s.resolveConflict);
  const [resolving, setResolving] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'local' | 'server' | 'merge'>('local');

  // Per-field merge choices (key -> 'local' | 'server')
  const [mergeChoices, setMergeChoices] = useState<Record<string, 'local' | 'server'>>({});

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

  // Diffing fields for merge view
  const diffFields = useMemo(() => {
    const localMap = new Map(localFlat.map((e) => [e.key, e.value]));
    const serverMap = new Map(serverFlat.map((e) => [e.key, e.value]));
    const fields: Array<{ key: string; localValue: string; serverValue: string }> = [];

    for (const key of diffKeys) {
      fields.push({
        key,
        localValue: localMap.get(key) ?? '(absent)',
        serverValue: serverMap.get(key) ?? '(absent)',
      });
    }

    return fields;
  }, [diffKeys, localFlat, serverFlat]);

  // Check if all merge choices are made
  const allMergeResolved = useMemo(
    () => diffFields.every((f) => mergeChoices[f.key] != null),
    [diffFields, mergeChoices],
  );

  // -------------------------------------------------------------------------
  // Merge choice handlers
  // -------------------------------------------------------------------------

  const handleMergeChoice = useCallback((key: string, choice: 'local' | 'server') => {
    setMergeChoices((prev) => ({ ...prev, [key]: choice }));
  }, []);

  const handleMergeAllLocal = useCallback(() => {
    const choices: Record<string, 'local' | 'server'> = {};
    for (const f of diffFields) {
      choices[f.key] = 'local';
    }
    setMergeChoices(choices);
  }, [diffFields]);

  const handleMergeAllServer = useCallback(() => {
    const choices: Record<string, 'local' | 'server'> = {};
    for (const f of diffFields) {
      choices[f.key] = 'server';
    }
    setMergeChoices(choices);
  }, [diffFields]);

  // -------------------------------------------------------------------------
  // Build merged data from choices
  // -------------------------------------------------------------------------

  const buildMergedData = useCallback((): unknown => {
    const localMap = new Map(localFlat.map((e) => [e.key, e.value]));
    const serverMap = new Map(serverFlat.map((e) => [e.key, e.value]));

    // Start with all server fields as base
    const mergedEntries: Array<{ key: string; value: string }> = [];

    // Collect all unique keys
    const allKeys = new Set([...localMap.keys(), ...serverMap.keys()]);

    for (const key of allKeys) {
      if (diffKeys.has(key)) {
        // For diff fields, use the user's merge choice
        const choice = mergeChoices[key];
        if (choice === 'local') {
          const val = localMap.get(key);
          if (val !== undefined) mergedEntries.push({ key, value: val });
        } else {
          const val = serverMap.get(key);
          if (val !== undefined) mergedEntries.push({ key, value: val });
        }
      } else {
        // Non-diff fields: use whichever exists (they're the same)
        const val = localMap.get(key) ?? serverMap.get(key);
        if (val !== undefined) mergedEntries.push({ key, value: val });
      }
    }

    return unflattenObject(mergedEntries);
  }, [localFlat, serverFlat, diffKeys, mergeChoices]);

  // -------------------------------------------------------------------------
  // Resolution handlers
  // -------------------------------------------------------------------------

  const handleKeepLocal = useCallback(async () => {
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
  }, [conflict, resolveConflict, onClose]);

  const handleKeepServer = useCallback(async () => {
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
  }, [conflict, resolveConflict, onClose]);

  const handleMerge = useCallback(async () => {
    if (!conflict || !allMergeResolved) return;
    setResolving(true);
    try {
      const mergedData = buildMergedData();

      // Push merged data to the server
      await apiClient.put(`/${conflict.storeName}/${conflict.recordId}`, mergedData, {
        headers: { 'If-Match': '*' },
      });

      // Update local record with merged data
      const existing = await getRecord(conflict.storeName, conflict.recordId);
      if (existing) {
        await putRecord(conflict.storeName, {
          ...existing,
          data: mergedData,
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
  }, [conflict, allMergeResolved, buildMergedData, resolveConflict, onClose]);

  if (!conflict) return null;

  const showNav = currentIndex != null && totalConflicts != null && totalConflicts > 1;

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

          {/* Queue navigation */}
          {showNav && onNavigate && (
            <div className="flex items-center gap-1 mr-3">
              <button
                type="button"
                onClick={() => onNavigate('prev')}
                disabled={currentIndex <= 1}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  currentIndex <= 1
                    ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {t('offline.conflictQueuePosition', {
                  current: String(currentIndex),
                  total: String(totalConflicts),
                })}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('next')}
                disabled={currentIndex >= totalConflicts}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  currentIndex >= totalConflicts
                    ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {resolving && <Loader2 className="h-4 w-4 animate-spin text-neutral-400 mr-1" />}

          {selectedTab === 'local' && (
            <Button
              variant="primary"
              onClick={handleKeepLocal}
              disabled={resolving}
              loading={resolving}
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
              loading={resolving}
            >
              <ArrowRight className="h-4 w-4 mr-1.5" />
              {t('offline.conflictKeepServer')}
            </Button>
          )}
          {selectedTab === 'merge' && (
            <Button
              variant="primary"
              onClick={handleMerge}
              disabled={resolving || !allMergeResolved}
              loading={resolving}
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
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('offline.conflictWarning')}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
              {conflict.storeName} / {conflict.recordId}
            </p>
          </div>
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

        {/* Side-by-side comparison (local / server tabs) */}
        {(selectedTab === 'local' || selectedTab === 'server') && (
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
        )}

        {/* Merge view: per-field resolution */}
        {selectedTab === 'merge' && (
          <div className="space-y-3">
            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              <Button size="xs" variant="outline" onClick={handleMergeAllLocal}>
                {t('offline.conflictMergeAllLocal')}
              </Button>
              <Button size="xs" variant="outline" onClick={handleMergeAllServer}>
                {t('offline.conflictMergeAllServer')}
              </Button>
              {allMergeResolved && (
                <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('offline.conflictMergeReady')}
                </span>
              )}
              {!allMergeResolved && (
                <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
                  {t('offline.conflictMergeRemaining', {
                    count: String(diffFields.filter((f) => mergeChoices[f.key] == null).length),
                  })}
                </span>
              )}
            </div>

            {/* Field rows */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {diffFields.length === 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  {t('offline.conflictMergeNoDiffs')}
                </p>
              )}
              {diffFields.map((field) => (
                <MergeFieldRow
                  key={field.key}
                  fieldKey={field.key}
                  localValue={field.localValue}
                  serverValue={field.serverValue}
                  choice={mergeChoices[field.key] ?? null}
                  onChoose={(choice) => handleMergeChoice(field.key, choice)}
                />
              ))}
            </div>
          </div>
        )}
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
 * Supports navigating through conflicts as a queue (prev/next).
 */
export const ConflictListModal: React.FC<ConflictListModalProps> = ({ open, onClose }) => {
  const conflicts = useSyncQueue((s) => s.conflicts);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedConflict = selectedIndex !== null ? conflicts[selectedIndex] ?? null : null;

  const handleSelectConflict = useCallback((_conflict: SyncConflict, index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (selectedIndex === null) return;
      const newIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
      if (newIndex >= 0 && newIndex < conflicts.length) {
        setSelectedIndex(newIndex);
      }
    },
    [selectedIndex, conflicts.length],
  );

  if (selectedConflict) {
    return (
      <ConflictResolutionModal
        conflict={selectedConflict}
        onClose={handleCloseDetail}
        currentIndex={(selectedIndex ?? 0) + 1}
        totalConflicts={conflicts.length}
        onNavigate={handleNavigate}
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
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('offline.conflictListEmpty')}
            </p>
          </div>
        )}
        {conflicts.map((conflict, index) => (
          <button
            key={conflict.id}
            type="button"
            onClick={() => handleSelectConflict(conflict, index)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg',
              'bg-neutral-50 dark:bg-neutral-800',
              'border border-neutral-200 dark:border-neutral-700',
              'hover:bg-neutral-100 dark:hover:bg-neutral-700',
              'transition-colors text-left',
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {conflict.storeName} / {conflict.recordId}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('offline.conflictListVersionMismatch')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                {index + 1}/{conflicts.length}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};
