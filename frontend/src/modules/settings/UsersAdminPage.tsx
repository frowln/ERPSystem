import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search, UserPlus, Ban, Unlock, Key, LogOut, X,
  Clock, Monitor, Activity,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import { permissionsApi, type AdminUser } from '@/api/permissions';
import type { PaginatedResponse } from '@/types';

const allGroups = ['Администраторы', 'Руководители проектов', 'Старшие руководители', 'Инженеры', 'Главные инженеры', 'Инженеры ПТО', 'Бухгалтерия', 'Снабженцы', 'Наблюдатели'];

const userStatusColorMap: Record<string, 'green' | 'red' | 'yellow'> = { active: 'green', blocked: 'red', pending: 'yellow' };
const userStatusLabels: Record<string, string> = { active: t('settings.users.statusActive'), blocked: t('settings.users.statusBlocked'), pending: t('settings.users.statusPending') };
const roleLabels: Record<string, string> = { ADMIN: t('settings.users.roleAdmin'), MANAGER: t('settings.users.roleManager'), ENGINEER: t('settings.users.roleEngineer'), ACCOUNTANT: t('settings.users.roleAccountant'), VIEWER: t('settings.users.roleViewer') };

type TabId = 'all' | 'ACTIVE' | 'BLOCKED' | 'PENDING';
type DetailTab = 'profile' | 'groups' | 'activity' | 'sessions';

const UsersAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('profile');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: usersData, isLoading } = useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers(),
  });

  const users = usersData?.content ?? [];

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (activeTab !== 'all') {
      filtered = filtered.filter((u) => u.status === activeTab);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [users, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => u.status === 'ACTIVE').length,
    blocked: users.filter((u) => u.status === 'BLOCKED').length,
    pending: users.filter((u) => u.status === 'PENDING').length,
  }), [users]);

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(() => [
    {
      id: 'name',
      header: t('settings.users.columnUser'),
      size: 240,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {row.original.firstName[0]}{row.original.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: t('settings.users.columnRole'),
      size: 140,
      cell: ({ getValue }) => <span className="text-neutral-600">{roleLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      id: 'groups',
      header: t('settings.users.columnGroups'),
      size: 200,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.groupNames ?? row.original.groups ?? []).slice(0, 2).map((g) => (
            <span key={g} className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded">{g}</span>
          ))}
          {(row.original.groupNames ?? row.original.groups ?? []).length > 2 && (
            <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded">+{(row.original.groupNames ?? row.original.groups ?? []).length - 2}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('settings.users.columnStatus'),
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={userStatusColorMap} label={userStatusLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: t('settings.users.columnLastLogin'),
      size: 160,
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? (
          <span className="text-sm text-neutral-600">{formatRelativeTime(v)}</span>
        ) : (
          <span className="text-sm text-neutral-400">{t('settings.users.neverLoggedIn')}</span>
        );
      },
    },
  ], []);

  const handleRowClick = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setDetailTab('profile');
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('settings.users.title')}
        subtitle={`${users.length} ${t('settings.users.subtitle')}`}
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
          { id: 'PENDING', label: t('settings.users.tabPending'), count: tabCounts.pending },
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
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedUser.firstName} {selectedUser.lastName}
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
                {selectedUser.status === 'ACTIVE' ? (
                  <Button size="xs" variant="danger" iconLeft={<Ban size={13} />}>{t('settings.users.btnBlock')}</Button>
                ) : (
                  <Button size="xs" variant="success" iconLeft={<Unlock size={13} />}>{t('settings.users.btnUnblock')}</Button>
                )}
                <Button size="xs" variant="secondary" iconLeft={<Key size={13} />}>{t('settings.users.btnResetPassword')}</Button>
                <Button size="xs" variant="secondary" iconLeft={<LogOut size={13} />}>{t('settings.users.btnForceLogout')}</Button>
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
                    <Input defaultValue={selectedUser.firstName} />
                  </FormField>
                  <FormField label={t('settings.users.fieldLastName')}>
                    <Input defaultValue={selectedUser.lastName} />
                  </FormField>
                  <FormField label={t('settings.users.fieldEmail')}>
                    <Input type="email" defaultValue={selectedUser.email} />
                  </FormField>
                  <FormField label={t('settings.users.fieldRole')}>
                    <Select
                      options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))}
                      defaultValue={selectedUser.role}
                    />
                  </FormField>
                  <FormField label={t('settings.users.fieldStatus')}>
                    <div className="mt-1">
                      <StatusBadge status={selectedUser.status} colorMap={userStatusColorMap} label={userStatusLabels[selectedUser.status]} />
                    </div>
                  </FormField>
                  <div className="pt-4">
                    <Button size="sm">{t('settings.users.btnSave')}</Button>
                  </div>
                </div>
              )}

              {detailTab === 'groups' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('settings.users.groupsInstruction')}</p>
                  <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
                    {allGroups.map((group) => (
                      <label key={group} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                        <Checkbox defaultChecked={(selectedUser.groupNames ?? selectedUser.groups ?? []).includes(group)} />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{group}</span>
                      </label>
                    ))}
                  </div>
                  <Button size="sm">{t('settings.users.btnSaveGroups')}</Button>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-0">
                  {([] as any[]).map((entry) => (
                    <div key={entry.id} className="flex gap-3 py-3 border-b border-neutral-100 last:border-0">
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
                  {([] as any[]).map((session) => (
                    <div key={session.id} className={cn(
                      'border rounded-lg p-3',
                      session.isCurrent ? 'border-primary-200 bg-primary-50/30' : 'border-neutral-200 dark:border-neutral-700',
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Monitor size={14} className="text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{session.userAgent}</span>
                          {session.isCurrent && (
                            <span className="text-[10px] font-medium bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded">{t('settings.users.currentSession')}</span>
                          )}
                        </div>
                        {!session.isCurrent && (
                          <Button size="xs" variant="ghost" iconLeft={<LogOut size={12} />}>{t('settings.users.btnEndSession')}</Button>
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
            <Button onClick={() => setShowCreateModal(false)}>{t('settings.users.createSubmit')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('settings.users.fieldFirstName')} required>
            <Input placeholder={t('settings.users.fieldFirstName')} />
          </FormField>
          <FormField label={t('settings.users.fieldLastName')} required>
            <Input placeholder={t('settings.users.fieldLastName')} />
          </FormField>
          <FormField label={t('settings.users.fieldEmail')} required className="sm:col-span-2">
            <Input type="email" placeholder="user@company.ru" />
          </FormField>
          <FormField label={t('settings.users.fieldRole')} required>
            <Select
              options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))}
              placeholder={t('settings.users.fieldRole')}
            />
          </FormField>
          <FormField label={t('settings.users.fieldPassword')} required>
            <Input type="password" placeholder={t('settings.users.fieldPassword')} />
          </FormField>
          <FormField label={t('settings.users.fieldAccessGroups')} className="sm:col-span-2">
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 max-h-40 overflow-y-auto">
              {allGroups.map((group) => (
                <label key={group} className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                  <Checkbox />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{group}</span>
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
