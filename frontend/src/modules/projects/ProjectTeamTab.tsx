import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { projectsApi } from '@/api/projects';
import { permissionsApi } from '@/api/permissions';
import type { ProjectMember } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  members: ProjectMember[];
  projectId: string;
}

const TEAM_ROLES = [
  { value: 'MANAGER', label: () => t('projects.teamTab.roleManager') },
  { value: 'ENGINEER', label: () => t('projects.teamTab.roleEngineer') },
  { value: 'FOREMAN', label: () => t('projects.teamTab.roleForeman') },
  { value: 'ACCOUNTANT', label: () => t('projects.teamTab.roleAccountant') },
  { value: 'SUPPLY_MANAGER', label: () => t('projects.teamTab.roleSupplyManager') },
  { value: 'SAFETY_OFFICER', label: () => t('projects.teamTab.roleSafetyOfficer') },
  { value: 'QC_INSPECTOR', label: () => t('projects.teamTab.roleQcInspector') },
];

export const ProjectTeamTab: React.FC<Props> = ({ members, projectId }) => {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('ENGINEER');

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => permissionsApi.getUsers({ search: userSearch || undefined, size: 50 }),
    enabled: addModalOpen,
  });

  const userOptions = [
    { value: '', label: t('projects.teamTab.selectUser') },
    ...(usersData?.content ?? []).map((u) => ({
      value: u.id,
      label: u.fullName ?? `${u.firstName} ${u.lastName}`,
    })),
  ];

  const roleOptions = TEAM_ROLES.map((r) => ({ value: r.value, label: r.label() }));

  const addMemberMutation = useMutation({
    mutationFn: () => projectsApi.addMember(projectId, { userId: selectedUserId, role: selectedRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success(t('projects.teamTab.memberAdded'));
      setAddModalOpen(false);
      setSelectedUserId('');
      setSelectedRole('ENGINEER');
      setUserSearch('');
    },
    onError: () => toast.error(t('projects.teamTab.addError')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => projectsApi.removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success(t('projects.teamTab.memberRemoved'));
    },
    onError: () => toast.error(t('projects.teamTab.removeError')),
  });

  const handleAddSubmit = () => {
    if (!selectedUserId) return;
    addMemberMutation.mutate();
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('projects.teamTab.title')}</h3>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<UserPlus size={14} />}
            onClick={() => setAddModalOpen(true)}
          >
            {t('projects.teamTab.addMember')}
          </Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerMember')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerRole')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerEmail')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerJoinedDate')}</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerActions')}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr
                key={member.id}
                className={cn('border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800', idx % 2 === 1 && 'bg-neutral-25')}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {(member.userName ?? '').split(' ').slice(0, 2).map((n) => n?.[0] ?? '').join('')}
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{member.userName ?? t('common.unknown')}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {TEAM_ROLES.find(r => r.value === member.role)?.label() ?? member.role}
                </td>
                <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400">{member.userEmail}</td>
                <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">{formatDate(member.joinedAt)}</td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    loading={removeMemberMutation.isPending}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('projects.teamTab.addMemberTitle')}
        description={t('projects.teamTab.addMemberDescription')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddSubmit}
              loading={addMemberMutation.isPending}
              disabled={!selectedUserId}
            >
              {t('projects.teamTab.addMember')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('projects.teamTab.searchUser')}>
            <Input
              placeholder={t('projects.teamTab.searchUserPlaceholder')}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </FormField>
          <FormField label={t('projects.teamTab.selectUserLabel')}>
            <Select
              options={userOptions}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </FormField>
          <FormField label={t('projects.teamTab.selectRole')}>
            <Select
              options={roleOptions}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
};
