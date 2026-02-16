import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import type { PortalUser, PortalAccess } from './types';
import toast from 'react-hot-toast';

const userStatusColorMap: Record<string, 'green' | 'blue' | 'yellow' | 'gray' | 'red'> = {
  active: 'green', invited: 'blue', suspended: 'yellow', deactivated: 'gray',
};
const userStatusLabels: Record<string, string> = {
  active: 'Активен', invited: 'Приглашён', suspended: 'Приостановлен', deactivated: 'Деактивирован',
};
const roleLabels: Record<string, string> = {
  client: 'Заказчик', contractor: 'Подрядчик', subcontractor: 'Субподрядчик', consultant: 'Консультант',
};
const accessLabels: Record<string, string> = {
  view: 'Просмотр', comment: 'Комментирование', upload: 'Загрузка', full: 'Полный',
};

type TabId = 'users' | 'ACCESS';

const PortalAdminPage: React.FC = () => {
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

  const userColumns = useMemo<ColumnDef<PortalUser, unknown>[]>(() => [
    {
      accessorKey: 'fullName', header: 'Имя', size: 200,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.fullName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.email}</p>
        </div>
      ),
    },
    { accessorKey: 'companyName', header: 'Организация', size: 180, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    {
      accessorKey: 'role', header: 'Роль', size: 130,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{roleLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'status', header: 'Статус', size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={userStatusColorMap} label={userStatusLabels[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'accessLevel', header: 'Доступ', size: 120,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{accessLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'lastLoginAt', header: 'Последний вход', size: 150,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>() ? formatRelativeTime(getValue<string>()) : 'Не входил'}</span>,
    },
    { accessorKey: 'createdAt', header: 'Создан', size: 110, cell: ({ getValue }) => <span className="text-neutral-600 tabular-nums">{formatDate(getValue<string>())}</span> },
  ], []);

  const accessColumns = useMemo<ColumnDef<PortalAccess, unknown>[]>(() => [
    {
      accessorKey: 'userName', header: 'Пользователь', size: 180,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.userName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.userEmail}</p>
        </div>
      ),
    },
    { accessorKey: 'companyName', header: 'Организация', size: 170, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    { accessorKey: 'projectName', header: 'Проект', size: 200, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    {
      accessorKey: 'accessLevel', header: 'Уровень доступа', size: 140,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{accessLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    { accessorKey: 'grantedByName', header: 'Выдал', size: 140, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    { accessorKey: 'grantedAt', header: 'Дата', size: 110, cell: ({ getValue }) => <span className="text-neutral-600 tabular-nums">{formatDate(getValue<string>())}</span> },
    {
      id: 'actions', header: '', size: 90,
      cell: () => <Button variant="ghost" size="xs">Отозвать</Button>,
    },
  ], []);

  const handleCreateUser = () => {
    toast.success(`Пользователь портала создан: ${newName}`);
    setCreateModalOpen(false);
    setNewName(''); setNewEmail(''); setNewCompany(''); setNewRole('client'); setNewAccessLevel('VIEW');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Управление порталом"
        subtitle="Пользователи и уровни доступа"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Портал', href: '/portal' },
          { label: 'Управление' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            Добавить пользователя
          </Button>
        }
        tabs={[
          { id: 'users', label: 'Пользователи', count: users.length },
          { id: 'ACCESS', label: 'Доступ к проектам', count: accessList.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label="Всего пользователей" value={metrics.totalUsers} />
        <MetricCard icon={<UserCheck size={18} />} label="Активные" value={metrics.activeUsers} />
        <MetricCard icon={<UserX size={18} />} label="Приглашённые" value={metrics.invitedUsers} trend={metrics.invitedUsers > 0 ? { direction: 'neutral', value: 'Ожидают' } : undefined} />
        <MetricCard icon={<Shield size={18} />} label="Выдано доступов" value={metrics.totalAccess} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по имени, email, организации..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
          emptyTitle="Нет пользователей портала"
          emptyDescription="Добавьте первого пользователя для начала работы"
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
          emptyTitle="Нет выданных доступов"
          emptyDescription="Предоставьте доступ пользователям к проектам"
        />
      )}

      {/* Create user modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Новый пользователь портала"
        description="Добавьте внешнего пользователя для доступа к порталу"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateUser} disabled={!newName || !newEmail || !newCompany}>Создать</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="ФИО" required>
            <Input placeholder="Иванов Иван Иванович" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" placeholder="user@company.ru" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </FormField>
          <FormField label="Организация" required>
            <Input placeholder="ООО 'Компания'" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Роль">
              <Select options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))} value={newRole} onChange={(e) => setNewRole(e.target.value)} />
            </FormField>
            <FormField label="Уровень доступа">
              <Select options={Object.entries(accessLabels).map(([v, l]) => ({ value: v, label: l }))} value={newAccessLevel} onChange={(e) => setNewAccessLevel(e.target.value)} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalAdminPage;
