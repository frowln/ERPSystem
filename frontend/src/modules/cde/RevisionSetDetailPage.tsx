import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, FolderOpen, Layers, Trash2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { AuditFooter } from '@/design-system/components/AuditFooter';
import { cdeApi } from '@/api/cde';
import { formatDateLong } from '@/lib/format';
import { t } from '@/i18n';
import type { RevisionSet } from './types';

const RevisionSetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: revisionSet } = useQuery<RevisionSet>({
    queryKey: ['revision-set', id],
    queryFn: () => cdeApi.getRevisionSet(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => cdeApi.deleteRevisionSet(id!),
    onSuccess: () => {
      toast.success(t('cde.revisionSetDetail.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['revision-sets'] });
      navigate('/cde/revision-sets');
    },
  });

  const defaultSet: RevisionSet = {
    id: id ?? '',
    name: '',
    revisionIds: [],
    revisionCount: 0,
    createdAt: '',
    updatedAt: '',
  };

  const rs = revisionSet ?? defaultSet;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={rs.name}
        subtitle={rs.description}
        backTo="/cde/revision-sets"
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE'), href: '/cde/documents' },
          { label: t('cde.revisionSetDetail.breadcrumbRevisionSets'), href: '/cde/revision-sets' },
          { label: rs.name },
        ]}
        actions={
          <Button
            variant="danger"
            size="sm"
            iconLeft={<Trash2 size={14} />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('cde.revisionSetDetail.deleteButton')}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Info Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('cde.revisionSetDetail.sectionInfo')}
            </h3>
            <div className="space-y-4">
              <InfoItem
                icon={<Calendar size={15} />}
                label={t('cde.revisionSetDetail.labelIssuedDate')}
                value={rs.issuedDate ? formatDateLong(rs.issuedDate) : t('cde.revisionSetDetail.notSet')}
              />
              <InfoItem
                icon={<User size={15} />}
                label={t('cde.revisionSetDetail.labelIssuedBy')}
                value={rs.issuedByName || t('cde.revisionSetDetail.notSet')}
              />
              <InfoItem
                icon={<FolderOpen size={15} />}
                label={t('cde.revisionSetDetail.labelProject')}
                value={rs.projectName || t('cde.revisionSetDetail.notSet')}
              />
              <InfoItem
                icon={<Layers size={15} />}
                label={t('cde.revisionSetDetail.labelRevisionCount')}
                value={String(rs.revisionCount)}
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            <MetricCard icon={<Layers size={18} />} label={t('cde.revisionSetDetail.labelRevisionCount')} value={rs.revisionCount} />
            <MetricCard icon={<Calendar size={18} />} label={t('cde.revisionSetDetail.labelIssuedDate')} value={rs.issuedDate ? formatDateLong(rs.issuedDate) : '---'} />
          </div>
        </div>

        {/* Revisions List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('cde.revisionSetDetail.sectionRevisions')}
            </h3>
          </div>
          {rs.revisionIds.length > 0 ? (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {rs.revisionIds.map((revId) => (
                <li key={revId} className="px-5 py-3 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <FileText size={15} className="text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('cde.revisionSetDetail.revisionId')}</p>
                    <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200">{revId}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('cde.revisionSetDetail.noRevisions')}</p>
            </div>
          )}
        </div>
      </div>

      <AuditFooter data={revisionSet} />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('cde.revisionSetDetail.deleteConfirmTitle')}
        description={t('cde.revisionSetDetail.deleteConfirmDescription', { name: rs.name })}
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default RevisionSetDetailPage;
