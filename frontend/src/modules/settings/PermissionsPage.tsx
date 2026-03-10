import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  AlertCircle,
  Loader2,
  Save,
  Pencil,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Checkbox, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
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
  /** Original rule ID if it already exists in DB */
  existingId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map category value (Russian from DB or English from UI) → i18n key */
const CATEGORY_I18N: Record<string, string> = {
  // Russian values from V20 migration
  'Общие': 'settings.permissions.category_general',
  'Проекты': 'settings.permissions.category_projects',
  'Управление': 'settings.permissions.category_management',
  'Финансы': 'settings.permissions.category_finance',
  'Склад': 'settings.permissions.category_warehouse',
  'Безопасность': 'settings.permissions.category_safety',
  'Персонал': 'settings.permissions.category_hr',
  'Администрирование': 'settings.permissions.category_admin',
  // English keys (for groups created via UI)
  management: 'settings.permissions.category_management',
  engineering: 'settings.permissions.category_engineering',
  finance: 'settings.permissions.category_finance',
  operations: 'settings.permissions.category_operations',
  safety: 'settings.permissions.category_safety',
  procurement: 'settings.permissions.category_procurement',
  hr: 'settings.permissions.category_hr',
  custom: 'settings.permissions.category_custom',
};

const getCategoryLabel = (category: string): string => {
  const key = CATEGORY_I18N[category];
  return key ? t(key) : category;
};

const buildGroupTree = (groups: PermissionGroup[]): PermissionGroup[] => {
  const map = new Map<string, PermissionGroup>();
  const roots: PermissionGroup[] = [];

  for (const g of groups) {
    map.set(g.id, { ...g, children: [] });
  }

  for (const g of map.values()) {
    if (g.parentGroupId && map.has(g.parentGroupId)) {
      map.get(g.parentGroupId)!.children!.push(g);
    } else {
      roots.push(g);
    }
  }

  return roots;
};

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

const getInitials = (firstName?: string, lastName?: string): string => {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  if (!f && !l) return '?';
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
};

const formatRole = (user: AdminUser): string => {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles.join(', ');
  }
  return '-';
};

const getUserDisplayName = (user: AdminUser): string =>
  user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

// ---------------------------------------------------------------------------
// Category presets for group creation
// ---------------------------------------------------------------------------

