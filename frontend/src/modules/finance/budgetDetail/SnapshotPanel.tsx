import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import type { BudgetSnapshot } from '@/types';
import { Camera, ChevronRight, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SnapshotPanelProps {
  budgetId: string;
  onCompare: (snapshotId: string) => void;
}

export default function SnapshotPanel({ budgetId, onCompare }: SnapshotPanelProps) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [snapshotType, setSnapshotType] = useState<'BASELINE' | 'REFORECAST' | 'SNAPSHOT'>('SNAPSHOT');
  const [sourceSnapshotId, setSourceSnapshotId] = useState('');

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['budget-snapshots', budgetId],
    queryFn: () => financeApi.getSnapshots(budgetId, { page: 0, size: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () => financeApi.createSnapshot(budgetId, {
      name,
      snapshotType,
      sourceSnapshotId: snapshotType === 'REFORECAST' && sourceSnapshotId ? sourceSnapshotId : undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-snapshots', budgetId] });
      setCreating(false);
      setName('');
      setNotes('');
      setSnapshotType('SNAPSHOT');
      setSourceSnapshotId('');
      toast.success(t('finance.fm.snapshot.create'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const items = snapshots?.content ?? [];

  const fmt = (n: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 w-80 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
          {t('finance.fm.snapshot.panelTitle')}
        </h3>
        <button
          onClick={() => setCreating(!creating)}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {creating && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('finance.fm.snapshot.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('finance.fm.snapshot.namePlaceholder')}
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('finance.fm.snapshot.typeLabel')}
            </label>
            <select
              value={snapshotType}
              onChange={(e) => setSnapshotType(e.target.value as 'BASELINE' | 'REFORECAST' | 'SNAPSHOT')}
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="SNAPSHOT">{t('finance.fm.snapshot.typeSnapshot')}</option>
              <option value="BASELINE">{t('finance.fm.snapshot.typeBaseline')}</option>
              <option value="REFORECAST">{t('finance.fm.snapshot.typeReforecast')}</option>
            </select>
          </div>
          {snapshotType === 'REFORECAST' && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('finance.fm.snapshot.sourceLabel')}
              </label>
              <select
                value={sourceSnapshotId}
                onChange={(e) => setSourceSnapshotId(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="">{t('common.notSelected')}</option>
                {items
                  .filter((snap: BudgetSnapshot) => snap.snapshotType === 'BASELINE')
                  .map((snap: BudgetSnapshot) => (
                    <option key={snap.id} value={snap.id}>
                      {snap.snapshotName}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('finance.fm.snapshot.notesLabel')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('finance.fm.snapshot.notesPlaceholder')}
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending || (snapshotType === 'REFORECAST' && !sourceSnapshotId)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {t('finance.fm.snapshot.save')}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              {t('finance.fm.snapshot.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-sm text-neutral-500">...</div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="p-4 text-center">
            <Camera className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('finance.fm.snapshot.noSnapshots')}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('finance.fm.snapshot.noSnapshotsDesc')}</p>
          </div>
        )}
        {items.map((snap: BudgetSnapshot) => (
          <div
            key={snap.id}
            className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
            onClick={() => onCompare(snap.id)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {snap.snapshotName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                {snap.snapshotType}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {formatDate(snap.snapshotDate)}
            </div>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">
                {t('finance.fm.kpiCostPrice')}: {fmt(snap.totalCost)}
              </span>
              <span className={snap.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                {t('finance.fm.kpiMargin')}: {fmt(snap.totalMargin)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
