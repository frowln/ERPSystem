import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { apiClient } from '@/api/client';
import { t } from '@/i18n';
import { MapPin, Plus, CheckCircle, AlertTriangle, XCircle, ClipboardCheck } from 'lucide-react';

interface SiteAssessment {
  id: string;
  projectId: string;
  assessmentDate: string;
  assessorName: string;
  siteAddress: string;
  score: number;
  recommendation: string;
  status: string;
  createdAt: string;
}

function getRecConfig() {
  return {
    GO: { color: 'green', label: t('siteAssessment.recGoShort'), icon: <CheckCircle size={14} /> },
    CONDITIONAL: { color: 'yellow', label: t('siteAssessment.recConditionalShort'), icon: <AlertTriangle size={14} /> },
    NO_GO: { color: 'red', label: t('siteAssessment.recNoGoShort'), icon: <XCircle size={14} /> },
  } as Record<string, { color: string; label: string; icon: React.ReactNode }>;
}

const SiteAssessmentListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['site-assessments'],
    queryFn: async () => {
      const resp = await apiClient.get<any>('/site-assessments');
      const d = resp.data;
      return Array.isArray(d) ? d : d?.content ?? [];
    },
  });

  const assessments: SiteAssessment[] = data ?? [];
  const goCount = assessments.filter(a => a.recommendation === 'GO').length;
  const condCount = assessments.filter(a => a.recommendation === 'CONDITIONAL').length;
  const noGoCount = assessments.filter(a => a.recommendation === 'NO_GO').length;
  const recommendationConfig = getRecConfig();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('siteAssessment.listTitle')}
        subtitle={t('siteAssessment.listSubtitle', { count: String(assessments.length) })}
        breadcrumbs={[
          { label: t('siteAssessment.breadcrumbHome'), href: '/' },
          { label: t('siteAssessment.breadcrumbPreConstruction') },
          { label: t('siteAssessment.breadcrumbList') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/site-assessments/new')}>
            {t('siteAssessment.newAssessment')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('siteAssessment.kpiTotal')} value={assessments.length} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('siteAssessment.kpiGo')} value={goCount} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('siteAssessment.kpiConditional')} value={condCount} />
        <MetricCard icon={<XCircle size={18} />} label={t('siteAssessment.kpiNoGo')} value={noGoCount} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <MapPin size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('siteAssessment.emptyTitle')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            {t('siteAssessment.emptyDescription')}
          </p>
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/site-assessments/new')}>
            {t('siteAssessment.emptyAction')}
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
              <tr className="text-left text-sm text-neutral-500 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">{t('siteAssessment.colDate')}</th>
                <th className="px-4 py-3 font-medium">{t('siteAssessment.colAddress')}</th>
                <th className="px-4 py-3 font-medium">{t('siteAssessment.colInspector')}</th>
                <th className="px-4 py-3 font-medium text-center">{t('siteAssessment.colScoring')}</th>
                <th className="px-4 py-3 font-medium">{t('siteAssessment.colRecommendation')}</th>
                <th className="px-4 py-3 font-medium">{t('siteAssessment.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const rec = recommendationConfig[a.recommendation] ?? recommendationConfig.CONDITIONAL;
                return (
                  <tr
                    key={a.id}
                    className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/site-assessments/${a.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {new Date(a.assessmentDate).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                      {a.siteAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                      {a.assessorName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        (a.score ?? 0) >= 10 ? 'bg-success-100 text-success-700' :
                        (a.score ?? 0) >= 6 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {a.score ?? 0}/12
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        a.recommendation === 'GO' ? 'bg-success-100 text-success-700' :
                        a.recommendation === 'CONDITIONAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {rec.icon}
                        {rec.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={a.status}
                        colorMap={{ DRAFT: 'gray', COMPLETED: 'blue', APPROVED: 'green' }}
                        label={a.status === 'DRAFT' ? t('siteAssessment.statusDraft') : a.status === 'COMPLETED' ? t('siteAssessment.statusCompleted') : t('siteAssessment.statusApproved')}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SiteAssessmentListPage;
