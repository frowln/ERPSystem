import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { adminApi, type PermissionGroup, type ModelAccessRule } from '@/api/admin';
import toast from 'react-hot-toast';

const OPERATIONS = ['canRead', 'canCreate', 'canUpdate', 'canDelete'] as const;
const OP_LABEL_KEYS: Record<string, string> = {
  canRead: 'permissionMatrix.colRead',
  canCreate: 'permissionMatrix.colCreate',
  canUpdate: 'permissionMatrix.colUpdate',
  canDelete: 'permissionMatrix.colDelete',
};

const PermissionMatrixPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const { data: groups = [] } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: adminApi.getPermissionGroups,
  });

  const { data: accessRules = [], isLoading: rulesLoading } = useQuery<ModelAccessRule[]>({
    queryKey: ['model-access', selectedGroupId],
    queryFn: () => adminApi.getModelAccess(selectedGroupId || undefined),
    enabled: !!selectedGroupId,
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { groupId: string; modelName: string; canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }) =>
      adminApi.setModelAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-access', selectedGroupId] });
      toast.success(t('permissionMatrix.saved'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const modelNames = [...new Set(accessRules.map((r) => r.modelName))].sort();

  const getRule = (modelName: string): ModelAccessRule | undefined =>
    accessRules.find((r) => r.modelName === modelName);

  const handleToggle = (modelName: string, operation: typeof OPERATIONS[number]) => {
    const existing = getRule(modelName);
    const data = {
      groupId: selectedGroupId,
      modelName,
      canRead: existing?.canRead ?? false,
      canCreate: existing?.canCreate ?? false,
      canUpdate: existing?.canUpdate ?? false,
      canDelete: existing?.canDelete ?? false,
    };
    data[operation] = !data[operation];
    toggleMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permissionMatrix.title')}
        subtitle={t('permissionMatrix.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('permissionMatrix.title') },
        ]}
      />

      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
        <Select
          options={[
            { value: '', label: t('permissionMatrix.selectGroup') },
            ...groups.map((g) => ({ value: g.id, label: g.displayName || g.name })),
          ]}
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="min-w-[200px]"
        />
      </div>

      {!selectedGroupId ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t('permissionMatrix.selectGroupHint')}</p>
        </div>
      ) : rulesLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 min-w-[200px]">
                    {t('permissionMatrix.colModel')}
                  </th>
                  {OPERATIONS.map((op) => (
                    <th key={op} className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 w-28">
                      {t(OP_LABEL_KEYS[op])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {modelNames.map((modelName) => {
                  const rule = getRule(modelName);
                  return (
                    <tr key={modelName} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {rule?.modelLabel || modelName}
                      </td>
                      {OPERATIONS.map((op) => {
                        const isActive = rule ? rule[op] : false;
                        return (
                          <td key={op} className="text-center px-4 py-3">
                            <button
                              onClick={() => handleToggle(modelName, op)}
                              disabled={toggleMutation.isPending}
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors mx-auto',
                                isActive
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-neutral-100 text-neutral-300 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-600',
                              )}
                            >
                              {isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {modelNames.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-neutral-400 dark:text-neutral-500">{t('permissionMatrix.noRules')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrixPage;
