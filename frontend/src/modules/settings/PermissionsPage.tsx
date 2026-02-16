import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Plus,
  Users,
  ChevronRight,
  ChevronDown,
  Trash2,
  Search,
  FolderTree,
  Table2,
  FileKey2,
  UserPlus,
  X,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Checkbox, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import {
  permissionsApi,
  type PermissionGroup,
  type ModelAccess,
  type RecordRule,
  type FieldAccess,
  type AdminUser,
} from '@/api/permissions';

type DetailTab = 'models' | 'rules' | 'fields' | 'users';

interface ModelAccessRow {
  model: string;
  label: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

const flattenGroups = (groups: PermissionGroup[]): PermissionGroup[] => {
  const result: PermissionGroup[] = [];
  for (const group of groups) {
    result.push(group);
    if (group.children?.length) {
      result.push(...flattenGroups(group.children));
    }
  }
  return result;
};

const PermissionsPage: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [detailTab, setDetailTab] = useState<DetailTab>('models');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [search, setSearch] = useState('');

  const { data: groups = [] } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: () => permissionsApi.getPermissionGroups(),
  });

  const { data: modelAccessData = [] } = useQuery<ModelAccess[]>({
    queryKey: ['model-access', selectedGroupId],
    queryFn: () => permissionsApi.getModelAccess(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const modelAccess: ModelAccessRow[] = useMemo(() =>
    modelAccessData.map((ma) => ({
      model: ma.modelName,
      label: ma.modelLabel,
      read: ma.canRead,
      create: ma.canCreate,
      update: ma.canUpdate,
      delete: ma.canDelete,
    })),
  [modelAccessData]);

  const [localModelAccess, setLocalModelAccess] = useState<ModelAccessRow[]>([]);
  const effectiveModelAccess = localModelAccess.length > 0 ? localModelAccess : modelAccess;

  const { data: recordRules = [] } = useQuery<RecordRule[]>({
    queryKey: ['record-rules', selectedGroupId],
    queryFn: () => permissionsApi.getRecordRules(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const { data: fieldAccessData = [] } = useQuery<FieldAccess[]>({
    queryKey: ['field-access', selectedGroupId],
    queryFn: () => permissionsApi.getFieldAccess(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers(),
  });

  const allUsers = usersData?.content ?? [];

  const selectedGroup = useMemo(() => {
    const findGroup = (groupList: PermissionGroup[]): PermissionGroup | undefined => {
      for (const group of groupList) {
        if (group.id === selectedGroupId) return group;
        if (group.children?.length) {
          const found = findGroup(group.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findGroup(groups);
  }, [selectedGroupId, groups]);

  const currentUsers = useMemo(() =>
    allUsers.filter((u) => u.groups.includes(selectedGroupId) || (u.groupNames ?? []).some((gn) => gn === selectedGroup?.name)),
  [allUsers, selectedGroupId, selectedGroup]);

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModelPerm = (model: string, field: 'read' | 'create' | 'update' | 'delete') => {
    const base = localModelAccess.length > 0 ? localModelAccess : modelAccess;
    setLocalModelAccess(
      base.map((row) => (row.model === model ? { ...row, [field]: !row[field] } : row)),
    );
  };

  const filteredModelAccess = useMemo(() => {
    if (!search) return effectiveModelAccess;
    const lower = search.toLowerCase();
    return effectiveModelAccess.filter((row) => row.label.toLowerCase().includes(lower) || row.model.toLowerCase().includes(lower));
  }, [effectiveModelAccess, search]);

  const filteredRules = useMemo(() => {
    if (!search) return recordRules;
    const lower = search.toLowerCase();
    return recordRules.filter(
      (row) => row.name.toLowerCase().includes(lower) || row.modelName.toLowerCase().includes(lower) || row.domainFilter.toLowerCase().includes(lower),
    );
  }, [recordRules, search]);

  const filteredFields = useMemo(() => {
    if (!search) return fieldAccessData;
    const lower = search.toLowerCase();
    return fieldAccessData.filter(
      (row) => row.modelName.toLowerCase().includes(lower) || row.fieldLabel.toLowerCase().includes(lower) || row.fieldName.toLowerCase().includes(lower),
    );
  }, [fieldAccessData, search]);

  const filteredUsers = useMemo(() => {
    if (!search) return currentUsers;
    const lower = search.toLowerCase();
    return currentUsers.filter(
      (row) => `${row.firstName} ${row.lastName}`.toLowerCase().includes(lower) || row.email.toLowerCase().includes(lower) || row.role.toLowerCase().includes(lower),
    );
  }, [currentUsers, search]);

  const detailTabs = [
    { id: 'models' as const, label: t('settings.permissions.tabModelAccess'), icon: Table2 },
    { id: 'rules' as const, label: t('settings.permissions.tabRecordRules'), icon: FolderTree },
    { id: 'fields' as const, label: t('settings.permissions.tabFieldAccess'), icon: FileKey2 },
    { id: 'users' as const, label: t('settings.permissions.tabUsers'), icon: Users },
  ];

  const renderGroupTree = (groupList: PermissionGroup[], depth = 0): React.ReactNode =>
    groupList.map((group) => {
      const hasChildren = (group.children?.length ?? 0) > 0;
      const isExpanded = expandedGroups.has(group.id);
      const isSelected = selectedGroupId === group.id;

      return (
        <div key={group.id}>
          <div
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              isSelected ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(group.id)}
                className="p-0.5 text-neutral-400 hover:text-neutral-600 rounded"
                type="button"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <button
              onClick={() => setSelectedGroupId(group.id)}
              className="flex items-center gap-2 flex-1 text-left"
              type="button"
            >
              <ShieldCheck size={14} className={isSelected ? 'text-primary-500' : 'text-neutral-400'} />
              <span className="truncate">{group.name}</span>
            </button>
            <span
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                isSelected ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
              )}
            >
              {group.userCount}
            </span>
          </div>
          {hasChildren && isExpanded && renderGroupTree(group.children ?? [], depth + 1)}
        </div>
      );
    });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('settings.permissions.title')}
        subtitle={t('settings.permissions.subtitle')}
        breadcrumbs={[
          { label: t('settings.permissions.breadcrumbHome'), href: '/' },
          { label: t('settings.permissions.breadcrumbAdmin') },
          { label: t('settings.permissions.breadcrumbPermissions') },
        ]}
      />

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.permissions.groupsTitle')}</h3>
              <Button size="xs" variant="ghost" iconLeft={<Plus size={14} />} onClick={() => setShowNewGroupModal(true)}>
                {t('settings.permissions.btnAdd')}
              </Button>
            </div>
            <div className="p-2 space-y-0.5 max-h-[calc(100vh-240px)] overflow-y-auto">
              {renderGroupTree(groups)}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {selectedGroup ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{selectedGroup.name}</h2>
                      {selectedGroup.isSystem && (
                        <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded">{t('settings.permissions.systemLabel')}</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{selectedGroup.description}</p>
                    {selectedGroup.parentId && (
                      <p className="text-xs text-neutral-400 mt-1">{t('settings.permissions.parentGroupLabel')} {selectedGroup.parentId}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">{t('settings.permissions.btnEdit')}</Button>
                    {!selectedGroup.isSystem && (
                      <Button size="sm" variant="danger" iconLeft={<Trash2 size={14} />}>{t('settings.permissions.btnDelete')}</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-700 flex gap-0">
                {detailTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setDetailTab(id)}
                    className={cn(
                      'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
                      'hover:text-neutral-700 dark:hover:text-neutral-300',
                      detailTab === id
                        ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 after:rounded-t'
                        : 'text-neutral-500 dark:text-neutral-400',
                    )}
                    type="button"
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder={t('settings.permissions.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {detailTab === 'models' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.permissions.headerModel')}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">{t('settings.permissions.headerRead')}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">{t('settings.permissions.headerCreate')}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">{t('settings.permissions.headerUpdate')}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">{t('settings.permissions.headerDelete')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModelAccess.map((row, idx) => (
                        <tr key={row.model} className={cn('border-b border-neutral-100', idx % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800')}>
                          <td className="px-4 py-2.5">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{row.label}</p>
                            <p className="text-xs text-neutral-400 font-mono">{row.model}</p>
                          </td>
                          {(['read', 'create', 'update', 'delete'] as const).map((perm) => (
                            <td key={perm} className="px-4 py-2.5 text-center">
                              <Checkbox checked={row[perm]} onChange={() => toggleModelPerm(row.model, perm)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                    <Button size="sm">{t('settings.permissions.btnSavePermissions')}</Button>
                  </div>
                </div>
              )}

              {detailTab === 'rules' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button size="sm" iconLeft={<Plus size={14} />}>{t('settings.permissions.btnAddRule')}</Button>
                  </div>
                  {filteredRules.map((rule) => (
                    <div key={rule.id} className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4', !rule.isActive && 'opacity-60')}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{rule.name}</p>
                          <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded">{rule.modelName}</span>
                        </div>
                        <Button size="xs" variant="ghost" iconLeft={<Trash2 size={13} />} aria-label="Удалить правило" />
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 font-mono text-xs text-neutral-600 mb-3">
                        {rule.domainFilter}
                      </div>
                      <div className="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{t('settings.permissions.readLabel')}: {rule.permRead ? t('settings.permissions.yesLabel') : t('settings.permissions.noLabel')}</span>
                        <span>{t('settings.permissions.writeLabel')}: {rule.permWrite ? t('settings.permissions.yesLabel') : t('settings.permissions.noLabel')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'fields' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.permissions.headerModel')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.permissions.headerField')}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">{t('settings.permissions.headerRead')}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">{t('settings.permissions.headerWrite')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFields.map((row, idx) => (
                        <tr key={row.id} className={cn('border-b border-neutral-100', idx % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800')}>
                          <td className="px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100">{row.modelName}</td>
                          <td className="px-4 py-2.5">
                            <p className="text-sm text-neutral-900 dark:text-neutral-100">{row.fieldLabel}</p>
                            <p className="text-xs text-neutral-400 font-mono">{row.fieldName}</p>
                          </td>
                          <td className="px-4 py-2.5 text-center"><Checkbox checked={row.canRead} onChange={() => {}} /></td>
                          <td className="px-4 py-2.5 text-center"><Checkbox checked={row.canWrite} onChange={() => {}} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'users' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{filteredUsers.length} {t('settings.permissions.usersInGroup')}</p>
                    <Button size="xs" iconLeft={<UserPlus size={13} />} onClick={() => setShowAddUserModal(true)}>
                      {t('settings.permissions.addUser')}
                    </Button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.permissions.headerUser')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.permissions.headerEmail')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.permissions.headerRole')}</th>
                        <th className="px-4 py-2.5 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, idx) => (
                        <tr key={user.id} className={cn('border-b border-neutral-100', idx % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800')}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                                {user.firstName[0]}{user.lastName[0]}
                              </div>
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.firstName} {user.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-neutral-600">{user.email}</td>
                          <td className="px-4 py-2.5 text-sm text-neutral-600">{user.role}</td>
                          <td className="px-4 py-2.5 text-center">
                            <button className="p-1 text-neutral-400 hover:text-danger-600 rounded" type="button">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <ShieldCheck size={40} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">{t('settings.permissions.selectGroupPrompt')}</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        title={t('settings.permissions.newGroupTitle')}
        description={t('settings.permissions.newGroupDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewGroupModal(false)}>{t('settings.permissions.btnCancel')}</Button>
            <Button onClick={() => setShowNewGroupModal(false)}>{t('settings.permissions.btnCreate')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('settings.permissions.fieldGroupName')} required>
            <Input placeholder={t('settings.permissions.groupNamePlaceholder')} />
          </FormField>
          <FormField label={t('settings.permissions.fieldDescription')}>
            <Textarea placeholder={t('settings.permissions.descriptionPlaceholder')} />
          </FormField>
          <FormField label={t('settings.permissions.fieldParentGroup')}>
            <Select
              options={[
                { value: '', label: t('settings.permissions.noParent') },
                ...flattenGroups(groups).map((group) => ({ value: group.id, label: group.name })),
              ]}
              defaultValue=""
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title={t('settings.permissions.addUserTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>{t('settings.permissions.btnCancel')}</Button>
            <Button onClick={() => setShowAddUserModal(false)}>{t('settings.permissions.btnAdd')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('settings.permissions.searchUserPlaceholder')}>
            <Input placeholder={t('settings.permissions.searchUserPlaceholder')} />
          </FormField>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 max-h-60 overflow-y-auto">
            {allUsers
              .filter((u) => !currentUsers.some((cu) => cu.id === u.id))
              .map((user) => (
              <label key={user.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <Checkbox />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PermissionsPage;
