import React, { useMemo } from 'react';
import { Plus, Minus, RefreshCw, Equal } from 'lucide-react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffRow {
  name: string;
  status: DiffStatus;
  currentQty?: number;
  previousQty?: number;
  currentUnit?: string;
  previousUnit?: string;
}

interface SpecVersionDiffModalProps {
  open: boolean;
  onClose: () => void;
  currentItems: { name: string; quantity?: number; unitOfMeasure?: string }[];
  previousItems: { name: string; quantity?: number; unitOfMeasure?: string }[];
  versions?: Array<{ id: string; name: string; version: number }>;
  onVersionChange?: (versionId: string) => void;
}

const statusConfig: Record<DiffStatus, { icon: React.ReactNode; bg: string; text: string; badge: string }> = {
  added: {
    icon: <Plus size={14} />,
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  },
  removed: {
    icon: <Minus size={14} />,
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  },
  changed: {
    icon: <RefreshCw size={14} />,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  },
  unchanged: {
    icon: <Equal size={14} />,
    bg: '',
    text: 'text-neutral-500 dark:text-neutral-400',
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
};

const statusLabel = (status: DiffStatus): string => {
  const map: Record<DiffStatus, string> = {
    added: t('specifications.diff.added'),
    removed: t('specifications.diff.removed'),
    changed: t('specifications.diff.changed'),
    unchanged: t('specifications.diff.unchanged'),
  };
  return map[status];
};

export const SpecVersionDiffModal: React.FC<SpecVersionDiffModalProps> = ({
  open,
  onClose,
  currentItems,
  previousItems,
  versions,
  onVersionChange,
}) => {
  const diffRows = useMemo<DiffRow[]>(() => {
    const rows: DiffRow[] = [];
    const prevMap = new Map<string, (typeof previousItems)[number]>();
    for (const item of previousItems) {
      prevMap.set(item.name.trim().toLowerCase(), item);
    }

    const matchedPrevKeys = new Set<string>();

    // Check current items against previous
    for (const cur of currentItems) {
      const key = cur.name.trim().toLowerCase();
      const prev = prevMap.get(key);

      if (!prev) {
        rows.push({
          name: cur.name,
          status: 'added',
          currentQty: cur.quantity,
          currentUnit: cur.unitOfMeasure,
        });
      } else {
        matchedPrevKeys.add(key);
        const qtyChanged = Math.abs((cur.quantity ?? 0) - (prev.quantity ?? 0)) > 0.001;
        const unitChanged = (cur.unitOfMeasure ?? '') !== (prev.unitOfMeasure ?? '');

        if (qtyChanged || unitChanged) {
          rows.push({
            name: cur.name,
            status: 'changed',
            currentQty: cur.quantity,
            previousQty: prev.quantity,
            currentUnit: cur.unitOfMeasure,
            previousUnit: prev.unitOfMeasure,
          });
        } else {
          rows.push({
            name: cur.name,
            status: 'unchanged',
            currentQty: cur.quantity,
            currentUnit: cur.unitOfMeasure,
          });
        }
      }
    }

    // Find removed items (in previous but not in current)
    for (const prev of previousItems) {
      const key = prev.name.trim().toLowerCase();
      if (!matchedPrevKeys.has(key)) {
        rows.push({
          name: prev.name,
          status: 'removed',
          previousQty: prev.quantity,
          previousUnit: prev.unitOfMeasure,
        });
      }
    }

    return rows;
  }, [currentItems, previousItems]);

  const summary = useMemo(() => {
    let added = 0, removed = 0, changed = 0;
    for (const row of diffRows) {
      if (row.status === 'added') added++;
      else if (row.status === 'removed') removed++;
      else if (row.status === 'changed') changed++;
    }
    return { added, removed, changed };
  }, [diffRows]);

  const hasChanges = summary.added > 0 || summary.removed > 0 || summary.changed > 0;

  // Find selected version for label
  const selectedVersion = versions?.find(v =>
    previousItems.length > 0 || v.id === versions?.[0]?.id,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('specifications.diff.title')}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      {/* Version selector */}
      {versions && versions.length > 0 && onVersionChange && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 shrink-0">
            {t('specifications.diff.compareWith')}:
          </label>
          <select
            onChange={(e) => onVersionChange(e.target.value)}
            defaultValue={versions[0]?.id}
            className="h-8 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} (v{v.version})
              </option>
            ))}
          </select>
        </div>
      )}

      {versions && versions.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
          {t('specifications.diff.noVersions')}
        </p>
      )}

      {/* Summary badges */}
      {hasChanges ? (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.added.badge)}>
            <Plus size={12} />
            {summary.added} {t('specifications.diff.added').toLowerCase()}
          </span>
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.removed.badge)}>
            <Minus size={12} />
            {summary.removed} {t('specifications.diff.removed').toLowerCase()}
          </span>
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.changed.badge)}>
            <RefreshCw size={12} />
            {summary.changed} {t('specifications.diff.changed').toLowerCase()}
          </span>
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {t('specifications.diff.noChanges')}
        </p>
      )}

      {/* Diff table */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600 dark:text-neutral-300">
                {t('specifications.diff.colName')}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600 dark:text-neutral-300 w-36">
                {t('specifications.diff.colStatus')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {diffRows.map((row, idx) => {
              const cfg = statusConfig[row.status];
              return (
                <tr key={`${row.name}-${idx}`} className={cn('transition-colors', cfg.bg)}>
                  <td className="px-4 py-2.5">
                    <span className="text-neutral-900 dark:text-neutral-100">{row.name}</span>
                    {row.status === 'changed' && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        ({row.previousQty}{row.previousUnit ? ` ${row.previousUnit}` : ''}
                        {' \u2192 '}
                        {row.currentQty}{row.currentUnit ? ` ${row.currentUnit}` : ''})
                      </span>
                    )}
                    {row.status === 'added' && row.currentQty != null && (
                      <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                        ({row.currentQty}{row.currentUnit ? ` ${row.currentUnit}` : ''})
                      </span>
                    )}
                    {row.status === 'removed' && row.previousQty != null && (
                      <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                        ({row.previousQty}{row.previousUnit ? ` ${row.previousUnit}` : ''})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cfg.text)}>
                      {cfg.icon}
                      {statusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {diffRows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">
                  {t('specifications.diff.noChanges')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default SpecVersionDiffModal;
