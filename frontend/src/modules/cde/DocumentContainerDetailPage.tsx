import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightCircle,
  Clock,
  FileText,
  History,
  Link2,
  User,
  Tag,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cdeApi } from '@/api/cde';
import { formatDate, formatDateLong } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { DocumentContainer, DocumentRevision, LifecycleState } from './types';

const lifecycleStateColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  WIP: 'yellow',
  SHARED: 'blue',
  PUBLISHED: 'green',
  ARCHIVED: 'gray',
};

const getLifecycleStateLabels = (): Record<string, string> => ({
  WIP: t('cde.lifecycleWIP'),
  SHARED: t('cde.lifecycleShared'),
  PUBLISHED: t('cde.lifecyclePublished'),
  ARCHIVED: t('cde.lifecycleArchived'),
});

const getClassificationLabels = (): Record<string, string> => ({
  PROJECT: t('cde.classificationProject'),
  DESIGN: t('cde.classificationDesign'),
  CONSTRUCTION: t('cde.classificationConstruction'),
  OPERATIONS: t('cde.classificationOperations'),
  SAFETY: t('cde.classificationSafety'),
  QUALITY: t('cde.classificationQuality'),
  FINANCIAL: t('cde.classificationFinancial'),
});

const getDisciplineLabels = (): Record<string, string> => ({
  ARCHITECTURE: t('cde.disciplineArchitecture'),
  STRUCTURAL: t('cde.disciplineStructural'),
  MEP: t('cde.disciplineMEP'),
  CIVIL: t('cde.disciplineCivil'),
  ELECTRICAL: t('cde.disciplineElectrical'),
  PLUMBING: t('cde.disciplinePlumbing'),
  FIRE_PROTECTION: t('cde.disciplineFireProtection'),
  GENERAL: t('cde.disciplineGeneral'),
});

const stateTransitions: Record<LifecycleState, LifecycleState | null> = {
  WIP: 'SHARED',
  SHARED: 'PUBLISHED',
  PUBLISHED: 'ARCHIVED',
  ARCHIVED: null,
};
type DetailTab = 'overview' | 'revisions' | 'transmittals' | 'metadata';

const DocumentContainerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: doc } = useQuery<DocumentContainer>({
    queryKey: ['cde-document', id],
    queryFn: () => cdeApi.getContainer(id!),
    enabled: !!id,
  });

  const defaultDoc: DocumentContainer = {
    id: id ?? '',
    documentNumber: '',
    title: '',
    classification: 'PROJECT',
    lifecycleState: 'WIP',
    discipline: 'GENERAL',
    currentRevision: '',
    revisionCount: 0,
    projectId: '',
    projectName: '',
    authorName: '',
    createdAt: '',
    updatedAt: '',
  };

  const d = doc ?? defaultDoc;
  const nextState = stateTransitions[d.lifecycleState];
  const lifecycleStateLabels = getLifecycleStateLabels();
  const classificationLabels = getClassificationLabels();
  const disciplineLabels = getDisciplineLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={d.title}
        subtitle={`${d.documentNumber} / ${t('cde.documentDetail.subtitleRevision')} ${d.currentRevision}`}
        backTo="/cde/documents"
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE'), href: '/cde/documents' },
          { label: d.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={d.lifecycleState}
              colorMap={lifecycleStateColorMap}
              label={lifecycleStateLabels[d.lifecycleState]}
              size="md"
            />
            {nextState && (
              <Button
                size="sm"
                iconLeft={<ArrowRightCircle size={14} />}
                onClick={() => toast(t('common.operationStarted'))}
              >
                {lifecycleStateLabels[nextState]}
              </Button>
            )}
          </div>
        }
        tabs={[
          { id: 'overview', label: t('cde.documentDetail.tabOverview') },
          { id: 'revisions', label: t('cde.documentDetail.tabRevisions'), count: d.revisionCount },
          { id: 'transmittals', label: t('cde.documentDetail.tabTransmittals') },
          { id: 'metadata', label: t('cde.documentDetail.tabMetadata') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<History size={18} />} label={t('cde.documentDetail.metricRevisions')} value={d.revisionCount} />
            <MetricCard icon={<Layers size={18} />} label={t('cde.documentDetail.metricCurrentRevision')} value={d.currentRevision} />
            <MetricCard icon={<User size={18} />} label={t('cde.documentDetail.metricAuthor')} value={d.authorName} />
            <MetricCard icon={<Clock size={18} />} label={t('cde.documentDetail.metricUpdated')} value={formatDate(d.updatedAt)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('cde.documentDetail.sectionDocInfo')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                <InfoItem icon={<FileText size={15} />} label={t('cde.documentDetail.labelDocNumber')} value={d.documentNumber} />
                <InfoItem icon={<Tag size={15} />} label={t('cde.documentDetail.labelClassification')} value={classificationLabels[d.classification] ?? d.classification} />
                <InfoItem icon={<Layers size={15} />} label={t('cde.documentDetail.labelDiscipline')} value={disciplineLabels[d.discipline] ?? d.discipline} />
                <InfoItem icon={<User size={15} />} label={t('cde.documentDetail.labelAuthor')} value={d.authorName} />
                <InfoItem icon={<Clock size={15} />} label={t('cde.documentDetail.labelCreatedAt')} value={formatDateLong(d.createdAt)} />
                <InfoItem icon={<Clock size={15} />} label={t('cde.documentDetail.labelUpdatedAt')} value={formatDateLong(d.updatedAt)} />
              </div>
            </div>

            {/* State transition panel */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('cde.documentDetail.sectionLifecycle')}</h3>
              <div className="space-y-3">
                {(['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED'] as LifecycleState[]).map((state, idx) => {
                  const isCurrent = state === d.lifecycleState;
                  const isPassed = ['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED'].indexOf(state) < ['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED'].indexOf(d.lifecycleState);
                  return (
                    <div key={state} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                          isCurrent
                            ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                            : isPassed
                              ? 'bg-success-100 text-success-700'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400',
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-sm font-medium', isCurrent ? 'text-primary-700' : isPassed ? 'text-success-700' : 'text-neutral-400')}>
                          {lifecycleStateLabels[state]}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs text-primary-600 font-medium">{t('cde.documentDetail.lifecycleCurrent')}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {nextState && (
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <Button
                    fullWidth
                    iconLeft={<ArrowRightCircle size={16} />}
                  >
                    {t('cde.documentDetail.lifecycleTransition', { state: lifecycleStateLabels[nextState] })}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revisions' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('cde.documentDetail.sectionRevisionHistory')}</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" />
            <div className="space-y-6">
              {([] as any[]).map((rev, idx) => (
                <div key={rev.id} className="relative flex gap-4 pl-10">
                  <div
                    className={cn(
                      'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      idx === 0
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600',
                    )}
                  >
                    {idx === 0 && <div className="w-2 h-2 bg-white dark:bg-neutral-900 rounded-full" />}
                  </div>
                  <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">{rev.revisionCode}</span>
                        <StatusBadge
                          status={rev.lifecycleState}
                          colorMap={lifecycleStateColorMap}
                          label={lifecycleStateLabels[rev.lifecycleState]}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{formatDate(rev.createdAt)}</span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{rev.description}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{rev.authorName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transmittals' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('cde.documentDetail.sectionRelatedTransmittals')}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.documentDetail.relatedColNumber')}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.documentDetail.relatedColSubject')}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.documentDetail.relatedColStatus')}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.documentDetail.relatedColDate')}</th>
              </tr>
            </thead>
            <tbody>
              {([] as any[]).map((t, idx) => (
                <tr key={t.id} className={cn('border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800', idx % 2 === 1 && 'bg-neutral-25')}>
                  <td className="px-5 py-3 text-sm font-mono text-neutral-500 dark:text-neutral-400">{t.number}</td>
                  <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300">{t.subject}</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={t.status}
                      colorMap={{ DRAFT: 'gray', ISSUED: 'blue', ACKNOWLEDGED: 'yellow', RESPONDED: 'green', CLOSED: 'gray' }}
                      label={t.status}
                    />
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">{formatDate(t.issuedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('cde.documentDetail.sectionMetadata')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <MetaItem label={t('cde.documentDetail.metaDocId')} value={d.id} />
            <MetaItem label={t('cde.documentDetail.metaNumber')} value={d.documentNumber} />
            <MetaItem label={t('cde.documentDetail.metaProject')} value={d.projectName ?? '---'} />
            <MetaItem label={t('cde.documentDetail.metaClassification')} value={classificationLabels[d.classification] ?? d.classification} />
            <MetaItem label={t('cde.documentDetail.metaDiscipline')} value={disciplineLabels[d.discipline] ?? d.discipline} />
            <MetaItem label={t('cde.documentDetail.metaFileType')} value={d.fileType ?? '---'} />
            <MetaItem label={t('cde.documentDetail.metaFileSize')} value={d.fileSize ? `${(d.fileSize / 1_000_000).toFixed(1)} ${t('cde.documentDetail.metaFileSizeMB')}` : '---'} />
            <MetaItem label={t('cde.documentDetail.metaRevisionCount')} value={String(d.revisionCount)} />
            <MetaItem label={t('cde.documentDetail.metaCreatedAt')} value={formatDateLong(d.createdAt)} />
            <MetaItem label={t('cde.documentDetail.metaUpdatedAt')} value={formatDateLong(d.updatedAt)} />
          </div>
        </div>
      )}
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

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="py-2 border-b border-neutral-100">
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-mono">{value}</p>
  </div>
);

export default DocumentContainerDetailPage;