const GROUP_CATEGORIES = [
  'management',
  'engineering',
  'finance',
  'operations',
  'safety',
  'procurement',
  'hr',
  'custom',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PermissionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [detailTab, setDetailTab] = useState<DetailTab>('models');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [search, setSearch] = useState('');

  // ---------- New Group form state ----------
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDisplayName, setNewGroupDisplayName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('custom');
  const [newGroupParentId, setNewGroupParentId] = useState('');

  // ---------- Edit Group form state ----------
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDisplayName, setEditGroupDisplayName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupCategory, setEditGroupCategory] = useState('custom');

  // ---------- Add Rule form state ----------
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleModelName, setNewRuleModelName] = useState('');
  const [newRuleDomainFilter, setNewRuleDomainFilter] = useState('');
  const [newRulePermRead, setNewRulePermRead] = useState(true);
  const [newRulePermWrite, setNewRulePermWrite] = useState(false);
  const [newRulePermCreate, setNewRulePermCreate] = useState(false);
  const [newRulePermUnlink, setNewRulePermUnlink] = useState(false);

  // ---------- Add User modal state ----------
  const [addUserSearch, setAddUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const {
    data: rawGroups = [],
    isLoading: groupsLoading,
    isError: groupsError,
  } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: () => permissionsApi.getPermissionGroups(),
  });

  const groups = useMemo(() => buildGroupTree(rawGroups), [rawGroups]);

  // Fetch ALL available model names (for the model access matrix)
  const { data: allModelNames = [] } = useQuery<string[]>({
    queryKey: ['all-model-names'],
    queryFn: () => permissionsApi.getAllModelNames(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch existing model access rules for the selected group
  const {
    data: modelAccessData = [],
    isLoading: modelAccessLoading,
  } = useQuery<ModelAccess[]>({
    queryKey: ['model-access', selectedGroupId],
    queryFn: () => permissionsApi.getModelAccess(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  // Build FULL model access matrix: all models + existing rules merged
  const fullModelAccess: ModelAccessRow[] = useMemo(() => {
    const existingMap = new Map(modelAccessData.map((ma) => [ma.modelName, ma]));
    return allModelNames.map((modelName) => {
      const existing = existingMap.get(modelName);
      return {
        model: modelName,
        label: modelName,
        read: existing?.canRead ?? false,
        create: existing?.canCreate ?? false,
        update: existing?.canUpdate ?? false,
        delete: existing?.canDelete ?? false,
        existingId: existing?.id,
      };
    });
  }, [allModelNames, modelAccessData]);

  const [localModelAccess, setLocalModelAccess] = useState<ModelAccessRow[]>([]);
  const effectiveModelAccess = localModelAccess.length > 0 ? localModelAccess : fullModelAccess;

  useEffect(() => {
    setLocalModelAccess([]);
  }, [selectedGroupId, modelAccessData]);

  const {
    data: recordRules = [],
    isLoading: rulesLoading,
  } = useQuery<RecordRule[]>({
    queryKey: ['record-rules', selectedGroupId],
    queryFn: () => permissionsApi.getRecordRules(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const {
    data: fieldAccessData = [],
    isLoading: fieldsLoading,
  } = useQuery<FieldAccess[]>({
    queryKey: ['field-access', selectedGroupId],
    queryFn: () => permissionsApi.getFieldAccess(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const [localFieldAccess, setLocalFieldAccess] = useState<FieldAccess[]>([]);
  const effectiveFieldAccess = localFieldAccess.length > 0 ? localFieldAccess : fieldAccessData;

  useEffect(() => {
    setLocalFieldAccess([]);
  }, [selectedGroupId, fieldAccessData]);

  // Fetch ALL users (for the add user modal)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers({ size: 500 }),
  });

  const allUsers: AdminUser[] = usersData?.content ?? [];

  // Fetch users in the selected group (via proper endpoint)
  const {
    data: groupUsers = [],
    isLoading: groupUsersLoading,
  } = useQuery<AdminUser[]>({
    queryKey: ['group-users', selectedGroupId, allUsers.length],
    queryFn: async () => {
      // getGroupUserAssignments returns {id, userId, groupId}[] — cross-reference with allUsers
      const assignments = await permissionsApi.getGroupUserAssignments(selectedGroupId);
      if (assignments.length > 0) {
        const userMap = new Map(allUsers.map((u) => [u.id, u]));
        return assignments
          .map((a) => userMap.get(a.userId))
          .filter((u): u is AdminUser => !!u);
      }
      // Fallback: filter allUsers by groupNames matching selected group name
      const group = rawGroups.find((g) => g.id === selectedGroupId);
      if (!group) return [];
      return allUsers.filter(
        (u) =>
          u.groupNames?.includes(group.name) ||
          u.groupNames?.includes(group.displayName ?? ''),
      );
    },
    enabled: !!selectedGroupId && allUsers.length > 0,
  });

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  // A) Save Model Access
  const saveModelAccessMutation = useMutation({
    mutationFn: () => {
      const accessList: ModelAccess[] = effectiveModelAccess
        .filter((row) => row.read || row.create || row.update || row.delete)
        .map((row) => ({
          id: row.existingId ?? '',
          modelName: row.model,
          groupId: selectedGroupId,
          canRead: row.read,
          canCreate: row.create,
          canUpdate: row.update,
          canDelete: row.delete,
        }));
      return permissionsApi.setModelAccess(selectedGroupId, accessList);
    },
    onSuccess: () => {
      toast.success(t('common.saved'));
      setLocalModelAccess([]);
      void queryClient.invalidateQueries({ queryKey: ['model-access', selectedGroupId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // B) Delete Record Rule
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => permissionsApi.deleteRecordRule(selectedGroupId, ruleId),
    onSuccess: () => {
      toast.success(t('common.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['record-rules', selectedGroupId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleDeleteRule = useCallback(
    async (rule: RecordRule) => {
      const confirmed = await confirm({
        title: t('settings.permissions.confirmDeleteRuleTitle'),
        description: t('settings.permissions.confirmDeleteRuleDescription'),
        confirmLabel: t('common.delete'),
        confirmVariant: 'danger',
      });
      if (confirmed) {
        deleteRuleMutation.mutate(rule.id);
      }
    },
    [confirm, deleteRuleMutation],
  );

  // C) Create Record Rule
  const createRuleMutation = useMutation({
    mutationFn: () =>
      permissionsApi.createRecordRule(selectedGroupId, {
        name: newRuleName,
        modelName: newRuleModelName,
        domainFilter: newRuleDomainFilter || '{}',
        permRead: newRulePermRead,
        permWrite: newRulePermWrite,
        permCreate: newRulePermCreate,
        permUnlink: newRulePermUnlink,
        isGlobal: false,
      }),
    onSuccess: () => {
      toast.success(t('common.saved'));
      void queryClient.invalidateQueries({ queryKey: ['record-rules', selectedGroupId] });
      setShowAddRuleModal(false);
      resetRuleForm();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetRuleForm = () => {
    setNewRuleName('');
    setNewRuleModelName('');
    setNewRuleDomainFilter('');
    setNewRulePermRead(true);
    setNewRulePermWrite(false);
    setNewRulePermCreate(false);
    setNewRulePermUnlink(false);
  };

  // D) Assign user to group
  const assignUserMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.assignUserToGroup(userId, selectedGroupId),
    onSuccess: () => {
      toast.success(t('common.saved'));
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['group-users', selectedGroupId] });
      void queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // E) Remove user from group
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.removeUserFromGroup(userId, selectedGroupId),
    onSuccess: () => {
      toast.success(t('common.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['group-users', selectedGroupId] });
      void queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleRemoveUser = useCallback(
    async (user: AdminUser) => {
      const confirmed = await confirm({
        title: t('settings.permissions.confirmRemoveUserTitle'),
        description: t('settings.permissions.confirmRemoveUserDescription', {
          name: getUserDisplayName(user),
        }),
        confirmLabel: t('common.delete'),
        confirmVariant: 'danger',
      });
      if (confirmed) {
        removeUserMutation.mutate(user.id);
      }
    },
    [confirm, removeUserMutation],
  );

  const handleAddUsers = useCallback(() => {
    if (selectedUserIds.size === 0) return;
    // Use bulk if > 1 user
    if (selectedUserIds.size > 1) {
      permissionsApi
        .bulkAssignUsersToGroup(Array.from(selectedUserIds), selectedGroupId)
        .then(() => {
          toast.success(t('common.saved'));
          void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          void queryClient.invalidateQueries({ queryKey: ['group-users', selectedGroupId] });
          void queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
        })
        .catch(() => {
          toast.error(t('common.operationError'));
        });
    } else {
      for (const userId of selectedUserIds) {
        assignUserMutation.mutate(userId);
      }
    }
    setShowAddUserModal(false);
    setSelectedUserIds(new Set());
    setAddUserSearch('');
  }, [selectedUserIds, selectedGroupId, assignUserMutation, queryClient]);

  // F) Save Field Access
  const saveFieldAccessMutation = useMutation({
    mutationFn: () => permissionsApi.setFieldAccess(selectedGroupId, effectiveFieldAccess),
    onSuccess: () => {
      toast.success(t('common.saved'));
      setLocalFieldAccess([]);
      void queryClient.invalidateQueries({ queryKey: ['field-access', selectedGroupId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const toggleFieldPerm = (fieldId: string, perm: 'canRead' | 'canWrite') => {
    const base = localFieldAccess.length > 0 ? localFieldAccess : fieldAccessData;
    setLocalFieldAccess(
      base.map((row) => (row.id === fieldId ? { ...row, [perm]: !row[perm] } : row)),
    );
  };

  // G) Create Group
  const createGroupMutation = useMutation({
    mutationFn: () =>
      permissionsApi.createGroup({
        name: newGroupName.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: newGroupDisplayName.trim() || newGroupName.trim(),
        description: newGroupDescription || undefined,
        category: newGroupCategory,
        parentGroupId: newGroupParentId || undefined,
      }),
    onSuccess: (group) => {
      toast.success(t('common.saved'));
      void queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      setShowNewGroupModal(false);
      resetNewGroupForm();
      // Auto-select the newly created group
      if (group?.id) {
        setSelectedGroupId(group.id);
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetNewGroupForm = () => {
    setNewGroupName('');
    setNewGroupDisplayName('');
    setNewGroupDescription('');
    setNewGroupCategory('custom');
    setNewGroupParentId('');
  };

  // H) Edit/Update Group (name is immutable — only displayName, description, category are editable)
  const updateGroupMutation = useMutation({
    mutationFn: () => {
      const currentGroup = rawGroups.find((g) => g.id === selectedGroupId);
      return permissionsApi.updateGroup(selectedGroupId, {
        displayName: editGroupDisplayName.trim() || editGroupName.trim(),
        description: editGroupDescription || undefined,
        category: editGroupCategory || currentGroup?.category || 'custom',
      });
    },
    onSuccess: () => {
      toast.success(t('common.saved'));
      void queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      setShowEditGroupModal(false);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // I) Delete Group
  const deleteGroupMutation = useMutation({
    mutationFn: () => permissionsApi.deleteGroup(selectedGroupId),
    onSuccess: () => {
      toast.success(t('common.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      setSelectedGroupId('');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleDeleteGroup = useCallback(async () => {
    const group = rawGroups.find((g) => g.id === selectedGroupId);
    const confirmed = await confirm({
      title: t('settings.permissions.confirmDeleteGroupTitle'),
      description: t('settings.permissions.confirmDeleteGroupDescription', {
        name: group?.displayName || group?.name || '',
      }),
      confirmLabel: t('common.delete'),
      confirmVariant: 'danger',
    });
    if (confirmed) {
      deleteGroupMutation.mutate();
    }
  }, [confirm, selectedGroupId, rawGroups, deleteGroupMutation]);

  const handleEditGroup = useCallback(() => {
    const group = rawGroups.find((g) => g.id === selectedGroupId);
    if (group) {
      setEditGroupName(group.name);
      setEditGroupDisplayName(group.displayName || group.name);
      setEditGroupDescription(group.description || '');
      setEditGroupCategory(group.category || 'custom');
      setShowEditGroupModal(true);
    }
  }, [selectedGroupId, rawGroups]);

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

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

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModelPerm = (model: string, field: 'read' | 'create' | 'update' | 'delete') => {
    const base = localModelAccess.length > 0 ? localModelAccess : fullModelAccess;
    setLocalModelAccess(
      base.map((row) => (row.model === model ? { ...row, [field]: !row[field] } : row)),
    );
  };

  const hasModelAccessChanges = localModelAccess.length > 0;
  const hasFieldAccessChanges = localFieldAccess.length > 0;

  // ==========================================================================
  // FILTERING
  // ==========================================================================

  const filteredModelAccess = useMemo(() => {
    if (!search) return effectiveModelAccess;
    const lower = search.toLowerCase();
    return effectiveModelAccess.filter(
      (row) => (row.label ?? '').toLowerCase().includes(lower) || (row.model ?? '').toLowerCase().includes(lower),
    );
  }, [effectiveModelAccess, search]);

  const filteredRules = useMemo(() => {
    if (!search) return recordRules;
    const lower = search.toLowerCase();
    return recordRules.filter(
      (row) =>
        (row.name ?? '').toLowerCase().includes(lower) ||
        (row.modelName ?? '').toLowerCase().includes(lower) ||
        (row.domainFilter ?? '').toLowerCase().includes(lower),
    );
  }, [recordRules, search]);

  const filteredFields = useMemo(() => {
    if (!search) return effectiveFieldAccess;
    const lower = search.toLowerCase();
    return effectiveFieldAccess.filter(
      (row) =>
        (row.modelName ?? '').toLowerCase().includes(lower) ||
        (row.fieldName ?? '').toLowerCase().includes(lower),
    );
  }, [effectiveFieldAccess, search]);

  const filteredGroupUsers = useMemo(() => {
    if (!search) return groupUsers;
    const lower = search.toLowerCase();
    return groupUsers.filter(
      (row) =>
        getUserDisplayName(row).toLowerCase().includes(lower) ||
        (row.email ?? '').toLowerCase().includes(lower) ||
        formatRole(row).toLowerCase().includes(lower),
    );
  }, [groupUsers, search]);

  // Users not yet in the group (for the add user modal)
  const groupUserIds = useMemo(() => new Set(groupUsers.map((u) => u.id)), [groupUsers]);

  const filteredAddUsers = useMemo(() => {
    const available = allUsers.filter((u) => !groupUserIds.has(u.id));
    if (!addUserSearch) return available;
    const lower = addUserSearch.toLowerCase();
    return available.filter(
      (u) =>
        getUserDisplayName(u).toLowerCase().includes(lower) ||
        (u.email ?? '').toLowerCase().includes(lower),
    );
  }, [allUsers, groupUserIds, addUserSearch]);

  // Model select options for record rule creation
  const modelSelectOptions = useMemo(() => [
    { value: '', label: t('settings.permissions.selectModel') },
    ...allModelNames.map((m) => ({ value: m, label: m })),
  ], [allModelNames]);

  // Category select options
  const categoryOptions = useMemo(() =>
    GROUP_CATEGORIES.map((c) => ({ value: c, label: t(`settings.permissions.category_${c}`) })),
  []);

  // ==========================================================================
  // TAB DEFINITIONS
  // ==========================================================================

  const detailTabs = [
    { id: 'models' as const, label: t('settings.permissions.tabModelAccess'), icon: Table2 },
    { id: 'rules' as const, label: t('settings.permissions.tabRecordRules'), icon: FolderTree },
    { id: 'fields' as const, label: t('settings.permissions.tabFieldAccess'), icon: FileKey2 },
    { id: 'users' as const, label: t('settings.permissions.tabUsers'), icon: Users },
  ];

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-12 text-center">
      <p className="text-sm text-neutral-400 dark:text-neutral-500">{message}</p>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="py-12 flex justify-center">
      <Loader2 size={24} className="animate-spin text-neutral-400 dark:text-neutral-500" />
    </div>
  );

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
              isSelected
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(group.id)}
                className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
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
              <span className="truncate">{group.displayName || group.name}</span>
            </button>
            {group.category && (
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                )}
              >
                {getCategoryLabel(group.category)}
              </span>
            )}
          </div>
          {hasChildren && isExpanded && renderGroupTree(group.children ?? [], depth + 1)}
        </div>
      );
    });

  // ==========================================================================
  // RENDER
  // ==========================================================================

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
        {/* =============== LEFT SIDEBAR - GROUP TREE =============== */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('settings.permissions.groupsTitle')}
              </h3>
              <Button size="xs" variant="ghost" iconLeft={<Plus size={14} />} onClick={() => setShowNewGroupModal(true)}>
                {t('settings.permissions.btnAdd')}
              </Button>
            </div>
            <div className="p-2 space-y-0.5 max-h-[calc(100vh-240px)] overflow-y-auto">
              {groupsLoading ? (
                <LoadingSpinner />
              ) : groupsError ? (
                <div className="py-6 text-center">
                  <AlertCircle size={20} className="mx-auto text-danger-400 dark:text-danger-300 mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.permissions.errorLoadingGroups')}</p>
                </div>
              ) : groups.length === 0 ? (
                <EmptyState message={t('settings.permissions.noGroups')} />
              ) : (
                renderGroupTree(groups)
              )}
            </div>
          </div>
        </div>

        {/* =============== RIGHT PANEL - DETAILS =============== */}
        <div className="flex-1 min-w-0">
          {selectedGroup ? (
            <div className="space-y-4">
              {/* Group header */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {selectedGroup.displayName || selectedGroup.name}
                      </h2>
                      {selectedGroup.category && (
                        <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded">
                          {getCategoryLabel(selectedGroup.category)}
                        </span>
                      )}
                    </div>
                    {selectedGroup.description && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{selectedGroup.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<Pencil size={14} />}
                      onClick={handleEditGroup}
                    >
                      {t('settings.permissions.btnEdit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      iconLeft={<Trash2 size={14} />}
                      onClick={handleDeleteGroup}
                      loading={deleteGroupMutation.isPending}
                    >
                      {t('settings.permissions.btnDelete')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detail tabs */}
              <div className="border-b border-neutral-200 dark:border-neutral-700 flex gap-0">
                {detailTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setDetailTab(id); setSearch(''); }}
                    className={cn(
                      'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
                      'hover:text-neutral-700 dark:hover:text-neutral-300',
                      detailTab === id
                        ? 'text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:rounded-t'
                        : 'text-neutral-500 dark:text-neutral-400',
                    )}
                    type="button"
                  >
                    <Icon size={14} />
                    {label}
                    {id === 'users' && groupUsers.length > 0 && (
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-full ml-1">
                        {groupUsers.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                <Input
                  placeholder={t('settings.permissions.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {/* ============ MODEL ACCESS TAB ============ */}
              {detailTab === 'models' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  {modelAccessLoading ? (
                    <LoadingSpinner />
                  ) : filteredModelAccess.length === 0 ? (
                    <EmptyState message={t('settings.permissions.noModelAccess')} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              {t('settings.permissions.headerModel')}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                              {t('settings.permissions.headerRead')}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                              {t('settings.permissions.headerCreate')}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                              {t('settings.permissions.headerUpdate')}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                              {t('settings.permissions.headerDelete')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModelAccess.map((row, idx) => (
                            <tr
                              key={row.model}
                              className={cn(
                                'border-b border-neutral-200 dark:border-neutral-700',
                                idx % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800/50',
                              )}
                            >
                              <td className="px-4 py-2">
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{row.label}</p>
                              </td>
                              {(['read', 'create', 'update', 'delete'] as const).map((perm) => (
                                <td key={perm} className="px-4 py-2 text-center">
                                  <Checkbox checked={row[perm]} onChange={() => toggleModelPerm(row.model, perm)} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {effectiveModelAccess.length > 0 && (
                    <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center gap-3">
                      <Button
                        size="sm"
                        iconLeft={<Save size={14} />}
                        onClick={() => saveModelAccessMutation.mutate()}
                        loading={saveModelAccessMutation.isPending}
                        disabled={!hasModelAccessChanges}
                      >
                        {t('settings.permissions.btnSavePermissions')}
                      </Button>
                      {hasModelAccessChanges && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {t('settings.permissions.unsavedChanges')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ============ RECORD RULES TAB ============ */}
              {detailTab === 'rules' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      iconLeft={<Plus size={14} />}
                      onClick={() => setShowAddRuleModal(true)}
                    >
                      {t('settings.permissions.btnAddRule')}
                    </Button>
                  </div>
                  {rulesLoading ? (
                    <LoadingSpinner />
                  ) : filteredRules.length === 0 ? (
                    <EmptyState message={t('settings.permissions.noRecordRules')} />
                  ) : (
                    filteredRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={cn(
                          'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4',
                          rule.isGlobal && 'border-primary-200 dark:border-primary-800',
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{rule.name}</p>
                            <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded">
                              {rule.modelName}
                            </span>
                            {rule.isGlobal && (
                              <span className="text-[10px] font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded">
                                {t('settings.permissions.globalLabel')}
                              </span>
                            )}
                          </div>
                          <Button
                            size="xs"
                            variant="ghost"
                            iconLeft={<Trash2 size={13} />}
                            aria-label={t('settings.permissions.btnDelete')}
                            onClick={() => handleDeleteRule(rule)}
                            loading={deleteRuleMutation.isPending}
                          />
                        </div>
                        {rule.domainFilter && (
                          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 font-mono text-xs text-neutral-600 dark:text-neutral-400 mb-3 overflow-x-auto">
                            {rule.domainFilter}
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>
                            {t('settings.permissions.readLabel')}:{' '}
                            {rule.permRead ? t('settings.permissions.yesLabel') : t('settings.permissions.noLabel')}
                          </span>
                          <span>
                            {t('settings.permissions.writeLabel')}:{' '}
                            {rule.permWrite ? t('settings.permissions.yesLabel') : t('settings.permissions.noLabel')}
                          </span>
                          <span>
                            {t('settings.permissions.createLabel')}:{' '}
                            {rule.permCreate ? t('settings.permissions.yesLabel') : t('settings.permissions.noLabel')}
                          </span>
                          <span>
                            {t('settings.permissions.unlinkLabel')}:{' '}
                            {rule.permUnlink ? t('settings.permissions.yesLabel') : t('settings.permissions.noLabel')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ============ FIELD ACCESS TAB ============ */}
              {detailTab === 'fields' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  {fieldsLoading ? (
                    <LoadingSpinner />
                  ) : filteredFields.length === 0 ? (
                    <EmptyState message={t('settings.permissions.noFieldAccess')} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              {t('settings.permissions.headerModel')}
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              {t('settings.permissions.headerField')}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                              {t('settings.permissions.headerRead')}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                              {t('settings.permissions.headerWrite')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFields.map((row, idx) => (
                            <tr
                              key={row.id}
                              className={cn(
                                'border-b border-neutral-200 dark:border-neutral-700',
                                idx % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800/50',
                              )}
                            >
                              <td className="px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100">{row.modelName}</td>
                              <td className="px-4 py-2.5">
                                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-mono">{row.fieldName}</p>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <Checkbox checked={row.canRead} onChange={() => toggleFieldPerm(row.id, 'canRead')} />
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <Checkbox checked={row.canWrite} onChange={() => toggleFieldPerm(row.id, 'canWrite')} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {filteredFields.length > 0 && (
                    <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center gap-3">
                      <Button
                        size="sm"
                        iconLeft={<Save size={14} />}
                        onClick={() => saveFieldAccessMutation.mutate()}
                        loading={saveFieldAccessMutation.isPending}
                        disabled={!hasFieldAccessChanges}
                      >
                        {t('settings.permissions.btnSaveFieldAccess')}
                      </Button>
                      {hasFieldAccessChanges && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {t('settings.permissions.unsavedChanges')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ============ USERS TAB ============ */}
              {detailTab === 'users' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {groupUsers.length} {t('settings.permissions.usersInGroup')}
                    </p>
                    <Button
                      size="xs"
                      iconLeft={<UserPlus size={13} />}
                      onClick={() => {
                        setShowAddUserModal(true);
                        setSelectedUserIds(new Set());
                        setAddUserSearch('');
                      }}
                    >
                      {t('settings.permissions.addUser')}
                    </Button>
                  </div>
                  {groupUsersLoading || usersLoading ? (
                    <LoadingSpinner />
                  ) : filteredGroupUsers.length === 0 ? (
                    <EmptyState message={t('settings.permissions.noUsersInGroup')} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              {t('settings.permissions.headerUser')}
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              {t('settings.permissions.headerEmail')}
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              {t('settings.permissions.headerRole')}
                            </th>
                            <th className="px-4 py-2.5 w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGroupUsers.map((user, idx) => (
                            <tr
                              key={user.id}
                              className={cn(
                                'border-b border-neutral-200 dark:border-neutral-700',
                                idx % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800/50',
                              )}
                            >
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-semibold">
                                    {getInitials(user.firstName, user.lastName)}
                                  </div>
                                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    {getUserDisplayName(user)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400">{user.email}</td>
                              <td className="px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400">{formatRole(user)}</td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  className="p-1 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 rounded transition-colors"
                                  type="button"
                                  onClick={() => handleRemoveUser(user)}
                                  title={t('settings.permissions.removeUserTooltip')}
                                >
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
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <ShieldCheck size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">{t('settings.permissions.selectGroupPrompt')}</p>
            </div>
          )}
        </div>
      </div>

      {/* =============== NEW GROUP MODAL =============== */}
      <Modal
        open={showNewGroupModal}
        onClose={() => { setShowNewGroupModal(false); resetNewGroupForm(); }}
        title={t('settings.permissions.newGroupTitle')}
        description={t('settings.permissions.newGroupDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowNewGroupModal(false); resetNewGroupForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createGroupMutation.mutate()}
              loading={createGroupMutation.isPending}
              disabled={!newGroupName.trim()}
            >
              {t('settings.permissions.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('settings.permissions.fieldGroupName')} required>
            <Input
              placeholder={t('settings.permissions.groupNamePlaceholder')}
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value);
                // Auto-fill displayName if not manually edited
                if (!newGroupDisplayName || newGroupDisplayName === newGroupName) {
                  setNewGroupDisplayName(e.target.value);
                }
              }}
            />
          </FormField>
          <FormField label={t('settings.permissions.fieldDisplayName')}>
            <Input
              placeholder={t('settings.permissions.displayNamePlaceholder')}
              value={newGroupDisplayName}
              onChange={(e) => setNewGroupDisplayName(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.fieldCategory')} required>
            <Select
              options={categoryOptions}
              value={newGroupCategory}
              onChange={(e) => setNewGroupCategory(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.fieldDescription')}>
            <Textarea
              placeholder={t('settings.permissions.descriptionPlaceholder')}
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.fieldParentGroup')}>
            <Select
              options={[
                { value: '', label: t('settings.permissions.noParent') },
                ...flattenGroups(groups).map((group) => ({
                  value: group.id,
                  label: group.displayName || group.name,
                })),
              ]}
              value={newGroupParentId}
              onChange={(e) => setNewGroupParentId(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* =============== EDIT GROUP MODAL =============== */}
      <Modal
        open={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title={t('settings.permissions.editGroupTitle')}
        description={t('settings.permissions.editGroupDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditGroupModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => updateGroupMutation.mutate()}
              loading={updateGroupMutation.isPending}
              disabled={!editGroupDisplayName.trim()}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('settings.permissions.fieldGroupName')}>
            <Input
              value={editGroupName}
              disabled
              className="bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {t('settings.permissions.nameImmutableHint')}
            </p>
          </FormField>
          <FormField label={t('settings.permissions.fieldDisplayName')} required>
            <Input
              placeholder={t('settings.permissions.displayNamePlaceholder')}
              value={editGroupDisplayName}
              onChange={(e) => setEditGroupDisplayName(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.fieldCategory')}>
            <Select
              options={categoryOptions}
              value={editGroupCategory}
              onChange={(e) => setEditGroupCategory(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.fieldDescription')}>
            <Textarea
              placeholder={t('settings.permissions.descriptionPlaceholder')}
              value={editGroupDescription}
              onChange={(e) => setEditGroupDescription(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* =============== ADD USER TO GROUP MODAL =============== */}
      <Modal
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title={t('settings.permissions.addUserTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddUsers}
              loading={assignUserMutation.isPending}
              disabled={selectedUserIds.size === 0}
            >
              {t('settings.permissions.btnAdd')} ({selectedUserIds.size})
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('settings.permissions.searchUserPlaceholder')}>
            <Input
              placeholder={t('settings.permissions.searchUserPlaceholder')}
              value={addUserSearch}
              onChange={(e) => setAddUserSearch(e.target.value)}
            />
          </FormField>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-700 max-h-60 overflow-y-auto">
            {filteredAddUsers.length === 0 ? (
              <div className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {t('settings.permissions.noUsersAvailable')}
              </div>
            ) : (
              filteredAddUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedUserIds.has(user.id)}
                    onChange={() => {
                      setSelectedUserIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(user.id)) next.delete(user.id);
                        else next.add(user.id);
                        return next;
                      });
                    }}
                  />
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* =============== ADD RECORD RULE MODAL =============== */}
      <Modal
        open={showAddRuleModal}
        onClose={() => {
          setShowAddRuleModal(false);
          resetRuleForm();
        }}
        title={t('settings.permissions.addRuleTitle')}
        description={t('settings.permissions.addRuleDescription')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddRuleModal(false);
                resetRuleForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createRuleMutation.mutate()}
              loading={createRuleMutation.isPending}
              disabled={!newRuleName.trim() || !newRuleModelName.trim()}
            >
              {t('settings.permissions.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('settings.permissions.ruleNameLabel')} required>
            <Input
              placeholder={t('settings.permissions.ruleNamePlaceholder')}
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.ruleModelLabel')} required>
            <Select
              options={modelSelectOptions}
              value={newRuleModelName}
              onChange={(e) => setNewRuleModelName(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.permissions.ruleDomainFilterLabel')}>
            <Textarea
              placeholder={t('settings.permissions.ruleDomainFilterPlaceholder')}
              value={newRuleDomainFilter}
              onChange={(e) => setNewRuleDomainFilter(e.target.value)}
              className="font-mono"
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <Checkbox checked={newRulePermRead} onChange={() => setNewRulePermRead(!newRulePermRead)} />
              {t('settings.permissions.readLabel')}
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <Checkbox checked={newRulePermWrite} onChange={() => setNewRulePermWrite(!newRulePermWrite)} />
              {t('settings.permissions.writeLabel')}
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <Checkbox checked={newRulePermCreate} onChange={() => setNewRulePermCreate(!newRulePermCreate)} />
              {t('settings.permissions.createLabel')}
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <Checkbox checked={newRulePermUnlink} onChange={() => setNewRulePermUnlink(!newRulePermUnlink)} />
              {t('settings.permissions.unlinkLabel')}
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PermissionsPage;
