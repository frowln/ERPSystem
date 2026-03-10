import React, { useState } from 'react';
import { X, Search, FolderKanban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { t } from '@/i18n';
import { projectsApi } from '@/api/projects';
import type { Project } from '@/types';

interface LinkProjectModalProps {
  onLink: (projectId: string) => void;
  onClose: () => void;
  excludeProjectIds?: string[];
}

export const LinkProjectModal: React.FC<LinkProjectModalProps> = ({
  onLink,
  onClose,
  excludeProjectIds = [],
}) => {
  const [search, setSearch] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects-for-link', search],
    queryFn: () => projectsApi.getProjects({ search: search || undefined, size: 20 }),
  });

  const projects = (projectsData?.content || []).filter(
    (p: Project) => !excludeProjectIds.includes(p.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('mail.linkProjectTitle')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('mail.linkProjectSearch')}
              className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              {t('mail.noProjectsFound')}
            </div>
          ) : (
            projects.map((project: Project) => (
              <button
                key={project.id}
                onClick={() => onLink(project.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 transition-colors text-left"
              >
                <FolderKanban size={18} className="text-primary-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {project.name}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {project.code}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
