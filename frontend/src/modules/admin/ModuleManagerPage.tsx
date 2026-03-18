import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Save, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { navigation, type NavGroup } from '@/config/navigation';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';
import { useModuleVisibilityStore } from '@/stores/moduleVisibilityStore';

// Groups that cannot be disabled (admin always needs access)
const LOCKED_GROUPS = new Set(['admin', 'home', 'knowledge']);

export default function ModuleManagerPage() {
  const [disabledSet, setDisabledSet] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fetchDisabledModules = useModuleVisibilityStore((s) => s.fetchDisabledModules);

  // Load current disabled modules
  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.get('/module-visibility', { _silentErrors: true } as any);
        const modules: string[] = response.data?.disabledModules ?? [];
        setDisabledSet(new Set(modules));
      } catch {
        // no settings yet — everything enabled
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Count enabled/total items per group
  const groupStats = useMemo(() => {
    const stats: Record<string, { total: number; enabled: number }> = {};
    for (const group of navigation) {
      const total = group.items.length;
      const enabled = group.items.filter((item) => !disabledSet.has(item.id)).length;
      stats[group.id] = { total, enabled };
    }
    return stats;
  }, [disabledSet]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const isGroupEnabled = useCallback(
    (group: NavGroup) => {
      if (disabledSet.has(group.id)) return false;
      // Group enabled if at least one item is enabled
      return group.items.some((item) => !disabledSet.has(item.id));
    },
    [disabledSet],
  );

  const toggleGroupEnabled = useCallback(
    (group: NavGroup) => {
      setDisabledSet((prev) => {
        const next = new Set(prev);
        const currentlyEnabled = isGroupEnabled(group);
        if (currentlyEnabled) {
          // Disable: add group + all items
          next.add(group.id);
          for (const item of group.items) next.add(item.id);
        } else {
          // Enable: remove group + all items
          next.delete(group.id);
          for (const item of group.items) next.delete(item.id);
        }
        return next;
      });
      setDirty(true);
    },
    [isGroupEnabled],
  );

  const toggleItem = useCallback((itemId: string, groupId: string) => {
    setDisabledSet((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        // If enabling an item, also enable the group
        next.delete(groupId);
      } else {
        next.add(itemId);
      }
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiClient.put('/admin/module-visibility', {
        disabledModules: Array.from(disabledSet),
      });
      // Refresh global store so sidebar updates immediately
      await fetchDisabledModules();
      setDirty(false);
      toast.success(t('moduleManager.saved'));
    } catch {
      toast.error(t('moduleManager.saveError'));
    } finally {
      setSaving(false);
    }
  }, [disabledSet, fetchDisabledModules]);

  const handleReset = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/module-visibility', { _silentErrors: true } as any);
      const modules: string[] = response.data?.disabledModules ?? [];
      setDisabledSet(new Set(modules));
      setDirty(false);
    } catch {
      setDisabledSet(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  // Count totals
  const totalGroups = navigation.filter((g) => !LOCKED_GROUPS.has(g.id)).length;
  const enabledGroups = navigation.filter(
    (g) => !LOCKED_GROUPS.has(g.id) && !disabledSet.has(g.id) && g.items.some((i) => !disabledSet.has(i.id)),
  ).length;
  const totalItems = navigation.reduce((sum, g) => sum + g.items.length, 0);
  const enabledItems = navigation.reduce(
    (sum, g) => sum + g.items.filter((i) => !disabledSet.has(i.id)).length,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('moduleManager.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('moduleManager.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <RotateCcw size={16} />
              {t('common.reset')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              dirty
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed',
            )}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {enabledGroups}/{totalGroups}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('moduleManager.groupsEnabled')}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {enabledItems}/{totalItems}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('moduleManager.itemsEnabled')}
          </div>
        </div>
      </div>

      {/* Module tree */}
      <div className="space-y-2">
        {navigation.map((group) => {
          const locked = LOCKED_GROUPS.has(group.id);
          const expanded = expandedGroups.has(group.id);
          const groupEnabled = isGroupEnabled(group);
          const stats = groupStats[group.id];
          const GroupIcon = group.icon;

          return (
            <div
              key={group.id}
              className={cn(
                'bg-white dark:bg-neutral-800 border rounded-lg overflow-hidden transition-colors',
                locked
                  ? 'border-gray-200 dark:border-neutral-700 opacity-60'
                  : groupEnabled
                    ? 'border-gray-200 dark:border-neutral-700'
                    : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-850',
              )}
            >
              {/* Group header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <GroupIcon
                  size={20}
                  className={cn(
                    groupEnabled ? 'text-primary-500' : 'text-gray-400 dark:text-neutral-500',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'font-medium',
                      groupEnabled
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-neutral-500 line-through',
                    )}
                  >
                    {group.title}
                  </span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-neutral-500">
                    {stats.enabled}/{stats.total}
                  </span>
                </div>
                {locked ? (
                  <span className="text-xs text-gray-400 dark:text-neutral-500 px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded">
                    {t('moduleManager.locked')}
                  </span>
                ) : (
                  <button
                    onClick={() => toggleGroupEnabled(group)}
                    className="flex-shrink-0"
                    title={groupEnabled ? t('moduleManager.disableGroup') : t('moduleManager.enableGroup')}
                  >
                    {groupEnabled ? (
                      <ToggleRight size={28} className="text-primary-500" />
                    ) : (
                      <ToggleLeft size={28} className="text-gray-300 dark:text-neutral-600" />
                    )}
                  </button>
                )}
              </div>

              {/* Group items */}
              {expanded && (
                <div className="border-t border-gray-100 dark:border-neutral-700">
                  {group.items.map((item) => {
                    const itemEnabled = !disabledSet.has(item.id);
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-gray-50 dark:hover:bg-neutral-750"
                      >
                        <ItemIcon
                          size={16}
                          className={cn(
                            itemEnabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-neutral-600',
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            itemEnabled
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-400 dark:text-neutral-500 line-through',
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="text-[10px] text-gray-300 dark:text-neutral-600 font-mono">
                          {item.id}
                        </span>
                        {!locked && (
                          <button
                            onClick={() => toggleItem(item.id, group.id)}
                            className="flex-shrink-0"
                          >
                            {itemEnabled ? (
                              <ToggleRight size={24} className="text-primary-500" />
                            ) : (
                              <ToggleLeft size={24} className="text-gray-300 dark:text-neutral-600" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
