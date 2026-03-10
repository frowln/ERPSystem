import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search, UserPlus, Ban, Unlock, Key, LogOut, X,
  Clock, Monitor, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import { permissionsApi, type AdminUser, type PermissionGroup, type UserActivityLog, type UserSession } from '@/api/permissions';
import type { PaginatedResponse } from '@/types';

const userStatusColorMap: Record<string, 'green' | 'red' | 'yellow'> = { active: 'green', blocked: 'red', pending: 'yellow' };
const userStatusLabels: Record<string, string> = { active: t('settings.users.statusActive'), blocked: t('settings.users.statusBlocked'), pending: t('settings.users.statusPending') };
const roleLabels: Record<string, string> = { ADMIN: t('settings.users.roleAdmin'), MANAGER: t('settings.users.roleManager'), ENGINEER: t('settings.users.roleEngineer'), ACCOUNTANT: t('settings.users.roleAccountant'), VIEWER: t('settings.users.roleViewer') };

type TabId = 'all' | 'ACTIVE' | 'BLOCKED';
type DetailTab = 'profile' | 'groups' | 'activity' | 'sessions';

/** Derive a status string from the backend `enabled` boolean */
const getUserStatus = (user: AdminUser): string => user.enabled ? 'active' : 'blocked';

/** Get initials safely */
const getInitials = (firstName?: string, lastName?: string): string => {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  if (!f && !l) return '?';
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
};

/** Get the primary role from the roles array */
const getPrimaryRole = (user: AdminUser): string => {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0];
  }
  return '-';
};

const UsersAdminPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('profile');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ---- Create user form state ----
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('ENGINEER');
  const [newPassword, setNewPassword] = useState('');
  const [newGroupIds, setNewGroupIds] = useState<Set<string>>(new Set());

  // ---- Profile form state ----
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileRole, setProfileRole] = useState('');

  // ---- Group assignment state ----
  const [checkedGroupIds, setCheckedGroupIds] = useState<Set<string>>(new Set());
  const [originalGroupIds, setOriginalGroupIds] = useState<Set<string>>(new Set());

  // ---- Queries ----
  const { data: usersData, isLoading } = useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers(),
  });

  const { data: groupsData = [] } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: () => permissionsApi.getPermissionGroups(),
  });

  const { data: userGroupsData = [] } = useQuery<PermissionGroup[]>({
    queryKey: ['user-groups', selectedUser?.id],
    queryFn: () => permissionsApi.getUserGroups(selectedUser!.id),
    enabled: !!selectedUser,
  });

  const { data: activityData = [] } = useQuery<UserActivityLog[]>({
    queryKey: ['user-activity', selectedUser?.id],
    queryFn: () => permissionsApi.getUserActivityLog(selectedUser!.id),
    enabled: !!selectedUser && detailTab === 'activity',
  });

  const { data: sessionsData = [] } = useQuery<UserSession[]>({
    queryKey: ['user-sessions', selectedUser?.id],
    queryFn: () => permissionsApi.getUserSessions(selectedUser!.id),
    enabled: !!selectedUser && detailTab === 'sessions',
  });

  // ---- Sync form state when selectedUser changes ----
  useEffect(() => {
    if (selectedUser) {
      setProfileFirstName(selectedUser.firstName ?? '');
      setProfileLastName(selectedUser.lastName ?? '');
      setProfileEmail(selectedUser.email ?? '');
      setProfileRole(getPrimaryRole(selectedUser));
    }
  }, [selectedUser]);

  // ---- Sync group checkboxes when userGroupsData loads ----
  useEffect(() => {
    if (userGroupsData.length > 0 || selectedUser) {
      const ids = new Set(userGroupsData.map((g) => g.id));
      setCheckedGroupIds(ids);
      setOriginalGroupIds(new Set(ids));
    }
  }, [userGroupsData, selectedUser]);

  // ---- Mutations ----

  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('settings.users.toastBlocked'));
      // Update local selectedUser state
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, enabled: false });
      }
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('settings.users.toastUnblocked'));
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, enabled: true });
      }
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.resetPassword(userId),
    onSuccess: (data) => {
      const tempPw = data?.tempPassword ?? '—';
      toast.success(`${t('settings.users.resetPasswordButton')}: ${tempPw}`, { duration: 10000 });
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.forceLogout(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', selectedUser?.id] });
      toast.success(t('settings.users.toastForceLogout'));
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<AdminUser> }) =>
      permissionsApi.updateUser(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('settings.users.toastProfileSaved'));
      // Update selectedUser in place so the panel reflects changes
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          firstName: updatedUser.firstName ?? profileFirstName,
          lastName: updatedUser.lastName ?? profileLastName,
          email: updatedUser.email ?? profileEmail,
          roles: updatedUser.roles ?? [profileRole],
          fullName: updatedUser.fullName ?? `${profileFirstName} ${profileLastName}`.trim(),
        });
      }
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: { email: string; firstName: string; lastName: string; role: string; password: string; groups: string[] }) =>
      permissionsApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('settings.users.toastUserCreated'));
      setShowCreateModal(false);
      setNewFirstName(''); setNewLastName(''); setNewEmail(''); setNewRole('ENGINEER'); setNewPassword(''); setNewGroupIds(new Set());
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (userId: string) => permissionsApi.forceLogout(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', selectedUser?.id] });
      toast.success(t('settings.users.toastSessionEnded'));
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  // ---- Derived data ----
  const users = usersData?.content ?? [];

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (activeTab === 'ACTIVE') {
      filtered = filtered.filter((u) => u.enabled);
    } else if (activeTab === 'BLOCKED') {
      filtered = filtered.filter((u) => !u.enabled);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(lower) ||
          (u.email ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [users, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => u.enabled).length,
    blocked: users.filter((u) => !u.enabled).length,
  }), [users]);

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(() => [
    {
      id: 'name',
      header: t('settings.users.columnUser'),
      size: 240,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {getInitials(row.original.firstName, row.original.lastName)}
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.fullName || `${row.original.firstName ?? ''} ${row.original.lastName ?? ''}`.trim() || row.original.email}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: t('settings.users.columnRole'),
      size: 140,
      cell: ({ row }) => {
        const role = getPrimaryRole(row.original);
        return <span className="text-neutral-600 dark:text-neutral-400">{roleLabels[role] ?? role}</span>;
      },
    },
    {
      id: 'status',
      header: t('settings.users.columnStatus'),
      size: 130,
      cell: ({ row }) => {
        const status = getUserStatus(row.original);
        return (
          <StatusBadge status={status} colorMap={userStatusColorMap} label={userStatusLabels[status]} />
        );
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: t('settings.users.columnLastLogin'),
      size: 160,
      cell: ({ row }) => {
        const v = row.original.lastLoginAt;
        return v ? (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">{formatRelativeTime(v)}</span>
        ) : (
          <span className="text-sm text-neutral-400">{t('settings.users.neverLoggedIn')}</span>
        );
      },
    },
  ], []);

  // ---- Handlers ----

  const handleRowClick = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setDetailTab('profile');
  }, []);

  const handleBlockUnblock = useCallback(() => {
    if (!selectedUser) return;
    if (selectedUser.enabled) {
      blockUserMutation.mutate(selectedUser.id);
    } else {
      unblockUserMutation.mutate(selectedUser.id);
    }
  }, [selectedUser, blockUserMutation, unblockUserMutation]);

  const handleResetPassword = useCallback(() => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate(selectedUser.id);
  }, [selectedUser, resetPasswordMutation]);

  const handleForceLogout = useCallback(() => {
    if (!selectedUser) return;
    forceLogoutMutation.mutate(selectedUser.id);
  }, [selectedUser, forceLogoutMutation]);

  const handleSaveProfile = useCallback(() => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      userId: selectedUser.id,
      data: {
        firstName: profileFirstName,
        lastName: profileLastName,
        email: profileEmail,
        roles: [profileRole],
      },
    });
  }, [selectedUser, profileFirstName, profileLastName, profileEmail, profileRole, updateUserMutation]);

  const handleToggleGroup = useCallback((groupId: string, checked: boolean) => {
    setCheckedGroupIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });
  }, []);

  const handleSaveGroups = useCallback(async () => {
    if (!selectedUser) return;
    try {
      // Determine which groups were added and removed
      const added = [...checkedGroupIds].filter((id) => !originalGroupIds.has(id));
      const removed = [...originalGroupIds].filter((id) => !checkedGroupIds.has(id));

      const promises: Promise<void>[] = [];
      for (const groupId of added) {
        promises.push(permissionsApi.assignUserToGroup(selectedUser.id, groupId));
      }
      for (const groupId of removed) {
        promises.push(permissionsApi.removeUserFromGroup(selectedUser.id, groupId));
      }

      await Promise.all(promises);

      // Update originalGroupIds to reflect saved state
      setOriginalGroupIds(new Set(checkedGroupIds));
      queryClient.invalidateQueries({ queryKey: ['user-groups', selectedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('settings.users.toastGroupsSaved'));
    } catch {
      toast.error(t('errors.serverErrorRetry'));
    }
  }, [selectedUser, checkedGroupIds, originalGroupIds, queryClient]);

  const handleEndSession = useCallback((userId: string) => {
    endSessionMutation.mutate(userId);
  }, [endSessionMutation]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('settings.users.title')}
        subtitle={t('settings.users.subtitle', { count: users.length })}
        breadcrumbs={[
          { label: t('settings.users.breadcrumbHome'), href: '/' },
          { label: t('settings.users.breadcrumbAdmin') },
          { label: t('settings.users.breadcrumbUsers') },
        ]}
        actions={
          <Button iconLeft={<UserPlus size={16} />} onClick={() => setShowCreateModal(true)}>
            {t('settings.users.btnCreateUser')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('settings.users.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('settings.users.tabActive'), count: tabCounts.active },
          { id: 'BLOCKED', label: t('settings.users.tabBlocked'), count: tabCounts.blocked },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('settings.users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<AdminUser>
        data={filteredUsers}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('settings.users.emptyTitle')}
        emptyDescription={t('settings.users.emptyDescription')}
      />

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-neutral-950/30 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative ml-auto w-full max-w-xl bg-white dark:bg-neutral-900 shadow-2xl animate-slide-up overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 z-10 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedUser.fullName || `${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''}`.trim() || selectedUser.email}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                  <X size={18} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                {selectedUser.enabled ? (
                  <Button
                    size="xs"
                    variant="danger"
                    iconLeft={<Ban size={13} />}
                    onClick={handleBlockUnblock}
                    disabled={blockUserMutation.isPending}
                  >
                    {t('settings.users.btnBlock')}
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="success"
                    iconLeft={<Unlock size={13} />}
                    onClick={handleBlockUnblock}
                    disabled={unblockUserMutation.isPending}
                  >
                    {t('settings.users.btnUnblock')}
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="secondary"
                  iconLeft={<Key size={13} />}
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {t('settings.users.btnResetPassword')}
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  iconLeft={<LogOut size={13} />}
                  onClick={handleForceLogout}
                  disabled={forceLogoutMutation.isPending}
                >
                  {t('settings.users.btnForceLogout')}
                </Button>
              </div>

              {/* Detail tabs */}
              <div className="flex gap-0 mt-3 -mb-px border-b border-neutral-200 dark:border-neutral-700">
                {([
                  { id: 'profile' as const, label: t('settings.users.detailProfile') },
                  { id: 'groups' as const, label: t('settings.users.detailGroups') },
                  { id: 'activity' as const, label: t('settings.users.detailActivity') },
                  { id: 'sessions' as const, label: t('settings.users.detailSessions') },
                ] as { id: DetailTab; label: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={cn(
                      'relative px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
                      detailTab === tab.id
                        ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 after:rounded-t'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {detailTab === 'profile' && (
                <div className="space-y-4 max-w-md">
                  <FormField label={t('settings.users.fieldFirstName')}>
                    <Input
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                    />
                  </FormField>
                  <FormField label={t('settings.users.fieldLastName')}>
                    <Input
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                    />
                  </FormField>
                  <FormField label={t('settings.users.fieldEmail')}>
                    <Input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </FormField>
                  <FormField label={t('settings.users.fieldRole')}>
                    <Select
                      options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))}
                      value={profileRole}
                      onChange={(e) => setProfileRole(e.target.value)}
                    />
                  </FormField>
                  <FormField label={t('settings.users.fieldStatus')}>
                    <div className="mt-1">
                      <StatusBadge
                        status={getUserStatus(selectedUser)}
                        colorMap={userStatusColorMap}
                        label={userStatusLabels[getUserStatus(selectedUser)]}
                      />
                    </div>
                  </FormField>
                  <div className="pt-4">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={updateUserMutation.isPending}
                    >
                      {t('settings.users.btnSave')}
                    </Button>
                  </div>
                </div>
              )}

              {detailTab === 'groups' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('settings.users.groupsInstruction')}</p>
                  <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-800">
                    {groupsData.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-neutral-400">{t('settings.permissions.noGroups')}</p>
                    ) : (
                      groupsData.map((group) => (
                        <label key={group.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                          <Checkbox
                            checked={checkedGroupIds.has(group.id)}
                            onChange={(e) => handleToggleGroup(group.id, e.target.checked)}
                          />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{group.displayName || group.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveGroups}
                  >
                    {t('settings.users.btnSaveGroups')}
                  </Button>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-0">
                  {activityData.length === 0 && (
                    <p className="text-sm text-neutral-400 py-4">{t('settings.users.noActivity')}</p>
                  )}
                  {activityData.map((entry) => (
                    <div key={entry.id} className="flex gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div className="mt-0.5">
                        <Activity size={14} className="text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 dark:text-neutral-100">{entry.action}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{entry.details}</p>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">{formatRelativeTime(entry.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'sessions' && (
                <div className="space-y-3">
                  {sessionsData.length === 0 && (
                    <p className="text-sm text-neutral-400 py-4">{t('settings.users.noSessions')}</p>
                  )}
                  {sessionsData.map((session) => (
                    <div key={session.id} className={cn(
                      'border rounded-lg p-3',
                      session.isCurrent ? 'border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-950/30' : 'border-neutral-200 dark:border-neutral-700',
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Monitor size={14} className="text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{session.userAgent}</span>
                          {session.isCurrent && (
                            <span className="text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded">{t('settings.users.currentSession')}</span>
                          )}
                        </div>
                        {!session.isCurrent && (
                          <Button
                            size="xs"
                            variant="ghost"
                            iconLeft={<LogOut size={12} />}
                            onClick={() => handleEndSession(selectedUser.id)}
                            disabled={endSessionMutation.isPending}
                          >
                            {t('settings.users.btnEndSession')}
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{t('settings.users.sessionIP')}: {session.ipAddress}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {t('settings.users.sessionStarted')}: {formatDateTime(session.startedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('settings.users.createTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>{t('settings.users.createCancel')}</Button>
            <Button
              onClick={() => createUserMutation.mutate({ email: newEmail, firstName: newFirstName, lastName: newLastName, role: newRole, password: newPassword, groups: [...newGroupIds] })}
              disabled={createUserMutation.isPending || !newEmail || !newFirstName || !newLastName || !newPassword}
            >
              {createUserMutation.isPending ? t('common.saving') : t('settings.users.createSubmit')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('settings.users.fieldFirstName')} required>
            <Input placeholder={t('settings.users.fieldFirstName')} value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
          </FormField>
          <FormField label={t('settings.users.fieldLastName')} required>
            <Input placeholder={t('settings.users.fieldLastName')} value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
          </FormField>
          <FormField label={t('settings.users.fieldEmail')} required className="sm:col-span-2">
            <Input type="email" placeholder="user@company.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </FormField>
          <FormField label={t('settings.users.fieldRole')} required>
            <Select
              options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
          </FormField>
          <FormField label={t('settings.users.fieldPassword')} required>
            <Input type="password" placeholder={t('settings.users.fieldPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </FormField>
          <FormField label={t('settings.users.fieldAccessGroups')} className="sm:col-span-2">
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-800 max-h-40 overflow-y-auto">
              {groupsData.map((group) => (
                <label key={group.id} className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                  <Checkbox
                    checked={newGroupIds.has(group.id)}
                    onChange={(e) => {
                      setNewGroupIds((prev) => {
                        const next = new Set(prev);
                        e.target.checked ? next.add(group.id) : next.delete(group.id);
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{group.displayName || group.name}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default UsersAdminPage;
