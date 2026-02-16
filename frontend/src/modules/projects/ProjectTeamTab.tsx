import React from 'react';
import { Button } from '@/design-system/components/Button';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ProjectMember } from '@/types';

interface Props {
  members: ProjectMember[];
}

export const ProjectTeamTab: React.FC<Props> = ({ members }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
    <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('projects.teamTab.title')}</h3>
      <Button variant="secondary" size="sm">{t('projects.teamTab.addMember')}</Button>
    </div>
    <table className="w-full">
      <thead>
        <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
          <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerMember')}</th>
          <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerRole')}</th>
          <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerEmail')}</th>
          <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.teamTab.headerJoinedDate')}</th>
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
                  {member.userName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{member.userName}</span>
              </div>
            </td>
            <td className="px-5 py-3 text-sm text-neutral-600">{member.role}</td>
            <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400">{member.userEmail}</td>
            <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">{formatDate(member.joinedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
