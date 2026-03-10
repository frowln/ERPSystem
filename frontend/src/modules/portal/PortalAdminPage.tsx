import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Plus,
  Users,
  Shield,
  UserCheck,
  UserX,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { portalApi } from '@/api/portal';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import type { PortalUser, PortalAccess, PortalRole, PortalAccessLevel } from './types';
import toast from 'react-hot-toast';

const userStatusColorMap: Record<string, 'green' | 'blue' | 'yellow' | 'gray' | 'red'> = {
  active: 'green', invited: 'blue', suspended: 'yellow', deactivated: 'gray',
};
const getUserStatusLabels = (): Record<string, string> => ({
  active: t('portal.admin.userStatusActive'), invited: t('portal.admin.userStatusInvited'), suspended: t('portal.admin.userStatusSuspended'), deactivated: t('portal.admin.userStatusDeactivated'),
});
const getRoleLabels = (): Record<string, string> => ({
  client: t('portal.admin.roleClient'), contractor: t('portal.admin.roleContractor'), subcontractor: t('portal.admin.roleSubcontractor'), consultant: t('portal.admin.roleConsultant'),
});
const getAccessLabels = (): Record<string, string> => ({
  view: t('portal.admin.accessView'), comment: t('portal.admin.accessComment'), upload: t('portal.admin.accessUpload'), full: t('portal.admin.accessFull'),
});

type TabId = 'users' | 'ACCESS';

const PortalAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('client');
  const [newAccessLevel, setNewAccessLevel] = useState('VIEW');

  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ['portal-admin-users'],
    queryFn: () => portalApi.getUsers(),
  });

  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['portal-admin-access'],
    queryFn: () => portalApi.getAccessList(),
  });

  const createUserMutation = useMutation({
    mutationFn: () => portalApi.createUser({
      fullName: newName,
      email: newEmail,
      companyName: newCompany,
      role: newRole as PortalRole,
      accessLevel: newAccessLevel as PortalAccessLevel,
      projectIds: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-admin-users'] });
      toast.success(t('portal.admin.userCreated', { name: newName }));
      setCreateModalOpen(false);
      setNewName(''); setNewEmail(''); setNewCompany(''); setNewRole('client'); setNewAccessLevel('VIEW');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const revokeAccessMutation = useMutation({
    mutationFn: ({ userId, projectId }: { userId: string; projectId: string }) =>
      portalApi.revokeAccess(userId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-admin-access'] });
      toast.success(t('portal.admin.accessRevoked'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const users = userData?.content ?? [];
  const accessList = accessData?.content ?? [];

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const lower = search.toLowerCase();
    return users.filter(
      (u) => u.fullName.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower) || u.companyName.toLowerCase().includes(lower),
    );
  }, [users, search]);

  const filteredAccess = useMemo(() => {
    if (!search) return accessList;
    const lower = search.toLowerCase();
    return accessList.filter(
      (a) => a.userName.toLowerCase().includes(lower) || a.projectName.toLowerCase().includes(lower) || a.companyName.toLowerCase().includes(lower),
    );
  }, [accessList, search]);

  const metrics = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
    invitedUsers: users.filter((u) => u.status === 'INVITED').length,
    totalAccess: accessList.length,
  }), [users, accessList]);

  const userColumns = useMemo<ColumnDef<PortalUser, unknown>[]>(() => {
    const userStatusLabels = getUserStatusLabels();
    const roleLabels = getRoleLabels();
    const accessLabels = getAccessLabels();
    return [
    {
      accessorKey: 'fullName', header: t('portal.admin.colName'), size: 200,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.fullName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.email}</p>
        </div>
      ),
    },
    { accessorKey: 'companyName', header: t('portal.admin.colOrganization'), size: 180, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    {
      accessorKey: 'role', header: t('portal.admin.colRole'), size: 130,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{roleLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'status', header: t('portal.admin.colStatus'), size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={userStatusColorMap} label={userStatusLabels[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'accessLevel', header: t('portal.admin.colAccess'), size: 120,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{accessLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'lastLoginAt', header: t('portal.admin.colLastLogin'), size: 150,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>() ? formatRelativeTime(getValue<string>()) : t('portal.admin.neverLoggedIn')}</span>,
    },
    { accessorKey: 'createdAt', header: t('portal.admin.colCreated'), size: 110, cell: ({ getValue }) => <span className="text-neutral-600 tabular-nums">{formatDate(getValue<string>())}</span> },
  ];
  }, []);

  const accessColumns = useMemo<ColumnDef<PortalAccess, unknown>[]>(() => {
    const accessLabels = getAccessLabels();
    return [
    {
      accessorKey: 'userName', header: t('portal.admin.colUser'), size: 180,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.userName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.userEmail}</p>
        </div>
      ),
    },
    { accessorKey: 'companyName', header: t('portal.admin.colOrganization'), size: 170, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    { accessorKey: 'projectName', header: t('portal.admin.colProject'), size: 200, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    {
      accessorKey: 'accessLevel', header: t('portal.admin.colAccessLevel'), size: 140,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{accessLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    { accessorKey: 'grantedByName', header: t('portal.admin.colGrantedBy'), size: 140, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    { accessorKey: 'grantedAt', header: t('portal.admin.colDate'), size: 110, cell: ({ getValue }) => <span className="text-neutral-600 tabular-nums">{formatDate(getValue<string>())}</span> },
    {
      id: 'actions', header: '', size: 90,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => revokeAccessMutation.mutate({
            userId: row.original.userId,
            projectId: row.original.projectId,
          })}
          disabled={revokeAccessMutation.isPending}
        >
          {t('portal.admin.revokeAccess')}
        </Button>
      ),
    },
  ];
  }, [revokeAccessMutation]);

  const handleCreateUser = () => {
    createUserMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.admin.title')}
        subtitle={t('portal.admin.subtitle')}
        breadcrumbs={[
          { label: t('portal.admin.breadcrumbHome'), href: '/' },
          { label: t('portal.admin.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.admin.breadcrumbAdmin') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            {t('portal.admin.addUser')}
          </Button>
        }
        tabs={[
          { id: 'users', label: t('portal.admin.tabUsers'), count: users.length },
          { id: 'ACCESS', label: t('portal.admin.tabAccess'), count: accessList.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('portal.admin.metricTotalUsers')} value={metrics.totalUsers} />
        <MetricCard icon={<UserCheck size={18} />} label={t('portal.admin.metricActive')} value={metrics.activeUsers} />
        <MetricCard icon={<UserX size={18} />} label={t('portal.admin.metricInvited')} value={metrics.invitedUsers} trend={metrics.invitedUsers > 0 ? { direction: 'neutral', value: t('portal.admin.trendAwaiting') } : undefined} />
        <MetricCard icon={<Shield size={18} />} label={t('portal.admin.metricAccessGrants')} value={metrics.totalAccess} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('portal.admin.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {activeTab === 'users' ? (
        <DataTable<PortalUser>
          data={filteredUsers}
          columns={userColumns}
          loading={usersLoading}
          enableRowSelection
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('portal.admin.usersEmptyTitle')}
          emptyDescription={t('portal.admin.usersEmptyDescription')}
        />
      ) : (
        <DataTable<PortalAccess>
          data={filteredAccess}
          columns={accessColumns}
          loading={accessLoading}
          enableRowSelection
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('portal.admin.accessEmptyTitle')}
          emptyDescription={t('portal.admin.accessEmptyDescription')}
        />
      )}

      {/* Create user modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('portal.admin.createModalTitle')}
        description={t('portal.admin.createModalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>{t('portal.admin.cancelBtn')}</Button>
            <Button onClick={handleCreateUser} disabled={!newName || !newEmail || !newCompany || createUserMutation.isPending} loading={createUserMutation.isPending}>{t('portal.admin.createBtn')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('portal.admin.labelFullName')} required>
            <Input placeholder={t('portal.admin.placeholderFullName')} value={newName} onChange={(e) => setNewName(e.target.value)} />
          </FormField>
          <FormField label={t('portal.admin.labelEmailField')} required>
            <Input type="email" placeholder={t('portal.admin.placeholderEmail')} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </FormField>
          <FormField label={t('portal.admin.labelOrganization')} required>
            <Input placeholder={t('portal.admin.placeholderOrganization')} value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('portal.admin.labelRole')}>
              <Select options={Object.entries(getRoleLabels()).map(([v, l]) => ({ value: v, label: l }))} value={newRole} onChange={(e) => setNewRole(e.target.value)} />
            </FormField>
            <FormField label={t('portal.admin.labelAccessLevel')}>
              <Select options={Object.entries(getAccessLabels()).map(([v, l]) => ({ value: v, label: l }))} value={newAccessLevel} onChange={(e) => setNewAccessLevel(e.target.value)} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalAdminPage;
